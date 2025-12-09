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
      // Get high-priority gaps that need outreach
      const { data: gaps, error } = await this.supabase
        .from('market_gaps')
        .select('*, scored_opportunities(*)')
        .gte('confidence_score', 0.7)
        .is('outreach_sent', null)
        .limit(5);

      if (error) throw error;

      if (!gaps || gaps.length === 0) {
        console.log('📭 No gaps requiring outreach');
        return;
      }

      console.log(`📬 Preparing outreach for ${gaps.length} opportunities...`);

      for (const gap of gaps) {
        await this.sendOutreach(gap);
      }

      console.log(`✅ Total emails sent: ${this.emailsSent}`);
    } catch (error) {
      console.error('Error processing outreach:', error);
    }
  }

  async sendOutreach(gap) {
    try {
      // Generate personalized email content
      const email = await this.generateEmail(gap);

      // Create outreach campaign record
      const { data, error } = await this.supabase
        .from('outreach_campaigns')
        .insert({
          gap_id: gap.id,
          company_name: gap.company_name,
          subject: email.subject,
          body: email.body,
          status: 'sent',
          sent_at: new Date().toISOString()
        })
        .select();

      if (!error && data) {
        // Update gap as contacted
        await this.supabase
          .from('market_gaps')
          .update({ outreach_sent: true })
          .eq('id', gap.id);

        this.emailsSent++;
        console.log(`✉️  Outreach sent to ${gap.company_name}`);
      }
    } catch (error) {
      console.error(`Error sending outreach to ${gap.company_name}:`, error);
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
