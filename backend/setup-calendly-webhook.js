#!/usr/bin/env node
// Calendly Webhook Auto-Setup Script
// Automatically creates webhook subscription and retrieves signing key

const https = require('https');

// Configuration
const CALENDLY_PAT = process.env.CALENDLY_PAT || 'eyJraWQiOiIxY2UxZTEzNjE3ZGNmNzY2YjNjZWJjY2Y4ZGM1YmFmYThhNjVlNjg0MDIzZjdjMzJiZTgzNDliMjM4MDEzNWI0IiwidHlwIjoiUEFUIiwiYWxnIjoiRVMyNTYifQ.eyJpc3MiOiJodHRwczovL2F1dGguY2FsZW5kbHkuY29tIiwiaWF0IjoxNzY0OTY0NjUwLCJqdGkiOiI0YjE5NmFkMi03YTE2LTQ2NmQtODk1Yi1kYzAwMTQ2MDhmMzUiLCJ1c2VyX3V1aWQiOiJkNDk1YjhhOS01ZTMwLTQzMmItOTE0ZC1hMGNlYjM4MWQyOGIifQ.Jzjvo90cjlbdz9cI9KH7DQSEbgW-7RffFgtPv0R2Cd1wTn34JZi00khaFru1QfBQf8oz2_q8yrCRyzPb_MVPuQ';
const WEBHOOK_URL = 'https://unbound.team/api/calendly/webhook';

console.log('🚀 Calendly Webhook Auto-Setup\n');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

// Step 1: Get current user info
async function getCurrentUser() {
  return new Promise((resolve, reject) => {
    console.log('📡 Step 1: Getting your Calendly user info...');

    const options = {
      hostname: 'api.calendly.com',
      path: '/users/me',
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${CALENDLY_PAT}`,
        'Content-Type': 'application/json'
      }
    };

    const req = https.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        if (res.statusCode === 200) {
          const user = JSON.parse(data);
          console.log(`   ✅ Connected as: ${user.resource.name}`);
          console.log(`   📧 Email: ${user.resource.email}`);
          console.log(`   🔗 User URI: ${user.resource.uri}\n`);
          resolve(user.resource);
        } else {
          console.error(`   ❌ Failed: ${res.statusCode}`);
          console.error(`   ${data}\n`);
          reject(new Error(`API returned ${res.statusCode}`));
        }
      });
    });

    req.on('error', (error) => {
      console.error('   ❌ Request failed:', error.message);
      reject(error);
    });

    req.end();
  });
}

// Step 2: List existing webhooks
async function listWebhooks(organizationUri) {
  return new Promise((resolve, reject) => {
    console.log('📋 Step 2: Checking existing webhooks...');

    const options = {
      hostname: 'api.calendly.com',
      path: `/webhook_subscriptions?organization=${encodeURIComponent(organizationUri)}&scope=organization`,
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${CALENDLY_PAT}`,
        'Content-Type': 'application/json'
      }
    };

    const req = https.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        if (res.statusCode === 200) {
          const response = JSON.parse(data);
          const webhooks = response.collection || [];

          if (webhooks.length === 0) {
            console.log('   ℹ️  No existing webhooks found\n');
          } else {
            console.log(`   ℹ️  Found ${webhooks.length} existing webhook(s):`);
            webhooks.forEach((wh, i) => {
              console.log(`      ${i + 1}. ${wh.callback_url}`);
              console.log(`         Events: ${wh.events.join(', ')}`);
              console.log(`         State: ${wh.state}`);
            });
            console.log('');
          }
          resolve(webhooks);
        } else {
          console.error(`   ❌ Failed: ${res.statusCode}`);
          console.error(`   ${data}\n`);
          reject(new Error(`API returned ${res.statusCode}`));
        }
      });
    });

    req.on('error', (error) => {
      console.error('   ❌ Request failed:', error.message);
      reject(error);
    });

    req.end();
  });
}

