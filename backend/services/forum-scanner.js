const { createClient } = require('@supabase/supabase-js');
const Parser = require('rss-parser');

class ForumScanner {
  constructor() {
    this.supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_KEY
    );
    this.parser = new Parser({
      timeout: 15000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'application/rss+xml, application/xml, text/xml, */*'
      }
    });

    // Reddit and other forum RSS feeds
    this.forums = [
      { name: 'r/startups', url: 'https://www.reddit.com/r/startups/.rss' },
      { name: 'r/Entrepreneur', url: 'https://www.reddit.com/r/Entrepreneur/.rss' },
      { name: 'r/SaaS', url: 'https://www.reddit.com/r/SaaS/.rss' },
      { name: 'r/smallbusiness', url: 'https://www.reddit.com/r/smallbusiness/.rss' },
      { name: 'r/marketing', url: 'https://www.reddit.com/r/marketing/.rss' },
      { name: 'r/digital_marketing', url: 'https://www.reddit.com/r/digital_marketing/.rss' },
      { name: 'r/growthhacking', url: 'https://www.reddit.com/r/growthhacking/.rss' }
    ];
  }

  async scanAllForums() {
    console.log('🔍 Scanning forums for opportunities...');
    const opportunities = [];

    try {
      for (const forum of this.forums) {
        try {
          console.log(`📡 Scanning ${forum.name}...`);
          const feed = await this.parser.parseURL(forum.url);

          // Analyze recent posts (last 20)
          const recentPosts = feed.items.slice(0, 20);
          console.log(`   Found ${recentPosts.length} posts in ${forum.name}`);

          for (const post of recentPosts) {
            const opportunity = this.analyzePost(post, forum.name);
            if (opportunity) {
              // Check for duplicates
              const { data: existing } = await this.supabase
                .from('scored_opportunities')
                .select('id')
                .eq('company_name', opportunity.author)
                .eq('source', 'forum')
                .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()) // Last 24 hours
                .limit(1);

              if (existing && existing.length > 0) {
                continue; // Skip duplicate
              }

              // Save to database with enhanced data
              const { data, error } = await this.supabase
                .from('scored_opportunities')
                .insert({
                  company_name: opportunity.author,
                  company_domain: 'reddit.com',
                  overall_score: opportunity.fit_score * 10,
                  signal_strength_score: opportunity.engagement * 10,
                  route_to_outreach: opportunity.fit_score >= 7,
                  priority_tier: opportunity.urgency === 'urgent' ? 'tier_1' : 'tier_2',
                  source: 'forum',
                  opportunity_data: {
                    forum: forum.name,
                    post_title: opportunity.title,
                    post_url: opportunity.url,
                    pain_point: opportunity.pain_point,
                    business_area: opportunity.business_area,
                    urgency: opportunity.urgency,
                    engagement_score: opportunity.engagement,
                    posted_at: post.pubDate || post.isoDate
                  }
                })
                .select();

              if (!error && data) {
                opportunities.push(data[0]);
                console.log(`   ✅ Saved: ${opportunity.author} (score: ${opportunity.fit_score * 10})`);
              }
            }
          }
        } catch (error) {
          console.error(`Error scanning ${forum.name}:`, error.message);
        }
      }

      console.log(`✅ Found ${opportunities.length} new opportunities from forums`);
      return opportunities;
    } catch (error) {
      console.error('❌ Forum scan error:', error);
      return [];
    }
  }

  analyzePost(post, forumName) {
    const title = (post.title || '').toLowerCase();
    const content = (post.contentSnippet || post.content || '').toLowerCase();
    const text = title + ' ' + content;

    // Pain point indicators
    const painKeywords = [
      'struggling', 'problem', 'issue', 'challenge', 'difficult',
      'need help', 'looking for', 'how do i', 'cant figure',
      'frustrated', 'failing', 'stuck', 'advice needed'
    ];

    // Question indicators (people asking questions are seeking solutions)
    const questionKeywords = [
      'how to', 'how can', 'what is the best', 'any recommendations',
      'does anyone know', 'looking for', 'need', 'want'
    ];

    // Business context
    const businessKeywords = [
      'startup', 'business', 'saas', 'company', 'revenue',
      'customer', 'user', 'client', 'sales', 'marketing',
      'product', 'service', 'growth', 'scale'
    ];

    let painScore = 0;
    let questionScore = 0;
    let businessScore = 0;

    painKeywords.forEach(keyword => {
      if (text.includes(keyword)) painScore++;
    });

    questionKeywords.forEach(keyword => {
      if (text.includes(keyword)) questionScore++;
    });

    businessKeywords.forEach(keyword => {
      if (text.includes(keyword)) businessScore++;
    });

    // Calculate total engagement
    const engagement = Math.min(10, (painScore + questionScore));

    // Only return if there's business context AND (pain OR questions)
    if (businessScore > 0 && (painScore > 0 || questionScore > 0)) {
      const fitScore = Math.min(10, painScore + questionScore + businessScore);

      return {
        title: post.title,
        forum: forumName,
        url: post.link,
        author: this.extractAuthor(post),
        pain_point: this.extractPainPoint(text),
        business_area: this.detectBusinessArea(text),
        urgency: painScore >= 2 ? 'urgent' : (questionScore >= 1 ? 'high' : 'medium'),
        fit_score: fitScore,
        engagement: engagement
      };
    }

    return null;
  }

  extractAuthor(post) {
    if (post.author) return post.author;
    if (post.creator) return post.creator;
    return 'reddit_user';
  }

  extractPainPoint(text) {
    if (text.includes('struggling') || text.includes('stuck')) return 'Facing operational challenges';
    if (text.includes('need help') || text.includes('advice needed')) return 'Seeking expert guidance';
    if (text.includes('looking for') || text.includes('recommendations')) return 'Actively searching for solutions';
    if (text.includes('how to') || text.includes('how can')) return 'Knowledge gap - needs implementation help';
    if (text.includes('failing') || text.includes('not working')) return 'Current solution failing';
    return 'Business challenge or question';
  }

  detectBusinessArea(text) {
    if (text.includes('marketing') || text.includes('customer acquisition') || text.includes('advertising')) return 'marketing';
    if (text.includes('sales') || text.includes('revenue') || text.includes('conversion')) return 'sales';
    if (text.includes('product') || text.includes('development') || text.includes('feature')) return 'product';
    if (text.includes('operations') || text.includes('workflow') || text.includes('automation')) return 'operations';
    if (text.includes('growth') || text.includes('scale') || text.includes('expand')) return 'growth';
    if (text.includes('funding') || text.includes('investor') || text.includes('capital')) return 'funding';
    return 'general';
  }

  async getRecentOpportunities(limit = 50) {
    try {
      const { data, error } = await this.supabase
        .from('scored_opportunities')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching forum opportunities:', error);
      return [];
    }
  }

  async getHighPriorityOpportunities() {
    try {
      const { data, error } = await this.supabase
        .from('scored_opportunities')
        .select('*')
        .gte('overall_score', 70)
        .in('priority_tier', ['tier_1', 'tier_2'])
        .order('overall_score', { ascending: false })
        .limit(20);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching high priority opportunities:', error);
      return [];
    }
  }
}

module.exports = ForumScanner;
