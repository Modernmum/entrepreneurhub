// Content Creation System - AI-powered content generation
// Creates blog posts, social media content, email campaigns

const orchestrator = require('./ai-orchestrator');
const contentSafety = require('./content-safety');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

class ContentCreator {
  constructor() {
    this.supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_KEY
    );

    // Content types we support
    this.contentTypes = {
      'blog-post': {
        name: 'Blog Post',
        minWords: 800,
        maxWords: 2000,
        includesSEO: true
      },
      'social-media': {
        name: 'Social Media Posts',
        count: 10,
        platforms: ['LinkedIn', 'Twitter', 'Facebook']
      },
      'email-campaign': {
        name: 'Email Campaign',
        emailCount: 5,
        includesSubjects: true
      },
      'product-description': {
        name: 'Product Description',
        minWords: 150,
        maxWords: 300
      },
      'case-study': {
        name: 'Case Study',
        minWords: 1000,
        maxWords: 1500
      }
    };
  }

  /**
   * Create blog post
   */
  async createBlogPost(params) {
    const { topic, keywords, tone, wordCount, userId } = params;

    console.log(`📝 Creating blog post: ${topic}`);

    // Research the topic first
    const research = await this.researchTopic(topic, keywords);

    // Generate outline
    const outline = await this.generateOutline(topic, keywords, research);

    // Generate full content
    const content = await this.generateBlogContent(topic, keywords, tone, wordCount, outline, research);

    // Optimize for SEO
    const seoOptimized = await this.optimizeSEO(content, keywords);

    // Safety check
    const safetyCheck = await contentSafety.checkContent(seoOptimized.content, {
      type: 'blog_post',
      userId,
      topic
    });

    if (!safetyCheck.safe) {
      throw new Error('Content failed safety check');
    }

    // Save to database
    const saved = await this.saveContent(userId, {
      contentType: 'blog-post',
      topic,
      keywords,
      tone,
      wordCount: this.countWords(seoOptimized.content),
      content: seoOptimized.content,
      seoData: seoOptimized.seoData,
      outline,
      research
    });

    console.log(`✅ Blog post created: ${saved.wordCount} words`);

    return saved;
  }

  /**
   * Research topic using AI
   */
  async researchTopic(topic, keywords) {
    const prompt = `Research the topic: "${topic}"

Keywords to focus on: ${keywords.join(', ')}

Provide:
1. Key points to cover (5-7 main points)
2. Common questions people ask about this topic
3. Current trends and statistics (if applicable)
4. Unique angles or insights

Format as JSON:
{
  "keyPoints": ["...", "..."],
  "commonQuestions": ["...", "..."],
  "trends": ["...", "..."],
  "uniqueAngles": ["...", "..."]
}`;

    try {
      const response = await orchestrator.execute('research', prompt);
      const jsonMatch = response.content.match(/\{[\s\S]*\}/);

      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }

      // Fallback
      return {
        keyPoints: ['Introduction', 'Main benefits', 'How to get started', 'Best practices', 'Conclusion'],
        commonQuestions: [],
        trends: [],
        uniqueAngles: []
      };

    } catch (error) {
      console.error('Research failed:', error.message);
      return null;
    }
  }

  /**
   * Generate content outline
   */
  async generateOutline(topic, keywords, research) {
    const prompt = `Create a detailed blog post outline for: "${topic}"

Keywords: ${keywords.join(', ')}

Key points to cover:
${research?.keyPoints?.map(p => `- ${p}`).join('\n') || ''}

Create an outline with:
- Catchy title
- Introduction hook
- 5-7 main sections with subsections
- Conclusion with CTA

Format as JSON:
{
  "title": "...",
  "introduction": "...",
  "sections": [
    {"heading": "...", "subsections": ["...", "..."]},
    ...
  ],
  "conclusion": "..."
}`;

    try {
      const response = await orchestrator.execute('content-generation', prompt);
      const jsonMatch = response.content.match(/\{[\s\S]*\}/);

      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }

      return null;

    } catch (error) {
      console.error('Outline generation failed:', error.message);
      return null;
    }
  }

  /**
   * Generate full blog content
   */
  async generateBlogContent(topic, keywords, tone, wordCount, outline, research) {
    const prompt = `Write a complete blog post on: "${topic}"

Tone: ${tone}
Target word count: ${wordCount} words
Keywords to include naturally: ${keywords.join(', ')}

Outline:
${JSON.stringify(outline, null, 2)}

Requirements:
- Engaging introduction with a hook
- Well-structured sections with clear headings
- Include examples and actionable advice
- Natural keyword integration
- Strong conclusion with call-to-action
- Write in ${tone} tone
- Target audience: Entrepreneurs and business owners

Write the complete blog post:`;

    try {
      const response = await orchestrator.execute('content-generation', prompt);
      return response.content;

    } catch (error) {
      console.error('Content generation failed:', error.message);
      throw error;
    }
  }

  /**
   * Optimize content for SEO
   */
  async optimizeSEO(content, keywords) {
    const prompt = `Optimize this content for SEO:

Content:
${content.substring(0, 1000)}...

Primary keyword: ${keywords[0]}
Secondary keywords: ${keywords.slice(1).join(', ')}

Provide:
1. SEO-optimized title (60 chars max)
2. Meta description (155 chars max)
3. Suggested slug
4. Focus keyword density check

Format as JSON:
{
  "seoTitle": "...",
  "metaDescription": "...",
  "slug": "...",
  "keywordDensity": "good/needs improvement"
}`;

    try {
      const response = await orchestrator.execute('content-generation', prompt);
      const jsonMatch = response.content.match(/\{[\s\S]*\}/);

      const seoData = jsonMatch ? JSON.parse(jsonMatch[0]) : {
        seoTitle: keywords[0],
        metaDescription: content.substring(0, 155),
        slug: keywords[0].toLowerCase().replace(/\s+/g, '-'),
        keywordDensity: 'unknown'
      };

      return {
        content,
        seoData
      };

    } catch (error) {
      console.error('SEO optimization failed:', error.message);
      return { content, seoData: {} };
    }
  }

  /**
   * Create social media posts
   */
  async createSocialMediaPosts(params) {
    const { topic, platforms, count, tone, userId } = params;

    console.log(`📱 Creating ${count} social media posts: ${topic}`);

    const prompt = `Create ${count} social media posts about: "${topic}"

Platforms: ${platforms.join(', ')}
Tone: ${tone}

Requirements:
- Each post optimized for its platform
- LinkedIn: Professional, 150-200 words
- Twitter: Concise, 280 chars max
- Facebook: Engaging, 100-150 words
- Include relevant hashtags
- Include call-to-action
- Varied angles/approaches

Format as JSON array:
[
  {"platform": "LinkedIn", "content": "...", "hashtags": ["...", "..."]},
  {"platform": "Twitter", "content": "...", "hashtags": ["...", "..."]},
  ...
]`;

    try {
      const response = await orchestrator.execute('content-generation', prompt);
      const jsonMatch = response.content.match(/\[[\s\S]*\]/);

      if (!jsonMatch) {
        throw new Error('Failed to parse social media posts');
      }

      const posts = JSON.parse(jsonMatch[0]);

      // Safety check each post
      for (const post of posts) {
        const safetyCheck = await contentSafety.checkContent(post.content, {
          type: 'social_media',
          platform: post.platform,
          userId
        });

        if (!safetyCheck.safe) {
          throw new Error(`Post failed safety check: ${post.platform}`);
        }
      }

      // Save to database
      const saved = await this.saveContent(userId, {
        contentType: 'social-media',
        topic,
        platforms,
        count: posts.length,
        tone,
        content: posts
      });

      console.log(`✅ Created ${posts.length} social media posts`);

      return saved;

    } catch (error) {
      console.error('Social media generation failed:', error.message);
      throw error;
    }
  }

  /**
   * Create email campaign
   */
  async createEmailCampaign(params) {
    const { goal, audience, emailCount, tone, userId } = params;

    console.log(`📧 Creating ${emailCount}-email campaign for: ${audience}`);

    const prompt = `Create a ${emailCount}-email campaign:

Goal: ${goal}
Target audience: ${audience}
Tone: ${tone}

Create a sequence with:
- Email 1: Introduction/Problem awareness
- Email 2: Solution introduction
- Email 3: Benefits and social proof
- Email 4: Address objections
- Email 5: Strong CTA and urgency

For each email provide:
- Subject line (under 50 chars)
- Preview text
- Email body (150-250 words)
- Call-to-action

Format as JSON array:
[
  {
    "emailNumber": 1,
    "subject": "...",
    "previewText": "...",
    "body": "...",
    "cta": "..."
  },
  ...
]`;

    try {
      const response = await orchestrator.execute('content-generation', prompt);
      const jsonMatch = response.content.match(/\[[\s\S]*\]/);

      if (!jsonMatch) {
        throw new Error('Failed to parse email campaign');
      }

      const emails = JSON.parse(jsonMatch[0]);

      // Safety check each email
      for (const email of emails) {
        const safetyCheck = await contentSafety.checkContent(
          `${email.subject} ${email.body}`,
          { type: 'email_campaign', userId }
        );

        if (!safetyCheck.safe) {
          throw new Error(`Email ${email.emailNumber} failed safety check`);
        }
      }

      // Save to database
      const saved = await this.saveContent(userId, {
        contentType: 'email-campaign',
        goal,
        audience,
        emailCount: emails.length,
        tone,
        content: emails
      });

      console.log(`✅ Created ${emails.length}-email campaign`);

      return saved;

    } catch (error) {
      console.error('Email campaign generation failed:', error.message);
      throw error;
    }
  }

  /**
   * Save content to database
   */
  async saveContent(userId, contentData) {
    const { data, error } = await this.supabase
      .from('generated_content')
      .insert({
        user_id: userId,
        content_type: contentData.contentType,
        status: 'completed',
        created_at: new Date().toISOString(),
        metadata: contentData
      })
      .select()
      .single();

    if (error) {
      console.error('Failed to save content:', error);
      throw new Error('Failed to save content');
    }

    return data;
  }

  /**
   * Count words in text
   */
  countWords(text) {
    return text.trim().split(/\s+/).length;
  }

  /**
   * Get user's generated content
   */
  async getUserContent(userId, contentType = null) {
    let query = this.supabase
      .from('generated_content')
      .select('*')
      .eq('user_id', userId);

    if (contentType) {
      query = query.eq('content_type', contentType);
    }

    const { data } = await query.order('created_at', { ascending: false });

    return data || [];
  }
}

module.exports = new ContentCreator();
