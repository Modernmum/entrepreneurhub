# Deploy Unbound.team Backend to Railway

## Quick Deployment Steps

### 1. Login to Railway (if not already logged in)

```bash
railway login
```

This will open your browser for authentication.

### 2. Initialize Railway Project

```bash
cd /Users/Kristi/Documents/zero-to-legacy-engine/unbound-team/backend
railway init
```

When prompted:
- Project name: `unbound-team-backend`
- Choose: "Create new project"

### 3. Link to GitHub (Optional but Recommended)

```bash
railway link
```

Or deploy directly from local:

### 4. Add Environment Variables

```bash
# Add all your environment variables
railway variables set ENTREPRENEURHUB_SUPABASE_URL="https://awgxauppcufwftcxrfez.supabase.co"
railway variables set ENTREPRENEURHUB_SUPABASE_ANON_KEY="sb_publishable_5BJ94qUvCjBWbQ0zyudndA_mbi5Mm4K"
railway variables set ENTREPRENEURHUB_SUPABASE_SERVICE_KEY="YOUR_SERVICE_KEY_HERE"
railway variables set ANTHROPIC_API_KEY="YOUR_ANTHROPIC_KEY_HERE"
railway variables set DAILY_SPENDING_CAP="5.00"
```

### 5. Deploy to Railway

```bash
railway up
```

This will:
- Build your application
- Deploy to Railway
- Give you a production URL

### 6. Get Your Production URL

```bash
railway domain
```

### 7. Check Deployment Status

```bash
railway status
```

### 8. View Logs

```bash
railway logs
```

---

## Alternative: Deploy via Railway Dashboard

1. Go to https://railway.app/new
2. Click "Deploy from GitHub repo"
3. Select your `Unbound-Team` repository
4. Choose the `backend` directory as root
5. Add environment variables in Settings
6. Deploy

---

## What Gets Deployed

- ✅ All backend services (26 services)
- ✅ API endpoints
- ✅ Queue worker
- ✅ Automation scheduler
- ✅ All scheduled tasks

---

## After Deployment

Your backend will be available at:
`https://[your-app].up.railway.app`

Update this URL in:
- Vercel frontend configuration
- API documentation
- Integration guides

---

## Cost

Railway Free Tier:
- $5 credit per month
- Should cover Unbound.team backend easily

Railway Pro (if needed):
- $5/month base
- Usage-based pricing
- Estimated: $5-15/month total
