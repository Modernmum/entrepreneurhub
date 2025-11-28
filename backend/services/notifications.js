// Notification Service - Discord/Email alerts for job completion
const axios = require('axios');

class NotificationService {
  constructor() {
    this.discordWebhook = process.env.DISCORD_WEBHOOK_URL;
    this.emailEnabled = false; // TODO: Set up email service

    console.log('✅ Notification Service initialized');
  }

  // ============================================================================
  // DISCORD NOTIFICATIONS
  // ============================================================================

  async sendDiscordNotification(title, message, type = 'info') {
    if (!this.discordWebhook) {
      console.log('⚠️  Discord webhook not configured, skipping notification');
      return false;
    }

    try {
      const colors = {
        success: 3066993,  // Green
        error: 15158332,   // Red
        warning: 15105570, // Orange
        info: 3447003      // Blue
      };

      const embed = {
        title: title,
        description: message,
        color: colors[type] || colors.info,
        timestamp: new Date().toISOString(),
        footer: {
          text: 'Unbound.team - Your Autonomous AI Team'
        }
      };

      await axios.post(this.discordWebhook, {
        embeds: [embed]
      });

      console.log('✅ Discord notification sent');
      return true;
    } catch (error) {
      console.error('❌ Failed to send Discord notification:', error.message);
      return false;
    }
  }

  // ============================================================================
  // JOB-SPECIFIC NOTIFICATIONS
  // ============================================================================

  async notifyJobCompleted(queueName, jobId, result) {
    const title = `✅ Job Completed: ${this.formatQueueName(queueName)}`;

    let message = `Job ID: ${jobId}\n`;
    message += `Status: Completed successfully\n`;

    // Add solution-specific details
    if (result) {
      if (result.leadsFound) {
        message += `\n📊 Results:\n`;
        message += `- Leads found: ${result.leadsFound}\n`;
        message += `- Cost: $${result.cost?.dailyTotal?.toFixed(4) || 'N/A'}`;
      } else if (result.wordCount) {
        message += `\n📊 Results:\n`;
        message += `- Words generated: ${result.wordCount}\n`;
        message += `- Cost: $${result.totalCost?.toFixed(4) || 'N/A'}`;
      } else if (result.analysis) {
        message += `\n📊 Market research completed`;
      }
    }

    await this.sendDiscordNotification(title, message, 'success');
  }

  async notifyJobFailed(queueName, jobId, error) {
    const title = `❌ Job Failed: ${this.formatQueueName(queueName)}`;

    const message = `Job ID: ${jobId}\n` +
                   `Error: ${error}\n\n` +
                   `The job will be retried automatically.`;

    await this.sendDiscordNotification(title, message, 'error');
  }

  async notifyJobStalled(queueName, jobId) {
    const title = `⚠️ Job Stalled: ${this.formatQueueName(queueName)}`;

    const message = `Job ID: ${jobId}\n` +
                   `Status: Job has stalled and may need manual intervention.`;

    await this.sendDiscordNotification(title, message, 'warning');
  }

  async notifyNewUserSignup(userId, email) {
    const title = '🎉 New User Signup';

    const message = `User ID: ${userId}\n` +
                   `Email: ${email}\n` +
                   `Time: ${new Date().toLocaleString()}`;

    await this.sendDiscordNotification(title, message, 'success');
  }

  async notifyDailySpendingWarning(currentSpending, limit) {
    const title = '⚠️ Daily Spending Warning';

    const percentage = (currentSpending / limit * 100).toFixed(1);
    const message = `Current spending: $${currentSpending.toFixed(2)}\n` +
                   `Daily limit: $${limit.toFixed(2)}\n` +
                   `Usage: ${percentage}%\n\n` +
                   `Approaching daily spending cap!`;

    await this.sendDiscordNotification(title, message, 'warning');
  }

  async notifySpendingCapReached(currentSpending, limit) {
    const title = '🛑 Daily Spending Cap Reached';

    const message = `Spending: $${currentSpending.toFixed(2)}\n` +
                   `Limit: $${limit.toFixed(2)}\n\n` +
                   `All AI operations paused until tomorrow.`;

    await this.sendDiscordNotification(title, message, 'error');
  }

  async notifyDiscoveryOpportunity(source, opportunity) {
    const title = '🎯 New Opportunity Discovered';

    const message = `Source: ${source}\n` +
                   `Opportunity: ${opportunity}\n` +
                   `Time: ${new Date().toLocaleString()}`;

    await this.sendDiscordNotification(title, message, 'info');
  }

  async notifyReferralReceived(referrer, newUser) {
    const title = '🤝 New Referral';

    const message = `Referrer: ${referrer}\n` +
                   `New User: ${newUser}\n` +
                   `Time: ${new Date().toLocaleString()}`;

    await this.sendDiscordNotification(title, message, 'success');
  }

  // ============================================================================
  // EMAIL NOTIFICATIONS (TODO)
  // ============================================================================

  async sendEmail(to, subject, body) {
    if (!this.emailEnabled) {
      console.log('⚠️  Email service not configured');
      return false;
    }

    // TODO: Implement email sending (SendGrid, Resend, or self-hosted SMTP)
    console.log('📧 Email notification (not implemented):', { to, subject });
    return false;
  }

  async notifyJobCompletedByEmail(userEmail, queueName, jobId, result) {
    const subject = `Your ${this.formatQueueName(queueName)} is ready!`;

    let body = `Your job (ID: ${jobId}) has completed successfully.\n\n`;
    body += `Results are available in your dashboard.\n\n`;
    body += `- Unbound.team`;

    await this.sendEmail(userEmail, subject, body);
  }

  // ============================================================================
  // DAILY SUMMARY
  // ============================================================================

  async sendDailySummary(stats) {
    const title = '📊 Daily Summary - Unbound.team';

    let message = `**Jobs Completed Today:**\n`;
    message += `- Lead Generation: ${stats.leadGeneration?.completed || 0}\n`;
    message += `- Content Creation: ${stats.contentCreation?.completed || 0}\n`;
    message += `- Market Research: ${stats.marketResearch?.completed || 0}\n`;
    message += `- Landing Pages: ${stats.landingPage?.completed || 0}\n`;
    message += `- Email Marketing: ${stats.emailMarketing?.completed || 0}\n\n`;
    message += `**AI Spending:** $${stats.totalSpending?.toFixed(2) || '0.00'}\n`;
    message += `**Success Rate:** ${stats.successRate || 0}%\n`;

    await this.sendDiscordNotification(title, message, 'info');
  }

  // ============================================================================
  // HELPERS
  // ============================================================================

  formatQueueName(queueName) {
    const names = {
      leadGeneration: 'Lead Generation',
      contentCreation: 'Content Creation',
      marketResearch: 'Market Research',
      landingPage: 'Landing Page Builder',
      emailMarketing: 'Email Marketing',
      discovery: 'Discovery',
      outreach: 'Outreach'
    };

    return names[queueName] || queueName;
  }

  // Test notification
  async test() {
    await this.sendDiscordNotification(
      '🧪 Test Notification',
      'Notification system is working correctly!',
      'success'
    );
  }
}

module.exports = new NotificationService();
