// Auto-Reach Referred Audiences - Automatically reach audiences of successful referrers
// When someone refers us, we analyze their audience and reach similar people

const axios = require('axios');
const cheerio = require('cheerio');
const { createClient } = require('@supabase/supabase-js');
const orchestrator = require('./ai-orchestrator');
const rssMonitor = require('./rss-monitor');
const forumScraper = require('./forum-scraper');
const contentSafety = require('./content-safety');
require('dotenv').config();

class AudienceReach {
  constructor() {
    this.supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_KEY
    );
  }

  /**
   * Analyze referrer's audience
   */
  async analyzeReferrerAudience(referrerId) {
    console.log(`👥 Analyzing audience of referrer: ${referrerId}`);

    // Get referrer's profile
    const { data: profile } = await this.supabase
      .from('profiles')
      .select('*')
      .eq('id', referrerId)
      .single();

    if (!profile) {
      console.log('Referrer profile not found');
      return null;
    }

    const audience = {
      referrerId,
      profile,
      sources: [],
      demographics: {},
      interests: [],
      similarAudiences: []
    };

    // Check if they're a blogger
    const { data: blogger } = await this.supabase
      .from('blogger_partnerships')
      .select('*')
      .eq('user_id', referrerId)
      .single();

    if (blogger) {
      // Analyze their blog audience
      const blogAudience = await this.analyzeBlogAudience(blogger.blog_url);
      if (blogAudience) {
        audience.sources.push({
          type: 'blog',
          url: blogger.blog_url,
          reach: blogger.audience_size,
          niche: blogger.niche,
          ...blogAudience
        });
      }
    }

    // Check their social presence (if available in profile)
    if (profile.website) {
      const websiteAudience = await this.analyzeWebsite(profile.website);
      if (websiteAudience) {
        audience.sources.push(websiteAudience);
      }
    }

    // Identify demographics and interests from their activity
    const interests = await this.identifyInterests(referrerId);
    audience.interests = interests;

    // Find similar audiences
    const similar = await this.findSimilarAudiences(audience);
    audience.similarAudiences = similar;

    // Save analysis
    await this.saveAudienceAnalysis(referrerId, audience);

    console.log(`✅ Audience analyzed: ${similar.length} similar audiences found`);

    return audience;
  }

  /**
   * Analyze blog audience
   */
  async analyzeBlogAudience(blogUrl) {
    try {
      const response = await axios.get(blogUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; UnboundBot/1.0)'
        },
        timeout: 10000
      });

      const $ = cheerio.load(response.data);

      // Extract topics from blog content
      const text = $('body').text().toLowerCase();
      const topics = this.extractTopics(text);

      return {
        url: blogUrl,
        topics,
        contentType: this.detectContentType($),
        hasComments: $('comment, .comment, .comments').length > 0,
        hasNewsletter: $('input[type="email"]').length > 0
      };

    } catch (error) {
      console.error(`Failed to analyze blog ${blogUrl}:`, error.message);
      return null;
    }
  }

  /**
   * Extract topics from text
   */
  extractTopics(text) {
    const topicKeywords = {
      entrepreneurship: ['startup', 'business', 'entrepreneur', 'founder'],
      marketing: ['marketing', 'seo', 'content', 'social media'],
      technology: ['tech', 'software', 'ai', 'automation'],
      finance: ['revenue', 'profit', 'funding', 'investment'],
      productivity: ['productivity', 'efficiency', 'workflow', 'tools']
    };

    const topics = [];

    for (const [topic, keywords] of Object.entries(topicKeywords)) {
      const matches = keywords.filter(kw => text.includes(kw.toLowerCase())).length;
      if (matches >= 2) {
        topics.push({ topic, relevance: matches });
      }
    }

    return topics.sort((a, b) => b.relevance - a.relevance).slice(0, 5);
  }

  /**
   * Detect content type
   */
  detectContentType($) {
    if ($('article').length > 5) return 'blog';
    if ($('product, .product').length > 3) return 'ecommerce';
    if ($('form').length > 2) return 'saas';
    return 'general';
  }

  /**
   * Analyze website audience
   */
  async analyzeWebsite(websiteUrl) {
    // Similar to analyzeBlogAudience but for general websites
    return await this.analyzeBlogAudience(websiteUrl);
  }

  /**
   * Identify interests from user activity
   */
  async identifyInterests(userId) {
    // Get user's solution history
    const { data: solutions } = await this.supabase
      .from('solution_results')
      .select('solution_type, metadata')
      .eq('user_id', userId);

    if (!solutions || solutions.length === 0) {
      return [];
    }

    // Analyze what types of problems they solve
    const interests = [];
    const solutionTypes = {};

    solutions.forEach(s => {
      solutionTypes[s.solution_type] = (solutionTypes[s.solution_type] || 0) + 1;
    });

    // Convert to interests
    for (const [type, count] of Object.entries(solutionTypes)) {
      interests.push({
        interest: type.replace(/-/g, ' '),
        strength: count
      });
    }

    return interests.sort((a, b) => b.strength - a.strength);
  }

  /**
   * Find similar audiences
   */
  async findSimilarAudiences(audience) {
    const similar = [];

    // Extract top topics/interests
    const topics = audience.interests.slice(0, 3).map(i => i.interest);

    // Search for blogs with similar content
    for (const topic of topics) {
      // Use RSS monitor to find relevant content
      const feeds = await rssMonitor.scanAllFeeds();

      // Filter for similar topics
      const relevant = feeds.filter(f => {
        const text = `${f.title} ${f.description}`.toLowerCase();
        return topics.some(t => text.includes(t.toLowerCase()));
      });

      similar.push(...relevant.slice(0, 5));
    }

    // Search forums for similar discussions
    const forumPosts = await forumScraper.scrapeMultipleSubreddits(
      topics.map(t => t.replace(/\s+/g, ''))
    );

    similar.push(...forumPosts.slice(0, 5));

    return similar;
  }

  /**
   * Save audience analysis
   */
  async saveAudienceAnalysis(referrerId, audience) {
    await this.supabase
      .from('audience_analysis')
      .insert({
        referrer_id: referrerId,
        sources: audience.sources,
        interests: audience.interests,
        similar_audiences_count: audience.similarAudiences.length,
        analyzed_at: new Date().toISOString(),
        metadata: audience
      });
  }

  /**
   * Auto-reach similar audiences
   */
  async autoReachSimilarAudiences(referrerId, limit = 20) {
    console.log(`🎯 Auto-reaching similar audiences for referrer: ${referrerId}`);

    // Get audience analysis
    const audience = await this.analyzeReferrerAudience(referrerId);

    if (!audience || audience.similarAudiences.length === 0) {
      console.log('No similar audiences found');
      return { reached: 0, opportunities: [] };
    }

    const opportunities = [];

    for (const similar of audience.similarAudiences.slice(0, limit)) {
      // Safety check
      const safetyCheck = await contentSafety.checkContent(
        `${similar.title} ${similar.text || similar.description}`,
        {
          type: 'audience_reach',
          url: similar.url || similar.link
        }
      );

      if (!safetyCheck.safe) {
        console.warn(`  ⚠️  Skipping unsafe content`);
        continue;
      }

      // Create engagement opportunity
      const opportunity = {
        source: similar.source,
        url: similar.url || similar.link,
        title: similar.title,
        text: similar.text || similar.description,
        referrerId,
        discoveredVia: 'audience_analysis',
        fitScore: similar.fitScore || 7,
        createdAt: new Date().toISOString()
      };

      opportunities.push(opportunity);

      // Save to database
      await this.supabase
        .from('discovered_opportunities')
        .insert(opportunity);

      console.log(`  ✓ Opportunity: ${similar.title}`);
    }

    console.log(`✅ Auto-reached ${opportunities.length} similar audiences`);

    return {
      reached: opportunities.length,
      opportunities,
      referrerId,
      audienceTopics: audience.interests.map(i => i.interest)
    };
  }

  /**
   * Track conversion from referred audience
   */
  async trackConversion(opportunityId, newUserId) {
    // Find the opportunity
    const { data: opp } = await this.supabase
      .from('discovered_opportunities')
      .select('referrer_id')
      .eq('id', opportunityId)
      .single();

    if (!opp) return null;

    // Award credit to original referrer
    await this.supabase
      .from('user_credits')
      .insert({
        user_id: opp.referrer_id,
        amount: 5, // $5 for audience expansion conversion
        type: 'audience_reach_conversion',
        description: 'Conversion from similar audience',
        created_at: new Date().toISOString(),
        metadata: {
          opportunity_id: opportunityId,
          converted_user_id: newUserId
        }
      });

    console.log(`✅ Audience reach conversion tracked for referrer ${opp.referrer_id}`);

    return {
      referrerId: opp.referrer_id,
      bonus: 5
    };
  }

  /**
   * Get audience reach stats for referrer
   */
  async getAudienceReachStats(referrerId) {
    const { data: opportunities } = await this.supabase
      .from('discovered_opportunities')
      .select('*')
      .eq('referrer_id', referrerId)
      .eq('discovered_via', 'audience_analysis');

    const { data: conversions } = await this.supabase
      .from('user_credits')
      .select('*')
      .eq('user_id', referrerId)
      .eq('type', 'audience_reach_conversion');

    return {
      opportunitiesFound: opportunities?.length || 0,
      conversions: conversions?.length || 0,
      totalEarned: conversions?.reduce((sum, c) => sum + c.amount, 0) || 0,
      conversionRate: opportunities?.length > 0
        ? ((conversions?.length || 0) / opportunities.length * 100).toFixed(1)
        : 0
    };
  }
}

module.exports = new AudienceReach();
