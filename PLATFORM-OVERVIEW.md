# Unbound.team Platform Overview

## What This Platform Does

Unbound.team is an **AI-powered business automation platform** that serves two purposes:

1. **Client Acquisition Engine** - Automatically finds potential customers for your businesses
2. **SaaS Product** - Provides AI tools that clients use to grow their own businesses

---

## The Business Model

### **Two Brands, One Platform:**

```
┌──────────────────────────────────────────────────────────┐
│                    MAGGIE FORBES STRATEGIES               │
│              Strategic Business Consulting                │
│                                                          │
│  Target: High-end business clients, executives           │
│  Pricing: $2,500 - $10,000+/month                       │
│                                                          │
│  Tier 1 ($2,500/mo): Strategy consulting only            │
│  Tier 2 ($5,000/mo): Consulting + GMP Premium included   │
│  Tier 3 ($10,000/mo): Done-for-you managed service       │
└──────────────────────────────────────────────────────────┘
                            ▼
            (Premium clients get access to)
                            ▼
┌──────────────────────────────────────────────────────────┐
│                  GROWTH MANAGER PRO                       │
│               AI-Powered Growth Tools                     │
│                                                          │
│  Target: Solopreneurs, small businesses                  │
│  Pricing: $50 - $150/month                              │
│                                                          │
│  Standalone product: Direct signups                      │
│  Also included: For Maggie Forbes Tier 2+ clients       │
│                                                          │
│  Powered by: Unbound.team backend                       │
└──────────────────────────────────────────────────────────┘
```

---

## What Unbound.team Does (Technical Overview)

### **Core Function 1: Partner Lead Generation (Finding Clients FOR You)**

**Purpose:** Automatically find potential customers for Maggie Forbes and Growth Manager Pro

**How It Works:**
1. **Weekly automation runs** (every Monday 9am)
2. **Scans multiple sources:**
   - Reddit (r/Entrepreneur, r/smallbusiness, etc.)
   - Twitter/X
   - Indie Hackers
   - Product Hunt discussions
   - LinkedIn posts
   - HackerNews
3. **AI analyzes posts** to find people with pain points
4. **Scores leads** based on fit (1-10 scale)
5. **Sends you curated list** via email

**Output Example:**
```
Weekly Lead Report - Maggie Forbes
20 leads found (avg fit score: 8.2/10)

Lead #1:
- Name: Sarah Johnson
- Company: TechStartup Inc
- Source: Reddit r/Entrepreneur
- Pain Points: Scaling challenges, need strategic help
- Fit Score: 9/10
- URL: reddit.com/r/Entrepreneur/post123
- Suggested Outreach: "Hi Sarah, saw your post about scaling..."

Lead #2:
...
```

**Configuration:**
```javascript
// Maggie Forbes Settings
{
  brand: "maggie-forbes",
  schedule: "weekly",
  leads_per_run: 20,
  target_industry: "VP/Director level at companies with 50-500 employees",
  pain_points: ["scaling", "operations", "strategy"],
  min_fit_score: 8,
  notification_email: "kristi@maggieforbes.com"
}

// Growth Manager Pro Settings
{
  brand: "growth-manager-pro",
  schedule: "weekly",
  leads_per_run: 50,
  target_industry: "Solopreneurs on Reddit/Twitter",
  pain_points: ["time management", "growth", "marketing"],
  min_fit_score: 6,
  notification_email: "hello@growthmangerpro.com"
}
```

---

### **Core Function 2: Client SaaS Tools (What Clients Use)**

**Purpose:** Provide AI-powered tools that clients use to grow THEIR businesses

When a client pays you and gets access to Growth Manager Pro, they can use 5 core solutions:

#### **Solution 1: Lead Generation**
**What it does:** Finds potential customers for the CLIENT's business

**Example:**
- Client: E-commerce store owner
- Input: "Find people looking for eco-friendly products"
- Output: 50 qualified leads with contact info, pain points, outreach tips
- Format: CSV download + dashboard view

