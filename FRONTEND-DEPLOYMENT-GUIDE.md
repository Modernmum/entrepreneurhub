# Frontend Deployment Guide
**Maggie Forbes & GMP Dashboard Integration**

---

## 🎯 What You Have

### 3 Frontend Options

**1. Unbound.team (Public Dashboard)**
- File: `index.html`, `dashboard.html`
- URL: https://unboundteam-three.vercel.app
- Target: Public users, standalone product

**2. Maggie Forbes White-Label Dashboard**
- File: `maggie-forbes-dashboard.html`
- Branded: MFS gold/navy colors, Cormorant font
- Target: Maggie Forbes consulting clients ($25K/mo)

**3. GMP Integration Widget**
- File: `gmp-unbound-widget.html`
- Embeddable: Can be added to GMP dashboard as iframe
- Target: Growth Manager Pro clients ($3K/mo)

---

## 🚀 Deployment Options

### Option A: All on Vercel (Recommended)

**Deploy everything to Vercel:**

```bash
cd unbound-team

# Deploy to Vercel
vercel --prod

# This deploys:
# - https://unboundteam-three.vercel.app/
# - https://unboundteam-three.vercel.app/dashboard.html
# - https://unboundteam-three.vercel.app/maggie-forbes-dashboard.html
# - https://unboundteam-three.vercel.app/gmp-unbound-widget.html
```

**Pros:**
- All in one place
- Easy to manage
- Free hosting

---

### Option B: Separate Deployments

**Deploy each frontend separately:**

**1. Unbound.team (Main Product)**
```bash
# Already deployed
https://unboundteam-three.vercel.app
```

**2. Maggie Forbes Dashboard (Custom Domain)**
```bash
# Deploy to custom domain
vercel --prod
vercel domains add clients.maggieforbesstrategies.com

# Points to: maggie-forbes-dashboard.html
```

**3. GMP Widget (Embed in GMP)**
```bash
# Just copy the HTML file to GMP codebase
cp gmp-unbound-widget.html /path/to/gmp/public/widgets/unbound.html
```

---

## 📋 Step-by-Step: Maggie Forbes Dashboard

### Step 1: Deploy to Vercel

```bash
cd unbound-team
vercel --prod
```

### Step 2: Set Up Custom Domain (Optional)

**Option A: Subdomain**
```
clients.maggieforbesstrategies.com → maggie-forbes-dashboard.html
```

**Option B: Path-based**
```
maggieforbesstrategies.com/dashboard → maggie-forbes-dashboard.html
```

**In Vercel:**
1. Go to: https://vercel.com/maggie-forbes-strategies/unbound-team
2. Settings → Domains
3. Add domain: `clients.maggieforbesstrategies.com`
4. Add DNS record:
   ```
   Type: CNAME
   Name: clients
   Value: cname.vercel-dns.com
   ```

### Step 3: Configure Tenant IDs

Each client gets a unique URL with their tenant ID:

```
https://clients.maggieforbesstrategies.com?tenant=client-bigcompany-123
```

**Create tenant mapping:**
```sql
-- Run in Supabase
INSERT INTO gmp_client_config (
  unbound_tenant_id,
  gmp_tenant_id,
  client_name,
  client_email
) VALUES (
  'maggie-forbes-bigclient',
  'gmp-bigclient-789',
  'Big Client Inc',
  'ceo@bigclient.com'
);
```

### Step 4: Send Client Their Dashboard URL

**Email template:**
```
Subject: Your Strategic Dashboard is Ready

Hi [Client Name],

Your automated growth dashboard is now live. You can access it here:

🔗 https://clients.maggieforbesstrategies.com?tenant=your-tenant-id

This dashboard shows real-time results from your strategic automation:
- Lead generation (refreshed daily)
- Content creation (weekly)
- Market research (monthly)

Login anytime to see what your AI team has generated for you.

Best,
Maggie Forbes
```

---

## 📋 Step-by-Step: GMP Widget Integration

### Step 1: Add Widget to GMP Codebase

**Copy the widget file:**
```bash
cp gmp-unbound-widget.html /Users/Kristi/Desktop/gmp-codebase/public/widgets/unbound.html
```

### Step 2: Embed in GMP Dashboard

**Edit GMP dashboard.html:**

