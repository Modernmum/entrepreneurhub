# Railway Deployment Guide - Unbound.team Backend
## Deploy via Dashboard (Recommended - 10 minutes)

---

## Step 1: Create New Project on Railway

1. Go to: **https://railway.app/new**
2. Click **"Deploy from GitHub repo"**
3. Select repository: **`Modernmum/Unbound-Team`**
4. Click **"Deploy Now"**

---

## Step 2: Configure Root Directory

Railway will try to deploy from the root. We need to set it to the `backend` directory:

1. In your new Railway project, click **"Settings"**
2. Scroll to **"Build"** section
3. Set **Root Directory**: `backend`
4. Set **Start Command**: `node server.js`
5. Click **"Save"**

---

## Step 3: Add Environment Variables

1. Click **"Variables"** tab
2. Click **"+ New Variable"** for each:

```bash
ENTREPRENEURHUB_SUPABASE_URL=https://awgxauppcufwftcxrfez.supabase.co
ENTREPRENEURHUB_SUPABASE_ANON_KEY=sb_publishable_5BJ94qUvCjBWbQ0zyudndA_mbi5Mm4K
ENTREPRENEURHUB_SUPABASE_SERVICE_KEY=sb_secret_mQw59C4S2hv33KzfUZqoSg_KQAy2cPb
ANTHROPIC_API_KEY=your_anthropic_key_here
DAILY_SPENDING_CAP=5.00
PORT=3001
```

**Optional variables (if using other AI models):**
```bash
OPENAI_API_KEY=your_openai_key_here
GEMINI_API_KEY=your_gemini_key_here
PERPLEXITY_API_KEY=your_perplexity_key_here
DISCORD_WEBHOOK_URL=your_discord_webhook_here
```

3. Click **"Add"** after entering each variable

---

## Step 4: Generate Domain

1. Click **"Settings"** tab
2. Scroll to **"Domains"** section
3. Click **"Generate Domain"**
4. Railway will create a URL like: `https://your-app.up.railway.app`
5. **Copy this URL** - you'll need it!

---

## Step 5: Deploy

1. Click **"Deployments"** tab
2. Railway will automatically deploy
3. Wait for deployment to complete (shows green checkmark)
4. Click **"View Logs"** to see deployment progress

Expected logs:
```
✅ Notification Service initialized
✅ Server running on port 3001
🚀 Queue worker started
✅ Automation Scheduler started
```

---

## Step 6: Test Your Deployment

Once deployed, test the health endpoint:

```bash
curl https://your-app.up.railway.app/health
```

Expected response:
```json
{
  "status": "healthy",
  "timestamp": "2025-11-29T..."
}
```

---

## Step 7: Update Frontend Configuration

Update the Vercel deployment to use your new Railway backend URL:

1. Go to your Vercel project settings
2. Update environment variables:
```bash
NEXT_PUBLIC_API_URL=https://your-app.up.railway.app
```

Or update `vercel.json` to proxy to Railway:
```json
{
  "rewrites": [
    {
      "source": "/api/:path*",
      "destination": "https://your-app.up.railway.app/api/:path*"
    }
  ]
}
```

---

## Troubleshooting

### Deployment Fails

**Check:**
1. Root directory is set to `backend`
2. All environment variables are added
3. View deployment logs for errors

### App Crashes

**Common Issues:**
1. Missing environment variables
2. Supabase connection failed
3. Port conflict (should use Railway's PORT env var)

**Fix:** Check logs in Railway dashboard

### Can't Access API

**Check:**
1. Domain is generated
2. Deployment shows "Active"
3. Health endpoint responds: `https://your-app.up.railway.app/health`

---

## What Gets Deployed

✅ **26 Backend Services:**
- AI Orchestrator
- Queue Worker
- All 5 Core Solutions (Leads, Content, Research, Pages, Email)
- Discovery Engine (RSS, Forums, Blogs)
- Growth Engine (Referrals, Testimonials, Outreach)
- Automation Scheduler

✅ **Scheduled Tasks:**
- Hourly opportunity discovery
- Weekly partner lead generation
- Daily testimonial collection
- Monthly revenue calculation

✅ **API Endpoints:**
- `/health` - Health check
- `/api/solutions/*` - All 5 solutions
- `/api/partner/*` - Multi-tenant management
- `/api/automation/*` - Automation triggers
- `/api/queues/*` - Queue status

---

## Cost Estimate

**Railway Pricing:**
- Free tier: $5 credit/month
- Hobby plan: $5/month + usage
- Estimated total: **$5-15/month**

**Current Status:**
- Should run on free tier initially
- Upgrade to Hobby if you exceed free tier

---

## After Deployment Checklist

- [ ] Deployment successful (green checkmark)
- [ ] Health endpoint responds
- [ ] Copy production URL
- [ ] Update Vercel with Railway URL
- [ ] Test API endpoints
- [ ] Monitor logs for errors
- [ ] Set up alerts (optional)

---

## Your Production URLs

**Backend (Railway):**
```
https://your-app.up.railway.app
```

**Frontend (Vercel):**
```
https://unboundteam.vercel.app (or your custom domain)
```

---

## Monitoring

**View Logs:**
1. Railway Dashboard → Your Project → Deployments
2. Click on active deployment
3. Click "View Logs"

**Metrics:**
- CPU usage
- Memory usage
- Network traffic
- All visible in Railway dashboard

---

## Redeploy

Railway auto-deploys when you push to GitHub:

```bash
git add .
git commit -m "Update backend"
git push
```

Railway will automatically:
1. Detect changes
2. Build new version
3. Deploy
4. Switch traffic to new deployment

---

**Need Help?**
- Railway Docs: https://docs.railway.app
- Railway Discord: https://discord.gg/railway
- Check deployment logs first!

---

**Ready to deploy! Go to https://railway.app/new and follow the steps above.** 🚀
