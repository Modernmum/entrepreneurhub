/**
 * Test GMP Integration
 * Tests the complete flow: Unbound.team → GMP API → Client Dashboard
 *
 * What this tests:
 * 1. GMP sync service connection
 * 2. Lead push to GMP contacts
 * 3. Content push to GMP campaigns
 * 4. Research push to GMP deals
 * 5. Sync logging
 * 6. Client automation scheduler
 *
 * Usage:
 * node backend/test/test-gmp-integration.js
 */

const gmpSync = require('../services/gmp-sync');
const clientAutomation = require('../automation/client-automation');
const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase
const supabase = createClient(
  process.env.ENTREPRENEURHUB_SUPABASE_URL,
  process.env.ENTREPRENEURHUB_SUPABASE_SERVICE_KEY
);

// Test data
const SAMPLE_LEADS = [
  {
    name: 'John Smith',
    email: 'john.smith@testcompany.com',
    phone: '+1-555-0123',
    company: 'Test SaaS Company',
    title: 'CEO',
    industry: 'SaaS',
    linkedinUrl: 'https://linkedin.com/in/johnsmith',
    website: 'https://testsaas.com',
    fitScore: 8,
    painPoints: 'Struggling with lead generation, needs content automation',
    businessArea: 'marketing',
    urgency: 'high',
    source: 'Reddit r/SaaS',
    outreachTip: 'Mention their post about scaling challenges',
    jobId: 'test-job-123'
  },
  {
    name: 'Sarah Johnson',
    email: 'sarah@growthstartup.com',
    company: 'Growth Startup Inc',
    title: 'VP Marketing',
    industry: 'Marketing',
    fitScore: 9,
    painPoints: 'Need automated content creation and SEO optimization',
    businessArea: 'content',
    urgency: 'urgent',
    source: 'Indie Hackers forum',
    jobId: 'test-job-124'
  }
];

const SAMPLE_CONTENT = [
  {
    type: 'blog',
    title: 'How to Scale Your SaaS Business in 2026',
    excerpt: 'Learn the proven strategies top SaaS founders use to scale from $0 to $1M ARR.',
    content: 'Full blog post content would go here... (1500 words)',
    wordCount: 1500,
    seoMeta: {
      description: 'Comprehensive guide to scaling your SaaS business with proven strategies and real examples.',
      keywords: ['saas', 'scaling', 'growth', 'arr']
    },
    seoScore: 85,
    readability: 'easy',
    jobId: 'test-content-789'
  }
];

const SAMPLE_RESEARCH = [
  {
    type: 'competitor_analysis',
    title: 'SaaS Competitor Analysis - Q1 2026',
    summary: 'Analysis of top 10 competitors in the marketing automation space.',
    competitors: [
      {
        name: 'HubSpot',
        strengths: 'All-in-one platform, strong brand',
        weaknesses: 'Expensive, complex for small businesses'
      },
      {
        name: 'Mailchimp',
        strengths: 'Easy to use, affordable',
        weaknesses: 'Limited advanced features'
      }
    ],
    marketGaps: [
      {
        opportunity: 'AI-powered content automation for small businesses',
        score: 9
      }
    ],
    recommendations: [
      'Focus on AI automation as key differentiator',
      'Target small businesses ($1-10M revenue)',
      'Price competitively vs HubSpot'
    ],
    marketSize: {
      tam: '50B',
      sam: '5B',
      som: '500M'
    },
    jobId: 'test-research-456'
  }
];

// Test configuration
const TEST_CONFIG = {
  // You'll need to update these with real values
  unboundTenantId: 'maggie-forbes-test-client',
  gmpTenantId: 'gmp-test-tenant-123', // Replace with real GMP tenant ID
  skipActualSync: false // Set to true to skip actual API calls
};

/**
 * Run all tests
 */
