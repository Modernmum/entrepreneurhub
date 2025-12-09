/**
 * AI Research Agent - Powered by Perplexity
 * Deep web research on qualified leads before outreach
 */

const axios = require('axios');

class AIResearcher {
  constructor() {
    this.perplexityApiKey = process.env.PERPLEXITY_API_KEY;
    this.perplexityEndpoint = 'https://api.perplexity.ai/chat/completions';
  }

  /**
   * Complete research on a lead using Perplexity
   */
  async researchLead(opportunity) {
    console.log(`🔍 Researching: ${opportunity.company_name}`);

    const research = {
      opportunity_id: opportunity.id,
      company_name: opportunity.company_name,
      researched_at: new Date().toISOString(),
    };

    // 1. Company Background Research (Perplexity searches the web)
    research.companyBackground = await this.searchCompanyBackground(opportunity);

    // 2. Pain Point & Problem Research
    research.painPointAnalysis = await this.researchPainPoints(opportunity);

    // 3. Decision Maker Research
    research.decisionMaker = await this.findDecisionMaker(opportunity);

    // 4. Recent Activity & News
    research.recentActivity = await this.findRecentActivity(opportunity);

    // 5. Competitor & Market Context
    research.marketContext = await this.researchMarketContext(opportunity);

    // 6. Personalization Hooks
    research.personalizationHooks = await this.extractPersonalizationHooks(research);

    // 7. Custom Approach
    research.recommendedApproach = await this.generateApproach(research);

    console.log(`✅ Research complete for ${opportunity.company_name}`);
    return research;
  }

  /**
   * Search for company background using Perplexity
   */
  async searchCompanyBackground(opportunity) {
    const query = `Research ${opportunity.company_name}${opportunity.company_domain ? ` (${opportunity.company_domain})` : ''}.

Find:
1. What does this company/person do?
2. What stage are they at (startup, small business, established)?
3. What industry/niche are they in?
4. Recent posts, updates, or mentions
5. Size, funding, or revenue indicators

Provide factual information found from web sources.`;

    return await this.askPerplexity(query);
  }

  /**
   * Research their pain points and problems
   */
  async researchPainPoints(opportunity) {
    const query = `Based on this information about ${opportunity.company_name}:

${JSON.stringify(opportunity, null, 2)}

Research:
1. What specific problems or challenges are they facing?
2. What are they actively looking for help with?
3. What tools or solutions are they currently using?
4. What have they mentioned struggling with?
5. What goals are they trying to achieve?

Search for recent posts, comments, or mentions that reveal their pain points.`;

    return await this.askPerplexity(query);
  }

  /**
   * Find decision maker information
   */
  async findDecisionMaker(opportunity) {
    const query = `Find information about the decision maker at ${opportunity.company_name}:

${opportunity.company_domain ? `Website: ${opportunity.company_domain}` : ''}
${opportunity.contact_email ? `Contact: ${opportunity.contact_email}` : ''}

Find:
1. Who is the founder/owner/decision maker?
2. Their name and role
3. Their LinkedIn profile or social media
4. Recent posts or activity
5. Their priorities and what they care about

Search for real people and profiles.`;

    return await this.askPerplexity(query);
  }

  /**
   * Find recent activity and news
   */
  async findRecentActivity(opportunity) {
    const query = `Find recent activity, posts, or news about ${opportunity.company_name}:

Search for:
1. Recent social media posts (LinkedIn, Twitter, Reddit, forums)
2. Blog posts or articles
3. Product launches or updates
4. Hiring posts
5. Any recent mentions or discussions

Focus on activity from the last 30 days.`;

    return await this.askPerplexity(query);
  }

  /**
   * Research market and competitive context
   */
  async researchMarketContext(opportunity) {
    const query = `Research the market context for ${opportunity.company_name}:

Based on their situation:
${JSON.stringify(opportunity.opportunity_data || {}, null, 2)}

Find:
1. Who are their likely competitors?
2. What solutions exist in their market?
3. What gaps exist that Unbound could fill?
4. Market trends in their industry
5. Common challenges in their space

Provide market intelligence.`;

    return await this.askPerplexity(query);
  }

