/**
 * AI Email Conversation Handler
 * Handles email replies, builds rapport, moves leads toward booking
 */

const Anthropic = require('@anthropic-ai/sdk');
const { createClient } = require('@supabase/supabase-js');

class AIConversationHandler {
  constructor() {
    this.anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY
    });

    this.supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_KEY
    );
  }

  /**
   * Process incoming email reply
   */
  async handleReply(campaignId, replyText, replyMetadata = {}) {
    console.log(`📨 Processing reply for campaign ${campaignId}`);

    try {
      // Get campaign and conversation history
      const campaign = await this.getCampaignWithHistory(campaignId);

      // Classify the reply
      const classification = await this.classifyReply(replyText);

      // Generate appropriate response
      const response = await this.generateResponse(campaign, replyText, classification);

      // Store conversation
      await this.storeConversation(campaignId, replyText, response, classification);

      // Update campaign status
      await this.updateCampaignStatus(campaignId, classification);

      // If interested, trigger booking
      if (classification.intent === 'interested' || classification.intent === 'ready_to_book') {
        await this.triggerBooking(campaignId, response);
      }

      return {
        classification: classification,
        response: response,
        action: this.determineAction(classification)
      };

    } catch (error) {
      console.error('Error handling reply:', error);
      throw error;
    }
  }

  /**
   * Classify the reply intent
   */
  async classifyReply(replyText) {
    const prompt = `Classify this email reply into one of these categories:

EMAIL REPLY:
"${replyText}"

CATEGORIES:
1. INTERESTED - They want to learn more, positive, asking questions
2. READY_TO_BOOK - They want to schedule a call/meeting
3. NOT_INTERESTED - Not interested, no thanks, wrong fit
4. OBJECTION - Have concerns, questions, hesitations
5. OUT_OF_OFFICE - Automated OOO reply
6. UNSUBSCRIBE - Want to be removed
7. UNCLEAR - Need more info to classify

Also extract:
- Sentiment (positive/neutral/negative)
- Key questions they asked
- Objections or concerns mentioned
- Urgency level (high/medium/low)

Respond in JSON:
{
  "intent": "INTERESTED|READY_TO_BOOK|NOT_INTERESTED|OBJECTION|OUT_OF_OFFICE|UNSUBSCRIBE|UNCLEAR",
  "sentiment": "positive|neutral|negative",
  "questions": ["question 1", "question 2"],
  "objections": ["objection 1"],
  "urgency": "high|medium|low",
  "reasoning": "Why you classified it this way"
}`;

    const response = await this.askClaude(prompt);
    return response;
  }

  /**
   * Generate appropriate response
   */
  async generateResponse(campaign, replyText, classification) {
    // Don't respond to OOO or unsubscribe
    if (['OUT_OF_OFFICE', 'UNSUBSCRIBE'].includes(classification.intent)) {
      return null;
    }

    const research = campaign.lead_research || {};
    const originalMessage = campaign.email_content || '';

    const prompt = `You are responding to an email on behalf of Unbound.Team (represented by Maggie Forbes Strategies).

ORIGINAL EMAIL WE SENT:
${originalMessage}

THEIR REPLY:
"${replyText}"

CLASSIFICATION:
Intent: ${classification.intent}
Sentiment: ${classification.sentiment}
Questions: ${classification.questions?.join(', ') || 'None'}
Objections: ${classification.objections?.join(', ') || 'None'}

LEAD RESEARCH:
${JSON.stringify(research, null, 2)}

UNBOUND'S SERVICE:
We build autonomous client acquisition systems that discover, qualify, and convert leads automatically for businesses.

YOUR TASK:
Write a personalized, helpful reply that:

IF INTERESTED:
- Answer their questions directly
- Provide specific value (reference their situation)
- Build trust and rapport
- Suggest a brief call to discuss their specific needs
- Include calendar link: [CALENDAR_LINK]

IF OBJECTION:
- Acknowledge their concern genuinely
- Address the objection with specifics
- Provide social proof if relevant
- Keep door open for future conversation

IF NOT_INTERESTED:
- Respect their decision politely
- Leave door open ("if situation changes...")
- No hard sell

TONE:
- Professional but warm
- Helpful, not salesy
- Specific to their situation
- Concise (3-5 short paragraphs max)

IMPORTANT:
- Reference specific details from their business/situation
- Make it feel human, not templated
- Sign as "Maggie" (representing Unbound.Team)

Write the email response:`;

    const response = await this.askClaude(prompt);
    return response.emailText || response;
  }

  /**
   * Store conversation in database
   */
  async storeConversation(campaignId, incomingMessage, outgoingResponse, classification) {
    const { data, error } = await this.supabase
      .from('email_conversations')
      .insert({
        campaign_id: campaignId,
        direction: 'incoming',
        message_content: incomingMessage,
        classification: classification.intent,
        sentiment: classification.sentiment,
        questions: classification.questions,
        objections: classification.objections,
        received_at: new Date().toISOString()
      });

    if (outgoingResponse) {
      await this.supabase
        .from('email_conversations')
        .insert({
          campaign_id: campaignId,
          direction: 'outgoing',
          message_content: outgoingResponse,
          sent_at: new Date().toISOString()
        });
    }

    return { data, error };
  }

  /**
   * Update campaign status based on classification
   */
  async updateCampaignStatus(campaignId, classification) {
    let newStatus = 'replied';

    if (classification.intent === 'INTERESTED') {
      newStatus = 'interested';
    } else if (classification.intent === 'READY_TO_BOOK') {
      newStatus = 'booking';
    } else if (classification.intent === 'NOT_INTERESTED' || classification.intent === 'UNSUBSCRIBE') {
      newStatus = 'closed_lost';
    } else if (classification.intent === 'OBJECTION') {
      newStatus = 'nurturing';
    }

    const { data, error } = await this.supabase
      .from('outreach_campaigns')
      .update({
        status: newStatus,
        last_reply_at: new Date().toISOString(),
        sentiment: classification.sentiment
      })
      .eq('id', campaignId);

    return { data, error };
  }

  /**
   * Trigger booking flow
   */
  async triggerBooking(campaignId, responseText) {
    // Mark as ready for booking
    await this.supabase
      .from('outreach_campaigns')
      .update({
        status: 'booking',
        booking_triggered_at: new Date().toISOString()
      })
      .eq('id', campaignId);

    // Log booking trigger
    console.log(`📅 Booking triggered for campaign ${campaignId}`);

    return true;
  }

  /**
   * Get campaign with conversation history
   */
  async getCampaignWithHistory(campaignId) {
    const { data: campaign, error } = await this.supabase
      .from('outreach_campaigns')
      .select(`
        *,
        scored_opportunities(*),
        email_conversations(*)
      `)
      .eq('id', campaignId)
      .single();

    if (error) throw error;
    return campaign;
  }

  /**
   * Determine next action
   */
  determineAction(classification) {
    const actions = {
      'INTERESTED': 'send_response_and_monitor',
      'READY_TO_BOOK': 'send_calendar_link',
      'NOT_INTERESTED': 'mark_closed',
      'OBJECTION': 'send_response_and_nurture',
      'OUT_OF_OFFICE': 'wait_and_retry',
      'UNSUBSCRIBE': 'remove_from_list',
      'UNCLEAR': 'flag_for_human_review'
    };

    return actions[classification.intent] || 'flag_for_human_review';
  }

  /**
   * Helper: Ask Claude
   */
  async askClaude(prompt) {
    try {
      const response = await this.anthropic.messages.create({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 2048,
        messages: [{
          role: 'user',
          content: prompt
        }]
      });

      const content = response.content[0].text;

      // Try to parse JSON if present
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }

      // Otherwise return raw text
      return { emailText: content };

    } catch (error) {
      console.error('Claude API error:', error);
      throw error;
    }
  }

  /**
   * Batch process replies
   */
  async processAllReplies() {
    console.log('📬 Processing all pending replies...');

    // Get campaigns with unprocessed replies
    const { data: campaigns, error } = await this.supabase
      .from('outreach_campaigns')
      .select('*')
      .eq('replied_at', true)
      .eq('reply_processed', false)
      .limit(50);

    if (error) throw error;

    let processed = 0;
    for (const campaign of campaigns) {
      try {
        await this.handleReply(campaign.id, campaign.reply_text);

        // Mark as processed
        await this.supabase
          .from('outreach_campaigns')
          .update({ reply_processed: true })
          .eq('id', campaign.id);

        processed++;
      } catch (error) {
        console.error(`Error processing campaign ${campaign.id}:`, error);
      }
    }

    console.log(`✅ Processed ${processed} replies`);
    return processed;
  }
}

module.exports = AIConversationHandler;
