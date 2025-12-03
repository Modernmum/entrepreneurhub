# Brand Architecture: Maggie Forbes vs Growth Manager Pro

## System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│  Kristi's Business Empire (Tenant ID: 000...001)           │
│  Type: main                                                  │
│  Revenue: 100% to you                                       │
└─────────────────────────────────────────────────────────────┘
                            │
                ┌───────────┴───────────┐
                │                       │
        ┌───────▼──────┐        ┌──────▼───────┐
        │ Maggie Forbes│        │Growth Manager│
        │              │        │     Pro      │
        │  Brand Tag:  │        │  Brand Tag:  │
        │maggie-forbes │        │growth-mgr-pro│
        └──────────────┘        └──────────────┘
                │                       │
        ┌───────▼───────┐       ┌──────▼───────┐
        │   Clients     │       │   Clients    │
        │               │       │              │
        │ - High-end    │       │ - Solo-      │
        │   businesses  │       │   preneurs   │
        │ - $150/mo     │       │ - $50/mo     │
        │   plans       │       │   plans      │
        └───────────────┘       └──────────────┘
```

## How Clients Are Distinguished

### 1. At Sign-Up
When a client signs up, we record their brand:

**Maggie Forbes Client:**
```javascript
{
  user_id: "user-abc",
  tenant_id: "00000000-0000-0000-0000-000000000001",
  source: "maggie-forbes",
  primary_brand: "maggie-forbes",
  plan: "growth",  // $150/mo
  referral_code: "MAGGIE50"
}
```

**Growth Manager Pro Client:**
```javascript
{
  user_id: "user-xyz",
  tenant_id: "00000000-0000-0000-0000-000000000001",
  source: "growth-manager-pro",
  primary_brand: "growth-manager-pro",
  plan: "starter",  // $50/mo
  referral_code: "GROWTH30"
}
```

### 2. In The Database

**Query Maggie Forbes clients:**
```sql
SELECT * FROM maggie_forbes_clients;
-- OR
SELECT * FROM get_brand_stats('maggie-forbes');
```

**Query Growth Manager Pro clients:**
```sql
SELECT * FROM growth_manager_pro_clients;
-- OR
SELECT * FROM get_brand_stats('growth-manager-pro');
```

### 3. In The API

**Generate leads for Maggie Forbes:**
```javascript
POST /api/solutions/lead-generation
{
  "userId": "user-abc",
  "brand": "maggie-forbes",
  "targetIndustry": "high-end business clients",
  "criteria": { "count": 20, "minScore": 8 }
}
```

**Generate leads for Growth Manager Pro:**
```javascript
POST /api/solutions/lead-generation
{
  "userId": "user-xyz",
  "brand": "growth-manager-pro",
  "targetIndustry": "solopreneurs",
  "criteria": { "count": 50, "minScore": 6 }
}
```

---

## Revenue Tracking

### All Revenue Goes to You (One Tenant)

```sql
-- Total revenue across both brands
SELECT
  SUM(CASE
    WHEN plan = 'starter' THEN 50
    WHEN plan = 'growth' THEN 150
  END) as total_mrr
FROM tenant_users
WHERE tenant_id = '00000000-0000-0000-0000-000000000001';

-- Breakdown by brand
SELECT
  primary_brand,
  COUNT(*) as clients,
  SUM(CASE
    WHEN plan = 'starter' THEN 50
    WHEN plan = 'growth' THEN 150
  END) as brand_mrr
FROM tenant_users
WHERE tenant_id = '00000000-0000-0000-0000-000000000001'
GROUP BY primary_brand;
```

**Example Output:**
| Brand | Clients | MRR |
|-------|---------|-----|
| maggie-forbes | 10 | $1,500 |
| growth-manager-pro | 50 | $2,500 |
| **TOTAL** | **60** | **$4,000** |

---

## Cross-Promotion Strategy

### Upsell Path: Growth Manager Pro → Maggie Forbes

1. **Trigger**: Growth Manager Pro client hits $10k/mo revenue
2. **Action**: Send email about "graduating" to high-end strategic support
3. **Offer**: Switch to Maggie Forbes for personalized strategic consulting

```javascript
// Automation checks for successful clients
const successfulGMPClients = await db.query(`
  SELECT * FROM tenant_users
  WHERE primary_brand = 'growth-manager-pro'
  AND plan = 'growth'
  AND created_at < NOW() - INTERVAL '3 months'
`);

// Send upgrade offer
for (const client of successfulGMPClients) {
  sendEmail({
    to: client.email,
    subject: "Ready for the next level? 🚀",
    body: "You've been crushing it with Growth Manager Pro.
           Want personalized strategic support from Maggie Forbes?"
  });
}
```

---

## Social Proof Sharing

### Case Studies Work for Both Brands

When a Growth Manager Pro client succeeds:
```javascript
{
  client_name: "John Doe",
  business: "SaaS Startup",
  primary_brand: "growth-manager-pro",
  results: { revenue_increase: "300%", time_saved: "20hrs/week" },
  share_with_tenants: ["maggie-forbes"],  // Share success story
  can_use_name: true,
  quote: "The AI workforce helped me scale to $50k MRR"
}
```

This case study can be shown on:
- Growth Manager Pro website (proves the tool works)
- Maggie Forbes website (shows potential for growth)

---

## Automation Settings Per Brand

### Maggie Forbes Automation
```javascript
{
  tenant_id: "00000000-0000-0000-0000-000000000001",
  brand: "maggie-forbes",
  lead_gen_enabled: true,
  leads_per_run: 20,
  target_industry: "high-end business clients seeking strategic help",
  min_fit_score: 8,  // Higher bar
  notification_email: "kristi@maggieforbes.com"
}
```

### Growth Manager Pro Automation
```javascript
{
  tenant_id: "00000000-0000-0000-0000-000000000001",
  brand: "growth-manager-pro",
  lead_gen_enabled: true,
  leads_per_run: 50,
  target_industry: "solopreneurs struggling with growth",
  min_fit_score: 6,  // Lower bar, higher volume
  notification_email: "kristi@growthmangerpro.com"
}
```

---

## Summary

**Same Tenant, Different Brands**
- ✅ All revenue to YOU (one Stripe account, one payout)
- ✅ Cross-promotion is easy (same database)
- ✅ Social proof shared across brands
- ✅ Separate analytics per brand
- ✅ Different automation settings per brand

**Tracking Method:**
- `source` field = where they came from
- `primary_brand` field = which brand they belong to
- `brand` tag on all generated content = attribution

**Key Benefit:**
You can manage both businesses from ONE dashboard, while they appear completely separate to customers.
