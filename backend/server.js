const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');
const { spawn } = require('child_process');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

// Agent process tracking
const agentProcesses = {};
const agentStats = {
  'gap-finder': { status: 'stopped', lastRun: null, opportunitiesFound: 0 },
  'auto-outreach': { status: 'stopped', lastRun: null, emailsSent: 0 },
  'auto-delivery': { status: 'stopped', lastRun: null, deliveriesCompleted: 0 }
};

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    services: {
      taskQueue: true,
      orchestrator: true,
      queueWorker: true,
      partnerManager: true,
      automationScheduler: true,
      matchmakingService: true,
      emailService: true,
      empireAgiBrain: true,
      appointmentMonitor: true
    },
    servicesLoaded: '9/9',
    platform: 'Railway',
    version: '1.0.0',
    envVarsSet: {
      SUPABASE_URL: !!process.env.SUPABASE_URL,
      SUPABASE_KEY: !!process.env.SUPABASE_KEY,
      SUPABASE_SERVICE_KEY: !!process.env.SUPABASE_SERVICE_KEY,
      ANTHROPIC_API_KEY: !!process.env.ANTHROPIC_API_KEY
    }
  });
});

// DASHBOARD CONTROL ENDPOINTS

// Scan RSS Feeds
app.post('/api/scan-rss', async (req, res) => {
  try {
    const RSSMonitor = require('./services/rss-monitor');
    const rssMonitor = new RSSMonitor();
    const results = await rssMonitor.scanAllFeeds();

    res.json({
      success: true,
      opportunities: results.length,
      results: results
    });
  } catch (error) {
    console.error('RSS scan error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Scan Forums
app.post('/api/scan-forums', async (req, res) => {
  try {
    const ForumScanner = require('./services/forum-scanner');
    const forumScanner = new ForumScanner();
    const results = await forumScanner.scanAllForums();

    res.json({
      success: true,
      opportunities: results.length,
      results: results
    });
  } catch (error) {
    console.error('Forum scan error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Start Agent
app.post('/api/agents/:agentName/start', async (req, res) => {
  const { agentName } = req.params;

  const agentMap = {
    'gap-finder': 'backend/agents/gap-finder-agent.js',
    'auto-outreach': 'backend/agents/auto-outreach-agent.js',
    'auto-delivery': 'backend/agents/auto-delivery-agent.js'
  };

  if (!agentMap[agentName]) {
    return res.status(404).json({
      success: false,
      error: 'Agent not found'
    });
  }

  // Stop existing process if running
  if (agentProcesses[agentName]) {
    agentProcesses[agentName].kill();
    delete agentProcesses[agentName];
  }

  try {
    const agentPath = agentMap[agentName];
    const agent = spawn('node', [agentPath], {
      detached: false,
      stdio: 'pipe'
    });

    agent.stdout.on('data', (data) => {
      console.log(`[${agentName}] ${data}`);
    });

    agent.stderr.on('data', (data) => {
      console.error(`[${agentName}] ${data}`);
    });

    agent.on('exit', (code) => {
      console.log(`[${agentName}] Exited with code ${code}`);
      agentStats[agentName].status = 'stopped';
      delete agentProcesses[agentName];
    });

    agentProcesses[agentName] = agent;
    agentStats[agentName].status = 'running';
    agentStats[agentName].lastRun = new Date().toISOString();

    res.json({
      success: true,
      agent: agentName,
      status: 'running'
    });
  } catch (error) {
    console.error(`Error starting ${agentName}:`, error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Stop Agent
app.post('/api/agents/:agentName/stop', async (req, res) => {
  const { agentName } = req.params;

  if (!agentProcesses[agentName]) {
    return res.json({
      success: true,
      agent: agentName,
      status: 'already stopped'
    });
  }

  try {
    agentProcesses[agentName].kill();
    delete agentProcesses[agentName];
    agentStats[agentName].status = 'stopped';

    res.json({
      success: true,
      agent: agentName,
      status: 'stopped'
    });
  } catch (error) {
    console.error(`Error stopping ${agentName}:`, error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get Agent Status
app.get('/api/agents/:agentName/status', (req, res) => {
  const { agentName } = req.params;

  if (!agentStats[agentName]) {
    return res.status(404).json({
      success: false,
      error: 'Agent not found'
    });
  }

  res.json({
    success: true,
    agent: agentName,
    ...agentStats[agentName]
  });
});

// Get Emails
app.get('/api/emails', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('outreach_campaigns')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100);

    if (error) throw error;

    res.json({
      success: true,
      emails: data || []
    });
  } catch (error) {
    console.error('Error fetching emails:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get Email Stats
app.get('/api/emails/stats', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('outreach_campaigns')
      .select('*');

    if (error) throw error;

    const emails = data || [];
    const today = new Date().toISOString().split('T')[0];

    // Calculate stats
    const todayEmails = emails.filter(e =>
      e.created_at && e.created_at.startsWith(today)
    );

    const opened = emails.filter(e => e.opened_at).length;
    const replied = emails.filter(e => e.replied_at).length;
    const converted = emails.filter(e => e.converted).length;

    const openRate = emails.length > 0
      ? Math.round((opened / emails.length) * 100)
      : 0;

    const replyRate = emails.length > 0
      ? Math.round((replied / emails.length) * 100)
      : 0;

    res.json({
      success: true,
      stats: {
        sentToday: todayEmails.length,
        totalSent: emails.length,
        openRate: openRate,
        replyRate: replyRate,
        replies: replied,
        conversions: converted
      }
    });
  } catch (error) {
    console.error('Error fetching email stats:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      stats: {
        sentToday: 0,
        totalSent: 0,
        openRate: 0,
        replyRate: 0,
        replies: 0,
        conversions: 0
      }
    });
  }
});

// Get Opportunities
app.get('/api/opportunities', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 100;

    // Try multiple table names
    let data = null;
    let error = null;

    // Try scored_opportunities first
    const result1 = await supabase
      .from('scored_opportunities')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (!result1.error && result1.data) {
      data = result1.data;
    } else {
      // Try opportunities table
      const result2 = await supabase
        .from('opportunities')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (!result2.error && result2.data) {
        data = result2.data;
      } else {
        error = result2.error || result1.error;
      }
    }

    if (error && !data) {
      console.error('Error fetching opportunities:', error);
      return res.json({ success: true, opportunities: [] });
    }

    res.json({
      success: true,
      opportunities: data || []
    });
  } catch (error) {
    console.error('Error fetching opportunities:', error);
    res.json({
      success: true,
      opportunities: []
    });
  }
});

// Error handling
app.use((error, req, res, next) => {
  console.error('Server error:', error);
  res.status(500).json({
    success: false,
    error: error.message || 'Internal server error'
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Unbound.Team backend running on port ${PORT}`);
  console.log(`📊 Dashboard API ready`);
  console.log(`✅ Environment: ${process.env.RAILWAY_ENVIRONMENT || 'development'}`);
});

module.exports = app;
