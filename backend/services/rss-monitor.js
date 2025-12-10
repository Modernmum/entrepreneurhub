const { createClient } = require('@supabase/supabase-js');
const Parser = require('rss-parser');
const DomainExtractor = require('./domain-extractor');

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
    this.domainExtractor = new DomainExtractor();

    // HIGH-VALUE: Places where real business owners post their startups
    this.businessOwnerFeeds = [
      { url: 'https://www.indiehackers.com/feed.xml', name: 'Indie Hackers', type: 'business_owners' },
      { url: 'https://www.producthunt.com/feed', name: 'Product Hunt', type: 'business_owners' },
    ];

    // CONTENT: Blog feeds for trend/pain point detection (lower priority)
    this.contentFeeds = [
      { url: 'https://feeds.feedburner.com/entrepreneur/latest', name: 'Entrepreneur', type: 'content' },
      { url: 'https://www.smartpassiveincome.com/feed/', name: 'Smart Passive Income', type: 'content' },
      { url: 'https://copyblogger.com/feed/', name: 'Copyblogger', type: 'content' },
      { url: 'https://neilpatel.com/feed/', name: 'Neil Patel', type: 'content' },
    ];

    // Combined feeds
    this.feeds = [...this.businessOwnerFeeds, ...this.contentFeeds];
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
            // Different analysis for business owner feeds vs content feeds
            const isBusinessOwnerFeed = feedConfig.type === 'business_owners';
            const opportunity = isBusinessOwnerFeed
              ? this.analyzeBusinessPost(item, feedConfig.name)
              : this.analyzeItem(item, feedConfig.name);

            if (opportunity) {
              // For business owner feeds, extract the REAL company domain from the page
              let companyDomain = opportunity.company_domain;
              if (isBusinessOwnerFeed && !companyDomain) {
                try {
                  console.log(`   🔍 Extracting real domain for: ${opportunity.company_name || opportunity.title}`);
                  companyDomain = await this.domainExtractor.extractCompanyDomain(item.link, opportunity.company_name);
                } catch (err) {
                  console.log(`   ⚠️  Domain extraction skipped: ${err.message}`);
                }
              }

              // Fallback to extracting from link if no domain found
              const finalDomain = companyDomain || this.extractDomain(item.link);

              // Check for duplicates first
              const { data: existing } = await this.supabase
                .from('scored_opportunities')
                .select('id')
                .eq('company_domain', finalDomain)
                .eq('company_name', (opportunity.company_name || opportunity.title).substring(0, 100))
                .limit(1);

              if (existing && existing.length > 0) {
                continue; // Skip duplicate
              }

              // Business owner posts get higher priority
              const baseScore = isBusinessOwnerFeed ? 70 : opportunity.fit_score * 10;
              const signalStrength = isBusinessOwnerFeed ? 90 : (opportunity.urgency === 'high' ? 80 : 50);

              // Flag if we couldn't get a real domain (platform domain means needs lookup)
              const isPlatformDomain = this.domainExtractor.isPlatformDomain(finalDomain);

              // Save to database with more data
              const { data, error } = await this.supabase
                .from('scored_opportunities')
                .insert({
                  company_name: opportunity.company_name || opportunity.title.substring(0, 255),
                  company_domain: finalDomain,
                  overall_score: baseScore,
                  signal_strength_score: signalStrength,
                  route_to_outreach: isBusinessOwnerFeed || opportunity.fit_score >= 7,
                  priority_tier: isBusinessOwnerFeed ? 'tier_1' : (opportunity.fit_score >= 8 ? 'tier_1' : 'tier_2'),
                  source: isBusinessOwnerFeed ? 'indie_hackers' : 'rss',
                  opportunity_data: {
                    source_feed: feedConfig.name,
                    feed_type: feedConfig.type,
                    url: item.link,
                    published: item.pubDate || item.isoDate,
                    pain_point: opportunity.pain_point,
                    business_area: opportunity.business_area,
                    author: opportunity.author || item.creator || null,
                    content_preview: (item.contentSnippet || '').substring(0, 500),
                    needs_email_lookup: true,  // Flag for email enrichment
                    has_real_domain: !isPlatformDomain,  // Track if we have a real company domain
                    extracted_domain: companyDomain  // Store extracted domain separately
                  }
                })
                .select();

              if (!error && data) {
                opportunities.push(data[0]);
                const icon = isBusinessOwnerFeed ? '🎯' : '✅';
                console.log(`   ${icon} Saved: ${(opportunity.company_name || opportunity.title).substring(0, 50)}...`);
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

  /**
   * Analyze posts from business owner communities (Indie Hackers, Product Hunt)
   * These are ACTUAL BUSINESSES - much higher value than blog content
   */
  analyzeBusinessPost(item, sourceName) {
    const title = (item.title || '').toLowerCase();
    const content = (item.contentSnippet || item.content || '').toLowerCase();
    const text = title + ' ' + content;
    const author = item.creator || item.author || null;

    // Extract company/product name from title
    // Indie Hackers posts often format as "Company Name - description" or just product names
    let companyName = item.title || 'Unknown Business';

    // Try to extract domain if mentioned
    let companyDomain = null;
    const domainMatch = text.match(/(?:https?:\/\/)?(?:www\.)?([a-z0-9-]+\.[a-z]{2,})/i);
    if (domainMatch) {
      companyDomain = domainMatch[1];
    }

    // Business owner signals - these people are actively building/running businesses
    const ownerSignals = [
      'launched', 'built', 'created', 'founded', 'starting',
      'my startup', 'my saas', 'my product', 'my app', 'my business',
      'we launched', 'we built', 'just shipped', 'going live',
      'mrr', 'revenue', 'customers', 'users', 'subscribers',
      'feedback', 'looking for', 'need help', 'struggling',
      'growing', 'scaling', 'marketing', 'sales', 'acquisition'
    ];

    let signalCount = 0;
    ownerSignals.forEach(signal => {
      if (text.includes(signal)) signalCount++;
    });

    // Almost all Indie Hackers posts are from real business owners
    // Product Hunt posts are product launches
    // These are HIGH VALUE leads
    if (signalCount >= 1 || sourceName === 'Indie Hackers' || sourceName === 'Product Hunt') {
      return {
        title: item.title,
        company_name: companyName,
        company_domain: companyDomain,
        author: author,
        source: sourceName,
        url: item.link,
        pain_point: this.extractBusinessPainPoint(text),
        business_area: this.detectBusinessArea(text),
        urgency: signalCount >= 3 ? 'high' : 'medium',
        fit_score: 8, // High baseline for business owner posts
        is_business_owner: true
      };
    }

    return null;
  }

  extractBusinessPainPoint(text) {
    if (text.includes('struggling') || text.includes('hard time')) return 'Facing growth challenges';
    if (text.includes('need help') || text.includes('looking for advice')) return 'Seeking expertise';
    if (text.includes('customer') || text.includes('acquisition')) return 'Customer acquisition challenges';
    if (text.includes('marketing') || text.includes('traffic')) return 'Marketing/visibility challenges';
    if (text.includes('sales') || text.includes('convert')) return 'Sales conversion challenges';
    if (text.includes('scale') || text.includes('grow')) return 'Scaling challenges';
    if (text.includes('launched') || text.includes('new')) return 'Early stage - needs traction';
    return 'Building/growing a business';
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
