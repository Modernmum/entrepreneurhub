# Unbound.team ↔ Growth Manager Pro Integration
**The Invisible Backend That Powers Client Dashboards**

---

## Architecture Overview

```
┌──────────────────────────────────────────────────────────────┐
│               UNBOUND.TEAM (Backend Engine)                  │
│                                                              │
│  Generates:                                                  │
│  - Leads (Reddit, forums, RSS, blogs)                       │
│  - Content (blog posts, social media, email)                │
│  - Research (competitor analysis, market gaps)              │
│  - Landing pages (HTML/CSS generated)                       │
│  - Email campaigns (sequences, automation)                  │
└──────────────────────────────────────────────────────────────┘
                            ↓
                     Via REST API
                            ↓
┌──────────────────────────────────────────────────────────────┐
│          GROWTH MANAGER PRO (Client Dashboard)               │
│                                                              │
│  Platform: Custom React/Next.js                             │
│  Database: PostgreSQL                                        │
│  API Endpoints: 131+ REST APIs                              │
│  Multi-tenant: tenant_id isolation                          │
│                                                              │
│  Displays to clients:                                        │
│  - Real-time lead pipeline                                  │
│  - Content library                                          │
│  - Research reports                                         │
│  - Campaign performance                                     │
│  - Project status & tasks                                   │
└──────────────────────────────────────────────────────────────┘
                            ↓
                  Clients See Dashboard
                            ↓
┌────────────────┐          ┌────────────────┐
│ MAGGIE FORBES  │          │ GROWTH MANAGER │
│ CLIENT         │          │ PRO CLIENT     │
│                │          │                │
│ $25K/mo        │          │ $3K/mo         │
│ consulting     │          │ service        │
└────────────────┘          └────────────────┘
```

---

## What You Currently Have

### ✅ Growth Manager Pro (GMP)

**Tech Stack:**
- Custom code (React/Next.js)
- PostgreSQL database (55 tables)
- 131+ REST API endpoints
- Multi-tenant architecture (tenant_id)
- JWT authentication
- Client dashboard showing:
  - Project status
  - Task lists
  - Analytics
  - Reports

**Current Use:**
- Maggie Forbes clients → Sign deal → Get GMP access
- GMP clients → Get GMP access
- Dashboard shows real-time results

---

## What You Need: Unbound.team as Invisible Backend

### **Integration Flow:**

**1. You onboard client (Maggie Forbes or GMP)**
   - They sign contract
   - You provision them in GMP
   - They get GMP dashboard access

**2. Behind the scenes:**
   - Unbound.team runs lead gen for them
   - Unbound.team creates content for them
   - Unbound.team does market research
   - All via automated jobs

**3. Results pushed to GMP:**
   - Unbound.team → GMP API → GMP Database → Client Dashboard
   - Client sees leads appearing in real-time
   - Client sees content being generated
   - Client sees research reports populating

**4. Client experience:**
   - Logs into GMP dashboard
   - Sees: "50 new leads this week"
   - Sees: "5 blog posts ready for review"
   - Sees: "Competitor analysis report available"
   - Never knows it's automated via Unbound.team
   - Thinks you have a team doing this manually

---

## Integration Architecture

### **Option A: Direct API Integration** (Recommended)

**Unbound.team pushes data to GMP via REST API:**

```javascript
// When Unbound.team generates leads
const leads = await unboundTeam.generateLeads({
  targetIndustry: 'SaaS founders',
  count: 50
});

// Push to GMP API
for (const lead of leads) {
  await fetch('https://growthmanagerpro.com/api/contacts', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${GMP_API_KEY}`,
      'Content-Type': 'application/json',
      'x-tenant-id': clientTenantId
    },
    body: JSON.stringify({
      full_name: lead.name,
      email: lead.email,
      company: lead.company,
      stage: 'lead',
      lead_source: 'AI Lead Generation',
      notes: `Fit Score: ${lead.fitScore}/10\nPain Points: ${lead.painPoints}`,
      custom_fields: {
        unbound_job_id: lead.jobId,
        generated_at: new Date().toISOString()
      }
    })
  });
}

