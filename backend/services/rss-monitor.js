const { createClient } = require('@supabase/supabase-js');

class RSSMonitor {
  constructor() {
    this.supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_KEY
    );

    this.feeds = [
      'https://www.indiehackers.com/feed',
      'https://news.ycombinator.com/rss',
      'https://www.entrepreneur.com/latest.rss',
      'https://techcrunch.com/feed/',
      'https://www.reddit.com/r/startups/.rss',
      'https://www.reddit.com/r/Entrepreneur/.rss'
    ];
  }

  async scanAllFeeds() {
    console.log('🔍 Scanning RSS feeds for opportunities...');
    const opportunities = [];

    try {
      // For now, return mock data since we need an RSS parser library
      // In production, you'd use a library like 'rss-parser'
      const mockOpportunities = [
        {
          title: 'Looking for marketing automation tool',
          source: 'Indie Hackers',
          url: 'https://www.indiehackers.com/post/example',
          pain_point: 'Spending too much time on manual email campaigns',
          business_area: 'marketing',
          urgency: 'high',
          fit_score: 8
        },
        {
          title: 'Need help with customer onboarding',
          source: 'Reddit r/startups',
          url: 'https://reddit.com/r/startups/example',
          pain_point: 'Customer churn during onboarding',
          business_area: 'product',
          urgency: 'medium',
          fit_score: 7
        }
      ];

      // Save to database
      for (const opp of mockOpportunities) {
        const { data, error } = await this.supabase
          .from('rss_opportunities')
          .insert({
            title: opp.title,
            source: opp.source,
            url: opp.url,
            pain_point: opp.pain_point,
            business_area: opp.business_area,
            urgency: opp.urgency,
            fit_score: opp.fit_score,
            scanned_at: new Date().toISOString()
          })
          .select();

        if (!error && data) {
          opportunities.push(data[0]);
        }
      }

      console.log(`✅ Found ${opportunities.length} opportunities from RSS feeds`);
      return opportunities;
    } catch (error) {
      console.error('❌ RSS scan error:', error);
      return [];
    }
  }

  async getRecentOpportunities(limit = 50) {
    try {
      const { data, error } = await this.supabase
        .from('rss_opportunities')
        .select('*')
        .order('scanned_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching RSS opportunities:', error);
      return [];
    }
  }
}

module.exports = RSSMonitor;
