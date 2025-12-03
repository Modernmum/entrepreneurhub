# Unbound.team Integration Guide
## For Maggie Forbes Strategies & Growth Manager Pro

---

## Overview

This guide explains how to integrate Unbound.team AI tools into:
1. **Maggie Forbes Strategies** - Strategic consulting platform (premium add-on)
2. **Growth Manager Pro** - SaaS platform (tiered access)

Both platforms integrate with the same Unbound.team API, but with different:
- Onboarding flows
- Access levels
- UI/UX presentation
- Pricing models

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    UNBOUND.TEAM API                          │
│              (Single Backend - Multi-Tenant)                 │
│                                                              │
│  Base URL: https://api.unbound.team                         │
│  Database: Supabase (shared)                                │
│  Queue: Supabase-based job queue                            │
└─────────────────────────────────────────────────────────────┘
                              │
                ┌─────────────┴─────────────┐
                │                           │
    ┌───────────▼──────────┐    ┌──────────▼───────────┐
    │  MAGGIE FORBES       │    │  GROWTH MANAGER PRO  │
    │  STRATEGIES          │    │                      │
    │                      │    │                      │
    │  maggieforbes.com    │    │  growthmangerpro.com │
    │                      │    │                      │
    │  Integration Type:   │    │  Integration Type:   │
    │  - Premium add-on    │    │  - Core product      │
    │  - Tier-based        │    │  - Plan-based        │
    │  - Consulting focus  │    │  - Self-service      │
    └──────────────────────┘    └──────────────────────┘
```

---

## Platform 1: Maggie Forbes Strategies Integration

### **Business Model:**
- Maggie Forbes = Consulting platform
- Unbound tools = **Premium add-on** (not core offering)
- Only available to Tier 2 (Premium) and Tier 3 (Enterprise) clients

### **Tier Structure:**

| Tier | Price | Unbound Access | How Presented |
|------|-------|----------------|---------------|
| Tier 1: Strategy | $2,500/mo | ❌ None | "Want AI tools? Upgrade to Premium" |
| Tier 2: Premium | $5,000/mo | ✅ Full Access | "Included: Unlimited AI Tools" |
| Tier 3: Enterprise | $10,000/mo | ✅ Managed | "We run the tools for you" |

---

### **Integration Points:**

#### **1. Maggie Forbes Website (maggieforbes.com)**

**Pricing Page:**
```html
<!-- Tier 1: Strategy Only -->
<div class="pricing-tier">
  <h3>Strategy</h3>
  <p class="price">$2,500/month</p>
  <ul>
    <li>✓ Monthly strategy session</li>
    <li>✓ Custom roadmap</li>
    <li>✓ Email support</li>
    <li>❌ AI Tools (available in Premium)</li>
  </ul>
  <button>Book Strategy Call</button>
</div>

<!-- Tier 2: Premium (WITH Unbound) -->
<div class="pricing-tier featured">
  <h3>Premium</h3>
  <p class="price">$5,000/month</p>
  <ul>
    <li>✓ Everything in Strategy</li>
    <li>✓ Bi-weekly check-ins</li>
    <li>✓ Priority support</li>
    <li>✅ <strong>Unlimited AI Tools Included</strong></li>
    <li style="margin-left: 20px;">→ Lead Generation</li>
    <li style="margin-left: 20px;">→ Content Creation</li>
    <li style="margin-left: 20px;">→ Market Research</li>
    <li style="margin-left: 20px;">→ Landing Page Builder</li>
    <li style="margin-left: 20px;">→ Email Marketing</li>
  </ul>
  <button>Get Started</button>
</div>

<!-- Tier 3: Enterprise (Managed Unbound) -->
<div class="pricing-tier">
  <h3>Enterprise</h3>
  <p class="price">$10,000+/month</p>
  <ul>
    <li>✓ Everything in Premium</li>
    <li>✓ White-glove service</li>
    <li>✓ Dedicated account manager</li>
    <li>✅ <strong>We use AI tools FOR you</strong></li>
    <li style="margin-left: 20px;">→ Done-for-you lead generation</li>
    <li style="margin-left: 20px;">→ Managed content creation</li>
  </ul>
  <button>Contact Sales</button>
