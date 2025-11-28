// Unbound.team Backend Server
// Autonomous AI workforce platform

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const taskQueue = require('./services/task-queue');
const orchestrator = require('./services/ai-orchestrator');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// ============================================================================
// HEALTH CHECK
// ============================================================================

app.get('/', (req, res) => {
  res.json({
    name: 'Unbound.team API',
    status: 'running',
    version: '1.0.0',
    mission: 'Your Autonomous AI Team - Unbound from Big Tech'
  });
});

app.get('/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// ============================================================================
// AI ORCHESTRATOR ENDPOINTS
// ============================================================================

// Get AI usage stats
app.get('/api/ai/stats', (req, res) => {
  try {
    const stats = orchestrator.getStats();
    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Test AI execution
app.post('/api/ai/test', async (req, res) => {
  try {
    const { taskType, prompt } = req.body;

    if (!taskType || !prompt) {
      return res.status(400).json({ error: 'taskType and prompt are required' });
    }

    const result = await orchestrator.execute(taskType, prompt);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============================================================================
// TASK QUEUE ENDPOINTS
// ============================================================================

// Submit a new job
app.post('/api/jobs/:queueName', async (req, res) => {
  try {
    const { queueName } = req.params;
    const taskData = req.body;

    const job = await taskQueue.addJob(queueName, taskData);

    res.json({
      success: true,
      jobId: job.id,
      queue: queueName,
      message: 'Job added to queue'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get job status
app.get('/api/jobs/:queueName/:jobId', async (req, res) => {
  try {
    const { queueName, jobId } = req.params;
    const status = await taskQueue.getJobStatus(queueName, jobId);

    if (!status) {
      return res.status(404).json({ error: 'Job not found' });
    }

    res.json(status);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get queue stats
app.get('/api/queues/:queueName/stats', async (req, res) => {
  try {
    const { queueName } = req.params;
    const stats = await taskQueue.getQueueStats(queueName);
    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get all queue stats
app.get('/api/queues/stats', async (req, res) => {
  try {
    const stats = await taskQueue.getAllStats();
    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============================================================================
// SOLUTION ENDPOINTS (The 5 Core Solutions)
// ============================================================================

// Solution #1: Lead Generation
app.post('/api/solutions/lead-generation', async (req, res) => {
  try {
    const { userId, targetIndustry, location, criteria } = req.body;

    const job = await taskQueue.addJob('leadGeneration', {
      userId,
      targetIndustry,
      location,
      criteria
    });

    res.json({
      success: true,
      jobId: job.id,
      message: 'Lead generation started. Check back in a few minutes.',
      statusUrl: `/api/jobs/leadGeneration/${job.id}`
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Solution #2: Content Creation
app.post('/api/solutions/content-creation', async (req, res) => {
  try {
    const { userId, topic, keywords, tone, wordCount } = req.body;

    const job = await taskQueue.addJob('contentCreation', {
      userId,
      topic,
      keywords,
      tone: tone || 'professional',
      wordCount: wordCount || 1000
    });

    res.json({
      success: true,
      jobId: job.id,
      message: 'Content creation started.',
      statusUrl: `/api/jobs/contentCreation/${job.id}`
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Solution #3: Market Research
app.post('/api/solutions/market-research', async (req, res) => {
  try {
    const { userId, idea, industry, competitors } = req.body;

    const job = await taskQueue.addJob('marketResearch', {
      userId,
      idea,
      industry,
      competitors
    });

    res.json({
      success: true,
      jobId: job.id,
      message: 'Market research started.',
      statusUrl: `/api/jobs/marketResearch/${job.id}`
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Solution #4: Landing Page
app.post('/api/solutions/landing-page', async (req, res) => {
  try {
    const { userId, businessInfo, goals } = req.body;

    const job = await taskQueue.addJob('landingPage', {
      userId,
      businessInfo,
      goals
    });

    res.json({
      success: true,
      jobId: job.id,
      message: 'Landing page creation started.',
      statusUrl: `/api/jobs/landingPage/${job.id}`
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Solution #5: Email Marketing
app.post('/api/solutions/email-marketing', async (req, res) => {
  try {
    const { userId, goal, audience, offer } = req.body;

    const job = await taskQueue.addJob('emailMarketing', {
      userId,
      goal,
      audience,
      offer
    });

    res.json({
      success: true,
      jobId: job.id,
      message: 'Email marketing campaign creation started.',
      statusUrl: `/api/jobs/emailMarketing/${job.id}`
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============================================================================
// START SERVER
// ============================================================================

app.listen(PORT, () => {
  console.log(`
╔═══════════════════════════════════════════════════════════════╗
║                      UNBOUND.TEAM API                         ║
║        Your Autonomous AI Team - Unbound from Big Tech        ║
╚═══════════════════════════════════════════════════════════════╝

✅ Server running on port ${PORT}
🌐 API: http://localhost:${PORT}
📊 Health: http://localhost:${PORT}/health
💰 AI Stats: http://localhost:${PORT}/api/ai/stats
📋 Queue Stats: http://localhost:${PORT}/api/queues/stats

🚀 Ready to solve entrepreneur problems autonomously!
  `);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully...');
  process.exit(0);
});
