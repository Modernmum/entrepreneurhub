// Autonomous Agent - AGI-like orchestration
// Makes intelligent decisions about what to do each day for each client

const orchestrator = require('./ai-orchestrator');
const leadScraper = require('./lead-scraper');
const contentCreator = require('./content-creator');
const marketResearcher = require('./market-researcher');
const emailMarketer = require('./email-marketer');
const rssMonitor = require('./rss-monitor');
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.ENTREPRENEURHUB_SUPABASE_URL,
  process.env.ENTREPRENEURHUB_SUPABASE_SERVICE_KEY
);

class AutonomousAgent {
  constructor() {
    this.memory = {}; // Stores learnings per client
  }

  // ============================================================================
  // MAIN AUTONOMOUS LOOP - The AGI Brain
  // ============================================================================

  async runBusinessDay(tenantId, clientGoals) {
    console.log(`\n🤖 Autonomous Agent starting day for ${tenantId}`);
    console.log(`Goals: ${JSON.stringify(clientGoals, null, 2)}`);

    try {
      // Step 1: Understand current situation
      const context = await this.analyzeBusinessContext(tenantId, clientGoals);

      // Step 2: Decide what to do today (AGI decision-making)
      const plan = await this.createDailyPlan(context);

      // Step 3: Execute the plan autonomously
      const results = await this.executePlan(plan, tenantId);

      // Step 4: Learn from results
      await this.learnFromResults(tenantId, results);

      // Step 5: Generate summary report
      const report = await this.generateReport(tenantId, results);

      console.log(`✅ Autonomous day complete for ${tenantId}`);

      return {
        success: true,
        plan,
        results,
        report
      };

    } catch (error) {
      console.error(`❌ Autonomous agent error for ${tenantId}:`, error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // ============================================================================
  // STEP 1: ANALYZE BUSINESS CONTEXT
  // ============================================================================

  async analyzeBusinessContext(tenantId, clientGoals) {
    console.log(`📊 Analyzing business context for ${tenantId}...`);

    // Get historical data from Supabase
    const [leads, content, research] = await Promise.all([
      this.getRecentLeads(tenantId),
      this.getRecentContent(tenantId),
      this.getRecentResearch(tenantId)
    ]);

    // Get client's memory (what we've learned)
    const memory = this.memory[tenantId] || {};

    // Use AI to analyze the situation
    const prompt = `Analyze this business situation and provide strategic insights:

CLIENT GOALS:
${JSON.stringify(clientGoals, null, 2)}

RECENT PERFORMANCE:
- Leads generated last 7 days: ${leads.length}
- Content created last 7 days: ${content.length}
- Research reports last 30 days: ${research.length}

WHAT'S WORKING (from memory):
${JSON.stringify(memory, null, 2)}

Provide analysis in JSON format:
{
  "pipelineHealth": "strong|medium|weak",
  "contentPerformance": "high|medium|low",
  "marketPosition": "leading|competitive|behind",
  "urgentNeeds": ["list of urgent actions needed"],
  "opportunities": ["list of opportunities to pursue"],
  "recommendations": ["specific actions to take today"]
}`;

    const analysis = await orchestrator.execute('strategic-analysis', prompt);

    let context;
    try {
      context = JSON.parse(analysis.content);
    } catch (error) {
      // Fallback to basic analysis
      context = {
        pipelineHealth: leads.length > 20 ? 'strong' : leads.length > 10 ? 'medium' : 'weak',
        contentPerformance: content.length > 5 ? 'high' : content.length > 2 ? 'medium' : 'low',
        marketPosition: 'competitive',
        urgentNeeds: [],
        opportunities: [],
        recommendations: ['Generate leads', 'Create content']
      };
    }

    context.historicalData = { leads, content, research };
    context.clientGoals = clientGoals;
    context.memory = memory;

    return context;
  }

  // ============================================================================
  // STEP 2: CREATE DAILY PLAN (AGI Decision Making)
  // ============================================================================

  async createDailyPlan(context) {
    console.log(`🎯 Creating autonomous daily plan...`);

    const prompt = `You are an autonomous business AI. Based on this context, create today's action plan:

CONTEXT:
${JSON.stringify(context, null, 2)}

Create a specific, actionable plan for TODAY. Return JSON:
{
  "priority": "lead-generation|content-creation|market-research|email-campaigns",
  "reasoning": "why this is the priority",
  "actions": [
    {
      "task": "generate-leads|create-content|research-market|send-emails",
      "params": { specific parameters for the task },
      "expectedOutcome": "what we expect to achieve"
    }
  ],
  "successMetrics": ["how we'll measure success"]
}

Be specific. Choose 2-4 actions maximum. Focus on highest impact.`;

    const decision = await orchestrator.execute('strategic-planning', prompt);

    let plan;
    try {
      plan = JSON.parse(decision.content);
    } catch (error) {
      // Fallback to basic plan based on context
      plan = this.createFallbackPlan(context);
    }

    console.log(`✅ Plan created: ${plan.priority}`);
    console.log(`Reasoning: ${plan.reasoning}`);

    return plan;
  }

  createFallbackPlan(context) {
    // Smart fallback based on context
    if (context.pipelineHealth === 'weak') {
      return {
        priority: 'lead-generation',
        reasoning: 'Pipeline is weak, need more leads',
        actions: [
          {
            task: 'generate-leads',
            params: {
              targetIndustry: context.clientGoals.targetIndustry || 'entrepreneurs',
              count: 20,
              minScore: 7
            },
            expectedOutcome: '20 qualified leads'
          }
        ],
        successMetrics: ['Leads generated', 'Average fit score']
      };
    } else if (context.contentPerformance === 'low') {
      return {
        priority: 'content-creation',
        reasoning: 'Need more content to nurture leads',
        actions: [
          {
            task: 'create-content',
            params: {
              type: 'blog',
              topic: context.clientGoals.contentFocus || 'business growth',
              count: 2
            },
            expectedOutcome: '2 blog posts'
          }
        ],
        successMetrics: ['Content pieces created', 'Quality score']
      };
    } else {
      return {
        priority: 'market-research',
        reasoning: 'Pipeline and content are healthy, time to research',
        actions: [
          {
            task: 'research-market',
            params: {
              industry: context.clientGoals.industry || 'general',
              focus: 'competitive-analysis'
            },
            expectedOutcome: 'Market insights'
          }
        ],
        successMetrics: ['Insights discovered', 'Opportunities identified']
      };
    }
  }

  // ============================================================================
  // STEP 3: EXECUTE PLAN
  // ============================================================================

  async executePlan(plan, tenantId) {
    console.log(`⚡ Executing plan: ${plan.priority}`);

    const results = [];

    for (const action of plan.actions) {
      console.log(`  → Running: ${action.task}`);

      try {
        let result;

        switch (action.task) {
          case 'generate-leads':
            result = await this.executeLeadGeneration(action.params, tenantId);
            break;

          case 'create-content':
            result = await this.executeContentCreation(action.params, tenantId);
            break;

          case 'research-market':
            result = await this.executeMarketResearch(action.params, tenantId);
            break;

          case 'send-emails':
            result = await this.executeEmailCampaign(action.params, tenantId);
            break;

          default:
            result = { success: false, error: 'Unknown task type' };
        }

        results.push({
          task: action.task,
          success: result.success,
          data: result,
          expectedOutcome: action.expectedOutcome
        });

      } catch (error) {
        console.error(`❌ Error executing ${action.task}:`, error);
        results.push({
          task: action.task,
          success: false,
          error: error.message
        });
      }
    }

    return results;
  }

  async executeLeadGeneration(params, tenantId) {
    const leads = await leadScraper.findLeads({
      targetIndustry: params.targetIndustry,
      location: params.location || 'global',
      criteria: {
        count: params.count || 10,
        minScore: params.minScore || 6
      }
    });

    // Store in Supabase
    const stored = [];
    for (const lead of leads) {
      const { data, error } = await supabase
        .from('generated_leads')
        .insert({
          tenant_id: tenantId,
          name: lead.name,
          company: lead.company,
          source: lead.source,
          url: lead.url,
          description: lead.description,
          pain_points: lead.painPoints,
          fit_score: lead.fitScore,
          outreach_tip: lead.outreachTip
        })
        .select()
        .single();

      if (!error) stored.push(data);
    }

    return {
      success: true,
      leadsFound: leads.length,
      leadsStored: stored.length,
      leads: stored
    };
  }

  async executeContentCreation(params, tenantId) {
    const content = await contentCreator.createBlogPost({
      topic: params.topic,
      wordCount: params.wordCount || 1500,
      keywords: params.keywords || [],
      tone: params.tone || 'professional'
    });

    // Store in Supabase
    const { data, error } = await supabase
      .from('generated_content')
      .insert({
        tenant_id: tenantId,
        type: params.type || 'blog',
        title: content.title,
        content: content.content,
        seo_meta: content.seoMeta,
        status: 'ready_for_review'
      })
      .select()
      .single();

    return {
      success: !error,
      content: data
    };
  }

  async executeMarketResearch(params, tenantId) {
    const research = await marketResearcher.analyzeMarket({
      industry: params.industry,
      competitors: params.competitors || [],
      focus: params.focus || 'general'
    });

    // Store in Supabase
    const { data, error } = await supabase
      .from('market_research')
      .insert({
        tenant_id: tenantId,
        industry: params.industry,
        report_type: params.focus,
        findings: research.findings,
        recommendations: research.recommendations,
        opportunity_score: research.opportunityScore
      })
      .select()
      .single();

    return {
      success: !error,
      research: data
    };
  }

  async executeEmailCampaign(params, tenantId) {
    const campaign = await emailMarketer.createCampaign({
      type: params.type || 'nurture',
      audience: params.audience,
      sequenceLength: params.sequenceLength || 5
    });

    return {
      success: true,
      campaign
    };
  }

  // ============================================================================
  // STEP 4: LEARN FROM RESULTS (AGI Learning)
  // ============================================================================

  async learnFromResults(tenantId, results) {
    console.log(`🧠 Learning from today's results...`);

    if (!this.memory[tenantId]) {
      this.memory[tenantId] = {
        bestLeadSources: {},
        bestContentTopics: {},
        successPatterns: []
      };
    }

    for (const result of results) {
      if (result.success && result.task === 'generate-leads') {
        // Learn which lead sources work best
        const leads = result.data.leads || [];
        for (const lead of leads) {
          const source = lead.source;
          if (!this.memory[tenantId].bestLeadSources[source]) {
            this.memory[tenantId].bestLeadSources[source] = { count: 0, avgScore: 0 };
          }
          const prev = this.memory[tenantId].bestLeadSources[source];
          prev.count += 1;
          prev.avgScore = ((prev.avgScore * (prev.count - 1)) + lead.fit_score) / prev.count;
        }
      }

      if (result.success) {
        this.memory[tenantId].successPatterns.push({
          task: result.task,
          date: new Date().toISOString(),
          outcome: result.expectedOutcome
        });
      }
    }

    // Save memory to Supabase for persistence
    await this.saveMemory(tenantId);

    console.log(`✅ Learning complete. Memory updated.`);
  }

  async saveMemory(tenantId) {
    const { error } = await supabase
      .from('agent_memory')
      .upsert({
        tenant_id: tenantId,
        memory: this.memory[tenantId],
        updated_at: new Date().toISOString()
      });

    if (error) {
      console.error('Error saving memory:', error);
    }
  }

  async loadMemory(tenantId) {
    const { data, error } = await supabase
      .from('agent_memory')
      .select('*')
      .eq('tenant_id', tenantId)
      .single();

    if (!error && data) {
      this.memory[tenantId] = data.memory;
    }
  }

  // ============================================================================
  // STEP 5: GENERATE REPORT
  // ============================================================================

  async generateReport(tenantId, results) {
    console.log(`📝 Generating summary report...`);

    const summary = {
      date: new Date().toISOString(),
      tenant_id: tenantId,
      tasksCompleted: results.filter(r => r.success).length,
      tasksFailed: results.filter(r => !r.success).length,
      results: results.map(r => ({
        task: r.task,
        success: r.success,
        outcome: r.expectedOutcome
      }))
    };

    // Use AI to create human-readable summary
    const prompt = `Create a brief executive summary of today's autonomous business operations:

RESULTS:
${JSON.stringify(summary, null, 2)}

Write a 3-4 sentence summary highlighting key accomplishments and insights.`;

    const report = await orchestrator.execute('summarization', prompt);

    summary.executiveSummary = report.content;

    return summary;
  }

  // ============================================================================
  // HELPER METHODS
  // ============================================================================

  async getRecentLeads(tenantId) {
    const sevenDaysAgo = new Date(Date.now() - 7*24*60*60*1000).toISOString();

    const { data, error } = await supabase
      .from('generated_leads')
      .select('*')
      .eq('tenant_id', tenantId)
      .gte('created_at', sevenDaysAgo);

    return data || [];
  }

  async getRecentContent(tenantId) {
    const sevenDaysAgo = new Date(Date.now() - 7*24*60*60*1000).toISOString();

    const { data, error } = await supabase
      .from('generated_content')
      .select('*')
      .eq('tenant_id', tenantId)
      .gte('created_at', sevenDaysAgo);

    return data || [];
  }

  async getRecentResearch(tenantId) {
    const thirtyDaysAgo = new Date(Date.now() - 30*24*60*60*1000).toISOString();

    const { data, error } = await supabase
      .from('market_research')
      .select('*')
      .eq('tenant_id', tenantId)
      .gte('created_at', thirtyDaysAgo);

    return data || [];
  }
}

module.exports = new AutonomousAgent();