</div>
```

#### **2. Client Onboarding (Tier 2 & 3)**

**Backend: Provision Client with Unbound Access**

```javascript
// backend/routes/maggieforbes/onboarding.js

async function provisionPremiumClient(req, res) {
  const { email, name, tier, stripeCustomerId } = req.body;

  // Step 1: Create client in Maggie Forbes database
  const client = await db.maggieforbes.clients.create({
    email,
    name,
    tier, // 'premium' or 'enterprise'
    stripe_customer_id: stripeCustomerId,
    status: 'active'
  });

  // Step 2: Provision in Unbound.team multi-tenant system
  const unboundResponse = await fetch('https://api.unbound.team/api/partners/kristi-empire/clients', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.UNBOUND_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      email: email,
      name: name,
      brand: 'maggie-forbes',
      consulting_tier: tier,
      plan: tier === 'premium' ? 'premium' : 'enterprise',
      source: 'maggie-forbes',
      gmp_access: true
    })
  });

  const { userId, loginUrl } = await unboundResponse.json();

  // Step 3: Send welcome email with GMP access
  await sendEmail({
    to: email,
    subject: 'Welcome to Maggie Forbes Strategies Premium! 🎉',
    template: 'premium-welcome',
    data: {
      name,
      tier,
      maggieforbesBookingUrl: 'https://maggieforbes.com/book',
      slackInvite: generateSlackInvite(client.id),
      unboundLoginUrl: 'https://app.growthmangerpro.com', // They login to GMP
      hasUnboundAccess: true
    }
  });

  res.json({
    success: true,
    clientId: client.id,
    unboundUserId: userId
  });
}
```

**Welcome Email Template (Tier 2: Premium):**
```
Subject: Welcome to Maggie Forbes Strategies Premium! 🎉

Hi {{name}},

I'm thrilled to have you as a Premium client!

Here's everything you need to get started:

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📞 YOUR STRATEGY SESSIONS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Book your bi-weekly strategy calls:
→ maggieforbes.com/book

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
💬 DIRECT SLACK ACCESS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Join your private Slack channel:
→ {{slackInvite}}

Message me anytime for quick questions or guidance.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🤖 YOUR AI TOOLS (UNLIMITED ACCESS)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

As a Premium client, you get unlimited access to our
AI-powered growth tools:

Login: app.growthmangerpro.com
Email: {{email}}
Password: (check separate email)

What you can do:
✓ Generate unlimited qualified leads for YOUR business
✓ Create blog posts, social media content, emails
✓ Research YOUR competitors and market
✓ Build landing pages for YOUR products
✓ Automate YOUR email campaigns

Your account is marked as "Maggie Forbes Premium" -
this means NO LIMITS on any tool.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🎯 NEXT STEPS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. Book your first strategy call
2. Join Slack
3. Login to your AI tools
4. Complete onboarding questionnaire: [link]

Looking forward to our first session!

- Kristi

P.S. The AI tools are included in your Premium membership.
Use them as much as you want - there are no limits for
Maggie Forbes clients.
```

#### **3. Client Dashboard (Maggie Forbes Platform)**

**When Tier 2/3 Client Logs In:**

```javascript
// frontend/maggieforbes/dashboard.jsx

