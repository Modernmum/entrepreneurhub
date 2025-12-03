# Maggie Forbes Strategies - Unbound.team Integration Guide
## AI Tools Integration for Premium & Enterprise Clients

**Last Updated:** November 29, 2025
**Version:** 1.0.0

---

## Overview

This guide explains how to integrate Unbound.team AI tools into **Maggie Forbes Strategies** as a premium add-on for Tier 2 (Premium) and Tier 3 (Enterprise) clients.

### Business Model

- **Maggie Forbes Strategies** = Strategic consulting platform
- **Unbound.team AI Tools** = Premium add-on (not core offering)
- **Access:** Only available to Tier 2 (Premium) and Tier 3 (Enterprise) clients

---

## Tier Structure & Pricing

| Tier | Monthly Price | Unbound Access | How It Works |
|------|--------------|----------------|--------------|
| **Tier 1: Strategy** | $2,500 | ❌ None | "Want AI tools? Upgrade to Premium" |
| **Tier 2: Premium** | $5,000 | ✅ **Full Unlimited Access** | "Included: Unlimited AI Tools" |
| **Tier 3: Enterprise** | $10,000+ | ✅ **Managed Service** | "We run the tools FOR you" |

### What "Unlimited" Means

Premium and Enterprise clients get:
- **Unlimited lead generation** (no monthly caps)
- **Unlimited content creation** (blog posts, social media, emails)
- **Unlimited market research reports**
- **Unlimited landing pages**
- **Unlimited email campaigns**

This is marked in the system with `plan: 'premium'` which bypasses all usage limits.

---

## Integration Points

### 1. Maggie Forbes Website (maggieforbes.com)

#### Update Pricing Page

Show AI tools as a premium benefit:

```html
<!-- Tier 1: Strategy Only -->
<div class="pricing-tier">
  <h3>Strategy</h3>
  <p class="price">$2,500/month</p>
  <ul>
    <li>✓ Monthly strategy session with Kristi</li>
    <li>✓ Custom business roadmap</li>
    <li>✓ Email support</li>
    <li>❌ AI Tools (available in Premium tier)</li>
  </ul>
  <a href="/book" class="btn">Book Strategy Call</a>
</div>

<!-- Tier 2: Premium (WITH Unbound Tools) -->
<div class="pricing-tier featured">
  <span class="badge">Most Popular</span>
  <h3>Premium</h3>
  <p class="price">$5,000/month</p>
  <ul>
    <li>✓ Everything in Strategy tier</li>
    <li>✓ Bi-weekly strategy sessions</li>
    <li>✓ Direct Slack access to Kristi</li>
    <li>✓ Priority support</li>
    <li>✅ <strong>UNLIMITED AI Tools Included:</strong></li>
    <li class="sub-item">→ Lead Generation (unlimited)</li>
    <li class="sub-item">→ Content Creation (unlimited)</li>
    <li class="sub-item">→ Market Research (unlimited)</li>
    <li class="sub-item">→ Landing Page Builder (unlimited)</li>
    <li class="sub-item">→ Email Marketing (unlimited)</li>
  </ul>
  <a href="/book" class="btn btn-primary">Get Started</a>
</div>

<!-- Tier 3: Enterprise (Managed Unbound) -->
<div class="pricing-tier">
  <h3>Enterprise</h3>
  <p class="price">$10,000+/month</p>
  <ul>
    <li>✓ Everything in Premium tier</li>
    <li>✓ White-glove service</li>
    <li>✓ Dedicated account manager</li>
    <li>✓ Weekly strategy sessions</li>
    <li>✅ <strong>Done-For-You AI Services:</strong></li>
    <li class="sub-item">→ We generate leads for you</li>
    <li class="sub-item">→ We create content for you</li>
    <li class="sub-item">→ We build landing pages for you</li>
    <li class="sub-item">→ Full campaign management</li>
  </ul>
  <a href="/contact" class="btn">Contact Sales</a>
</div>
```

---

### 2. Client Onboarding (Backend Integration)

When a new Premium or Enterprise client signs up, automatically provision them in Unbound.team.

#### Backend Code: Provision Client

