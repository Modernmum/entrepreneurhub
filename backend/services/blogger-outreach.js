// Blogger Outreach Automation - Find and reach out to relevant bloggers
// Build partnerships for word-of-mouth growth on the open web

const axios = require('axios');
const cheerio = require('cheerio');
const { createClient } = require('@supabase/supabase-js');
const orchestrator = require('./ai-orchestrator');
const emailFinder = require('./email-finder');
const contentSafety = require('./content-safety');
require('dotenv').config();

class BloggerOutreach {
  constructor() {
    this.supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_KEY
    );

    // Target blogger niches
    this.targetNiches = [
      'entrepreneurship',
      'startup',
      'small business',
      'solopreneur',
      'indie hacker',
      'side hustle',
      'business growth',
      'marketing automation',
      'AI tools',
      'productivity'
    ];

    // Minimum criteria for blogger partnerships
    this.minCriteria = {
      monthlyVisitors: 1000,      // At least 1k visitors/month
      emailSubscribers: 500,      // At least 500 email subscribers
      postFrequency: 4,           // At least 4 posts/month
      domainAuthority: 20         // At least DA 20
    };

    // Partnership offer
    this.partnership = {
      commission: 0.30,           // 30% recurring commission
      signupBonus: 10,            // $10 per signup
      conversionBonus: 30,        // $30 per conversion
      blogPostBonus: 50           // $50 per blog post about us
    };
  }

  /**
   * Find potential blogger partners
   */
  async findBloggers(niche, limit = 20) {
    console.log(`🔍 Finding bloggers in: ${niche}`);

    const searchQueries = [
      `${niche} blog`,
      `best ${niche} blogs`,
      `${niche} resources`,
      `${niche} newsletter`
    ];

    const bloggers = [];

    for (const query of searchQueries) {
      // Search DuckDuckGo
      const results = await this.searchBlogs(query);
      bloggers.push(...results);

      // Rate limiting
      await this.sleep(2000);
    }

    // Deduplicate by URL
    const unique = this.deduplicateByUrl(bloggers);

    // Analyze each blog
    const analyzed = [];
    for (const blog of unique.slice(0, limit)) {
      const analysis = await this.analyzeBlog(blog.url);
      if (analysis && analysis.score >= 6) {
        analyzed.push({
          ...blog,
          ...analysis
        });
      }

      // Rate limiting
      await this.sleep(1000);
    }

    // Sort by score
    analyzed.sort((a, b) => b.score - a.score);

    console.log(`✅ Found ${analyzed.length} qualified bloggers`);

    return analyzed;
  }

  /**
   * Search for blogs
   */
  async searchBlogs(query) {
    try {
      const response = await axios.post(
        'https://html.duckduckgo.com/html/',
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
        if (i >= 15) return;

        const $result = $(elem);
        const title = $result.find('.result__title').text().trim();
        const url = $result.find('.result__url').text().trim();
        const snippet = $result.find('.result__snippet').text().trim();

        if (title && url && snippet) {
          results.push({
            title,
            url: url.startsWith('http') ? url : `https://${url}`,
            description: snippet
          });
        }
      });

      return results;

    } catch (error) {
      console.error('Blog search failed:', error.message);
      return [];
    }
  }

  /**
   * Analyze blog for partnership fit
   */
  async analyzeBlog(blogUrl) {
    try {
      console.log(`  Analyzing: ${blogUrl}`);

      // Fetch blog homepage
      const response = await axios.get(blogUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; UnboundBot/1.0)'
        },
        timeout: 10000
      });

      const $ = cheerio.load(response.data);

      // Extract blog info
      const blogTitle = $('title').text().trim();
      const blogDescription = $('meta[name="description"]').attr('content') || '';

      // Count recent posts
      const postLinks = $('article a, .post a, .entry a').length;

      // Look for email signup forms
      const hasEmailSignup = $('input[type="email"]').length > 0;

      // Extract niche from content
      const bodyText = $('body').text().toLowerCase();

      // Calculate fit score
      let score = 0;

      // Check niche relevance
      const nicheMatches = this.targetNiches.filter(niche =>
        bodyText.includes(niche.toLowerCase())
      ).length;
      score += nicheMatches * 2;

      // Has email signup
      if (hasEmailSignup) score += 2;

      // Active blog (has posts)
      if (postLinks > 5) score += 2;

      // Quality indicators
      if (blogDescription.length > 50) score += 1;
      if (response.data.length > 20000) score += 1; // Substantial content

      return {
        blogTitle,
        blogDescription,
        blogUrl,
        hasEmailSignup,
        estimatedPosts: postLinks,
        nicheMatches,
        score: Math.min(score, 10),
        analyzedAt: new Date().toISOString()
      };

    } catch (error) {
      console.error(`  Failed to analyze ${blogUrl}:`, error.message);
      return null;
    }
  }

  /**
   * Generate personalized outreach email
   */
  async generateOutreachEmail(blogger) {
    const prompt = `Generate a personalized email to reach out to a blogger for a partnership.

Blogger Details:
- Blog: ${blogger.blogTitle}
- URL: ${blogger.blogUrl}
- Description: ${blogger.blogDescription}
- Niche: ${blogger.nicheMatches} relevant topics

Our Offer:
- 30% recurring commission on all referrals
- $10 per signup, $30 per conversion
- $50 bonus for writing a blog post about us

Context:
We're Unbound.team - an autonomous AI team that solves entrepreneur problems 24/7. We're looking for blogger partners who write about entrepreneurship, startups, and business growth.

Write a SHORT (3-4 paragraphs) email that:
1. Compliments their blog specifically (reference their niche/content)
2. Briefly explains what Unbound.team does
3. Presents the partnership offer clearly
4. Includes a clear call-to-action
5. Sounds genuine and personal (NOT a template)

Subject line and email body:`;

    try {
      const response = await orchestrator.execute('content-generation', prompt);

      return {
        subject: this.extractSubject(response.content),
        body: this.extractBody(response.content),
        generatedAt: new Date().toISOString()
      };

    } catch (error) {
      console.error('Failed to generate outreach email:', error.message);
      return null;
    }
  }

  /**
   * Extract subject line from AI response
   */
  extractSubject(content) {
    const subjectMatch = content.match(/subject:?\s*(.+)/i);
    if (subjectMatch) {
      return subjectMatch[1].trim().replace(/^["']|["']$/g, '');
    }
    return 'Partnership Opportunity: Unbound.team';
  }

  /**
   * Extract email body from AI response
   */
  extractBody(content) {
    // Remove subject line
    const body = content.replace(/subject:?\s*.+/i, '').trim();
    return body;
  }

  /**
   * Find contact email for blogger
   */
  async findBloggerEmail(blogUrl) {
    const email = await emailFinder.findEmail(blogUrl);
    return email;
  }

  /**
   * Create outreach campaign for a niche
   */
  async createCampaign(niche, limit = 10) {
    console.log(`📧 Creating outreach campaign for: ${niche}`);

    // Find bloggers
    const bloggers = await this.findBloggers(niche, limit);

    if (bloggers.length === 0) {
      console.log('No qualified bloggers found');
      return { bloggers: [], outreach: [] };
    }

    // Generate outreach for each blogger
    const outreach = [];

    for (const blogger of bloggers) {
      // Safety check
      const safetyCheck = await contentSafety.checkContent(
        `${blogger.blogTitle} ${blogger.blogDescription}`,
        {
          type: 'blogger_outreach',
          url: blogger.blogUrl
        }
      );

      if (!safetyCheck.safe) {
        console.warn(`  ⚠️  Skipping unsafe blogger: ${blogger.blogUrl}`);
        continue;
      }

      // Find email
      const email = await this.findBloggerEmail(blogger.blogUrl);

      if (!email) {
        console.log(`  → No email found for ${blogger.blogUrl}`);
        continue;
      }

      // Generate personalized email
      const emailContent = await this.generateOutreachEmail(blogger);

      if (!emailContent) {
        console.log(`  → Failed to generate email for ${blogger.blogUrl}`);
        continue;
      }

      outreach.push({
        blogger,
        email,
        emailContent,
        status: 'ready',
        createdAt: new Date().toISOString()
      });

      console.log(`  ✓ Outreach ready for ${blogger.blogTitle} (${email})`);

      // Rate limiting
      await this.sleep(2000);
    }

    // Save campaign to database
    await this.saveCampaign(niche, outreach);

    console.log(`✅ Campaign created: ${outreach.length} outreach emails ready`);

    return {
      niche,
      bloggers,
      outreach,
      summary: {
        bloggersFound: bloggers.length,
        emailsFound: outreach.length,
        readyToSend: outreach.filter(o => o.status === 'ready').length
      }
    };
  }

  /**
   * Save campaign to database
   */
  async saveCampaign(niche, outreach) {
    for (const item of outreach) {
      await this.supabase
        .from('outreach_campaigns')
        .insert({
          niche,
          blog_url: item.blogger.blogUrl,
          blog_title: item.blogger.blogTitle,
          contact_email: item.email,
          email_subject: item.emailContent.subject,
          email_body: item.emailContent.body,
          status: item.status,
          fit_score: item.blogger.score,
          created_at: item.createdAt,
          metadata: {
            blogger: item.blogger,
            emailContent: item.emailContent
          }
        });
    }
  }

  /**
   * Get outreach campaigns ready to send
   */
  async getReadyToSend(limit = 20) {
    const { data } = await this.supabase
      .from('outreach_campaigns')
      .select('*')
      .eq('status', 'ready')
      .order('fit_score', { ascending: false })
      .limit(limit);

    return data || [];
  }

  /**
   * Mark outreach as sent
   */
  async markAsSent(campaignId) {
    await this.supabase
      .from('outreach_campaigns')
      .update({
        status: 'sent',
        sent_at: new Date().toISOString()
      })
      .eq('id', campaignId);
  }

  /**
   * Track response from blogger
   */
  async trackResponse(campaignId, responseType, notes = null) {
    // responseType: 'interested', 'not_interested', 'partnership_started', 'no_response'

    await this.supabase
      .from('outreach_campaigns')
      .update({
        status: responseType,
        response_received_at: new Date().toISOString(),
        response_notes: notes
      })
      .eq('id', campaignId);

    console.log(`✅ Tracked response: ${responseType}`);
  }

  /**
   * Deduplicate bloggers by URL
   */
  deduplicateByUrl(bloggers) {
    const seen = new Set();
    return bloggers.filter(b => {
      if (seen.has(b.url)) return false;
      seen.add(b.url);
      return true;
    });
  }

  /**
   * Helper: sleep
   */
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

module.exports = new BloggerOutreach();
