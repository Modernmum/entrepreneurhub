// Supabase-based Queue System for Vercel Serverless
// Replaces Redis/Bull for serverless compatibility

const { createClient } = require('@supabase/supabase-js');

class SupabaseQueue {
  constructor() {
    this.supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_KEY
    );
  }

  // Add job to queue
  async addJob(queueName, jobData, options = {}) {
    const { data, error } = await this.supabase
      .from('job_queue')
      .insert({
        queue_name: queueName,
        job_data: jobData,
        priority: options.priority || 0,
        max_attempts: options.maxAttempts || 3
      })
      .select()
      .single();

    if (error) {
      console.error('Failed to add job:', error);
      throw new Error(`Failed to add job: ${error.message}`);
    }

    console.log(`📋 Job added to ${queueName}: ${data.id}`);
    return data;
  }

  // Get next pending job
  async getNextJob(queueName) {
    const { data, error } = await this.supabase
      .rpc('get_next_job', { queue: queueName });

    if (error) {
      console.error('Failed to get next job:', error);
      return null;
    }

    return data && data.length > 0 ? data[0] : null;
  }

  // Mark job as completed
  async completeJob(jobId, result) {
    const { error } = await this.supabase
      .rpc('complete_job', {
        job_id: jobId,
        job_result: result
      });

    if (error) {
      console.error('Failed to complete job:', error);
      throw new Error(`Failed to complete job: ${error.message}`);
    }

    console.log(`✅ Job completed: ${jobId}`);
  }

  // Mark job as failed
  async failJob(jobId, errorMessage) {
    const { error } = await this.supabase
      .rpc('fail_job', {
        job_id: jobId,
        error_message: errorMessage
      });

    if (error) {
      console.error('Failed to mark job as failed:', error);
      throw new Error(`Failed to mark job as failed: ${error.message}`);
    }

    console.log(`❌ Job failed: ${jobId}`);
  }

  // Get job status
  async getJobStatus(jobId) {
    const { data, error } = await this.supabase
      .from('job_queue')
      .select('*')
      .eq('id', jobId)
      .single();

    if (error) {
      console.error('Failed to get job status:', error);
      return null;
    }

    return data;
  }

  // Get queue stats
  async getQueueStats(queueName) {
    const { data, error } = await this.supabase
      .from('job_queue')
      .select('status')
      .eq('queue_name', queueName);

    if (error) {
      console.error('Failed to get queue stats:', error);
      return null;
    }

    const stats = {
      queueName,
      pending: 0,
      processing: 0,
      completed: 0,
      failed: 0,
      total: data.length
    };

    data.forEach(job => {
      stats[job.status] = (stats[job.status] || 0) + 1;
    });

    return stats;
  }

  // Get all queue stats
  async getAllStats() {
    const queues = [
      'leadGeneration',
      'contentCreation',
      'marketResearch',
      'landingPage',
      'emailMarketing',
      'discovery',
      'outreach'
    ];

    const stats = {};
    for (const queue of queues) {
      stats[queue] = await this.getQueueStats(queue);
    }

    return stats;
  }

  // Clean old completed jobs (older than 7 days)
  async cleanOldJobs(daysOld = 7) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    const { error } = await this.supabase
      .from('job_queue')
      .delete()
      .in('status', ['completed', 'failed'])
      .lt('created_at', cutoffDate.toISOString());

    if (error) {
      console.error('Failed to clean old jobs:', error);
      throw new Error(`Failed to clean old jobs: ${error.message}`);
    }

    console.log(`🧹 Cleaned jobs older than ${daysOld} days`);
  }

  // Track AI usage
  async trackAIUsage(modelId, taskType, inputTokens, outputTokens, cost) {
    const { error } = await this.supabase
      .from('ai_usage')
      .insert({
        model_id: modelId,
        task_type: taskType,
        input_tokens: inputTokens,
        output_tokens: outputTokens,
        cost: cost
      });

    if (error) {
      console.error('Failed to track AI usage:', error);
    }
  }

  // Get daily spending
  async getDailySpending(date = new Date()) {
    const dateStr = date.toISOString().split('T')[0];

    const { data, error } = await this.supabase
      .from('daily_spending')
      .select('*')
      .eq('date', dateStr);

    if (error) {
      console.error('Failed to get daily spending:', error);
      return null;
    }

    const totalCost = data.reduce((sum, row) => sum + parseFloat(row.total_cost), 0);

    return {
      date: dateStr,
      totalCost,
      byModel: data
    };
  }
}

module.exports = new SupabaseQueue();
