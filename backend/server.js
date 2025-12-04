// Unbound.team Backend Server
// Autonomous AI workforce platform

require('dotenv').config();
const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3001;

// Service references (loaded safely)
let taskQueue, orchestrator, queueWorker, partnerManager, automationScheduler, matchmakingService, emailService, empireAgiBrain, appointmentMonitor;
const serviceStatus = {
  taskQueue: false,
  orchestrator: false,
  queueWorker: false,
  partnerManager: false,
  automationScheduler: false,
  matchmakingService: false,
  emailService: false,
  empireAgiBrain: false,
  appointmentMonitor: false
};

// Safely load services with error handling
try {
  taskQueue = require('./services/supabase-queue');
  serviceStatus.taskQueue = true;
  console.log('✅ Task Queue loaded');
} catch (err) {
  console.warn('⚠️  Task Queue failed to load:', err.message);
}

try {
  orchestrator = require('./services/ai-orchestrator');
  serviceStatus.orchestrator = true;
  console.log('✅ AI Orchestrator loaded');
} catch (err) {
  console.warn('⚠️  AI Orchestrator failed to load:', err.message);
}

try {
  queueWorker = require('./services/queue-worker');
  serviceStatus.queueWorker = true;
  console.log('✅ Queue Worker loaded');
} catch (err) {
  console.warn('⚠️  Queue Worker failed to load:', err.message);
}

try {
  partnerManager = require('./services/partner-manager');
  serviceStatus.partnerManager = true;
  console.log('✅ Partner Manager loaded');
} catch (err) {
  console.warn('⚠️  Partner Manager failed to load:', err.message);
}

try {
  automationScheduler = require('./services/automation-scheduler');
  serviceStatus.automationScheduler = true;
  console.log('✅ Automation Scheduler loaded');
} catch (err) {
  console.warn('⚠️  Automation Scheduler failed to load:', err.message);
}

try {
  matchmakingService = require('./services/matchmaking-service');
  serviceStatus.matchmakingService = true;
  console.log('✅ Matchmaking Service loaded');
} catch (err) {
  console.warn('⚠️  Matchmaking Service failed to load:', err.message);
}

try {
  emailService = require('./services/email-service');
  serviceStatus.emailService = true;
  console.log('✅ Email Service loaded');
} catch (err) {
  console.warn('⚠️  Email Service failed to load:', err.message);
}

try {
  empireAgiBrain = require('./services/empire-agi-brain');
  serviceStatus.empireAgiBrain = true;
  console.log('✅ Empire AGI Brain loaded');
} catch (err) {
  console.warn('⚠️  Empire AGI Brain failed to load:', err.message);
}

try {
  appointmentMonitor = require('./services/appointment-monitor');
  serviceStatus.appointmentMonitor = true;
  console.log('✅ Appointment Monitor loaded');
} catch (err) {
  console.warn('⚠️  Appointment Monitor failed to load:', err.message);
}

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
  const servicesLoaded = Object.values(serviceStatus).filter(Boolean).length;
  const totalServices = Object.keys(serviceStatus).length;

  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    services: serviceStatus,
    servicesLoaded: `${servicesLoaded}/${totalServices}`,
    platform: 'Railway',
    version: '1.0.0'
  });
});

// ============================================================================
// AI ORCHESTRATOR ENDPOINTS
// ============================================================================

