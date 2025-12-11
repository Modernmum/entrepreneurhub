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
   * Complete research on a lead using Perplexity - SINGLE consolidated API call
   * Cost-optimized: 1 call per lead instead of 8
   */
  async researchLead(opportunity) {
    console.log(`🔍 Researching: ${opportunity.company_name}`);

    const research = {
      opportunity_id: opportunity.id,
      company_name: opportunity.company_name,
      researched_at: new Date().toISOString(),
    };

    // SINGLE consolidated research call
    const consolidatedResult = await this.consolidatedResearch(opportunity);

    // Parse the consolidated response into structured sections
    research.companyBackground = { findings: consolidatedResult.company_background || '' };
    research.painPointAnalysis = { findings: consolidatedResult.pain_points || '' };
    research.decisionMaker = { findings: consolidatedResult.decision_maker || '' };
    research.personalizationHooks = { findings: consolidatedResult.personalization_hooks || '' };
    research.recommendedApproach = { findings: consolidatedResult.recommended_approach || '' };
    research.sources = consolidatedResult.sources || [];
    research.raw_response = consolidatedResult.raw_response;

    console.log(`✅ Research complete for ${opportunity.company_name}`);
    return research;
  }

  /**
   * Single consolidated Perplexity call - all research in one request
   * Optimized for Maggie Forbes Strategies - Strategic Growth Architecture
   * Target: $3M-$25M founder-led businesses hitting a growth ceiling
   */
  async consolidatedResearch(opportunity) {
    const domain = opportunity.company_domain || '';
    const contactName = opportunity.contact_name || opportunity.opportunity_data?.contact_full_name || '';
    const jobTitle = opportunity.opportunity_data?.job_title || '';

    const query = `Research this business for Maggie Forbes Strategies outreach:

Company: ${opportunity.company_name}
${domain ? `Website: ${domain}` : ''}
${contactName ? `Contact: ${contactName}` : ''}
${jobTitle ? `Title: ${jobTitle}` : ''}

TARGET CLIENT PROFILE: Established founder-led businesses ($3M-$25M revenue) that have hit a growth ceiling. NOT startups, NOT enterprise corporations.

Provide a research report with these sections:

1. COMPANY BACKGROUND:
   - What they do (1 sentence)
   - Estimated revenue range (look for employee count, office size, client list indicators)
   - Years in business (founded when?)
   - Industry/niche
   - IS THIS A FIT? (Yes/No/Maybe - based on $3M-$25M founder-led criteria)

2. FOUNDER/OWNER PROFILE:
   - Name and exact title
   - Are they still hands-on in daily operations? (critical - look for LinkedIn activity, speaking, involvement)
   - How long have they led this company?
   - Any signs of burnout, transition thinking, or "what's next" mindset?

3. GROWTH CEILING INDICATORS (look for specific evidence):
   - Leadership dependency: Does the business revolve around the founder?
   - Revenue concentration: Do they rely on referrals/relationships vs systematic sales?
   - Operational bottlenecks: Manual processes, founder approval needed for everything?
   - Team limitations: Can the team execute without founder in the room?
   - Scaling challenges: Have they plateaued or struggled to grow past a certain point?

4. PERSONALIZATION HOOKS (specific, quotable details):
   - Recent achievements, awards, recognition
   - Milestones (years in business, client wins, expansion)
   - Speaking engagements, podcasts, books, thought leadership
   - Personal interests or causes they care about
   - Recent company news or announcements

5. OUTREACH ANGLE (1-2 sentences): The most compelling way to open a conversation about building systems that let them step back without stepping down.

Be specific and factual. If information isn't available, say so.`;

    const result = await this.askPerplexity(query);

    if (result.fallback) {
      return {
        company_background: `${opportunity.company_name} - established business (details pending research)`,
        pain_points: 'Potential growth ceiling indicators: founder involvement in daily operations, relationship-dependent revenue',
        decision_maker: opportunity.contact_name || 'Unknown',
        personalization_hooks: `Leader in ${opportunity.industry || 'their industry'}`,
        recommended_approach: 'Focus on building scalable growth infrastructure',
        sources: [],
        raw_response: result.findings
      };
    }

    // Parse the response into sections
    const response = result.findings || '';
    return {
      company_background: this.extractSection(response, 'COMPANY BACKGROUND', 'FOUNDER'),
      founder_profile: this.extractSection(response, 'FOUNDER/OWNER PROFILE', 'GROWTH CEILING'),
      growth_ceiling_indicators: this.extractSection(response, 'GROWTH CEILING INDICATORS', 'PERSONALIZATION'),
      personalization_hooks: this.extractSection(response, 'PERSONALIZATION HOOKS', 'OUTREACH'),
      outreach_angle: this.extractSection(response, 'OUTREACH ANGLE', null),
      // Also map to legacy field names for compatibility
      pain_points: this.extractSection(response, 'GROWTH CEILING INDICATORS', 'PERSONALIZATION'),
      decision_maker: this.extractSection(response, 'FOUNDER/OWNER PROFILE', 'GROWTH CEILING'),
      recommended_approach: this.extractSection(response, 'OUTREACH ANGLE', null),
      sources: result.sources || [],
      raw_response: response
    };
  }

  /**
   * Extract a section from the response text
   */
  extractSection(text, startMarker, endMarker) {
    try {
      const startIdx = text.toUpperCase().indexOf(startMarker);
      if (startIdx === -1) return '';

      let endIdx = text.length;
      if (endMarker) {
        const found = text.toUpperCase().indexOf(endMarker, startIdx + startMarker.length);
        if (found !== -1) endIdx = found;
      }

      return text.substring(startIdx + startMarker.length, endIdx)
        .replace(/^[:\s]+/, '')
        .trim()
        .substring(0, 500); // Limit length
    } catch (e) {
      return '';
    }
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
   * CRITICAL: Find contact email for outreach
   */
  async findContactEmail(opportunity) {
    const domain = opportunity.company_domain || '';

    const query = `What is the contact email for ${opportunity.company_name}?

Website: ${domain}

Look for publicly listed business contact emails on their website. Check:
- Contact page
- About page
- Footer
- Team page

Also determine common email patterns for this business:
- Is it firstname@${domain}?
- Is it hello@${domain} or contact@${domain}?
- What email format do they use?

If you find the founder/owner name, what would their email likely be?

Provide the best email address to contact this business for B2B purposes.`;

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
   * Updated for Maggie Forbes Strategies
   */
  async generateApproach(research) {
    const query = `Based on this research:

${JSON.stringify(research, null, 2)}

Create an outreach strategy for Maggie Forbes Strategies.

Maggie Forbes Strategies helps leaders of established organizations ($3M-$25M) who've hit a growth ceiling. They architect intelligent growth systems that create predictable opportunity flow without operational chaos.

They solve "The Architecture Gap":
- Leadership Dependency (founder doing everything)
- Relationship-Dependent Revenue (no systematic pipeline)
- Infrastructure That Doesn't Scale (manual processes)

Provide:
1. A personalized opening line referencing their specific achievements or situation
2. The specific growth ceiling indicator we've identified (based on their pain points)
3. How systematic infrastructure could transform their situation
4. A compelling call to action for a consultation
5. The best angle given their industry and stage

Make it highly specific to their situation as an established leader.`;

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
      // Log more details about the error
      const statusCode = error.response?.status;
      const errorData = error.response?.data;
      let errorMsg = error.message;

      if (statusCode === 401) {
        errorMsg = 'Invalid API key';
      } else if (statusCode === 400) {
        errorMsg = `Bad request: ${JSON.stringify(errorData)}`;
      } else if (statusCode === 429) {
        errorMsg = 'Rate limited';
      } else if (errorData) {
        errorMsg = `API error (${statusCode}): ${JSON.stringify(errorData)}`;
      }

      console.log(`   ⚠️  Perplexity unavailable (${errorMsg}) - using basic research`);
      console.log(`   📍 API Key present: ${!!this.perplexityApiKey}, Key prefix: ${this.perplexityApiKey?.substring(0, 8)}...`);

      return {
        findings: 'Research skipped - using opportunity data only.',
        sources: [],
        researched_at: new Date().toISOString(),
        fallback: true,
        error: errorMsg
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
