// Manual Lead Generation Trigger
// Call this endpoint to generate leads on-demand

const rssMonitor = require('../services/rss-monitor');
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_KEY
);

module.exports = async (req, res) => {
  try {
    console.log('🔍 Manual lead generation triggered');

    // Scan RSS feeds for opportunities
    const opportunities = await rssMonitor.scanAllFeeds();
    console.log(`   Found ${opportunities.length} opportunities from RSS feeds`);

    if (opportunities.length === 0) {
      return res.json({
        success: true,
        message: 'No new opportunities found',
        opportunities: []
      });
    }

    // Save to database
    const saved = [];
    for (const opp of opportunities) {
      const { data, error } = await supabase
        .from('discovered_opportunities')
        .insert({
          source: opp.source || 'rss-feed',
          source_url: opp.link,
          title: opp.title,
          description: opp.description,
          business_area: opp.businessArea || 'General',
          pain_points: opp.painPoints,
          urgency_level: opp.urgency || 'medium',
          fit_score: opp.fitScore || 5,
          metadata: {
            author: opp.author,
            pubDate: opp.pubDate
          },
          status: 'new'
        })
        .select()
        .single();

      if (!error && data) {
        saved.push(data);
      } else if (error) {
        console.error('Error saving opportunity:', error.message);
      }
    }

    console.log(`   ✅ Saved ${saved.length} opportunities to database`);

    res.json({
      success: true,
      message: `Generated ${saved.length} new leads`,
      opportunities: saved,
      summary: {
        total_found: opportunities.length,
        total_saved: saved.length,
        sources: [...new Set(opportunities.map(o => o.source))]
      }
    });

  } catch (error) {
    console.error('❌ Lead generation error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};
