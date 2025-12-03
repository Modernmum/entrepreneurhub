// Test script for AI Orchestrator
require('dotenv').config();
const orchestrator = require('../services/ai-orchestrator');

async function testOrchestrator() {
  console.log('\n🚀 Testing AI Orchestrator with Cost Protection\n');

  try {
    // Test 1: Content generation (should use Gemini - free)
    console.log('Test 1: Content Generation');
    console.log('─'.repeat(50));
    const result1 = await orchestrator.execute(
      'content-generation',
      'Write a short tagline for an AI-powered entrepreneur assistant platform that replaces Big Tech.',
      { maxTokens: 100 }
    );
    console.log('Response:', result1.content);
    console.log('Model Used:', result1.modelUsed);
    console.log('\n');

    // Test 2: Quick analysis (should use Gemini or GPT-4o-mini)
    console.log('Test 2: Quick Analysis');
    console.log('─'.repeat(50));
    const result2 = await orchestrator.execute(
      'quick-task',
      'What are the top 3 problems entrepreneurs face when starting a business?',
      { maxTokens: 200 }
    );
    console.log('Response:', result2.content);
    console.log('Model Used:', result2.modelUsed);
    console.log('\n');

    // Test 3: Check usage stats
    console.log('Usage Statistics');
    console.log('─'.repeat(50));
    const stats = orchestrator.getStats();
    console.log('Daily Spending:', `$${stats.dailySpending.toFixed(4)}`);
    console.log('Daily Limit:', `$${stats.dailyLimit.toFixed(2)}`);
    console.log('Remaining Budget:', `$${stats.remainingBudget.toFixed(4)}`);
    console.log('Percent Used:', `${stats.percentUsed}%`);
    console.log('Model Usage:', stats.modelUsage);
    console.log('\n');

    console.log('✅ All tests passed!\n');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    process.exit(1);
  }
}

// Run tests
testOrchestrator();
