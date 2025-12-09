#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');

class AutoOutreachAgent {
  constructor() {
    this.supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_KEY
    );
    this.running = false;
    this.emailsSent = 0;
  }

  async start() {
    console.log('📧 Auto Outreach Agent starting...');
    this.running = true;

    try {
      await this.processOutreach();

      // Run every 10 minutes
      setInterval(async () => {
        if (this.running) {
          await this.processOutreach();
        }
      }, 10 * 60 * 1000);

    } catch (error) {
      console.error('❌ Outreach Agent error:', error);
      process.exit(1);
    }
  }

  async processOutreach() {
    console.log('📨 Processing outreach campaigns...');

    try {
      // Check if auto-outreach is enabled
      const { data: settings } = await this.supabase
        .from('system_settings')
        .select('setting_value')
        .eq('setting_key', 'auto_outreach_enabled')
        .single();

      const autoSendEnabled = settings?.setting_value === 'true';

      // Get approved gaps OR high-priority gaps for drafting
      const { data: gaps, error } = await this.supabase
        .from('market_gaps')
        .select('*, scored_opportunities(*)')
        .gte('confidence_score', 0.7)
        .eq('approved_for_outreach', true)
        .is('outreach_sent', null)
        .limit(5);

      if (error) throw error;

      if (!gaps || gaps.length === 0) {
        console.log('📭 No approved gaps for outreach');
        return;
      }

      console.log(`📬 Preparing outreach for ${gaps.length} approved opportunities...`);

      for (const gap of gaps) {
        await this.sendOutreach(gap, autoSendEnabled);
      }

      console.log(`✅ Campaigns created: ${this.emailsSent} (auto-send: ${autoSendEnabled})`);
    } catch (error) {
      console.error('Error processing outreach:', error);
    }
  }

  async sendOutreach(gap, autoSendEnabled) {
    try {
      // Generate personalized email content
      const email = await this.generateEmail(gap);

      // Create outreach campaign as DRAFT (requires manual approval to send)
      const campaignData = {
        gap_id: gap.id,
        company_name: gap.company_name,
        subject: email.subject,
        body: email.body,
        status: autoSendEnabled ? 'sent' : 'draft',
        approved_for_sending: autoSendEnabled
      };

      // Only set sent_at if auto-send is enabled
      if (autoSendEnabled) {
        campaignData.sent_at = new Date().toISOString();
      }

      const { data, error } = await this.supabase
        .from('outreach_campaigns')
        .insert(campaignData)
        .select();

      if (!error && data) {
        // Update gap as contacted
        await this.supabase
          .from('market_gaps')
          .update({ outreach_sent: true })
          .eq('id', gap.id);

        this.emailsSent++;

        if (autoSendEnabled) {
          console.log(`✉️  Email SENT to ${gap.company_name}`);
        } else {
          console.log(`📝 Draft created for ${gap.company_name} (awaiting approval)`);
        }
      }
    } catch (error) {
      console.error(`Error creating outreach for ${gap.company_name}:`, error);
    }
  }

  async generateEmail(gap) {
    // Generate personalized email based on gap type
    const templates = {
      technology: {
        subject: `Streamline your tech stack at ${gap.company_name}`,
        body: `Hi,

I noticed that ${gap.company_name} might benefit from modern automation solutions.

We specialize in helping companies like yours modernize their technology stack and improve operational efficiency.

Would you be open to a quick conversation about how we can help?

Best regards,
Unbound.Team`
      },
      growth: {
        subject: `Unlock revenue growth for ${gap.company_name}`,
        body: `Hi,

I see ${gap.company_name} has strong market signals. We help companies like yours optimize revenue and accelerate growth.

Would love to share some strategies that might be relevant for your business.

Best regards,
Unbound.Team`
      },
      operations: {
        subject: `Automate operations at ${gap.company_name}`,
        body: `Hi,

Running lean can be challenging. We help small teams like yours automate workflows and scale operations efficiently.

Interested in learning how we can help?

Best regards,
Unbound.Team`
      }
    };

    return templates[gap.gap_type] || templates.technology;
  }

  stop() {
    console.log('🛑 Auto Outreach Agent stopping...');
    this.running = false;
    process.exit(0);
  }
}

// Run agent if executed directly
if (require.main === module) {
  const agent = new AutoOutreachAgent();

  // Handle shutdown gracefully
  process.on('SIGTERM', () => agent.stop());
  process.on('SIGINT', () => agent.stop());

  agent.start();
}

module.exports = AutoOutreachAgent;
