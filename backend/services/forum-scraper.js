// Forum Scraper - Finds entrepreneur questions on indie forums
// Scrapes forums for problems, questions, and pain points

const axios = require('axios');
const cheerio = require('cheerio');
const contentSafety = require('./content-safety');

class ForumScraper {
  constructor() {
    // Indie forums and communities (not Big Tech platforms)
    this.forums = {
      reddit: {
        name: 'Reddit',
        subreddits: [
          'Entrepreneur',
          'startups',
          'smallbusiness',
          'Business_Ideas',
          'SaaS',
          'IndieBiz',
          'EntrepreneurRideAlong',
          'IMadeThis'
        ]
      },
      indieHackers: {
        name: 'Indie Hackers',
        url: 'https://www.indiehackers.com'
      }
    };
  }

  // Scrape all forums for questions and problems
  async scrapeAllForums(keywords = []) {
    console.log('🔍 Scraping forums for entrepreneur questions...');

    const results = [];

    // Scrape Reddit
    const redditResults = await this.scrapeReddit(keywords);
    results.push(...redditResults);

    console.log(`✓ Found ${results.length} total forum posts`);

    return results;
  }

  // Scrape Reddit for questions (using JSON API)
  async scrapeReddit(keywords = []) {
    const posts = [];

    for (const subreddit of this.forums.reddit.subreddits) {
      try {
        // Search for questions (posts with ?)
        const searchUrl = `https://www.reddit.com/r/${subreddit}/search.json?q=?&restrict_sr=1&sort=new&limit=25`;

        const response = await axios.get(searchUrl, {
          headers: {
            'User-Agent': 'Unbound.team Forum Monitor 1.0'
          },
          timeout: 10000
        });

        const data = response.data?.data?.children || [];

        for (const post of data) {
          const postData = post.data;

          // Filter for business/entrepreneur related
          if (this.isBusinessRelated(postData.title, postData.selftext)) {
            posts.push({
              id: postData.id,
              title: postData.title,
              text: postData.selftext,
              author: postData.author,
              subreddit: subreddit,
              url: `https://reddit.com${postData.permalink}`,
              score: postData.score,
              numComments: postData.num_comments,
              createdAt: new Date(postData.created_utc * 1000),
              source: 'Reddit',
              painPoints: this.extractPainPoints(postData.title, postData.selftext),
              businessArea: this.identifyBusinessArea(postData.title, postData.selftext),
              fitScore: this.calculateFitScore(postData),
              urgency: this.assessUrgency(postData.title, postData.selftext)
            });
          }
        }

        console.log(`  ✓ r/${subreddit}: ${posts.filter(p => p.subreddit === subreddit).length} posts`);

        // Rate limiting - be respectful
        await this.sleep(1000);

      } catch (error) {
        console.error(`  ✗ Failed to scrape r/${subreddit}:`, error.message);
      }
    }

    // SAFETY CHECK: Filter out illegal/harmful content before returning
    console.log(`\n🔒 Running safety checks on ${posts.length} posts...`);
    const safePosts = [];
    for (const post of posts) {
      const safetyCheck = await contentSafety.checkContent(
        `${post.title} ${post.text}`,
        {
          type: 'forum_post',
          source: 'reddit',
          url: post.url,
          subreddit: post.subreddit
        }
      );

      if (safetyCheck.safe) {
        safePosts.push(post);
      } else {
        console.warn(`  ⚠️  BLOCKED unsafe content from r/${post.subreddit}`);
      }
    }

    console.log(`✅ ${safePosts.length}/${posts.length} posts passed safety checks\n`);

    return safePosts;
  }

  // Check if post is business/entrepreneur related
  isBusinessRelated(title, text) {
    const combined = `${title} ${text}`.toLowerCase();

    const businessKeywords = [
      'business',
      'startup',
      'entrepreneur',
      'company',
      'revenue',
      'customer',
      'sales',
      'marketing',
      'product',
      'saas',
      'growth',
      'scale',
      'founder',
      'launch'
    ];

    return businessKeywords.some(keyword => combined.includes(keyword));
  }

  // Extract pain points from post
  extractPainPoints(title, text) {
    const combined = `${title} ${text}`;
    const sentences = combined.match(/[^.!?]+[.!?]+/g) || [];

    const painIndicators = [
      'problem',
      'issue',
      'challenge',
      'struggle',
      'difficult',
      'hard to',
      'can\'t',
      'stuck',
      'frustrated',
      'help',
      'advice',
      'how do i',
      'how to',
      'need to',
      'looking for'
    ];

    const painSentences = sentences.filter(s => {
      const lower = s.toLowerCase();
      return painIndicators.some(indicator => lower.includes(indicator));
    });

    return painSentences.slice(0, 3).map(s => s.trim()).join(' | ');
  }