**Technical Flow:**
```
1. Client submits job via UI
2. Job added to Supabase queue
3. Queue worker picks up job
4. AI scans sources (Reddit, Twitter, etc.)
5. AI analyzes and scores leads
6. Results stored in database
7. Client downloads CSV or views in dashboard
```

#### **Solution 2: Content Creation**
**What it does:** Creates marketing content for the CLIENT's business

**Example:**
- Client: SaaS founder
- Input: "Write blog post about project management for remote teams"
- Output: 1,500-word SEO-optimized blog post + social media posts
- Format: Markdown, HTML, plain text

**Features:**
- Blog posts (800-2000 words)
- Social media posts (LinkedIn, Twitter, Facebook)
- Product descriptions
- Email copy
- SEO optimization

#### **Solution 3: Market Research**
**What it does:** Analyzes competitors and market opportunities for the CLIENT

**Example:**
- Client: Agency owner
- Input: "Research my top 5 competitors in marketing automation"
- Output: Comprehensive report with:
  - Competitor feature comparison
  - Pricing analysis
  - Market gaps
  - Positioning recommendations
  - TAM/SAM/SOM estimates

#### **Solution 4: Landing Page Builder**
**What it does:** Creates sales pages for the CLIENT's products

**Example:**
- Client: Course creator
- Input: "Build landing page for my SEO course"
- Output: Complete HTML/CSS responsive page with:
  - Hero section
  - Features
  - Social proof
  - FAQ
  - CTA buttons
  - Mobile-optimized

#### **Solution 5: Email Marketing**
**What it does:** Generates email campaigns for the CLIENT's audience

**Example:**
- Client: Newsletter creator
- Input: "Create 5-email welcome sequence"
- Output: Complete email sequence with:
  - Subject line variations
  - Email body copy
  - CTA recommendations
  - Send time optimization
  - Automation flow diagram

---

## Multi-Tenant Architecture

### **How Clients Are Organized:**

**Single Tenant (Your Business Empire):**
```javascript
{
  tenant_id: "00000000-0000-0000-0000-000000000001",
  name: "Kristi's Business Empire",
  slug: "kristi-empire",
  type: "main"
}
```

**Two Brands Under One Tenant:**
1. **Maggie Forbes** - High-end consulting
2. **Growth Manager Pro** - Self-service tools

**Client Records:**
```javascript
// Maggie Forbes Tier 2 Client
{
  user_id: "sarah-123",
  tenant_id: "00000000-0000-0000-0000-000000000001",
  primary_brand: "maggie-forbes",
  consulting_tier: "premium",
  consulting_fee: 5000,
  gmp_access: true,        // Gets GMP premium included
  gmp_plan: "premium",
  plan_limits: { problems_per_month: 9999 } // Unlimited
}

// Growth Manager Pro Direct Client
{
  user_id: "john-456",
  tenant_id: "00000000-0000-0000-0000-000000000001",
  primary_brand: "growth-manager-pro",
  consulting_tier: null,
  consulting_fee: 0,
  gmp_access: true,
  gmp_plan: "growth",
  plan_limits: { problems_per_month: 50 }
}
```

**Key Benefits:**
- ✅ One database, one backend
- ✅ Unified revenue dashboard
- ✅ Easy cross-promotion
- ✅ Shared social proof
- ✅ Clients completely separated (they never see each other)

---

## Technical Stack

### **Backend:**
- **Framework:** Node.js + Express
- **Database:** Supabase (PostgreSQL)
- **Queue System:** Supabase-based queue (no Redis needed)
- **AI:** Anthropic Claude API
- **Hosting:** Railway (backend) + Vercel (frontend)

### **Key Services:**

