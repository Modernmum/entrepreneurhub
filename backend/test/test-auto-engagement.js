// Test Auto-Engagement System
require('dotenv').config();

async function testAutoEngagement() {
  console.log('\n🚀 Testing Auto-Engagement System\n');

  try {
    const autoEngagement = require('../services/auto-engagement');
    const forumScraper = require('../services/forum-scraper');

    // Clear history for testing
    autoEngagement.clearHistory();

    console.log('Test 1: Generate Helpful Responses');
    console.log('─'.repeat(50));

    // Get real opportunities from forums
    console.log('Fetching real opportunities from forums...\n');
    const opportunities = await forumScraper.getQuestionsToday();

    if (opportunities.length === 0) {
      console.log('ℹ️  No recent forum posts found. Using sample data.\n');

      // Use sample data
      opportunities.push({
        id: 'sample1',
        title: 'How do I get my first 100 customers for my SaaS?',
        text: 'I built a project management tool but struggling to get users. Any advice on where to find early adopters?',
        author: 'sample_user',
        source: 'Reddit',
        url: 'https://example.com',
        fitScore: 8,
        painPoints: 'struggling to get users',
        businessArea: 'growth'
      });
    }

    // Plan engagements
    const plan = await autoEngagement.planEngagements(opportunities);

    console.log('\n📊 Engagement Plan Summary:');
    console.log('─'.repeat(50));
    console.log(`Total opportunities: ${plan.opportunities}`);
    console.log(`Eligible for engagement: ${plan.eligible}`);
    console.log(`Engagements planned: ${plan.planned.length}`);
    console.log(`Opportunities skipped: ${plan.skipped.length}`);
    console.log(`Estimated cost: $${plan.estimatedCost.toFixed(4)}`);

    // Display planned engagements
    if (plan.planned.length > 0) {
      console.log('\n\n✅ Planned Engagements:\n');

      for (let i = 0; i < plan.planned.length; i++) {
        const engagement = plan.planned[i];
        const review = await autoEngagement.reviewEngagement(engagement);

        console.log(`${i + 1}. ${review.opportunity.title}`);
        console.log(`   Source: ${review.opportunity.source}`);
        console.log(`   Fit Score: ${review.opportunity.fitScore}/10`);
        console.log(`   Pain Points: ${review.opportunity.painPoints}`);
        console.log(`\n   📝 Suggested Response:`);
        console.log(`   "${review.suggestedResponse}"`);
        console.log(`\n   📋 Instructions: ${review.instructions}`);
        console.log(`\n   Review Checklist:`);
        review.reviewChecklist.forEach(item => console.log(`      ${item}`));
        console.log('');
      }
    }

    // Display skipped opportunities
    if (plan.skipped.length > 0) {
      console.log('\n⏭️  Skipped Opportunities:\n');

      plan.skipped.slice(0, 3).forEach((skip, i) => {
        console.log(`${i + 1}. ${skip.opportunity.title}`);
        console.log(`   Reason: ${skip.reason}`);
        console.log(`   Fit Score: ${skip.opportunity.fitScore}/10\n`);
      });

      if (plan.skipped.length > 3) {
        console.log(`   ... and ${plan.skipped.length - 3} more\n`);
      }
    }

    // Test follow-up generation
    if (plan.planned.length > 0) {
      console.log('\nTest 2: Generate Follow-Up Response');
      console.log('─'.repeat(50));

      const theirReply = "Thanks! That's really helpful. I'll try that approach.";
      const followUp = await autoEngagement.generateFollowUp(plan.planned[0], theirReply);

      if (followUp) {
        console.log(`\nTheir reply: "${theirReply}"`);
        console.log(`\n📝 Suggested follow-up:`);
        console.log(`"${followUp.followUp}"`);
        console.log(`\nCost: $${followUp.cost.toFixed(6)}`);
      }
    }

    // Stats
    console.log('\n\nTest 3: Engagement Statistics');
    console.log('─'.repeat(50));

    const stats = autoEngagement.getStats();
    console.log(`Total engagements tracked: ${stats.totalEngagements}`);
    console.log(`Last engagement: ${stats.lastEngagement || 'None'}`);
    console.log(`Settings:`);
    console.log(`  - Max per day: ${stats.settings.maxEngagementsPerDay}`);
    console.log(`  - Min fit score: ${stats.settings.minValueThreshold}/10`);
    console.log(`  - Cooldown: ${stats.settings.cooldownPeriod / (60 * 60 * 1000)}h`);
    console.log(`  - Style: ${stats.settings.responseStyle}`);
    console.log(`  - Include promotion: ${stats.settings.includePromotion}`);

    console.log('\n✅ Auto-engagement test complete!\n');
    console.log('💡 Key Principles:');
    console.log('   - Value-first, never spam');
    console.log('   - Only engage with high-fit opportunities (7+/10)');
    console.log('   - 24h cooldown prevents duplicate engagement');
    console.log('   - Responses are helpful and conversational');
    console.log('   - Manual review recommended before posting\n');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// Run test
testAutoEngagement();