```javascript
// backend/routes/maggieforbes/onboarding.js

const UNBOUND_API_KEY = process.env.UNBOUND_API_KEY;
const UNBOUND_BASE_URL = 'https://api.unbound.team';
const TENANT_SLUG = 'kristi-empire';

async function provisionPremiumClient(req, res) {
  const { email, name, tier, stripeCustomerId } = req.body;

  // Only provision if Tier 2 (Premium) or Tier 3 (Enterprise)
  if (!['premium', 'enterprise'].includes(tier)) {
    return res.status(400).json({
      error: 'Unbound tools only available for Premium and Enterprise tiers'
    });
  }

  try {
    // Step 1: Create client in Maggie Forbes database
    const client = await db.maggieforbes.clients.create({
      email,
      name,
      tier,
      stripe_customer_id: stripeCustomerId,
      status: 'active',
      created_at: new Date()
    });

    // Step 2: Provision in Unbound.team multi-tenant system
    const unboundResponse = await fetch(
      `${UNBOUND_BASE_URL}/api/partner/${TENANT_SLUG}/provision-client`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${UNBOUND_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          userEmail: email,
          userName: name,
          plan: 'premium', // Always 'premium' for unlimited access
          source: 'maggie-forbes',
          brand: 'maggie-forbes',
          consultingTier: tier
        })
      }
    );

    if (!unboundResponse.ok) {
      throw new Error('Failed to provision in Unbound.team');
    }

    const { userId: unboundUserId } = await unboundResponse.json();

    // Step 3: Link Unbound user ID to Maggie Forbes client
    await db.maggieforbes.clients.update(client.id, {
      unbound_user_id: unboundUserId
    });

    // Step 4: Send welcome email with tool access
    await sendWelcomeEmail({
      to: email,
      name,
      tier,
      slackInvite: generateSlackInvite(client.id),
      toolsAccess: true
    });

    res.json({
      success: true,
      clientId: client.id,
      unboundUserId,
      message: 'Client provisioned successfully with unlimited AI tools access'
    });

  } catch (error) {
    console.error('Provisioning error:', error);
    res.status(500).json({ error: error.message });
  }
}

module.exports = { provisionPremiumClient };
```

---

### 3. Welcome Email Template

Send this email to new Premium/Enterprise clients:

```
Subject: Welcome to Maggie Forbes Strategies Premium! 🎉

Hi {{name}},

I'm thrilled to have you as a {{tier}} client!

Here's everything you need to get started:

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📞 YOUR STRATEGY SESSIONS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Book your first session:
→ https://maggieforbes.com/book

{{#if tier == 'premium'}}
You get bi-weekly strategy sessions with me.
{{else}}
You get weekly strategy sessions with me.
{{/if}}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
💬 DIRECT SLACK ACCESS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Join your private Slack channel:
→ {{slackInvite}}

Message me anytime for quick questions or guidance.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🤖 YOUR AI TOOLS (UNLIMITED ACCESS!)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

As a {{tier}} client, you get UNLIMITED access to our
AI-powered growth tools:

Login Here: https://app.growthmangerpro.com
Email: {{email}}
Password: (check separate email)

What you can do RIGHT NOW:

✓ Generate UNLIMITED qualified leads for YOUR business
✓ Create unlimited blog posts, social media content, emails
✓ Research YOUR competitors and market opportunities
✓ Build unlimited landing pages for YOUR products
✓ Automate YOUR email campaigns

Your account is marked as "Maggie Forbes {{tier}}" - this means:
→ NO LIMITS on any tool
→ NO monthly caps
→ Use as much as you need

{{#if tier == 'enterprise'}}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
👔 WHITE-GLOVE SERVICE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

As an Enterprise client, you can also REQUEST that I run
the AI tools FOR you. Just tell me what you need:

→ "Generate 100 leads for [target audience]"
→ "Create a landing page for [product]"
→ "Write 5 blog posts about [topic]"

I'll handle everything and deliver the results to you.
{{/if}}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🎯 NEXT STEPS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. Book your first strategy call
2. Join Slack
3. Login to your AI tools
4. Complete onboarding questionnaire: {{onboardingUrl}}

Looking forward to our first session!

- Kristi
Maggie Forbes Strategies

P.S. The AI tools are INCLUDED in your {{tier}} membership.
Use them as much as you want - there are absolutely no limits
for Maggie Forbes clients. This is your competitive advantage!
```

---

### 4. Client Dashboard (Maggie Forbes Platform)

Add AI tools section to the client dashboard:

