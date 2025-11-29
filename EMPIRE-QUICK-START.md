# 🚀 EMPIRE INTEGRATION - QUICK START GUIDE

## 📋 What You Just Built

A complete **multi-tenant system** that integrates:
- ✅ **Unbound.team** (main brand)
- ✅ **Maggie Forbes AI Solutions** (white-label partner)
- ✅ **Growth Manager Pro AI Assistant** (white-label partner)

**With automatic:**
- Client provisioning
- Revenue share tracking
- Social proof generation (testimonials + case studies)
- Cross-promotion across all brands

---

## ⚡ DEPLOYMENT (15 minutes)

### Step 1: Deploy Database Schema (5 min)

1. Go to [Supabase SQL Editor](https://supabase.com/dashboard/project/_/sql)

2. Run this file:
   ```
   supabase-multi-tenant-schema.sql
   ```

3. Verify tables created:
   ```sql
   SELECT tablename FROM pg_tables
   WHERE schemaname = 'public'
   AND tablename LIKE 'tenant%'
   ORDER BY tablename;
   ```

   Should see:
   - tenants
   - tenant_users
   - tenant_revenue
   - tenant_user_usage
   - social_proof
   - client_provisioning_log
   - cross_promotion_campaigns
   - partner_dashboard_stats

### Step 2: Deploy Backend (5 min)

Your backend is already running locally. To deploy to Railway:

```bash
# Commit changes
git add .
git commit -m "Add multi-tenant empire system"
git push

# Railway will auto-deploy
# Wait 2-3 minutes
```

### Step 3: Test Partner APIs (5 min)

```bash
# Get Maggie Forbes tenant info
curl http://localhost:3001/api/partner/maggie-forbes

# Get stats
curl http://localhost:3001/api/partner/maggie-forbes/stats

# Provision a test client
curl -X POST http://localhost:3001/api/partner/maggie-forbes/provision-client \
  -H "Content-Type: application/json" \
  -d '{
    "userEmail": "test@example.com",
    "userName": "Test Client",
    "plan": "free",
    "source": "maggie-forbes"
  }'
```

---

## 🎯 USAGE EXAMPLES

### Example 1: Onboard Maggie Forbes Clients

```javascript
// Bulk provision 10 Maggie Forbes clients
const clients = [
  { email: "client1@business.com", name: "John Smith", plan: "free" },
  { email: "client2@business.com", name: "Jane Doe", plan: "free" },
  // ... 8 more
];

fetch('https://your-backend.com/api/partner/maggie-forbes/bulk-provision', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ clients })
});
```

### Example 2: Track Revenue Share

```javascript
// Calculate this month's revenue
fetch('https://your-backend.com/api/partner/maggie-forbes/calculate-revenue', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ month: '2025-11' })
})
.then(res => res.json())
.then(data => {
  console.log('Total Revenue:', data.total_revenue);
  console.log('Partner Share (50%):', data.partner_share);
  console.log('Unbound Share (50%):', data.unbound_share);
});
```

### Example 3: Get Social Proof

```javascript
// Get all published testimonials for Maggie Forbes
fetch('https://your-backend.com/api/partner/maggie-forbes/social-proof?type=testimonial')
.then(res => res.json())
.then(testimonials => {
  testimonials.forEach(t => {
    console.log(`${t.client_name}: "${t.quote}" - ${t.rating}/5 stars`);
  });
});
```

---

## 📅 LAUNCH SEQUENCE

### Week 1: Pilot with Maggie Forbes

**Day 1: Onboard 5 Test Clients**
```bash
# Use the partner API to provision
curl -X POST http://localhost:3001/api/partner/maggie-forbes/provision-client \
  -H "Content-Type: application/json" \
  -d '{
    "userEmail": "client@example.com",
    "userName": "Test Client",
    "plan": "free",
    "source": "maggie-forbes"
  }'
```

**Day 2-3: Deliver Solutions**
- Clients use Unbound.team to solve problems
- Each gets 1 free solution (lead gen, content, etc.)

**Day 4-5: Collect Results**
- Case studies auto-generated from results
- Request testimonials via email

**Day 6-7: Publish Social Proof**
- Review and publish best case studies
- Add to website and marketing

### Week 2: Scale to All Maggie Forbes Clients

**Bulk onboard remaining clients:**
```javascript
// Import CSV of all Maggie Forbes clients
const clients = parseCSV('maggie-forbes-clients.csv');

fetch('/api/partner/maggie-forbes/bulk-provision', {
  method: 'POST',
  body: JSON.stringify({ clients })
});
```

### Week 3: Add Growth Manager Pro

**Same process:**
1. Onboard GMP students
2. Deliver solutions
3. Collect testimonials
4. Generate case studies
5. Cross-promote

### Week 4: Launch Public + Cross-Promotion

**Activate cross-promotion:**
- Maggie Forbes case studies shared on Unbound.team
- GMP success stories shared on Maggie Forbes
- All social proof cross-promoted

**Result:**
- 30+ testimonials
- 10+ case studies
- 3 brands promoting each other
- $0 spent on ads

---

## 💰 REVENUE TRACKING

### Check Partner Stats

```bash
# Maggie Forbes dashboard
curl http://localhost:3001/api/partner/maggie-forbes/stats

# Response:
{
  "total_users": 30,
  "active_users": 28,
  "paying_users": 5,
  "mrr": 250,  // Monthly Recurring Revenue
  "testimonials": 15,
  "case_studies": 8
}
```

### Get Revenue Report

```bash
# Revenue for November 2025
curl "http://localhost:3001/api/partner/maggie-forbes/revenue?startMonth=2025-11&endMonth=2025-11"

# Response:
{
  "tenant": "Maggie Forbes AI Solutions",
  "period": "2025-11 to 2025-11",
  "total_revenue": 250,
  "partner_share": 125,    // Maggie gets 50%
  "unbound_share": 125,    // Unbound.team gets 50%
  "months": [...]
}
```

---

## 🎯 KEY METRICS TO TRACK

### Month 1 Goals
- [ ] 30 clients onboarded (Maggie Forbes + GMP)
- [ ] 20 problems solved
- [ ] 15 testimonials collected
- [ ] 5 case studies published
- [ ] $0 spent on marketing

### Month 3 Goals
- [ ] 100 total clients
- [ ] 50 paying clients
- [ ] $3,000 MRR
- [ ] 50 testimonials
- [ ] 20 case studies
- [ ] Viral coefficient >1.0

---

## 🚀 NEXT STEPS

**Today:**
1. ✅ Database deployed (supabase-multi-tenant-schema.sql)
2. ✅ Backend APIs ready (partner endpoints)
3. ✅ Social proof automation built

**Tomorrow:**
1. [ ] Test API endpoints locally
2. [ ] Provision 2-3 test clients
3. [ ] Generate test case study

**This Week:**
1. [ ] Onboard first 10 Maggie Forbes clients
2. [ ] Deliver first solutions
3. [ ] Collect first testimonials

**Next Week:**
1. [ ] Scale to all Maggie Forbes clients
2. [ ] Add Growth Manager Pro students
3. [ ] Publish first case studies

---

## 📞 API REFERENCE

### Partner Endpoints

```
GET    /api/partner/:tenantSlug                    # Get tenant info
GET    /api/partner/:tenantSlug/stats              # Dashboard stats
POST   /api/partner/:tenantSlug/provision-client   # Add single client
POST   /api/partner/:tenantSlug/bulk-provision     # Bulk add clients
PUT    /api/partner/:tenantSlug/client/:email/plan # Update client plan
GET    /api/partner/:tenantSlug/revenue            # Revenue report
POST   /api/partner/:tenantSlug/calculate-revenue  # Calculate monthly revenue
POST   /api/partner/:tenantSlug/testimonial        # Add testimonial
GET    /api/partner/:tenantSlug/social-proof       # Get testimonials/case studies
```

### Tenant Slugs

- `unbound-team` - Main brand
- `maggie-forbes` - Maggie Forbes AI Solutions
- `growth-manager-pro` - Growth Manager Pro AI Assistant

---

## 🎉 YOU'RE READY!

**What you have:**
- ✅ 3-brand empire infrastructure
- ✅ Automatic client provisioning
- ✅ Revenue share tracking
- ✅ Social proof automation
- ✅ Cross-promotion system

**What you need:**
- ⬜ 10 Maggie Forbes clients to start
- ⬜ 20 GMP students to start
- ⬜ 1 week to collect testimonials

**Then you have:**
- 30 happy clients
- 20+ testimonials
- 10+ case studies
- $0 marketing spend
- Exponential growth potential

**Let's launch! 🚀**
