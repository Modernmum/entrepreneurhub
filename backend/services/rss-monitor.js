// RSS Feed Monitor - Discovers opportunities from indie blogs
// Monitors RSS feeds for entrepreneur problems, questions, and pain points

const axios = require('axios');
const cheerio = require('cheerio');
const contentSafety = require('./content-safety');

class RSSMonitor {
  constructor() {
    // Curated list of indie entrepreneur blogs and news sources
    this.feeds = [
      // Indie Hackers & Maker Community
      'https://www.indiehackers.com/feed',
      'https://news.ycombinator.com/rss',

      // Entrepreneur Blogs
      'https://www.entrepreneur.com/latest.rss',
      'https://www.forbes.com/entrepreneurs/feed/',
      'https://blog.hubspot.com/marketing/rss.xml',

      // Small Business
      'https://www.sba.gov/rss',
      'https://smallbiztrends.com/feed',

      // Tech & Startup News
      'https://techcrunch.com/feed/',
      'https://www.producthunt.com/feed',

      // Marketing & Growth
      'https://growthhackers.com/feed',
      'https://www.copyblogger.com/feed/'
    ];
  }

  // Monitor all RSS feeds for new opportunities
  async scanAllFeeds() {
    console.log(`📡 Scanning ${this.feeds.length} RSS feeds...`);

    const opportunities = [];

    for (const feedUrl of this.feeds) {
      try {
        const items = await this.parseFeed(feedUrl);
        const relevant = this.filterRelevant(items);

        // SAFETY CHECK: Filter out illegal/harmful content
        const safeOpportunities = [];
        for (const opp of relevant) {
          const safetyCheck = await contentSafety.checkContent(
            `${opp.title} ${opp.description}`,
            {
              type: 'rss_opportunity',
              source: feedUrl,
              url: opp.link
            }
          );

          if (safetyCheck.safe) {
            safeOpportunities.push(opp);
          } else {
            console.warn(`  ⚠️  BLOCKED unsafe content from ${feedUrl}`);
          }
        }

        opportunities.push(...safeOpportunities);

        console.log(`  ✓ ${feedUrl}: Found ${safeOpportunities.length} safe opportunities`);
      } catch (error) {
        console.error(`  ✗ Failed to scan ${feedUrl}:`, error.message);
      }
    }

    return opportunities;
  }

  // Parse RSS feed and extract items
  async parseFeed(feedUrl) {
    try {
      const response = await axios.get(feedUrl, {
        headers: {
          'User-Agent': 'Unbound.team RSS Monitor 1.0'
        },
        timeout: 10000
      });

      const $ = cheerio.load(response.data, { xmlMode: true });
      const items = [];

      $('item, entry').each((i, elem) => {
        const $item = $(elem);

        items.push({
          title: $item.find('title').text().trim(),
          link: $item.find('link').text().trim() || $item.find('link').attr('href'),
          description: $item.find('description, summary, content').first().text().trim(),
          pubDate: $item.find('pubDate, published, updated').first().text().trim(),
          author: $item.find('author, dc\\:creator').text().trim(),
          source: feedUrl
        });
      });

      return items;
    } catch (error) {
      console.error(`RSS Parse Error for ${feedUrl}:`, error.message);
      return [];
    }
  }

  // Filter items for relevant opportunities (pain points, questions, problems)
  filterRelevant(items) {
    const painKeywords = [
      'need help',
      'struggling with',
      'how to',
      'problem with',
      'challenge',
      'looking for',
      'advice on',
      'tips for',
      'best way to',
      'stuck on',
      'frustrated',
      'difficult to',
      'can\'t figure out',
      'seeking',
      'recommendations for'
    ];

    const businessKeywords = [
      'business',
      'startup',
      'entrepreneur',
      'growth',
      'scale',
      'marketing',
      'sales',
      'leads',
      'customers',
      'revenue',
      'profit',
      'strategy'
    ];

    return items.filter(item => {
      const text = `${item.title} ${item.description}`.toLowerCase();

      // Must mention business/entrepreneurship
      const hasBusiness = businessKeywords.some(keyword => text.includes(keyword));
      if (!hasBusiness) return false;

      // Must indicate a problem or question
      const hasPain = painKeywords.some(keyword => text.includes(keyword)) ||
                      text.includes('?');

      return hasPain;
    });
  }

