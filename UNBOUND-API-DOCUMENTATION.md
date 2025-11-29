# Unbound.team API Documentation
## Your Autonomous AI Team - Integration Guide

**Version:** 1.0.0
**Base URL:** `https://api.unbound.team` (Production) | `http://localhost:3001` (Development)
**Last Updated:** November 29, 2025

---

## Table of Contents

1. [Quick Start](#quick-start)
2. [Authentication](#authentication)
3. [Core Endpoints](#core-endpoints)
4. [Solutions API](#solutions-api)
5. [Partner/Multi-Tenant API](#partnermulti-tenant-api)
6. [Automation API](#automation-api)
7. [Queue Management](#queue-management)
8. [Error Handling](#error-handling)
9. [Rate Limits & Usage](#rate-limits--usage)
10. [Code Examples](#code-examples)

---

## Quick Start

### 1. Get API Credentials

Contact us to receive your:
- **API Key** (for server-to-server)
- **Tenant Slug** (for multi-tenant partners)

### 2. Make Your First API Call

```bash
curl https://api.unbound.team/health
```

Response:
```json
{
  "status": "healthy",
  "timestamp": "2025-11-29T20:51:45.064Z"
}
```

### 3. Generate Your First Leads

```bash
curl -X POST https://api.unbound.team/api/solutions/lead-generation \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user-123",
    "targetIndustry": "SaaS founders",
    "location": "global",
    "criteria": {
      "count": 10,
      "minScore": 7
    }
  }'
```

Response:
```json
{
  "success": true,
  "jobId": "abc-123",
  "message": "Lead generation started. Check back in a few minutes.",
  "statusUrl": "/api/solutions/lead-generation/status/abc-123"
}
```

---

## Authentication

### API Key Authentication

Include your API key in the Authorization header:

```http
Authorization: Bearer YOUR_API_KEY
```

### Getting Your API Key

1. Sign up as a partner at [unbound.team/partners](https://unbound.team/partners)
2. Your API key will be provided in your partner dashboard
3. Store it securely in your environment variables

```bash
# .env
UNBOUND_API_KEY=your_api_key_here
```

---

## Core Endpoints

### Health Check

Check if the API is running.

**Endpoint:** `GET /health`
**Authentication:** None required

```bash
curl https://api.unbound.team/health
```

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2025-11-29T20:51:45.064Z"
}
```

---

### API Information

Get API version and status.

**Endpoint:** `GET /`
**Authentication:** None required

```bash
curl https://api.unbound.team/
```

**Response:**
```json
{
  "name": "Unbound.team API",
  "status": "running",
  "version": "1.0.0",
  "mission": "Your Autonomous AI Team - Unbound from Big Tech"
}
```

---

### AI Usage Statistics

Get AI model usage and cost statistics.

**Endpoint:** `GET /api/ai/stats`
**Authentication:** Required

```bash
curl https://api.unbound.team/api/ai/stats \
  -H "Authorization: Bearer YOUR_API_KEY"
```

**Response:**
```json
{
  "dailySpent": 3.45,
  "dailyCap": 5.00,
  "percentUsed": 69,
  "modelUsage": {
    "gemini": 145,
    "gpt4omini": 23,
    "claude-haiku": 12
  }
}
```

---

## Solutions API

The 5 core AI-powered solutions.

### 1. Lead Generation

Generate qualified leads automatically.

**Endpoint:** `POST /api/solutions/lead-generation`
**Authentication:** Required

**Request Body:**
```json
{
  "userId": "string (required)",
  "targetIndustry": "string (required) - Description of target audience",
  "location": "string (required) - Geographic location",
  "criteria": {
    "count": "number (required) - Number of leads to find",
    "minScore": "number (optional, 1-10) - Minimum fit score, default: 6",
    "industry": "string (optional) - Specific industry filter"
  }
}
```

**Example Request:**
```bash
curl -X POST https://api.unbound.team/api/solutions/lead-generation \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user-123",
    "targetIndustry": "E-commerce businesses needing email marketing",
    "location": "United States",
    "criteria": {
      "count": 50,
      "minScore": 8,
      "industry": "e-commerce"
    }
  }'
```

**Response:**
```json
{
  "success": true,
  "jobId": "lead-gen-abc123",
  "message": "Lead generation started. Check back in a few minutes.",
  "statusUrl": "/api/solutions/lead-generation/status/lead-gen-abc123"
}
```

**Check Job Status:**
```bash
curl https://api.unbound.team/api/solutions/lead-generation/status/lead-gen-abc123 \
  -H "Authorization: Bearer YOUR_API_KEY"
```

**Status Response (Processing):**
```json
{
  "id": "lead-gen-abc123",
  "state": "processing",
  "progress": 50,
  "result": null,
  "error": null
}
```

**Status Response (Completed):**
```json
{
  "id": "lead-gen-abc123",
  "state": "completed",
  "progress": 100,
  "result": {
    "leadsFound": 50,
    "leads": [
      {
        "name": "John Doe",
        "company": "Acme E-commerce",
        "email": "john@acme.com",
        "location": "California, USA",
        "fitScore": 9,
        "painPoints": ["Low email open rates", "Cart abandonment"],
        "outreachStrategy": "Focus on abandoned cart recovery...",
        "source": "reddit/r/ecommerce"
      }
    ],
    "summary": {
      "avgFitScore": 8.4,
      "sources": ["reddit", "indie-hackers", "product-hunt"],
      "industries": ["e-commerce"]
    },
    "csv": "name,company,email,fitScore,painPoints\nJohn Doe,Acme..."
  }
}
```

---

### 2. Content Creation

Generate blog posts, social media content, and marketing copy.

**Endpoint:** `POST /api/solutions/content-creation`
**Authentication:** Required

**Request Body:**
```json
{
  "userId": "string (required)",
  "topic": "string (required) - Content topic",
  "keywords": "array of strings (optional) - SEO keywords",
  "tone": "string (optional) - professional|casual|friendly, default: professional",
  "wordCount": "number (optional) - Target word count, default: 1000"
}
```

**Example Request:**
```bash
curl -X POST https://api.unbound.team/api/solutions/content-creation \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user-123",
    "topic": "How to Reduce Cart Abandonment in E-commerce",
    "keywords": ["cart abandonment", "e-commerce", "conversion"],
    "tone": "professional",
    "wordCount": 1500
  }'
```

**Response:**
```json
{
  "success": true,
  "jobId": "content-xyz789",
  "message": "Content creation started.",
  "statusUrl": "/api/jobs/contentCreation/content-xyz789"
}
```

**Result (when completed):**
```json
{
  "content": "# How to Reduce Cart Abandonment...\n\nCart abandonment is...",
  "wordCount": 1523,
  "seo": {
    "title": "7 Proven Ways to Reduce Cart Abandonment (2025 Guide)",
    "metaDescription": "Reduce cart abandonment with these...",
    "keywords": ["cart abandonment", "e-commerce", "conversion"]
  },
  "socialPosts": {
    "linkedin": "Cart abandonment costing you sales? Here's how...",
    "twitter": "🛒 Cart abandonment tip: Always send...",
    "facebook": "E-commerce owners: Are you losing..."
  }
}
```

---

### 3. Market Research

Analyze competitors and identify market opportunities.

**Endpoint:** `POST /api/solutions/market-research`
**Authentication:** Required

**Request Body:**
```json
{
  "userId": "string (required)",
  "idea": "string (required) - Business idea to research",
  "industry": "string (required) - Industry/market",
  "competitors": "array of strings (optional) - Known competitors"
}
```

**Example Request:**
```bash
curl -X POST https://api.unbound.team/api/solutions/market-research \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user-123",
    "idea": "AI-powered email assistant for e-commerce",
    "industry": "e-commerce software",
    "competitors": ["Klaviyo", "Mailchimp", "Omnisend"]
  }'
```

**Response:**
```json
{
  "success": true,
  "jobId": "research-def456",
  "message": "Market research started.",
  "statusUrl": "/api/jobs/marketResearch/research-def456"
}
```

**Result (when completed):**
```json
{
  "marketSize": {
    "tam": "$12.5B",
    "sam": "$3.2B",
    "som": "$180M"
  },
  "competitorAnalysis": [
    {
      "name": "Klaviyo",
      "strengths": ["Advanced segmentation", "Strong analytics"],
      "weaknesses": ["Complex pricing", "Steep learning curve"],
      "pricing": "$45-$2000/month",
      "marketShare": "23%"
    }
  ],
  "marketGaps": [
    "Simple AI-powered automation for small stores",
    "Affordable pricing for startups"
  ],
  "targetAudience": {
    "segments": ["Small e-commerce stores ($10k-$100k/mo revenue)"],
    "painPoints": ["Expensive tools", "Too complex for small teams"]
  },
  "pricingRecommendation": {
    "strategy": "Value-based pricing",
    "tiers": [
      { "name": "Starter", "price": "$29/mo", "target": "Stores < $50k/mo" }
    ]
  },
  "opportunityScore": 8.5
}
```

---

### 4. Landing Page Builder

Create high-converting landing pages.

**Endpoint:** `POST /api/solutions/landing-page`
**Authentication:** Required

**Request Body:**
```json
{
  "userId": "string (required)",
  "businessInfo": {
    "name": "string (required) - Business name",
    "product": "string (required) - Product/service description",
    "targetAudience": "string (required) - Who it's for",
    "valueProposition": "string (required) - Main benefit"
  },
  "goals": {
    "cta": "string (required) - Call to action",
    "conversion": "string (required) - signup|purchase|contact"
  }
}
```

**Example Request:**
```bash
curl -X POST https://api.unbound.team/api/solutions/landing-page \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user-123",
    "businessInfo": {
      "name": "CartSaver AI",
      "product": "AI email assistant that recovers abandoned carts",
      "targetAudience": "E-commerce store owners",
      "valueProposition": "Recover 30% more abandoned carts automatically"
    },
    "goals": {
      "cta": "Start Free Trial",
      "conversion": "signup"
    }
  }'
```

**Response:**
```json
{
  "success": true,
  "jobId": "page-ghi789",
  "message": "Landing page creation started.",
  "statusUrl": "/api/jobs/landingPage/page-ghi789"
}
```

**Result (when completed):**
```json
{
  "html": "<html>...</html>",
  "css": "body { ... }",
  "sections": {
    "hero": "Recover 30% More Abandoned Carts...",
    "features": ["AI-powered emails", "Automatic triggers"],
    "socialProof": ["\"Recovered $12k in first month\" - John D."],
    "faq": [{"q": "How does it work?", "a": "Our AI..."}],
    "cta": "Start Free Trial - No Credit Card Required"
  },
  "previewUrl": "https://pages.unbound.team/preview/page-ghi789",
  "publishUrl": null
}
```

---

### 5. Email Marketing

Create automated email campaigns.

**Endpoint:** `POST /api/solutions/email-marketing`
**Authentication:** Required

**Request Body:**
```json
{
  "userId": "string (required)",
  "goal": "string (required) - welcome|nurture|sales|onboarding",
  "audience": "string (required) - Target audience description",
  "offer": "string (optional) - Product/service being promoted"
}
```

**Example Request:**
```bash
curl -X POST https://api.unbound.team/api/solutions/email-marketing \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user-123",
    "goal": "welcome",
    "audience": "New e-commerce store owners who signed up for trial",
    "offer": "CartSaver AI - abandoned cart recovery tool"
  }'
```

**Response:**
```json
{
  "success": true,
  "jobId": "email-jkl012",
  "message": "Email marketing campaign creation started.",
  "statusUrl": "/api/jobs/emailMarketing/email-jkl012"
}
```

**Result (when completed):**
```json
{
  "campaignType": "welcome",
  "sequenceLength": 5,
  "emails": [
    {
      "day": 0,
      "subject": "Welcome to CartSaver! Here's how to get started",
      "body": "Hi {{name}},\n\nWelcome to CartSaver!...",
      "plainText": "Hi {{name}}, Welcome to...",
      "sendTime": "immediately"
    },
    {
      "day": 2,
      "subject": "Your first abandoned cart email is ready",
      "body": "...",
      "sendTime": "10:00 AM local"
    }
  ],
  "automationFlow": {
    "trigger": "User signs up",
    "conditions": ["Has active trial", "Hasn't sent first email"],
    "actions": ["Send welcome email", "Wait 2 days", "Send setup email"]
  },
  "csv": "day,subject,sendTime\n0,Welcome to CartSaver!,immediately"
}
```

---

## Partner/Multi-Tenant API

For partners who provision clients under their own brand.

### Get Tenant Information

**Endpoint:** `GET /api/partner/:tenantSlug`
**Authentication:** Required

```bash
curl https://api.unbound.team/api/partner/kristi-empire \
  -H "Authorization: Bearer YOUR_API_KEY"
```

**Response:**
```json
{
  "id": "tenant-123",
  "slug": "kristi-empire",
  "name": "Kristi's Empire",
  "brands": ["maggie-forbes", "growth-manager-pro"],
  "status": "active",
  "createdAt": "2025-11-01T00:00:00Z"
}
```

---

### Get Partner Dashboard Stats

**Endpoint:** `GET /api/partner/:tenantSlug/stats`
**Authentication:** Required

```bash
curl https://api.unbound.team/api/partner/kristi-empire/stats \
  -H "Authorization: Bearer YOUR_API_KEY"
```

**Response:**
```json
{
  "totalClients": 125,
  "activeClients": 98,
  "brands": {
    "maggie-forbes": 23,
    "growth-manager-pro": 102
  },
  "monthlyRevenue": 15750.00,
  "jobsProcessed": {
    "month": 1234,
    "today": 42
  }
}
```

---

### Provision Single Client

**Endpoint:** `POST /api/partner/:tenantSlug/provision-client`
**Authentication:** Required

**Request Body:**
```json
{
  "userEmail": "string (required)",
  "userName": "string (required)",
  "plan": "string (optional) - free|starter|growth|premium, default: free",
  "source": "string (optional) - Where client came from"
}
```

**Example Request:**
```bash
curl -X POST https://api.unbound.team/api/partner/kristi-empire/provision-client \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "userEmail": "client@example.com",
    "userName": "Jane Doe",
    "plan": "growth",
    "source": "growth-manager-pro"
  }'
```

**Response:**
```json
{
  "success": true,
  "userId": "user-456",
  "email": "client@example.com",
  "plan": "growth",
  "limits": {
    "leadsPerMonth": 200,
    "contentPerMonth": 50
  },
  "createdAt": "2025-11-29T20:51:45Z"
}
```

---

### Bulk Provision Clients

**Endpoint:** `POST /api/partner/:tenantSlug/bulk-provision`
**Authentication:** Required

**Request Body:**
```json
{
  "clients": [
    {
      "userEmail": "string (required)",
      "userName": "string (required)",
      "plan": "string (optional)",
      "source": "string (optional)"
    }
  ]
}
```

**Example Request:**
```bash
curl -X POST https://api.unbound.team/api/partner/kristi-empire/bulk-provision \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "clients": [
      {
        "userEmail": "client1@example.com",
        "userName": "Client One",
        "plan": "starter"
      },
      {
        "userEmail": "client2@example.com",
        "userName": "Client Two",
        "plan": "growth"
      }
    ]
  }'
```

**Response:**
```json
{
  "success": true,
  "provisioned": 2,
  "failed": 0,
  "results": [
    {
      "email": "client1@example.com",
      "status": "success",
      "userId": "user-789"
    },
    {
      "email": "client2@example.com",
      "status": "success",
      "userId": "user-790"
    }
  ]
}
```

---

### Update Client Plan

**Endpoint:** `PUT /api/partner/:tenantSlug/client/:userEmail/plan`
**Authentication:** Required

**Request Body:**
```json
{
  "plan": "string (required) - free|starter|growth|premium"
}
```

**Example Request:**
```bash
curl -X PUT https://api.unbound.team/api/partner/kristi-empire/client/client@example.com/plan \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"plan": "premium"}'
```

**Response:**
```json
{
  "success": true,
  "userId": "user-456",
  "oldPlan": "growth",
  "newPlan": "premium",
  "newLimits": {
    "leadsPerMonth": "unlimited",
    "contentPerMonth": "unlimited"
  }
}
```

---

### Get Revenue Share Report

**Endpoint:** `GET /api/partner/:tenantSlug/revenue`
**Authentication:** Required

**Query Parameters:**
- `startMonth` (optional): YYYY-MM format, defaults to current month
- `endMonth` (optional): YYYY-MM format, defaults to current month

```bash
curl "https://api.unbound.team/api/partner/kristi-empire/revenue?startMonth=2025-10&endMonth=2025-11" \
  -H "Authorization: Bearer YOUR_API_KEY"
```

**Response:**
```json
{
  "tenantSlug": "kristi-empire",
  "period": {
    "start": "2025-10",
    "end": "2025-11"
  },
  "totalRevenue": 31500.00,
  "revenueShare": 15750.00,
  "sharePercentage": 50,
  "breakdown": [
    {
      "month": "2025-10",
      "revenue": 15000.00,
      "share": 7500.00,
      "clients": 95
    },
    {
      "month": "2025-11",
      "revenue": 16500.00,
      "share": 8250.00,
      "clients": 102
    }
  ]
}
```

---

### Add Testimonial

**Endpoint:** `POST /api/partner/:tenantSlug/testimonial`
**Authentication:** Required

**Request Body:**
```json
{
  "clientEmail": "string (required)",
  "clientName": "string (required)",
  "content": "string (required) - Testimonial text",
  "rating": "number (optional, 1-5)",
  "type": "string (optional) - text|video|case-study"
}
```

**Example Request:**
```bash
curl -X POST https://api.unbound.team/api/partner/kristi-empire/testimonial \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "clientEmail": "happy@client.com",
    "clientName": "Happy Client",
    "content": "Generated 50 qualified leads in the first week!",
    "rating": 5,
    "type": "text"
  }'
```

**Response:**
```json
{
  "success": true,
  "testimonial": {
    "id": "test-123",
    "clientName": "Happy Client",
    "content": "Generated 50 qualified leads in the first week!",
    "rating": 5,
    "createdAt": "2025-11-29T20:51:45Z",
    "published": false
  }
}
```

---

### Get Social Proof

**Endpoint:** `GET /api/partner/:tenantSlug/social-proof`
**Authentication:** Required

**Query Parameters:**
- `type` (optional): text|video|case-study
- `publishedOnly` (optional): true|false, defaults to true

```bash
curl "https://api.unbound.team/api/partner/kristi-empire/social-proof?type=text&publishedOnly=true" \
  -H "Authorization: Bearer YOUR_API_KEY"
```

**Response:**
```json
{
  "testimonials": [
    {
      "id": "test-123",
      "clientName": "Happy Client",
      "content": "Generated 50 qualified leads in the first week!",
      "rating": 5,
      "type": "text",
      "createdAt": "2025-11-29T20:51:45Z"
    }
  ],
  "stats": {
    "totalClients": 102,
    "averageRating": 4.8,
    "totalTestimonials": 23
  }
}
```

---

## Automation API

Manage scheduled and on-demand automation tasks.

### Get Automation Status

**Endpoint:** `GET /api/automation/status`
**Authentication:** Required

```bash
curl https://api.unbound.team/api/automation/status \
  -H "Authorization: Bearer YOUR_API_KEY"
```

**Response:**
```json
{
  "running": true,
  "scheduledJobs": [
    {
      "name": "Weekly Partner Lead Generation",
      "schedule": "Mon 9am",
      "nextRun": "2025-12-02T09:00:00Z"
    },
    {
      "name": "Hourly Opportunity Discovery",
      "schedule": "Every hour",
      "nextRun": "2025-11-29T21:00:00Z"
    }
  ]
}
```

---

### Trigger Partner Lead Generation

**Endpoint:** `POST /api/automation/trigger/lead-gen/:tenantSlug`
**Authentication:** Required

**Request Body (optional):**
```json
{
  "targetIndustry": "string (optional)",
  "location": "string (optional)",
  "count": "number (optional)"
}
```

**Example Request:**
```bash
curl -X POST https://api.unbound.team/api/automation/trigger/lead-gen/kristi-empire \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "targetIndustry": "SaaS founders",
    "location": "global",
    "count": 100
  }'
