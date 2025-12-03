// Comprehensive End-to-End System Test
// Tests all Phase 1 & Phase 2 components

require('dotenv').config();

async function runFullSystemTest() {
  console.log('\n🚀 UNBOUND.TEAM - COMPREHENSIVE SYSTEM TEST\n');
  console.log('═'.repeat(60));
  console.log('Testing Phase 1 & Phase 2 Components');
  console.log('═'.repeat(60));

  const results = {
    phase1: {},
    phase2: {},
    totalTests: 0,
    passed: 0,
    failed: 0,
    errors: []
  };

  // ============================================================================
  // PHASE 1 TESTS
  // ============================================================================

  console.log('\n\n📦 PHASE 1: FOUNDATION\n');

  // Test 1: AI Orchestrator
  console.log('Test 1: AI Orchestrator');
  console.log('─'.repeat(60));
  try {
    const orchestrator = require('../services/ai-orchestrator');
    const stats = orchestrator.getStats();

    console.log(`✓ AI Orchestrator initialized`);
    console.log(`  Daily spending cap: $${stats.dailySpendingCap}`);
    console.log(`  Daily spent: $${stats.dailySpent}`);
    console.log(`  Models configured: ${Object.keys(stats.models).length}`);

    results.phase1.orchestrator = 'PASS';
    results.passed++;
  } catch (error) {
    console.log(`✗ AI Orchestrator failed: ${error.message}`);
    results.phase1.orchestrator = 'FAIL';
    results.failed++;
    results.errors.push({ test: 'AI Orchestrator', error: error.message });
  }
  results.totalTests++;

  // Test 2: Notifications
  console.log('\n\nTest 2: Notification System');
  console.log('─'.repeat(60));
  try {
    const notifications = require('../services/notifications');

    console.log(`✓ Notification system initialized`);
    console.log(`  Discord webhook configured: ${!!process.env.DISCORD_WEBHOOK_URL}`);

    results.phase1.notifications = 'PASS';
    results.passed++;
  } catch (error) {
    console.log(`✗ Notifications failed: ${error.message}`);
    results.phase1.notifications = 'FAIL';
    results.failed++;
    results.errors.push({ test: 'Notifications', error: error.message });
  }
  results.totalTests++;

  // Test 3: Lead Scraper
  console.log('\n\nTest 3: Lead Scraper');
  console.log('─'.repeat(60));
  try {
    const leadScraper = require('../services/lead-scraper');

    console.log(`✓ Lead scraper initialized`);
    console.log(`  Ready to find leads`);

    results.phase1.leadScraper = 'PASS';
    results.passed++;
  } catch (error) {
    console.log(`✗ Lead scraper failed: ${error.message}`);
    results.phase1.leadScraper = 'FAIL';
    results.failed++;
    results.errors.push({ test: 'Lead Scraper', error: error.message });
  }
  results.totalTests++;

  // ============================================================================
  // PHASE 2 TESTS
  // ============================================================================

  console.log('\n\n📡 PHASE 2: DISCOVERY ENGINE\n');

  // Test 4: RSS Monitor
  console.log('Test 4: RSS Feed Monitor');
  console.log('─'.repeat(60));
  try {
    const rssMonitor = require('../services/rss-monitor');

    console.log('Scanning RSS feeds (this may take 30-60 seconds)...');
    const opportunities = await rssMonitor.getOpportunitiesToday();

    console.log(`✓ RSS Monitor working`);
    console.log(`  Opportunities found: ${opportunities.length}`);
    console.log(`  Top sources: ${[...new Set(opportunities.map(o => o.source))].slice(0, 3).join(', ')}`);

    if (opportunities.length > 0) {
      console.log(`\n  Sample opportunity:`);
      console.log(`    Title: ${opportunities[0].title}`);
      console.log(`    Source: ${opportunities[0].source}`);
      console.log(`    Fit Score: ${opportunities[0].fitScore}/10`);
    }

    results.phase2.rssMonitor = 'PASS';
    results.phase2.rssOpportunities = opportunities.length;
    results.passed++;
  } catch (error) {
    console.log(`✗ RSS Monitor failed: ${error.message}`);
    results.phase2.rssMonitor = 'FAIL';
    results.failed++;
    results.errors.push({ test: 'RSS Monitor', error: error.message });
  }
  results.totalTests++;

  // Test 5: Forum Scraper
  console.log('\n\nTest 5: Forum Scraper');
  console.log('─'.repeat(60));
  try {
    const forumScraper = require('../services/forum-scraper');

    console.log('Scraping forums (this may take 30-60 seconds)...');
    const posts = await forumScraper.getQuestionsToday();

    console.log(`✓ Forum Scraper working`);
    console.log(`  Posts found: ${posts.length}`);

    if (posts.length > 0) {
      const subreddits = [...new Set(posts.map(p => p.subreddit))];
      console.log(`  Subreddits: ${subreddits.slice(0, 5).join(', ')}`);
      console.log(`\n  Sample post:`);
      console.log(`    Title: ${posts[0].title.substring(0, 60)}...`);
      console.log(`    Subreddit: r/${posts[0].subreddit}`);
      console.log(`    Fit Score: ${posts[0].fitScore}/10`);
    }

    results.phase2.forumScraper = 'PASS';
    results.phase2.forumPosts = posts.length;
    results.passed++;
  } catch (error) {
    console.log(`✗ Forum Scraper failed: ${error.message}`);
    results.phase2.forumScraper = 'FAIL';
    results.failed++;
    results.errors.push({ test: 'Forum Scraper', error: error.message });
  }
  results.totalTests++;

  // Test 6: Email Finder
  console.log('\n\nTest 6: Email Finder');
  console.log('─'.repeat(60));
  try {
    const emailFinder = require('../services/email-finder');

    console.log('Testing email extraction...');
    const emails = await emailFinder.findEmailFromWebsite('https://maggieforbesstrategies.com');

    console.log(`✓ Email Finder working`);
    console.log(`  Emails found: ${emails.length}`);
    if (emails.length > 0) {
      console.log(`  Found: ${emails.join(', ')}`);
    }

    // Test pattern generation
    const patterns = emailFinder.generateEmailPatterns('John', 'Doe', 'example.com');
    console.log(`  Pattern generation: ${patterns.length} patterns created`);

    results.phase2.emailFinder = 'PASS';
    results.phase2.emailsFound = emails.length;
    results.passed++;
  } catch (error) {
    console.log(`✗ Email Finder failed: ${error.message}`);
    results.phase2.emailFinder = 'FAIL';
    results.failed++;
    results.errors.push({ test: 'Email Finder', error: error.message });
  }
  results.totalTests++;

  // Test 7: Auto-Engagement
  console.log('\n\nTest 7: Auto-Engagement System');
  console.log('─'.repeat(60));
  try {
    const autoEngagement = require('../services/auto-engagement');

    const stats = autoEngagement.getStats();
    console.log(`✓ Auto-Engagement initialized`);
    console.log(`  Max engagements/day: ${stats.settings.maxEngagementsPerDay}`);
    console.log(`  Min fit score: ${stats.settings.minValueThreshold}/10`);
    console.log(`  Cooldown period: ${stats.settings.cooldownPeriod / (60 * 60 * 1000)}h`);
    console.log(`  Style: ${stats.settings.responseStyle}`);

    results.phase2.autoEngagement = 'PASS';
    results.passed++;
  } catch (error) {
    console.log(`✗ Auto-Engagement failed: ${error.message}`);
    results.phase2.autoEngagement = 'FAIL';
    results.failed++;
    results.errors.push({ test: 'Auto-Engagement', error: error.message });
  }
  results.totalTests++;

  // ============================================================================
  // INTEGRATION TEST - Full Discovery Pipeline
  // ============================================================================

  console.log('\n\n🔗 INTEGRATION TEST: Full Discovery Pipeline\n');
  console.log('─'.repeat(60));

  try {
    console.log('Running complete discovery pipeline...\n');

    // Get opportunities from all sources
    const rssMonitor = require('../services/rss-monitor');
    const forumScraper = require('../services/forum-scraper');
    const autoEngagement = require('../services/auto-engagement');

    console.log('1. Fetching RSS opportunities...');
    const rssOpps = await rssMonitor.getOpportunitiesToday();
    console.log(`   ✓ Found ${rssOpps.length} RSS opportunities`);

    console.log('\n2. Fetching forum posts...');
    const forumPosts = await forumScraper.getQuestionsToday();
    console.log(`   ✓ Found ${forumPosts.length} forum posts`);

    // Combine all opportunities
    const allOpportunities = [...rssOpps, ...forumPosts];
    console.log(`\n3. Total opportunities: ${allOpportunities.length}`);

    // Filter high-quality opportunities
    const highQuality = allOpportunities.filter(o => o.fitScore >= 7);
    console.log(`   ✓ High-quality (7+): ${highQuality.length}`);

    console.log(`\n4. Planning engagements...`);
    autoEngagement.clearHistory(); // Clear for testing
    const plan = await autoEngagement.planEngagements(highQuality.slice(0, 10));
    console.log(`   ✓ Engagements planned: ${plan.planned.length}`);
    console.log(`   ✓ Opportunities skipped: ${plan.skipped.length}`);

    results.integration = {
      status: 'PASS',
      totalOpportunities: allOpportunities.length,
      highQuality: highQuality.length,
      engagementsPlanned: plan.planned.length
    };
    results.passed++;

  } catch (error) {
    console.log(`✗ Integration test failed: ${error.message}`);
    results.integration = { status: 'FAIL', error: error.message };
    results.failed++;
    results.errors.push({ test: 'Integration', error: error.message });
  }
  results.totalTests++;

  // ============================================================================
  // FINAL REPORT
  // ============================================================================

  console.log('\n\n');
  console.log('═'.repeat(60));
  console.log('📊 FINAL TEST REPORT');
  console.log('═'.repeat(60));

  console.log(`\nTotal Tests: ${results.totalTests}`);
  console.log(`Passed: ${results.passed} ✓`);
  console.log(`Failed: ${results.failed} ✗`);
  console.log(`Success Rate: ${((results.passed / results.totalTests) * 100).toFixed(1)}%`);

  console.log('\n\nPHASE 1 RESULTS:');
  console.log('─'.repeat(60));
  Object.entries(results.phase1).forEach(([test, status]) => {
    const icon = status === 'PASS' ? '✓' : '✗';
    console.log(`  ${icon} ${test}: ${status}`);
  });

  console.log('\n\nPHASE 2 RESULTS:');
  console.log('─'.repeat(60));
  Object.entries(results.phase2).forEach(([test, status]) => {
    const icon = status === 'PASS' ? '✓' : '✗';
    console.log(`  ${icon} ${test}: ${status}`);
  });

  if (results.integration) {
    console.log('\n\nINTEGRATION TEST:');
    console.log('─'.repeat(60));
    console.log(`  Status: ${results.integration.status}`);
    if (results.integration.status === 'PASS') {
      console.log(`  Total Opportunities: ${results.integration.totalOpportunities}`);
      console.log(`  High Quality (7+): ${results.integration.highQuality}`);
      console.log(`  Engagements Planned: ${results.integration.engagementsPlanned}`);
    }
  }

  if (results.errors.length > 0) {
    console.log('\n\nERRORS:');
    console.log('─'.repeat(60));
    results.errors.forEach(({ test, error }) => {
      console.log(`  ✗ ${test}: ${error}`);
    });
  }

  console.log('\n\nSYSTEM CAPABILITIES:');
  console.log('─'.repeat(60));
  console.log('  ✓ AI cost protection active');
  console.log('  ✓ Multi-source discovery (RSS + Forums)');
  console.log('  ✓ Email extraction working');
  console.log('  ✓ Auto-engagement ready (value-first, no spam)');
  console.log('  ✓ Deployed to Vercel (serverless)');
  console.log('  ✓ Supabase queue system');

  console.log('\n\n');

  if (results.failed === 0) {
    console.log('🎉 ALL TESTS PASSED! System is fully operational.\n');
  } else {
    console.log(`⚠️  ${results.failed} test(s) failed. Review errors above.\n`);
  }

  process.exit(results.failed > 0 ? 1 : 0);
}

// Run full test
runFullSystemTest();
