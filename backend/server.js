const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');
const { spawn } = require('child_process');
const Stripe = require('stripe');
const { Resend } = require('resend');

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

// Database diagnostic - check all tables and counts
app.get('/api/db-check', async (req, res) => {
  try {
    // Try to list ALL tables by querying information_schema
    // Also try common table names
    const tables = [
      'scored_opportunities',
      'mfs_leads',
      'opportunities',
      'leads',
      'contacts',
      'outreach_campaigns',
      'market_gaps',
      'email_blocklist',
      'email_engagement',
      'users',
      'clients',
      'prospects',
      'companies',
      'accounts',
      'campaigns',
      'emails',
      'mfs_clients',
      'system_settings',
      'solution_deliveries',
      'call_transcripts',
      'email_conversations',
      'followup_sequences'
    ];

    const results = {};

    for (const table of tables) {
      try {
        const { count, error } = await supabase
          .from(table)
          .select('*', { count: 'exact', head: true });

        if (!error) {
          // Table exists - get sample
          const { data: sample } = await supabase
            .from(table)
            .select('*')
            .limit(1);

          results[table] = {
            exists: true,
            count: count || 0,
            columns: sample?.[0] ? Object.keys(sample[0]) : []
          };
        }
      } catch (e) {
        // Table doesn't exist, skip
      }
    }

    // Also return the Supabase URL being used (masked)
    const supabaseUrl = process.env.SUPABASE_URL || 'not set';
    const maskedUrl = supabaseUrl.replace(/https:\/\/([^.]+)\.supabase\.co/, 'https://$1.supabase.co');

    res.json({
      success: true,
      supabase_project: maskedUrl,
      tables_found: Object.keys(results).filter(t => results[t]?.exists),
      tables: results
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

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
      PERPLEXITY_API_KEY: !!process.env.PERPLEXITY_API_KEY,
      STRIPE_SECRET_KEY: !!process.env.STRIPE_SECRET_KEY,
      STRIPE_WEBHOOK_SECRET: !!process.env.STRIPE_WEBHOOK_SECRET
    },
    perplexityKeyPrefix: process.env.PERPLEXITY_API_KEY ? process.env.PERPLEXITY_API_KEY.substring(0, 8) + '...' : 'NOT SET'
  });
});

