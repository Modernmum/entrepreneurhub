# Unbound-Team Connected Systems

## This System: UNBOUND-TEAM (Lead Generation)

**Purpose**: Autonomous client acquisition for Maggie Forbes Strategies

| Component | Location |
|-----------|----------|
| **GitHub** | github.com/Modernmum/Unbound-Team |
| **Deployed** | https://web-production-486cb.up.railway.app |
| **Dashboard** | https://web-production-486cb.up.railway.app (MFS×UT branded) |
| **Database** | Supabase PostgreSQL |
| **Local** | /Users/kwray/Unbound-Team |

### What It Does:
1. Discovers business opportunities (RSS, forums, manual input)
2. Scores and qualifies leads
3. Researches companies with Perplexity AI
4. Finds contact emails (website scraping)
5. Sends personalized outreach via Resend
6. Tracks responses and conversions

---

## Connected System: MFS-DELIVERY-SYSTEM (Client Fulfillment)

**Purpose**: Deliver solutions to clients acquired by Unbound

| Component | Location |
|-----------|----------|
| **GitHub** | github.com/Modernmum/modern-business-mum |
| **Local** | /Users/kwray/MFS-Delivery-System |
| **Agents** | 31 specialized delivery bots |

### What It Does:
1. Receives new clients from Unbound (when outreach gets positive response)
2. Onboards clients automatically
3. Deploys appropriate solution agents based on client needs
4. Builds custom Notion templates, MVPs, SEO content, etc.
5. Provides AI-powered support chat

---

## Integration Flow

```
UNBOUND-TEAM                         MFS-DELIVERY-SYSTEM
─────────────                        ───────────────────
Find Lead ────────────────────────────────────────────────────
    │
Score Lead ───────────────────────────────────────────────────
    │
Research ─────────────────────────────────────────────────────
    │
Send Email ───────────────────────────────────────────────────
    │
Track Reply ──────────────────────────────────────────────────
    │
    └──── When Positive Reply ────▶  Receive New Client
                                          │
                                     Onboard Client
                                          │
                                     Deploy Agents
                                          │
                                     Deliver Solution
                                          │
                                     Ongoing Support
```

---

## Key Environment Variables

### Unbound-Team (Railway)
- `SUPABASE_URL` - Database connection
- `SUPABASE_SERVICE_KEY` - Database auth
- `PERPLEXITY_API_KEY` - Company research
- `RESEND_API_KEY` - Email sending
- `RESEND_FROM_EMAIL` - maggie@maggieforbesstrategies.com

### MFS-Delivery-System
- See /Users/kwray/MFS-Delivery-System/.env.example

---

## Quick Commands

### Check Unbound Status:
```bash
curl https://web-production-486cb.up.railway.app/health
```

### Trigger RSS Scan:
```bash
curl -X POST https://web-production-486cb.up.railway.app/api/scan-rss
```

### Research a Company:
```bash
curl -X POST https://web-production-486cb.up.railway.app/api/discover-company \
  -H "Content-Type: application/json" \
  -d '{"company_name": "Example Co", "company_domain": "example.com"}'
```