```
backend/
├── server.js                    # Main API server
├── services/
│   ├── lead-generator.js        # Solution 1: Find leads
│   ├── content-creator.js       # Solution 2: Create content
│   ├── market-researcher.js     # Solution 3: Market research
│   ├── landing-page-builder.js  # Solution 4: Landing pages
│   ├── email-marketer.js        # Solution 5: Email campaigns
│   ├── automation-scheduler.js  # Weekly partner lead gen
│   ├── partner-manager.js       # Multi-tenant management
│   ├── supabase-queue.js        # Job queue system
│   └── queue-worker.js          # Background job processor
```

### **Database Tables:**

**Multi-Tenant:**
- `tenants` - Your business empire
- `tenant_users` - All clients (both brands)
- `tenant_revenue` - Revenue tracking

**Queue System:**
- `job_queue` - Background jobs
- `ai_usage` - AI API cost tracking
- `daily_spending` - Cost monitoring

**Solutions:**
- `generated_content` - Client solutions output
- `market_research` - Research results
- `landing_pages` - Generated pages
- `email_campaigns` - Email sequences

**Automation:**
- `automation_log` - Partner lead gen runs
- `partner_automation_preferences` - Settings per brand
- `automation_schedules` - Cron job configs

**Social Proof:**
- `social_proof` - Testimonials & case studies
- `cross_promotion_campaigns` - Email campaigns

---

## User Journeys

### **Journey 1: Maggie Forbes Client (Premium Tier)**

**Week 1:**
1. Sarah finds Maggie Forbes via LinkedIn
2. Books strategy call at maggieforbes.com
3. Signs up for $5,000/month Premium tier
4. Receives email with:
   - Slack invite
   - GMP login (app.growthmangerpro.com)
   - Onboarding checklist

**Week 2:**
1. Sarah logs into app.growthmangerpro.com
2. Dashboard shows "Premium Member" badge
3. She generates 100 leads for her business (no limits)
4. Downloads CSV, starts outreach
5. Has strategy session with you via Slack

**Month 3:**
1. Sarah's business grows 40% using the tools
2. She sends testimonial
3. You create case study
4. Post on both MaggieForbes.com and GrowthManagerPro.com

**Result:**
- You earn: $5,000/month
- Sarah gets: Consulting + unlimited AI tools
- Social proof: Case study for future leads

---

### **Journey 2: Growth Manager Pro Direct Client**

**Week 1:**
1. John sees Twitter ad for Growth Manager Pro
2. Signs up directly at growthmangerpro.com
3. Pays $150/month for Growth plan
4. Receives email with login credentials

**Week 2:**
1. John logs into app.growthmangerpro.com
2. Dashboard shows usage limits (200 leads/month)
3. Generates 50 leads for his SaaS
4. Creates 10 blog posts
5. Builds landing page for his product

**Month 6:**
1. John hits usage limits consistently
2. You send upgrade offer: "Upgrade to Maggie Forbes Premium?"
3. John books strategy call
4. Converts to $5,000/month consulting client

**Result:**
- You earn: $150/month → $5,000/month (33x increase)
- John gets: Self-service tools → Full consulting
- Growth: Upsell path working perfectly

---

### **Journey 3: Automated Lead Generation FOR Your Businesses**

**Every Monday at 9am:**

**Maggie Forbes Lead Gen:**
```
1. Automation runs automatically
2. Scans Reddit, Twitter, LinkedIn
3. Finds 20 high-quality prospects:
   - VP-level executives
   - Companies with 50-500 employees
   - Discussing scaling challenges
   - Fit score: 8+/10

4. Email sent to kristi@maggieforbes.com:
   Subject: Weekly Leads - 20 New Prospects (Avg Score: 8.5/10)

5. You review leads, pick top 5
6. Send personalized LinkedIn messages
7. 2 book strategy calls
8. 1 converts to $5k/month client

Cost: ~$2 in AI API calls
Revenue: $5,000/month
ROI: 2,500x
```

