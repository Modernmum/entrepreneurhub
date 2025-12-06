// Manual Lead Generation Trigger
// Call this endpoint to generate leads on-demand

const forumScraper = require('../services/forum-scraper');
const leadScraper = require('../services/lead-scraper');
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_KEY
);

module.exports = async (req, res) => {
  try {
    console.log('🔍 Manual lead generation triggered');

    // Scrape forums for REAL opportunities (Reddit, etc.)
    const forumOpportunities = await forumScraper.scrapeAllForums();
    console.log(`   Found ${forumOpportunities.length} real opportunities from forums`);

    if (forumOpportunities.length === 0) {
      return res.json({
        success: true,
        message: 'No new opportunities found',
        opportunities: []
      });
    }

    // Save to database
    const saved = [];
    const errors = [];
    for (const opp of forumOpportunities) {
      const { data, error} = await supabase
        .from('discovered_opportunities')
        .insert({
          source: opp.source || 'Reddit',
          source_url: opp.url || opp.link,  // Forum scraper uses 'url', RSS uses 'link'
          title: opp.title,
          description: opp.text || opp.description || '',  // Forum scraper uses 'text'
          business_area: opp.businessArea || 'General',
          pain_points: opp.painPoints,
          urgency_level: opp.urgency || 'medium',
          fit_score: opp.fitScore || 5,
          metadata: {
            author: opp.author,
            subreddit: opp.subreddit,
            score: opp.score,
            numComments: opp.numComments
          },
          status: 'new'
        })
        .select()
        .single();

      if (!error && data) {
        saved.push(data);
      } else if (error) {
        console.error('Error saving opportunity:', error.message);
        errors.push({ title: opp.title, error: error.message });
        if (errors.length === 1) console.error('Full error:', error);  // Log first full error
      }
    }

    console.log(`   ✅ Saved ${saved.length} opportunities to database`);

    res.json({
      success: true,
      message: `Generated ${saved.length} new leads`,
      opportunities: saved,
      summary: {
        total_found: forumOpportunities.length,
        total_saved: saved.length,
        total_errors: errors.length,
        sources: [...new Set(forumOpportunities.map(o => o.source))],
        sample_errors: errors.slice(0, 3)  // Show first 3 errors for debugging
      }
    });

  } catch (error) {
    console.error('❌ Lead generation error:', error);
    console.error('   Stack:', error.stack);
    res.status(500).json({
      success: false,
      error: error.message,
      stack: error.stack
    });
  }
};
