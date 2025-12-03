// Web Mention Monitor - Tracks mentions of Unbound.team across the web
// Finds blogs, forums, and sites talking about us for outreach opportunities

const axios = require('axios');
const cheerio = require('cheerio');
const { createClient } = require('@supabase/supabase-js');
const contentSafety = require('./content-safety');
require('dotenv').config();

class WebMentionMonitor {
  constructor() {
    this.supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_KEY
    );

    // Search queries to find mentions
    this.searchQueries = [
      'unbound.team',
      'unbound team AI',
      '"autonomous AI team"',
      'AI solves entrepreneur problems'
    ];

    // Sources to monitor
    this.sources = {
      // Use DuckDuckGo as Google alternative (no API key needed)
      duckduckgo: 'https://html.duckduckgo.com/html/',

      // RSS feeds of tech/startup news
      rssFeeds: [
        'https://news.ycombinator.com/rss',
        'https://www.indiehackers.com/feed',
        'https://techcrunch.com/feed/'
      ],

      // Forums
      forums: [
        'https://www.reddit.com/search.json?q=',
        'https://news.ycombinator.com/search?q='
      ]
    };
  }

  /**
   * Monitor all sources for new mentions
   */
  async scanForMentions() {
    console.log('🔍 Scanning web for mentions of Unbound.team...');

    const mentions = [];

    // Search DuckDuckGo
    for (const query of this.searchQueries) {
      const duckResults = await this.searchDuckDuckGo(query);
      mentions.push(...duckResults);

      // Rate limiting
      await this.sleep(2000);
    }

    // Search Reddit
    const redditMentions = await this.searchReddit('unbound.team OR "autonomous AI team"');
    mentions.push(...redditMentions);

    // Search HackerNews
    const hnMentions = await this.searchHackerNews('unbound.team');
    mentions.push(...hnMentions);

    // Safety check all mentions
    const safeMentions = [];
    for (const mention of mentions) {
      const safetyCheck = await contentSafety.checkContent(
        `${mention.title} ${mention.text}`,
        {
          type: 'web_mention',
          url: mention.url
        }
      );

      if (safetyCheck.safe) {
        safeMentions.push(mention);
      }
    }

    // Analyze sentiment
    const analyzed = await this.analyzeSentiment(safeMentions);

    // Save to database
    await this.saveMentions(analyzed);

    console.log(`✅ Found ${analyzed.length} safe mentions`);

    return {
      total: analyzed.length,
      positive: analyzed.filter(m => m.sentiment === 'positive').length,
      neutral: analyzed.filter(m => m.sentiment === 'neutral').length,
      negative: analyzed.filter(m => m.sentiment === 'negative').length,
      mentions: analyzed
    };
  }

  /**
   * Search DuckDuckGo for mentions
   */
  async searchDuckDuckGo(query) {
    try {
      const response = await axios.post(
        this.sources.duckduckgo,
        `q=${encodeURIComponent(query)}`,
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'User-Agent': 'Mozilla/5.0 (compatible; UnboundBot/1.0)'
          },
          timeout: 10000
        }
      );

      const $ = cheerio.load(response.data);
      const results = [];

      $('.result').each((i, elem) => {
        if (i >= 10) return; // Top 10 results only

        const $result = $(elem);
        const title = $result.find('.result__title').text().trim();
        const url = $result.find('.result__url').text().trim();
        const snippet = $result.find('.result__snippet').text().trim();

        if (title && url && snippet) {
          results.push({
            title,
            url: url.startsWith('http') ? url : `https://${url}`,
            text: snippet,
            source: 'duckduckgo',
            sourceType: this.detectSourceType(url),
            discoveredAt: new Date().toISOString()
          });
        }
      });

      return results;

    } catch (error) {
      console.error('DuckDuckGo search failed:', error.message);
      return [];
    }
  }

  /**
   * Search Reddit for mentions
   */
  async searchReddit(query) {
    try {
      const response = await axios.get(
        `https://www.reddit.com/search.json?q=${encodeURIComponent(query)}&limit=25&sort=new`,
        {
          headers: {
            'User-Agent': 'Mozilla/5.0 (compatible; UnboundBot/1.0)'
          },
          timeout: 10000
        }
      );

      const results = [];
      const posts = response.data?.data?.children || [];

      posts.forEach(post => {
        const data = post.data;

        results.push({
          title: data.title,
          url: `https://reddit.com${data.permalink}`,
          text: data.selftext || data.title,
          source: 'reddit',
          sourceType: 'forum',
          author: data.author,
          reachEstimate: data.score * 10, // Rough estimate: upvotes × 10
          discoveredAt: new Date(data.created_utc * 1000).toISOString()
        });
      });

      return results;

    } catch (error) {
      console.error('Reddit search failed:', error.message);
      return [];
    }
  }

  /**
   * Search Hacker News for mentions
   */
  async searchHackerNews(query) {
    try {
      const response = await axios.get(
        `https://hn.algolia.com/api/v1/search?query=${encodeURIComponent(query)}&tags=story`,
        {
          timeout: 10000
        }
      );

      const results = [];
      const hits = response.data?.hits || [];

      hits.forEach(hit => {
        results.push({
          title: hit.title,
          url: hit.url || `https://news.ycombinator.com/item?id=${hit.objectID}`,
          text: hit.title,
          source: 'hackernews',
          sourceType: 'forum',
          author: hit.author,
          reachEstimate: hit.points * 20, // Rough estimate: points × 20
          discoveredAt: new Date(hit.created_at).toISOString()
        });
      });

      return results;

    } catch (error) {
      console.error('HackerNews search failed:', error.message);
      return [];
    }
  }

  /**
   * Detect source type from URL
   */
  detectSourceType(url) {
    const urlLower = url.toLowerCase();

    if (urlLower.includes('reddit.com')) return 'forum';
    if (urlLower.includes('news.ycombinator.com')) return 'forum';
    if (urlLower.includes('twitter.com') || urlLower.includes('x.com')) return 'social';
    if (urlLower.includes('linkedin.com')) return 'social';
    if (urlLower.includes('facebook.com')) return 'social';
    if (urlLower.includes('techcrunch.com') || urlLower.includes('news')) return 'news';

    return 'blog'; // Default to blog
  }

  /**
   * Analyze sentiment of mentions
   */
  async analyzeSentiment(mentions) {
    // Simple keyword-based sentiment analysis
    // In production, could use AI for more accurate analysis

    const positivekeywords = [
      'great', 'awesome', 'helpful', 'recommend', 'love',
      'excellent', 'amazing', 'fantastic', 'useful', 'solved'
    ];

    const negativeKeywords = [
      'bad', 'terrible', 'useless', 'scam', 'waste',
      'disappointed', 'poor', 'awful', 'hate'
    ];

    return mentions.map(mention => {
      const text = `${mention.title} ${mention.text}`.toLowerCase();

      const positiveCount = positiveKeywords.filter(kw => text.includes(kw)).length;
      const negativeCount = negativeKeywords.filter(kw => text.includes(kw)).length;

      let sentiment = 'neutral';
      if (positiveCount > negativeCount) sentiment = 'positive';
      if (negativeCount > positiveCount) sentiment = 'negative';

      return {
        ...mention,
        sentiment,
        sentimentScore: positiveCount - negativeCount
      };
    });
  }

  /**
   * Save mentions to database
   */
  async saveMentions(mentions) {
    for (const mention of mentions) {
      // Check if already exists
      const { data: existing } = await this.supabase
        .from('web_mentions')
        .select('id')
        .eq('source_url', mention.url)
        .single();

      if (existing) {
        console.log(`  → Already tracked: ${mention.url}`);
        continue;
      }

      // Insert new mention
      await this.supabase
        .from('web_mentions')
        .insert({
          source_url: mention.url,
          source_type: mention.sourceType,
          mention_text: mention.text.substring(0, 1000),
          sentiment: mention.sentiment,
          discovered_at: mention.discoveredAt,
          author: mention.author || null,
          reach_estimate: mention.reachEstimate || 0,
          contacted: false,
          metadata: {
            title: mention.title,
            source: mention.source,
            sentiment_score: mention.sentimentScore
          }
        });

      console.log(`  ✓ Saved: ${mention.title} (${mention.sentiment})`);
    }
  }

  /**
   * Get outreach opportunities from positive mentions
   */
  async getOutreachOpportunities() {
    const { data: mentions } = await this.supabase
      .from('web_mentions')
      .select('*')
      .eq('sentiment', 'positive')
      .eq('contacted', false)
      .order('reach_estimate', { ascending: false })
      .limit(20);

    return mentions || [];
  }

  /**
   * Mark mention as contacted
   */
  async markAsContacted(mentionId) {
    await this.supabase
      .from('web_mentions')
      .update({ contacted: true })
      .eq('id', mentionId);
  }

  /**
   * Get mentions summary
   */
  async getSummary() {
    const { data: all } = await this.supabase
      .from('web_mentions')
      .select('sentiment, source_type, reach_estimate');

    if (!all || all.length === 0) {
      return {
        total: 0,
        positive: 0,
        neutral: 0,
        negative: 0,
        totalReach: 0,
        byType: {}
      };
    }

    const summary = {
      total: all.length,
      positive: all.filter(m => m.sentiment === 'positive').length,
      neutral: all.filter(m => m.sentiment === 'neutral').length,
      negative: all.filter(m => m.sentiment === 'negative').length,
      totalReach: all.reduce((sum, m) => sum + (m.reach_estimate || 0), 0),
      byType: {}
    };

    // Group by type
    all.forEach(m => {
      const type = m.source_type || 'unknown';
      summary.byType[type] = (summary.byType[type] || 0) + 1;
    });

    return summary;
  }

  /**
   * Helper: sleep
   */
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

module.exports = new WebMentionMonitor();
