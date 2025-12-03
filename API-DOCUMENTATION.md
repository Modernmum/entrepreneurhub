# Unbound.team API Documentation

## Overview

Unbound.team provides AI-powered business automation tools via REST API. This API powers Growth Manager Pro and enables clients to generate leads, create content, research markets, build landing pages, and automate email marketing.

**Base URL:** `https://api.unbound.team` (or `http://localhost:3001` for local development)

**Authentication:** Bearer token (JWT)

**Content-Type:** `application/json`

---

## Authentication

All API requests require authentication via Bearer token:

```http
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Get Token:**
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}

Response:
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "user-123",
    "email": "user@example.com",
    "brand": "growth-manager-pro",
    "plan": "growth"
  }
}
```

---

## Solutions API

All solutions follow the same async job pattern:
1. Submit job → Get job ID
2. Poll job status → Get results when complete

### **Common Job Lifecycle:**

```
POST /api/solutions/{solution-type}
  ↓
{ jobId: "uuid", statusUrl: "/status/uuid" }
  ↓
GET /api/solutions/{solution-type}/status/{jobId}
  ↓
{ state: "pending" } → { state: "processing" } → { state: "completed", result: {...} }
```

---

## Solution 1: Lead Generation

Generate qualified leads for the user's business.

### **POST /api/solutions/lead-generation**

**Request:**
```http
POST /api/solutions/lead-generation
Authorization: Bearer {token}
Content-Type: application/json

{
  "userId": "user-123",
  "targetIndustry": "SaaS founders looking for growth tools",
  "location": "USA",
  "criteria": {
    "count": 50,
    "minScore": 7
  }
}
```

**Response:**
```json
{
  "success": true,
  "jobId": "bd027295-90d9-4bc9-a5ff-ab8f716c9bb1",
  "statusUrl": "/api/solutions/lead-generation/status/bd027295-90d9-4bc9-a5ff-ab8f716c9bb1",
  "message": "Lead generation started. Check back in a few minutes."
}
```

### **GET /api/solutions/lead-generation/status/{jobId}**

**Request:**
```http
GET /api/solutions/lead-generation/status/bd027295-90d9-4bc9-a5ff-ab8f716c9bb1
Authorization: Bearer {token}
```

**Response (Processing):**
```json
{
  "id": "bd027295-90d9-4bc9-a5ff-ab8f716c9bb1",
  "state": "processing",
  "progress": 45,
  "error": null
}
```

**Response (Completed):**
```json
{
  "id": "bd027295-90d9-4bc9-a5ff-ab8f716c9bb1",
  "state": "completed",
  "progress": 100,
  "result": {
    "success": true,
    "leadsFound": 50,
    "leads": [
      {
        "name": "John Doe",
        "company": "TechStartup Inc",
        "source": "Reddit r/Entrepreneur",
        "url": "https://reddit.com/r/Entrepreneur/post123",
        "description": "Looking for growth tools to scale SaaS",
        "painPoints": ["scaling", "user acquisition", "automation"],
        "fitScore": 9,
        "outreachTip": "Mention your experience helping SaaS companies scale from 0-100k MRR"
      },
      {
        "name": "Sarah Johnson",
        "company": "E-commerce Store",
        "source": "Twitter",
        "url": "https://twitter.com/user/status/123",
        "description": "Struggling with marketing automation",
        "painPoints": ["marketing", "time management", "growth"],
        "fitScore": 8,
        "outreachTip": "Focus on time-saving automation features"
      }
      // ... 48 more leads
    ],
    "csv": "Name,Company,Source,URL,Description,Pain Points,Fit Score,Outreach Tip\n...",
    "summary": {
      "totalFound": 50,
      "avgFitScore": 8.2,
      "sources": ["Reddit r/Entrepreneur", "Twitter", "Indie Hackers"]
    }
  },
  "error": null
}
```

**CSV Download:**
```http
GET /api/solutions/lead-generation/download/{jobId}
Authorization: Bearer {token}

Response: CSV file download
Content-Type: text/csv
Content-Disposition: attachment; filename="leads-2024-01-15.csv"
```

