# 🤖 HYBRID AUTOMATION SYSTEM
## Scheduled + On-Demand: The Best of Both Worlds

---

## 🎯 WHAT YOU HAVE NOW

A **hybrid automation system** that combines:
- ✅ **Scheduled automation** - Runs automatically on schedule
- ✅ **On-demand triggers** - Manual control when you need it
- ✅ **Autonomous discovery** - AI finds opportunities 24/7
- ✅ **Social proof automation** - Case studies & testimonials auto-generated

---

## 📅 SCHEDULED AUTOMATIONS

### **1. Partner Lead Generation**
**Schedule:** Weekly, Monday 9am
**What it does:**
- Automatically generates leads for partners who enable it
- Maggie Forbes: 20 high-end business leads
- Growth Manager Pro: 50 solopreneur leads
- Emails results automatically

**Enable it:**
```bash
# Run this SQL in Supabase to enable for Maggie Forbes
UPDATE partner_automation_preferences
SET lead_gen_enabled = TRUE
WHERE tenant_id = (SELECT id FROM tenants WHERE slug = 'maggie-forbes');
```

### **2. Opportunity Discovery**
**Schedule:** Every hour
**What it does:**
- Scans RSS feeds (Indie Hackers, TechCrunch, etc.)
- Scrapes forums (Reddit, Hacker News)
- Finds entrepreneur pain points
- Saves to discovered_opportunities table
- Notifies if high-value opportunities found (fit score 8+)

**Always running** - No need to enable

### **3. Testimonial Collection**
**Schedule:** Daily, 10am
**What it does:**
- Finds jobs completed 24 hours ago
- Emails users requesting feedback
- Auto-collects testimonials
- Generates case studies

**Always running** - No need to enable

### **4. Revenue Calculation**
**Schedule:** 1st of every month, 9am
**What it does:**
- Calculates monthly revenue for all partners
- Computes 50/50 revenue share
- Saves to tenant_revenue table
- Ready for payout reports

**Always running** - No need to enable

### **5. Cross-Promotion**
**Schedule:** Daily, 2pm
**What it does:**
- Sends scheduled cross-promotion campaigns
- Shares case studies across all 3 brands
- Emails users about success stories
- Tracks opens, clicks, conversions

**Always running** - No need to enable

---

## 🎮 ON-DEMAND TRIGGERS

### **Manual Lead Generation**

**For Partners (Maggie/GMP) to find their own clients:**
```bash
# Trigger lead gen for Maggie Forbes RIGHT NOW
curl -X POST http://localhost:3001/api/automation/trigger/lead-gen/maggie-forbes \
  -H "Content-Type: application/json" \
  -d '{
    "targetIndustry": "high-end business owners needing strategy",
    "location": "USA",
    "criteria": {
      "count": 20,
      "minScore": 8
    }
  }'
```

**For End-Users (via test-leads.html):**
- Go to https://unboundteam-three.vercel.app/test-leads.html
- Fill out form
- Click "Generate Leads"
- Get results in 2-10 minutes

### **Manual Opportunity Scan**

**Trigger immediate scan of all RSS/forums:**
```bash
curl -X POST http://localhost:3001/api/automation/trigger/opportunity-scan

# Response:
{
  "success": true,
  "message": "Found 15 opportunities",
  "opportunities": [...]
}
```

### **Check Automation Status**

```bash
curl http://localhost:3001/api/automation/status

# Response:
{
  "running": true,
  "jobs": 5,
  "schedules": [
    { "name": "Partner Lead Generation", "schedule": "Weekly Mon 9am" },
    { "name": "Opportunity Discovery", "schedule": "Hourly" },
    { "name": "Testimonial Collection", "schedule": "Daily 10am" },
    { "name": "Revenue Calculation", "schedule": "Monthly 1st 9am" },
    { "name": "Cross-Promotion", "schedule": "Daily 2pm" }
  ]
}
```

---

## ⚙️ CONFIGURATION

### **Enable Weekly Auto Lead Gen for Maggie Forbes**