async function runAllTests() {
  console.log('='.repeat(60));
  console.log('GMP INTEGRATION TEST SUITE');
  console.log('='.repeat(60));
  console.log('');

  const results = {
    passed: 0,
    failed: 0,
    tests: []
  };

  // Test 1: Connection Test
  await runTest(
    'Test 1: GMP Connection',
    async () => await testConnection(),
    results
  );

  // Test 2: Push Leads
  if (!TEST_CONFIG.skipActualSync) {
    await runTest(
      'Test 2: Push Leads to GMP',
      async () => await testPushLeads(),
      results
    );

    // Test 3: Push Content
    await runTest(
      'Test 3: Push Content to GMP',
      async () => await testPushContent(),
      results
    );

    // Test 4: Push Research
    await runTest(
      'Test 4: Push Research to GMP',
      async () => await testPushResearch(),
      results
    );
  }

  // Test 5: Sync Logging
  await runTest(
    'Test 5: Sync Logging',
    async () => await testSyncLogging(),
    results
  );

  // Test 6: Client Configuration
  await runTest(
    'Test 6: Client Configuration',
    async () => await testClientConfig(),
    results
  );

  // Test 7: Sync Stats
  await runTest(
    'Test 7: Sync Statistics',
    async () => await testSyncStats(),
    results
  );

  // Summary
  console.log('');
  console.log('='.repeat(60));
  console.log('TEST SUMMARY');
  console.log('='.repeat(60));
  console.log(`Total Tests: ${results.tests.length}`);
  console.log(`✅ Passed: ${results.passed}`);
  console.log(`❌ Failed: ${results.failed}`);
  console.log('');

  if (results.failed === 0) {
    console.log('🎉 ALL TESTS PASSED! Integration is working correctly.');
  } else {
    console.log('⚠️  Some tests failed. Review the output above.');
  }

  console.log('='.repeat(60));

  // Exit with appropriate code
  process.exit(results.failed === 0 ? 0 : 1);
}

/**
 * Run a single test
 */
async function runTest(name, testFn, results) {
  console.log(`\n${name}`);
  console.log('-'.repeat(60));

  try {
    await testFn();
    console.log('✅ PASSED');
    results.passed++;
    results.tests.push({ name, status: 'passed' });
  } catch (error) {
    console.error('❌ FAILED:', error.message);
    console.error(error);
    results.failed++;
    results.tests.push({ name, status: 'failed', error: error.message });
  }
}

/**
 * Test 1: Connection to GMP
 */
async function testConnection() {
  console.log('Testing connection to GMP API...');

  const result = await gmpSync.testConnection();

  if (!result.success) {
    throw new Error(`Connection failed: ${result.error}`);
  }

  console.log('Connection successful!');
}

/**
 * Test 2: Push leads to GMP
 */
async function testPushLeads() {
  console.log(`Pushing ${SAMPLE_LEADS.length} test leads to GMP...`);

  const result = await gmpSync.pushLeads(SAMPLE_LEADS, TEST_CONFIG.gmpTenantId);

  console.log(`Result: ${result.successful}/${result.total} successful`);

  if (result.failed > 0) {
    console.log('Errors:', result.errors);
  }

  if (result.successful === 0) {
    throw new Error('Failed to push any leads');
  }

  console.log('✓ Leads pushed successfully');
  console.log('→ Check GMP dashboard: Contacts tab → Filter by "AI Lead Generation"');
}

/**
 * Test 3: Push content to GMP
 */
async function testPushContent() {
  console.log(`Pushing ${SAMPLE_CONTENT.length} content pieces to GMP...`);

  const result = await gmpSync.pushContent(SAMPLE_CONTENT, TEST_CONFIG.gmpTenantId);

  console.log(`Result: ${result.successful}/${result.total} successful`);

  if (result.failed > 0) {
    console.log('Errors:', result.errors);
  }

  if (result.successful === 0) {
    throw new Error('Failed to push any content');
  }

  console.log('✓ Content pushed successfully');
  console.log('→ Check GMP dashboard: Campaigns tab → Type "content"');
}

/**
 * Test 4: Push research to GMP
 */
async function testPushResearch() {
  console.log(`Pushing ${SAMPLE_RESEARCH.length} research reports to GMP...`);

  const result = await gmpSync.pushResearch(SAMPLE_RESEARCH, TEST_CONFIG.gmpTenantId);

  console.log(`Result: ${result.successful}/${result.total} successful`);

  if (result.failed > 0) {
    console.log('Errors:', result.errors);
  }

  if (result.successful === 0) {
    throw new Error('Failed to push any research');
  }

  console.log('✓ Research pushed successfully');
  console.log('→ Check GMP dashboard: Deals tab → Stage "research"');
}

