// Comprehensive Test Suite - Test all 5 core solutions
// Tests Phase 3: Complete Solutions

const contentCreator = require('../services/content-creator');
const marketResearcher = require('../services/market-researcher');
const landingPageBuilder = require('../services/landing-page-builder');
const emailMarketer = require('../services/email-marketer');
const leadScraper = require('../services/lead-scraper');

console.log('🧪 COMPREHENSIVE TEST SUITE - ALL 5 SOLUTIONS');
console.log('═'.repeat(70));
console.log('');

async function runAllTests() {
  const results = {
    passed: 0,
    failed: 0,
    tests: []
  };

  // Test 1: Lead Generation (Solution #1)
  console.log('TEST 1: Lead Generation');
  console.log('─'.repeat(70));
  try {
    const leads = await leadScraper.generateLeads({
      targetIndustry: 'SaaS founders seeking growth strategies',
      location: 'global',
      count: 5,
      minScore: 6
    });

    if (leads && leads.length > 0) {
      console.log(`✅ PASS - Generated ${leads.length} leads`);
      console.log(`   Average fit score: ${(leads.reduce((sum, l) => sum + l.fitScore, 0) / leads.length).toFixed(1)}/10`);
      results.passed++;
      results.tests.push({ test: 'Lead Generation', status: 'PASS', leads: leads.length });
    } else {
      console.log(`❌ FAIL - No leads generated`);
      results.failed++;
      results.tests.push({ test: 'Lead Generation', status: 'FAIL', error: 'No leads' });
    }
  } catch (error) {
    console.log(`❌ FAIL - ${error.message}`);
    results.failed++;
    results.tests.push({ test: 'Lead Generation', status: 'FAIL', error: error.message });
  }
  console.log('');

  // Test 2: Content Creation (Solution #2)
  console.log('TEST 2: Content Creation');
  console.log('─'.repeat(70));
  try {
    const blogPost = await contentCreator.createBlogPost({
      topic: 'How to Validate Your SaaS Idea in 7 Days',
      keywords: ['saas validation', 'mvp', 'customer discovery'],
      tone: 'professional',
      wordCount: 1000,
      userId: 'test-user'
    });

    if (blogPost && blogPost.metadata && blogPost.metadata.wordCount >= 800) {
      console.log(`✅ PASS - Created blog post`);
      console.log(`   Word count: ${blogPost.metadata.wordCount}`);
      console.log(`   SEO Title: ${blogPost.metadata.seoData?.seoTitle || 'N/A'}`);
      results.passed++;
      results.tests.push({ test: 'Content Creation', status: 'PASS', wordCount: blogPost.metadata.wordCount });
    } else {
      console.log(`❌ FAIL - Blog post incomplete`);
      results.failed++;
      results.tests.push({ test: 'Content Creation', status: 'FAIL', error: 'Incomplete' });
    }
  } catch (error) {
    console.log(`❌ FAIL - ${error.message}`);
    results.failed++;
    results.tests.push({ test: 'Content Creation', status: 'FAIL', error: error.message });
  }
  console.log('');

  // Test 3: Market Research (Solution #3)
  console.log('TEST 3: Market Research');
  console.log('─'.repeat(70));
  try {
    const research = await marketResearcher.conductResearch({
      idea: 'AI-powered email assistant for busy entrepreneurs',
      industry: 'Productivity Software',
      targetAudience: 'Entrepreneurs and small business owners',
      competitors: ['Superhuman', 'Front'],
      userId: 'test-user'
    });

    if (research && research.metadata && research.metadata.opportunityScore) {
      console.log(`✅ PASS - Market research complete`);
      console.log(`   Opportunity Score: ${research.metadata.opportunityScore}/10`);
      console.log(`   Market Gaps Found: ${research.metadata.marketGaps?.length || 0}`);
      console.log(`   Competitors Analyzed: ${research.metadata.competitorAnalysis?.count || 0}`);
      results.passed++;
      results.tests.push({
        test: 'Market Research',
        status: 'PASS',
        opportunityScore: research.metadata.opportunityScore
      });
    } else {
      console.log(`❌ FAIL - Research incomplete`);
      results.failed++;
      results.tests.push({ test: 'Market Research', status: 'FAIL', error: 'Incomplete' });
    }
  } catch (error) {
    console.log(`❌ FAIL - ${error.message}`);
    results.failed++;
    results.tests.push({ test: 'Market Research', status: 'FAIL', error: error.message });
  }
  console.log('');

  // Test 4: Landing Page Builder (Solution #4)
  console.log('TEST 4: Landing Page Builder');
  console.log('─'.repeat(70));
  try {
    const landingPage = await landingPageBuilder.buildLandingPage({
      businessName: 'TaskMaster Pro',
      description: 'AI-powered task management for busy entrepreneurs',
      targetAudience: 'Entrepreneurs and small business owners',
      valueProposition: 'Get 3 hours back every day with intelligent task automation',
      features: ['Smart task prioritization', 'AI scheduling', 'Team collaboration'],
      pricing: '$29/month',
      ctaText: 'Start Free Trial',
      userId: 'test-user'
    });

    if (landingPage && landingPage.html_content && landingPage.html_content.includes('<!DOCTYPE html>')) {
      console.log(`✅ PASS - Landing page built`);
      console.log(`   Business: ${landingPage.business_name}`);
      console.log(`   HTML size: ${landingPage.html_content.length} chars`);
      console.log(`   Preview URL: ${landingPage.previewUrl || 'N/A'}`);
      results.passed++;
      results.tests.push({ test: 'Landing Page Builder', status: 'PASS', htmlSize: landingPage.html_content.length });
    } else {
      console.log(`❌ FAIL - Landing page incomplete`);
      results.failed++;
      results.tests.push({ test: 'Landing Page Builder', status: 'FAIL', error: 'Incomplete' });
    }
  } catch (error) {
    console.log(`❌ FAIL - ${error.message}`);
    results.failed++;
    results.tests.push({ test: 'Landing Page Builder', status: 'FAIL', error: error.message });
  }
  console.log('');

  // Test 5: Email Marketing (Solution #5)
  console.log('TEST 5: Email Marketing');
  console.log('─'.repeat(70));
  try {
    const campaign = await emailMarketer.createCampaign({
      campaignType: 'welcome',
      goal: 'Onboard new users and drive first action',
      audience: 'New signups',
      productService: 'Task management software',
      tone: 'friendly',
      emailCount: 3,
      userId: 'test-user'
    });

    if (campaign && campaign.metadata && campaign.metadata.emails && campaign.metadata.emails.length === 3) {
      console.log(`✅ PASS - Email campaign created`);
      console.log(`   Campaign Type: ${campaign.campaign_type}`);
      console.log(`   Email Count: ${campaign.email_count}`);
      console.log(`   Email 1 Subject: ${campaign.metadata.emails[0].subject}`);
      results.passed++;
      results.tests.push({ test: 'Email Marketing', status: 'PASS', emailCount: campaign.email_count });
    } else {
      console.log(`❌ FAIL - Email campaign incomplete`);
      results.failed++;
      results.tests.push({ test: 'Email Marketing', status: 'FAIL', error: 'Incomplete' });
    }
  } catch (error) {
    console.log(`❌ FAIL - ${error.message}`);
    results.failed++;
    results.tests.push({ test: 'Email Marketing', status: 'FAIL', error: error.message });
  }
  console.log('');

  // Summary
  console.log('═'.repeat(70));
  console.log('📊 TEST SUMMARY');
  console.log('─'.repeat(70));
  console.log(`Total Tests: ${results.passed + results.failed}`);
  console.log(`✅ Passed: ${results.passed}`);
  console.log(`❌ Failed: ${results.failed}`);
  console.log(`Success Rate: ${((results.passed / (results.passed + results.failed)) * 100).toFixed(1)}%`);
  console.log('');

  console.log('Test Results:');
  results.tests.forEach((t, i) => {
    const icon = t.status === 'PASS' ? '✅' : '❌';
    console.log(`  ${icon} ${i + 1}. ${t.test}: ${t.status}`);
  });

  console.log('');
  if (results.passed === 5) {
    console.log('🎉 ALL 5 CORE SOLUTIONS WORKING!');
    console.log('');
    console.log('Phase 3: Complete Solutions - ✅ COMPLETE');
  } else {
    console.log(`⚠️  ${results.failed} solution(s) need attention`);
  }

  console.log('');
  return results;
}

// Run tests
runAllTests()
  .then(results => {
    process.exit(results.failed > 0 ? 1 : 0);
  })
  .catch(error => {
    console.error('Test suite crashed:', error);
    process.exit(1);
  });
