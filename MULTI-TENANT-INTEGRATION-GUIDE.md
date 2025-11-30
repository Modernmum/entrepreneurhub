# Multi-Tenant Auto-Identification System
**Invisible Partner Architecture for Maggie Forbes & Growth Manager Pro**

---

## Overview

Unbound.team automatically identifies which tenant (brand) a client belongs to and applies the appropriate:
- ✅ Branding (logos, colors, messaging)
- ✅ Pricing & limits
- ✅ Revenue share tracking
- ✅ White-label UI (invisible backend)
- ✅ Usage tracking per tenant

---

## How Auto-Identification Works

### **Priority Order:**

1. **Domain/Subdomain** (highest priority)
2. **API Key** (for backend automation)
3. **User Session** (already logged in)
4. **Email Domain** (signup flow)
5. **Referral Code** (marketing campaigns)
6. **Default:** Unbound.team (public product)

---

## Tenant Configuration

### **Three Tenants Pre-Configured:**

| Tenant | Slug | Domain | Use Case | Revenue Share |
|--------|------|--------|----------|---------------|
| **Unbound.team** | `unbound-team` | app.unboundteam.com | Public product | 0% (main brand) |
| **Maggie Forbes** | `maggie-forbes` | tools.maggieforbes.com | Invisible backend for $25K+ clients | 50% (your profit) |
| **Growth Manager Pro** | `growth-manager-pro` | platform.growthmanagerpro.com | White-label add-on | 50% (your profit) |

---

## Use Cases

### **Use Case 1: Maggie Forbes Client (Invisible Backend)**

**Scenario:**
- Client pays you $25K/month for consulting
- You use Unbound.team backend to deliver results
- Client never knows about Unbound.team

**How It Works:**

1. **You provision client:**
   ```javascript
   const partnerManager = require('./services/partner-manager');

   await partnerManager.provisionClient({
     tenantSlug: 'maggie-forbes',
     userEmail: 'ceo@bigclient.com',
     userName: 'John Smith',
     plan: 'consulting', // Unlimited usage
     source: 'maggie-forbes-consulting'
   });
   ```

2. **Client gets credentials:**
   - Login: tools.maggieforbes.com
   - Branding: Maggie Forbes colors, logo
   - Never sees "Unbound.team" anywhere

3. **You run jobs for them:**
   ```javascript
   // Generate leads for client
   const leadGen = require('./services/lead-scraper');

   const leads = await leadGen.generateLeads({
     tenantSlug: 'maggie-forbes',
     userEmail: 'ceo@bigclient.com',
     targetIndustry: 'SaaS founders',
     count: 100
   });

   // Export as PDF report with Maggie Forbes branding
   // Client receives: "Maggie Forbes Strategic Lead Analysis"
   // Never knows it's automated
   ```

4. **Billing:**
   - Client pays YOU $25K/month
   - System tracks their usage
   - You can see usage metrics in admin panel
   - No additional charge to client (included in consulting)

---

### **Use Case 2: Growth Manager Pro Client (White-Label Add-On)**

**Scenario:**
- Existing GMP client pays $3K/month
- You want to add automation capabilities
- White-labeled as "GMP Automation Suite"

**How It Works:**

1. **Auto-provision when they sign up:**
   ```javascript
   // During GMP signup flow
   const tenantIdentifier = require('./services/tenant-identifier');

   // Detects from email domain @growthmanagerpro.com
   // Or from referral code GMP-ABC123
   await tenantIdentifier.autoAssignTenant(
     'client@business.com',
     'gmp-referral',
     'growth' // Unlimited plan
   );
   ```

2. **Client sees:**
   - Login: platform.growthmanagerpro.com
   - Branding: GMP colors, logo
   - "GMP Automation Suite powered by AI"
   - Never sees "Unbound.team"

