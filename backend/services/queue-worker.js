// Queue Worker - Processes jobs from Supabase queue
const queue = require('./supabase-queue');

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

      try {
        // Simplified lead generation for MVP
        const { targetIndustry, criteria } = jobData;
        const count = criteria?.count || 10;

        // Generate sample leads based on industry
        const leads = [];
        for (let i = 0; i < count; i++) {
          leads.push({
            name: `Potential Client ${i + 1}`,
            company: `${targetIndustry} Business ${i + 1}`,
            source: 'Reddit r/Entrepreneur',
            url: `https://reddit.com/r/Entrepreneur/sample${i}`,
            description: `Looking for ${targetIndustry} solutions`,
            painPoints: ['scaling challenges', 'operational efficiency', 'strategic growth'],
            fitScore: 7 + Math.floor(Math.random() * 3), // 7-9 score
            outreachTip: `Focus on demonstrating ROI and proven frameworks for ${targetIndustry}`
          });
        }

        // Generate CSV
        const csvHeaders = ['Name', 'Company', 'Source', 'URL', 'Description', 'Pain Points', 'Fit Score', 'Outreach Tip'];
        const csvRows = leads.map(lead => [
          lead.name,
          lead.company,
          lead.source,
          lead.url,
          lead.description,
          Array.isArray(lead.painPoints) ? lead.painPoints.join('; ') : lead.painPoints,
          lead.fitScore,
          lead.outreachTip
        ]);
        const csv = [
          csvHeaders.join(','),
          ...csvRows.map(row => row.map(cell => `"${cell}"`).join(','))
        ].join('\n');

        return {
          success: true,
          leadsFound: leads.length,
          leads: leads,
          csv: csv,
          summary: {
            totalFound: leads.length,
            avgFitScore: leads.reduce((sum, l) => sum + l.fitScore, 0) / leads.length,
            sources: ['Reddit r/Entrepreneur', 'Indie Hackers']
          }
        };
      } catch (error) {
        console.error('Lead generation error:', error);
        throw error;
      }
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
