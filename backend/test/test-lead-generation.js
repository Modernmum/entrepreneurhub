// Test script for Lead Generation
require('dotenv').config();

async function testLeadGeneration() {
  console.log('\n🚀 Testing Lead Generation System\n');

  try {
    const leadScraper = require('../services/lead-scraper');

    // Test lead generation
    console.log('Test: Generate Leads for SaaS Founders');
    console.log('─'.repeat(50));

    const leads = await leadScraper.findLeads({
      targetIndustry: 'SaaS',
      location: 'global',
      criteria: {
        count: 10,
        minScore: 6,
        industry: 'SaaS'
      }
    });

    console.log(`\n✅ Found ${leads.length} leads\n`);

    // Display results
    leads.forEach((lead, index) => {
      console.log(`${index + 1}. ${lead.name}`);
      console.log(`   Company: ${lead.company || 'Unknown'}`);
      console.log(`   Source: ${lead.source}`);
      console.log(`   Fit Score: ${lead.fitScore || 'N/A'}/10`);
      console.log(`   URL: ${lead.url}`);
      if (lead.painPoints) {
        console.log(`   Pain Points: ${lead.painPoints}`);
      }
      console.log('');
    });

    // Test CSV export
    console.log('Exporting to CSV...');
    const csv = leadScraper.exportToCSV(leads);
    console.log('\nCSV Preview:');
    console.log(csv.split('\n').slice(0, 3).join('\n'));
    console.log('...\n');

    console.log('✅ Lead generation test complete!\n');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// Run test
testLeadGeneration();