```javascript
// frontend/maggieforbes/Dashboard.jsx

import React from 'react';

function MaggieForbesDashboard({ client }) {
  const hasUnboundAccess = ['premium', 'enterprise'].includes(client.tier);

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <h1>Welcome back, {client.name}!</h1>
        <div className="tier-badge">
          <span className={`badge tier-${client.tier}`}>
            {client.tier.toUpperCase()} Client
          </span>
        </div>
      </header>

      {/* Strategy Sessions Section */}
      <section className="strategy-sessions card">
        <h2>📞 Your Strategy Sessions</h2>
        <div className="session-info">
          <p>Next session: {client.nextSession || 'Not scheduled'}</p>
          <a href="https://maggieforbes.com/book" className="btn btn-primary">
            Book Next Session
          </a>
        </div>
        <div className="session-history">
          <h3>Recent Sessions</h3>
          <SessionHistory sessions={client.sessions} />
        </div>
      </section>

      {/* Slack Access */}
      <section className="communication card">
        <h2>💬 Direct Access to Kristi</h2>
        <p>Have a quick question? Message me on Slack!</p>
        <a href={client.slackChannelUrl} className="btn" target="_blank">
          Open Slack Channel
        </a>
      </section>

      {/* AI Tools Section (Only for Premium/Enterprise) */}
      {hasUnboundAccess && (
        <section className="ai-tools card featured">
          <div className="section-header">
            <h2>🤖 Your AI Growth Tools</h2>
            <span className="badge unlimited">UNLIMITED ACCESS</span>
          </div>

          <p className="tools-intro">
            As a {client.tier} client, you have unlimited access to all AI tools.
            {client.tier === 'enterprise' && (
              <strong> Need help? Just ask and I'll run the tools for you!</strong>
            )}
          </p>

          <div className="tools-grid">
            <ToolCard
              icon="🎯"
              title="Lead Generation"
              description="Find unlimited qualified prospects for your business"
              usage="Unlimited"
              ctaText="Generate Leads"
              ctaUrl="https://app.growthmangerpro.com/leads"
            />

            <ToolCard
              icon="✍️"
              title="Content Creation"
              description="Generate unlimited blog posts, social media, emails"
              usage="Unlimited"
              ctaText="Create Content"
              ctaUrl="https://app.growthmangerpro.com/content"
            />

            <ToolCard
              icon="📊"
              title="Market Research"
              description="Analyze competitors and market opportunities"
              usage="Unlimited"
              ctaText="Do Research"
              ctaUrl="https://app.growthmangerpro.com/research"
            />

            <ToolCard
              icon="🚀"
              title="Landing Pages"
              description="Build unlimited high-converting sales pages"
              usage="Unlimited"
              ctaText="Build Page"
              ctaUrl="https://app.growthmangerpro.com/pages"
            />

            <ToolCard
              icon="📧"
              title="Email Marketing"
              description="Create unlimited automated email campaigns"
              usage="Unlimited"
              ctaText="Create Campaign"
              ctaUrl="https://app.growthmangerpro.com/email"
            />
          </div>

          <div className="tools-cta">
            <a
              href="https://app.growthmangerpro.com"
              target="_blank"
              className="btn btn-primary btn-lg"
            >
              Open AI Tools Dashboard →
            </a>
          </div>

          {client.tier === 'enterprise' && (
            <div className="enterprise-service">
              <h3>🎁 Enterprise Perk: Done-For-You Service</h3>
              <p>
                Don't want to run the tools yourself? Just message me on Slack
                with what you need, and I'll handle everything!
              </p>
              <a href={client.slackChannelUrl} className="btn">
                Request Done-For-You Service on Slack
              </a>
            </div>
          )}
        </section>
      )}

      {/* Upsell for Tier 1 Clients */}
      {!hasUnboundAccess && (
        <section className="upsell card">
          <div className="upsell-header">
            <h2>🚀 Want AI-Powered Growth Tools?</h2>
            <span className="badge">Upgrade to Premium</span>
          </div>

          <p className="upsell-intro">
            Upgrade to Premium and get UNLIMITED access to:
          </p>

          <div className="upsell-benefits">
            <div className="benefit">
              <span className="icon">🎯</span>
              <div>
                <h4>Lead Generation</h4>
                <p>Find unlimited qualified prospects automatically</p>
              </div>
            </div>
            <div className="benefit">
              <span className="icon">✍️</span>
              <div>
                <h4>Content Creation</h4>
                <p>Generate unlimited blog posts, social media, emails</p>
              </div>
            </div>
            <div className="benefit">
              <span className="icon">📊</span>
              <div>
                <h4>Market Research</h4>
                <p>Unlimited competitor analysis and market insights</p>
              </div>
            </div>
            <div className="benefit">
              <span className="icon">🚀</span>
              <div>
                <h4>Landing Page Builder</h4>
                <p>Create unlimited high-converting sales pages</p>
              </div>
            </div>
            <div className="benefit">
              <span className="icon">📧</span>
              <div>
                <h4>Email Marketing</h4>
                <p>Build unlimited automated email campaigns</p>
              </div>
            </div>
          </div>

          <div className="upsell-pricing">
            <p className="price">
              <strong>$5,000/month</strong>
              <span className="price-note">Includes everything in Strategy + Unlimited AI Tools</span>
            </p>
            <a href={client.slackChannelUrl} className="btn btn-primary btn-lg">
              Ask Kristi About Upgrading
            </a>
          </div>
        </section>
      )}

      {/* Resources & Support */}
      <section className="resources card">
        <h2>📚 Resources</h2>
        <ul>
          <li><a href="/roadmap">Your Custom Roadmap</a></li>
          <li><a href="/session-notes">Session Notes & Action Items</a></li>
          <li><a href="/resources">Strategy Resources</a></li>
          {hasUnboundAccess && (
            <li><a href="https://docs.unbound.team" target="_blank">
              AI Tools Documentation
            </a></li>
          )}
        </ul>
      </section>
    </div>
  );
}

// Tool Card Component
function ToolCard({ icon, title, description, usage, ctaText, ctaUrl }) {
  return (
    <div className="tool-card">
      <div className="tool-icon">{icon}</div>
      <h3>{title}</h3>
      <p className="description">{description}</p>
      <div className="usage">
        <span className="usage-label">Usage:</span>
        <span className="usage-value unlimited">{usage}</span>
      </div>
      <a
        href={ctaUrl}
        target="_blank"
        className="tool-cta"
      >
        {ctaText} →
      </a>
    </div>
  );
}

export default MaggieForbesDashboard;
```

