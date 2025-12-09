/**
 * Auto-Booking Service
 * Automatically generates calendar links and books calls with interested leads
 */

const axios = require('axios');
const { createClient } = require('@supabase/supabase-js');

class AutoBooking {
  constructor() {
    this.calendlyApiKey = process.env.CALENDLY_API_KEY;
    this.calendlyApiBase = 'https://api.calendly.com';
    this.calendlyEventType = process.env.CALENDLY_EVENT_TYPE_URI; // e.g., your meeting type URL

    this.supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_KEY
    );
  }

  /**
   * Generate booking link for a specific lead
   */
  async generateBookingLink(campaignId, leadData) {
    console.log(`📅 Generating booking link for campaign ${campaignId}`);

    try {
      // Create personalized booking link with lead info pre-filled
      const bookingParams = new URLSearchParams({
        name: leadData.contact_name || leadData.company_name || '',
        email: leadData.contact_email || '',
        // Custom questions can be pre-filled
        a1: leadData.company_name || '', // Company name
        a2: leadData.business_area || '', // Business area
      });

      // Calendly scheduling link format
      const schedulingLink = `${this.calendlyEventType}?${bookingParams.toString()}`;

      // Store booking link in database
      await this.supabase
        .from('outreach_campaigns')
        .update({
          booking_link: schedulingLink,
          booking_link_created_at: new Date().toISOString()
        })
        .eq('id', campaignId);

      console.log(`✅ Booking link generated: ${schedulingLink}`);

      return {
        link: schedulingLink,
        createdAt: new Date().toISOString()
      };

    } catch (error) {
      console.error('Error generating booking link:', error);
      throw error;
    }
  }

  /**
   * Send booking invitation email
   */
  async sendBookingInvitation(campaignId, customMessage = null) {
    console.log(`📧 Sending booking invitation for campaign ${campaignId}`);

    try {
      // Get campaign and lead data
      const { data: campaign, error } = await this.supabase
        .from('outreach_campaigns')
        .select(`
          *,
          scored_opportunities(*)
        `)
        .eq('id', campaignId)
        .single();

      if (error) throw error;

      const lead = campaign.scored_opportunities;
      const research = campaign.lead_research || {};

      // Generate booking link if not exists
      let bookingLink = campaign.booking_link;
      if (!bookingLink) {
        const linkData = await this.generateBookingLink(campaignId, lead);
        bookingLink = linkData.link;
      }

      // Craft personalized booking email
      const emailContent = customMessage || this.craftBookingEmail(lead, research, bookingLink);

      // Store the booking invitation
      await this.supabase
        .from('email_conversations')
        .insert({
          campaign_id: campaignId,
          direction: 'outgoing',
          message_content: emailContent,
          message_type: 'booking_invitation',
          sent_at: new Date().toISOString()
        });

      // Update campaign status
      await this.supabase
        .from('outreach_campaigns')
        .update({
          status: 'booking_sent',
          booking_invitation_sent_at: new Date().toISOString()
        })
        .eq('id', campaignId);

      console.log(`✅ Booking invitation sent for campaign ${campaignId}`);

      return {
        sent: true,
        bookingLink: bookingLink,
        emailContent: emailContent
      };

    } catch (error) {
      console.error('Error sending booking invitation:', error);
      throw error;
    }
  }

  /**
   * Craft personalized booking email
   */
  craftBookingEmail(lead, research, bookingLink) {
    const companyName = lead.company_name || 'there';
    const painPoint = research.painPointAnalysis?.findings || 'growing your business';

    return `Hi${lead.contact_name ? ' ' + lead.contact_name : ''},

I'd love to chat about how we can help ${companyName} with ${painPoint}.

I've set aside some time for us to connect. You can pick a time that works best for you here:

${bookingLink}

The call will be brief (15-20 minutes) and focused on understanding your specific situation and seeing if there's a fit.

Looking forward to speaking with you!

Best,
Maggie
Unbound.Team

P.S. If none of these times work, just reply and let me know what works better for your schedule.`;
  }

  /**
   * Check for new scheduled meetings from Calendly
   */
  async syncScheduledMeetings() {
    console.log('📊 Syncing scheduled meetings from Calendly...');

    try {
      // Get recent scheduled events from Calendly
      const response = await axios.get(`${this.calendlyApiBase}/scheduled_events`, {
        headers: {
          'Authorization': `Bearer ${this.calendlyApiKey}`,
          'Content-Type': 'application/json'
        },
        params: {
          organization: process.env.CALENDLY_ORGANIZATION_URI,
          status: 'active',
          count: 100
        }
      });

      const events = response.data.collection || [];
      let synced = 0;

      for (const event of events) {
        // Match event to campaign by invitee email
        const invitee = await this.getInviteeDetails(event.uri);

        if (invitee && invitee.email) {
          await this.recordScheduledMeeting(event, invitee);
          synced++;
        }
      }

      console.log(`✅ Synced ${synced} scheduled meetings`);
      return synced;

    } catch (error) {
      console.error('Error syncing meetings:', error.response?.data || error.message);
      return 0;
    }
  }

  /**
   * Get invitee details from Calendly
   */
  async getInviteeDetails(eventUri) {
    try {
      const response = await axios.get(`${this.calendlyApiBase}/scheduled_events/${eventUri}/invitees`, {
        headers: {
          'Authorization': `Bearer ${this.calendlyApiKey}`,
          'Content-Type': 'application/json'
        }
      });

      const invitees = response.data.collection || [];
      return invitees[0] || null;

    } catch (error) {
      console.error('Error fetching invitee:', error);
      return null;
    }
  }

  /**
   * Record scheduled meeting in database
   */
  async recordScheduledMeeting(event, invitee) {
    try {
      // Find campaign by email
      const { data: campaign, error } = await this.supabase
        .from('outreach_campaigns')
        .select('*')
        .eq('recipient_email', invitee.email)
        .in('status', ['booking_sent', 'interested', 'booking'])
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error || !campaign) {
        console.log(`No matching campaign found for ${invitee.email}`);
        return;
      }

      // Update campaign with meeting details
      await this.supabase
        .from('outreach_campaigns')
        .update({
          status: 'meeting_scheduled',
          meeting_scheduled_at: event.start_time,
          meeting_uri: event.uri,
          calendly_event_id: event.uri,
          converted: true,
          conversion_at: new Date().toISOString()
        })
        .eq('id', campaign.id);

      // Log the conversion
      console.log(`🎯 Meeting booked! Campaign ${campaign.id} - ${invitee.email} - ${event.start_time}`);

      return campaign.id;

    } catch (error) {
      console.error('Error recording meeting:', error);
    }
  }

  /**
   * Get booking statistics
   */
  async getBookingStats(clientId = 'maggie-forbes') {
    const { data: campaigns } = await this.supabase
      .from('outreach_campaigns')
      .select('*')
      .eq('client_id', clientId);

    const stats = {
      totalBookingsSent: campaigns?.filter(c => c.booking_invitation_sent_at).length || 0,
      totalMeetingsScheduled: campaigns?.filter(c => c.meeting_scheduled_at).length || 0,
      upcomingMeetings: campaigns?.filter(c =>
        c.meeting_scheduled_at && new Date(c.meeting_scheduled_at) > new Date()
      ).length || 0,
      completedMeetings: campaigns?.filter(c =>
        c.meeting_scheduled_at && new Date(c.meeting_scheduled_at) < new Date()
      ).length || 0,
      conversionRate: 0
    };

    if (stats.totalBookingsSent > 0) {
      stats.conversionRate = ((stats.totalMeetingsScheduled / stats.totalBookingsSent) * 100).toFixed(1);
    }

    return stats;
  }

  /**
   * Auto-send booking invitations to all interested leads
   */
  async processBookingQueue() {
    console.log('📬 Processing booking queue...');

    try {
      // Get campaigns ready for booking
      const { data: campaigns, error } = await this.supabase
        .from('outreach_campaigns')
        .select('*')
        .eq('status', 'booking')
        .is('booking_invitation_sent_at', null)
        .limit(50);

      if (error) throw error;

      let sent = 0;
      for (const campaign of campaigns || []) {
        try {
          await this.sendBookingInvitation(campaign.id);
          sent++;

          // Rate limiting: wait 5 seconds between sends
          await new Promise(resolve => setTimeout(resolve, 5000));

        } catch (error) {
          console.error(`Error sending booking for campaign ${campaign.id}:`, error);
        }
      }

      console.log(`✅ Sent ${sent} booking invitations`);
      return sent;

    } catch (error) {
      console.error('Error processing booking queue:', error);
      throw error;
    }
  }

  /**
   * Cancel/reschedule meeting
   */
  async cancelMeeting(campaignId, reason = 'Lead requested cancellation') {
    try {
      const { data: campaign } = await this.supabase
        .from('outreach_campaigns')
        .select('calendly_event_id')
        .eq('id', campaignId)
        .single();

      if (campaign?.calendly_event_id) {
        // Cancel in Calendly
        await axios.post(
          `${this.calendlyApiBase}/scheduled_events/${campaign.calendly_event_id}/cancellation`,
          { reason: reason },
          {
            headers: {
              'Authorization': `Bearer ${this.calendlyApiKey}`,
              'Content-Type': 'application/json'
            }
          }
        );
      }

      // Update database
      await this.supabase
        .from('outreach_campaigns')
        .update({
          status: 'meeting_cancelled',
          meeting_cancelled_at: new Date().toISOString(),
          cancellation_reason: reason
        })
        .eq('id', campaignId);

      console.log(`🚫 Meeting cancelled for campaign ${campaignId}`);
      return true;

    } catch (error) {
      console.error('Error cancelling meeting:', error);
      throw error;
    }
  }
}

module.exports = AutoBooking;