```

**Response:**
```json
{
  "success": true,
  "message": "Lead generation triggered for kristi-empire",
  "jobId": "auto-lead-abc123"
}
```

---

### Trigger Opportunity Scan

**Endpoint:** `POST /api/automation/trigger/opportunity-scan`
**Authentication:** Required

```bash
curl -X POST https://api.unbound.team/api/automation/trigger/opportunity-scan \
  -H "Authorization: Bearer YOUR_API_KEY"
```

**Response:**
```json
{
  "success": true,
  "message": "Found 12 opportunities",
  "opportunities": [
    {
      "source": "reddit/r/entrepreneur",
      "title": "Looking for lead generation tools",
      "urgency": "high",
      "fitScore": 8
    }
  ]
}
```

---

## Queue Management

### Get Job Status

**Endpoint:** `GET /api/jobs/:queueName/:jobId`
**Authentication:** Required

```bash
curl https://api.unbound.team/api/jobs/leadGeneration/job-123 \
  -H "Authorization: Bearer YOUR_API_KEY"
```

**Response:**
```json
{
  "id": "job-123",
  "queue": "leadGeneration",
  "status": "completed",
  "progress": 100,
  "result": { ... },
  "error": null,
  "createdAt": "2025-11-29T20:00:00Z",
  "completedAt": "2025-11-29T20:05:23Z"
}
```

---

### Get Queue Statistics

**Endpoint:** `GET /api/queues/:queueName/stats`
**Authentication:** Required

```bash
curl https://api.unbound.team/api/queues/leadGeneration/stats \
  -H "Authorization: Bearer YOUR_API_KEY"
