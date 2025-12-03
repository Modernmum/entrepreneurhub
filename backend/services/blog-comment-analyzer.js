// Blog Comment Analyzer - Finds entrepreneur questions in blog comments
// Scrapes comments from indie entrepreneur blogs

const axios = require('axios');
const cheerio = require('cheerio');

class BlogCommentAnalyzer {
  constructor() {
    // Curated list of popular entrepreneur blogs
    this.blogs = [
      {
        name: 'Indie Hackers Blog',
        url: 'https://www.indiehackers.com/blog',
        articleSelector: 'article a',
        commentSelector: '.comment, .comment-body'
      },
      {
        name: 'Nathan Barry',
        url: 'https://nathanbarry.com/blog/',
        articleSelector: 'article a, .post a',
        commentSelector: '.comment, #comments .comment-content'
      },
      {
        name: 'Pat Flynn - Smart Passive Income',
        url: 'https://www.smartpassiveincome.com/blog/',
        articleSelector: 'article h2 a',
        commentSelector: '.comment-content, .comment-text'
      }
    ];
  }

  // Analyze comments across all blogs
  async analyzeAllBlogs() {
    console.log(`📝 Analyzing blog comments across ${this.blogs.length} blogs...`);

    const allComments = [];

    for (const blog of this.blogs) {
      try {
        const comments = await this.analyzeBlog(blog);
        allComments.push(...comments);
        console.log(`  ✓ ${blog.name}: Found ${comments.length} relevant comments`);
      } catch (error) {
        console.error(`  ✗ Failed to analyze ${blog.name}:`, error.message);
      }
    }

    return allComments;
  }

  // Analyze a single blog
  async analyzeBlog(blog) {
    try {
      // Get recent articles
      const articles = await this.getRecentArticles(blog);

      const allComments = [];

      // Scrape comments from each article
      for (const article of articles.slice(0, 5)) { // Top 5 recent articles
        try {
          const comments = await this.scrapeComments(article.url, blog.commentSelector);

          // Filter for questions and pain points
          const relevant = comments.filter(c => this.isRelevant(c));

          allComments.push(...relevant.map(c => ({
            ...c,
            blogName: blog.name,
            articleTitle: article.title,
            articleUrl: article.url
          })));

          // Rate limiting
          await this.sleep(2000);
        } catch (error) {
          console.error(`    Failed to scrape ${article.url}:`, error.message);
        }
      }

      return allComments;
    } catch (error) {
      console.error(`Failed to analyze blog ${blog.name}:`, error.message);
      return [];
    }
  }

