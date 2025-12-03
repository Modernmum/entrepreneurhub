// Test RSS Monitor
require('dotenv').config();

async function testRSSMonitor() {
  console.log('\n🚀 Testing RSS Monitor System\n');

  try {
    const rssMonitor = require('../services/rss-monitor');

    console.log('Test 1: Scan All RSS Feeds');
    console.log('─'.repeat(50));

    const opportunities = await rssMonitor.getOpportunitiesToday();

    console.log(`\n✅ Found ${opportunities.length} opportunities\n`);

    // Display top 10 opportunities
    const top10 = opportunities.slice(0, 10);

    top10.forEach((opp, index) => {
      console.log(`${index + 1}. ${opp.title}`);
      console.log(`   Source: ${opp.source}`);
      console.log(`   Business Area: ${opp.businessArea}`);
      console.log(`   Urgency: ${opp.urgency}`);
      console.log(`   Fit Score: ${opp.fitScore}/10`);
      console.log(`   Pain Points: ${opp.painPoints}`);
      console.log(`   URL: ${opp.url}`);
      console.log('');
    });

    // Summary by business area
    const byArea = opportunities.reduce((acc, opp) => {
      acc[opp.businessArea] = (acc[opp.businessArea] || 0) + 1;
      return acc;
    }, {});

    console.log('Opportunities by Business Area:');
    console.log('─'.repeat(50));
    Object.entries(byArea).forEach(([area, count]) => {
      console.log(`  ${area}: ${count}`);
    });

    console.log('\n✅ RSS Monitor test complete!\n');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// Run test
testRSSMonitor();
