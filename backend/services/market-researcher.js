// Market Research System - AI-powered market analysis
// Analyzes competitors, market size, opportunities, and provides actionable insights

const axios = require('axios');
const cheerio = require('cheerio');
const orchestrator = require('./ai-orchestrator');
const contentSafety = require('./content-safety');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

class MarketResearcher {
  constructor() {
    this.supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_KEY
    );
  }

  /**
   * Conduct full market research
   */
  async conductResearch(params) {
    const { idea, industry, targetAudience, competitors, userId } = params;

    console.log(`🔍 Conducting market research for: ${idea}`);

    const research = {
      idea,
      industry,
      targetAudience,
      competitors: competitors || [],
      timestamp: new Date().toISOString()
    };

    // 1. Analyze competitors
    research.competitorAnalysis = await this.analyzeCompetitors(competitors || []);

    // 2. Identify market gaps
    research.marketGaps = await this.identifyMarketGaps(idea, industry, research.competitorAnalysis);

    // 3. Estimate market size
    research.marketSize = await this.estimateMarketSize(idea, industry, targetAudience);

    // 4. Identify target audience segments
    research.audienceSegments = await this.identifyAudienceSegments(targetAudience, industry);

    // 5. Pricing analysis
    research.pricingAnalysis = await this.analyzePricing(idea, research.competitorAnalysis);

    // 6. Find pain points
    research.painPoints = await this.findPainPoints(targetAudience, industry);

    // 7. Generate recommendations
    research.recommendations = await this.generateRecommendations(research);

    // 8. Calculate opportunity score
    research.opportunityScore = this.calculateOpportunityScore(research);

    // Save research
    const saved = await this.saveResearch(userId, research);

    console.log(`✅ Market research complete. Opportunity score: ${research.opportunityScore}/10`);

    return saved;
  }

  /**
   * Analyze competitors
   */
  async analyzeCompetitors(competitors) {
    if (!competitors || competitors.length === 0) {
      return { analyzed: [], summary: 'No competitors provided for analysis' };
    }

    console.log(`  → Analyzing ${competitors.length} competitors...`);

    const analyzed = [];

    for (const competitor of competitors.slice(0, 5)) {
      // If URL provided, scrape website
      let websiteData = null;
      if (competitor.includes('http')) {
        websiteData = await this.scrapeCompetitorWebsite(competitor);
      }

      // AI analysis
      const analysis = await this.analyzeCompetitorWithAI(competitor, websiteData);

      if (analysis) {
        analyzed.push(analysis);
      }
    }

    // Generate competitive summary
    const summary = await this.generateCompetitiveSummary(analyzed);

    return {
      analyzed,
      summary,
      count: analyzed.length
    };
  }

  /**
   * Scrape competitor website
   */
  async scrapeCompetitorWebsite(url) {
    try {
      const response = await axios.get(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; UnboundBot/1.0)'
        },
        timeout: 10000
      });

      const $ = cheerio.load(response.data);

      return {
        title: $('title').text().trim(),
        description: $('meta[name="description"]').attr('content') || '',
        pricing: this.extractPricing($),
        features: this.extractFeatures($),
        hasDemo: $('a:contains("Demo"), a:contains("Try")').length > 0,
        hasPricing: $('a:contains("Pricing"), a:contains("Plans")').length > 0
      };

    } catch (error) {
      console.error(`Failed to scrape ${url}:`, error.message);
      return null;
    }
  }

  /**
   * Extract pricing from website
   */
  extractPricing($) {
    const prices = [];
    $('body').text().match(/\$\d+(?:,\d{3})*(?:\.\d{2})?/g)?.forEach(price => {
      prices.push(price);
    });
    return prices.slice(0, 5); // Top 5 prices found
  }

  /**
   * Extract features from website
   */
  extractFeatures($) {
    const features = [];
    $('li, .feature, [class*="feature"]').each((i, elem) => {
      if (i >= 10) return;
      const text = $(elem).text().trim();
      if (text.length > 10 && text.length < 100) {
        features.push(text);
      }
    });
    return features;
  }

  /**
   * Analyze competitor with AI
   */
  async analyzeCompetitorWithAI(competitor, websiteData) {
    const prompt = `Analyze this competitor:

Competitor: ${competitor}
${websiteData ? `
Website Title: ${websiteData.title}
Description: ${websiteData.description}
Pricing: ${websiteData.pricing?.join(', ') || 'Not found'}
Features: ${websiteData.features?.slice(0, 5).join(', ') || 'Not found'}
` : ''}

Provide analysis:
1. Positioning (how they position themselves)
2. Target audience
3. Pricing strategy (budget/mid/premium)
4. Key strengths
5. Key weaknesses

Format as JSON:
{
  "name": "...",
  "positioning": "...",
  "targetAudience": "...",
  "pricingStrategy": "budget/mid/premium",
  "strengths": ["...", "..."],
  "weaknesses": ["...", "..."]
}`;

    try {
      const response = await orchestrator.execute('analysis', prompt);
      const jsonMatch = response.content.match(/\{[\s\S]*\}/);

      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }

      return null;

    } catch (error) {
      console.error('Competitor analysis failed:', error.message);
      return null;
    }
  }

  /**
   * Generate competitive summary
   */
  async generateCompetitiveSummary(competitors) {
    if (competitors.length === 0) return 'No competitors analyzed';

    const prompt = `Summarize competitive landscape:

Competitors analyzed: ${competitors.length}

${competitors.map((c, i) => `
${i + 1}. ${c.name}
   Positioning: ${c.positioning}
   Pricing: ${c.pricingStrategy}
   Strengths: ${c.strengths?.join(', ')}
   Weaknesses: ${c.weaknesses?.join(', ')}
`).join('\n')}

Provide 2-3 sentence summary of the competitive landscape.`;

    try {
      const response = await orchestrator.execute('analysis', prompt);
      return response.content.trim();

    } catch (error) {
      return 'Unable to generate competitive summary';
    }
  }

  /**
   * Identify market gaps
   */
  async identifyMarketGaps(idea, industry, competitorAnalysis) {
    const prompt = `Identify market gaps for this business idea:

Idea: ${idea}
Industry: ${industry}

Competitor landscape:
${competitorAnalysis.summary}

What gaps or underserved needs exist in this market?
Provide 3-5 specific market gaps.

Format as JSON:
{
  "gaps": [
    {"gap": "...", "opportunity": "..."},
    ...
  ]
}`;

    try {
      const response = await orchestrator.execute('analysis', prompt);
      const jsonMatch = response.content.match(/\{[\s\S]*\}/);

      if (jsonMatch) {
        const result = JSON.parse(jsonMatch[0]);
        return result.gaps || [];
      }

      return [];

    } catch (error) {
      console.error('Market gap analysis failed:', error.message);
      return [];
    }
  }

  /**
   * Estimate market size
   */
  async estimateMarketSize(idea, industry, targetAudience) {
    const prompt = `Estimate market size for:

Idea: ${idea}
Industry: ${industry}
Target Audience: ${targetAudience}

Provide realistic estimates:
1. Total Addressable Market (TAM)
2. Serviceable Available Market (SAM)
3. Serviceable Obtainable Market (SOM)
4. Growth rate (annual %)

Format as JSON:
{
  "tam": "...",
  "sam": "...",
  "som": "...",
  "growthRate": "...",
  "confidence": "low/medium/high"
}`;

    try {
      const response = await orchestrator.execute('research', prompt);
      const jsonMatch = response.content.match(/\{[\s\S]*\}/);

      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }

      return {
        tam: 'Unknown',
        sam: 'Unknown',
        som: 'Unknown',
        growthRate: 'Unknown',
        confidence: 'low'
      };

    } catch (error) {
      console.error('Market size estimation failed:', error.message);
      return null;
    }
  }

  /**
   * Identify audience segments
   */
  async identifyAudienceSegments(targetAudience, industry) {
    const prompt = `Identify customer segments for:

Target Audience: ${targetAudience}
Industry: ${industry}

Identify 3-4 distinct customer segments with:
- Segment name
- Demographics
- Pain points
- Buying behavior
- Priority (high/medium/low)

Format as JSON array:
[
  {
    "segment": "...",
    "demographics": "...",
    "painPoints": ["...", "..."],
    "buyingBehavior": "...",
    "priority": "high/medium/low"
  },
  ...
]`;

    try {
      const response = await orchestrator.execute('analysis', prompt);
      const jsonMatch = response.content.match(/\[[\s\S]*\]/);

      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }

      return [];

    } catch (error) {
      console.error('Audience segmentation failed:', error.message);
      return [];
    }
  }

  /**
   * Analyze pricing
   */
  async analyzePricing(idea, competitorAnalysis) {
    const competitors = competitorAnalysis.analyzed || [];

    const prompt = `Recommend pricing strategy for:

Idea: ${idea}

Competitor pricing:
${competitors.map(c => `- ${c.name}: ${c.pricingStrategy} tier`).join('\n')}

Recommend:
1. Pricing model (subscription/one-time/freemium/usage-based)
2. Price range
3. Pricing tiers (if applicable)
4. Justification

Format as JSON:
{
  "model": "...",
  "range": "...",
  "tiers": ["...", "..."],
  "justification": "..."
}`;

    try {
      const response = await orchestrator.execute('analysis', prompt);
      const jsonMatch = response.content.match(/\{[\s\S]*\}/);

      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }

      return null;

    } catch (error) {
      console.error('Pricing analysis failed:', error.message);
      return null;
    }
  }

  /**
   * Find pain points in target market
   */
  async findPainPoints(targetAudience, industry) {
    const prompt = `Identify top pain points for:

Target Audience: ${targetAudience}
Industry: ${industry}

List 5-7 specific pain points they experience.

Format as JSON:
{
  "painPoints": [
    {"pain": "...", "severity": "high/medium/low"},
    ...
  ]
}`;

    try {
      const response = await orchestrator.execute('research', prompt);
      const jsonMatch = response.content.match(/\{[\s\S]*\}/);

      if (jsonMatch) {
        const result = JSON.parse(jsonMatch[0]);
        return result.painPoints || [];
      }

      return [];

    } catch (error) {
      console.error('Pain point research failed:', error.message);
      return [];
    }
  }

  /**
   * Generate actionable recommendations
   */
  async generateRecommendations(research) {
    const prompt = `Based on this market research, provide 5-7 actionable recommendations:

Idea: ${research.idea}
Market Gaps: ${research.marketGaps?.map(g => g.gap).join(', ')}
Competitor Landscape: ${research.competitorAnalysis?.summary}
Pain Points: ${research.painPoints?.map(p => p.pain).join(', ')}

Provide specific, actionable recommendations for:
1. Product positioning
2. Target segment priority
3. Pricing strategy
4. Go-to-market approach
5. Key differentiators

Format as JSON array:
[
  {"recommendation": "...", "impact": "high/medium/low", "effort": "high/medium/low"},
  ...
]`;

    try {
      const response = await orchestrator.execute('analysis', prompt);
      const jsonMatch = response.content.match(/\[[\s\S]*\]/);

      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }

      return [];

    } catch (error) {
      console.error('Recommendations generation failed:', error.message);
      return [];
    }
  }

  /**
   * Calculate opportunity score (1-10)
   */
  calculateOpportunityScore(research) {
    let score = 5; // Base score

    // Market gaps (+2 max)
    if (research.marketGaps && research.marketGaps.length > 0) {
      score += Math.min(research.marketGaps.length * 0.5, 2);
    }

    // Market size confidence (+1 if high)
    if (research.marketSize?.confidence === 'high') {
      score += 1;
    }

    // Competition (+1 if low competition)
    if (research.competitorAnalysis?.count <= 3) {
      score += 1;
    }

    // Pain points (+1 if high severity)
    const highSeverityPains = research.painPoints?.filter(p => p.severity === 'high')?.length || 0;
    if (highSeverityPains >= 2) {
      score += 1;
    }

    return Math.min(Math.round(score), 10);
  }

  /**
   * Save research to database
   */
  async saveResearch(userId, research) {
    const { data, error } = await this.supabase
      .from('market_research')
      .insert({
        user_id: userId,
        idea: research.idea,
        industry: research.industry,
        opportunity_score: research.opportunityScore,
        status: 'completed',
        created_at: research.timestamp,
        metadata: research
      })
      .select()
      .single();

    if (error) {
      console.error('Failed to save research:', error);
      throw new Error('Failed to save research');
    }

    return data;
  }

  /**
   * Get user's research
   */
  async getUserResearch(userId) {
    const { data } = await this.supabase
      .from('market_research')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    return data || [];
  }
}

module.exports = new MarketResearcher();
