// ============================================================================
// AUTOMATION SCHEDULER SERVICE
// ============================================================================
// Hybrid system: Scheduled automatic tasks + on-demand manual triggers
// ============================================================================

const cron = require('node-cron');
const taskQueue = require('./supabase-queue');
const rssMonitor = require('./rss-monitor');
const forumScraper = require('./forum-scraper');
const orchestrator = require('./ai-orchestrator');
const partnerManager = require('./partner-manager');
const socialProofAutomation = require('./social-proof-automation');
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

class AutomationScheduler {
  constructor() {
    this.jobs = [];
    this.isRunning = false;
  }

  // ==========================================================================
  // START/STOP SCHEDULER
  // ==========================================================================

  start() {
    console.log('🤖 Starting Automation Scheduler...');
    this.isRunning = true;

    // Schedule all automated tasks
    this.schedulePartnerLeadGeneration();
    this.scheduleOpportunityDiscovery();
    this.scheduleSocialProofCollection();
    this.scheduleRevenueCalculation();
    this.scheduleCrossPromotion();

    console.log('✅ Automation Scheduler started');
  }

  stop() {
    console.log('Stopping Automation Scheduler...');
    this.jobs.forEach(job => job.stop());
    this.isRunning = false;
    console.log('✅ Automation Scheduler stopped');
  }

  // ==========================================================================
  // SCHEDULED LEAD GENERATION (For Partners)
  // ==========================================================================

  /**
   * Weekly lead generation for Maggie Forbes
   * Runs every Monday at 9am
   */
  schedulePartnerLeadGeneration() {
    const job = cron.schedule('0 9 * * 1', async () => {
      console.log('📅 Running weekly partner lead generation...');

      try {
        // Get partner automation settings
        const partners = await this.getPartnersWithAutoLeadGen();

        for (const partner of partners) {
          await this.generatePartnerLeads(partner);
        }

        console.log(`✅ Generated leads for ${partners.length} partners`);
      } catch (error) {
        console.error('Failed to generate partner leads:', error);
      }
    });

    this.jobs.push(job);
    console.log('📅 Scheduled: Weekly partner lead generation (Mon 9am)');
  }

  /**
   * Generate leads for a specific partner
   */
  async generatePartnerLeads(partner) {
    console.log(`🎯 Generating leads for ${partner.name}...`);

    // Get partner's automation settings
    const settings = partner.settings.automation || {};

    if (!settings.enabled || !settings.leadGeneration) {
      console.log(`Skipping ${partner.name} - automation not enabled`);
      return;
    }

    // Submit lead generation job
    const job = await taskQueue.addJob('leadGeneration', {
      userId: partner.primary_user_id || 'system',
      tenantId: partner.id,
      targetIndustry: settings.targetIndustry || 'entrepreneurs',
      location: settings.location || 'global',
      criteria: {
        count: settings.leadsPerWeek || 10,
        minScore: settings.minFitScore || 6,
        industry: settings.industry
      },
      isAutomated: true
    });

    console.log(`✅ Lead gen job created for ${partner.name}: ${job.id}`);

    // Log automation run
    await this.logAutomation({
      tenant_id: partner.id,
      automation_type: 'lead_generation',
      job_id: job.id,
      settings: settings
    });

    return job;
  }

  /**
   * Get partners with auto lead gen enabled
   */
  async getPartnersWithAutoLeadGen() {
    const { data: tenants } = await supabase
      .from('tenants')
      .select('*')
      .eq('status', 'active');

    return tenants.filter(t =>
      t.settings?.automation?.enabled &&
      t.settings?.automation?.leadGeneration
    );
  }

  // ==========================================================================
  // OPPORTUNITY DISCOVERY (Autonomous)
  // ==========================================================================

  /**
   * Scan RSS feeds, forums for opportunities
   * Runs every hour
   */
  scheduleOpportunityDiscovery() {
    const job = cron.schedule('0 * * * *', async () => {
      console.log('🔍 Scanning for opportunities...');

      try {
        // 1. Scan RSS feeds
        const rssOpportunities = await rssMonitor.scanFeeds();
        console.log(`Found ${rssOpportunities.length} RSS opportunities`);

        // 2. Scan forums
        const forumOpportunities = await forumScraper.scanForums();
        console.log(`Found ${forumOpportunities.length} forum opportunities`);

        // 3. Save opportunities
        const allOpportunities = [...rssOpportunities, ...forumOpportunities];
        await this.saveOpportunities(allOpportunities);

        // 4. Notify partners if high-value opportunities found
        const highValue = allOpportunities.filter(o => o.fitScore >= 8);
        if (highValue.length > 0) {
          await this.notifyPartnersOfOpportunities(highValue);
        }

        console.log(`✅ Saved ${allOpportunities.length} opportunities`);
      } catch (error) {
        console.error('Failed to scan opportunities:', error);
      }
    });

    this.jobs.push(job);
    console.log('📅 Scheduled: Hourly opportunity discovery');
  }

  /**
   * Save discovered opportunities
   */
  async saveOpportunities(opportunities) {
    for (const opp of opportunities) {
      await supabase
        .from('discovered_opportunities')
        .insert({
          source: opp.source,
          url: opp.url,
          title: opp.title,
          description: opp.description,
          business_area: opp.businessArea,
          pain_points: opp.painPoints,
          urgency: opp.urgency,
          fit_score: opp.fitScore,
          opportunity_type: opp.type,
          metadata: opp.metadata
        });
    }
  }