---

## Solution 2: Content Creation

Generate blog posts, social media content, product descriptions.

### **POST /api/solutions/content-creation**

**Request:**
```http
POST /api/solutions/content-creation
Authorization: Bearer {token}
Content-Type: application/json

{
  "userId": "user-123",
  "contentType": "blog_post",
  "topic": "How to scale a SaaS business from 0 to $10k MRR",
  "keywords": ["SaaS", "growth", "scaling", "MRR"],
  "targetAudience": "SaaS founders",
  "tone": "professional",
  "length": "long" // short (500), medium (1000), long (2000)
}
```

**Content Types:**
- `blog_post` - SEO-optimized blog post
- `social_media` - LinkedIn, Twitter, Facebook posts
- `product_description` - Product page copy
- `email` - Email marketing copy
- `landing_page` - Landing page copy

**Response:**
```json
{
  "success": true,
  "jobId": "content-456",
  "statusUrl": "/api/solutions/content-creation/status/content-456",
  "message": "Content creation started"
}
```

### **GET /api/solutions/content-creation/status/{jobId}**

**Response (Completed):**
```json
{
  "id": "content-456",
  "state": "completed",
  "progress": 100,
  "result": {
    "success": true,
    "content": {
      "title": "How to Scale a SaaS Business from 0 to $10k MRR in 6 Months",
      "body": "# Introduction\n\nScaling a SaaS business...",
      "wordCount": 1847,
      "readTime": "9 min",
      "seo": {
        "metaTitle": "Scale SaaS to $10k MRR | Complete Guide 2024",
        "metaDescription": "Learn proven strategies to scale your SaaS from zero to $10k MRR...",
        "slug": "scale-saas-0-to-10k-mrr",
        "keywords": ["SaaS scaling", "MRR growth", "SaaS strategy"],
        "keywordDensity": {
          "SaaS": 2.3,
          "growth": 1.8,
          "MRR": 1.5
        }
      },
      "socialMedia": {
        "linkedin": "Want to scale your SaaS to $10k MRR? Here are 5 proven strategies...",
        "twitter": "Thread: How I scaled my SaaS to $10k MRR in 6 months 🧵👇\n\n1/7...",
        "facebook": "Scaling a SaaS business is tough. Here's what actually works..."
      }
    }
  }
}
```

---

## Solution 3: Market Research

Analyze competitors, market gaps, and opportunities.

### **POST /api/solutions/market-research**

**Request:**
```http
POST /api/solutions/market-research
Authorization: Bearer {token}
Content-Type: application/json

{
  "userId": "user-123",
  "researchType": "competitor_analysis",
  "industry": "Project Management Software",
  "competitors": [
    "Asana",
    "Monday.com",
    "ClickUp",
    "Trello",
    "Notion"
  ],
  "focusAreas": ["pricing", "features", "positioning", "target_market"]
}
```

**Research Types:**
- `competitor_analysis` - Deep dive on competitors
- `market_gap` - Find underserved niches
- `market_size` - TAM/SAM/SOM estimation
- `audience_research` - Target audience analysis
- `pricing_strategy` - Competitive pricing analysis

**Response (Completed):**
```json
{
  "id": "research-789",
  "state": "completed",
  "result": {
    "success": true,
    "research": {
      "competitors": [
        {
          "name": "Asana",
          "pricing": {
            "free": true,
            "starter": "$10.99/user/month",
            "business": "$24.99/user/month"
          },
          "features": ["task management", "timeline view", "portfolios", "goals"],
          "targetMarket": "Mid-size to enterprise teams",
          "strengths": ["Enterprise features", "integrations", "brand recognition"],
          "weaknesses": ["Expensive for small teams", "complex UI", "slow mobile app"],
          "positioning": "Premium enterprise solution"
        }
        // ... 4 more competitors
      ],
      "marketGaps": [
        {
          "gap": "Affordable project management for solo developers",
          "opportunity": "Build simplified PM tool priced at $5-10/month",
          "estimatedMarket": "500k+ solo developers",
          "competitionLevel": "Low"
        }
      ],
      "recommendations": [
        "Focus on simplicity vs feature bloat",
        "Price below $15/month to undercut Asana",
        "Target small teams (2-10 people) ignored by enterprise tools",
        "Emphasize ease of use and fast onboarding"
      ],
      "marketSize": {
        "TAM": "$50B (global project management software)",
        "SAM": "$5B (small business segment)",
        "SOM": "$50M (realistic 1% market share)"
      }
    }
  }
}
```