  // Get recent articles from blog
  async getRecentArticles(blog) {
    try {
      const response = await axios.get(blog.url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; Unbound.team/1.0)'
        },
        timeout: 10000
      });

      const $ = cheerio.load(response.data);
      const articles = [];

      $(blog.articleSelector).each((i, elem) => {
        const $link = $(elem);
        const href = $link.attr('href');
        const title = $link.text().trim();

        if (href && title && i < 10) { // Top 10 articles
          let fullUrl = href;
          if (!href.startsWith('http')) {
            const baseUrl = new URL(blog.url);
            fullUrl = `${baseUrl.protocol}//${baseUrl.host}${href.startsWith('/') ? href : '/' + href}`;
          }

          articles.push({
            title,
            url: fullUrl
          });
        }
      });

      return articles;
    } catch (error) {
      console.error(`Failed to get articles from ${blog.url}:`, error.message);
      return [];
    }
  }

  // Scrape comments from an article
  async scrapeComments(articleUrl, commentSelector) {
    try {
      const response = await axios.get(articleUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; Unbound.team/1.0)'
        },
        timeout: 10000
      });

      const $ = cheerio.load(response.data);
      const comments = [];

      $(commentSelector).each((i, elem) => {
        const $comment = $(elem);
        const text = $comment.text().trim();
        const author = $comment.find('.comment-author, .author').text().trim() || 'Anonymous';

        if (text && text.length > 20) {
          comments.push({
            text,
            author,
            timestamp: new Date()
          });
        }
      });

      return comments;
    } catch (error) {
      // Many blogs may block scraping or have different structures
      return [];
    }
  }

  // Check if comment is relevant (has question or pain point)
  isRelevant(comment) {
    const text = comment.text.toLowerCase();

    // Must have a question or express need
    const hasQuestion = text.includes('?');

    const needIndicators = [
      'need help',
      'struggling with',
      'how do i',
      'how can i',
      'looking for',
      'any advice',
      'tips on',
      'best way to',
      'stuck on',
      'problem with',
      'challenge with',
      'difficult to'
    ];

    const hasNeed = needIndicators.some(indicator => text.includes(indicator));

    // Must mention business context
    const businessKeywords = [
      'business',
      'startup',
      'entrepreneur',
      'saas',
      'product',
      'revenue',
      'customer',
      'growth',
      'marketing',
      'sales'
    ];

    const hasBusiness = businessKeywords.some(keyword => text.includes(keyword));

    return (hasQuestion || hasNeed) && hasBusiness;
  }

  // Analyze comment to extract structured data
  analyzeComment(comment) {
    return {
      author: comment.author,
      text: comment.text,
      blogName: comment.blogName,
      articleTitle: comment.articleTitle,
      articleUrl: comment.articleUrl,
      painPoints: this.extractPainPoints(comment.text),
      businessArea: this.identifyBusinessArea(comment.text),
      urgency: this.assessUrgency(comment.text),
      fitScore: this.calculateFitScore(comment)
    };
  }

  // Extract pain points
  extractPainPoints(text) {
    const sentences = text.match(/[^.!?]+[.!?]+/g) || [];

    const painIndicators = [
      'problem',
      'issue',
      'challenge',
      'struggle',
      'difficult',
      'stuck',
      'help',
      'advice'
    ];

    const painSentences = sentences.filter(s => {
      const lower = s.toLowerCase();
      return painIndicators.some(indicator => lower.includes(indicator));
    });

    return painSentences.slice(0, 2).map(s => s.trim()).join(' | ');
  }

  // Identify business area
  identifyBusinessArea(text) {
    const lower = text.toLowerCase();

    const areas = {
      'marketing': ['marketing', 'seo', 'content', 'traffic', 'audience'],
      'sales': ['sales', 'leads', 'customers', 'conversion'],
      'product': ['product', 'feature', 'build', 'development'],
      'growth': ['growth', 'scale', 'traction', 'users'],
      'monetization': ['revenue', 'pricing', 'monetize', 'make money']
    };

    for (const [area, keywords] of Object.entries(areas)) {
      if (keywords.some(keyword => lower.includes(keyword))) {
        return area;
      }
    }

    return 'general';
  }

  // Assess urgency
  assessUrgency(text) {
    const lower = text.toLowerCase();

    if (lower.includes('urgent') || lower.includes('asap') || lower.includes('immediately')) {
      return 'urgent';
    }

    if (lower.includes('need') || lower.includes('important') || lower.includes('struggling')) {
      return 'high';
    }

    return 'medium';
  }

  // Calculate fit score (1-10)
  calculateFitScore(comment) {
    let score = 5;

    const text = comment.text.toLowerCase();

    // Has clear question
    if (text.includes('?')) score += 1;

    // Expresses clear pain/need
    if (text.includes('help') || text.includes('advice')) score += 1;
    if (text.includes('struggle') || text.includes('stuck')) score += 1;

    // Business context
    if (text.includes('startup') || text.includes('entrepreneur')) score += 1;

    // Length indicates thoughtful question
    if (text.length > 200) score += 1;

    return Math.min(score, 10);
  }

  // Get all relevant comments
  async getAllComments() {
    const comments = await this.analyzeAllBlogs();

    // Analyze each comment
    const analyzed = comments.map(c => this.analyzeComment(c));

    // Sort by fit score
    analyzed.sort((a, b) => b.fitScore - a.fitScore);

    return analyzed;
  }

  // Helper: sleep for rate limiting
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

module.exports = new BlogCommentAnalyzer();
