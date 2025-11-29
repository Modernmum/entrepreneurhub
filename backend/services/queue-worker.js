// Queue Worker - Processes jobs from Supabase queue
const queue = require('./supabase-queue');
const leadScraper = require('./lead-scraper');
const orchestrator = require('./ai-orchestrator');

class QueueWorker {
  constructor() {
    this.isRunning = false;
    this.processors = {};
    this.setupProcessors();
  }

  setupProcessors() {
    // Lead Generation Processor
    this.processors.leadGeneration = async (jobData) => {
      console.log('📊 Processing lead generation job...');
      const leads = await leadScraper.findLeads(jobData);

      return {
        success: true,
        leadsFound: leads.length,
        leads: leads,
        summary: {
          totalFound: leads.length,
          avgFitScore: leads.reduce((sum, l) => sum + (l.fitScore || 0), 0) / (leads.length || 1),
          sources: [...new Set(leads.map(l => l.source))]
        }
      };
    };

    // Add more processors as needed
    this.processors.contentCreation = async (jobData) => {
      console.log('📝 Processing content creation job...');
      // Implement content creation
      return { success: true, message: 'Content created' };
    };
  }

  async processQueue(queueName) {
    if (!this.processors[queueName]) {
      console.log(`⚠️  No processor for queue: ${queueName}`);
      return;
    }

    try {
      const job = await queue.getNextJob(queueName);

      if (!job) {
        return; // No jobs to process
      }

      console.log(`🔄 Processing job ${job.id} from ${queueName}`);

      try {
        const result = await this.processors[queueName](job.job_data);
        await queue.completeJob(job.id, result);
        console.log(`✅ Job ${job.id} completed`);
      } catch (error) {
        console.error(`❌ Job ${job.id} failed:`, error.message);
        await queue.failJob(job.id, error.message);
      }
    } catch (error) {
      console.error(`Error processing ${queueName}:`, error.message);
    }
  }

  async start() {
    if (this.isRunning) {
      console.log('⚠️  Worker already running');
      return;
    }

    this.isRunning = true;
    console.log('🚀 Queue worker started');

    // Process queues every 5 seconds
    this.interval = setInterval(async () => {
      const queues = ['leadGeneration', 'contentCreation', 'marketResearch', 'landingPage', 'emailMarketing'];

      for (const queueName of queues) {
        await this.processQueue(queueName);
      }
    }, 5000);
  }

  stop() {
    if (this.interval) {
      clearInterval(this.interval);
      this.isRunning = false;
      console.log('⏹️  Queue worker stopped');
    }
  }
}

module.exports = new QueueWorker();