---

## Solution 4: Landing Page Builder

Generate complete landing pages with HTML/CSS.

### **POST /api/solutions/landing-page**

**Request:**
```http
POST /api/solutions/landing-page
Authorization: Bearer {token}
Content-Type: application/json

{
  "userId": "user-123",
  "productName": "TaskFlow Pro",
  "productDescription": "Project management tool for small teams",
  "targetAudience": "Small business owners, freelancers",
  "valueProposition": "Get organized in 5 minutes, not 5 days",
  "features": [
    "Visual task boards",
    "Team collaboration",
    "Time tracking",
    "Client portals"
  ],
  "pricing": {
    "plan": "starter",
    "price": "$10/month",
    "trial": true
  },
  "cta": "Start Free Trial"
}
```

**Response (Completed):**
```json
{
  "id": "landing-101",
  "state": "completed",
  "result": {
    "success": true,
    "landingPage": {
      "html": "<!DOCTYPE html>\n<html>...",
      "css": "/* Modern, responsive styles */\n...",
      "previewUrl": "https://preview.unbound.team/landing-101",
      "publishUrl": null,
      "sections": {
        "hero": "Get organized in 5 minutes...",
        "features": ["Visual task boards", "Team collaboration", ...],
        "socialProof": "Trusted by 1,000+ teams",
        "pricing": "$10/month - Start Free Trial",
        "faq": [...],
        "cta": "Start Free Trial"
      },
      "analytics": {
        "views": 0,
        "conversions": 0,
        "conversionRate": 0
      }
    }
  }
}
```

**Publish Landing Page:**
```http
POST /api/solutions/landing-page/publish/{pageId}
Authorization: Bearer {token}

Response:
{
  "published": true,
  "url": "https://pages.unbound.team/taskflow-pro"
}
```

---

## Solution 5: Email Marketing

Generate email campaigns and sequences.

### **POST /api/solutions/email-marketing**

**Request:**
```http
POST /api/solutions/email-marketing
Authorization: Bearer {token}
Content-Type: application/json

{
  "userId": "user-123",
  "campaignType": "welcome",
  "productName": "TaskFlow Pro",
  "emailCount": 5,
  "audience": "new trial users",
  "goals": ["onboarding", "feature adoption", "conversion"]
}
```

**Campaign Types:**
- `welcome` - Welcome sequence for new users
- `nurture` - Educational content sequence
- `sales` - Sales/conversion sequence
- `onboarding` - Product onboarding emails
- `reengagement` - Win back inactive users
- `promotion` - Limited-time offer campaign

**Response (Completed):**
```json
{
  "id": "email-202",
  "state": "completed",
  "result": {
    "success": true,
    "campaign": {
      "name": "TaskFlow Pro Welcome Sequence",
      "type": "welcome",
      "emailCount": 5,
      "emails": [
        {
          "number": 1,
          "sendDelay": "0 days (immediate)",
          "subject": "Welcome to TaskFlow Pro! Let's get you started 🚀",
          "subjectVariations": [
            "Your TaskFlow Pro account is ready!",
            "Ready to organize your projects? Start here."
          ],
          "body": "Hi {{first_name}},\n\nWelcome to TaskFlow Pro!...",
          "cta": "Complete Your Profile",
          "goal": "Initial setup",
          "estimatedOpenRate": "60-70%"
        },
        {
          "number": 2,
          "sendDelay": "1 day",
          "subject": "Quick win: Create your first task board in 2 minutes",
          "body": "...",
          "cta": "Create Task Board",
          "goal": "Feature adoption"
        }
        // ... 3 more emails
      ],
      "automationFlow": {
        "triggers": [
          "User signs up → Send Email 1",
          "1 day later → Send Email 2",
          "User creates board → Skip to Email 4",
          "3 days later → Send Email 3"
        ],
        "goals": [
          "70% complete onboarding",
          "50% create first project",
          "30% invite team member",
          "15% convert to paid"
        ]
      },
      "exportCsv": true
    }
  }
}
```

