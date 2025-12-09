const { createClient } = require('@supabase/supabase-js');
const Parser = require('rss-parser');

class RSSMonitor {
  constructor() {
    this.supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_KEY
    );
    this.parser = new Parser({
      timeout: 10000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; UnboundBot/1.0; +https://unbound.team)',
        'Accept': 'application/rss+xml, application/xml, text/xml, */*'
      }
    });

    // More reliable RSS feeds for entrepreneur content
    this.feeds = [
      { url: 'https://feeds.feedburner.com/entrepreneur/latest', name: 'Entrepreneur' },
      { url: 'https://www.smartpassiveincome.com/feed/', name: 'Smart Passive Income' },
      { url: 'https://blog.hubspot.com/marketing/rss.xml', name: 'HubSpot Marketing' },
      { url: 'https://copyblogger.com/feed/', name: 'Copyblogger' },
      { url: 'https://www.groovehq.com/blog/feed', name: 'Groove Blog' },
      { url: 'https://buffer.com/resources/feed/', name: 'Buffer Blog' },
      { url: 'https://neilpatel.com/feed/', name: 'Neil Patel' },
      { url: 'https://www.searchenginejournal.com/feed/', name: 'Search Engine Journal' }
    ];
  }

  async scanAllFeeds() {
    console.log('🔍 Scanning RSS feeds for opportunities...');
    const opportunities = [];

    try {
      for (const feedConfig of this.feeds) {
        try {
          console.log(`📡 Fetching ${feedConfig.name}...`);
          const feed = await this.parser.parseURL(feedConfig.url);

          // Analyze recent items (last 15)
          const recentItems = feed.items.slice(0, 15);
          console.log(`   Found ${recentItems.length} items in ${feedConfig.name}`);

          for (const item of recentItems) {
            const opportunity = this.analyzeItem(item, feedConfig.name);
            if (opportunity) {
              // Check for duplicates first
              const { data: existing } = await this.supabase
                .from('scored_opportunities')
                .select('id')
                .eq('company_domain', this.extractDomain(item.link))
                .eq('company_name', opportunity.title.substring(0, 100))
                .limit(1);

              if (existing && existing.length > 0) {
                continue; // Skip duplicate
              }

              // Save to database with more data
              const { data, error } = await this.supabase
                .from('scored_opportunities')
                .insert({
                  company_name: opportunity.title.substring(0, 255),
                  company_domain: this.extractDomain(item.link),
                  overall_score: opportunity.fit_score * 10,
                  signal_strength_score: opportunity.urgency === 'high' ? 80 : 50,
                  route_to_outreach: opportunity.fit_score >= 7,
                  priority_tier: opportunity.fit_score >= 8 ? 'tier_1' : 'tier_2',
                  source: 'rss',
                  opportunity_data: {
                    source_feed: feedConfig.name,
                    url: item.link,
                    published: item.pubDate || item.isoDate,
                    pain_point: opportunity.pain_point,
                    business_area: opportunity.business_area,
                    content_preview: (item.contentSnippet || '').substring(0, 500)
                  }
                })
                .select();

              if (!error && data) {
                opportunities.push(data[0]);
                console.log(`   ✅ Saved: ${opportunity.title.substring(0, 50)}...`);
              }
            }
          }
        } catch (error) {
          console.error(`Error parsing feed ${feedConfig.name}:`, error.message);
        }
      }

      console.log(`✅ Found ${opportunities.length} new opportunities from RSS feeds`);
      return opportunities;
    } catch (error) {
      console.error('❌ RSS scan error:', error);
      return [];
    }
  }

  analyzeItem(item, sourceName) {
    const title = (item.title || '').toLowerCase();
    const content = (item.contentSnippet || item.content || '').toLowerCase();
    const text = title + ' ' + content;

    // Look for pain points and business needs - expanded keywords
    const painKeywords = [
      'struggling', 'difficult', 'problem', 'issue', 'challenge',
      'need help', 'looking for', 'how to', 'cant figure',
      'frustrat', 'painful', 'slow', 'broken', 'fail',
      'mistake', 'wrong', 'avoid', 'stop', 'fix',
      'improve', 'better', 'optimize', 'increase', 'boost',
      'strategy', 'tips', 'guide', 'secrets', 'ways to'
    ];

    const businessKeywords = [
      'startup', 'business', 'saas', 'company', 'revenue',
      'customer', 'marketing', 'sales', 'growth', 'scale',
      'leads', 'conversion', 'traffic', 'email', 'outreach',
      'clients', 'prospects', 'pipeline', 'funnel', 'roi',
      'entrepreneur', 'founder', 'agency', 'freelance', 'consulting'
    ];

    // Action-oriented keywords (people looking for solutions)
    const actionKeywords = [
      'get more', 'find', 'acquire', 'generate', 'build',
      'create', 'launch', 'start', 'grow', 'automate'
    ];

    let painScore = 0;
    let businessScore = 0;
    let actionScore = 0;

    painKeywords.forEach(keyword => {
      if (text.includes(keyword)) painScore++;
    });

    businessKeywords.forEach(keyword => {
      if (text.includes(keyword)) businessScore++;
    });

    actionKeywords.forEach(keyword => {
      if (text.includes(keyword)) actionScore++;
    });

    // More lenient matching - business content from these feeds is usually relevant
    const totalScore = painScore + businessScore + actionScore;

    if (totalScore >= 3 || businessScore >= 2) {
      const fitScore = Math.min(10, Math.ceil(totalScore / 2) + 3);

      return {
        title: item.title,
        source: sourceName,
        url: item.link,
        pain_point: this.extractPainPoint(text),
        business_area: this.detectBusinessArea(text),
        urgency: painScore >= 2 ? 'high' : (actionScore >= 2 ? 'high' : 'medium'),
        fit_score: fitScore
      };
    }

    return null;
  }

  extractPainPoint(text) {
    if (text.includes('struggling')) return 'Facing operational challenges';
    if (text.includes('need help')) return 'Seeking assistance';
    if (text.includes('looking for')) return 'Actively searching for solutions';
    if (text.includes('how to')) return 'Knowledge gap';
    return 'General business challenge';
  }

  detectBusinessArea(text) {
    if (text.includes('marketing') || text.includes('customer acquisition')) return 'marketing';
    if (text.includes('sales') || text.includes('revenue')) return 'sales';
    if (text.includes('product') || text.includes('development')) return 'product';
    if (text.includes('operations') || text.includes('workflow')) return 'operations';
    if (text.includes('growth') || text.includes('scale')) return 'growth';
    return 'general';
  }

  extractDomain(url) {
    try {
      const urlObj = new URL(url);
      return urlObj.hostname.replace('www.', '');
    } catch {
      return 'unknown.com';
    }
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
      console.error('Error fetching RSS opportunities:', error);
      return [];
    }
  }
}

module.exports = RSSMonitor;