function MaggieForbesDashboard({ client }) {
  const hasUnboundAccess = ['premium', 'enterprise'].includes(client.tier);

  return (
    <div className="dashboard">
      <h1>Welcome back, {client.name}!</h1>

      {/* Strategy Sessions Section */}
      <section className="strategy-sessions">
        <h2>Your Strategy Sessions</h2>
        <button>Book Next Session</button>
        <SessionHistory sessions={client.sessions} />
      </section>

      {/* Slack Access */}
      <section className="communication">
        <h2>Direct Access</h2>
        <a href={client.slackChannel}>Open Slack Channel</a>
      </section>

      {/* AI Tools Section (Only for Premium/Enterprise) */}
      {hasUnboundAccess && (
        <section className="ai-tools">
          <h2>Your AI Growth Tools</h2>
          <p className="badge">Premium Member - Unlimited Access</p>

          <div className="tools-grid">
            <ToolCard
              title="Lead Generation"
              description="Find qualified prospects for your business"
              icon="🎯"
              onClick={() => window.open('https://app.growthmangerpro.com/leads', '_blank')}
            />

            <ToolCard
              title="Content Creation"
              description="Generate blog posts, social media, emails"
              icon="✍️"
              onClick={() => window.open('https://app.growthmangerpro.com/content', '_blank')}
            />

            <ToolCard
              title="Market Research"
              description="Analyze competitors and market opportunities"
              icon="📊"
              onClick={() => window.open('https://app.growthmangerpro.com/research', '_blank')}
            />

            <ToolCard
              title="Landing Pages"
              description="Build high-converting sales pages"
              icon="🚀"
              onClick={() => window.open('https://app.growthmangerpro.com/pages', '_blank')}
            />

            <ToolCard
              title="Email Marketing"
              description="Create automated email campaigns"
              icon="📧"
              onClick={() => window.open('https://app.growthmangerpro.com/email', '_blank')}
            />
          </div>

          <p className="tools-cta">
            <a href="https://app.growthmangerpro.com" target="_blank">
              Open Growth Manager Pro Dashboard →
            </a>
          </p>
        </section>
      )}

      {/* Upsell for Tier 1 Clients */}
      {!hasUnboundAccess && (
        <section className="upsell">
          <h2>Want AI-Powered Growth Tools?</h2>
          <p>Upgrade to Premium and get unlimited access to:</p>
          <ul>
            <li>Lead Generation</li>
            <li>Content Creation</li>
            <li>Market Research</li>
            <li>Landing Page Builder</li>
            <li>Email Marketing</li>
          </ul>
          <button onClick={() => openUpgradeModal()}>
            Upgrade to Premium ($5,000/mo)
          </button>
        </section>
      )}
    </div>
  );
}
```

---

## Platform 2: Growth Manager Pro Integration

### **Business Model:**
- Growth Manager Pro = SaaS platform (standalone product)
- Unbound tools = **Core product** (the main offering)
- Available to all paying customers (different limits per tier)

### **Plan Structure:**

| Plan | Price | Unbound Access | Limits |
|------|-------|----------------|--------|
| Free | $0 | ✅ Limited | 10 leads/mo, 5 content/mo |
| Starter | $50/mo | ✅ Standard | 50 leads/mo, 20 content/mo |
| Growth | $150/mo | ✅ Full | 200 leads/mo, 50 content/mo |
| Premium* | Included | ✅ Unlimited | No limits |

*Premium = Maggie Forbes Tier 2+ clients

---

### **Integration Points:**

#### **1. Growth Manager Pro Website (growthmangerpro.com)**

**Homepage:**
```html
<section class="hero">
  <h1>Your AI-Powered Growth Team</h1>
  <p>Generate leads, create content, research markets - all powered by AI</p>

  <div class="features">
    <div class="feature">
      <h3>🎯 Lead Generation</h3>
      <p>Find qualified prospects automatically</p>
    </div>
    <div class="feature">
      <h3>✍️ Content Creation</h3>
      <p>Blog posts, social media, emails</p>
    </div>
    <div class="feature">
      <h3>📊 Market Research</h3>
      <p>Competitor analysis & market insights</p>
    </div>
    <div class="feature">
      <h3>🚀 Landing Pages</h3>
      <p>High-converting sales pages in minutes</p>
    </div>
    <div class="feature">
      <h3>📧 Email Marketing</h3>
      <p>Automated email campaigns</p>
    </div>
  </div>

  <button>Start Free Trial</button>
</section>

<section class="pricing">
  <h2>Choose Your Plan</h2>

  <div class="plan">
    <h3>Free</h3>
    <p class="price">$0/month</p>
    <ul>
      <li>10 leads per month</li>
      <li>5 content pieces</li>
      <li>Basic research</li>
    </ul>
    <button>Get Started</button>
  </div>

  <div class="plan featured">
    <h3>Growth</h3>
    <p class="price">$150/month</p>
    <ul>
      <li>200 leads per month</li>
      <li>50 content pieces</li>
      <li>Full market research</li>
      <li>Unlimited landing pages</li>
      <li>Email campaigns</li>
    </ul>
    <button>Start Free Trial</button>
  </div>