---

## Partner/Tenant Management API

For managing multi-tenant operations.

### **GET /api/partners/{tenantSlug}**

Get tenant information.

```http
GET /api/partners/kristi-empire
Authorization: Bearer {token}

Response:
{
  "id": "00000000-0000-0000-0000-000000000001",
  "name": "Kristi's Business Empire",
  "slug": "kristi-empire",
  "type": "main",
  "brands": {
    "maggie_forbes": {
      "name": "Maggie Forbes",
      "url": "maggieforbes.com",
      "target": "high-end business clients"
    },
    "growth_manager_pro": {
      "name": "Growth Manager Pro",
      "url": "growthmangerpro.com",
      "target": "solopreneurs"
    }
  },
  "stats": {
    "totalUsers": 95,
    "activeUsers": 87,
    "payingUsers": 62,
    "mrr": 88000
  }
}
```

### **POST /api/partners/{tenantSlug}/clients**

Provision new client.

```http
POST /api/partners/kristi-empire/clients
Authorization: Bearer {token}
Content-Type: application/json

{
  "email": "client@example.com",
  "name": "Sarah Johnson",
  "brand": "maggie-forbes",
  "consulting_tier": "premium",
  "plan": "premium",
  "source": "maggie-forbes"
}

Response:
{
  "success": true,
  "userId": "user-new-123",
  "email": "client@example.com",
  "brand": "maggie-forbes",
  "plan": "premium",
  "gmpAccess": true,
  "loginUrl": "https://app.growthmangerpro.com/login"
}
```

### **GET /api/partners/{tenantSlug}/stats**

Get partner statistics.

```http
GET /api/partners/kristi-empire/stats
Authorization: Bearer {token}

Response:
{
  "brands": {
    "maggie-forbes": {
      "totalClients": 15,
      "activeClients": 13,
      "monthlyRevenue": 82500,
      "tiers": {
        "strategy": { count: 5, revenue: 12500 },
        "premium": { count: 8, revenue: 40000 },
        "enterprise": { count: 2, revenue: 30000 }
      }
    },
    "growth-manager-pro": {
      "totalClients": 80,
      "activeClients": 72,
      "monthlyRevenue": 5500,
      "plans": {
        "starter": { count: 30, revenue: 1500 },
        "growth": { count: 42, revenue: 4000 }
      }
    }
  },
  "totalMonthlyRevenue": 88000,
  "annualRevenue": 1056000
}
```

---

## Automation API

Control partner lead generation automation.

### **GET /api/automation/status**

Get automation status.

```http
GET /api/automation/status
Authorization: Bearer {token}

Response:
{
  "scheduledJobs": [
    {
      "name": "Weekly partner lead generation",
      "schedule": "0 9 * * 1",
      "nextRun": "2024-01-22T09:00:00Z",
      "enabled": true
    },
    {
      "name": "Hourly opportunity discovery",
      "schedule": "0 * * * *",
      "nextRun": "2024-01-15T15:00:00Z",
      "enabled": true
    }
  ]
}
```

### **POST /api/automation/run/partner-lead-gen**

Manually trigger partner lead generation.

```http
POST /api/automation/run/partner-lead-gen
Authorization: Bearer {token}
Content-Type: application/json

{
  "brand": "maggie-forbes",
  "immediate": true
}

Response:
{
  "success": true,
  "jobId": "auto-303",
  "message": "Partner lead generation started for maggie-forbes"
}
```

---

## Webhooks

Unbound.team can send webhooks when jobs complete.

### **Configure Webhook:**

```http
POST /api/webhooks/configure
Authorization: Bearer {token}
Content-Type: application/json

{
  "url": "https://growthmangerpro.com/api/webhooks/unbound",
  "events": ["job.completed", "job.failed"],
  "secret": "webhook_secret_key"
}
```

