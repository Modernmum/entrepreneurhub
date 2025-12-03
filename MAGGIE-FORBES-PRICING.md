# Maggie Forbes Strategies - Tiered Pricing Model

## Complete Offering Structure

```
┌─────────────────────────────────────────────────────────────────┐
│                    MAGGIE FORBES STRATEGIES                      │
│                  Strategic Business Consulting                   │
└─────────────────────────────────────────────────────────────────┘
                              │
        ┌─────────────────────┼─────────────────────┐
        │                     │                     │
   ┌────▼────┐          ┌─────▼─────┐       ┌──────▼──────┐
   │ TIER 1  │          │  TIER 2   │       │   TIER 3    │
   │Strategy │          │ Premium   │       │ Enterprise  │
   │  Only   │          │Strategy + │       │ Done-For-You│
   │         │          │   Tools   │       │             │
   │$2,500/mo│          │ $5,000/mo │       │ $10,000+/mo │
   └─────────┘          └───────────┘       └─────────────┘
        │                     │                     │
        │                     │                     │
        ├─ Consulting         ├─ Consulting         ├─ Consulting
        ├─ Roadmap            ├─ Roadmap            ├─ Roadmap
        ├─ Email Support      ├─ Priority Support   ├─ White Glove
        │                     ├─ Slack Access        ├─ Dedicated AM
        │                     │                     │
        │                     ├─ Growth Manager Pro ├─ Growth Manager Pro
        │                     │   (Premium Access)   │   (Enterprise)
        │                     │   - Unlimited usage  │   - We do it for them
        │                     │   - All 5 solutions  │   - Fully managed
        │                     │   - Priority queue   │   - Custom workflows
        │                     │                     │
   NO GMP ACCESS         GMP INCLUDED!          GMP INCLUDED!
   (can buy separately)  (part of package)      (fully managed)
```

---

## Tier 1: Strategy Only

### **Price: $2,500/month**

### **What's Included:**
✅ Monthly 90-minute strategy session
✅ Custom business roadmap
✅ Email support (48hr response)
✅ Quarterly goal setting
✅ Access to resource library

### **What's NOT Included:**
❌ Growth Manager Pro tools
❌ Slack access
❌ Priority support

### **Best For:**
- Early-stage businesses
- Executives who just need strategic guidance
- Companies with in-house execution teams

### **Upsell Path:**
"Need execution help? Upgrade to Premium for unlimited AI tools."

---

## Tier 2: Premium (Strategy + Tools)

### **Price: $5,000/month**

### **Everything in Tier 1, PLUS:**
✅ **Premium Growth Manager Pro access (included!)**
✅ Slack channel with direct access
✅ Priority support (24hr response)
✅ Bi-weekly check-ins
✅ Custom automations setup

### **Growth Manager Pro Premium Features:**
- **Lead Generation:** Unlimited leads per month
- **Content Creation:** Unlimited blog posts, social media
- **Market Research:** Unlimited competitor analysis
- **Landing Pages:** Unlimited pages
- **Email Marketing:** Unlimited campaigns
- **Priority Processing:** Jobs run first
- **Premium AI Models:** GPT-4, Claude Opus

### **Best For:**
- Growth-stage companies
- Executives who want strategy + execution tools
- Teams that need AI-powered scalability

### **Client Login:**
`app.growthmangerpro.com` (premium tier badge)

---

## Tier 3: Enterprise (Done-For-You)

### **Price: $10,000+/month (custom)**

### **Everything in Tier 2, PLUS:**
✅ **We use the tools FOR you**
✅ Dedicated account manager
✅ White-glove service
✅ Weekly strategy calls
✅ Custom integrations
✅ Quarterly business reviews

### **Done-For-You Services:**
- We generate leads and hand you qualified prospects
- We create all your content
- We build your landing pages
- We set up your email campaigns
- We monitor and optimize everything

### **Best For:**
- Enterprise clients
- Executives with zero time
- Companies wanting fully managed growth

---

## Revenue Examples

### **Scenario 1: Mixed Client Base**

**10 Tier 1 clients** × $2,500 = $25,000/month
**5 Tier 2 clients** × $5,000 = $25,000/month
**2 Tier 3 clients** × $10,000 = $20,000/month

**Total: $70,000/month ($840,000/year)**

---

### **Scenario 2: Premium-Heavy**

**5 Tier 1 clients** × $2,500 = $12,500/month
**15 Tier 2 clients** × $5,000 = $75,000/month
**3 Tier 3 clients** × $12,000 = $36,000/month

**Total: $123,500/month ($1,482,000/year)**

---

## Client Provisioning Process

### **When Client Signs Tier 1 (Strategy Only):**

