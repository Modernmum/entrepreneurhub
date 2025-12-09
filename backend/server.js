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
    'gap-finder': './agents/gap-finder-agent.js',
    'auto-outreach': './agents/auto-outreach-agent.js',
    'auto-delivery': './agents/auto-delivery-agent.js'
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

// ============================================
// DISCOVER COMPANY - Full Pipeline Test
// ============================================
// Takes a company name, researches it via Perplexity,
// scores it, and runs it through the full pipeline
const AIResearcher = require('./services/ai-researcher');
const IntelligentScorer = require('./services/intelligent-scorer');

app.post('/api/discover-company', async (req, res) => {
  const { company_name, company_domain, contact_email } = req.body;

  if (!company_name) {
    return res.status(400).json({
      success: false,
      error: 'company_name is required'
    });
  }

  console.log(`\n🔍 DISCOVERING: ${company_name}`);
  console.log(`================================\n`);

  try {
    const researcher = new AIResearcher();
    const scorer = new IntelligentScorer();
    const results = { company_name, stages: {} };

    // Stage 1: Research the company with Perplexity
    console.log(`📡 Stage 1: Researching ${company_name} with Perplexity...`);
    const opportunity = {
      id: `discover-${Date.now()}`,
      company_name,
      company_domain: company_domain || `${company_name.toLowerCase().replace(/\s+/g, '')}.com`,
      contact_email: contact_email || null,
      route_to_outreach: true
    };

    const research = await researcher.researchLead(opportunity);
    results.stages.research = {
      completed: true,
      companyBackground: research.companyBackground?.findings?.substring(0, 500) || 'No data',
      painPoints: research.painPointAnalysis?.findings?.substring(0, 500) || 'No data',
      decisionMaker: research.decisionMaker?.findings?.substring(0, 300) || 'No data',
      recentActivity: research.recentActivity?.findings?.substring(0, 300) || 'No data',
      personalizationHooks: research.personalizationHooks?.findings?.substring(0, 300) || 'No data',
      recommendedApproach: research.recommendedApproach?.findings?.substring(0, 500) || 'No data'
    };
    console.log(`   ✅ Research complete`);

    // Stage 2: Score the opportunity
    console.log(`📊 Stage 2: Scoring ${company_name}...`);

    // Enrich opportunity with research data for better scoring
    opportunity.opportunity_data = {
      source: 'discover-company',
      research_summary: research.companyBackground?.findings || '',
      pain_points: research.painPointAnalysis?.findings || '',
      context: research.recommendedApproach?.findings || ''
    };

    const scoring = await scorer.processOpportunity(opportunity);
    results.stages.scoring = {
      completed: true,
      qualified: scoring.qualified,
      score: scoring.score || 0,
      action: scoring.action,
      reasoning: scoring.reasoning,
      breakdown: scoring.breakdown,
      keyInsights: scoring.keyInsights,
      suggestedApproach: scoring.suggestedApproach
    };
    console.log(`   ✅ Score: ${scoring.score}/40 - ${scoring.action}`);

    // Stage 3: Generate personalized email
    console.log(`📧 Stage 3: Generating personalized outreach...`);
    const email = generateDiscoveryEmail(opportunity, research, scoring);
    results.stages.email = {
      completed: true,
      subject: email.subject,
      body: email.body,
      ready_to_send: !!contact_email
    };
    console.log(`   ✅ Email generated`);

    // Stage 4: Extract email from research
    console.log(`📧 Stage 4: Extracting contact email...`);
    let discoveredEmail = contact_email || null;

    // Try to extract email from Perplexity's contact discovery response
    if (!discoveredEmail && research.contactDiscovery?.findings) {
      const emailMatch = research.contactDiscovery.findings.match(/PRIMARY EMAIL:\s*([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/i);
      if (emailMatch) {
        discoveredEmail = emailMatch[1];
        console.log(`   ✅ Found email: ${discoveredEmail}`);
      } else {
        // Fallback: look for any email in the response
        const anyEmailMatch = research.contactDiscovery.findings.match(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/);
        if (anyEmailMatch) {
          discoveredEmail = anyEmailMatch[1];
          console.log(`   ✅ Found email (fallback): ${discoveredEmail}`);
        }
      }
    }

    results.stages.emailDiscovery = {
      completed: true,
      email_found: !!discoveredEmail,
      email: discoveredEmail,
      raw_response: research.contactDiscovery?.findings?.substring(0, 500) || 'No email research data'
    };

    // Stage 5: Save to database
    console.log(`💾 Stage 5: Saving to database...`);
    const { data: savedOpp, error: saveError } = await supabase
      .from('scored_opportunities')
      .insert({
        company_name: opportunity.company_name,
        company_domain: opportunity.company_domain,
        overall_score: Math.round((scoring.score || 0) * 2.5), // Convert to 0-100 scale (integer)
        signal_strength_score: 80,
        route_to_outreach: scoring.qualified && scoring.score >= 25,
        priority_tier: scoring.score >= 30 ? 'tier_1' : scoring.score >= 20 ? 'tier_2' : 'tier_3',
        source: 'discover-company',
        opportunity_data: {
          research: results.stages.research,
          scoring: results.stages.scoring,
          email_draft: results.stages.email,
          discovered_email: discoveredEmail,
          email_discovery_raw: results.stages.emailDiscovery,
          discovered_at: new Date().toISOString()
        }
      })
      .select()
      .single();

    if (saveError) {
      console.error('   ❌ Save error:', saveError.message);
      results.stages.database = { completed: false, error: saveError.message };
    } else {
      results.stages.database = { completed: true, opportunity_id: savedOpp.id };
      console.log(`   ✅ Saved with ID: ${savedOpp.id}`);
    }

    // Final assessment
    results.assessment = {
      is_good_fit: scoring.qualified && scoring.score >= 25,
      fit_level: scoring.score >= 30 ? 'EXCELLENT' : scoring.score >= 25 ? 'GOOD' : scoring.score >= 20 ? 'MAYBE' : 'NOT_A_FIT',
      recommended_action: scoring.action,
      contact_email: discoveredEmail,
      email_found: !!discoveredEmail,
      ready_for_outreach: scoring.qualified && scoring.score >= 25 && !!discoveredEmail,
      next_steps: scoring.qualified
        ? discoveredEmail
          ? `Ready for outreach - email found: ${discoveredEmail}`
          : 'QUALIFIED but need contact email - try manual lookup'
        : 'Does not meet qualification criteria'
    };

    console.log(`\n✅ DISCOVERY COMPLETE: ${company_name}`);
    console.log(`   Fit: ${results.assessment.fit_level}`);
    console.log(`   Score: ${scoring.score}/40`);
    console.log(`   Action: ${scoring.action}\n`);

    res.json({
      success: true,
      ...results
    });

  } catch (error) {
    console.error(`❌ Discovery error for ${company_name}:`, error);
    res.status(500).json({
      success: false,
      error: error.message,
      company_name
    });
  }
});

// Helper function for discovery emails
function generateDiscoveryEmail(opportunity, research, scoring) {
  const company = opportunity.company_name;

  let companyInfo = '';
  if (research.companyBackground?.findings) {
    companyInfo = research.companyBackground.findings.split('\n').slice(0, 2).join(' ').substring(0, 200);
  }

  let painPoint = '';
  if (research.painPointAnalysis?.findings) {
    painPoint = research.painPointAnalysis.findings.split('\n').slice(0, 2).join(' ').substring(0, 150);
  }

  let hook = '';
  if (research.personalizationHooks?.findings) {
    hook = research.personalizationHooks.findings.split('\n').slice(0, 1).join(' ').substring(0, 100);
  }

  const subject = `Automating client acquisition for ${company}`;

  let body = `Hi there,\n\n`;

  if (companyInfo) {
    body += `I came across ${company} and was impressed by what you're building. ${companyInfo}...\n\n`;
  } else {
    body += `I came across ${company} and wanted to reach out.\n\n`;
  }

  if (painPoint) {
    body += `I understand you may be facing challenges with ${painPoint}... That's exactly what we help businesses solve.\n\n`;
  }

  body += `Unbound builds autonomous client acquisition systems that:\n`;
  body += `• Automatically discover qualified opportunities in your market\n`;
  body += `• Research each lead in depth using real-time market intelligence\n`;
  body += `• Send personalized outreach based on their specific pain points\n`;
  body += `• Handle initial conversations and book qualified calls\n\n`;

  if (hook) {
    body += `${hook}...\n\n`;
  }

  body += `Would you be open to a brief 15-minute conversation to explore if there's a fit?\n\n`;
  body += `Best regards,\n`;
  body += `Maggie Forbes\n`;
  body += `Unbound.Team\n\n`;
  body += `P.S. This entire outreach was generated using the same autonomous system I'd build for you.`;

  return { subject, body };
}

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

// Auto-start agents function
async function autoStartAgents() {
  console.log('🤖 Auto-starting autonomous agents...');

  const agentMap = {
    'gap-finder': './agents/gap-finder-agent.js',
    'auto-outreach': './agents/auto-outreach-agent.js',
    'auto-delivery': './agents/auto-delivery-agent.js'
  };

  for (const [agentName, agentPath] of Object.entries(agentMap)) {
    try {
      const agent = spawn('node', [agentPath], {
        cwd: __dirname,
        detached: false,
        stdio: 'pipe',
        env: process.env
      });

      agent.stdout.on('data', (data) => {
        console.log(`[${agentName}] ${data.toString().trim()}`);
      });

      agent.stderr.on('data', (data) => {
        console.error(`[${agentName}] ${data.toString().trim()}`);
      });

      agent.on('exit', (code) => {
        console.log(`[${agentName}] Exited with code ${code}`);
        agentStats[agentName].status = 'stopped';
        delete agentProcesses[agentName];

        // Auto-restart agent after 30 seconds if it crashes
        if (code !== 0) {
          console.log(`[${agentName}] Restarting in 30 seconds...`);
          setTimeout(() => autoStartSingleAgent(agentName, agentPath), 30000);
        }
      });

      agentProcesses[agentName] = agent;
      agentStats[agentName].status = 'running';
      agentStats[agentName].lastRun = new Date().toISOString();
      console.log(`✅ ${agentName} agent started`);

    } catch (error) {
      console.error(`❌ Failed to start ${agentName}:`, error.message);
    }
  }
}

// Auto-start single agent (for restarts)
function autoStartSingleAgent(agentName, agentPath) {
  if (agentProcesses[agentName]) return; // Already running

  try {
    const agent = spawn('node', [agentPath], {
      cwd: __dirname,
      detached: false,
      stdio: 'pipe',
      env: process.env
    });

    agent.stdout.on('data', (data) => {
      console.log(`[${agentName}] ${data.toString().trim()}`);
    });

    agent.stderr.on('data', (data) => {
      console.error(`[${agentName}] ${data.toString().trim()}`);
    });

    agent.on('exit', (code) => {
      console.log(`[${agentName}] Exited with code ${code}`);
      agentStats[agentName].status = 'stopped';
      delete agentProcesses[agentName];
    });

    agentProcesses[agentName] = agent;
    agentStats[agentName].status = 'running';
    agentStats[agentName].lastRun = new Date().toISOString();
    console.log(`✅ ${agentName} agent restarted`);

  } catch (error) {
    console.error(`❌ Failed to restart ${agentName}:`, error.message);
  }
}

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Unbound.Team backend running on port ${PORT}`);
  console.log(`📊 Dashboard API ready`);
  console.log(`✅ Environment: ${process.env.RAILWAY_ENVIRONMENT || 'development'}`);

  // Auto-start agents after server is ready (wait 5 seconds for services to initialize)
  setTimeout(autoStartAgents, 5000);
});

module.exports = app;