### **Webhook Payload (Job Completed):**

```json
{
  "event": "job.completed",
  "timestamp": "2024-01-15T14:30:00Z",
  "data": {
    "jobId": "bd027295-90d9-4bc9-a5ff-ab8f716c9bb1",
    "userId": "user-123",
    "solutionType": "lead-generation",
    "state": "completed",
    "result": {
      "leadsFound": 50,
      "summary": { ... }
    }
  },
  "signature": "sha256=..."
}
```

**Verify Webhook:**
```javascript
const crypto = require('crypto');

function verifyWebhook(payload, signature, secret) {
  const hash = crypto
    .createHmac('sha256', secret)
    .update(JSON.stringify(payload))
    .digest('hex');

  return `sha256=${hash}` === signature;
}
```

---

## Rate Limits

**Free Tier:**
- 10 requests/minute
- 100 requests/day
- 1 concurrent job

**Starter ($50/month):**
- 60 requests/minute
- 1,000 requests/day
- 3 concurrent jobs

**Growth ($150/month):**
- 120 requests/minute
- 5,000 requests/day
- 10 concurrent jobs

**Premium (Maggie Forbes clients):**
- Unlimited requests
- Unlimited concurrent jobs
- Priority queue processing

---

## Error Handling

All errors follow this format:

```json
{
  "success": false,
  "error": {
    "code": "INVALID_REQUEST",
    "message": "Missing required field: targetIndustry",
    "details": {
      "field": "targetIndustry",
      "expected": "string",
      "received": "undefined"
    }
  }
}
```

**Error Codes:**
- `INVALID_REQUEST` - Bad request data
- `UNAUTHORIZED` - Invalid/missing token
- `FORBIDDEN` - Insufficient permissions
- `RATE_LIMIT_EXCEEDED` - Too many requests
- `JOB_FAILED` - Job processing failed
- `INTERNAL_ERROR` - Server error

---

## Example Integration (Growth Manager Pro)

```javascript
// In your Growth Manager Pro dashboard

class UnboundClient {
  constructor(apiKey) {
    this.baseUrl = 'https://api.unbound.team';
    this.apiKey = apiKey;
  }

  async generateLeads(params) {
    // Submit job
    const response = await fetch(`${this.baseUrl}/api/solutions/lead-generation`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(params)
    });

    const { jobId } = await response.json();

    // Poll for results
    return this.pollJob('lead-generation', jobId);
  }

  async pollJob(solutionType, jobId) {
    while (true) {
      const response = await fetch(
        `${this.baseUrl}/api/solutions/${solutionType}/status/${jobId}`,
        {
          headers: { 'Authorization': `Bearer ${this.apiKey}` }
        }
      );

      const job = await response.json();

      if (job.state === 'completed') {
        return job.result;
      }

      if (job.state === 'failed') {
        throw new Error(job.error);
      }

      // Wait 5 seconds before polling again
      await new Promise(resolve => setTimeout(resolve, 5000));
    }
  }
}

// Usage in Growth Manager Pro
const unbound = new UnboundClient(user.apiKey);

// Generate leads button click
async function handleGenerateLeads() {
  const results = await unbound.generateLeads({
    userId: currentUser.id,
    targetIndustry: formData.industry,
    criteria: {
      count: formData.count,
      minScore: formData.minScore
    }
  });

  // Display results
  displayLeads(results.leads);
}
```

---

## Summary

**Unbound.team provides 5 core solutions:**
1. Lead Generation - Find qualified prospects
2. Content Creation - Blog posts, social media, emails
3. Market Research - Competitor analysis, market gaps
4. Landing Pages - Complete sales pages
5. Email Marketing - Automated campaigns

**All solutions use async job pattern:**
- Submit job → Get job ID
- Poll status → Get results

**Integration is simple:**
- REST API with Bearer token auth
- Webhook support for real-time updates
- Comprehensive error handling
- Multiple pricing tiers with different limits

**This API documentation enables Growth Manager Pro (or any platform) to integrate all Unbound.team features seamlessly.**