// Get AI usage stats
app.get('/api/ai/stats', (req, res) => {
  try {
    if (!orchestrator) {
      return res.status(503).json({ error: 'AI Orchestrator service not available' });
    }
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
// MAGGIE FORBES API - Client Management & Lead Generation
// ============================================================================

// Add a new Maggie Forbes client
app.post('/api/maggie-forbes/clients', async (req, res) => {
  try {
    const { email, name, plan = 'premium' } = req.body;

    if (!email || !name) {
      return res.status(400).json({ error: 'email and name are required' });
    }

    const result = await partnerManager.provisionClient({
      tenantSlug: 'maggie-forbes',
      userEmail: email,
      userName: name,
      plan: plan,
      source: 'maggie-forbes-api'
    });

    res.json({
      success: true,
      client: result.user,
      message: `Client ${name} added to Maggie Forbes`
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get all Maggie Forbes clients
app.get('/api/maggie-forbes/clients', async (req, res) => {
  try {
    const { createClient } = require('@supabase/supabase-js');
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_KEY
    );

    const { data, error } = await supabase.rpc('get_maggie_forbes_clients');

    if (error) throw error;

    res.json({
      success: true,
      clients: data || [],
      count: data?.length || 0
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Generate leads for a Maggie Forbes client
app.post('/api/maggie-forbes/generate-leads', async (req, res) => {
  try {
    const { clientEmail, industry, count = 50, targetTitles } = req.body;

    if (!clientEmail) {
      return res.status(400).json({ error: 'clientEmail is required' });
    }

    const job = await taskQueue.addJob('lead-generation', {
      business: 'maggie-forbes',
      userEmail: clientEmail,
      targetIndustry: industry || 'technology',
      criteria: {
        count: count,
        targetTitles: targetTitles || ['CEO', 'VP', 'Chief', 'Director', 'President', 'Founder'],
        companySizeMin: 50,
        companySizeMax: 500
      }
    });

    res.json({
      success: true,
      jobId: job.id,
      message: `Lead generation started for ${clientEmail}`,
      estimatedTime: '2-3 minutes'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get lead generation results for a client
app.get('/api/maggie-forbes/clients/:email/leads', async (req, res) => {
  try {
    const { email } = req.params;
    const { createClient } = require('@supabase/supabase-js');
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_KEY
    );

    const { data, error } = await supabase
      .from('job_queue')
      .select('*')
      .eq('queue_name', 'lead-generation')
      .contains('job_data', { userEmail: email })
      .order('created_at', { ascending: false })
      .limit(20);

    if (error) throw error;

    res.json({
      success: true,
      client: email,
      jobs: data || [],
      totalJobs: data?.length || 0
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get Maggie Forbes business stats
app.get('/api/maggie-forbes/stats', async (req, res) => {
  try {
    const stats = await partnerManager.getTenantStats('maggie-forbes');

    res.json({
      success: true,
      tenant: 'Maggie Forbes Strategies',
      stats: stats
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============================================================================
// MATCHMAKING ENDPOINTS - $100K/Month Arbitrage Engine
// ============================================================================

// 1. Discover a need (from RSS, manual, etc.)
app.post('/api/matchmaking/discover-need', async (req, res) => {
  try {
    const { source, sourceUrl, rawContent, personName, personEmail, companyName } = req.body;

    if (!rawContent) {
      return res.status(400).json({ error: 'rawContent is required' });
    }

    const need = await matchmakingService.discoverNeed({
      source: source || 'Manual',
      sourceUrl,
      rawContent,
      personName,
      personEmail,
      companyName
    });

    res.json({
      success: true,
      need,
      message: 'Need discovered and matches are being found'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 2. Add a solution provider
app.post('/api/matchmaking/add-provider', async (req, res) => {
  try {
    const { name, email, company, title, expertiseAreas, industries, source, profileUrl } = req.body;

    if (!name || !expertiseAreas) {
      return res.status(400).json({ error: 'name and expertiseAreas are required' });
    }

    const provider = await matchmakingService.addProvider({
      name,
      email,
      company,
      title,
      expertiseAreas,
      industries,
      availability: 'available',
      source: source || 'Manual',
      profileUrl
    });

    res.json({
      success: true,
      provider,
      message: `Provider ${name} added successfully`
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 3. Get potential matches (for review)
app.get('/api/matchmaking/matches/potential', async (req, res) => {
  try {
    const minFitScore = parseFloat(req.query.minFitScore) || 7;

    const matches = await matchmakingService.getPotentialMatches(minFitScore);

    res.json({
      success: true,
      matches,
      count: matches.length
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 4. Approve a match and send introduction
app.post('/api/matchmaking/matches/:matchId/approve', async (req, res) => {
  try {
    const { matchId } = req.params;

    // Approve the match
    await matchmakingService.approveMatch(matchId);

    // Send introduction email
    const intro = await matchmakingService.sendIntroduction(matchId);

    res.json({
      success: true,
      introduction: intro,
      message: 'Match approved and introduction sent!'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 5. Mark deal as closed
app.post('/api/matchmaking/matches/:matchId/close-deal', async (req, res) => {
  try {
    const { matchId } = req.params;
    const { dealValue, finderFee } = req.body;

    if (!finderFee) {
      return res.status(400).json({ error: 'finderFee is required' });
    }

    const payment = await matchmakingService.markDealClosed(matchId, dealValue, finderFee);

    res.json({
      success: true,
      payment,
      message: `Deal closed! Expected payment: $${finderFee / 100}`
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 6. Get recent introductions
app.get('/api/matchmaking/introductions', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 20;

    const introductions = await matchmakingService.getRecentIntroductions(limit);

    res.json({
      success: true,
      introductions,
      count: introductions.length
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 7. Get matchmaking stats (revenue, deals, etc.)
app.get('/api/matchmaking/stats', async (req, res) => {
  try {
    const stats = await matchmakingService.getStats();
    const revenue = await matchmakingService.getRevenueTracking();

    res.json({
      success: true,
      stats,
      revenue
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 8. Test email service
app.post('/api/matchmaking/test-email', async (req, res) => {
  try {
    const { toEmail } = req.body;

    if (!toEmail) {
      return res.status(400).json({ error: 'toEmail is required' });
    }

    const result = await emailService.sendTestEmail(toEmail);

    res.json({
      success: result.success,
      message: result.success ? 'Test email sent!' : 'Failed to send email',
      resendId: result.resendId,
      error: result.error
    });
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
      statusUrl: `/api/solutions/lead-generation/status/${job.id}`
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get lead generation job status
app.get('/api/solutions/lead-generation/status/:jobId', async (req, res) => {
  try {
    const { jobId } = req.params;
    const job = await taskQueue.getJobStatus(jobId);

    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }

    // Format response for frontend
    res.json({
      id: job.id,
      state: job.status,
      progress: job.status === 'completed' ? 100 : job.status === 'processing' ? 50 : 0,
      result: job.result,
      error: job.error
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
// PARTNER ENDPOINTS (Multi-Tenant System)
// ============================================================================

// Get tenant info
app.get('/api/partner/:tenantSlug', async (req, res) => {
  try {
    const { tenantSlug } = req.params;
    const tenant = await partnerManager.getTenant(tenantSlug);
    res.json(tenant);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get partner dashboard stats
app.get('/api/partner/:tenantSlug/stats', async (req, res) => {
  try {
    const { tenantSlug } = req.params;
    const stats = await partnerManager.getTenantStats(tenantSlug);
    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Provision single client
app.post('/api/partner/:tenantSlug/provision-client', async (req, res) => {
  try {
    const { tenantSlug } = req.params;
    const { userEmail, userName, plan, source } = req.body;

    if (!userEmail || !userName) {
      return res.status(400).json({ error: 'userEmail and userName are required' });
    }

    const result = await partnerManager.provisionClient({
      tenantSlug,
      userEmail,
      userName,
      plan: plan || 'free',
      source: source || 'partner'
    });

    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Bulk provision clients
app.post('/api/partner/:tenantSlug/bulk-provision', async (req, res) => {
  try {
    const { tenantSlug } = req.params;
    const { clients } = req.body;

    if (!Array.isArray(clients)) {
      return res.status(400).json({ error: 'clients must be an array' });
    }

    const results = await partnerManager.bulkProvisionClients(tenantSlug, clients);
    res.json(results);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update client plan
app.put('/api/partner/:tenantSlug/client/:userEmail/plan', async (req, res) => {
  try {
    const { tenantSlug, userEmail } = req.params;
    const { plan } = req.body;

    if (!plan) {
      return res.status(400).json({ error: 'plan is required' });
    }

    const result = await partnerManager.updateClientPlan(tenantSlug, userEmail, plan);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get revenue share report
app.get('/api/partner/:tenantSlug/revenue', async (req, res) => {
  try {
    const { tenantSlug } = req.params;
    const { startMonth, endMonth } = req.query;

    const currentMonth = new Date().toISOString().slice(0, 7);
    const report = await partnerManager.getRevenueShareReport(
      tenantSlug,
      startMonth || currentMonth,
      endMonth || currentMonth
    );

    res.json(report);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Calculate monthly revenue
app.post('/api/partner/:tenantSlug/calculate-revenue', async (req, res) => {
  try {
    const { tenantSlug } = req.params;
    const { month } = req.body;

    const currentMonth = month || new Date().toISOString().slice(0, 7);
    const revenue = await partnerManager.calculateMonthlyRevenue(tenantSlug, currentMonth);

    res.json(revenue);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Add testimonial
app.post('/api/partner/:tenantSlug/testimonial', async (req, res) => {
  try {
    const { tenantSlug } = req.params;
    const testimonial = await partnerManager.addTestimonial({
      tenantSlug,
      ...req.body
    });

    res.json({
      success: true,
      testimonial
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get social proof
app.get('/api/partner/:tenantSlug/social-proof', async (req, res) => {
  try {
    const { tenantSlug } = req.params;
    const { type, publishedOnly } = req.query;

    const socialProof = await partnerManager.getSocialProof(
      tenantSlug,
      type || null,
      publishedOnly !== 'false'
    );

    res.json(socialProof);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============================================================================
// AUTOMATION ENDPOINTS (Scheduled + On-Demand)
// ============================================================================

// Get automation status
app.get('/api/automation/status', (req, res) => {
  try {
    const status = automationScheduler.getStatus();
    res.json(status);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Manually trigger partner lead generation
app.post('/api/automation/trigger/lead-gen/:tenantSlug', async (req, res) => {
  try {
    const { tenantSlug } = req.params;
    const settings = req.body;

    const job = await automationScheduler.triggerPartnerLeadGen(tenantSlug, settings);

    res.json({
      success: true,
      message: `Lead generation triggered for ${tenantSlug}`,
      jobId: job.id
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Manually trigger opportunity scan
app.post('/api/automation/trigger/opportunity-scan', async (req, res) => {
  try {
    const result = await automationScheduler.triggerOpportunityScan();

    res.json({
      success: true,
      message: `Found ${result.count} opportunities`,
      opportunities: result.opportunities
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get automation log for tenant
app.get('/api/automation/:tenantSlug/log', async (req, res) => {
  try {
    const { tenantSlug } = req.params;
    const { limit = 50, type } = req.query;

    // TODO: Implement log retrieval
    res.json({
      message: 'Automation log retrieval coming soon',
      tenantSlug,
      limit,
      type
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get automation stats for tenant
app.get('/api/automation/:tenantSlug/stats', async (req, res) => {
  try {
    const { tenantSlug } = req.params;

    // TODO: Implement stats retrieval using get_automation_stats function
    res.json({
      message: 'Automation stats retrieval coming soon',
      tenantSlug
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============================================================================
// START SERVER
// ============================================================================

app.listen(PORT, () => {
  const servicesLoaded = Object.values(serviceStatus).filter(Boolean).length;
  const totalServices = Object.keys(serviceStatus).length;

  console.log(`
╔═══════════════════════════════════════════════════════════════╗
║                      UNBOUND.TEAM API                         ║
║        Your Autonomous AI Team - Unbound from Big Tech        ║
╚═══════════════════════════════════════════════════════════════╝

✅ Server running on port ${PORT}
🌐 API: http://localhost:${PORT}
📊 Health: http://localhost:${PORT}/health
📋 Services: ${servicesLoaded}/${totalServices} loaded

${serviceStatus.orchestrator ? '✅' : '❌'} AI Orchestrator
${serviceStatus.taskQueue ? '✅' : '❌'} Task Queue
${serviceStatus.queueWorker ? '✅' : '❌'} Queue Worker
${serviceStatus.partnerManager ? '✅' : '❌'} Partner Manager
${serviceStatus.automationScheduler ? '✅' : '❌'} Automation Scheduler

🚀 ${servicesLoaded === totalServices ? 'All systems ready!' : 'Running in degraded mode - some features may be unavailable'}

${serviceStatus.empireAgiBrain ? '🧠 Empire AGI Brain: ACTIVE - Autonomous business management running' : ''}
${serviceStatus.automationScheduler ? '⏰ Automation Scheduler: ACTIVE - Cron jobs running' : ''}
${serviceStatus.queueWorker ? '⚙️  Queue Worker: ACTIVE - Processing background jobs' : ''}
${serviceStatus.appointmentMonitor ? '📅 Appointment Monitor: ACTIVE - Tracking appointments' : ''}
  `);

  // Start queue worker if available
  if (queueWorker) {
    try {
      queueWorker.start();
      console.log('✅ Queue worker started');
    } catch (err) {
      console.warn('⚠️  Queue worker failed to start:', err.message);
    }
  }

  // Start automation scheduler if available
  if (automationScheduler) {
    try {
      automationScheduler.start();
      console.log('✅ Automation scheduler started');
    } catch (err) {
      console.warn('⚠️  Automation scheduler failed to start:', err.message);
    }
  }

  // Start Empire AGI Brain if available
  if (empireAgiBrain) {
    try {
      // Empire AGI Brain uses run() instead of start()
      // Don't await - let it run in the background
      empireAgiBrain.run().catch(err => {
        console.error('⚠️  Empire AGI Brain error:', err.message);
      });
      console.log('✅ Empire AGI Brain started - Autonomous business management active');
    } catch (err) {
      console.warn('⚠️  Empire AGI Brain failed to start:', err.message);
    }
  }

  // Start Appointment Monitor if available
  if (appointmentMonitor) {
    try {
      appointmentMonitor.start();
      console.log('✅ Appointment Monitor started - Tracking appointments every 5 minutes');
    } catch (err) {
      console.warn('⚠️  Appointment Monitor failed to start:', err.message);
    }
  }
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully...');

  if (queueWorker && queueWorker.stop) {
    try {
      queueWorker.stop();
      console.log('✅ Queue worker stopped');
    } catch (err) {
      console.warn('⚠️  Error stopping queue worker:', err.message);
    }
  }

  if (automationScheduler && automationScheduler.stop) {
    try {
      automationScheduler.stop();
      console.log('✅ Automation scheduler stopped');
    } catch (err) {
      console.warn('⚠️  Error stopping automation scheduler:', err.message);
    }
  }

  // Empire AGI Brain doesn't have a stop() method - it will stop when process exits
  if (empireAgiBrain) {
    console.log('✅ Empire AGI Brain will stop with process exit');
  }

  if (appointmentMonitor && appointmentMonitor.stop) {
    try {
      appointmentMonitor.stop();
      console.log('✅ Appointment Monitor stopped');
    } catch (err) {
      console.warn('⚠️  Error stopping Appointment Monitor:', err.message);
    }
  }

  process.exit(0);
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('❌ Uncaught Exception:', err);
  // Don't exit - let the app continue running in degraded mode
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
  // Don't exit - let the app continue running in degraded mode
});
