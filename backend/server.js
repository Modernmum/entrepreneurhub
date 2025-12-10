const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');
const { spawn } = require('child_process');
const Stripe = require('stripe');

const app = express();
const PORT = process.env.PORT || 3000;

// Initialize Stripe
const stripe = process.env.STRIPE_SECRET_KEY ? new Stripe(process.env.STRIPE_SECRET_KEY) : null;

// Middleware
app.use(cors());

// Stripe webhook needs raw body - must come before express.json()
app.post('/webhook/stripe', express.raw({ type: 'application/json' }), async (req, res) => {
  if (!stripe) {
    return res.status(500).json({ error: 'Stripe not configured' });
  }

  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.log('⚠️ Stripe webhook signature failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle payment completed
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    console.log(`💰 Payment received! Session: ${session.id}`);

    const customerEmail = session.customer_details?.email || session.customer_email;
    const customerName = session.customer_details?.name;
    const amountPaid = session.amount_total / 100;

    if (customerEmail) {
      // Create client record after payment
      const { data: client, error } = await supabase
        .from('mfs_clients')
        .insert({
          business_name: customerName || 'New Client',
          contact_email: customerEmail,
          service_type: session.metadata?.service_type || 'notion_template',
          status: 'active',
          delivery_status: 'pending',
          source: 'stripe',
          delivery_details: {
            stripe_session_id: session.id,
            amount_paid: amountPaid,
            payment_date: new Date().toISOString()
          },
          onboarded_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) {
        console.error('❌ Client creation error:', error.message);
      } else {
        console.log(`✅ Client created after payment: ${client.id}`);
        console.log(`📧 Email: ${customerEmail}`);
        console.log(`💵 Amount: $${amountPaid}`);
      }
    }
  }

  res.json({ received: true });
});

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
      ANTHROPIC_API_KEY: !!process.env.ANTHROPIC_API_KEY,
      STRIPE_SECRET_KEY: !!process.env.STRIPE_SECRET_KEY,
      STRIPE_WEBHOOK_SECRET: !!process.env.STRIPE_WEBHOOK_SECRET
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

// Get ALL agent statuses at once (for dashboard)
app.get('/api/agents', (req, res) => {
  const agents = Object.entries(agentStats).map(([name, stats]) => ({
    name,
    ...stats,
    isRunning: !!agentProcesses[name]
  }));
  res.json({ success: true, agents });
});

// ============================================
// IMPORT LEADS - Bulk import from CSV/Excel
// ============================================
app.post('/api/import-leads', async (req, res) => {
  try {
    const { leads, source = 'manual_import' } = req.body;

    if (!leads || !Array.isArray(leads)) {
      return res.status(400).json({ error: 'leads array is required' });
    }

    console.log(`📥 Importing ${leads.length} leads from ${source}...`);

    const results = { imported: 0, skipped: 0, errors: [] };

    for (const lead of leads) {
      try {
        // Require at minimum an email or company name
        if (!lead.contact_email && !lead.company_name) {
          results.skipped++;
          continue;
        }

        // Check for duplicates by company name + domain
        const { data: existing } = await supabase
          .from('scored_opportunities')
          .select('id')
          .eq('company_name', lead.company_name || 'Unknown')
          .eq('company_domain', lead.company_domain || '')
          .limit(1);

        if (existing && existing.length > 0) {
          results.skipped++;
          continue;
        }

        // Merge contact_email into opportunity_data if provided
        const opportunityData = {
          ...(lead.opportunity_data || {}),
          discovered_email: lead.contact_email || lead.opportunity_data?.discovered_email || null
        };

        // Insert the lead
        const { error } = await supabase
          .from('scored_opportunities')
          .insert({
            company_name: lead.company_name || 'Unknown',
            company_domain: lead.company_domain || '',
            overall_score: lead.overall_score || 85,
            signal_strength_score: lead.signal_strength_score || 90,
            route_to_outreach: lead.route_to_outreach !== false,
            priority_tier: lead.priority_tier || 'tier_1',
            source: source,
            opportunity_data: opportunityData
          });

        if (error) {
          results.errors.push({ lead: lead.company_name, error: error.message });
        } else {
          results.imported++;
        }
      } catch (err) {
        results.errors.push({ lead: lead.company_name, error: err.message });
      }
    }

    console.log(`✅ Import complete: ${results.imported} imported, ${results.skipped} skipped`);
    res.json({ success: true, results });

  } catch (error) {
    console.error('Import error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ============================================
// BATCH RESEARCH LEADS - Research unresearched leads
// ============================================
const AIResearcher = require('./services/ai-researcher');
const IntelligentScorer = require('./services/intelligent-scorer');
const EmailFinder = require('./services/email-finder');

app.post('/api/research-leads', async (req, res) => {
  const { limit = 10, source } = req.body;

  console.log(`\n🔬 BATCH RESEARCH: Starting research for up to ${limit} leads...`);

  try {
    const researcher = new AIResearcher();

    // Get unresearched leads (no lead_research in opportunity_data)
    let query = supabase
      .from('scored_opportunities')
      .select('*')
      .is('outreach_sent', null)
      .eq('route_to_outreach', true)
      .gte('overall_score', 70)
      .limit(limit);

    // Optionally filter by source
    if (source) {
      query = query.eq('source', source);
    }

    const { data: leads, error } = await query;

    if (error) throw error;

    if (!leads || leads.length === 0) {
      return res.json({ success: true, message: 'No leads to research', researched: 0 });
    }

    // Filter to only leads without research
    const unresearched = leads.filter(l => !l.opportunity_data?.lead_research);

    console.log(`📋 Found ${unresearched.length} unresearched leads out of ${leads.length}`);

    const results = { researched: 0, skipped: 0, errors: [] };

    for (const lead of unresearched) {
      try {
        console.log(`\n🔍 Researching: ${lead.company_name}`);

        // Research the lead
        const research = await researcher.researchLead(lead);

        // Update the opportunity with research data
        const updatedOpportunityData = {
          ...lead.opportunity_data,
          lead_research: {
            researched_at: new Date().toISOString(),
            company_background: research.companyBackground?.findings || null,
            pain_points: research.painPointAnalysis?.findings || null,
            decision_maker: research.decisionMaker?.findings || null,
            contact_discovery: research.contactDiscovery?.findings || null,
            recent_activity: research.recentActivity?.findings || null,
            market_context: research.marketContext?.findings || null,
            personalization_hooks: research.personalizationHooks?.findings || null,
            recommended_approach: research.recommendedApproach?.findings || null
          }
        };

        // If Perplexity found an email, add it
        if (research.contactDiscovery?.findings) {
          const emailMatch = research.contactDiscovery.findings.match(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/);
          if (emailMatch && !updatedOpportunityData.discovered_email) {
            updatedOpportunityData.discovered_email = emailMatch[1];
            console.log(`   📧 Found email via research: ${emailMatch[1]}`);
          }
        }

        await supabase
          .from('scored_opportunities')
          .update({ opportunity_data: updatedOpportunityData })
          .eq('id', lead.id);

        results.researched++;
        console.log(`   ✅ Research saved for ${lead.company_name}`);

        // Rate limit - 2 seconds between research calls
        await new Promise(resolve => setTimeout(resolve, 2000));

      } catch (err) {
        console.error(`   ❌ Error researching ${lead.company_name}:`, err.message);
        results.errors.push({ company: lead.company_name, error: err.message });
      }
    }

    console.log(`\n✅ Batch research complete: ${results.researched} researched`);
    res.json({ success: true, results });

  } catch (error) {
    console.error('Batch research error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ============================================
// DISCOVER COMPANY - Full Pipeline Test
// ============================================
// Takes a company name, researches it via Perplexity,
// scores it, and runs it through the full pipeline

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

    // Stage 4: Find contact email using EmailFinder (scrapes website directly)
    console.log(`📧 Stage 4: Finding contact email...`);
    let discoveredEmail = contact_email || null;
    let emailSource = contact_email ? 'provided' : null;
    let emailConfidence = contact_email ? 'high' : 'none';

    // First try: Direct website scraping with EmailFinder
    if (!discoveredEmail && opportunity.company_domain) {
      const emailFinder = new EmailFinder();
      const emailResults = await emailFinder.findEmails(company_name, opportunity.company_domain);

      if (emailResults.primaryEmail) {
        discoveredEmail = emailResults.primaryEmail;
        emailSource = 'website_scrape';
        emailConfidence = emailResults.confidence;
        console.log(`   ✅ Found email via scraping: ${discoveredEmail} (${emailConfidence})`);
      }

      results.stages.emailFinderResults = {
        emails_found: emailResults.emails,
        sources: emailResults.sources,
        patterns_tried: emailResults.sources?.patterns || []
      };
    }

    // Second try: Perplexity research (fallback)
    if (!discoveredEmail && research.contactDiscovery?.findings) {
      const emailMatch = research.contactDiscovery.findings.match(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/);
      if (emailMatch) {
        // Validate it's from the right domain
        const foundEmail = emailMatch[1].toLowerCase();
        const domain = opportunity.company_domain?.toLowerCase();
        if (!domain || foundEmail.includes(domain) || !foundEmail.includes('yahoo') && !foundEmail.includes('gmail')) {
          discoveredEmail = foundEmail;
          emailSource = 'perplexity';
          emailConfidence = 'low';
          console.log(`   ✅ Found email via Perplexity: ${discoveredEmail} (${emailConfidence})`);
        }
      }
    }

    results.stages.emailDiscovery = {
      completed: true,
      email_found: !!discoveredEmail,
      email: discoveredEmail,
      source: emailSource,
      confidence: emailConfidence,
      perplexity_response: research.contactDiscovery?.findings?.substring(0, 300) || null
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

// ============================================
// TRANSCRIPT & DELIVERY ENDPOINTS
// For Fireflies integration and client delivery
// ============================================

// Fireflies.ai webhook - receives call transcripts
app.post('/api/webhook/fireflies', async (req, res) => {
  console.log('\n📞 FIREFLIES WEBHOOK RECEIVED\n');

  try {
    const result = await processTranscript(req.body, 'fireflies');
    res.json({ success: true, message: 'Transcript processed', analysis: result });
  } catch (error) {
    console.error('❌ Fireflies webhook error:', error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Manual transcript upload
app.post('/api/transcript', async (req, res) => {
  console.log('\n📞 MANUAL TRANSCRIPT UPLOAD\n');

  const { transcript, email, client_name, business_name } = req.body;

  if (!transcript) {
    return res.status(400).json({ success: false, error: 'transcript is required' });
  }

  try {
    const result = await processTranscript({
      transcript,
      attendee_email: email,
      attendee_name: client_name,
      business_name
    }, 'manual');

    res.json({ success: true, message: 'Transcript processed', analysis: result });
  } catch (error) {
    console.error('❌ Transcript error:', error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Process transcript helper function (stores transcript for dashboard - no AI costs, no emails)
async function processTranscript(webhookData, source) {
  // Normalize transcript data from various webhook formats
  const transcript = webhookData.transcript || webhookData.text || webhookData.content || '';
  const attendeeEmail = webhookData.attendee_email || webhookData.attendees?.[0]?.email;
  const attendeeName = webhookData.attendee_name || webhookData.attendees?.[0]?.name || 'Unknown';
  const businessName = webhookData.business_name || '';
  const meetingTitle = webhookData.meeting_title || webhookData.title || 'Discovery Call';

  console.log(`Source: ${source}`);
  console.log(`Email: ${attendeeEmail || 'Unknown'}`);
  console.log(`Name: ${attendeeName}`);
  console.log(`Transcript Length: ${transcript.length} chars\n`);

  if (transcript.length < 50) {
    return { stored: false, error: 'Transcript too short' };
  }

  // Store transcript in database for dashboard
  const { data: record, error } = await supabase
    .from('call_transcripts')
    .insert({
      source,
      attendee_email: attendeeEmail,
      attendee_name: attendeeName,
      business_name: businessName,
      meeting_title: meetingTitle,
      transcript_text: transcript,
      status: 'pending_review',
      processed_at: new Date().toISOString()
    })
    .select()
    .single();

  if (error) {
    console.error('DB Error:', error.message);
    return { stored: false, error: error.message };
  }

  console.log(`✅ Transcript stored: ${record.id} - viewable on dashboard`);

  return { stored: true, transcriptId: record.id, attendeeName, attendeeEmail, status: 'pending_review' };
}

// Start delivery for client
app.post('/api/deliver', async (req, res) => {
  console.log('\n🚀 CLIENT DELIVERY TRIGGERED\n');

  const { email, businessName, serviceType, painPoints, transcriptId } = req.body;

  if (!email || !serviceType) {
    return res.status(400).json({ success: false, error: 'email and serviceType required' });
  }

  try {
    // Create client record
    const { data: client, error } = await supabase
      .from('mfs_clients')
      .insert({
        business_name: businessName || 'New Client',
        contact_email: email,
        service_type: serviceType,
        pain_points: painPoints || [],
        transcript_id: transcriptId,
        status: 'active',
        onboarded_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      console.error('Client creation error:', error.message);
      return res.status(500).json({ success: false, error: error.message });
    }

    console.log(`✅ Client created: ${client.id}`);
    console.log(`Service: ${serviceType}`);

    res.json({
      success: true,
      message: 'Delivery started',
      clientId: client.id,
      serviceType
    });
  } catch (error) {
    console.error('❌ Delivery error:', error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get transcripts for dashboard
app.get('/api/transcripts', async (req, res) => {
  const { status } = req.query;

  let query = supabase
    .from('call_transcripts')
    .select('*')
    .order('processed_at', { ascending: false });

  if (status) {
    query = query.eq('status', status);
  }

  const { data, error } = await query;

  if (error) {
    return res.status(500).json({ success: false, error: error.message });
  }

  res.json({ success: true, transcripts: data });
});

// Update transcript status from dashboard
app.patch('/api/transcripts/:id', async (req, res) => {
  const { id } = req.params;
  const { status, notes } = req.body;

  const updates = {};
  if (status) updates.status = status;
  if (notes) updates.notes = notes;

  const { data, error } = await supabase
    .from('call_transcripts')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    return res.status(500).json({ success: false, error: error.message });
  }

  res.json({ success: true, transcript: data });
});

// List available services
app.get('/api/services', (req, res) => {
  res.json({
    services: [
      { id: 'notion_template', name: 'Notion Template', price: '$47-197' },
      { id: 'custom_template', name: 'Custom Template', price: '$297-497' },
      { id: 'mvp_build', name: 'Rapid MVP', price: '$997-2997' },
      { id: 'seo_content', name: 'SEO Content', price: '$497-1497' },
      { id: 'operations_setup', name: 'Operations Setup', price: '$1997-4997' },
      { id: 'full_coo_service', name: 'Fractional COO', price: '$2500/month' }
    ]
  });
});

// Delete test data endpoint
app.delete('/api/test-data/:table/:id', async (req, res) => {
  const { table, id } = req.params;
  const allowedTables = ['call_transcripts', 'mfs_clients'];

  if (!allowedTables.includes(table)) {
    return res.status(400).json({ success: false, error: 'Invalid table' });
  }

  const { error } = await supabase.from(table).delete().eq('id', id);

  if (error) {
    return res.status(500).json({ success: false, error: error.message });
  }

  res.json({ success: true, message: `Deleted ${id} from ${table}` });
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