```

**Response:**
```json
{
  "queue": "leadGeneration",
  "waiting": 3,
  "active": 2,
  "completed": 156,
  "failed": 4,
  "total": 165
}
```

---

### Get All Queue Statistics

**Endpoint:** `GET /api/queues/stats`
**Authentication:** Required

```bash
curl https://api.unbound.team/api/queues/stats \
  -H "Authorization: Bearer YOUR_API_KEY"
```

**Response:**
```json
{
  "leadGeneration": {
    "waiting": 3,
    "active": 2,
    "completed": 156,
    "failed": 4
  },
  "contentCreation": {
    "waiting": 1,
    "active": 1,
    "completed": 89,
    "failed": 2
  },
  "marketResearch": {
    "waiting": 0,
    "active": 0,
    "completed": 45,
    "failed": 1
  }
}
```

---

## Error Handling

### Standard Error Response

All errors follow this format:

```json
{
  "error": "Error message describing what went wrong"
}
```

### HTTP Status Codes

| Code | Meaning | Description |
|------|---------|-------------|
| 200 | OK | Request succeeded |
| 400 | Bad Request | Invalid request parameters |
| 401 | Unauthorized | Missing or invalid API key |
| 404 | Not Found | Resource not found |
| 429 | Too Many Requests | Rate limit exceeded |
| 500 | Internal Server Error | Server error |

### Example Error Responses

**400 Bad Request:**
```json
{
  "error": "targetIndustry and location are required"
}
```

**401 Unauthorized:**
```json
{
  "error": "Invalid API key"
}
```

**404 Not Found:**
```json
{
  "error": "Job not found"
}
```

**429 Rate Limit:**
```json
{
  "error": "Rate limit exceeded. Please try again in 60 seconds."
}
```

---

## Rate Limits & Usage

### Rate Limits

| Plan | Requests/Hour | Concurrent Jobs |
|------|---------------|-----------------|
| Free | 100 | 2 |
| Starter | 500 | 5 |
| Growth | 2000 | 10 |
| Premium | Unlimited | 20 |

### Usage Limits

| Plan | Leads/Month | Content/Month | Research/Month |
|------|-------------|---------------|----------------|
| Free | 10 | 5 | 2 |
| Starter | 50 | 20 | 10 |
| Growth | 200 | 50 | 25 |
| Premium | Unlimited | Unlimited | Unlimited |

### Rate Limit Headers

Response headers include rate limit information:

```http
X-RateLimit-Limit: 500
X-RateLimit-Remaining: 487
X-RateLimit-Reset: 1701288000
```

---

## Code Examples

### JavaScript/Node.js

```javascript
const UnboundClient = require('./unbound-client');

