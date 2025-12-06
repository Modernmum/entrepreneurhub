// Calendly Webhook Handler
// Receives booking events from Calendly and creates appointments in database
//
// Supported Events:
// - invitee.created (new booking)
// - invitee.canceled (booking cancelled)

const { createClient } = require('@supabase/supabase-js');
const crypto = require('crypto');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

class CalendlyWebhookHandler {
  constructor() {
    this.webhookSecret = process.env.CALENDLY_WEBHOOK_SECRET;
  }

  // Verify webhook signature from Calendly
  verifySignature(payload, signature) {
    if (!this.webhookSecret) {
      console.warn('⚠️  CALENDLY_WEBHOOK_SECRET not set - skipping signature verification');
      return true; // Allow in development
    }

    const hmac = crypto.createHmac('sha256', this.webhookSecret);
    const digest = hmac.update(payload).digest('base64');
    return digest === signature;
  }

  // Main webhook handler
  async handleWebhook(req, res) {
    try {
      console.log('📅 [Calendly Webhook] Received event');

      // Verify signature
      const signature = req.headers['calendly-webhook-signature'];
      const rawBody = JSON.stringify(req.body);

      if (!this.verifySignature(rawBody, signature)) {
        console.error('❌ Invalid webhook signature');
        return res.status(401).json({ error: 'Invalid signature' });
      }

      const event = req.body;
      const eventType = event.event;

      console.log(`   Event type: ${eventType}`);

      // Handle different event types
      switch (eventType) {
        case 'invitee.created':
          await this.handleInviteeCreated(event);
          break;

        case 'invitee.canceled':
          await this.handleInviteeCanceled(event);
          break;

        default:
          console.log(`   ℹ️  Unhandled event type: ${eventType}`);
      }

      res.status(200).json({ received: true });
    } catch (error) {
      console.error('❌ [Calendly Webhook] Error:', error.message);
      res.status(500).json({ error: 'Webhook processing failed' });
    }
  }

  // Handle new booking
  async handleInviteeCreated(event) {
    try {
      const payload = event.payload;
      const invitee = payload.invitee;
      const eventDetails = payload.event;

      console.log('   📝 New booking created');
      console.log(`      Name: ${invitee.name}`);
      console.log(`      Email: ${invitee.email}`);
      console.log(`      Time: ${eventDetails.start_time}`);

      // Extract event duration (in minutes)
      const startTime = new Date(eventDetails.start_time);
      const endTime = new Date(eventDetails.end_time);
      const durationMinutes = Math.round((endTime - startTime) / (1000 * 60));

      // Get invitee questions/answers for additional context
      let companyName = null;
      let notes = [];

      if (invitee.questions_and_answers) {
        for (const qa of invitee.questions_and_answers) {
          // Look for company name in questions
          if (qa.question.toLowerCase().includes('company')) {
            companyName = qa.answer;
          }
          notes.push(`${qa.question}: ${qa.answer}`);
        }
      }

      // Create appointment in database
      const { data, error } = await supabase
        .from('discovery_calls')
        .insert({
          contact_name: invitee.name,
          contact_email: invitee.email,
          contact_phone: invitee.phone_number || null,
          company_name: companyName,
          scheduled_time: eventDetails.start_time,
          duration_minutes: durationMinutes,
          meeting_url: eventDetails.location?.join_url || eventDetails.location,
          notes: notes.length > 0 ? notes.join('\n') : null,
          status: 'scheduled'
        })
        .select()
        .single();

      if (error) {
        console.error('   ❌ Failed to create appointment:', error.message);
        throw error;
      }

      console.log(`   ✅ Appointment created in database (ID: ${data.id})`);
      console.log(`   📅 Scheduled for: ${new Date(data.scheduled_time).toLocaleString()}`);

      // The appointment-monitor will now automatically:
      // - Send 24h reminder
      // - Send 1h reminder
      // - Send follow-up after call
      // - Track if missed

      return data;
    } catch (error) {
      console.error('Error handling invitee.created:', error);
      throw error;
    }
  }

  // Handle booking cancellation
  async handleInviteeCanceled(event) {
    try {
      const payload = event.payload;
      const invitee = payload.invitee;
      const eventDetails = payload.event;

      console.log('   ❌ Booking canceled');
      console.log(`      Name: ${invitee.name}`);
      console.log(`      Email: ${invitee.email}`);
      console.log(`      Original time: ${eventDetails.start_time}`);

      // Find and cancel the appointment
      const { data, error } = await supabase
        .from('discovery_calls')
        .update({
          status: 'cancelled',
          notes: `Cancelled via Calendly on ${new Date().toISOString()}`
        })
        .eq('contact_email', invitee.email)
        .eq('scheduled_time', eventDetails.start_time)
        .select()
        .single();

      if (error) {
        console.error('   ❌ Failed to cancel appointment:', error.message);
        // Don't throw - appointment might not exist yet
        return;
      }

      console.log(`   ✅ Appointment cancelled in database (ID: ${data.id})`);

      return data;
    } catch (error) {
      console.error('Error handling invitee.canceled:', error);
      throw error;
    }
  }

  // Test endpoint to simulate Calendly webhook
  async testWebhook(req, res) {
    try {
      console.log('🧪 [Calendly Test] Simulating webhook event');

      const mockEvent = {
        event: 'invitee.created',
        payload: {
          invitee: {
            name: req.body.name || 'Test User',
            email: req.body.email || 'test@example.com',
            phone_number: req.body.phone || '+1234567890',
            questions_and_answers: [
              {
                question: 'Company Name',
                answer: req.body.company || 'Test Company'
              },
              {
                question: 'What are you looking to achieve?',
                answer: req.body.goals || 'Testing the integration'
              }
            ]
          },
          event: {
            start_time: req.body.start_time || new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
            end_time: req.body.end_time || new Date(Date.now() + 24 * 60 * 60 * 1000 + 30 * 60 * 1000).toISOString(),
            location: {
              join_url: 'https://zoom.us/j/123456789'
            }
          }
        }
      };

      await this.handleInviteeCreated(mockEvent);

      res.json({
        success: true,
        message: 'Test appointment created',
        note: 'Check your discovery_calls table in Supabase'
      });
    } catch (error) {
      console.error('❌ Test webhook failed:', error);
      res.status(500).json({ error: error.message });
    }
  }
}

module.exports = new CalendlyWebhookHandler();
