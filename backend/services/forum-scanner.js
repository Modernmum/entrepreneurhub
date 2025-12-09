const { createClient } = require('@supabase/supabase-js');

class ForumScanner {
  constructor() {
    this.supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_KEY
    );

    this.forums = [
      { name: 'Indie Hackers', url: 'https://www.indiehackers.com' },
      { name: 'Reddit r/startups', url: 'https://reddit.com/r/startups' },
      { name: 'Reddit r/SaaS', url: 'https://reddit.com/r/SaaS' },
      { name: 'Hacker News', url: 'https://news.ycombinator.com' }
    ];
  }

  async scanAllForums() {
    console.log('🔍 Scanning forums for opportunities...');
    const opportunities = [];

    try {
      // Mock forum opportunities
      const mockOpportunities = [
        {
          title: 'Struggling with lead generation',
          forum: 'Indie Hackers',
          url: 'https://www.indiehackers.com/post/example-1',
          author: 'startup_founder_123',
          pain_point: 'Not getting enough qualified leads',
          business_area: 'sales',
          urgency: 'urgent',
          fit_score: 9,
          engagement: 15
        },
        {
          title: 'Looking for analytics solution',
          forum: 'Reddit r/SaaS',
          url: 'https://reddit.com/r/saas/example',
          author: 'saas_builder',
          pain_point: 'Need better customer analytics',
          business_area: 'product',
          urgency: 'medium',
          fit_score: 7,
          engagement: 8
        },
        {
          title: 'How to automate content creation?',
          forum: 'Hacker News',
          url: 'https://news.ycombinator.com/item?id=example',
          author: 'content_creator',
          pain_point: 'Content creation taking too much time',
          business_area: 'marketing',
          urgency: 'high',
          fit_score: 8,
          engagement: 23
        }
      ];

      // Save to database
      for (const opp of mockOpportunities) {
        const { data, error } = await this.supabase
          .from('forum_opportunities')
          .insert({
            title: opp.title,
            forum: opp.forum,
            url: opp.url,
            author: opp.author,
            pain_point: opp.pain_point,
            business_area: opp.business_area,
            urgency: opp.urgency,
            fit_score: opp.fit_score,
            engagement_score: opp.engagement,
            scanned_at: new Date().toISOString()
          })
          .select();

        if (!error && data) {
          opportunities.push(data[0]);
        }
      }

      console.log(`✅ Found ${opportunities.length} opportunities from forums`);
      return opportunities;
    } catch (error) {
      console.error('❌ Forum scan error:', error);
      return [];
    }
  }

  async getRecentOpportunities(limit = 50) {
    try {
      const { data, error } = await this.supabase
        .from('forum_opportunities')
        .select('*')
        .order('scanned_at', { ascending: false })
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
        .from('forum_opportunities')
        .select('*')
        .gte('fit_score', 8)
        .eq('urgency', 'urgent')
        .order('engagement_score', { ascending: false })
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