  // Identify business area
  identifyBusinessArea(title, text) {
    const combined = `${title} ${text}`.toLowerCase();

    const areas = {
      'lead-generation': ['leads', 'prospects', 'lead generation', 'find customers'],
      'marketing': ['marketing', 'seo', 'content', 'social media', 'advertising', 'brand'],
      'sales': ['sales', 'closing', 'conversion', 'outreach', 'pitch'],
      'product': ['product', 'development', 'features', 'mvp', 'build', 'launch'],
      'growth': ['growth', 'scale', 'scaling', 'users', 'traction'],
      'funding': ['funding', 'investment', 'investors', 'capital', 'raise', 'venture'],
      'operations': ['operations', 'process', 'automation', 'efficiency', 'workflow'],
      'strategy': ['strategy', 'business model', 'monetization', 'pivot', 'direction']
    };

    for (const [area, keywords] of Object.entries(areas)) {
      if (keywords.some(keyword => combined.includes(keyword))) {
        return area;
      }
    }

    return 'general';
  }

  // Calculate fit score (1-10)
  calculateFitScore(post) {
    let score = 5; // Base score

    const text = `${post.title} ${post.selftext}`.toLowerCase();

    // Has a question
    if (text.includes('?')) score += 1;

    // Expressing clear pain/need
    if (text.includes('help') || text.includes('advice') || text.includes('need')) score += 1;

    // Engagement (comments/upvotes indicate others care)
    if (post.num_comments > 5) score += 1;
    if (post.score > 10) score += 1;

    // Business context
    if (text.includes('startup') || text.includes('entrepreneur')) score += 1;

    // Urgency
    if (text.includes('urgent') || text.includes('asap') || text.includes('quickly')) score += 1;

    return Math.min(score, 10);
  }

  // Assess urgency
  assessUrgency(title, text) {
    const combined = `${title} ${text}`.toLowerCase();

    const urgent = ['urgent', 'asap', 'immediately', 'quickly', 'now', 'today', 'help!'];
    const high = ['need', 'must', 'critical', 'important', 'soon'];

    if (urgent.some(word => combined.includes(word))) return 'urgent';
    if (high.some(word => combined.includes(word))) return 'high';
    return 'medium';
  }

  // Get questions from today
  async getQuestionsToday() {
    const allPosts = await this.scrapeAllForums();

    // Filter for posts from last 24 hours
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const recent = allPosts.filter(post => post.createdAt > oneDayAgo);

    // Sort by fit score
    recent.sort((a, b) => b.fitScore - a.fitScore);

    return recent;
  }

  // Search forums for specific keywords
  async searchForums(keywords) {
    const posts = [];

    for (const subreddit of this.forums.reddit.subreddits) {
      try {
        const query = keywords.join(' OR ');
        const searchUrl = `https://www.reddit.com/r/${subreddit}/search.json?q=${encodeURIComponent(query)}&restrict_sr=1&sort=new&limit=25`;

        const response = await axios.get(searchUrl, {
          headers: {
            'User-Agent': 'Unbound.team Forum Monitor 1.0'
          },
          timeout: 10000
        });

        const data = response.data?.data?.children || [];

        for (const post of data) {
          const postData = post.data;

          posts.push({
            id: postData.id,
            title: postData.title,
            text: postData.selftext,
            author: postData.author,
            subreddit: subreddit,
            url: `https://reddit.com${postData.permalink}`,
            score: postData.score,
            numComments: postData.num_comments,
            createdAt: new Date(postData.created_utc * 1000),
            source: 'Reddit',
            painPoints: this.extractPainPoints(postData.title, postData.selftext),
            businessArea: this.identifyBusinessArea(postData.title, postData.selftext),
            fitScore: this.calculateFitScore(postData),
            urgency: this.assessUrgency(postData.title, postData.selftext)
          });
        }

        await this.sleep(1000);

      } catch (error) {
        console.error(`Failed to search r/${subreddit}:`, error.message);
      }
    }

    // Sort by fit score
    posts.sort((a, b) => b.fitScore - a.fitScore);

    return posts;
  }

  // Helper: sleep for rate limiting
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

module.exports = new ForumScraper();