const client = new UnboundClient(process.env.UNBOUND_API_KEY);

// Generate leads
async function generateLeads() {
  const job = await client.generateLeads({
    userId: 'user-123',
    targetIndustry: 'SaaS founders',
    location: 'global',
    criteria: {
      count: 50,
      minScore: 7
    }
  });

  console.log(`Job started: ${job.jobId}`);

  // Poll for results
  const result = await client.pollJobStatus(job.jobId);
  console.log(`Found ${result.leadsFound} leads!`);
}

generateLeads();
```

### Python

```python
import requests
import time

class UnboundClient:
    def __init__(self, api_key):
        self.base_url = "https://api.unbound.team"
        self.api_key = api_key

    def generate_leads(self, params):
        response = requests.post(
            f"{self.base_url}/api/solutions/lead-generation",
            headers={
                "Authorization": f"Bearer {self.api_key}",
                "Content-Type": "application/json"
            },
            json=params
        )
        return response.json()

    def get_job_status(self, job_id):
        response = requests.get(
            f"{self.base_url}/api/solutions/lead-generation/status/{job_id}",
            headers={"Authorization": f"Bearer {self.api_key}"}
        )
        return response.json()

    def wait_for_job(self, job_id):
        while True:
            status = self.get_job_status(job_id)
            if status['state'] == 'completed':
                return status['result']
            elif status['state'] == 'failed':
                raise Exception(status['error'])
            time.sleep(3)

