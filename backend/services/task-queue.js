// Task Queue System - Manages background jobs for autonomous operation
// Uses Bull for job queue management with Redis

const Queue = require('bull');
const orchestrator = require('./ai-orchestrator');
const notifications = require('./notifications');

class TaskQueueManager {
  constructor() {
    // Initialize queues for different task types
    this.queues = {
      leadGeneration: new Queue('lead-generation', process.env.REDIS_URL || 'redis://127.0.0.1:6379'),
      contentCreation: new Queue('content-creation', process.env.REDIS_URL || 'redis://127.0.0.1:6379'),
      marketResearch: new Queue('market-research', process.env.REDIS_URL || 'redis://127.0.0.1:6379'),
      landingPage: new Queue('landing-page', process.env.REDIS_URL || 'redis://127.0.0.1:6379'),
      emailMarketing: new Queue('email-marketing', process.env.REDIS_URL || 'redis://127.0.0.1:6379'),
      discovery: new Queue('discovery', process.env.REDIS_URL || 'redis://127.0.0.1:6379'),
      outreach: new Queue('outreach', process.env.REDIS_URL || 'redis://127.0.0.1:6379')
    };

    // Set up processors for each queue
    this.setupProcessors();

    // Set up event listeners
    this.setupEventListeners();

    console.log('✅ Task Queue Manager initialized');
  }

  // Add job to appropriate queue
  async addJob(queueName, taskData, options = {}) {
    const queue = this.queues[queueName];

    if (!queue) {
      throw new Error(`Queue "${queueName}" not found`);
    }

    const defaultOptions = {
      attempts: 3, // Retry 3 times on failure
      backoff: {
        type: 'exponential',
        delay: 2000 // Start with 2 second delay
      },
      removeOnComplete: false, // Keep completed jobs for analytics
      removeOnFail: false
    };

    const job = await queue.add(taskData, { ...defaultOptions, ...options });

    console.log(`📋 Job added to ${queueName}: ${job.id}`);

    return job;
  }

  // Set up processors for each queue
  setupProcessors() {
    // Lead Generation Processor
    this.queues.leadGeneration.process(async (job) => {
      console.log(`🔍 Processing lead generation job: ${job.id}`);
      return await this.processLeadGeneration(job.data);
    });

    // Content Creation Processor
    this.queues.contentCreation.process(async (job) => {
      console.log(`✍️ Processing content creation job: ${job.id}`);
      return await this.processContentCreation(job.data);
    });

    // Market Research Processor
    this.queues.marketResearch.process(async (job) => {
      console.log(`📊 Processing market research job: ${job.id}`);
      return await this.processMarketResearch(job.data);
    });

    // Landing Page Processor
    this.queues.landingPage.process(async (job) => {
      console.log(`🎨 Processing landing page job: ${job.id}`);
      return await this.processLandingPage(job.data);
    });

    // Email Marketing Processor
    this.queues.emailMarketing.process(async (job) => {
      console.log(`📧 Processing email marketing job: ${job.id}`);
      return await this.processEmailMarketing(job.data);
    });

    // Discovery Processor (finds opportunities on open web)
    this.queues.discovery.process(async (job) => {
      console.log(`🌐 Processing discovery job: ${job.id}`);
      return await this.processDiscovery(job.data);
    });

    // Outreach Processor (engages with prospects)
    this.queues.outreach.process(async (job) => {
      console.log(`💬 Processing outreach job: ${job.id}`);
      return await this.processOutreach(job.data);
    });
  }

  // Set up event listeners for monitoring
  setupEventListeners() {
    Object.entries(this.queues).forEach(([name, queue]) => {
      queue.on('completed', (job, result) => {
        console.log(`✅ ${name} job ${job.id} completed`);
        // Send Discord notification
        notifications.notifyJobCompleted(name, job.id, result);
      });

      queue.on('failed', (job, err) => {
        console.error(`❌ ${name} job ${job.id} failed:`, err.message);
        // Send Discord notification
        notifications.notifyJobFailed(name, job.id, err.message);
      });

      queue.on('stalled', (job) => {
        console.warn(`⚠️  ${name} job ${job.id} stalled`);
        // Send Discord notification
        notifications.notifyJobStalled(name, job.id);
      });
    });
  }

  // ============================================================================
  // JOB PROCESSORS (These actually execute the tasks)
  // ============================================================================

  async processLeadGeneration(data) {
    const { userId, targetIndustry, location, criteria } = data;

    try {
      const leadScraper = require('./lead-scraper');

      // Execute full lead generation pipeline
      const leads = await leadScraper.findLeads({
        targetIndustry,
        location,
        criteria: {
          ...criteria,
          count: criteria.count || 50,
          minScore: criteria.minScore || 6
        }
      });

      // Export formats
      const csv = leadScraper.exportToCSV(leads);
      const json = leadScraper.exportToJSON(leads);

      return {
        success: true,
        leadsFound: leads.length,
        leads: leads,
        exports: {
          csv: csv,
          json: json
        },
        summary: {
          totalFound: leads.length,
          avgFitScore: leads.reduce((sum, l) => sum + (l.fitScore || 0), 0) / leads.length,
          sources: [...new Set(leads.map(l => l.source))]
        }
      };
    } catch (error) {
      console.error('Lead generation failed:', error);
      throw error;
    }
  }

