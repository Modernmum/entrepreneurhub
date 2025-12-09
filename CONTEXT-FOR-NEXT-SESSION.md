# Context for Next Session - Unbound-Team

**Date:** December 9, 2025
**Session Summary:** Built intelligent sales automation system with qualification, scoring, batch processing, and AI research

---

## 🎯 Business Model (CRITICAL CONTEXT)

### What is Unbound-Team?
**Unbound-Team** is a B2B SaaS platform that builds **autonomous client acquisition systems** FOR other businesses.

### The Model:
- **Unbound** = The product/platform (parent system)
- **Maggie Forbes Strategies** = First client (pilot/testing ground)
- **Future Clients** = Other businesses who want the same automation

### How It Works:
1. Unbound discovers opportunities FOR Maggie Forbes (entrepreneurs needing help)
2. Unbound qualifies, researches, and reaches out on behalf of Maggie Forbes
3. Unbound converts leads into clients FOR Maggie Forbes
4. Maggie Forbes gets automated client acquisition
5. **Success with MFS → Proof of concept → Sell to other clients**

### Repository Structure:
- **Unbound-Team** (`/Users/Kristi/Documents/Unbound-Team`) = Standalone parent system
- **NOT a submodule** of zero-to-legacy-engine
- **Deployed independently** on Railway
- **Maggie Forbes Strategies website** = Completely separate (Vercel)

---

## 🏗️ System Architecture Built Today

### 1. Intelligent Qualification & Scoring ✅
**File:** `backend/services/intelligent-scorer.js`
**Uses:** Claude (Anthropic API)