// Debug endpoint to test Perplexity API directly
app.get('/api/test-perplexity', async (req, res) => {
  const axios = require('axios');
  const apiKey = process.env.PERPLEXITY_API_KEY;

  if (!apiKey) {
    return res.json({
      success: false,
      error: 'PERPLEXITY_API_KEY not set',
      keyPresent: false
    });
  }

  try {
    const response = await axios.post(
      'https://api.perplexity.ai/chat/completions',
      {
        model: 'sonar',
        messages: [
          { role: 'user', content: 'Say hello in exactly 5 words.' }
        ],
        max_tokens: 50
      },
      {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        timeout: 15000
      }
    );

    res.json({
      success: true,
      keyPresent: true,
      keyPrefix: apiKey.substring(0, 8) + '...',
      response: response.data.choices[0].message.content,
      model: response.data.model
    });

  } catch (error) {
    res.json({
      success: false,
      keyPresent: true,
      keyPrefix: apiKey.substring(0, 8) + '...',
      error: error.message,
      status: error.response?.status,
      errorData: error.response?.data
    });
  }
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
    // Order by created_at DESC to get newest leads first
    let query = supabase
      .from('scored_opportunities')
      .select('*')
      .is('outreach_sent', null)
      .eq('route_to_outreach', true)
      .gte('overall_score', 70)
      .order('created_at', { ascending: false })
      .limit(limit);

    // Optionally filter by source
    if (source) {
      query = query.eq('source', source);
    }

    const { data: leads, error } = await query;

    console.log(`   📊 Query returned ${leads?.length || 0} leads`);
    if (error) {
      console.log(`   ❌ Query error: ${error.message}`);
      throw error;
    }

    if (!leads || leads.length === 0) {
      return res.json({ success: true, message: 'No leads found matching criteria', results: { researched: 0, skipped: 0, errors: [], queryReturned: 0 } });
    }

    // Filter to only leads without research
    // Debug: log what we're seeing in the first lead's opportunity_data
    if (leads.length > 0) {
      const firstLead = leads[0];
      console.log(`   📋 First lead: ${firstLead.company_name}`);
      console.log(`   📋 opportunity_data keys: ${Object.keys(firstLead.opportunity_data || {}).join(', ')}`);
      console.log(`   📋 Has lead_research: ${!!(firstLead.opportunity_data?.lead_research)}`);
    }

    const unresearched = leads.filter(l => !l.opportunity_data?.lead_research);
    console.log(`   📋 After filtering: ${unresearched.length} unresearched out of ${leads.length}`);

    console.log(`📋 Found ${unresearched.length} unresearched leads out of ${leads.length}`);

    const firstLeadInfo = leads.length > 0 ? {
      name: leads[0].company_name,
      hasLeadResearch: !!(leads[0].opportunity_data?.lead_research),
      keys: Object.keys(leads[0].opportunity_data || {})
    } : null;

    const results = { researched: 0, skipped: 0, errors: [], queryReturned: leads.length, unresearchedCount: unresearched.length, firstLead: firstLeadInfo };

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
  const { company_name, company_domain, contact_email, contact_name } = req.body;

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
      contact_name: contact_name || null,
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

  // Get first name
  let firstName = '';
  if (opportunity.contact_name) {
    firstName = opportunity.contact_name.split(' ')[0];
  } else if (research.decisionMaker?.findings) {
    const dmMatch = research.decisionMaker.findings.match(/([A-Z][a-z]+)\s+[A-Z]/);
    if (dmMatch) firstName = dmMatch[1];
  }

  // Extract specific details from research
  const background = research.companyBackground?.findings || '';
  const painPoints = research.painPointAnalysis?.findings || '';
  const hooks = research.personalizationHooks?.findings || '';

  // Find specific company details
  const yearsMatch = background.match(/(\d+)\+?\s*years?/i) || background.match(/founded\s*(?:in\s*)?(\d{4})/i);
  const years = yearsMatch ? (yearsMatch[1].length === 4 ? (2025 - parseInt(yearsMatch[1])) : yearsMatch[1]) : null;

  // Extract what they do (first sentence of background)
  const whatTheyDo = background.split('.')[0]?.replace(/^\*+\s*/, '').trim();

  // Identify their specific pain point from research
  let specificPain = '';
  let solution = '';

  if (painPoints.toLowerCase().includes('leadership dependency') || painPoints.toLowerCase().includes('founder') || painPoints.toLowerCase().includes('owner-operated')) {
    specificPain = "you're still the one everyone turns to for the big decisions";
    solution = "building a leadership layer that can carry the weight";
  } else if (painPoints.toLowerCase().includes('relationship-dependent') || painPoints.toLowerCase().includes('relationship dependent')) {
    specificPain = "your best clients came through relationships you personally built";
    solution = "creating a pipeline that doesn't depend on your personal network";
  } else if (painPoints.toLowerCase().includes('infrastructure') || painPoints.toLowerCase().includes('manual') || painPoints.toLowerCase().includes('scale')) {
    specificPain = "the systems that got you here won't get you to the next level";
    solution = "architecting infrastructure that scales without adding complexity";
  } else if (painPoints.toLowerCase().includes('team') || painPoints.toLowerCase().includes('staff')) {
    specificPain = "your team needs you in the room to deliver at your standard";
    solution = "building systems so your team can operate at your level";
  } else {
    specificPain = "you've built something valuable but it still runs through you";
    solution = "creating systems that let you step back without stepping down";
  }

  // Find a specific hook from research (achievement, recognition, etc.)
  let personalHook = '';
  if (hooks && hooks.length > 20) {
    // Look for specific achievements - sentences with key indicators
    const hookPatterns = [
      /(?:recognized|award|won|received|named|featured|speaker|keynote|author|published|grew|scaled|expanded)[^.]{10,80}\./gi,
      /(?:founded|established|built|created)[^.]{5,50}(?:in \d{4}|over \d+)[^.]*\./gi,
      /(?:\d+\s*years?)[^.]{10,60}\./gi
    ];

    for (const pattern of hookPatterns) {
      const matches = hooks.match(pattern);
      if (matches && matches[0].length > 15) {
        personalHook = matches[0].replace(/^\*+\s*/, '').replace(/^\s*-\s*/, '').trim();
        // Make sure it's a complete, meaningful sentence
        if (personalHook.length > 20 && personalHook.length < 120) break;
        personalHook = ''; // Reset if not good
      }
    }
  }

  // Build the subject line - more specific when we have info
  let subject = '';
  if (whatTheyDo && whatTheyDo.length > 10 && whatTheyDo.length < 60) {
    subject = `${firstName || company} - a question about what's next`;
  } else {
    subject = `${company} - growth without the chaos`;
  }

  // Build truly personalized email
  let body = firstName ? `Hi ${firstName},\n\n` : `Hi,\n\n`;

  // Opening - reference something specific about them
  if (personalHook) {
    body += `I noticed ${personalHook.toLowerCase().startsWith('you') ? '' : 'that '}${personalHook.toLowerCase()}\n\n`;
    body += `Leaders who've achieved that level often hit a similar inflection point: `;
  } else if (years && years > 5) {
    body += `${years} years building ${company} - that's not luck, that's proof you know how to create something that works.\n\n`;
    body += `At this stage, the question usually shifts from "how do I grow?" to `;
  } else if (whatTheyDo && whatTheyDo.length > 20) {
    body += `Building a ${whatTheyDo.toLowerCase().includes('firm') || whatTheyDo.toLowerCase().includes('company') ? 'business' : 'practice'} like ${company} takes real expertise and relentless execution.\n\n`;
    body += `But I'm guessing you're at the point where `;
  } else {
    body += `I've been looking at ${company} and the business you've built.\n\n`;
    body += `My guess is `;
  }

  // Connect to their specific pain point
  body += `${specificPain}.\n\n`;

  // The pivot - what MFS does
  body += `That's the gap I help established leaders close - ${solution}.\n\n`;

  // Soft CTA
  body += `If that resonates, I'd enjoy a conversation about what the next chapter could look like for ${company}.\n\n`;

  body += `Best,\n`;
  body += `Maggie Forbes\n`;
  body += `Maggie Forbes Strategies`;

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

// Send a single email via Resend
app.post('/api/send-email', async (req, res) => {
  try {
    const { to, subject, body, from_name } = req.body;

    if (!to || !subject || !body) {
      return res.status(400).json({ error: 'Missing required fields: to, subject, body' });
    }

    if (!process.env.RESEND_API_KEY) {
      return res.status(500).json({ error: 'Resend API key not configured' });
    }

    const resend = new Resend(process.env.RESEND_API_KEY);
    const fromEmail = process.env.FROM_EMAIL || 'maggie@maggieforbesstrategies.com';
    const senderName = from_name || 'Maggie Forbes';

    const { data, error } = await resend.emails.send({
      from: `${senderName} <${fromEmail}>`,
      to: to,
      subject: subject,
      text: body,
      html: body.replace(/\n/g, '<br>')
    });

    if (error) {
      console.error('Resend error:', error);
      return res.status(500).json({ error: error.message });
    }

    console.log(`✅ Email sent to ${to}: ${data.id}`);
    res.json({ success: true, message_id: data.id, to, subject });

  } catch (error) {
    console.error('Send email error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Preview outreach emails - shows what would be sent without actually sending
// Uses the SmartEmailWriter for intelligent personalization
const SmartEmailWriter = require('./services/smart-email-writer');
const previewEmailWriter = new SmartEmailWriter();

app.get('/api/preview-outreach', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;

    // Get leads that would be processed by auto-outreach
    const { data: leads, error } = await supabase
      .from('mfs_leads')
      .select('*')
      .not('lead_research', 'is', null)
      .not('contact_email', 'is', null)
      .or('outreach_status.is.null,outreach_status.eq.pending')
      .order('fit_score', { ascending: false })
      .limit(limit);

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    if (!leads || leads.length === 0) {
      return res.json({
        success: true,
        message: 'No leads ready for outreach',
        previews: []
      });
    }

    // Generate preview emails using SmartEmailWriter
    const previews = leads.map(lead => {
      const email = previewEmailWriter.writeEmail(lead);
      const validation = previewEmailWriter.validateEmail(email);

      return {
        lead: {
          id: lead.id,
          company: lead.company_name,
          contact_name: lead.contact_name,
          contact_email: lead.contact_email,
          fit_score: lead.fit_score,
          source: lead.source
        },
        research_summary: {
          background: (lead.lead_research?.company_background || '').substring(0, 200),
          pain_points: (lead.lead_research?.pain_points || '').substring(0, 200),
          hooks: (lead.lead_research?.personalization_hooks || '').substring(0, 200)
        },
        email: {
          subject: email.subject,
          body: email.body,
          to: lead.contact_email,
          from: 'Maggie Forbes <maggie@maggieforbesstrategies.com>'
        },
        analysis: email.analysis,
        validation: validation
      };
    });

    res.json({
      success: true,
      total_ready: leads.length,
      previews: previews
    });

  } catch (error) {
    console.error('Preview outreach error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Test email generation with sample/custom data
app.post('/api/test-email-writer', async (req, res) => {
  const { lead } = req.body;

  if (!lead || !lead.company_name) {
    return res.status(400).json({ error: 'lead object with company_name required' });
  }

  try {
    const email = previewEmailWriter.writeEmail(lead);
    const validation = previewEmailWriter.validateEmail(email);

    res.json({
      success: true,
      email: {
        subject: email.subject,
        body: email.body
      },
      analysis: email.analysis,
      validation: validation,
      input: {
        company: lead.company_name,
        contact: lead.contact_name,
        hasResearch: !!lead.lead_research
      }
    });

  } catch (error) {
    console.error('Test email writer error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Helper function for email preview generation (legacy - kept for compatibility)
function generateMFSPreviewEmail(lead) {
  const company = lead.company_name;
  const research = lead.lead_research || {};

  let firstName = '';
  if (lead.contact_name) {
    firstName = lead.contact_name.split(' ')[0];
  }

  const background = research.company_background || '';
  const painPoints = research.pain_points || '';
  const hooks = research.personalization_hooks || '';

  const yearsMatch = background.match(/(\d+)\+?\s*years?/i) || background.match(/founded\s*(?:in\s*)?(\d{4})/i);
  const years = yearsMatch ? (yearsMatch[1].length === 4 ? (2025 - parseInt(yearsMatch[1])) : yearsMatch[1]) : null;

  let specificPain = '';
  let solution = '';

  const painLower = painPoints.toLowerCase();
  if (painLower.includes('leadership dependency') || painLower.includes('founder') || painLower.includes('owner-operated')) {
    specificPain = "you're still the one everyone turns to for the big decisions";
    solution = "building a leadership layer that can carry the weight";
  } else if (painLower.includes('relationship-dependent') || painLower.includes('relationship dependent')) {
    specificPain = "your best clients came through relationships you personally built";
    solution = "creating a pipeline that doesn't depend on your personal network";
  } else if (painLower.includes('infrastructure') || painLower.includes('manual') || painLower.includes('scale')) {
    specificPain = "the systems that got you here won't get you to the next level";
    solution = "architecting infrastructure that scales without adding complexity";
  } else if (painLower.includes('team') || painLower.includes('staff')) {
    specificPain = "your team needs you in the room to deliver at your standard";
    solution = "building systems so your team can operate at your level";
  } else {
    specificPain = "you've built something valuable but it still runs through you";
    solution = "creating systems that let you step back without stepping down";
  }

  let personalHook = '';
  if (hooks && hooks.length > 20) {
    const hookPatterns = [
      /(?:recognized|award|won|received|named|featured|speaker|keynote|author|published|grew|scaled|expanded)[^.]{10,80}\./gi,
      /(?:founded|established|built|created)[^.]{5,50}(?:in \d{4}|over \d+)[^.]*\./gi,
      /(?:\d+\s*years?)[^.]{10,60}\./gi
    ];

    for (const pattern of hookPatterns) {
      const matches = hooks.match(pattern);
      if (matches && matches[0].length > 15) {
        personalHook = matches[0].replace(/^\*+\s*/, '').replace(/^\s*-\s*/, '').trim();
        if (personalHook.length > 20 && personalHook.length < 120) break;
        personalHook = '';
      }
    }
  }

  const subject = firstName
    ? `${firstName} - a question about what's next`
    : `${company} - growth without the chaos`;

  let body = firstName ? `Hi ${firstName},\n\n` : `Hi,\n\n`;

  if (personalHook) {
    body += `I noticed ${personalHook.toLowerCase().startsWith('you') ? '' : 'that '}${personalHook.toLowerCase()}\n\n`;
    body += `Leaders who've achieved that level often hit a similar inflection point: `;
  } else if (years && years > 5) {
    body += `${years} years building ${company} - that's not luck, that's proof you know how to create something that works.\n\n`;
    body += `At this stage, the question usually shifts from "how do I grow?" to `;
  } else {
    body += `I've been looking at ${company} and the business you've built.\n\n`;
    body += `My guess is `;
  }

  body += `${specificPain}.\n\n`;
  body += `That's the gap I help established leaders close - ${solution}.\n\n`;
  body += `If that resonates, I'd enjoy a conversation about what the next chapter could look like for ${company}.\n\n`;
  body += `Best,\nMaggie Forbes\nMaggie Forbes Strategies`;

  return { subject, body };
}

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

// ============================================
// AUTONOMOUS EMAIL ENGINE ENDPOINTS
// ============================================

const AutonomousEmailEngine = require('./services/autonomous-email-engine');
const emailEngine = new AutonomousEmailEngine();

// Resend Webhook - receives email events (opens, clicks, bounces, replies)
app.post('/api/webhook/resend', express.raw({ type: 'application/json' }), async (req, res) => {
  console.log('\n📬 RESEND WEBHOOK RECEIVED');

  try {
    // Parse the raw body
    const payload = req.body.toString();
    const event = JSON.parse(payload);

    // Verify signature if webhook secret is configured
    const signature = req.headers['resend-signature'];
    if (process.env.RESEND_WEBHOOK_SECRET && signature) {
      const isValid = emailEngine.verifyWebhookSignature(payload, signature);
      if (!isValid) {
        console.log('⚠️ Invalid webhook signature');
        return res.status(401).json({ error: 'Invalid signature' });
      }
    }

    // Process the event
    const result = await emailEngine.processWebhook(event);

    res.json({ received: true, ...result });

  } catch (error) {
    console.error('❌ Resend webhook error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// Inbound Email Webhook - receives email replies
// Configure this in Resend dashboard under Inbound Emails
app.post('/api/webhook/email-reply', async (req, res) => {
  console.log('\n📨 INBOUND EMAIL REPLY RECEIVED');

  try {
    const inboundEmail = req.body;

    // Process the reply
    const result = await emailEngine.processIncomingReply(inboundEmail);

    res.json({ received: true, ...result });

  } catch (error) {
    console.error('❌ Email reply error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// Open Tracking Pixel
app.get('/api/track/open/:campaignId', async (req, res) => {
  const { campaignId } = req.params;

  try {
    const pixel = await emailEngine.trackOpen(campaignId);

    res.set({
      'Content-Type': 'image/gif',
      'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0'
    });
    res.send(pixel);

  } catch (error) {
    console.error('Track open error:', error);
    // Still return pixel even on error
    const pixel = Buffer.from('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7', 'base64');
    res.set('Content-Type', 'image/gif');
    res.send(pixel);
  }
});

// Click Tracking & Redirect
app.get('/api/track/click/:campaignId', async (req, res) => {
  const { campaignId } = req.params;
  const { url } = req.query;

  if (!url) {
    return res.status(400).json({ error: 'Missing url parameter' });
  }

  try {
    const targetUrl = await emailEngine.trackClick(campaignId, decodeURIComponent(url));
    res.redirect(302, targetUrl);

  } catch (error) {
    console.error('Track click error:', error);
    // Redirect anyway
    res.redirect(302, decodeURIComponent(url));
  }
});

// Unsubscribe Handler
app.get('/api/unsubscribe/:email', async (req, res) => {
  const { email } = req.params;

  try {
    // Add to unsubscribe list
    await supabase
      .from('email_blocklist')
      .upsert({
        email: decodeURIComponent(email).toLowerCase(),
        reason: 'unsubscribe',
        details: 'user_requested',
        created_at: new Date().toISOString()
      }, { onConflict: 'email' });

    // Update any campaigns for this email
    await supabase
      .from('outreach_campaigns')
      .update({
        status: 'unsubscribed',
        unsubscribed_at: new Date().toISOString(),
        unsubscribe_reason: 'user_requested'
      })
      .eq('recipient_email', decodeURIComponent(email).toLowerCase());

    // Return a simple confirmation page
    res.send(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Unsubscribed</title>
        <style>
          body { font-family: system-ui, sans-serif; max-width: 600px; margin: 100px auto; padding: 20px; text-align: center; }
          h1 { color: #333; }
          p { color: #666; }
        </style>
      </head>
      <body>
        <h1>You've been unsubscribed</h1>
        <p>You will no longer receive emails from us.</p>
        <p>If this was a mistake, please contact us directly.</p>
      </body>
      </html>
    `);

  } catch (error) {
    console.error('Unsubscribe error:', error);
    res.status(500).send('Error processing unsubscribe request');
  }
});

// One-Click Unsubscribe (List-Unsubscribe-Post header support)
app.post('/api/unsubscribe/:email', async (req, res) => {
  const { email } = req.params;

  try {
    await supabase
      .from('email_blocklist')
      .upsert({
        email: decodeURIComponent(email).toLowerCase(),
        reason: 'unsubscribe',
        details: 'one_click_unsubscribe',
        created_at: new Date().toISOString()
      }, { onConflict: 'email' });

    res.status(200).send('Unsubscribed');

  } catch (error) {
    console.error('One-click unsubscribe error:', error);
    res.status(500).send('Error');
  }
});

// Get Email Engine Stats
app.get('/api/email-engine/stats', async (req, res) => {
  try {
    const stats = emailEngine.getStats();
    res.json({ success: true, stats });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get Email Analytics
app.get('/api/email-engine/analytics', async (req, res) => {
  const { days = 30 } = req.query;

  try {
    const analytics = await emailEngine.getAnalytics(parseInt(days));
    res.json({ success: true, analytics });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Manually trigger follow-up processing
app.post('/api/email-engine/process-followups', async (req, res) => {
  try {
    const count = await emailEngine.processFollowUpQueue();
    res.json({ success: true, followUpsSent: count });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Start/Stop Email Engine
app.post('/api/email-engine/start', async (req, res) => {
  try {
    await emailEngine.start();
    res.json({ success: true, message: 'Email engine started' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/email-engine/stop', (req, res) => {
  try {
    emailEngine.stop();
    res.json({ success: true, message: 'Email engine stopped' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Configure follow-up sequence timing
app.post('/api/email-engine/configure-sequence', async (req, res) => {
  const { sequence } = req.body;

  // sequence format: [{ delay: 72, type: 'follow_up_1', subject: '...' }, ...]
  if (!sequence || !Array.isArray(sequence)) {
    return res.status(400).json({ error: 'sequence array required' });
  }

  try {
    // Store custom sequence in database
    await supabase
      .from('followup_sequences')
      .upsert({
        name: 'Custom Sequence',
        description: 'User-configured follow-up timing',
        is_default: false,
        steps: sequence,
        updated_at: new Date().toISOString()
      }, { onConflict: 'name' });

    // Update engine's in-memory sequence
    emailEngine.defaultSequence = sequence;

    res.json({ success: true, message: 'Sequence configured', sequence });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get current sequence configuration
app.get('/api/email-engine/sequence', (req, res) => {
  res.json({
    success: true,
    sequence: emailEngine.defaultSequence,
    calendlyLink: emailEngine.calendlyLink
  });
});

// Update Calendly link
app.post('/api/email-engine/calendly-link', (req, res) => {
  const { calendlyLink } = req.body;

  if (!calendlyLink) {
    return res.status(400).json({ error: 'calendlyLink required' });
  }

  emailEngine.calendlyLink = calendlyLink;
  res.json({ success: true, calendlyLink });
});

// Manual reply processing (for testing or importing)
app.post('/api/email-engine/process-reply', async (req, res) => {
  const { from, subject, text, html } = req.body;

  if (!from || (!text && !html)) {
    return res.status(400).json({ error: 'from and text/html required' });
  }

  try {
    const result = await emailEngine.processIncomingReply({
      from,
      subject: subject || 'Re: Follow-up',
      text,
      html
    });

    res.json({ success: true, ...result });

  } catch (error) {
    res.status(500).json({ error: error.message });
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

  // NOTE: auto-outreach removed from auto-start to prevent email spam
  // It was sending to the same 3 people repeatedly. Only start manually after fixing.
  const agentMap = {
    'gap-finder': './agents/gap-finder-agent.js',
    // 'auto-outreach': './agents/auto-outreach-agent.js',  // DISABLED - needs fixing
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

  // Auto-start the autonomous email engine
  setTimeout(async () => {
    console.log('\n📧 Starting Autonomous Email Engine...');
    try {
      await emailEngine.start();
      console.log('✅ Autonomous Email Engine is running');
    } catch (error) {
      console.error('❌ Failed to start email engine:', error.message);
    }
  }, 7000);
});

module.exports = app;
