#!/usr/bin/env node

/**
 * Populate Opportunities Script
 * Scans RSS/Reddit and saves opportunities to scored_opportunities table
 */

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const Parser = require('rss-parser');

// Check for required environment variables
if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_KEY) {
  console.error('❌ Missing SUPABASE_URL or SUPABASE_SERVICE_KEY environment variables');
  console.error('Set these in Railway or create a .env file');
  process.exit(1);
}

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

const parser = new Parser({
  headers: {
    'User-Agent': 'Mozilla/5.0 (compatible; UnboundBot/1.0)'
  }
});

async function scanAndSave() {
  console.log('🤖 Starting opportunity scan...\n');

  const feeds = [
    { name: 'Indie Hackers', url: 'https://www.indiehackers.com/feed' },
    { name: 'Hacker News', url: 'https://news.ycombinator.com/rss' },
    { name: 'Entrepreneur', url: 'https://www.entrepreneur.com/latest.rss' },
    { name: 'TechCrunch', url: 'https://techcrunch.com/feed/' }
  ];

  let totalSaved = 0;

  for (const source of feeds) {
    try {
      console.log(`📡 Scanning ${source.name}...`);
      const feed = await parser.parseURL(source.url);

      for (const item of feed.items.slice(0, 10)) {
        const text = ((item.title || '') + ' ' + (item.contentSnippet || '')).toLowerCase();

        // Detect pain points
        const hasPain = /struggling|problem|issue|challenge|need help|looking for|how to|advice needed|stuck/.test(text);
        const hasBusiness = /startup|business|saas|company|revenue|customer|marketing|sales|growth/.test(text);

        if (hasPain && hasBusiness) {
          // Calculate fit score
          let fitScore = 0;
          if (text.includes('struggling')) fitScore += 20;
          if (text.includes('need help')) fitScore += 15;
          if (text.includes('looking for')) fitScore += 10;
          if (text.includes('revenue')) fitScore += 15;
          if (text.includes('startup')) fitScore += 10;
          if (text.includes('growth')) fitScore += 10;
          fitScore = Math.min(fitScore, 100);

          // Extract domain
          let domain = 'unknown.com';
          try {
            const urlObj = new URL(item.link);
            domain = urlObj.hostname.replace('www.', '');
          } catch {}

          // Save to Supabase
          const { data, error } = await supabase
            .from('scored_opportunities')
            .insert({
              company_name: item.creator || item.author || source.name,
              company_domain: domain,
              overall_score: fitScore,
              signal_strength_score: hasPain ? 80 : 60,
              route_to_outreach: fitScore >= 50,
              priority_tier: fitScore >= 70 ? 'tier_1' : 'tier_2',
              source: source.name,
              opportunity_data: {
                title: item.title,
                url: item.link,
                snippet: (item.contentSnippet || '').substring(0, 200)
              }
            })
            .select();

          if (error) {
            console.log(`  ❌ Error saving: ${error.message}`);
            if (error.code === '42P01') {
              console.log(`  ⚠️  Table 'scored_opportunities' does not exist!`);
              console.log(`  Run this SQL in Supabase:`);
              console.log(`
CREATE TABLE scored_opportunities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  company_name TEXT NOT NULL,
  company_domain TEXT,
  overall_score INTEGER,
  signal_strength_score INTEGER,
  route_to_outreach BOOLEAN DEFAULT FALSE,
  priority_tier TEXT,
  source TEXT,
  opportunity_data JSONB
);
              `);
              process.exit(1);
            }
          } else {
            totalSaved++;
            console.log(`  ✅ Saved: "${item.title.substring(0, 60)}..." (score: ${fitScore})`);
          }
        }
      }
    } catch (err) {
      console.log(`  ❌ Error with ${source.name}: ${err.message}`);
    }
  }

  console.log(`\n✅ Scan complete! Saved ${totalSaved} opportunities to database.`);
  console.log(`Check your dashboard - data should appear now!`);
}

scanAndSave();