  async processContentCreation(data) {
    const { userId, topic, keywords, tone, wordCount } = data;

    try {
      // Step 1: Research the topic
      const research = await orchestrator.execute(
        'deep-research',
        `Research the topic: ${topic}. Keywords: ${keywords.join(', ')}.
        Provide key insights, statistics, and unique angles for a ${wordCount}-word blog post.`
      );

      // Step 2: Generate content outline
      const outline = await orchestrator.execute(
        'content-generation',
        `Create a detailed outline for a blog post about ${topic}.
        Keywords to include: ${keywords.join(', ')}
        Tone: ${tone}
        Target length: ${wordCount} words

        Based on this research:
        ${research.content}`
      );

      // Step 3: Write full content
      const content = await orchestrator.execute(
        'content-generation',
        `Write a complete ${wordCount}-word blog post following this outline:

        ${outline.content}

        Requirements:
        - Tone: ${tone}
        - Include keywords: ${keywords.join(', ')}
        - SEO-optimized
        - Ready to publish
        - Include meta description and title`
      );

      return {
        success: true,
        content: content.content,
        research: research.content,
        outline: outline.content,
        wordCount: content.content.split(' ').length,
        totalCost: research.usage.cost + outline.usage.cost + content.usage.cost
      };
    } catch (error) {
      console.error('Content creation failed:', error);
      throw error;
    }
  }

  async processMarketResearch(data) {
    const { userId, idea, industry, competitors } = data;

    try {
      // Use AI to conduct comprehensive market research
      const analysis = await orchestrator.execute(
        'deep-research',
        `Conduct comprehensive market research for this business idea:

        Idea: ${idea}
        Industry: ${industry}
        Competitors: ${competitors?.join(', ') || 'Unknown'}

        Provide:
        1. Market size estimate
        2. Target audience analysis
        3. Competitor analysis (pricing, features, gaps)
        4. Market opportunity score (1-10)
        5. Actionable recommendations
        6. Potential risks and challenges`
      );

      return {
        success: true,
        analysis: analysis.content,
        cost: analysis.usage
      };
    } catch (error) {
      console.error('Market research failed:', error);
      throw error;
    }
  }

  async processLandingPage(data) {
    const { userId, businessInfo, goals } = data;

    try {
      // Generate landing page copy
      const copy = await orchestrator.execute(
        'content-generation',
        `Create compelling landing page copy for:

        Business: ${businessInfo.name}
        Description: ${businessInfo.description}
        Target Audience: ${businessInfo.targetAudience}
        Goals: ${goals}

        Provide:
        1. Headline
        2. Subheadline
        3. Hero section
        4. Benefits (3-5 points)
        5. CTA text
        6. Social proof section
        7. FAQ (5 questions)`
      );

      // TODO: Use Claude Code or v0.dev to generate actual HTML/CSS

      return {
        success: true,
        copy: copy.content,
        cost: copy.usage
      };
    } catch (error) {
      console.error('Landing page creation failed:', error);
      throw error;
    }
  }

  async processEmailMarketing(data) {
    const { userId, goal, audience, offer } = data;

    try {
      // Generate email sequence
      const sequence = await orchestrator.execute(
        'content-generation',
        `Create a 5-email sequence for:

        Goal: ${goal}
        Audience: ${audience}
        Offer: ${offer}

        For each email provide:
        1. Subject line (with 3 variations)
        2. Preview text
        3. Email body (conversational, value-first)
        4. CTA
        5. Send timing (Day X after signup)`
      );

      return {
        success: true,
        emailSequence: sequence.content,
        cost: sequence.usage
      };
    } catch (error) {
      console.error('Email marketing creation failed:', error);
      throw error;
    }
  }

  async processDiscovery(data) {
    // TODO: Implement web discovery (scrape forums, RSS feeds, etc.)
    console.log('Discovery job - Coming soon');
    return { success: true, message: 'Discovery system coming in Phase 2' };
  }

  async processOutreach(data) {
    // TODO: Implement outreach automation
    console.log('Outreach job - Coming soon');
    return { success: true, message: 'Outreach system coming in Phase 2' };
  }

  // ============================================================================
  // HELPER METHODS
  // ============================================================================


  // Get job status
  async getJobStatus(queueName, jobId) {
    const queue = this.queues[queueName];
    if (!queue) {
      throw new Error(`Queue "${queueName}" not found`);
    }

    const job = await queue.getJob(jobId);
    if (!job) {
      return null;
    }

    return {
      id: job.id,
      state: await job.getState(),
      progress: job.progress(),
      data: job.data,
      result: job.returnvalue,
      failedReason: job.failedReason,
      timestamp: job.timestamp,
      processedOn: job.processedOn,
      finishedOn: job.finishedOn
    };
  }

  // Get queue stats
  async getQueueStats(queueName) {
    const queue = this.queues[queueName];
    if (!queue) {
      throw new Error(`Queue "${queueName}" not found`);
    }

    const [waiting, active, completed, failed, delayed] = await Promise.all([
      queue.getWaitingCount(),
      queue.getActiveCount(),
      queue.getCompletedCount(),
      queue.getFailedCount(),
      queue.getDelayedCount()
    ]);

    return {
      queueName,
      waiting,
      active,
      completed,
      failed,
      delayed,
      total: waiting + active + completed + failed + delayed
    };
  }

  // Get all queue stats
  async getAllStats() {
    const stats = {};
    for (const queueName of Object.keys(this.queues)) {
      stats[queueName] = await this.getQueueStats(queueName);
    }
    return stats;
  }

  // Clean old completed jobs
  async cleanOldJobs(queueName, olderThan = 7 * 24 * 60 * 60 * 1000) { // 7 days default
    const queue = this.queues[queueName];
    if (!queue) {
      throw new Error(`Queue "${queueName}" not found`);
    }

    await queue.clean(olderThan, 'completed');
    await queue.clean(olderThan, 'failed');

    console.log(`🧹 Cleaned old jobs from ${queueName}`);
  }
}

module.exports = new TaskQueueManager();