---

### 5. Upgrade Flow (Tier 1 → Tier 2)

When a Tier 1 client wants to upgrade:

```javascript
// backend/routes/maggieforbes/upgrade.js

async function upgradeClientToPremium(req, res) {
  const { clientId } = req.params;

  try {
    // Step 1: Get client
    const client = await db.maggieforbes.clients.findById(clientId);

    if (client.tier !== 'strategy') {
      return res.status(400).json({
        error: 'Client is already Premium or Enterprise'
      });
    }

    // Step 2: Update Stripe subscription
    await stripe.subscriptions.update(client.stripe_subscription_id, {
      items: [{
        price: process.env.STRIPE_PREMIUM_PRICE_ID
      }]
    });

    // Step 3: Update client tier
    await db.maggieforbes.clients.update(clientId, {
      tier: 'premium',
      upgraded_at: new Date()
    });

    // Step 4: Provision in Unbound.team
    const unboundResponse = await fetch(
      `${UNBOUND_BASE_URL}/api/partner/${TENANT_SLUG}/provision-client`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${UNBOUND_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          userEmail: client.email,
          userName: client.name,
          plan: 'premium',
          source: 'maggie-forbes-upgrade',
          brand: 'maggie-forbes',
          consultingTier: 'premium'
        })
      }
    );

    const { userId: unboundUserId } = await unboundResponse.json();

    // Step 5: Link Unbound user
    await db.maggieforbes.clients.update(clientId, {
      unbound_user_id: unboundUserId
    });

    // Step 6: Send upgrade confirmation email
    await sendUpgradeEmail({
      to: client.email,
      name: client.name,
      toolsAccess: true
    });

    res.json({
      success: true,
      message: 'Client upgraded to Premium with unlimited AI tools access',
      unboundUserId
    });

  } catch (error) {
    console.error('Upgrade error:', error);
    res.status(500).json({ error: error.message });
  }
}

module.exports = { upgradeClientToPremium };
```

---

## API Integration Examples

