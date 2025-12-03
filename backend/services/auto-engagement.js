// Auto-Engagement System - Genuinely helpful engagement with discovered opportunities
// NO SPAM - Only value-first, helpful responses

const orchestrator = require('./ai-orchestrator');
const contentSafety = require('./content-safety');

class AutoEngagement {
  constructor() {
    // Engagement rules - keep it genuine and helpful
    this.rules = {
      maxEngagementsPerDay: 10, // Don't overwhelm
      minValueThreshold: 7, // Only engage with high-fit opportunities (7+/10)
      cooldownPeriod: 24 * 60 * 60 * 1000, // Don't engage with same person twice in 24h
      responseStyle: 'helpful-not-salesy', // Always value-first
      includePromotion: false // Never directly promote in first engagement
    };

    this.engagementHistory = new Map(); // Track who we've engaged with
  }

  // Generate helpful response for an opportunity
  async generateResponse(opportunity) {
    const { title, text, painPoints, businessArea, source } = opportunity;

    // Check if we should engage (includes safety check)
    if (!(await this.shouldEngage(opportunity))) {
      return null;
    }

    // Generate genuinely helpful response using AI
    const prompt = `You are a helpful entrepreneur who wants to provide value first, not sell.

Someone posted this question/problem:
Title: ${title}
Text: ${text || 'N/A'}
Pain Points: ${painPoints || 'N/A'}
Business Area: ${businessArea}

Generate a SHORT (2-3 sentences max), genuinely helpful response that:
1. Addresses their specific problem
2. Provides actionable advice or a tip
3. Does NOT mention any services or products
4. Does NOT include links
5. Sounds natural and conversational
6. Shows you understand their situation

Keep it brief, valuable, and human. No salesy language.`;

    try {
      const response = await orchestrator.execute('content-generation', prompt);

      return {
        opportunity,
        response: response.content,
        engagementType: this.determineEngagementType(source),
        timestamp: new Date(),
        cost: response.usage.cost
      };
    } catch (error) {
      console.error('Failed to generate response:', error);
      return null;
    }
  }

  // Determine if we should engage with this opportunity
  async shouldEngage(opportunity) {
    // CRITICAL: Safety check first - NEVER engage with harmful content
    const safetyCheck = await contentSafety.checkContent(
      `${opportunity.title} ${opportunity.text}`,
      {
        type: 'engagement_check',
        source: opportunity.source,
        url: opportunity.url
      }
    );

    if (!safetyCheck.safe) {
      console.warn('⚠️  BLOCKED engagement with unsafe content');
      return false;
    }

    // Must have high fit score
    if (opportunity.fitScore < this.rules.minValueThreshold) {
      return false;
    }

    // Check cooldown - don't engage with same person/post twice
    const key = this.getEngagementKey(opportunity);
    if (this.engagementHistory.has(key)) {
      const lastEngagement = this.engagementHistory.get(key);
      const timeSince = Date.now() - lastEngagement;
      if (timeSince < this.rules.cooldownPeriod) {
        return false;
      }
    }

    // Must have clear pain point or question
    if (!opportunity.painPoints && !opportunity.text?.includes('?')) {
      return false;
    }

    return true;
  }

  // Get unique key for engagement tracking
  getEngagementKey(opportunity) {
    return `${opportunity.source}:${opportunity.id || opportunity.url || opportunity.title}`;
  }

  // Determine engagement type based on source
  determineEngagementType(source) {
    if (source.includes('reddit') || source.includes('Reddit')) {
      return 'reddit-comment';
    } else if (source.includes('blog')) {
      return 'blog-comment';
    } else if (source.includes('forum')) {
      return 'forum-reply';
    } else {
      return 'general-response';
    }
  }

  // Mark opportunity as engaged
  markEngaged(opportunity) {
    const key = this.getEngagementKey(opportunity);
    this.engagementHistory.set(key, Date.now());
  }

  // Generate engagement plan for multiple opportunities
  async planEngagements(opportunities) {
    console.log(`🤝 Planning engagements for ${opportunities.length} opportunities...`);

    const plan = {
      opportunities: opportunities.length,
      eligible: 0,
      planned: [],
      skipped: [],
      estimatedCost: 0
    };

    // Sort by fit score
    const sorted = opportunities.sort((a, b) => b.fitScore - a.fitScore);

    for (const opp of sorted) {
      if (plan.planned.length >= this.rules.maxEngagementsPerDay) {
        plan.skipped.push({
          opportunity: opp,
          reason: 'Daily limit reached'
        });
        continue;
      }

      if (!(await this.shouldEngage(opp))) {
        plan.skipped.push({
          opportunity: opp,
          reason: 'Does not meet engagement criteria or failed safety check'
        });
        continue;
      }

      plan.eligible++;

      const engagement = await this.generateResponse(opp);

      if (engagement) {
        plan.planned.push(engagement);
        plan.estimatedCost += engagement.cost || 0;
        this.markEngaged(opp);
      }
    }

    console.log(`  ✓ ${plan.planned.length} engagements planned`);
    console.log(`  ✓ ${plan.skipped.length} opportunities skipped`);
    console.log(`  ✓ Estimated cost: $${plan.estimatedCost.toFixed(4)}`);

    return plan;
  }

  // Execute engagement (for manual review before posting)
  async reviewEngagement(engagement) {
    return {
      opportunity: {
        title: engagement.opportunity.title,
        source: engagement.opportunity.source,
        url: engagement.opportunity.url,
        fitScore: engagement.opportunity.fitScore,
        painPoints: engagement.opportunity.painPoints
      },
      suggestedResponse: engagement.response,
      engagementType: engagement.engagementType,
      instructions: this.getEngagementInstructions(engagement.engagementType),
      reviewChecklist: [
        '✓ Response is genuinely helpful',
        '✓ No promotional content',
        '✓ Natural and conversational',
        '✓ Addresses their specific problem',
        '✓ Would you find this helpful if you were them?'
      ]
    };
  }

  // Get instructions for manual engagement
  getEngagementInstructions(type) {
    const instructions = {
      'reddit-comment': 'Post as a comment on Reddit. Be helpful, not promotional.',
      'blog-comment': 'Leave a comment on the blog post. Add value to the discussion.',
      'forum-reply': 'Reply to the forum thread. Focus on solving their problem.',
      'general-response': 'Respond helpfully to their question.'
    };

    return instructions[type] || instructions['general-response'];
  }

  // Generate follow-up response (if they reply positively)
  async generateFollowUp(originalEngagement, theirReply) {
    const prompt = `You previously helped someone with business advice. They replied:

"${theirReply}"

Generate a brief (2-3 sentences) follow-up that:
1. Acknowledges their response
2. Offers one more helpful tip if relevant
3. ONLY at the end, you can mention: "Happy to chat more if helpful - I work in [business strategy/their area]"
4. Keep it conversational and genuine
5. No links, no hard sells

Be human and helpful.`;

    try {
      const response = await orchestrator.execute('content-generation', prompt);

      return {
        followUp: response.content,
        cost: response.usage.cost
      };
    } catch (error) {
      console.error('Failed to generate follow-up:', error);
      return null;
    }
  }

  // Get engagement statistics
  getStats() {
    return {
      totalEngagements: this.engagementHistory.size,
      lastEngagement: this.engagementHistory.size > 0
        ? new Date(Math.max(...Array.from(this.engagementHistory.values())))
        : null,
      cooldownActive: this.engagementHistory.size,
      settings: this.rules
    };
  }

  // Clear engagement history (for testing)
  clearHistory() {
    this.engagementHistory.clear();
  }
}

module.exports = new AutoEngagement();