  /**
   * Extract personalization hooks from research
   */
  async extractPersonalizationHooks(research) {
    const query = `Based on this research:

${JSON.stringify(research, null, 2)}

Extract specific personalization hooks:
1. Exact phrases or words they used
2. Specific projects or initiatives they mentioned
3. Recent achievements or milestones
4. Unique details about their situation
5. Timely/relevant events we can reference

Provide specific, quotable details.`;

    return await this.askPerplexity(query);
  }

  /**
   * Generate recommended outreach approach
   */
  async generateApproach(research) {
    const query = `Based on this research:

${JSON.stringify(research, null, 2)}

Create an outreach strategy for Unbound.Team.

Unbound offers: Autonomous client acquisition systems - we discover, qualify, and convert leads automatically for businesses.

Provide:
1. A personalized opening line referencing their specific situation
2. The exact problem we solve for them (based on their pain points)
3. Why Unbound is uniquely positioned to help them
4. A compelling call to action
5. The best timing/urgency angle

Make it highly specific to their situation.`;

    return await this.askPerplexity(query);
  }

  /**
   * Ask Perplexity for research (with fallback)
   */
  async askPerplexity(query) {
    // If no API key, return basic research from available data
    if (!this.perplexityApiKey) {
      console.log('   ⚠️  Perplexity API key not configured - using basic research');
      return {
        findings: 'Perplexity research unavailable - API key not configured. Using opportunity data only.',
        sources: [],
        researched_at: new Date().toISOString(),
        fallback: true
      };
    }

    try {
      const response = await axios.post(
        this.perplexityEndpoint,
        {
          model: 'sonar', // Online model for web search
          messages: [
            {
              role: 'system',
              content: 'You are a business research expert. Provide factual, detailed research based on web sources. Always cite sources when available.'
            },
            {
              role: 'user',
              content: query
            }
          ],
          temperature: 0.2,
          max_tokens: 2048
        },
        {
          headers: {
            'Authorization': `Bearer ${this.perplexityApiKey}`,
            'Content-Type': 'application/json'
          },
          timeout: 30000
        }
      );

      const content = response.data.choices[0].message.content;
      const citations = response.data.citations || [];

      return {
        findings: content,
        sources: citations,
        researched_at: new Date().toISOString()
      };

    } catch (error) {
      console.error('Perplexity API error:', error.response?.data || error.message);
      return {
        error: error.message,
        findings: 'Research unavailable - API error',
        sources: [],
        researched_at: new Date().toISOString()
      };
    }
  }

  /**
   * Research entire batch (100 leads)
   */
  async researchBatch(leads) {
    console.log(`📚 Researching batch of ${leads.length} leads with Perplexity...`);

    const results = [];
    let completed = 0;

    for (const lead of leads) {
      try {
        const research = await this.researchLead(lead);
        results.push(research);
        completed++;

        if (completed % 10 === 0) {
          console.log(`Progress: ${completed}/${leads.length} researched`);
        }

        // Rate limiting: Perplexity has rate limits, wait 2 seconds between requests
        await new Promise(resolve => setTimeout(resolve, 2000));

      } catch (error) {
        console.error(`Error researching ${lead.company_name}:`, error);
        results.push({
          opportunity_id: lead.id,
          error: error.message,
          researched_at: new Date().toISOString()
        });
      }
    }

    console.log(`✅ Batch research complete: ${completed}/${leads.length} successful`);
    return results;
  }

  /**
   * Quick research summary (for dashboard)
   */
  async quickResearch(opportunity) {
    const query = `Quick research on ${opportunity.company_name}:

Find the top 3 most important facts:
1. What they do
2. Their main challenge/pain point
3. Why they'd be interested in autonomous client acquisition

Keep it brief and actionable.`;

    return await this.askPerplexity(query);
  }
}

module.exports = AIResearcher;