### Generate Leads for Client

```javascript
// Example: Generate leads for a client

async function generateLeadsForClient(clientEmail, targetIndustry) {
  const client = await db.maggieforbes.clients.findByEmail(clientEmail);

  if (!['premium', 'enterprise'].includes(client.tier)) {
    throw new Error('Client must be Premium or Enterprise to use AI tools');
  }

  const response = await fetch(
    'https://api.unbound.team/api/solutions/lead-generation',
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${UNBOUND_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        userId: client.unbound_user_id,
        targetIndustry,
        location: 'global',
        criteria: {
          count: 100, // No limit for Premium clients
          minScore: 8
        }
      })
    }
  );

  const { jobId, statusUrl } = await response.json();

  return {
    jobId,
    statusUrl,
    message: 'Lead generation started'
  };
}
```

### Check Job Status

```javascript
async function checkJobStatus(jobId) {
  const response = await fetch(
    `https://api.unbound.team/api/solutions/lead-generation/status/${jobId}`,
    {
      headers: {
        'Authorization': `Bearer ${UNBOUND_API_KEY}`
      }
    }
  );

  return await response.json();
}
```

---

## Key Differences: Maggie Forbes vs Growth Manager Pro

| Aspect | Maggie Forbes | Growth Manager Pro |
|--------|---------------|-------------------|
| **Primary Value** | Strategic consulting | AI tools |
| **Unbound Position** | Premium add-on | Core product |
| **Access Model** | Tier-based (2 & 3 only) | Plan-based (all paying) |
| **Pricing** | $2,500-$10,000/mo | $0-$150/mo |
| **Usage Limits** | **Unlimited** for Premium+ | Plan-based limits |
| **Support** | White-glove, managed | Self-service |
| **Onboarding** | Strategy first → tools | Tools immediately |
| **UI Integration** | Link to GMP dashboard | Full product UI |

---

## Environment Variables

Add these to your `.env` file:

```bash
# Unbound.team API
UNBOUND_API_KEY=your_api_key_here
UNBOUND_BASE_URL=https://api.unbound.team
UNBOUND_TENANT_SLUG=kristi-empire

# Stripe (for billing)
STRIPE_SECRET_KEY=sk_live_xxx
STRIPE_PREMIUM_PRICE_ID=price_xxx
STRIPE_ENTERPRISE_PRICE_ID=price_xxx
```

---

## Implementation Checklist

### Backend Setup
- [ ] Add Unbound API credentials to environment variables
- [ ] Create client provisioning endpoint
- [ ] Create upgrade endpoint (Tier 1 → Tier 2)
- [ ] Add Unbound user ID field to client database
- [ ] Test client provisioning flow

### Frontend Updates
- [ ] Update pricing page to show AI tools as premium benefit
- [ ] Add AI tools section to Premium/Enterprise dashboard
- [ ] Add upsell section to Tier 1 dashboard
- [ ] Test tool links open correctly in GMP

### Email Templates
- [ ] Create Premium welcome email with tool access
- [ ] Create Enterprise welcome email with managed service info
- [ ] Create upgrade confirmation email
- [ ] Test all email templates

### Testing
- [ ] Test Tier 1 signup (no tools)
- [ ] Test Tier 2 signup (unlimited tools)
- [ ] Test Tier 3 signup (managed service)
- [ ] Test upgrade flow (Tier 1 → Tier 2)
- [ ] Verify unlimited usage in GMP

---

## Support

**Technical Questions:** support@unbound.team
**Maggie Forbes Questions:** Message Kristi on Slack
**Documentation:** https://docs.unbound.team

---

## Summary

**Positioning:**
- Maggie Forbes = Consulting + Strategy (core value)
- Unbound Tools = Premium add-on (bonus value)

**Access:**
- Tier 1 (Strategy): No tools
- Tier 2 (Premium): **Unlimited tools** ($5k/mo)
- Tier 3 (Enterprise): **Unlimited + managed** ($10k/mo)

**Integration:**
- Simple link to Growth Manager Pro dashboard
- Same login, different branding
- No usage limits for Maggie Forbes clients
- Optional done-for-you service for Enterprise

This keeps Maggie Forbes focused on consulting while offering powerful AI tools as a premium benefit that justifies the higher pricing tier.

---

**Built for Maggie Forbes Strategies by Unbound.team**
