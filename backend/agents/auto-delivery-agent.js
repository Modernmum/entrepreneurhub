#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');

class AutoDeliveryAgent {
  constructor() {
    this.supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_KEY
    );
    this.running = false;
    this.deliveriesCompleted = 0;
  }

  async start() {
    console.log('🚀 Auto Delivery Agent starting...');
    this.running = true;

    try {
      await this.processDeliveries();

      // Run every 15 minutes
      setInterval(async () => {
        if (this.running) {
          await this.processDeliveries();
        }
      }, 15 * 60 * 1000);

    } catch (error) {
      console.error('❌ Delivery Agent error:', error);
      process.exit(1);
    }
  }

  async processDeliveries() {
    console.log('📦 Processing deliveries...');

    try {
      // Check if auto-delivery is enabled
      const { data: settings } = await this.supabase
        .from('system_settings')
        .select('setting_value')
        .eq('setting_key', 'auto_delivery_enabled')
        .single();

      const autoDeliveryEnabled = settings?.setting_value === 'true';

      // Get outreach campaigns that got positive responses
      const { data: campaigns, error } = await this.supabase
        .from('outreach_campaigns')
        .select('*')
        .eq('status', 'replied')
        .is('delivery_sent', null)
        .limit(5);

      if (error) throw error;

      if (!campaigns || campaigns.length === 0) {
        console.log('📭 No deliveries to process');
        return;
      }

      console.log(`📬 Processing ${campaigns.length} deliveries... (auto-delivery: ${autoDeliveryEnabled})`);

      for (const campaign of campaigns) {
        await this.deliverSolution(campaign, autoDeliveryEnabled);
      }

      console.log(`✅ Total deliveries prepared: ${this.deliveriesCompleted}`);
    } catch (error) {
      console.error('Error processing deliveries:', error);
    }
  }

  async deliverSolution(campaign, autoDeliveryEnabled) {
    try {
      // Generate solution based on gap type
      const solution = await this.generateSolution(campaign);

      // Create delivery record as DRAFT (requires manual approval)
      const deliveryData = {
        campaign_id: campaign.id,
        company_name: campaign.company_name,
        solution_type: solution.type,
        solution_content: solution.content,
        delivery_method: solution.method,
        status: autoDeliveryEnabled ? 'delivered' : 'draft',
        approved_for_delivery: autoDeliveryEnabled
      };

      // Only set delivered_at if auto-delivery is enabled
      if (autoDeliveryEnabled) {
        deliveryData.delivered_at = new Date().toISOString();
      }

      const { data, error } = await this.supabase
        .from('solution_deliveries')
        .insert(deliveryData)
        .select();

      if (!error && data) {
        // Only mark as delivered if auto-delivery is enabled
        if (autoDeliveryEnabled) {
          await this.supabase
            .from('outreach_campaigns')
            .update({
              delivery_sent: true,
              status: 'delivered'
            })
            .eq('id', campaign.id);

          console.log(`📦 Solution DELIVERED to ${campaign.company_name}`);
        } else {
          console.log(`📝 Solution draft created for ${campaign.company_name} (awaiting approval)`);
        }

        this.deliveriesCompleted++;
      }
    } catch (error) {
      console.error(`Error creating delivery for ${campaign.company_name}:`, error);
    }
  }

  async generateSolution(campaign) {
    // Generate different solutions based on gap type
    const solutions = {
      technology: {
        type: 'automation_audit',
        method: 'document',
        content: {
          title: 'Technology Stack Optimization Plan',
          sections: [
            'Current Stack Analysis',
            'Automation Opportunities',
            'Integration Recommendations',
            'Implementation Roadmap',
            'ROI Projection'
          ],
          deliverables: [
            'Technology assessment report',
            'Automation blueprint',
            '30-day implementation plan'
          ]
        }
      },
      growth: {
        type: 'revenue_optimization',
        method: 'strategy_session',
        content: {
          title: 'Revenue Growth Strategy',
          sections: [
            'Current Revenue Analysis',
            'Market Opportunity Assessment',
            'Growth Strategies',
            'Sales Process Optimization',
            'Revenue Projections'
          ],
          deliverables: [
            'Growth strategy document',
            'Revenue optimization playbook',
            'KPI tracking framework'
          ]
        }
      },
      operations: {
        type: 'workflow_automation',
        method: 'implementation',
        content: {
          title: 'Operational Efficiency Package',
          sections: [
            'Current Workflow Analysis',
            'Automation Opportunities',
            'Process Optimization',
            'Tool Recommendations',
            'Implementation Timeline'
          ],
          deliverables: [
            'Workflow automation setup',
            'Process documentation',
            'Team training materials'
          ]
        }
      }
    };

    // Default to technology solution
    return solutions.technology;
  }

  async getDeliveryStats() {
    try {
      const { data, error } = await this.supabase
        .from('solution_deliveries')
        .select('*')
        .eq('status', 'delivered');

      if (error) throw error;

      return {
        total: data?.length || 0,
        byType: this.groupByType(data || [])
      };
    } catch (error) {
      console.error('Error fetching delivery stats:', error);
      return { total: 0, byType: {} };
    }
  }

  groupByType(deliveries) {
    return deliveries.reduce((acc, delivery) => {
      acc[delivery.solution_type] = (acc[delivery.solution_type] || 0) + 1;
      return acc;
    }, {});
  }

  stop() {
    console.log('🛑 Auto Delivery Agent stopping...');
    this.running = false;
    process.exit(0);
  }
}

// Run agent if executed directly
if (require.main === module) {
  const agent = new AutoDeliveryAgent();

  // Handle shutdown gracefully
  process.on('SIGTERM', () => agent.stop());
  process.on('SIGINT', () => agent.stop());

  agent.start();
}

module.exports = AutoDeliveryAgent;