</section>
```

#### **2. Sign Up Flow**

**Frontend: Sign Up Form**

```javascript
// frontend/growthmangerpro/signup.jsx

async function handleSignup(formData) {
  // Step 1: Create account
  const response = await fetch('https://api.growthmangerpro.com/api/auth/signup', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: formData.email,
      password: formData.password,
      name: formData.name,
      plan: formData.plan // 'free', 'starter', 'growth'
    })
  });

  const { userId, token } = await response.json();

  // Step 2: Backend provisions in Unbound.team
  // (happens automatically in backend)

  // Step 3: Redirect to onboarding
  window.location.href = '/onboarding';
}
```

**Backend: Provision New User**

```javascript
// backend/routes/growthmangerpro/auth.js

async function signup(req, res) {
  const { email, password, name, plan } = req.body;

  // Step 1: Create user in GMP database
  const user = await db.gmp.users.create({
    email,
    password: hashPassword(password),
    name,
    plan,
    status: 'active'
  });

  // Step 2: Provision in Unbound.team
  const unboundResponse = await fetch('https://api.unbound.team/api/partners/kristi-empire/clients', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.UNBOUND_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      email: email,
      name: name,
      brand: 'growth-manager-pro',
      consulting_tier: null,
      plan: plan,
      source: 'growth-manager-pro',
      gmp_access: true
    })
  });

  const { userId: unboundUserId } = await unboundResponse.json();

  // Step 3: Link Unbound user ID to GMP user
  await db.gmp.users.update(user.id, {
    unbound_user_id: unboundUserId
  });

  // Step 4: Generate JWT token
  const token = generateJWT(user);

  res.json({
    success: true,
    userId: user.id,
    token
  });
}
```

#### **3. Onboarding Flow**

**Step 1: Welcome & Business Info**

```javascript
// frontend/growthmangerpro/onboarding/step1.jsx

function OnboardingStep1() {
  return (
    <div className="onboarding">
      <h1>Welcome to Growth Manager Pro! 🎉</h1>
      <p>Let's set up your account in 3 quick steps.</p>

      <form onSubmit={handleBusinessInfo}>
        <h2>Tell us about your business</h2>

        <input
          type="text"
          placeholder="Business name"
          name="businessName"
          required
        />

        <select name="industry" required>
          <option value="">Select your industry</option>
          <option value="saas">SaaS</option>
          <option value="ecommerce">E-commerce</option>
          <option value="agency">Agency</option>
          <option value="consulting">Consulting</option>
          <option value="other">Other</option>
        </select>

        <input
          type="text"
          placeholder="What's your main goal? (e.g., generate leads, create content)"
          name="mainGoal"
          required
        />

        <button type="submit">Next →</button>
      </form>
    </div>
  );
}
```

**Step 2: First Tool Setup**

```javascript
// frontend/growthmangerpro/onboarding/step2.jsx

function OnboardingStep2() {
  return (
    <div className="onboarding">
      <h2>Let's generate your first leads!</h2>
      <p>We'll find 5 qualified prospects to get you started.</p>

      <form onSubmit={handleFirstLeadGen}>
        <label>
          Who are you looking for?
          <input
            type="text"
            placeholder="e.g., SaaS founders looking for growth tools"
            name="targetAudience"
            required
          />
        </label>

        <label>
          Where are they located?
          <input
            type="text"
            placeholder="e.g., USA, Global"
            name="location"
            defaultValue="Global"
          />
        </label>

        <button type="submit">Generate My First 5 Leads</button>
      </form>
    </div>
  );
}

