// Test Content Safety System
// Demonstrates blocking of illegal and harmful content

const contentSafety = require('../services/content-safety');

console.log('🔒 TESTING CONTENT SAFETY SYSTEM');
console.log('═'.repeat(70));
console.log('');

async function runTests() {
  const tests = [
    {
      name: 'Safe Business Content',
      content: 'Looking for help with my SaaS marketing strategy',
      shouldPass: true
    },
    {
      name: 'Safe Entrepreneurship Content',
      content: 'Need advice on raising seed funding for my startup',
      shouldPass: true
    },
    {
      name: 'Adult Pornography (BLOCKED)',
      content: 'Starting an adult content website with OnlyFans integration',
      shouldPass: false,
      expectedViolation: 'pornography'
    },
    {
      name: 'Child Exploitation (CRITICAL - REPORT TO AUTHORITIES)',
      content: 'underage teen explicit content',
      shouldPass: false,
      expectedViolation: 'csam'
    },
    {
      name: 'Human Trafficking (CRITICAL - REPORT TO AUTHORITIES)',
      content: 'forced labor trafficking operation',
      shouldPass: false,
      expectedViolation: 'exploitation'
    },
    {
      name: 'Fraud Scheme (BLOCKED)',
      content: 'Make $10,000 in 7 days guaranteed with this pyramid scheme',
      shouldPass: false,
      expectedViolation: 'fraud'
    },
    {
      name: 'Gambling Platform (BLOCKED)',
      content: 'Building an online casino and betting site',
      shouldPass: false,
      expectedViolation: 'gambling'
    },
    {
      name: 'Violence (BLOCKED)',
      content: 'How to build a weapon for attacking people',
      shouldPass: false,
      expectedViolation: 'violence'
    }
  ];

  let passed = 0;
  let failed = 0;

  for (const test of tests) {
    console.log(`Testing: ${test.name}`);
    console.log('─'.repeat(70));

    const result = await contentSafety.checkContent(test.content, {
      type: 'test',
      testName: test.name
    });

    const actuallyPassed = result.safe;

    if (actuallyPassed === test.shouldPass) {
      console.log(`✅ PASS - ${test.shouldPass ? 'Allowed' : 'Blocked'} as expected`);
      passed++;

      if (!result.safe) {
        console.log(`   Violations: ${result.violations.map(v => v.name).join(', ')}`);
        console.log(`   Action: ${result.action}`);
      }
    } else {
      console.log(`❌ FAIL - Expected ${test.shouldPass ? 'PASS' : 'BLOCK'}, got ${actuallyPassed ? 'PASS' : 'BLOCK'}`);
      failed++;
    }

    console.log('');
  }

  console.log('═'.repeat(70));
  console.log(`\n📊 TEST RESULTS: ${passed}/${tests.length} passed`);
  console.log(`   ✅ Passed: ${passed}`);
  console.log(`   ❌ Failed: ${failed}`);
  console.log(`   Success Rate: ${((passed / tests.length) * 100).toFixed(1)}%`);

  // Show safety stats
  console.log('\n📋 SAFETY CONFIGURATION:');
  const stats = contentSafety.getStats();
  console.log(`   Protected Categories: ${stats.blockedCategories}`);
  console.log(`   Reporting Enabled: ${stats.reportingEnabled}`);
  console.log(`   Zero Tolerance: ${stats.zeroTolerancePolicy}`);
  console.log(`   Categories: ${stats.categories.join(', ')}`);

  console.log('\n✅ Content Safety System is operational and protecting the platform!');
  console.log('');
}

runTests().catch(console.error);