```sql
-- Provision in database
SELECT provision_maggie_forbes_client(
  'client@example.com',
  'Client Name',
  'strategy'::consulting_tier_type
);
```

**Email sent:**
```
Subject: Welcome to Maggie Forbes Strategies!

Hi [Name],

Welcome aboard! Here's what happens next:

📅 Your Strategy Sessions:
   Book your first call: maggieforbes.com/book

📚 Resources:
   Access library: maggieforbes.com/resources

Need execution tools? Upgrade anytime to add Growth Manager Pro.

- Kristi
```

---

### **When Client Signs Tier 2 (Premium):**

```sql
-- Provision in database
SELECT provision_maggie_forbes_client(
  'client@example.com',
  'Client Name',
  'premium'::consulting_tier_type
);
```

**Email sent:**
```
Subject: Welcome to Maggie Forbes Strategies Premium! 🎉

Hi [Name],

Excited to work together! You have access to:

📅 Your Strategy Sessions:
   Book calls: maggieforbes.com/book

💬 Direct Slack Access:
   Join: maggieforbes.slack.com/invite/[code]

🤖 Your AI Growth Tools (UNLIMITED):
   Login: app.growthmangerpro.com
   Email: [email]
   Password: (separate email)

   Available tools:
   ✓ Lead Generation
   ✓ Content Creation
   ✓ Market Research
   ✓ Landing Page Builder
   ✓ Email Marketing

Let's build something amazing!

- Kristi
```

---

### **When Client Signs Tier 3 (Enterprise):**

```sql
-- Provision in database
SELECT provision_maggie_forbes_client(
  'client@example.com',
  'Client Name',
  'enterprise'::consulting_tier_type
);
```

**Email sent:**
```
Subject: Welcome to Maggie Forbes Strategies Enterprise!

Hi [Name],

Welcome to white-glove service!

Your Dedicated Team:
👤 Account Manager: Sarah Johnson (sarah@maggieforbes.com)
👤 Strategy Lead: Kristi Forbes (kristi@maggieforbes.com)

📅 Your Weekly Strategy Calls:
   Scheduled: Every Tuesday at 10am
   Zoom link: [link]

💬 Your Private Slack Channel:
   Join: #client-[name]

🤖 Your Managed AI Tools:
   We handle everything - you just review results
   Dashboard: app.growthmangerpro.com (view-only)

Next Steps:
1. Kick-off call this Friday
2. Complete onboarding questionnaire
3. Review 90-day roadmap

We're going to do amazing things together.

- Kristi
```

---

## Cross-Sell Opportunities

### **Tier 1 → Tier 2 Upgrade:**

**Trigger:** After 3 months, if they're asking execution questions

**Email:**
```
Subject: Ready for execution help?

Hi [Name],

I noticed you're asking great execution questions in our sessions.

Have you considered upgrading to Premium? You'd get:
- Unlimited AI-powered tools
- Direct Slack access
- Bi-weekly check-ins

It's an extra $2,500/month, but clients typically see 3x ROI
within the first month from time saved alone.

Want to see a demo?

- Kristi
```

---

### **Tier 2 → Tier 3 Upgrade:**

**Trigger:** Client says "I don't have time to use the tools"

**Offer:**
```
I can take this completely off your plate.

For $10k/month, we'll:
- Run all the tools FOR you
- Hand you ready-to-use results
- Manage everything end-to-end

You just show up to weekly calls and approve our work.

Interested?
```

---

## Implementation Checklist

### ✅ Database Setup:
1. Run `ADD-CONSULTING-TIERS.sql` in Supabase
2. Test provisioning function
3. Create Stripe products for each tier

### ✅ Sales Process:
1. Update maggieforbes.com with tier comparison
2. Create proposal templates for each tier
3. Set up Calendly for discovery calls

### ✅ Onboarding:
1. Create welcome email sequences (3 versions)
2. Set up Slack workspace
3. Create GMP premium tier in UI

### ✅ Operations:
1. Document tier-specific SLAs
2. Train support team
3. Set up upgrade triggers

---

## Quick Reference

| Feature | Tier 1 | Tier 2 | Tier 3 |
|---------|--------|--------|--------|
| **Price** | $2,500 | $5,000 | $10,000+ |
| **Strategy Sessions** | ✓ Monthly | ✓ Bi-weekly | ✓ Weekly |
| **GMP Access** | ❌ | ✓ Unlimited | ✓ Managed |
| **Support** | Email | Slack | White-glove |
| **Best For** | Strategy | Strategy + Tools | Fully Managed |

---

**This pricing structure gives you:**
- ✅ Entry point for budget-conscious clients
- ✅ Premium tier with high value
- ✅ Enterprise tier for maximum revenue
- ✅ Clear upgrade path
- ✅ Flexibility for different client needs