1. **Run SQL in Supabase:**
```sql
-- Enable weekly lead generation
UPDATE partner_automation_preferences
SET
  lead_gen_enabled = TRUE,
  leads_per_run = 20,
  target_industry = 'high-end business owners seeking strategic help',
  min_fit_score = 8,
  notification_email = 'maggie@maggieforbes.com'
WHERE tenant_id = (SELECT id FROM tenants WHERE slug = 'maggie-forbes');
```

2. **Result:**
- Every Monday at 9am, 20 leads automatically generated
- Emailed to maggie@maggieforbes.com
- CSV attached
- Fit score 8+ only (high quality)

### **Enable for Growth Manager Pro**

```sql
UPDATE partner_automation_preferences
SET
  lead_gen_enabled = TRUE,
  leads_per_run = 50,
  target_industry = 'solopreneurs struggling with growth',
  min_fit_score = 6,
  notification_email = 'growth@growthmangerpro.com'
WHERE tenant_id = (SELECT id FROM tenants WHERE slug = 'growth-manager-pro');
```

---

## 📊 AUTOMATION WORKFLOWS

### **Workflow 1: Scheduled Partner Lead Gen**

```
Monday 9am → Automation Scheduler Triggers
    ↓
Check partner_automation_preferences
    ├─→ Maggie Forbes: lead_gen_enabled = TRUE
    └─→ Generate 20 leads
        ↓
AI Scans Web
    ├─→ Reddit, LinkedIn, forums
    ├─→ Finds high-end business owners
    └─→ Scores fit (8-10 only)
        ↓
Email Results
    ├─→ To: maggie@maggieforbes.com
    ├─→ Subject: "Your Weekly 20 Leads"
    └─→ CSV attached
```

### **Workflow 2: Autonomous Opportunity Discovery**

```
Every Hour → Automation Scheduler Triggers
    ↓
RSS Monitor Scans
    ├─→ Indie Hackers feed
    ├─→ TechCrunch feed
    ├─→ Entrepreneur feed
    └─→ Finds 5 pain points
        ↓
Forum Scraper Scans
    ├─→ r/entrepreneur
    ├─→ r/startups
    ├─→ Hacker News
    └─→ Finds 10 questions
        ↓
Save to Database
    ├─→ discovered_opportunities table
    └─→ Total: 15 opportunities found
        ↓
If High Value (fit >= 8)
    ├─→ Send notification
    └─→ "3 high-value opportunities found!"
```

### **Workflow 3: Social Proof Automation**

```
Daily 10am → Testimonial Collection Runs
    ↓
Find Jobs Completed 24hrs Ago
    ├─→ Job #1: Lead gen for Client A (completed yesterday)
    ├─→ Job #2: Content creation for Client B
    └─→ Job #3: Market research for Client C
        ↓
Email Each Client
    ├─→ "How did we do?"
    ├─→ Rating 1-5 stars
    └─→ Optional testimonial
        ↓
If Rating >= 4
    ├─→ Request testimonial
    ├─→ Auto-generate case study
    └─→ Publish across all 3 brands
```

---

## 🎯 USE CASES

### **Use Case 1: Maggie Forbes - Set It and Forget It**

**Setup (one-time):**
```sql
UPDATE partner_automation_preferences
SET lead_gen_enabled = TRUE
WHERE tenant_id = (SELECT id FROM tenants WHERE slug = 'maggie-forbes');
```

**Every Monday:**
- 9am: 20 new high-end business leads in inbox
- Maggie reviews, reaches out
- Signs 1-2 clients per month at $10K each
- **ROI:** $0 automation cost → $20K-40K revenue/month

### **Use Case 2: On-Demand Lead Gen**

**When Maggie needs leads NOW:**
```bash
# Manual trigger via API
curl -X POST http://localhost:3001/api/automation/trigger/lead-gen/maggie-forbes \
  -d '{"targetIndustry":"SaaS founders","criteria":{"count":30}}'

# Or use the UI
# Go to: test-leads.html
# Fill form, click button
```

### **Use Case 3: GMP Student Success**

**Setup:**
- GMP student provisioned automatically when enrolls
- Week 1 homework: "Generate 10 leads"
- Student clicks button
- Gets 10 leads instantly
- Succeeds faster → Better testimonials