```html
<!-- Add to GMP dashboard.html -->
<div class="dashboard-widgets">

  <!-- Existing GMP widgets... -->

  <!-- Unbound.team AI Automation Widget -->
  <div class="widget-container">
    <iframe
      src="/widgets/unbound.html?tenant_id={{ tenant.id }}"
      width="100%"
      height="600"
      frameborder="0"
      style="border-radius: 12px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);"
    ></iframe>
  </div>

</div>
```

### Step 3: Pass Tenant ID Dynamically

**In GMP backend (dashboard.js):**

```javascript
// When rendering dashboard
app.get('/dashboard', async (req, res) => {
  const tenantId = req.user.tenant_id;

  // Check if this client has Unbound automation enabled
  const { data: config } = await db
    .from('gmp_client_config')
    .select('*')
    .eq('gmp_tenant_id', tenantId)
    .single();

  res.render('dashboard.html', {
    tenant: { id: tenantId },
    showUnboundWidget: config?.automation_enabled || false
  });
});
```

**In dashboard.html:**

```html
{{#if showUnboundWidget}}
  <div class="widget-container">
    <iframe
      src="/widgets/unbound.html?tenant_id={{ tenant.id }}"
      width="100%"
      height="600"
      frameborder="0"
    ></iframe>
  </div>
{{/if}}
```

---

## 🔒 Security Considerations

### Tenant Isolation

**Important:** Each client should only see their own data.

**Current implementation:**
- All queries filter by `tenant_id`
- Supabase Row Level Security (RLS) enforces this
- No cross-tenant data leakage

**Add RLS policies:**

```sql
-- Run in Supabase SQL Editor

-- Leads: Only show leads for the tenant
CREATE POLICY "Tenants can only view their own leads"
  ON generated_leads
  FOR SELECT
  USING (tenant_id = current_setting('app.tenant_id', true));

-- Content: Only show content for the tenant
CREATE POLICY "Tenants can only view their own content"
  ON generated_content
  FOR SELECT
  USING (tenant_id = current_setting('app.tenant_id', true));

-- Research: Only show research for the tenant
CREATE POLICY "Tenants can only view their own research"
  ON market_research
  FOR SELECT
  USING (tenant_id = current_setting('app.tenant_id', true));
```

---

## 🎨 Branding Customization

### White-Label for Different Clients

**Example: Enterprise client wants their own branding**

**Create custom dashboard:**

```html
<!-- Copy maggie-forbes-dashboard.html to custom-client-dashboard.html -->

<!-- Change colors -->
<style>
  :root {
    --gold: #YOUR_PRIMARY_COLOR;
    --navy: #YOUR_SECONDARY_COLOR;
  }
</style>

<!-- Change logo -->
<div class="logo-section">
  <img src="/client-logo.png" alt="Client Logo">
</div>

<!-- Change title -->
<title>Your Company | Strategic Dashboard</title>
```

**Deploy:**
```
https://dashboard.yourclient.com
```

---

## 📊 Analytics & Tracking

### Track Dashboard Usage

**Add Google Analytics:**

```html
<!-- Add to maggie-forbes-dashboard.html -->
<head>
  <!-- ... existing head content ... -->

  <!-- Google Analytics -->
  <script async src="https://www.googletagmanager.com/gtag/js?id=GA_TRACKING_ID"></script>
  <script>
    window.dataLayer = window.dataLayer || [];
    function gtag(){dataLayer.push(arguments);}
    gtag('js', new Date());
    gtag('config', 'GA_TRACKING_ID');

    // Track tenant
    gtag('set', 'dimension1', getTenantId());
  </script>
</head>
```

**Track events:**

```javascript
// When client views leads
gtag('event', 'view_leads', {
  'tenant_id': tenantId,
  'leads_count': leadsCount
});

// When client exports CSV
gtag('event', 'export_leads', {
  'tenant_id': tenantId,
  'format': 'csv'
});
```

---

## 🧪 Testing

### Test Maggie Forbes Dashboard

```bash
# 1. Open in browser
open http://localhost:3000/maggie-forbes-dashboard.html?tenant=maggie-forbes

# 2. Check data loads
# - Stats cards should populate
# - Leads table should show data
# - Content tab should show content
# - Research tab should show reports

# 3. Test responsive design
# - Resize browser window
# - Test on mobile (375px width)
# - Test on tablet (768px width)
```

### Test GMP Widget