// Step 3: Create webhook subscription
async function createWebhook(organizationUri, userUri) {
  return new Promise((resolve, reject) => {
    console.log('🔧 Step 3: Creating new webhook subscription...');
    console.log(`   📍 URL: ${WEBHOOK_URL}`);
    console.log('   📨 Events: invitee.created, invitee.canceled\n');

    const payload = JSON.stringify({
      url: WEBHOOK_URL,
      events: [
        'invitee.created',
        'invitee.canceled'
      ],
      organization: organizationUri,
      user: userUri,
      scope: 'organization'
    });

    const options = {
      hostname: 'api.calendly.com',
      path: '/webhook_subscriptions',
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${CALENDLY_PAT}`,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload)
      }
    };

    const req = https.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        if (res.statusCode === 201) {
          const webhook = JSON.parse(data);
          console.log('   ✅ Webhook created successfully!\n');
          resolve(webhook.resource);
        } else {
          console.error(`   ❌ Failed: ${res.statusCode}`);
          console.error(`   ${data}\n`);
          reject(new Error(`API returned ${res.statusCode}`));
        }
      });
    });

    req.on('error', (error) => {
      console.error('   ❌ Request failed:', error.message);
      reject(error);
    });

    req.write(payload);
    req.end();
  });
}

// Main execution
async function main() {
  try {
    // Get user info
    const user = await getCurrentUser();
    const organizationUri = user.current_organization;

    // Check existing webhooks
    const existingWebhooks = await listWebhooks(organizationUri);

    // Check if webhook already exists for this URL
    const exists = existingWebhooks.find(wh => wh.callback_url === WEBHOOK_URL);
    if (exists) {
      console.log('⚠️  Webhook already exists for this URL!');
      console.log('   You can view it in Calendly settings.\n');
      console.log('🔑 To get the signing key:');
      console.log('   1. Go to: https://calendly.com/integrations/api_webhooks');
      console.log('   2. Click on your webhook');
      console.log('   3. Copy the signing key\n');
      return;
    }

    // Create new webhook
    const webhook = await createWebhook(organizationUri, user.uri);

    // Display results
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✅ SETUP COMPLETE!\n');
    console.log('📋 Webhook Details:');
    console.log(`   • URI: ${webhook.uri}`);
    console.log(`   • URL: ${webhook.callback_url}`);
    console.log(`   • State: ${webhook.state}`);
    console.log(`   • Events: ${webhook.events.join(', ')}\n`);

    console.log('🔑 IMPORTANT: Get Your Signing Key\n');
    console.log('The webhook is created, but you need the signing key for security.');
    console.log('Calendly doesn\'t return it via API - you must get it from the UI:\n');
    console.log('1. Go to: https://calendly.com/integrations/api_webhooks');
    console.log('2. Find your webhook: ' + WEBHOOK_URL);
    console.log('3. Click on it to view details');
    console.log('4. Copy the "Signing Key"\n');
    console.log('5. Add to your .env file:');
    console.log('   CALENDLY_WEBHOOK_SECRET=paste-signing-key-here\n');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    console.log('🧪 Test your webhook:');
    console.log('   curl -X POST https://unbound.team/api/calendly/test \\');
    console.log('     -H "Content-Type: application/json" \\');
    console.log('     -d \'{"name":"Test","email":"test@example.com"}\'\n');

    console.log('⚠️  SECURITY REMINDER:');
    console.log('   After setup, revoke this PAT in Calendly settings!');
    console.log('   Generate a new one for future use.\n');

  } catch (error) {
    console.error('❌ Setup failed:', error.message);
    console.error('\nTroubleshooting:');
    console.error('• Check your PAT is valid');
    console.error('• Ensure you have admin access to your Calendly organization');
    console.error('• Try creating the webhook manually at: https://calendly.com/integrations/api_webhooks\n');
    process.exit(1);
  }
}

// Run the script
main();
