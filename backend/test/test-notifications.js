// Test script for Notification Service
require('dotenv').config();
const notifications = require('../services/notifications');

async function testNotifications() {
  console.log('\n🚀 Testing Notification Service\n');

  try {
    // Test basic Discord notification
    console.log('Test 1: Basic Discord Notification');
    console.log('─'.repeat(50));
    await notifications.test();
    console.log('✅ Test notification sent\n');

    // Wait a moment
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Test job completion notification
    console.log('Test 2: Job Completion Notification');
    console.log('─'.repeat(50));
    await notifications.notifyJobCompleted('leadGeneration', 'test-job-123', {
      leadsFound: 47,
      cost: { dailyTotal: 0.0234 }
    });
    console.log('✅ Job completion notification sent\n');

    // Wait a moment
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Test spending warning
    console.log('Test 3: Spending Warning Notification');
    console.log('─'.repeat(50));
    await notifications.notifyDailySpendingWarning(4.25, 5.00);
    console.log('✅ Spending warning sent\n');

    // Wait a moment
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Test daily summary
    console.log('Test 4: Daily Summary Notification');
    console.log('─'.repeat(50));
    await notifications.sendDailySummary({
      leadGeneration: { completed: 12 },
      contentCreation: { completed: 8 },
      marketResearch: { completed: 5 },
      landingPage: { completed: 3 },
      emailMarketing: { completed: 4 },
      totalSpending: 3.47,
      successRate: 94
    });
    console.log('✅ Daily summary sent\n');

    console.log('✅ All notification tests complete!\n');
    console.log('Check your Discord channel for the notifications.\n');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('\nMake sure DISCORD_WEBHOOK_URL is set in .env\n');
  }
}

// Run test
testNotifications();