async function handleFirstLeadGen(formData) {
  // Call Unbound API to generate leads
  const response = await fetch('https://api.unbound.team/api/solutions/lead-generation', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${userToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      userId: currentUser.id,
      targetIndustry: formData.targetAudience,
      location: formData.location,
      criteria: {
        count: 5,
        minScore: 7
      }
    })
  });

  const { jobId } = await response.json();

  // Show loading state, poll for results
  showLoadingState(jobId);
}
```

**Step 3: Success & Dashboard Tour**

```javascript
// frontend/growthmangerpro/onboarding/step3.jsx

function OnboardingStep3({ leads }) {
  return (
    <div className="onboarding">
      <h2>✅ Success! We found {leads.length} leads for you!</h2>

      <div className="leads-preview">
        {leads.slice(0, 3).map(lead => (
          <div key={lead.id} className="lead-card">
            <h3>{lead.name}</h3>
            <p>{lead.company}</p>
            <p>Fit Score: {lead.fitScore}/10</p>
            <p>{lead.description}</p>
          </div>
        ))}
      </div>

      <p>
        <button onClick={downloadCSV}>Download All Leads (CSV)</button>
      </p>

      <h3>What's next?</h3>
      <ul>
        <li>✓ Your leads are ready to download</li>
        <li>→ Explore other tools (Content, Research, Pages, Email)</li>
        <li>→ Set up automated lead generation</li>
        <li>→ Invite your team</li>
      </ul>

      <button onClick={() => window.location.href = '/dashboard'}>
        Go to Dashboard
      </button>
    </div>
  );
}
```

#### **4. Main Dashboard**

```javascript
// frontend/growthmangerpro/dashboard.jsx

function GrowthManagerProDashboard({ user }) {
  const [usage, setUsage] = useState(null);

  useEffect(() => {
    // Fetch usage stats from Unbound API
    fetchUsageStats();
  }, []);

  async function fetchUsageStats() {
    const response = await fetch(`https://api.unbound.team/api/users/${user.id}/usage`, {
      headers: { 'Authorization': `Bearer ${user.token}` }
    });
    const data = await response.json();
    setUsage(data);
  }

  return (
    <div className="dashboard">
      <header>
        <h1>Growth Manager Pro</h1>
        <div className="user-info">
          {user.brand === 'maggie-forbes' && (
            <span className="badge premium">Maggie Forbes Premium</span>
          )}
          {user.brand === 'growth-manager-pro' && (
            <span className="badge">{user.plan} Plan</span>
          )}
        </div>
      </header>

      {/* Usage Stats (if not unlimited) */}
      {usage && !usage.unlimited && (
        <section className="usage">
          <h2>This Month's Usage</h2>
          <div className="usage-grid">
            <div className="stat">
              <span>Leads Generated</span>
              <strong>{usage.leadsGenerated} / {usage.leadsLimit}</strong>
              <ProgressBar value={usage.leadsGenerated} max={usage.leadsLimit} />
            </div>
            <div className="stat">
              <span>Content Pieces</span>
              <strong>{usage.contentCreated} / {usage.contentLimit}</strong>
              <ProgressBar value={usage.contentCreated} max={usage.contentLimit} />
            </div>
          </div>

          {usage.leadsGenerated >= usage.leadsLimit * 0.8 && (
            <div className="upgrade-prompt">
              <p>You're using {Math.round(usage.leadsGenerated / usage.leadsLimit * 100)}% of your leads!</p>
              <button onClick={openUpgradeModal}>Upgrade Plan</button>
            </div>
          )}
        </section>
      )}

      {/* Tools Grid */}
      <section className="tools">
        <h2>Your AI Tools</h2>
        <div className="tools-grid">
          <ToolCard
            title="Lead Generation"
            description="Find qualified prospects"
            icon="🎯"
            stats={`${usage?.leadsGenerated || 0} generated this month`}
            onClick={() => navigate('/leads')}
          />

          <ToolCard
            title="Content Creation"
            description="Blog posts, social media"
            icon="✍️"
            stats={`${usage?.contentCreated || 0} pieces created`}
            onClick={() => navigate('/content')}
          />

          <ToolCard
            title="Market Research"
            description="Competitor analysis"
            icon="📊"
            stats={`${usage?.researchDone || 0} reports generated`}
            onClick={() => navigate('/research')}
          />

          <ToolCard
            title="Landing Pages"
            description="High-converting pages"
            icon="🚀"
            stats={`${usage?.pagesBuilt || 0} pages built`}
            onClick={() => navigate('/pages')}
          />

          <ToolCard
            title="Email Marketing"
            description="Automated campaigns"
            icon="📧"
            stats={`${usage?.campaignsCreated || 0} campaigns sent`}
            onClick={() => navigate('/email')}
          />
        </div>
      </section>

      {/* Recent Activity */}
      <section className="recent">
        <h2>Recent Activity</h2>
        <ActivityFeed userId={user.id} />
      </section>
    </div>
  );
}
```

#### **5. Individual Tool Pages**

**Example: Lead Generation Tool**

```javascript
// frontend/growthmangerpro/tools/LeadGeneration.jsx