# Usage
client = UnboundClient('your-api-key')

job = client.generate_leads({
    'userId': 'user-123',
    'targetIndustry': 'SaaS founders',
    'location': 'global',
    'criteria': {
        'count': 50,
        'minScore': 7
    }
})

print(f"Job started: {job['jobId']}")
result = client.wait_for_job(job['jobId'])
print(f"Found {result['leadsFound']} leads!")
```

### PHP

```php
<?php

class UnboundClient {
    private $baseUrl = 'https://api.unbound.team';
    private $apiKey;

    public function __construct($apiKey) {
        $this->apiKey = $apiKey;
    }

    public function generateLeads($params) {
        $ch = curl_init($this->baseUrl . '/api/solutions/lead-generation');

        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($params));
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_HTTPHEADER, [
            'Authorization: Bearer ' . $this->apiKey,
            'Content-Type: application/json'
        ]);

        $response = curl_exec($ch);
        curl_close($ch);

        return json_decode($response, true);
    }

    public function getJobStatus($jobId) {
        $ch = curl_init($this->baseUrl . '/api/solutions/lead-generation/status/' . $jobId);

        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_HTTPHEADER, [
            'Authorization: Bearer ' . $this->apiKey
        ]);

        $response = curl_exec($ch);
        curl_close($ch);

        return json_decode($response, true);
    }
}

// Usage
$client = new UnboundClient('your-api-key');

$job = $client->generateLeads([
    'userId' => 'user-123',
    'targetIndustry' => 'SaaS founders',
    'location' => 'global',
    'criteria' => [
        'count' => 50,
        'minScore' => 7
    ]
]);

echo "Job started: " . $job['jobId'] . "\n";
?>
```

---

## Support

**Documentation:** [docs.unbound.team](https://docs.unbound.team)
**Email:** support@unbound.team
**Discord:** [discord.gg/unbound](https://discord.gg/unbound)
**Status Page:** [status.unbound.team](https://status.unbound.team)

---

## Changelog

### v1.0.0 (2025-11-29)
- Initial API release
- 5 core solutions (Leads, Content, Research, Pages, Email)
- Multi-tenant partner system
- Automation scheduler
- Queue management

---

**Built with ❤️ by Unbound.team - Your Autonomous AI Team, Unbound from Big Tech**