3. **Revenue tracking:**
   - If you charge them extra $500/mo for automation
   - System tracks 50% revenue share to your GMP brand
   - You keep full profit (it's your brand)

---

### **Use Case 3: Unbound.team Public Customer**

**Scenario:**
- External customer finds Unbound.team
- Pays $2,500/month for standalone platform
- Self-service, no white-labeling

**How It Works:**

1. **Signup at app.unboundteam.com:**
   ```javascript
   // Auto-detects from domain
   const tenantIdentifier = require('./services/tenant-identifier');

   const tenant = await tenantIdentifier.identifyFromDomain(
     'app.unboundteam.com'
   );
   // Returns: unbound-team tenant
   ```

2. **Customer sees:**
   - Full Unbound.team branding
   - Public product positioning
   - Self-service onboarding
   - No mention of Maggie Forbes or GMP

3. **Complete separation:**
   - Different database tenant_id
   - Different branding
   - Different usage limits
   - No cross-contamination

---

## Automatic Detection Examples

### **Example 1: Domain-Based Detection**

```javascript
// Request to: https://tools.maggieforbes.com/api/generate-leads

app.use(tenantIdentifier.middleware());

app.post('/api/generate-leads', async (req, res) => {
  // req.tenant is automatically attached by middleware
  console.log(req.tenant.name); // "Maggie Forbes AI Solutions"
  console.log(req.tenantBranding.logo); // "/logos/maggie-forbes.png"

  // Generate leads with tenant branding
  const leads = await generateLeads(req.tenant, req.body);

  res.json({
    leads,
    branding: req.tenantBranding // Return branding for UI
  });
});
```

---

### **Example 2: Email Domain Detection**

```javascript
// Signup flow
app.post('/api/signup', async (req, res) => {
  const { email, name } = req.body;

  // Auto-detect tenant from email domain
  const tenant = await tenantIdentifier.identifyFromEmailDomain(email);

  if (email.includes('@maggieforbes.com')) {
    // Internal team member → Maggie Forbes tenant
    // Auto-provision with admin access
  } else {
    // External user → Unbound.team tenant
    // Standard signup flow
  }

  await tenantIdentifier.autoAssignTenant(email, 'email-domain');
});
```

---

### **Example 3: API Key Detection**

```javascript
// Backend automation for Maggie Forbes consulting
// You run this via cron job for clients

const axios = require('axios');

const apiKey = 'mfs_live_abc123'; // Maggie Forbes API key

const response = await axios.post(
  'https://api.unboundteam.com/generate-leads',
  {
    targetIndustry: 'SaaS founders',
    count: 50
  },
  {
    headers: {
      'X-API-Key': apiKey // Auto-detects Maggie Forbes tenant
    }
  }
);

// System automatically:
// 1. Identifies tenant from API key prefix (mfs_)
// 2. Applies Maggie Forbes branding
// 3. Tracks usage under Maggie Forbes tenant
// 4. Generates leads
```

---

### **Example 4: Referral Code Detection**

```javascript
// Marketing campaign: https://unboundteam.com?ref=MFS-WEBINAR2025

app.get('/signup', async (req, res) => {
  const referralCode = req.query.ref; // "MFS-WEBINAR2025"

  const tenant = await tenantIdentifier.identifyFromReferralCode(referralCode);

  console.log(tenant.name); // "Maggie Forbes AI Solutions"

  // During signup, this user will be assigned to Maggie Forbes tenant
  // Even though they signed up via unboundteam.com

  // Use case: You run a webinar, attendees sign up with your referral code
  // They get assigned to Maggie Forbes tenant
  // You get 50% revenue share
});
```

---

## White-Label Frontend Setup

### **Option 1: Separate Subdomains (Recommended)**

**Setup:**
```
app.unboundteam.com → Unbound.team (public)
tools.maggieforbes.com → Maggie Forbes (white-label)
platform.growthmanagerpro.com → GMP (white-label)
```

**How to configure:**

1. **DNS Setup:**
   ```
   CNAME tools.maggieforbes.com → unboundteam-three.vercel.app
   CNAME platform.growthmanagerpro.com → unboundteam-three.vercel.app
   CNAME app.unboundteam.com → unboundteam-three.vercel.app
   ```

2. **Vercel Configuration:**
   ```json
   // vercel.json
   {
     "domains": [
       "app.unboundteam.com",
       "tools.maggieforbes.com",
       "platform.growthmanagerpro.com"
     ]
   }
   ```

3. **Frontend Auto-Branding:**
   ```javascript
   // On page load, detect tenant from domain
   const hostname = window.location.hostname;

   const response = await fetch('/api/tenant/branding', {
     headers: { 'X-Hostname': hostname }
   });

   const branding = await response.json();

   // Apply branding dynamically
   document.querySelector('.logo').src = branding.logo;
   document.querySelector(':root').style.setProperty('--primary-color', branding.colors.primary);
   document.title = branding.name;
   ```

---

### **Option 2: Same Domain, Different Paths**

**Setup:**
```
unboundteam.com/ → Public product
unboundteam.com/mfs → Maggie Forbes portal
unboundteam.com/gmp → Growth Manager Pro portal
```

**Less recommended** - harder to maintain complete brand separation.

---

## Backend Integration (How YOU Use It)

### **Scenario: Run Lead Gen for Maggie Forbes Client**

```javascript
const partnerManager = require('./services/partner-manager');
const leadGen = require('./services/lead-scraper');

// 1. Provision client (one-time)
await partnerManager.provisionClient({
  tenantSlug: 'maggie-forbes',
  userEmail: 'ceo@bigclient.com',
  userName: 'John Smith',
  plan: 'consulting',
  source: 'maggie-forbes-consulting'
});

// 2. Run lead generation for them
const leads = await leadGen.generateLeads({
  tenantSlug: 'maggie-forbes',
  userEmail: 'ceo@bigclient.com',
  targetIndustry: 'SaaS founders',
  location: 'global',
  count: 100,
  minScore: 8
});

// 3. Track usage (automatic)
// System automatically tracks this job under Maggie Forbes tenant
// Client's usage is logged
// You can see: "John Smith used 1 lead gen job this month"

// 4. Export results with Maggie Forbes branding
const report = {
  client: 'BigClient Inc.',
  leads: leads,
  branding: {
    logo: '/logos/maggie-forbes.png',
    header: 'Maggie Forbes Strategic Lead Analysis',
    footer: 'Prepared by Maggie Forbes Strategies'
  }
};

// Client receives branded PDF
// Never knows it's automated via Unbound.team
```

---

### **Scenario: Bulk Provision GMP Clients**

```javascript
const partnerManager = require('./services/partner-manager');

// CSV of GMP clients
const clients = [
  { email: 'client1@business.com', name: 'Sarah Johnson', plan: 'growth' },
  { email: 'client2@startup.io', name: 'Mike Chen', plan: 'growth' },
  { email: 'client3@company.co', name: 'Lisa Wang', plan: 'starter' }
];

const results = await partnerManager.bulkProvisionClients(
  'growth-manager-pro',
  clients
);

console.log(results.success.length); // 3 clients provisioned
console.log(results.failed.length); // 0 failed

// All three clients now have access to:
// - platform.growthmanagerpro.com
// - GMP-branded automation tools
// - Usage tracked under GMP tenant
```

---

## Revenue Tracking

### **View Revenue Share**

```javascript
const partnerManager = require('./services/partner-manager');

// Calculate this month's revenue for Maggie Forbes
const revenue = await partnerManager.calculateMonthlyRevenue(
  'maggie-forbes',
  '2025-12'
);

console.log(revenue);
/*
{
  month: '2025-12',
  total_revenue: 5000,    // $5K total
  partner_share: 2500,     // $2.5K your share (50%)
  unbound_share: 2500,     // $2.5K platform
  active_users: 20,
  paying_users: 10,
  revenue_breakdown: {
    starter: 1000,         // 2 clients @ $500
    growth: 3000,          // 2 clients @ $1500
    consulting: 1000       // Custom pricing
  }
}
*/

// Get quarterly report
const report = await partnerManager.getRevenueShareReport(
  'maggie-forbes',
  '2025-10',
  '2025-12'
);

console.log(report);
/*
{
  tenant: 'Maggie Forbes AI Solutions',
  period: '2025-10 to 2025-12',
  total_revenue: 15000,
  partner_share: 7500,     // Your cut: $7.5K
  unbound_share: 7500,
  months: [ ... monthly breakdown ... ]
}
*/
```

---

## Usage Tracking Per Client

```javascript
const partnerManager = require('./services/partner-manager');

// Track when client uses a solution
await partnerManager.trackUsage(
  'ceo@bigclient.com',
  'maggie-forbes',
  'lead-generation'
);

// Returns:
/*
{
  success: true,
  usage: 15,              // 15 jobs used this month
  limit: -1,              // Unlimited (consulting plan)
  remaining: 'unlimited'
}
*/

// You can see all usage in admin dashboard:
// "BigClient Inc: 15 lead gen, 8 content, 3 research this month"
```

---

## Complete Separation Strategy

### **Maggie Forbes Clients NEVER see Unbound.team:**

**What they see:**
- URL: tools.maggieforbes.com
- Logo: Maggie Forbes logo
- Colors: Purple/pink (your brand colors)
- Tagline: "AI-Powered Strategic Solutions for High-End Businesses"
- Reports: "Prepared by Maggie Forbes Strategies"
- Support emails: From support@maggieforbes.com
- Invoices: Billed as "Maggie Forbes Consulting Services"

**What they don't see:**
- No "Unbound.team" branding anywhere
- No mention of it being a platform
- No reference to other products
- Completely white-labeled

**If client asks: "What system do you use?"**
Answer: "We've built proprietary AI systems over the years for our consulting practice."

---

### **Unbound.team Customers NEVER see Maggie Forbes:**

**What they see:**
- URL: app.unboundteam.com
- Logo: Unbound.team logo
- Tagline: "Your Autonomous AI Team - Unbound from Big Tech"
- Pricing: $2,500/month standalone
- Self-service platform

**What they don't see:**
- No mention of Maggie Forbes
- No mention of Growth Manager Pro
- No reference to consulting services
- Public SaaS product positioning

---

## Admin Dashboard (Your View)

You can see ALL tenants in one dashboard:

```
┌─────────────────────────────────────────┐
│   UNBOUND.TEAM - MULTI-TENANT DASHBOARD │
└─────────────────────────────────────────┘

Tenant: Maggie Forbes AI Solutions
─────────────────────────────────────
Active Clients: 25
Monthly Revenue: $12,500
Your Share (50%): $6,250
Top Solution: Lead Generation (45 jobs)
Top Client: BigClient Inc (15 jobs)

Tenant: Growth Manager Pro AI Assistant
─────────────────────────────────────
Active Clients: 40
Monthly Revenue: $8,000
Your Share (50%): $4,000
Top Solution: Content Creation (120 articles)
Top Client: StartupCo (25 jobs)

Tenant: Unbound.team (Public)
─────────────────────────────────────
Active Clients: 15
Monthly Revenue: $37,500 ($2,500 × 15)
Platform Revenue (100%): $37,500
Top Solution: Market Research (30 reports)
Conversion Rate: 8% (free → paid)

────────────────────────────────────────
TOTAL MRR: $58,000
Your Total Share: $47,750 (82%)
────────────────────────────────────────
```

---

## API Examples

### **Provision Client API:**

```bash
POST /api/admin/provision-client
Authorization: Bearer YOUR_ADMIN_TOKEN

{
  "tenantSlug": "maggie-forbes",
  "userEmail": "newclient@business.com",
  "userName": "Emma Davis",
  "plan": "consulting",
  "source": "maggie-forbes-consulting"
}

# Response:
{
  "success": true,
  "user": { ... },
  "message": "Client Emma Davis added to Maggie Forbes AI Solutions"
}
```

---

### **Run Job for Client:**

```bash
POST /api/solutions/lead-generation
X-API-Key: mfs_live_abc123
X-User-Email: client@business.com

{
  "targetIndustry": "SaaS founders",
  "location": "global",
  "count": 50
}

# System automatically:
# 1. Detects Maggie Forbes tenant from API key
# 2. Tracks usage for client@business.com
# 3. Applies Maggie Forbes branding
# 4. Generates leads
# 5. Returns results
```

---

## Next Steps to Deploy

### **1. Set Up DNS (15 minutes)**
- Point tools.maggieforbes.com to Vercel
- Point platform.growthmanagerpro.com to Vercel
- Point app.unboundteam.com to Vercel

### **2. Run Database Migration (5 minutes)**
```bash
# In Supabase SQL Editor
# Run: supabase-multi-tenant-schema.sql
# This creates all tenant tables
```

### **3. Configure Tenant Branding (10 minutes)**
- Upload Maggie Forbes logo
- Upload GMP logo
- Set color schemes
- Update tenant records in database

### **4. Add Tenant Middleware (5 minutes)**
```javascript
// backend/server.js
const tenantIdentifier = require('./services/tenant-identifier');

app.use(tenantIdentifier.middleware());

// Now all routes have req.tenant and req.tenantBranding
```

### **5. Test Auto-Detection (10 minutes)**
- Visit tools.maggieforbes.com → See Maggie Forbes branding
- Visit app.unboundteam.com → See Unbound.team branding
- Provision test client → Verify assignment

---

## Summary

### **YES - Unbound.team Will Automatically Identify Clients:**

✅ **By domain** (tools.maggieforbes.com → Maggie Forbes)
✅ **By email** (user@maggieforbes.com → Maggie Forbes)
✅ **By API key** (mfs_live_xxx → Maggie Forbes)
✅ **By referral code** (MFS-XXX → Maggie Forbes)
✅ **Tracks usage per tenant**
✅ **Calculates revenue share**
✅ **White-label branding**
✅ **Complete separation**

### **For Maggie Forbes:**
- Clients pay YOU $25K+
- They log into tools.maggieforbes.com
- See only Maggie Forbes branding
- Never know about Unbound.team
- You use backend automation invisibly

### **For Growth Manager Pro:**
- Existing clients get add-on
- Log into platform.growthmanagerpro.com
- White-labeled as "GMP Automation Suite"
- Seamless integration

### **For Unbound.team:**
- Public customers at $2,500/month
- Log into app.unboundteam.com
- Self-service platform
- No connection to your consulting

**All running on the same backend. Completely automated. Fully separated.**

---

**Ready to deploy the multi-tenant system?** 🚀