  // Analyze opportunity and extract structured data
  async analyzeOpportunity(item) {
    return {
      title: item.title,
      url: item.link,
      source: this.extractDomain(item.source),
      description: item.description.substring(0, 300) + '...',
      publishedAt: item.pubDate,
      author: item.author || 'Unknown',
      painPoints: this.extractPainPoints(item),
      businessArea: this.identifyBusinessArea(item),
      urgency: this.assessUrgency(item),
      fitScore: this.calculateFitScore(item)
    };
  }

  // Extract domain from feed URL
  extractDomain(feedUrl) {
    try {
      const url = new URL(feedUrl);
      return url.hostname.replace('www.', '');
    } catch {
      return feedUrl;
    }
  }

  // Extract pain points from content
  extractPainPoints(item) {
    const text = `${item.title} ${item.description}`;
    const sentences = text.match(/[^.!?]+[.!?]+/g) || [];

    const painSentences = sentences.filter(s => {
      const lower = s.toLowerCase();
      return lower.includes('problem') ||
             lower.includes('challenge') ||
             lower.includes('struggle') ||
             lower.includes('difficult') ||
             lower.includes('help') ||
             lower.includes('?');
    });

    return painSentences.slice(0, 2).map(s => s.trim()).join(' ');
  }

  // Identify business area
  identifyBusinessArea(item) {
    const text = `${item.title} ${item.description}`.toLowerCase();

    const areas = {
      'marketing': ['marketing', 'seo', 'content', 'social media', 'advertising'],
      'sales': ['sales', 'leads', 'customers', 'conversion', 'closing'],
      'product': ['product', 'development', 'features', 'ux', 'design'],
      'growth': ['growth', 'scale', 'scaling', 'expansion', 'users'],
      'operations': ['operations', 'process', 'automation', 'efficiency'],
      'funding': ['funding', 'investment', 'investors', 'capital', 'raise']
    };

    for (const [area, keywords] of Object.entries(areas)) {
      if (keywords.some(keyword => text.includes(keyword))) {
        return area;
      }
    }

    return 'general';
  }

  // Assess urgency based on language
  assessUrgency(item) {
    const text = `${item.title} ${item.description}`.toLowerCase();

    const urgent = ['urgent', 'asap', 'immediately', 'quickly', 'now', 'today'];
    const high = ['need', 'must', 'critical', 'important'];

    if (urgent.some(word => text.includes(word))) return 'urgent';
    if (high.some(word => text.includes(word))) return 'high';
    return 'medium';
  }

  // Calculate fit score (1-10)
  calculateFitScore(item) {
    const text = `${item.title} ${item.description}`.toLowerCase();
    let score = 5;

    // Boost for specific pain points
    if (text.includes('need help') || text.includes('looking for')) score += 2;
    if (text.includes('?')) score += 1;

    // Boost for business context
    if (text.includes('startup') || text.includes('entrepreneur')) score += 1;
    if (text.includes('growth') || text.includes('scale')) score += 1;

    return Math.min(score, 10);
  }

  // Get opportunities discovered today
  async getOpportunitiesToday() {
    const opportunities = await this.scanAllFeeds();
    const analyzed = [];

    for (const item of opportunities) {
      analyzed.push(await this.analyzeOpportunity(item));
    }

    // Sort by fit score
    analyzed.sort((a, b) => b.fitScore - a.fitScore);

    return analyzed;
  }
}

module.exports = new RSSMonitor();
