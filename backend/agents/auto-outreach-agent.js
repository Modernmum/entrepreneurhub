#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');
const IntelligentScorer = require('../services/intelligent-scorer');
const AIResearcher = require('../services/ai-researcher');
const { Resend } = require('resend');

class AutoOutreachAgent {
  constructor() {
    this.supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_KEY
    );
    this.running = false;
    this.emailsSent = 0;

    // Initialize new services
    this.scorer = new IntelligentScorer();
    this.researcher = new AIResearcher();

    // Resend email client
    this.resend = new Resend(process.env.RESEND_API_KEY);
    this.fromEmail = process.env.RESEND_FROM_EMAIL || 'maggie@maggieforbesstrategies.com';
  }

  async start() {
    console.log('📧 Auto Outreach Agent starting...');
    console.log('🔧 Using: Intelligent Scoring + Perplexity Research + Automated Sending');
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

      // Get unprocessed opportunities from scored_opportunities
      const { data: opportunities, error } = await this.supabase
        .from('scored_opportunities')
        .select('*')
        .is('outreach_sent', null)
        .gte('overall_score', 70) // Only process leads with 70+ score (high quality)
        .eq('route_to_outreach', true) // Must be flagged for outreach
        .limit(10); // Process 10 at a time

      if (error) throw error;

      if (!opportunities || opportunities.length === 0) {
        console.log('📭 No opportunities ready for outreach');
        return;
      }

      console.log(`📬 Processing ${opportunities.length} opportunities...`);

      for (const opp of opportunities) {
        try {
          // Step 1: Score the opportunity
          console.log(`\n📊 Scoring: ${opp.company_name}`);
          const scoring = await this.scorer.processOpportunity(opp);

          // Use overall_score from database if scoring fails
          const effectiveScore = scoring.score || opp.overall_score || 0;

          if (!scoring.qualified && effectiveScore < 70) {
            console.log(`   ⏭️  Skipped (score: ${effectiveScore})`);
            await this.markAsProcessed(opp.id, 'skipped_low_score');
            continue;
          }

          console.log(`   ✅ Qualified (score: ${effectiveScore})`);

          // Step 2: Research with Perplexity
          console.log(`   🔍 Researching...`);
          const research = await this.researcher.researchLead(opp);
          console.log(`   ✅ Research complete`);

          // Step 3: Generate personalized email
          const email = this.generatePersonalizedEmail(opp, research, scoring);

          // Get email from contact_email OR opportunity_data.discovered_email
          const recipientEmail = opp.contact_email || opp.opportunity_data?.discovered_email;

          // Step 4: Send email (if auto-send enabled and email available)
          if (autoSendEnabled && process.env.RESEND_API_KEY && recipientEmail) {
            console.log(`   📧 Sending email via Resend to ${recipientEmail}...`);
            await this.sendEmail({ ...opp, contact_email: recipientEmail }, email);
            console.log(`   ✅ Email sent to ${recipientEmail}`);
            this.emailsSent++;
          } else {
            const reason = !recipientEmail ? 'no email address' :
                          !autoSendEnabled ? 'auto-send disabled' : 'Resend API key not configured';
            console.log(`   📝 Draft created (${reason})`);
          }

          // Store in outreach_campaigns
          await this.createCampaign(opp, email, research, scoring, autoSendEnabled);

          // Mark as processed
          await this.markAsProcessed(opp.id, autoSendEnabled ? 'sent' : 'draft');

          // Rate limiting
          await new Promise(resolve => setTimeout(resolve, 3000));

        } catch (error) {
          console.error(`   ❌ Error processing ${opp.company_name}:`, error);
        }
      }

      console.log(`\n✅ Outreach complete: ${this.emailsSent} emails sent`);

    } catch (error) {
      console.error('Error processing outreach:', error);
    }
  }

  generatePersonalizedEmail(opportunity, research, scoring) {
    const company = opportunity.company_name;

    // Extract research findings
    let companyInfo = '';
    if (research.companyBackground?.findings) {
      companyInfo = research.companyBackground.findings.split('\n').slice(0, 2).join(' ').substring(0, 250);
    }

    let painPoint = '';
    if (research.painPointAnalysis?.findings) {
      painPoint = research.painPointAnalysis.findings.split('\n').slice(0, 2).join(' ').substring(0, 200);
    }

    let hook = '';
    if (research.personalizationHooks?.findings) {
      hook = research.personalizationHooks.findings.split('\n').slice(0, 2).join(' ').substring(0, 150);
    }

    // Craft email
    const subject = `Automating client acquisition for ${company}`;

    let body = `Hi there,\n\n`;

    if (companyInfo) {
      body += `I came across ${company} and was impressed by what you're building. ${companyInfo}...\n\n`;
    } else {
      body += `I came across ${company} and wanted to reach out.\n\n`;
    }

    if (painPoint) {
      body += `I understand you're facing challenges with ${painPoint}... That's exactly what we help businesses solve.\n\n`;
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
    body += `P.S. This entire email was generated using the same system I'd build for you - from discovery to research to personalization.`;

    return { subject, body };
  }

  async sendEmail(opportunity, email) {
    const { data, error } = await this.resend.emails.send({
      from: `Maggie Forbes <${this.fromEmail}>`,
      to: opportunity.contact_email,
      subject: email.subject,
      text: email.body,
      html: email.body.replace(/\n/g, '<br>')
    });

    if (error) {
      throw new Error(`Resend error: ${error.message}`);
    }

    return data;
  }

  async createCampaign(opportunity, email, research, scoring, sent) {
    const recipientEmail = opportunity.contact_email || opportunity.opportunity_data?.discovered_email;
    const campaignData = {
      opportunity_id: opportunity.id,
      company_name: opportunity.company_name,
      recipient_email: recipientEmail,
      subject: email.subject,
      email_content: email.body,
      status: sent ? 'sent' : 'draft',
      fit_score: scoring.score,
      lead_research: research,
      scoring_breakdown: scoring.breakdown,
      sent_at: sent ? new Date().toISOString() : null,
      created_at: new Date().toISOString()
    };

    const { data, error } = await this.supabase
      .from('outreach_campaigns')
      .insert(campaignData)
      .select();

    if (error) throw error;
    return data;
  }

  async markAsProcessed(opportunityId, status) {
    await this.supabase
      .from('scored_opportunities')
      .update({
        outreach_sent: true,
        outreach_status: status,
        outreach_sent_at: new Date().toISOString()
      })
      .eq('id', opportunityId);
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