function LeadGenerationTool({ user }) {
  const [jobs, setJobs] = useState([]);
  const [activeJob, setActiveJob] = useState(null);

  async function handleGenerateLeads(formData) {
    // Submit to Unbound API
    const response = await fetch('https://api.unbound.team/api/solutions/lead-generation', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${user.token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        userId: user.id,
        targetIndustry: formData.industry,
        location: formData.location,
        criteria: {
          count: formData.count,
          minScore: formData.minScore
        }
      })
    });

    const { jobId } = await response.json();

    // Poll for results
    pollJobStatus(jobId);
  }

  async function pollJobStatus(jobId) {
    const pollInterval = setInterval(async () => {
      const response = await fetch(
        `https://api.unbound.team/api/solutions/lead-generation/status/${jobId}`,
        {
          headers: { 'Authorization': `Bearer ${user.token}` }
        }
      );

      const job = await response.json();

      if (job.state === 'completed') {
        clearInterval(pollInterval);
        setActiveJob(job);
        showSuccessMessage(`Found ${job.result.leadsFound} leads!`);
      }

      if (job.state === 'failed') {
        clearInterval(pollInterval);
        showErrorMessage(job.error);
      }
    }, 3000); // Poll every 3 seconds
  }

  return (
    <div className="tool-page">
      <h1>🎯 Lead Generation</h1>

      {/* Input Form */}
      <form onSubmit={handleGenerateLeads}>
        <label>
          Who are you looking for?
          <input
            type="text"
            placeholder="e.g., SaaS founders looking for marketing tools"
            name="industry"
            required
          />
        </label>

        <label>
          Location
          <input
            type="text"
            placeholder="e.g., USA, Europe, Global"
            name="location"
            defaultValue="Global"
          />
        </label>

        <label>
          How many leads?
          <input
            type="number"
            name="count"
            min="1"
            max={user.plan === 'premium' ? 1000 : 200}
            defaultValue="50"
          />
          {user.plan !== 'premium' && (
            <small>Your plan allows up to 200 leads per month</small>
          )}
        </label>

        <label>
          Minimum fit score
          <select name="minScore">
            <option value="6">6 - Good fit</option>
            <option value="7" selected>7 - Strong fit</option>
            <option value="8">8 - Excellent fit</option>
            <option value="9">9 - Perfect fit</option>
          </select>
        </label>

        <button type="submit">Generate Leads</button>
      </form>

      {/* Results */}
      {activeJob && (
        <div className="results">
          <h2>✅ Found {activeJob.result.leadsFound} Leads!</h2>
          <p>Average fit score: {activeJob.result.summary.avgFitScore}/10</p>

          <button onClick={() => downloadCSV(activeJob.result.csv)}>
            Download CSV
          </button>

          <div className="leads-list">
            {activeJob.result.leads.map(lead => (
              <LeadCard key={lead.name} lead={lead} />
            ))}
          </div>
        </div>
      )}

      {/* Previous Jobs */}
      <div className="history">
        <h3>Previous Lead Generations</h3>
        <JobHistory jobs={jobs} />
      </div>
    </div>
  );
}
```

---

## Key Differences: Maggie Forbes vs Growth Manager Pro

| Aspect | Maggie Forbes | Growth Manager Pro |
|--------|---------------|-------------------|
| **Primary Value** | Consulting + strategy | AI tools |
| **Unbound Position** | Premium add-on | Core product |
| **Access Model** | Tier-based (2 & 3 only) | Plan-based (all paying) |
| **Pricing** | $2,500-$10,000/mo | $0-$150/mo |
| **Onboarding** | Focus on strategy → tools | Focus on tools immediately |
| **UI Branding** | Link to GMP, minimal integration | Full product experience |
| **Support Level** | White-glove, managed | Self-service, email support |
| **Usage Limits** | Unlimited (Tier 2+) | Plan-based limits |

---

## Shared Components

Both platforms share:

### **1. Unbound API Client**

```javascript
// shared/unboundClient.js

