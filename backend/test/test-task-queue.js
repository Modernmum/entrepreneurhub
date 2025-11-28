// Test script for Task Queue System
require('dotenv').config();

async function testTaskQueue() {
  console.log('\n🚀 Testing Task Queue System\n');
  console.log('Note: This requires Redis to be running!');
  console.log('Start Redis with: redis-server\n');

  try {
    const taskQueue = require('../services/task-queue');

    // Wait a moment for queue to initialize
    await new Promise(resolve => setTimeout(resolve, 2000));

    console.log('✅ Task Queue initialized\n');

    // Get initial stats
    console.log('📊 Initial Queue Stats:');
    console.log('─'.repeat(50));
    const initialStats = await taskQueue.getAllStats();
    console.log(JSON.stringify(initialStats, null, 2));
    console.log('\n');

    // Test 1: Content Creation Job
    console.log('Test 1: Submit Content Creation Job');
    console.log('─'.repeat(50));
    const contentJob = await taskQueue.addJob('contentCreation', {
      userId: 'test-user-123',
      topic: 'How to build an AI-powered business in 2025',
      keywords: ['AI', 'automation', 'entrepreneurship'],
      tone: 'inspiring',
      wordCount: 500
    });
    console.log(`Job ID: ${contentJob.id}`);
    console.log('Waiting for job to complete...\n');

    // Wait for job to complete (max 60 seconds)
    let attempts = 0;
    let jobStatus;
    while (attempts < 30) {
      await new Promise(resolve => setTimeout(resolve, 2000));
      jobStatus = await taskQueue.getJobStatus('contentCreation', contentJob.id);

      if (jobStatus.state === 'completed') {
        console.log('✅ Job completed!\n');
        console.log('Result:', JSON.stringify(jobStatus.result, null, 2));
        break;
      } else if (jobStatus.state === 'failed') {
        console.error('❌ Job failed:', jobStatus.failedReason);
        break;
      } else {
        console.log(`⏳ Job state: ${jobStatus.state} (attempt ${attempts + 1}/30)`);
      }

      attempts++;
    }

    if (attempts >= 30) {
      console.warn('⚠️  Job did not complete within 60 seconds');
    }

    // Get final stats
    console.log('\n📊 Final Queue Stats:');
    console.log('─'.repeat(50));
    const finalStats = await taskQueue.getAllStats();
    console.log(JSON.stringify(finalStats, null, 2));

    console.log('\n✅ Task Queue test complete!\n');
    process.exit(0);

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('\nMake sure Redis is running: redis-server');
    process.exit(1);
  }
}

// Run test
testTaskQueue();