---

## 📈 MONITORING

### **Check What's Running**

```bash
# Get automation status
curl http://localhost:3001/api/automation/status

# Get automation log for Maggie Forbes
curl http://localhost:3001/api/automation/maggie-forbes/log

# Get automation stats
curl http://localhost:3001/api/automation/maggie-forbes/stats
```

### **View in Database**

```sql
-- See all automation runs
SELECT * FROM automation_log
ORDER BY created_at DESC
LIMIT 20;

-- See Maggie Forbes lead gen runs
SELECT * FROM automation_log
WHERE tenant_id = (SELECT id FROM tenants WHERE slug = 'maggie-forbes')
  AND automation_type = 'lead_generation'
ORDER BY created_at DESC;

-- See discovered opportunities
SELECT * FROM discovered_opportunities
WHERE fit_score >= 8
ORDER BY created_at DESC;
```

---

## 💡 BEST PRACTICES

### **Recommended Setup**

**For Maggie Forbes:**
- ✅ Enable weekly scheduled lead gen (20 leads/week)
- ✅ Keep opportunity discovery running (finds unexpected opportunities)
- ✅ Enable testimonial collection (builds social proof)
- ✅ Use manual triggers when need leads urgently

**For Growth Manager Pro:**
- ✅ Enable weekly scheduled lead gen (50 leads/week)
- ✅ Auto-provision students when they enroll
- ✅ Make it part of Week 1 curriculum
- ✅ Collect testimonials automatically

**For Unbound.team (Direct Users):**
- ✅ 100% on-demand (test-leads.html)
- ✅ Let social proof automation run in background
- ✅ Cross-promote success stories from Maggie/GMP

---

## 🚀 DEPLOYMENT

### **Step 1: Deploy Database Schema**

```bash
# Run in Supabase SQL Editor
# File: supabase-automation-schema.sql
```

### **Step 2: Backend Auto-Deploys**

- Push to GitHub
- Railway/Render auto-deploys
- Automation scheduler starts automatically

### **Step 3: Enable Partners**

```sql
-- Enable Maggie Forbes
UPDATE partner_automation_preferences
SET lead_gen_enabled = TRUE
WHERE tenant_id = (SELECT id FROM tenants WHERE slug = 'maggie-forbes');

-- Enable GMP
UPDATE partner_automation_preferences
SET lead_gen_enabled = TRUE
WHERE tenant_id = (SELECT id FROM tenants WHERE slug = 'growth-manager-pro');
```

### **Step 4: Test It**

```bash
# Manual trigger to test
curl -X POST http://localhost:3001/api/automation/trigger/lead-gen/maggie-forbes \
  -H "Content-Type: application/json" \
  -d '{"targetIndustry":"test","criteria":{"count":5}}'

# Check status
curl http://localhost:3001/api/automation/status
```

---

## 🎉 YOU NOW HAVE

**Scheduled Automation:**
- ✅ Weekly lead gen for partners
- ✅ Hourly opportunity discovery
- ✅ Daily testimonial collection
- ✅ Monthly revenue calculation
- ✅ Daily cross-promotion

**On-Demand Control:**
- ✅ Manual lead gen triggers (API + UI)
- ✅ Manual opportunity scans
- ✅ Full control when needed

**Autonomous Intelligence:**
- ✅ AI discovers opportunities 24/7
- ✅ Auto-generates case studies
- ✅ Cross-promotes across brands
- ✅ Builds social proof automatically

**The Perfect Hybrid:**
- Set it and forget it when you want automation
- Full control when you need it
- Best of both worlds! 🔥

---

## 📞 API REFERENCE

### **Automation Endpoints**

```
GET  /api/automation/status                              # Check if running
POST /api/automation/trigger/lead-gen/:tenantSlug       # Manual lead gen
POST /api/automation/trigger/opportunity-scan            # Manual opp scan
GET  /api/automation/:tenantSlug/log                     # View automation log
GET  /api/automation/:tenantSlug/stats                   # View stats
```

---

**Your hybrid system is ready! Deploy and let it run! 🚀**
