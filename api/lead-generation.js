// Vercel Serverless Function for Lead Generation
const { createClient } = require('@supabase/supabase-js');

module.exports = async (req, res) => {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_KEY
    );

    // POST: Create new lead generation job
    if (req.method === 'POST') {
      const { targetIndustry, location, criteria } = req.body;

      // Add job to queue
      const { data, error } = await supabase
        .from('job_queue')
        .insert({
          queue_name: 'leadGeneration',
          job_data: { targetIndustry, location, criteria },
          priority: 0,
          max_attempts: 3
        })
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to create job: ${error.message}`);
      }

      return res.status(200).json({
        success: true,
        jobId: data.id,
        status: 'queued',
        message: 'Lead generation job created. Use /api/lead-generation?jobId=<id> to check status.'
      });
    }

    // GET: Check job status
    if (req.method === 'GET') {
      const { jobId } = req.query;

      if (!jobId) {
        return res.status(400).json({ error: 'jobId required' });
      }

      const { data: job, error } = await supabase
        .from('job_queue')
        .select('*')
        .eq('id', jobId)
        .single();

      if (error || !job) {
        return res.status(404).json({ error: 'Job not found' });
      }

      return res.status(200).json({
        success: true,
        jobId: job.id,
        status: job.status,
        result: job.result,
        error: job.error,
        createdAt: job.created_at,
        completedAt: job.completed_at
      });
    }

    return res.status(405).json({ error: 'Method not allowed' });

  } catch (error) {
    console.error('Lead generation error:', error);
    return res.status(500).json({
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};
