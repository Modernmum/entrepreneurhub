#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');

class GapFinderAgent {
  constructor() {
    this.supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_KEY
    );
    this.running = false;
    this.opportunitiesFound = 0;
  }

  async start() {
    console.log('🤖 Gap Finder Agent starting...');
    this.running = true;

    try {
      await this.findGaps();

      // Run every 5 minutes
      setInterval(async () => {
        if (this.running) {
          await this.findGaps();
        }
      }, 5 * 60 * 1000);

    } catch (error) {
      console.error('❌ Gap Finder error:', error);
      process.exit(1);
    }
  }

  async findGaps() {
    console.log('🔍 Analyzing market for gaps...');

    try {
      // Get existing opportunities from database
      const { data: opportunities, error } = await this.supabase
        .from('scored_opportunities')
        .select('*')
        .gte('overall_score', 70)
        .eq('route_to_outreach', false)
        .limit(10);

      if (error) throw error;

      if (!opportunities || opportunities.length === 0) {
        console.log('📭 No new opportunities to analyze');
        return;
      }

      console.log(`📊 Analyzing ${opportunities.length} opportunities for gaps...`);

      // Analyze each opportunity for market gaps
      for (const opp of opportunities) {
        const gap = await this.analyzeOpportunity(opp);

        if (gap) {
          // Store identified gap
          const { data, error: insertError } = await this.supabase
            .from('market_gaps')
            .insert({
              opportunity_id: opp.id,
              company_name: opp.company_name,
              gap_type: gap.type,
              gap_description: gap.description,
              solution_approach: gap.solution,
              confidence_score: gap.confidence,
              identified_at: new Date().toISOString()
            })
            .select();

          if (!insertError) {
            this.opportunitiesFound++;
            console.log(`✅ Gap identified for ${opp.company_name}: ${gap.type}`);
          }
        }
      }

      console.log(`🎯 Total gaps found: ${this.opportunitiesFound}`);
    } catch (error) {
      console.error('Error finding gaps:', error);
    }
  }

  async analyzeOpportunity(opportunity) {
    // Simple gap analysis based on opportunity scores
    const gaps = [];

    if (opportunity.tech_stack_score < 60) {
      gaps.push({
        type: 'technology',
        description: 'Outdated or inefficient technology stack',
        solution: 'Modern automation and integration solutions',
        confidence: 0.8
      });
    }

    if (opportunity.signal_strength_score > 80 && opportunity.revenue_score < 70) {
      gaps.push({
        type: 'growth',
        description: 'Strong signals but revenue constraints',
        solution: 'Revenue optimization and growth strategies',
        confidence: 0.75
      });
    }

    if (opportunity.employee_score < 50) {
      gaps.push({
        type: 'operations',
        description: 'Small team facing operational challenges',
        solution: 'Automation and workflow optimization',
        confidence: 0.85
      });
    }

    // Return highest confidence gap
    if (gaps.length > 0) {
      return gaps.sort((a, b) => b.confidence - a.confidence)[0];
    }

    return null;
  }

  stop() {
    console.log('🛑 Gap Finder Agent stopping...');
    this.running = false;
    process.exit(0);
  }
}

// Run agent if executed directly
if (require.main === module) {
  const agent = new GapFinderAgent();

  // Handle shutdown gracefully
  process.on('SIGTERM', () => agent.stop());
  process.on('SIGINT', () => agent.stop());

  agent.start();
}

module.exports = GapFinderAgent;