**Growth Manager Pro Lead Gen:**
```
1. Automation runs automatically
2. Scans Reddit, Twitter, Indie Hackers
3. Finds 50 solopreneur prospects:
   - Struggling with time/growth
   - Active on social media
   - Fit score: 6+/10

4. Email sent to hello@growthmangerpro.com
5. You (or VA) reaches out
6. 10 book demo calls
7. 3 sign up for $50-150/month

Cost: ~$3 in AI API calls
Revenue: $300/month
ROI: 100x
```

---

## Revenue Model

### **Your Revenue Streams:**

**1. Maggie Forbes Consulting:**
```
Tier 1: $2,500/month × 5 clients  = $12,500
Tier 2: $5,000/month × 10 clients = $50,000
Tier 3: $10,000/month × 2 clients = $20,000
────────────────────────────────────────────
Total: $82,500/month ($990,000/year)
```

**2. Growth Manager Pro Direct:**
```
Starter: $50/month × 20 clients   = $1,000
Growth:  $150/month × 30 clients  = $4,500
────────────────────────────────────────────
Total: $5,500/month ($66,000/year)
```

**3. Combined Total:**
```
$88,000/month
$1,056,000/year
```

**Costs:**
- AI API: ~$500/month
- Hosting: ~$50/month (Railway + Vercel)
- Supabase: Free tier (or $25/month)
────────────────────────────────────────
Net: ~$87,500/month ($1,050,000/year)
```

---

## What Makes This Platform Unique

### **1. Dual Purpose:**
- Finds clients FOR you (partner automation)
- Clients use it for THEIR businesses (SaaS revenue)

### **2. Compounding Growth:**
```
Week 1: Find 20 leads → Close 1 client → $5k/month
Week 2: Client uses tools → Gets results → Testimonial
Week 3: Find 20 MORE leads → Show testimonial → Higher conversion
Week 4: Close 2 clients → $10k/month total
Week 8: 5 clients × $5k = $25k/month
Week 12: 10 clients × $5k = $50k/month
```

### **3. Zero Customer Acquisition Cost:**
- No paid ads needed
- AI finds leads automatically
- Word-of-mouth from happy clients
- Case studies drive organic traffic

### **4. High Retention:**
- Clients get real value (tools work)
- Sticky product (they integrate it into workflow)
- Upsell path (GMP → Maggie Forbes)

---

## Current Status

### **✅ What's Built:**
- ✓ Backend API server
- ✓ Multi-tenant database schema
- ✓ Queue system
- ✓ Lead generation service (tested and working!)
- ✓ Automation scheduler (5 scheduled jobs)
- ✓ Partner provisioning
- ✓ Revenue tracking
- ✓ Brand separation logic

### **⏳ What's Next:**
- Deploy to Railway (5 minutes)
- Build simple frontend UI
- Add Stripe billing
- Create email templates
- Launch to first 10 clients

---

## Summary

**Unbound.team is:**

1. **A Client Acquisition Engine** that finds leads for Maggie Forbes and Growth Manager Pro automatically every week

2. **A SaaS Platform** that clients pay to access (Growth Manager Pro) to get AI-powered business tools

3. **A Multi-Tenant System** that manages both brands under one infrastructure

4. **A Revenue Multiplier** that compounds through:
   - Automated lead generation
   - Client tool usage
   - Social proof creation
   - Referral generation
   - Upsell paths

**The Vision:**
Build a $1M+/year business with minimal customer acquisition cost by:
- Letting AI find clients for you
- Delivering massive value through AI tools
- Creating word-of-mouth through client success
- Compounding growth over time

**Current Test Results:**
✅ Lead generation: Working (generated 5 test leads)
✅ Queue system: Working (job completed successfully)
✅ Database: Connected and operational
✅ Automation: 5 jobs scheduled
✅ Cost: <$5/month in current testing

**Next Milestone:**
Get first paying client using automated lead generation within 30 days.
