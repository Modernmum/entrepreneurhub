# ✅ Unbound.team.ai - Setup Checklist

**Goal:** Launch Unbound.team.ai by Sunday with clean, separate database

---

## 📋 STEP-BY-STEP SETUP (15 minutes)

### ✅ Step 1: Create New Supabase Project (5 min)

1. Go to: https://supabase.com/dashboard/projects
2. Click "New Project"
3. Fill in:
   - **Organization:** (select or create)
   - **Name:** `Unbound.team`
   - **Database Password:** (click generate - SAVE THIS!)
   - **Region:** `US West (Oregon)` or closest to you
   - **Pricing Plan:** Free

4. Click "Create new project"
5. Wait ~2 minutes for provisioning

### ✅ Step 2: Get New Project Credentials (2 min)

Once project is ready:

1. Go to: **Project Settings** (gear icon bottom left)
2. Click: **API** in sidebar
3. Copy these values:

```
Project URL: https://xxxxxxxxxxxxx.supabase.co
anon public key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXB...
```

### ✅ Step 3: Create Environment File (1 min)

Create file: `entrepreneurhub/.env`

```bash
# Unbound.team.ai - Clean Database
ENTREPRENEURHUB_SUPABASE_URL=https://xxxxxxxxxxxxx.supabase.co
ENTREPRENEURHUB_SUPABASE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# AI Analysis (copy from main .env file)
ANTHROPIC_API_KEY=<copy_from_main_env_file>
```

### ✅ Step 4: Run Database Schema (5 min)

1. In Supabase dashboard, click **SQL Editor** (left sidebar)
2. Click "New Query"
3. Open file: `entrepreneurhub/setup-database.sql`
4. Copy ENTIRE contents
5. Paste into SQL Editor
6. Click "Run" (or Ctrl+Enter)
7. Wait ~30 seconds
8. Should see: "Success. No rows returned"

**Verify it worked:**
```sql
SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename;
```

Should show 9 tables:
- comments
- discussions
- opportunity_analysis
- problems
- products_listed
- profiles
- revenue_reports
- upvotes

### ✅ Step 5: Enable Email Auth (2 min)

1. In Supabase dashboard: **Authentication** → **Providers**
2. Scroll to **Email**
3. Toggle **Enable Email provider** to ON
4. **Confirm email:** Toggle to OFF (for faster testing)
5. Click "Save"

---

## ✅ VERIFICATION

### Test Database Connection:

```javascript
// Test in browser console
const { createClient } = supabase;

const client = createClient(
  'YOUR_SUPABASE_URL',
  'YOUR_SUPABASE_KEY'
);

// Try to fetch (should return empty array, not error)
const { data, error } = await client.from('problems').select('*');
console.log('Data:', data); // []
console.log('Error:', error); // null
```

If you see `data: []` and `error: null` → **SUCCESS!**

---

## 🚀 NEXT: BUILD FRONTEND

Now that database is ready:

1. Build landing page (`entrepreneurhub/index.html`)
2. Build auth flow (sign up, login)
3. Build problem posting UI
4. Build product listing UI
5. Deploy to Vercel

**Target: Live by Sunday**

---

## 📊 WHAT YOU HAVE NOW

**Clean, separate infrastructure:**
- ✅ New Supabase project (Unbound.team)
- ✅ Complete database schema
- ✅ Row Level Security configured
- ✅ Auto-updating counts (comments, upvotes)
- ✅ Views for trending content
- ✅ Email auth enabled

**Zero conflicts with existing:**
- Modern Business Mum site (different database)
- Existing products (different database)
- Opportunity scanner (can integrate later)

**Ready to build:**
- Frontend can connect immediately
- Users can sign up immediately
- Data starts flowing immediately

---

## 🎯 LAUNCH PLAN

**This Weekend:**
- Saturday: Build frontend MVP
- Sunday: Deploy to Vercel
- Sunday night: Soft launch to 10 people

**Next Week:**
- Monday: Public launch (Reddit, IH, Twitter)
- Week 1: First 100 users
- Week 2: First revenue report shared
- Week 3: First AI-generated opportunity

**The platform that makes us platform-independent.**

---

**Database is ready. Let's build the frontend.**