  /**
   * Notify partners of high-value opportunities
   */
  async notifyPartnersOfOpportunities(opportunities) {
    // TODO: Send email/Discord notification
    console.log(`📧 Would notify partners of ${opportunities.length} high-value opportunities`);
  }

  // ==========================================================================
  // SOCIAL PROOF COLLECTION
  // ==========================================================================

  /**
   * Collect testimonials from satisfied users
   * Runs daily at 10am
   */
  scheduleSocialProofCollection() {
    const job = cron.schedule('0 10 * * *', async () => {
      console.log('⭐ Collecting testimonials...');

      try {
        // Find completed jobs from 24 hours ago
        const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

        const { data: completedJobs } = await supabase
          .from('queue_jobs')
          .select('*')
          .eq('status', 'completed')
          .gte('completed_at', yesterday)
          .is('testimonial_requested', null);

        console.log(`Found ${completedJobs?.length || 0} jobs ready for testimonial request`);

        for (const job of completedJobs || []) {
          // Request testimonial
          await socialProofAutomation.collectTestimonial(
            job.user_id,
            job.id,
            job.queue_name,
            job.result
          );

          // Mark as requested
          await supabase
            .from('queue_jobs')
            .update({ testimonial_requested: true })
            .eq('id', job.id);
        }

        console.log(`✅ Requested ${completedJobs?.length || 0} testimonials`);
      } catch (error) {
        console.error('Failed to collect testimonials:', error);
      }
    });

    this.jobs.push(job);
    console.log('📅 Scheduled: Daily testimonial collection (10am)');
  }

  // ==========================================================================
  // REVENUE CALCULATION
  // ==========================================================================

  /**
   * Calculate monthly revenue for all partners
   * Runs 1st of every month at 9am
   */
  scheduleRevenueCalculation() {
    const job = cron.schedule('0 9 1 * *', async () => {
      console.log('💰 Calculating monthly revenue...');

      try {
        const currentMonth = new Date().toISOString().slice(0, 7);
        const { data: tenants } = await supabase
          .from('tenants')
          .select('slug')
          .eq('type', 'partner');

        for (const tenant of tenants || []) {
          const revenue = await partnerManager.calculateMonthlyRevenue(
            tenant.slug,
            currentMonth
          );

          console.log(`${tenant.slug}: $${revenue.total_revenue} (Partner: $${revenue.partner_share})`);
        }

        console.log('✅ Monthly revenue calculated for all partners');
      } catch (error) {
        console.error('Failed to calculate revenue:', error);
      }
    });

    this.jobs.push(job);
    console.log('📅 Scheduled: Monthly revenue calculation (1st at 9am)');
  }

  // ==========================================================================
  // CROSS-PROMOTION
  // ==========================================================================

  /**
   * Send scheduled cross-promotion campaigns
   * Runs daily at 2pm
   */
  scheduleCrossPromotion() {
    const job = cron.schedule('0 14 * * *', async () => {
      console.log('📧 Sending cross-promotion campaigns...');

      try {
        await socialProofAutomation.sendScheduledPromotions();
        console.log('✅ Cross-promotion campaigns sent');
      } catch (error) {
        console.error('Failed to send promotions:', error);
      }
    });

    this.jobs.push(job);
    console.log('📅 Scheduled: Daily cross-promotion (2pm)');
  }

  // ==========================================================================
  // AUTOMATION LOGGING
  // ==========================================================================

  async logAutomation(data) {
    await supabase
      .from('automation_log')
      .insert({
        ...data,
        created_at: new Date().toISOString()
      });
  }

  // ==========================================================================
  // MANUAL TRIGGERS (On-Demand)
  // ==========================================================================

  /**
   * Manually trigger lead generation for partner
   */
  async triggerPartnerLeadGen(tenantSlug, settings) {
    console.log(`🎯 Manual trigger: Lead gen for ${tenantSlug}`);

    const tenant = await partnerManager.getTenant(tenantSlug);

    const job = await taskQueue.addJob('leadGeneration', {
      userId: settings.userId || 'manual',
      tenantId: tenant.id,
      targetIndustry: settings.targetIndustry,
      location: settings.location || 'global',
      criteria: settings.criteria,
      isAutomated: false,
      manualTrigger: true
    });

    await this.logAutomation({
      tenant_id: tenant.id,
      automation_type: 'manual_lead_generation',
      job_id: job.id,
      settings: settings
    });

    return job;
  }

  /**
   * Manually trigger opportunity scan
   */
  async triggerOpportunityScan() {
    console.log('🔍 Manual trigger: Opportunity scan');

    const rssOpportunities = await rssMonitor.scanFeeds();
    const forumOpportunities = await forumScraper.scanForums();

    const allOpportunities = [...rssOpportunities, ...forumOpportunities];
    await this.saveOpportunities(allOpportunities);

    return {
      count: allOpportunities.length,
      opportunities: allOpportunities
    };
  }

  /**
   * Get automation status
   */
  getStatus() {
    return {
      running: this.isRunning,
      jobs: this.jobs.length,
      schedules: [
        { name: 'Partner Lead Generation', schedule: 'Weekly Mon 9am' },
        { name: 'Opportunity Discovery', schedule: 'Hourly' },
        { name: 'Testimonial Collection', schedule: 'Daily 10am' },
        { name: 'Revenue Calculation', schedule: 'Monthly 1st 9am' },
        { name: 'Cross-Promotion', schedule: 'Daily 2pm' }
      ]
    };
  }
}

module.exports = new AutomationScheduler();
