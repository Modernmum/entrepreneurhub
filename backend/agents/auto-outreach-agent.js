#!/usr/bin/env node

/**
 * Auto Outreach Agent for Maggie Forbes Strategies
 *
 * Processes leads from mfs_leads table:
 * 1. Finds researched leads that haven't been emailed
 * 2. Generates personalized emails using research data
 * 3. Sends via Resend (if enabled)
 * 4. Tracks all sent emails to prevent duplicates
 */

const { createClient } = require('@supabase/supabase-js');
const { Resend } = require('resend');
const SmartEmailWriter = require('../services/smart-email-writer');

class AutoOutreachAgent {
  constructor() {
    this.supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_KEY
    );
    this.running = false;
    this.emailsSent = 0;
    this.emailsSkipped = 0;

    // Resend email client
    this.resend = new Resend(process.env.RESEND_API_KEY);
    this.fromEmail = process.env.RESEND_FROM_EMAIL || 'maggie@maggieforbesstrategies.com';

    // Smart email writer - uses research data intelligently
    this.emailWriter = new SmartEmailWriter();
  }

  async start() {
    console.log('📧 MFS Auto Outreach Agent starting...');
    console.log('🎯 Target: mfs_leads table with research data');
    this.running = true;

    try {
      await this.processOutreach();

      // Run every 15 minutes
      setInterval(async () => {
        if (this.running) {
          await this.processOutreach();
        }
      }, 15 * 60 * 1000);

    } catch (error) {
      console.error('❌ Outreach Agent error:', error);
      process.exit(1);
    }
  }

  async processOutreach() {
    console.log('\n📨 Processing MFS outreach campaigns...');

    try {
      // Check if auto-outreach is enabled
      const { data: settings } = await this.supabase
        .from('system_settings')
        .select('setting_value')
        .eq('setting_key', 'auto_outreach_enabled')
        .single();

      const autoSendEnabled = settings?.setting_value === 'true';
      console.log(`   Auto-send: ${autoSendEnabled ? 'ENABLED' : 'DISABLED (drafts only)'}`);

      // Get leads from mfs_leads that:
      // 1. Have been researched (lead_research is not null)
      // 2. Have an email address
      // 3. Haven't been emailed yet (outreach_status is null or 'pending')
      const { data: leads, error } = await this.supabase
        .from('mfs_leads')
        .select('*')
        .not('lead_research', 'is', null)
        .not('contact_email', 'is', null)
        .or('outreach_status.is.null,outreach_status.eq.pending')
        .order('fit_score', { ascending: false })
        .limit(5); // Process 5 at a time to be safe

      if (error) {
        console.error('Database error:', error);
        return;
      }

      if (!leads || leads.length === 0) {
        console.log('📭 No leads ready for outreach');
        return;
      }

      console.log(`📬 Found ${leads.length} leads ready for outreach`);

      for (const lead of leads) {
        try {
          // Double-check we haven't already emailed this person
          const alreadySent = await this.checkAlreadySent(lead.contact_email);
          if (alreadySent) {
            console.log(`   ⏭️  Already emailed ${lead.contact_email} - skipping`);
            await this.markLeadStatus(lead.id, 'already_sent');
            this.emailsSkipped++;
            continue;
          }

          console.log(`\n📧 Processing: ${lead.company_name} (${lead.contact_name})`);

          // Generate personalized email using smart writer (analyzes research data)
          const email = this.emailWriter.writeEmail(lead);

          // Validate email quality
          const validation = this.emailWriter.validateEmail(email);
          if (!validation.valid) {
            console.log(`   ⚠️  Email quality issues: ${validation.issues.join(', ')}`);
            if (validation.quality === 'poor') {
              console.log(`   ❌ Skipping - email quality too poor`);
              await this.markLeadStatus(lead.id, 'email_quality_failed');
              continue;
            }
          }

          console.log(`   📝 Email angle: ${email.analysis?.angle}, confidence: ${email.analysis?.confidence}`);

          // Send email (if auto-send enabled)
          let sent = false;
          if (autoSendEnabled && process.env.RESEND_API_KEY) {
            console.log(`   📤 Sending to ${lead.contact_email}...`);
            try {
              await this.sendEmail(lead, email);
              sent = true;
              this.emailsSent++;
              console.log(`   ✅ Email sent successfully`);
            } catch (sendErr) {
              console.error(`   ❌ Send failed: ${sendErr.message}`);
              await this.markLeadStatus(lead.id, 'send_failed');
              continue;
            }
          } else {
            console.log(`   📝 Draft created (auto-send disabled)`);
          }

          // Store in outreach_campaigns
          await this.createCampaign(lead, email, sent);

          // Update lead status
          await this.markLeadStatus(lead.id, sent ? 'sent' : 'draft');

          // Rate limiting - 5 seconds between sends
          await new Promise(resolve => setTimeout(resolve, 5000));

        } catch (error) {
          console.error(`   ❌ Error processing ${lead.company_name}:`, error.message);
          await this.markLeadStatus(lead.id, 'error');
        }
      }

      console.log(`\n✅ Outreach batch complete: ${this.emailsSent} sent, ${this.emailsSkipped} skipped`);

    } catch (error) {
      console.error('Error processing outreach:', error);
    }
  }

  /**
   * Check if we've already sent an email to this address
   */
  async checkAlreadySent(email) {
    if (!email) return false;

    const { data, error } = await this.supabase
      .from('outreach_campaigns')
      .select('id')
      .eq('recipient_email', email)
      .eq('status', 'sent')
      .limit(1);

    if (error) {
      console.error('Error checking sent status:', error);
      return false;
    }

    return data && data.length > 0;
  }

  /**
   * Generate personalized email for MFS - using research data
   */
  generateMFSEmail(lead) {
    const company = lead.company_name;
    const research = lead.lead_research || {};

    // Get first name
    let firstName = '';
    if (lead.contact_name) {
      firstName = lead.contact_name.split(' ')[0];
    }

    // Extract research data
    const background = research.company_background || '';
    const painPoints = research.pain_points || '';
    const hooks = research.personalization_hooks || '';

    // Find years in business
    const yearsMatch = background.match(/(\d+)\+?\s*years?/i) || background.match(/founded\s*(?:in\s*)?(\d{4})/i);
    const years = yearsMatch ? (yearsMatch[1].length === 4 ? (2025 - parseInt(yearsMatch[1])) : yearsMatch[1]) : null;

    // Identify specific pain point from research
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

    // Find personalization hook
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

    // Build subject line
    const subject = firstName
      ? `${firstName} - a question about what's next`
      : `${company} - growth without the chaos`;

    // Build personalized email body
    let body = firstName ? `Hi ${firstName},\n\n` : `Hi,\n\n`;

    // Opening - reference something specific
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

  async sendEmail(lead, email) {
    const { data, error } = await this.resend.emails.send({
      from: `Maggie Forbes <${this.fromEmail}>`,
      to: lead.contact_email,
      subject: email.subject,
      text: email.body,
      html: email.body.replace(/\n/g, '<br>')
    });

    if (error) {
      throw new Error(`Resend error: ${error.message}`);
    }

    return data;
  }

  async createCampaign(lead, email, sent) {
    const campaignData = {
      opportunity_id: lead.id,
      company_name: lead.company_name,
      contact_name: lead.contact_name,
      recipient_email: lead.contact_email,
      subject: email.subject,
      email_content: email.body,
      status: sent ? 'sent' : 'draft',
      fit_score: lead.fit_score,
      lead_research: lead.lead_research,
      // Smart writer analysis - how the email was personalized
      email_analysis: email.analysis || null,
      sent_at: sent ? new Date().toISOString() : null,
      created_at: new Date().toISOString()
    };

    const { error } = await this.supabase
      .from('outreach_campaigns')
      .insert(campaignData);

    if (error) {
      console.error('Error creating campaign:', error);
    }
  }

  async markLeadStatus(leadId, status) {
    const { error } = await this.supabase
      .from('mfs_leads')
      .update({
        outreach_status: status,
        outreach_updated_at: new Date().toISOString()
      })
      .eq('id', leadId);

    if (error) {
      console.error('Error updating lead status:', error);
    }
  }

  stop() {
    console.log('🛑 MFS Auto Outreach Agent stopping...');
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
