// Email Marketing System - AI-powered email campaign creation
// Generates complete email sequences, subject lines, and automation flows

const orchestrator = require('./ai-orchestrator');
const contentSafety = require('./content-safety');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

class EmailMarketer {
  constructor() {
    this.supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_KEY
    );

    // Email campaign types
    this.campaignTypes = {
      'welcome': { name: 'Welcome Series', emailCount: 3 },
      'nurture': { name: 'Nurture Campaign', emailCount: 5 },
      'sales': { name: 'Sales Sequence', emailCount: 5 },
      'onboarding': { name: 'Onboarding Series', emailCount: 4 },
      'reengagement': { name: 'Re-engagement Campaign', emailCount: 3 },
      'promotion': { name: 'Promotional Campaign', emailCount: 3 }
    };
  }

  /**
   * Create email campaign
   */
  async createCampaign(params) {
    const {
      campaignType,
      goal,
      audience,
      productService,
      tone,
      emailCount,
      userId
    } = params;

    console.log(`📧 Creating ${campaignType} campaign: ${goal}`);

    // Generate email sequence
    const emails = await this.generateEmailSequence({
      campaignType,
      goal,
      audience,
      productService,
      tone,
      emailCount: emailCount || this.campaignTypes[campaignType]?.emailCount || 5
    });

    // Generate automation flow
    const automation = await this.generateAutomationFlow(campaignType, emails.length);

    // Safety check all emails
    for (const email of emails) {
      const safetyCheck = await contentSafety.checkContent(
        `${email.subject} ${email.body}`,
        { type: 'email_campaign', userId, campaignType }
      );

      if (!safetyCheck.safe) {
        throw new Error(`Email ${email.number} failed safety check`);
      }
    }

    // Save campaign
    const saved = await this.saveCampaign(userId, {
      campaignType,
      goal,
      audience,
      productService,
      tone,
      emails,
      automation
    });

    console.log(`✅ Email campaign created: ${emails.length} emails`);

    return saved;
  }

  /**
   * Generate email sequence
   */
  async generateEmailSequence(params) {
    const { campaignType, goal, audience, productService, tone, emailCount } = params;

    const campaignStrategy = this.getCampaignStrategy(campaignType);

    const prompt = `Create a ${emailCount}-email ${campaignType} campaign:

Goal: ${goal}
Product/Service: ${productService}
Target Audience: ${audience}
Tone: ${tone}

Email Strategy:
${campaignStrategy}

For each email, provide:
1. Email number (1-${emailCount})
2. Purpose/Goal of this email
3. Subject line (under 50 chars, compelling)
4. Preview text (35-50 chars)
5. Email body (200-300 words, conversational)
6. Call-to-action (clear next step)
7. Send timing (e.g., "Day 1", "Day 3", "1 week after signup")

Requirements:
- Each email builds on the previous
- Progressive value delivery
- Specific, actionable content
- Natural, conversational ${tone} tone
- Strong but not pushy CTAs

Format as JSON array:
[
  {
    "number": 1,
    "purpose": "...",
    "subject": "...",
    "previewText": "...",
    "body": "...",
    "cta": "...",
    "timing": "..."
  },
  ...
]`;

    try {
      const response = await orchestrator.execute('content-generation', prompt);
      const jsonMatch = response.content.match(/\[[\s\S]*\]/);

      if (!jsonMatch) {
        throw new Error('Failed to parse email sequence');
      }

      return JSON.parse(jsonMatch[0]);

    } catch (error) {
      console.error('Email sequence generation failed:', error.message);
      throw error;
    }
  }

  /**
   * Get campaign strategy for different types
   */
  getCampaignStrategy(campaignType) {
    const strategies = {
      welcome: `Email 1: Welcome and set expectations
Email 2: Provide immediate value/quick win
Email 3: Introduce main product/service`,

      nurture: `Email 1: Address problem/pain point
Email 2: Educate on solutions
Email 3: Show social proof
Email 4: Address objections
Email 5: Soft pitch with value emphasis`,

      sales: `Email 1: Problem awareness
Email 2: Solution introduction
Email 3: Benefits and ROI
Email 4: Overcome objections
Email 5: Urgency and strong CTA`,

      onboarding: `Email 1: Welcome and first steps
Email 2: Feature walkthrough
Email 3: Best practices and tips
Email 4: Community and support resources`,

      reengagement: `Email 1: "We miss you" + value reminder
Email 2: What's new/improved
Email 3: Special offer to return`,

      promotion: `Email 1: Announce promotion
Email 2: Highlight benefits and urgency
Email 3: Last chance reminder`
    };

    return strategies[campaignType] || 'Create value-driven sequence';
  }

  /**
   * Generate automation flow
   */
  async generateAutomationFlow(campaignType, emailCount) {
    return {
      trigger: this.getTriggerForCampaignType(campaignType),
      emails: Array.from({ length: emailCount }, (_, i) => ({
        emailNumber: i + 1,
        delay: this.getDelayForEmail(campaignType, i),
        conditions: this.getConditionsForEmail(campaignType, i)
      }))
    };
  }

  /**
   * Get trigger event for campaign type
   */
  getTriggerForCampaignType(campaignType) {
    const triggers = {
      welcome: 'User signs up',
      nurture: 'User downloads lead magnet',
      sales: 'User views pricing page',
      onboarding: 'User completes signup',
      reengagement: 'User inactive for 30 days',
      promotion: 'Manual send or scheduled date'
    };

    return triggers[campaignType] || 'Manual trigger';
  }

  /**
   * Get delay between emails
   */
  getDelayForEmail(campaignType, emailIndex) {
    const delays = {
      welcome: [0, 1, 3], // Immediate, 1 day, 3 days
      nurture: [0, 2, 4, 7, 10], // Days
      sales: [0, 1, 3, 5, 7], // Days
      onboarding: [0, 1, 3, 7], // Days
      reengagement: [0, 3, 7], // Days
      promotion: [0, 2, 5] // Days
    };

    const campaignDelays = delays[campaignType] || [0, 2, 4, 7, 10];
    return campaignDelays[emailIndex] || emailIndex * 2;
  }

  /**
   * Get conditions for sending email
   */
  getConditionsForEmail(campaignType, emailIndex) {
    if (emailIndex === 0) return ['None'];

    return [
      'Previous email sent',
      'User has not unsubscribed',
      'User has not converted (optional)'
    ];
  }

  /**
   * Generate subject line variations
   */
  async generateSubjectLineVariations(baseSubject, count = 5) {
    const prompt = `Generate ${count} subject line variations for:

Base subject: "${baseSubject}"

Create variations that:
- Test different emotional triggers
- Test different lengths (short vs long)
- Test questions vs statements
- Keep under 50 characters
- Maintain core message

Format as JSON array:
[
  {"variation": "...", "type": "curiosity/urgency/benefit/question/social-proof"},
  ...
]`;

    try {
      const response = await orchestrator.execute('content-generation', prompt);
      const jsonMatch = response.content.match(/\[[\s\S]*\]/);

      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }

      return [{ variation: baseSubject, type: 'original' }];

    } catch (error) {
      console.error('Subject line variations failed:', error.message);
      return [{ variation: baseSubject, type: 'original' }];
    }
  }

  /**
   * Optimize send time
   */
  async optimizeSendTime(audience, industry) {
    const prompt = `Recommend optimal email send times for:

Audience: ${audience}
Industry: ${industry}

Provide:
1. Best day of week
2. Best time of day
3. Timezone considerations
4. Reasoning

Format as JSON:
{
  "bestDay": "...",
  "bestTime": "...",
  "timezone": "...",
  "reasoning": "..."
}`;

    try {
      const response = await orchestrator.execute('analysis', prompt);
      const jsonMatch = response.content.match(/\{[\s\S]*\}/);

      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }

      return {
        bestDay: 'Tuesday',
        bestTime: '10:00 AM',
        timezone: 'Recipient timezone',
        reasoning: 'Default recommendation'
      };

    } catch (error) {
      console.error('Send time optimization failed:', error.message);
      return null;
    }
  }

  /**
   * Save campaign to database
   */
  async saveCampaign(userId, campaignData) {
    const { data, error } = await this.supabase
      .from('email_campaigns')
      .insert({
        user_id: userId,
        campaign_type: campaignData.campaignType,
        goal: campaignData.goal,
        audience: campaignData.audience,
        email_count: campaignData.emails.length,
        status: 'completed',
        created_at: new Date().toISOString(),
        metadata: campaignData
      })
      .select()
      .single();

    if (error) {
      console.error('Failed to save campaign:', error);
      throw new Error('Failed to save email campaign');
    }

    return data;
  }

  /**
   * Get user's campaigns
   */
  async getUserCampaigns(userId) {
    const { data } = await this.supabase
      .from('email_campaigns')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    return data || [];
  }

  /**
   * Export campaign to CSV
   */
  exportToCSV(campaign) {
    const emails = campaign.metadata.emails;

    const csv = [
      ['Email #', 'Purpose', 'Subject', 'Preview Text', 'Send Timing', 'CTA'].join(','),
      ...emails.map(e => [
        e.number,
        `"${e.purpose}"`,
        `"${e.subject}"`,
        `"${e.previewText}"`,
        e.timing,
        `"${e.cta}"`
      ].join(','))
    ].join('\n');

    return csv;
  }

  /**
   * Get campaign analytics (placeholder for future)
   */
  async getCampaignAnalytics(campaignId) {
    return {
      totalSent: 0,
      openRate: 0,
      clickRate: 0,
      conversionRate: 0,
      unsubscribeRate: 0,
      message: 'Analytics available after campaign is sent'
    };
  }
}

module.exports = new EmailMarketer();