// Client sees 50 new leads in their GMP dashboard
// Under "Contacts" tab, filtered by "lead" stage
```

**GMP API Endpoints We'll Use:**

| Unbound.team Output | GMP API Endpoint | What Client Sees |
|---------------------|------------------|------------------|
| Leads | `POST /api/contacts` | New contacts in CRM |
| Content | `POST /api/campaigns` or custom table | Content library |
| Research | `POST /api/deals` (notes) or custom | Research reports tab |
| Tasks | `POST /api/sprints/action-items` | Task list updates |
| Analytics | `POST /api/analytics/*` | Dashboard metrics |

---

### **Option B: Shared Database** (Fallback)

**Unbound.team writes directly to GMP PostgreSQL:**

```javascript
// Unbound.team has GMP database connection
const { Client } = require('pg');
const gmpDb = new Client({
  connectionString: process.env.GMP_DATABASE_URL
});

// When leads are generated
await gmpDb.query(`
  INSERT INTO contacts (
    tenant_id,
    full_name,
    email,
    company,
    stage,
    lead_source,
    notes,
    created_at
  ) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
`, [
  clientTenantId,
  lead.name,
  lead.email,
  lead.company,
  'lead',
  'AI Lead Generation',
  `Fit Score: ${lead.fitScore}/10`
]);
```

**Pros:** Direct, fast, no API overhead
**Cons:** Tight coupling, bypasses GMP business logic

---

## Detailed Integration Points

### **1. Lead Generation → GMP Contacts**

**Unbound.team generates leads:**
- Scrapes Reddit, forums, blogs
- AI scores each lead (1-10)
- Identifies pain points
- Creates outreach strategy

**Push to GMP:**
```javascript
POST /api/contacts
{
  "tenant_id": "mfs-client-123",
  "full_name": "John Smith",
  "email": "john@saascompany.com",
  "company": "SaaS Company Inc",
  "stage": "lead",
  "lead_source": "AI Lead Generation",
  "phone": null,
  "notes": "Fit Score: 8/10\nPain Points: Struggling with lead generation, needs content automation\nSource: Reddit r/SaaS\nOutreach Tip: Mention their post about scaling challenges"
}
```

**Client sees in GMP dashboard:**
- Contacts tab → New contact "John Smith"
- Stage: Lead
- Source: AI Lead Generation
- Notes with all details

---

### **2. Content Creation → GMP Campaigns**

**Unbound.team creates content:**
- Blog posts (800-2000 words)
- Social media posts (LinkedIn, Twitter, Facebook)
- Email sequences

**Push to GMP:**
```javascript
POST /api/campaigns
{
  "tenant_id": "mfs-client-123",
  "name": "Blog Post: How to Scale SaaS in 2026",
  "type": "content",
  "status": "ready_for_review",
  "content": {
    "title": "How to Scale Your SaaS Business in 2026",
    "body": "...(full blog post)...",
    "meta_description": "...",
    "keywords": ["saas", "scaling", "growth"],
    "word_count": 1500
  },
  "created_at": "2025-12-01T10:00:00Z"
}
```

**Alternative: Custom Table**
```sql
CREATE TABLE generated_content (
  id SERIAL PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  type TEXT, -- 'blog', 'social', 'email'
  title TEXT,
  content TEXT,
  status TEXT DEFAULT 'draft', -- 'draft', 'ready', 'published'
  unbound_job_id TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);
```

**Client sees:**
- Content library tab
- "Blog Post: How to Scale SaaS in 2026" - Ready for Review
- Click to view full content
- Can edit, approve, or request revisions

---

### **3. Market Research → GMP Reports**

**Unbound.team generates research:**
- Competitor analysis
- Market gap identification
- Pricing strategy recommendations
- TAM/SAM/SOM analysis

**Push to GMP:**

**Option A: As Deal Notes**
```javascript
POST /api/deals
{
  "tenant_id": "mfs-client-123",
  "contact_id": null, // Internal research
  "stage": "research",
  "value": 0,
  "title": "Market Research: SaaS Competitor Analysis",
  "notes": "## Competitor Analysis\n\n...(full report)...",
  "custom_fields": {
    "report_type": "market_research",
    "unbound_job_id": "research-123"
  }
}
```

**Option B: Custom Reports Table**
```sql
CREATE TABLE research_reports (
  id SERIAL PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  title TEXT,
  report_type TEXT, -- 'competitor', 'market_gap', 'pricing'
  content JSONB, -- Full structured report
  summary TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);
```

**Client sees:**
- Research Reports tab
- "SaaS Competitor Analysis" - Generated Dec 1, 2025
- Click to view full report with charts, insights, recommendations

---

### **4. Tasks/Action Items → GMP Sprints**

**Unbound.team can also generate recommended tasks:**

```javascript
POST /api/sprints/action-items
{
  "tenant_id": "mfs-client-123",
  "sprint_id": "current-sprint-id",
  "title": "Reach out to 10 qualified leads from this week",
  "description": "Contact details and outreach templates generated",
  "status": "pending",
  "priority": "high",
  "due_date": "2025-12-07"
}
```

**Client sees:**
- Sprint board → New task
- "Reach out to 10 qualified leads"
- Can mark complete, reassign, etc.

---

## Implementation Strategy

### **Phase 1: Manual Integration (Week 1)**

**Goal:** Prove the concept with one client

**Steps:**
1. Pick one Maggie Forbes client
2. Run Unbound.team lead gen manually
3. Export results as CSV
4. Import to GMP via `/api/contacts` bulk upload
5. Show client results in GMP dashboard
6. Validate they never know it's automated

**Success Metric:**
- Client sees 50 leads in GMP
- Logs in, views them, provides feedback
- Never asks "how did you get these?"

---

### **Phase 2: Semi-Automated (Week 2-3)**

**Goal:** Automate the data push

**Build:**
```javascript
// unbound-team/services/gmp-sync.js

class GMPSync {
  async pushLeads(leads, clientTenantId) {
    for (const lead of leads) {
      await fetch(GMP_API_URL + '/api/contacts', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.GMP_API_KEY}`,
          'Content-Type': 'application/json',
          'x-tenant-id': clientTenantId
        },
        body: JSON.stringify({
          full_name: lead.name,
          email: lead.email,
          company: lead.company,
          stage: 'lead',
          lead_source: 'Strategic Lead Generation',
          notes: this.formatLeadNotes(lead)
        })
      });
    }
  }

  formatLeadNotes(lead) {
    return `
Fit Score: ${lead.fitScore}/10
Pain Points: ${lead.painPoints}
Industry: ${lead.industry}
Source: ${lead.source}

Recommended Outreach:
${lead.outreachTip}
    `.trim();
  }

  async pushContent(content, clientTenantId) {
    // Similar pattern for content
  }

  async pushResearch(research, clientTenantId) {
    // Similar pattern for research
  }
}

module.exports = new GMPSync();
```

**Usage:**
```javascript
// When you run lead gen for a client
const leads = await unboundTeam.generateLeads({
  targetIndustry: 'SaaS founders',
  count: 50
});

// Auto-push to their GMP dashboard
await gmpSync.pushLeads(leads, 'mfs-client-123');

// Client sees results immediately in GMP
```

---

### **Phase 3: Fully Automated (Week 4+)**

**Goal:** Set it and forget it

**Build:**
```javascript
// Cron job that runs daily/weekly for each client
// unbound-team/automation/client-automation.js

const schedule = require('node-cron');
const partnerManager = require('./services/partner-manager');
const gmpSync = require('./services/gmp-sync');

// Run daily at 6am
schedule.schedule('0 6 * * *', async () => {
  console.log('Running daily client automation...');

  // Get all Maggie Forbes consulting clients
  const clients = await partnerManager.getClientsBy Tenant('maggie-forbes');

  for (const client of clients) {
    if (client.plan === 'consulting') {
      // Generate leads
      const leads = await unboundTeam.generateLeads({
        targetIndustry: client.settings.target_industry,
        count: client.settings.leads_per_week || 20
      });

      // Push to GMP
      await gmpSync.pushLeads(leads, client.gmp_tenant_id);

      // Generate content (weekly)
      if (new Date().getDay() === 1) { // Monday
        const content = await unboundTeam.createContent({
          topic: client.settings.content_topics[0],
          type: 'blog',
          wordCount: 1500
        });

        await gmpSync.pushContent(content, client.gmp_tenant_id);
      }

      // Log activity
      console.log(`✅ Generated leads for ${client.name}`);
    }
  }
});
```

**Result:**
- Every morning at 6am, all clients get fresh leads
- Every Monday, new blog posts appear
- All automatic, invisible
- You just monitor the logs

---

## Client Configuration

### **How to Configure Each Client:**

```javascript
// When you onboard a new Maggie Forbes client

// 1. Provision in Unbound.team
await partnerManager.provisionClient({
  tenantSlug: 'maggie-forbes',
  userEmail: 'ceo@bigclient.com',
  userName: 'John Smith',
  plan: 'consulting',
  source: 'maggie-forbes-consulting'
});

// 2. Link to their GMP tenant
await db.query(`
  UPDATE tenant_users
  SET settings = jsonb_set(
    COALESCE(settings, '{}'),
    '{gmp_tenant_id}',
    '"gmp-bigclient-123"'
  )
  WHERE tenant_id = 'maggie-forbes'
  AND email = 'ceo@bigclient.com'
`);

// 3. Configure automation preferences
await db.query(`
  UPDATE tenant_users
  SET settings = settings || '{
    "automation": {
      "leads_per_week": 50,
      "content_per_week": 2,
      "research_per_month": 4,
      "target_industry": "SaaS founders",
      "content_topics": ["scaling", "fundraising", "growth"]
    }
  }'::jsonb
  WHERE email = 'ceo@bigclient.com'
`);

// Now this client is fully automated!
```

---

## GMP Database Schema Extensions

### **Tables to Add to GMP:**

```sql
-- Track Unbound.team generated items
CREATE TABLE unbound_jobs (
  id SERIAL PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  job_type TEXT, -- 'lead_gen', 'content', 'research'
  job_id TEXT, -- Unbound.team job ID
  status TEXT, -- 'queued', 'completed', 'synced_to_gmp'
  items_generated INTEGER,
  items_synced INTEGER,
  created_at TIMESTAMP DEFAULT NOW(),
  synced_at TIMESTAMP
);

-- Generated content library
CREATE TABLE generated_content (
  id SERIAL PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  content_type TEXT, -- 'blog', 'social', 'email'
  title TEXT,
  content TEXT,
  status TEXT DEFAULT 'draft', -- 'draft', 'ready', 'published'
  seo_meta JSONB,
  unbound_job_id TEXT,
  created_by TEXT DEFAULT 'AI Lead Generation',
  created_at TIMESTAMP DEFAULT NOW()
);

-- Research reports
CREATE TABLE research_reports (
  id SERIAL PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  report_type TEXT, -- 'competitor', 'market_gap', 'pricing'
  title TEXT,
  summary TEXT,
  content JSONB, -- Structured report data
  unbound_job_id TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Automation settings per tenant
CREATE TABLE automation_settings (
  tenant_id TEXT PRIMARY KEY,
  leads_per_week INTEGER DEFAULT 20,
  content_per_week INTEGER DEFAULT 2,
  research_per_month INTEGER DEFAULT 1,
  target_industries TEXT[],
  content_topics TEXT[],
  enabled BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

---

## Security & Access Control

### **API Key Management:**

```javascript
// Generate GMP API key for Unbound.team
// Store in Unbound.team .env:
GMP_API_URL=https://growthmanagerpro.com
GMP_API_KEY=gmp_live_abc123xyz789

// In GMP, create special API key for Unbound.team
// With permissions:
// - create contacts
// - create campaigns
// - create deals
// - read tenant info
// But NOT:
// - delete anything
// - modify billing
// - access other tenants
```

### **Tenant Isolation:**

```javascript
// Every API call includes tenant_id
// GMP validates the tenant belongs to the API key
// Unbound.team can only write to authorized tenants

// Example: Unbound.team API call
fetch(GMP_API_URL + '/api/contacts', {
  headers: {
    'Authorization': `Bearer ${GMP_API_KEY}`,
    'x-tenant-id': 'mfs-client-123' // Must be authorized
  }
});

// GMP validates:
// - API key is valid
// - API key has permission for tenant 'mfs-client-123'
// - If not, returns 403 Forbidden
```

---

## Monitoring & Logging

### **Track Integration Health:**

```javascript
// unbound-team/services/gmp-monitor.js

class GMPMonitor {
  async logSync(type, tenantId, itemsCount, success) {
    await supabase.from('gmp_sync_log').insert({
      sync_type: type, // 'leads', 'content', 'research'
      tenant_id: tenantId,
      items_synced: itemsCount,
      success: success,
      synced_at: new Date().toISOString()
    });
  }

  async getSyncStats(tenantId) {
    const { data } = await supabase
      .from('gmp_sync_log')
      .select('*')
      .eq('tenant_id', tenantId)
      .gte('synced_at', new Date(Date.now() - 30*24*60*60*1000).toISOString());

    return {
      total_syncs: data.length,
      successful: data.filter(d => d.success).length,
      failed: data.filter(d => !d.success).length,
      leads_synced: data.filter(d => d.sync_type === 'leads').reduce((sum, d) => sum + d.items_synced, 0),
      content_synced: data.filter(d => d.sync_type === 'content').length
    };
  }
}
```

**Admin Dashboard Shows:**
```
Unbound.team → GMP Sync Status

Last 30 Days:
✅ 450 leads synced
✅ 24 content pieces synced
✅ 8 research reports synced
❌ 2 failed syncs (retry completed)

By Client:
- BigClient Inc: 50 leads, 2 blog posts
- StartupCo: 30 leads, 1 research report
- ...
```

---

## Testing Plan

### **Week 1: Manual Test**

1. Generate 10 leads via Unbound.team
2. Manually POST to GMP `/api/contacts`
3. Log into GMP dashboard
4. Verify leads appear correctly
5. Check formatting, data integrity

### **Week 2: Automated Test (Staging)**

1. Set up staging GMP tenant
2. Run automated sync script
3. Generate 50 leads + 2 blog posts
4. Verify all data syncs correctly
5. Test error handling (network failures, etc.)

### **Week 3: Production Pilot**

1. Pick one trusted Maggie Forbes client
2. Run automation for 1 week
3. Monitor daily syncs
4. Get client feedback
5. Iterate based on feedback

### **Week 4: Full Rollout**

1. Enable for all Maggie Forbes consulting clients
2. Enable for GMP clients who want it
3. Monitor at scale
4. Automated alerts for any failures

---

## Cost Considerations

### **Unbound.team Costs:**
- AI API: $5-20/day depending on volume
- Infrastructure: $200-500/mo

### **GMP Costs:**
- No additional cost (already running)
- Slight increase in database size (negligible)

### **Total Additional Cost:**
- ~$300-800/month for automation
- Serving clients paying $25K+/month
- **ROI: Massive**

---

## Next Steps

1. **Read GMP API docs** - Understand endpoints in detail
2. **Set up API key** - Generate Unbound.team → GMP API key
3. **Build sync service** - Create `gmp-sync.js` module
4. **Test manually** - POST 10 leads to one client's GMP
5. **Automate** - Cron job for daily/weekly syncs
6. **Monitor** - Dashboard tracking sync health
7. **Scale** - Roll out to all clients

---

**Ready to build the integration?** 🚀

This makes Unbound.team your invisible automation engine, and GMP the client-facing dashboard. Clients see professional results in GMP, never know it's all automated behind the scenes.
