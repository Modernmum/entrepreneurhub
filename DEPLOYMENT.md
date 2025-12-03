# Unbound.team Deployment Guide

## Backend Deployment to Railway

### Step 1: Create Railway Account

1. Go to https://railway.app
2. Sign up with GitHub account
3. Connect your GitHub account

### Step 2: Create New Project

1. Click "New Project"
2. Select "Deploy from GitHub repo"
3. Choose: `Modernmum/Unbound-Team`
4. Railway will auto-detect the configuration

### Step 3: Add Redis

1. In your Railway project, click "+ New"
2. Select "Database" → "Redis"
3. Railway will automatically create `REDIS_URL` environment variable

### Step 4: Add Environment Variables

In Railway project settings → Variables, add:

```bash
# AI API Keys
ANTHROPIC_API_KEY=sk-ant-xxx
OPENAI_API_KEY=sk-xxx
GEMINI_API_KEY=xxx
PERPLEXITY_API_KEY=pplx-xxx

# Supabase
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_KEY=eyJxxx

# Discord Notifications (optional)
DISCORD_WEBHOOK_URL=https://discord.com/api/webhooks/xxx

# Cost Protection
DAILY_SPENDING_CAP=5.00

# Port (Railway sets this automatically)
PORT=3000
```

**Important:** `REDIS_URL` is automatically created when you add Redis - don't override it!

### Step 5: Deploy

1. Railway will automatically deploy on push to `main` branch
2. Wait for build to complete (~2-3 minutes)
3. Railway will provide a public URL like: `https://unbound-team-production.up.railway.app`

### Step 6: Verify Deployment

Test the API:

```bash
# Health check
curl https://your-railway-url.railway.app/api/health

# Queue stats
curl https://your-railway-url.railway.app/api/queue/stats

# AI stats
curl https://your-railway-url.railway.app/api/ai/stats
```

---

## Alternative: Render Deployment

If you prefer Render over Railway:

### Step 1: Create Render Account

1. Go to https://render.com
2. Sign up with GitHub

### Step 2: Create New Web Service

1. Click "New +" → "Web Service"
2. Connect GitHub repo: `Modernmum/Unbound-Team`
3. Configure:
   - **Name:** unbound-team-backend
   - **Environment:** Node
   - **Build Command:** `cd backend && npm install`
   - **Start Command:** `cd backend && npm start`
   - **Plan:** Free

### Step 3: Add Redis

1. Click "New +" → "Redis"
2. Choose free tier
3. Copy the Internal Redis URL

### Step 4: Environment Variables

Add in Render dashboard:

```bash
ANTHROPIC_API_KEY=sk-ant-xxx
OPENAI_API_KEY=sk-xxx
GEMINI_API_KEY=xxx
PERPLEXITY_API_KEY=pplx-xxx
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_KEY=eyJxxx
DISCORD_WEBHOOK_URL=https://discord.com/api/webhooks/xxx
DAILY_SPENDING_CAP=5.00
REDIS_URL=redis://your-render-redis-url:6379
```

### Step 5: Deploy

Render will auto-deploy. Your URL will be: `https://unbound-team-backend.onrender.com`

---

## Frontend Update (Vercel)

After backend is deployed, update Vercel environment variables:

1. Go to Vercel project settings
2. Add environment variable:
   ```
   NEXT_PUBLIC_API_URL=https://your-railway-or-render-url
   ```
3. Redeploy frontend

---

## Post-Deployment Checklist

- [ ] Backend is accessible at public URL
- [ ] Redis connection working (check logs)
- [ ] API endpoints responding
- [ ] Discord notifications working (test with notification endpoint)
- [ ] Queue system operational
- [ ] AI orchestrator routing correctly
- [ ] Cost protection active
- [ ] Frontend can connect to backend API

---

## Monitoring

### Railway Dashboard
- View logs in real-time
- Monitor resource usage
- Check Redis connection
- View deployments history

### Discord Alerts
You'll receive notifications for:
- Job completions
- Job failures
- Spending warnings
- Daily summaries

### Admin Dashboard
Access at: `https://unboundteam-three.vercel.app/dashboard.html`

---

## Troubleshooting

### Backend won't start
- Check Railway/Render logs for errors
- Verify all environment variables are set
- Ensure Redis is connected (`REDIS_URL` is correct)

### Redis connection errors
- On Railway: Ensure Redis service is running
- On Render: Verify Internal Redis URL is correct
- Check if `REDIS_URL` format is correct: `redis://host:port`

### API 404 errors
- Verify backend URL is correct
- Check if service is running in Railway/Render dashboard
- Look for startup errors in logs

### AI API errors
- Verify all API keys are valid
- Check if you have credits/quota remaining
- Review cost protection logs

---

## Cost Estimates

### Railway Free Tier
- $5 free credit per month
- Shared CPU
- 512MB RAM
- Should cover initial testing

### Railway Pro (if needed)
- $20/month
- More resources
- Better performance

### Render Free Tier
- Spins down after 15 min inactivity
- Spins up on request (slow first load)
- Good for testing

---

## Next Steps After Deployment

1. Test lead generation with Maggie Forbes Strategies request
2. Monitor costs and performance for 24 hours
3. Set up cron jobs for automated tasks
4. Begin Phase 2: Discovery & Growth Engine

---

**Ready to deploy!**
