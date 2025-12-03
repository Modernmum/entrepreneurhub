#!/usr/bin/env node
// Test Maggie Forbes Strategies Website with Bot Persona System

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const crypto = require('crypto');
const botUserPersona = require('../services/bot-user-persona');
const botTestingService = require('../services/bot-testing-service');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

async function testMaggieForbes() {
  console.log('\n' + '='.repeat(70));
  console.log('🎭 TESTING MAGGIE FORBES STRATEGIES WEBSITE');
  console.log('='.repeat(70));

  const maggieForbesUrl = process.env.MAGGIE_FORBES_URL || 'https://maggieforbesstrategies.com';

  console.log(`\nWebsite: ${maggieForbesUrl}`);
  console.log('Target Audience: C-suite executives, business owners $5M-50M revenue');
  console.log('Service: High-end business consulting ($25K/month)\n');

  // =========================================================================
  // STEP 1: Create test client in database
  // =========================================================================

  console.log('📝 Step 1: Creating test client in database...\n');

  let client;
  try {
    // Generate unique dashboard token
    const dashboardToken = `maggie-${crypto.randomBytes(16).toString('hex')}`;

    const { data, error} = await supabase
      .from('testing_clients')
      .insert({
        client_name: 'Maggie Forbes',
        client_email: 'kristi@maggieforbesstrategies.com',
        company_name: 'Maggie Forbes Strategies',
        plan: 'pro',
        monthly_fee: 0.00, // Internal testing
        site_url: maggieForbesUrl,
        site_type: 'marketing',
        test_frequency: 'on-demand',
        personas_to_test: ['enterpriseManager', 'smallBusinessOwner'],
        auto_fix_enabled: false, // Marketing site, no auto-fix
        engineering_bot_access: false,
        status: 'active',
        dashboard_token: dashboardToken
      })
      .select()
      .single();

    if (error) {
      console.error('❌ Failed to create client:', error);
      throw error;
    }

    client = data;
    console.log('✅ Test client created');
    console.log(`   Client ID: ${client.id}`);
    console.log(`   Dashboard URL: https://unboundteam-three.vercel.app/client-dashboard.html?token=${client.dashboard_token}\n`);

  } catch (error) {
    console.error('Failed to create test client:', error);
    process.exit(1);
  }

  // =========================================================================
  // STEP 2: Configure site for testing
  // =========================================================================

  console.log('⚙️  Step 2: Configuring site for testing...\n');

  // Set URL for bot testing
  process.env.GMP_URL = maggieForbesUrl;

  console.log('✅ Configuration set\n');

  // =========================================================================
  // STEP 3: Run tests as different user personas
  // =========================================================================

  console.log('🎭 Step 3: Running tests as different user personas...\n');

  // Test 1: Enterprise Manager (Marcus Johnson)
  // This is a VP-level buyer evaluating Maggie Forbes for their company
  console.log('─'.repeat(70));
  console.log('TEST 1: Enterprise Manager (Marcus Johnson)');
  console.log('Role: VP Ops at TechCorp (500 employees)');
  console.log('Goal: Evaluating strategic consultants for organizational optimization');
  console.log('─'.repeat(70) + '\n');

  let enterpriseTest;
  try {
    enterpriseTest = await botUserPersona.simulateUserJourney('enterpriseManager');

    console.log('\n✅ Enterprise Manager test complete');
    console.log(`   Rating: ${enterpriseTest.overallRating}/10`);
    console.log(`   Issues Found: ${enterpriseTest.issues.length}`);
    console.log(`   Duration: ${enterpriseTest.duration.toFixed(1)} minutes\n`);

    // Save to database
    await botTestingService.saveTestResult(client, enterpriseTest);
    await botTestingService.saveIssues(client, { id: 'test-1' }, enterpriseTest.issues);

  } catch (error) {
    console.error('❌ Enterprise Manager test failed:', error.message);
    enterpriseTest = { error: error.message, issues: [] };
  }

  // Test 2: Small Business Owner (Sarah Chen)
  // This is a business owner looking for strategic help
  console.log('─'.repeat(70));
  console.log('TEST 2: Small Business Owner (Sarah Chen)');
  console.log('Role: Owner of Chen Marketing Agency (8 employees)');
  console.log('Goal: Looking for strategic guidance to scale business');
  console.log('─'.repeat(70) + '\n');

  let businessOwnerTest;
  try {
    businessOwnerTest = await botUserPersona.simulateUserJourney('smallBusinessOwner');

    console.log('\n✅ Small Business Owner test complete');
    console.log(`   Rating: ${businessOwnerTest.overallRating}/10`);
    console.log(`   Issues Found: ${businessOwnerTest.issues.length}`);
    console.log(`   Duration: ${businessOwnerTest.duration.toFixed(1)} minutes\n`);

    // Save to database
    await botTestingService.saveTestResult(client, businessOwnerTest);
    await botTestingService.saveIssues(client, { id: 'test-2' }, businessOwnerTest.issues);

  } catch (error) {
    console.error('❌ Small Business Owner test failed:', error.message);
    businessOwnerTest = { error: error.message, issues: [] };
  }

  // =========================================================================
  // STEP 4: Generate comprehensive report
  // =========================================================================

  console.log('\n' + '='.repeat(70));
  console.log('📊 COMPREHENSIVE RESULTS');
  console.log('='.repeat(70) + '\n');

  // Enterprise Manager Results
  if (!enterpriseTest.error) {
    console.log('🎭 ENTERPRISE MANAGER (Marcus Johnson)');
    console.log('─'.repeat(70));
    console.log(`Overall Rating: ${enterpriseTest.overallRating}/10 ${enterpriseTest.wouldRecommend ? '✅ Would Recommend' : '❌ Would Not Recommend'}`);
    console.log(`Test Duration: ${enterpriseTest.duration.toFixed(1)} minutes`);

    console.log(`\nJourney Completed:`);
    enterpriseTest.steps.forEach((step, i) => {
      console.log(`  ${i + 1}. ${step.step}: ${step.success ? '✅' : '❌'} (${step.duration.toFixed(1)}s)`);
    });

    if (enterpriseTest.issues.length > 0) {
      console.log(`\n⚠️  Issues Found (${enterpriseTest.issues.length}):`);
      enterpriseTest.issues.forEach(issue => {
        console.log(`  ${issue.severity.toUpperCase()}: ${issue.description}`);
      });
    }

    if (enterpriseTest.positives.length > 0) {
      console.log(`\n✅ Positive Experiences (${enterpriseTest.positives.length}):`);
      enterpriseTest.positives.forEach(positive => {
        console.log(`  • ${positive}`);
      });
    }

    if (enterpriseTest.suggestions.length > 0) {
      console.log(`\n💡 Recommendations:`);
      enterpriseTest.suggestions.forEach(suggestion => {
        console.log(`  ${suggestion.priority.toUpperCase()}: ${suggestion.suggestion}`);
      });
    }
  }

  console.log('\n' + '─'.repeat(70) + '\n');

  // Small Business Owner Results
  if (!businessOwnerTest.error) {
    console.log('🎭 SMALL BUSINESS OWNER (Sarah Chen)');
    console.log('─'.repeat(70));
    console.log(`Overall Rating: ${businessOwnerTest.overallRating}/10 ${businessOwnerTest.wouldRecommend ? '✅ Would Recommend' : '❌ Would Not Recommend'}`);
    console.log(`Test Duration: ${businessOwnerTest.duration.toFixed(1)} minutes`);

    console.log(`\nJourney Completed:`);
    businessOwnerTest.steps.forEach((step, i) => {
      console.log(`  ${i + 1}. ${step.step}: ${step.success ? '✅' : '❌'} (${step.duration.toFixed(1)}s)`);
    });

    if (businessOwnerTest.issues.length > 0) {
      console.log(`\n⚠️  Issues Found (${businessOwnerTest.issues.length}):`);
      businessOwnerTest.issues.forEach(issue => {
        console.log(`  ${issue.severity.toUpperCase()}: ${issue.description}`);
      });
    }

    if (businessOwnerTest.positives.length > 0) {
      console.log(`\n✅ Positive Experiences (${businessOwnerTest.positives.length}):`);
      businessOwnerTest.positives.forEach(positive => {
        console.log(`  • ${positive}`);
      });
    }

    if (businessOwnerTest.suggestions.length > 0) {
      console.log(`\n💡 Recommendations:`);
      businessOwnerTest.suggestions.forEach(suggestion => {
        console.log(`  ${suggestion.priority.toUpperCase()}: ${suggestion.suggestion}`);
      });
    }
  }

  // =========================================================================
  // STEP 5: Overall Summary
  // =========================================================================

  console.log('\n' + '='.repeat(70));
  console.log('📈 OVERALL SUMMARY');
  console.log('='.repeat(70) + '\n');

  const validTests = [enterpriseTest, businessOwnerTest].filter(t => !t.error);

  if (validTests.length > 0) {
    const avgRating = validTests.reduce((sum, t) => sum + t.overallRating, 0) / validTests.length;
    const totalIssues = validTests.reduce((sum, t) => sum + t.issues.length, 0);
    const criticalIssues = validTests.reduce((sum, t) => sum + t.issues.filter(i => i.severity === 'critical').length, 0);
    const highIssues = validTests.reduce((sum, t) => sum + t.issues.filter(i => i.severity === 'high').length, 0);

    console.log(`Average Rating: ${avgRating.toFixed(1)}/10`);
    console.log(`Total Issues Found: ${totalIssues}`);
    console.log(`  • Critical: ${criticalIssues}`);
    console.log(`  • High: ${highIssues}`);
    console.log(`  • Medium/Low: ${totalIssues - criticalIssues - highIssues}`);

    const recommendCount = validTests.filter(t => t.wouldRecommend).length;
    console.log(`\nWould Recommend: ${recommendCount}/${validTests.length} personas`);

    // Health score
    let healthScore = 100;
    healthScore -= (criticalIssues * 20);
    healthScore -= (highIssues * 10);
    healthScore = Math.max(0, healthScore);

    console.log(`\nSite Health Score: ${healthScore}/100`);

    if (healthScore >= 80) {
      console.log('Status: ✅ EXCELLENT - Site is performing well');
    } else if (healthScore >= 60) {
      console.log('Status: ⚠️  GOOD - Some improvements recommended');
    } else if (healthScore >= 40) {
      console.log('Status: ⚠️  NEEDS ATTENTION - Several issues to address');
    } else {
      console.log('Status: 🚨 CRITICAL - Urgent fixes required');
    }
  }

  // =========================================================================
  // STEP 6: Next Steps
  // =========================================================================

  console.log('\n' + '='.repeat(70));
  console.log('🎯 NEXT STEPS');
  console.log('='.repeat(70) + '\n');

  console.log('1. Review test results in detail');
  console.log('2. View client dashboard:');
  console.log(`   https://unboundteam-three.vercel.app/client-dashboard.html?token=${client.dashboard_token}`);
  console.log('3. Address critical and high-priority issues first');
  console.log('4. Re-run tests after fixes to verify improvements');
  console.log('5. Schedule automated daily/weekly testing\n');

  // =========================================================================
  // STEP 7: Check database
  // =========================================================================

  console.log('='.repeat(70));
  console.log('💾 DATABASE RECORDS');
  console.log('='.repeat(70) + '\n');

  const { data: testResults } = await supabase
    .from('bot_test_results')
    .select('id, test_date, persona_name, overall_rating, critical_issues, high_issues')
    .eq('client_id', client.id)
    .order('test_date', { ascending: false });

  console.log(`Test Results Saved: ${testResults?.length || 0}`);
  if (testResults && testResults.length > 0) {
    testResults.forEach(result => {
      console.log(`  • ${result.persona_name}: ${result.overall_rating}/10 (${result.critical_issues} critical, ${result.high_issues} high issues)`);
    });
  }

  const { data: issues } = await supabase
    .from('bot_test_issues')
    .select('id, severity, description, status')
    .eq('client_id', client.id);

  console.log(`\nIssues Logged: ${issues?.length || 0}`);
  if (issues && issues.length > 0) {
    const issuesBySeverity = issues.reduce((acc, issue) => {
      acc[issue.severity] = (acc[issue.severity] || 0) + 1;
      return acc;
    }, {});

    Object.entries(issuesBySeverity).forEach(([severity, count]) => {
      console.log(`  • ${severity}: ${count}`);
    });
  }

  console.log('\n' + '='.repeat(70));
  console.log('✅ MAGGIE FORBES TESTING COMPLETE');
  console.log('='.repeat(70) + '\n');

  process.exit(0);
}

// Run the test
if (require.main === module) {
  testMaggieForbes()
    .catch(error => {
      console.error('\n❌ Test failed:', error);
      process.exit(1);
    });
}

module.exports = testMaggieForbes;