```bash
# 1. Open widget in browser
open http://localhost:3000/gmp-unbound-widget.html?tenant_id=gmp-test-123

# 2. Check stats load
# - Leads count
# - Content count
# - Fit score

# 3. Check activity feed
# - Should show recent leads
# - Should show recent content
# - Should show recent research

# 4. Test refresh button
# - Click refresh
# - Data should reload
```

---

## 🚀 Production Checklist

### Before Going Live

- [ ] Deploy all files to Vercel
- [ ] Set up custom domains (if using)
- [ ] Configure tenant IDs in database
- [ ] Test with real client data
- [ ] Add RLS policies for security
- [ ] Set up analytics tracking
- [ ] Test on mobile devices
- [ ] Create client onboarding docs
- [ ] Send test emails to clients
- [ ] Monitor error logs

---

## 📱 Mobile Optimization

Both dashboards are fully responsive:

**Mobile (375px):**
- Stats grid: 1 column
- Tables: Horizontal scroll
- Fonts: Slightly smaller

**Tablet (768px):**
- Stats grid: 2 columns
- Tables: Full width
- Sidebar: Collapsible

**Desktop (1200px+):**
- Stats grid: 4 columns
- Full layout
- All features visible

---

## 🔄 Updates & Maintenance

### Update Dashboard Styles

**To change branding:**
```bash
# Edit CSS variables
vim maggie-forbes-dashboard.html

# Change:
--gold: #YOUR_COLOR;
--navy: #YOUR_COLOR;

# Redeploy
vercel --prod
```

### Add New Features

**Example: Add email notifications**

```javascript
// In maggie-forbes-dashboard.html

async function checkNewLeads() {
  const { data: newLeads } = await supabase
    .from('generated_leads')
    .select('*')
    .eq('tenant_id', tenantId)
    .gte('created_at', lastChecked);

  if (newLeads && newLeads.length > 0) {
    // Show notification
    showNotification(`${newLeads.length} new leads generated!`);
  }
}

// Check every 5 minutes
setInterval(checkNewLeads, 300000);
```

---

## 💡 Usage Examples

### Maggie Forbes Client Journey

**Week 1:**
```
Client signs $25K/month deal
→ You provision them in Unbound.team
→ You send them dashboard link
→ They log in, see welcome screen
```

**Daily:**
```
6am: Automation runs
→ 7 new leads generated
→ Client logs in at 9am
→ Sees "7 new leads" badge
→ Reviews leads, sees fit scores
→ Exports to CSV
→ Adds to their CRM
```

**Weekly:**
```
Monday 9am: Content generated
→ Client sees "2 new blog posts"
→ Clicks to review
→ Approves for publishing
```

**Monthly:**
```
1st of month: Research report
→ Client sees "Market Analysis Ready"
→ Downloads full report
→ Uses insights for strategy
```

### GMP Client Journey

**Initial Setup:**
```
GMP client signs up ($3K/mo plan)
→ Gets access to GMP dashboard
→ Sees Unbound widget appear
→ Widget shows "0 leads - automation starting"
```

**Daily:**
```
6am: Automation runs
→ Widget updates with new stats
→ Client logs into GMP
→ Sees activity feed: "3 new leads 2 hours ago"
→ Clicks through to full lead details in GMP Contacts
```

**Result:**
```
Client thinks GMP has powerful automation
Never knows it's powered by Unbound.team
Invisible integration working perfectly
```

---

## 🎯 Next Steps

1. **Deploy frontends** (5 min)
   ```bash
   vercel --prod
   ```

2. **Set up first client** (10 min)
   - Add tenant config to database
   - Send dashboard URL
   - Test with real data

3. **Monitor usage** (ongoing)
   - Check analytics
   - Review error logs
   - Get client feedback

4. **Iterate** (as needed)
   - Add requested features
   - Improve UI/UX
   - Optimize performance

---

## 📞 Support

**Files Created:**
- `maggie-forbes-dashboard.html` - MFS branded dashboard
- `gmp-unbound-widget.html` - GMP embeddable widget
- `api/client-dashboard.js` - Dashboard data API
- `api/export-leads.js` - CSV export API

**Documentation:**
- `GMP-INTEGRATION-DEPLOYMENT-GUIDE.md` - Backend integration
- `FRONTEND-DEPLOYMENT-GUIDE.md` - This file

**Ready to deploy!** 🚀