**Flow:**
1. **Pre-Qualification** (Filter FIRST):
   - Looking for support/hiring/solutions? ✅
   - Has money/funding? ✅
   - Relevant pain point? ✅
   - Reachable contact? ✅
   - **If NO → SKIP** (don't waste time)
   - **If YES → Move to scoring**

2. **AI Scoring** (40-point scale):
   - Pain severity (1-10)
   - Budget likelihood (1-10)
   - Urgency (1-10)
   - Fit with Unbound (1-10)
   - **Total 30+ = Process, <30 = Skip**

**Key Signals Detected:**
- Needs help, hiring, sourcing solutions
- Funding, paying for tools, budget mentions
- Pain points, problems, challenges
- Contact info (email/domain)

### 2. Batch Processor ✅
**File:** `backend/services/batch-processor.js`
**Uses:** Supabase only (no AI)

**Workflow:**
- **Inventory Target:** 10,000 qualified leads
- **Batch Size:** 100 leads at a time
- **Processing:**
  1. Take 100 from inventory
  2. Research those 100
  3. Send outreach to those 100
  4. Monitor results
  5. Then take next 100
  6. Repeat

**Why This Approach:**
- User sent 18,000 emails with little response
- **Quality over quantity** = better results
- Deep research + personalization per batch
- Controlled, won't break anything

### 3. AI Research Agent ✅
**File:** `backend/services/ai-researcher.js`
**Uses:** Perplexity API (web search)

**Research Per Lead:**
1. Company background (real web search)
2. Pain point analysis
3. Decision maker identification
4. Recent activity & news
5. Market & competitive context
6. Personalization hooks
7. Recommended approach

**Why Perplexity:**
- Searches actual web for company info
- Finds recent posts, activity, news
- Discovers decision makers
- Cites sources
- Real-time market intelligence

---

## 📊 Complete Sales Funnel Design

### The Flow:
```
Discovery (10k inventory)
    ↓
Pre-Qualification (filter)
    ↓
AI Scoring (40-point scale)
    ↓
Batch Selection (100 at a time)
    ↓
AI Research (Perplexity)
    ↓
Personalized Outreach
    ↓
AI Email Conversations
    ↓
Auto-Book Calls
    ↓
Clients for Maggie Forbes
```

---

## 🔧 What Still Needs Building

### 1. AI Email Conversation Handler
**Status:** Not built yet
**Purpose:** AI responds to email replies, builds rapport, handles objections
**Uses:** Claude (Anthropic)

### 2. Auto-Booking System
**Status:** Not built yet
**Purpose:** When lead is interested, automatically send calendar link and book calls
**Integration:** Calendly or similar

### 3. Database Schema Updates
**Status:** Not built yet
**Needs:**
- `processing_batches` table
- `lead_research` table
- `email_conversations` table
- Update `scored_opportunities` with new fields

### 4. Integration & Wiring
**Status:** Not built yet
**Needs:**
- Wire new services into existing agents
- Update API endpoints
- Connect to dashboard
- Test end-to-end flow

---

## 🗄️ Database Structure

### Current Tables:
- `scored_opportunities` - Discovered opportunities with fit scores
- `market_gaps` - Identified market gaps
- `outreach_campaigns` - Email campaigns
- `solution_deliveries` - Solution delivery tracking

### Tables Needed:
- `processing_batches` - Batch workflow management
- `lead_research` - Perplexity research results
- `email_conversations` - AI conversation threads
- `system_settings` - Auto-send controls, limits

---

## 🔑 API Keys Required

### Current (Working):
- ✅ `SUPABASE_URL`
- ✅ `SUPABASE_SERVICE_KEY`
- ✅ `ANTHROPIC_API_KEY` (for Claude)

### New (Needed):
- ⚠️ `PERPLEXITY_API_KEY` (for research agent)

---

## 📈 Success Metrics & Goals

### Learned From Experience:
- User sent **18,000 emails** → Little response
- Problem: No personalization, spray-and-pray approach
- Solution: **Quality over quantity** with AI research

### New Approach Targets:
- **Inventory:** 10,000 qualified leads
- **Batch:** 100 at a time
- **Research:** Deep dive per lead (Perplexity)
- **Personalization:** Irresistible, custom invites
- **Expected:** 5-10k emails needed for real traction
- **Timeline:** 100 clients = proof of scalability

---

## 🎨 Dashboard Status

### Maggie Forbes Branded Dashboard:
- **File:** `maggieforbes-unbound-dashboard.html`
- **Location:** `/Users/Kristi/Documents/Unbound-Team/`
- **Branding:** MFS × UT (Gold #B8935F, Navy #1a2332)
- **Status:** ✅ Working, connected to Railway API
- **Features:**
  - Real-time opportunity feed
  - Agent controls (start/stop)
  - Discovery triggers
  - Email stats
  - Activity feed

---

## 🚀 Production Status

### Backend (Railway):
- **URL:** https://web-production-486cb.up.railway.app
- **Status:** ✅ Healthy (9/9 services loaded)
- **Tests:** 100% pass rate (8/8 tests)
- **Database:** Supabase PostgreSQL connected
- **Discovery:** 46+ opportunities already found

### Current System State:
- ✅ Discovery working (RSS + Forums)
- ✅ Opportunity scoring operational
- ✅ Agents ready to activate
- 🔄 New intelligent system being built
- ⏸️ Agents currently stopped (ready when new system complete)

---

## 📝 Files Built This Session

### New Service Files:
1. **`backend/services/intelligent-scorer.js`**
   - Uses: Claude (Anthropic API)
   - Purpose: Pre-qualification + AI scoring
   - Status: Complete ✅

2. **`backend/services/batch-processor.js`**
   - Uses: Supabase only
   - Purpose: Manage 100-lead batches from 10k inventory
   - Status: Complete ✅

3. **`backend/services/ai-researcher.js`**
   - Uses: Perplexity API
   - Purpose: Deep web research per lead
   - Status: Complete ✅

### Documentation Files:
1. **`BUSINESS-CONTEXT.md`** - Complete business model explanation
2. **`PRODUCTION-STATUS-REPORT.md`** - Full production capacity report
3. **`test-production.js`** - Automated test suite

---

## 🎯 Next Session Priority Tasks

### Immediate (High Priority):
1. **Get Perplexity API key** - Required for research agent
2. **Build AI conversation handler** - Respond to email replies
3. **Build auto-booking system** - Calendar integration
4. **Create database schema** - New tables needed
5. **Wire everything together** - Integrate new services

### Testing Phase:
1. Test intelligent scorer with real opportunities
2. Test batch processor workflow
3. Test Perplexity research on sample leads
4. End-to-end funnel test with 10 leads

### Launch Phase:
1. Activate discovery to build 10k inventory
2. Process first batch of 100
3. Monitor results
4. Refine and iterate

---

## 💡 Key Insights from Today

### Quality Over Quantity:
- 18k emails with poor results taught us: personalization matters
- New system: Deep research → Custom outreach → Better results

### The Funnel Reality:
- Need 5-10k emails for real traction (user's estimate is right)
- 100-200 contacts per client conversion
- 10-20 batches of 500 to prove model
- 12-18 months to sustainable traction

### Multi-Tenant Future:
- System built for scalability (multiple clients)
- Maggie Forbes = proof of concept
- Success → Sell to other businesses
- White-label dashboards, isolated data

---

## 🔧 Technical Debt / TODO

### Code Quality:
- [ ] Add error handling to new services
- [ ] Add logging and monitoring
- [ ] Add rate limiting for API calls
- [ ] Add retry logic for failed requests

### Testing:
- [ ] Unit tests for new services
- [ ] Integration tests for funnel
- [ ] Load testing for batch processing

### Documentation:
- [ ] API documentation for new endpoints
- [ ] Service architecture diagram
- [ ] Deployment guide updates

---

## 📦 Files Ready to Commit/Push

### Commits Ready (local only):
```
867161b - Make Unbound-Team fully independent system
9b11698 - Add production capacity testing and verification
1ba84c9 - Add comprehensive business context documentation
```

### New Files (uncommitted):
- `backend/services/intelligent-scorer.js`
- `backend/services/batch-processor.js`
- `backend/services/ai-researcher.js`

**Action Needed:** Commit and push when ready

---

## 🎬 Where We Left Off

**User Request:** "Build the system how you need to"

**What We Built:**
1. ✅ Intelligent qualification system
2. ✅ Batch processor (10k inventory, 100 at a time)
3. ✅ AI research agent (Perplexity)

**User Stopped Me At:** Building AI conversation handler

**Reason:** Asked which files use Claude (1 file: intelligent-scorer.js)

**Next:** Continue building:
- AI email conversation handler (needs Claude)
- Auto-booking system
- Database schema updates
- Wire it all together

---

## 🚨 Critical Reminders

1. **Unbound ≠ Maggie Forbes** - Unbound is the platform, MFS is the client
2. **Quality > Quantity** - Deep research beats mass emailing
3. **Batch Processing** - 100 at a time, not all 10k at once
4. **Perplexity for Research** - Real web search, not just AI analysis
5. **Multi-Tenant Design** - Build for multiple future clients

---

**End of Context Document**
*Resume from here in next session*