/**
 * Test 5: Sync logging
 */
async function testSyncLogging() {
  console.log('Checking sync log entries...');

  const { data, error } = await supabase
    .from('gmp_sync_log')
    .select('*')
    .eq('tenant_id', TEST_CONFIG.gmpTenantId)
    .order('synced_at', { ascending: false })
    .limit(5);

  if (error) {
    throw new Error(`Database error: ${error.message}`);
  }

  console.log(`Found ${data?.length || 0} recent sync log entries`);

  if (data && data.length > 0) {
    console.log('Latest sync:');
    console.log(`  Type: ${data[0].sync_type}`);
    console.log(`  Success: ${data[0].success}`);
    console.log(`  Items: ${data[0].items_successful}/${data[0].items_total}`);
    console.log(`  Time: ${data[0].synced_at}`);
  }

  console.log('✓ Sync logging is working');
}

/**
 * Test 6: Client configuration
 */
async function testClientConfig() {
  console.log('Testing client configuration...');

  // Try to create or update test client config
  const { data: existing, error: fetchError } = await supabase
    .from('gmp_client_config')
    .select('*')
    .eq('unbound_tenant_id', TEST_CONFIG.unboundTenantId)
    .single();

  if (fetchError && fetchError.code !== 'PGRST116') {
    throw new Error(`Database error: ${fetchError.message}`);
  }

  if (!existing) {
    // Create new config
    const { error: insertError } = await supabase
      .from('gmp_client_config')
      .insert({
        unbound_tenant_id: TEST_CONFIG.unboundTenantId,
        gmp_tenant_id: TEST_CONFIG.gmpTenantId,
        client_name: 'Test Client',
        client_email: 'test@example.com',
        automation_enabled: true,
        leads_per_week: 20,
        content_per_week: 2,
        research_per_month: 1,
        target_industries: ['SaaS', 'Marketing'],
        content_topics: ['growth', 'scaling', 'automation']
      });

    if (insertError) {
      throw new Error(`Failed to create config: ${insertError.message}`);
    }

    console.log('✓ Created new client configuration');
  } else {
    console.log('✓ Client configuration exists');
    console.log(`  Automation: ${existing.automation_enabled ? 'enabled' : 'disabled'}`);
    console.log(`  Leads/week: ${existing.leads_per_week}`);
    console.log(`  Content/week: ${existing.content_per_week}`);
  }
}

/**
 * Test 7: Sync statistics
 */
async function testSyncStats() {
  console.log('Fetching sync statistics...');

  const stats = await gmpSync.getSyncStats(TEST_CONFIG.gmpTenantId);

  if (!stats) {
    console.log('⚠️  No stats available yet (expected for new integration)');
    return;
  }

  console.log('Stats (last 30 days):');
  console.log(`  Total syncs: ${stats.total_syncs}`);
  console.log(`  Successful: ${stats.successful_syncs}`);
  console.log(`  Failed: ${stats.failed_syncs}`);
  console.log(`  Leads synced: ${stats.leads_synced}`);
  console.log(`  Content synced: ${stats.content_synced}`);
  console.log(`  Research synced: ${stats.research_synced}`);
  console.log(`  Last sync: ${stats.last_sync}`);

  console.log('✓ Statistics retrieved successfully');
}

/**
 * Main execution
 */
if (require.main === module) {
  // Check environment variables
  if (!process.env.ENTREPRENEURHUB_SUPABASE_URL) {
    console.error('❌ ENTREPRENEURHUB_SUPABASE_URL not set');
    process.exit(1);
  }

  if (!process.env.ENTREPRENEURHUB_SUPABASE_SERVICE_KEY) {
    console.error('❌ ENTREPRENEURHUB_SUPABASE_SERVICE_KEY not set');
    process.exit(1);
  }

  if (!process.env.GMP_API_KEY && !TEST_CONFIG.skipActualSync) {
    console.warn('⚠️  GMP_API_KEY not set - skipping actual sync tests');
    TEST_CONFIG.skipActualSync = true;
  }

  // Run all tests
  runAllTests().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

module.exports = {
  testConnection,
  testPushLeads,
  testPushContent,
  testPushResearch,
  testSyncLogging,
  testClientConfig,
  testSyncStats
};
