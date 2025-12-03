#!/usr/bin/env node
// Daily Autonomous Automation - Runs for Both Companies
// Run this daily via cron: 0 6 * * * node run-daily-automation.js

require('dotenv').config();
const agent = require('./services/autonomous-agent');
const maggieConfig = require('./config/maggie-forbes-config');
const gmpConfig = require('./config/gmp-config');
const notifications = require('./services/notifications');

async function runDailyAutomation() {
  console.log('\n' + '='.repeat(70));
  console.log('🤖 AUTONOMOUS DAILY AUTOMATION');
  console.log('='.repeat(70));
  console.log(`Date: ${new Date().toLocaleString()}`);
  console.log('Companies: Maggie Forbes Strategies + Growth Manager Pro\n');

  const results = {
    maggieForbes: null,
    gmp: null,
    startTime: new Date(),
    endTime: null
  };

  try {
    // ========================================================================
    // RUN FOR MAGGIE FORBES STRATEGIES
    // ========================================================================

    console.log('📊 MAGGIE FORBES STRATEGIES');
    console.log('-'.repeat(70));
    console.log('Target Industry:', maggieConfig.goals.targetIndustry);
    console.log('Monthly Lead Target:', maggieConfig.goals.monthlyLeadTarget);
    console.log('Content per Week:', maggieConfig.goals.contentPerWeek);
    console.log('\n🚀 Starting autonomous business day...\n');

    results.maggieForbes = await agent.runBusinessDay(
      maggieConfig.tenantId,
      maggieConfig.goals
    );

    if (results.maggieForbes.success) {
      console.log('✅ MAGGIE FORBES: SUCCESS\n');
      console.log('Priority:', results.maggieForbes.plan.priority);
      console.log('Actions:', results.maggieForbes.plan.actions.length);
      console.log('Tasks Completed:', results.maggieForbes.results.filter(r => r.success).length);
      console.log('\nSummary:', results.maggieForbes.report.executiveSummary);
    } else {
      console.log('❌ MAGGIE FORBES: FAILED');
      console.log('Error:', results.maggieForbes.error);
    }

    console.log('\n' + '='.repeat(70) + '\n');

    // ========================================================================
    // RUN FOR GROWTH MANAGER PRO
    // ========================================================================

    console.log('📊 GROWTH MANAGER PRO');
    console.log('-'.repeat(70));
    console.log('Target Industry:', gmpConfig.goals.targetIndustry);
    console.log('Monthly Lead Target:', gmpConfig.goals.monthlyLeadTarget);
    console.log('Content per Week:', gmpConfig.goals.contentPerWeek);
    console.log('\n🚀 Starting autonomous business day...\n');

    results.gmp = await agent.runBusinessDay(
      gmpConfig.tenantId,
      gmpConfig.goals
    );

    if (results.gmp.success) {
      console.log('✅ GROWTH MANAGER PRO: SUCCESS\n');
      console.log('Priority:', results.gmp.plan.priority);
      console.log('Actions:', results.gmp.plan.actions.length);
      console.log('Tasks Completed:', results.gmp.results.filter(r => r.success).length);
      console.log('\nSummary:', results.gmp.report.executiveSummary);
    } else {
      console.log('❌ GROWTH MANAGER PRO: FAILED');
      console.log('Error:', results.gmp.error);
    }

    console.log('\n' + '='.repeat(70) + '\n');

    // ========================================================================
    // FINAL SUMMARY
    // ========================================================================

    results.endTime = new Date();
    const duration = (results.endTime - results.startTime) / 1000 / 60; // minutes

    console.log('📋 DAILY AUTOMATION SUMMARY');
    console.log('-'.repeat(70));
    console.log('Duration:', duration.toFixed(1), 'minutes');
    console.log('Maggie Forbes:', results.maggieForbes.success ? '✅' : '❌');
    console.log('Growth Manager Pro:', results.gmp.success ? '✅' : '❌');
    console.log('\nMaggie Forbes Actions:');
    if (results.maggieForbes.success) {
      results.maggieForbes.results.forEach(r => {
        console.log(`  - ${r.task}: ${r.success ? '✅' : '❌'}`);
      });
    }
    console.log('\nGMP Actions:');
    if (results.gmp.success) {
      results.gmp.results.forEach(r => {
        console.log(`  - ${r.task}: ${r.success ? '✅' : '❌'}`);
      });
    }

    console.log('\n' + '='.repeat(70));
    console.log('✅ DAILY AUTOMATION COMPLETE');
    console.log('='.repeat(70) + '\n');

    // ========================================================================
    // SEND NOTIFICATIONS
    // ========================================================================

    if (maggieConfig.notifications.dailySummary || gmpConfig.notifications.dailySummary) {
      await sendDailySummaryNotification(results);
    }

    process.exit(0);

  } catch (error) {
    console.error('\n❌ FATAL ERROR IN DAILY AUTOMATION');
    console.error('Error:', error.message);
    console.error('Stack:', error.stack);

    // Send error notification
    if (notifications) {
      try {
        await notifications.sendMessage('🚨 Daily Automation Failed', {
          error: error.message,
          maggieForbes: results.maggieForbes?.success || false,
          gmp: results.gmp?.success || false
        });
      } catch (notifError) {
        console.error('Failed to send error notification:', notifError);
      }
    }

    process.exit(1);
  }
}

async function sendDailySummaryNotification(results) {
  try {
    const message = `
📊 **Daily Automation Summary**

**Maggie Forbes Strategies:** ${results.maggieForbes.success ? '✅ Success' : '❌ Failed'}
${results.maggieForbes.success ? `- ${results.maggieForbes.report.executiveSummary}` : `- Error: ${results.maggieForbes.error}`}

**Growth Manager Pro:** ${results.gmp.success ? '✅ Success' : '❌ Failed'}
${results.gmp.success ? `- ${results.gmp.report.executiveSummary}` : `- Error: ${results.gmp.error}`}

**Duration:** ${((results.endTime - results.startTime) / 1000 / 60).toFixed(1)} minutes

View details: Dashboard
    `.trim();

    await notifications.sendMessage('Daily Automation Complete', message);
  } catch (error) {
    console.error('Failed to send summary notification:', error);
  }
}

// Run the automation
if (require.main === module) {
  runDailyAutomation();
}

module.exports = runDailyAutomation;