class UnboundClient {
  constructor(apiKey) {
    this.baseUrl = 'https://api.unbound.team';
    this.apiKey = apiKey;
  }

  async generateLeads(params) {
    const response = await fetch(`${this.baseUrl}/api/solutions/lead-generation`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(params)
    });

    const { jobId } = await response.json();
    return this.pollJob('lead-generation', jobId);
  }

  async createContent(params) { /* ... */ }
  async doResearch(params) { /* ... */ }
  async buildLandingPage(params) { /* ... */ }
  async createEmailCampaign(params) { /* ... */ }

  async pollJob(solutionType, jobId) {
    while (true) {
      const response = await fetch(
        `${this.baseUrl}/api/solutions/${solutionType}/status/${jobId}`,
        { headers: this.getHeaders() }
      );

      const job = await response.json();

      if (job.state === 'completed') return job.result;
      if (job.state === 'failed') throw new Error(job.error);

      await new Promise(resolve => setTimeout(resolve, 3000));
    }
  }

  getHeaders() {
    return {
      'Authorization': `Bearer ${this.apiKey}`,
      'Content-Type': 'application/json'
    };
  }
}

export default UnboundClient;
```

### **2. User Provisioning**

Both platforms call the same Unbound API endpoint to provision users, just with different `brand` and `tier` values.

---

## Implementation Checklist

### **For Maggie Forbes:**
- [ ] Update pricing page to show Unbound as premium add-on
- [ ] Modify Tier 2/3 onboarding to provision Unbound access
- [ ] Add "AI Tools" section to client dashboard (links to GMP)
- [ ] Create welcome email templates mentioning GMP access
- [ ] Add upgrade CTA for Tier 1 clients
- [ ] Update Slack onboarding to explain GMP access

### **For Growth Manager Pro:**
- [ ] Build sign-up flow that provisions in Unbound
- [ ] Create 3-step onboarding (business info → first leads → dashboard)
- [ ] Build main dashboard with 5 tool cards
- [ ] Build individual tool pages (Lead Gen, Content, Research, Pages, Email)
- [ ] Implement usage tracking and limits per plan
- [ ] Add upgrade prompts when approaching limits
- [ ] Create "Premium" badge UI for Maggie Forbes clients
- [ ] Build CSV export for all tools
- [ ] Add job history/activity feed

### **Shared/Backend:**
- [ ] Deploy Unbound.team API to Railway
- [ ] Set up Supabase with all schemas
- [ ] Configure environment variables
- [ ] Set up Stripe for both platforms
- [ ] Create API keys for both platforms
- [ ] Set up webhook endpoints
- [ ] Configure CORS for both domains
- [ ] Set up monitoring and error tracking

---

## Summary

**Maggie Forbes Integration:**
- Position Unbound as premium add-on
- Only available to Tier 2+ clients
- Simple integration: Link to GMP from MF dashboard
- Focus on "included benefit" messaging

**Growth Manager Pro Integration:**
- Unbound IS the core product
- Deep integration: Full UI for all 5 tools
- Available to all paying customers
- Focus on value delivery and usage

**Both share:**
- Same Unbound API backend
- Same multi-tenant database
- Same job queue system
- Different branding and positioning

This architecture allows you to serve both premium consulting clients (Maggie Forbes) and self-service SaaS users (Growth Manager Pro) from a single backend platform.
