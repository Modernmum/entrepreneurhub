# Unbound.Team - Autonomous Opportunity Discovery System

**Unbound.Team** is a fully autonomous system that discovers entrepreneur pain points, sends personalized outreach, and delivers solutions automatically.

## System Architecture

Unbound.Team is a **standalone parent system** that operates independently:

- **Backend API**: Express server on Railway ([web-production-486cb.up.railway.app](https://web-production-486cb.up.railway.app))
- **Database**: Supabase PostgreSQL with opportunity tracking tables
- **Dashboard**: Maggie Forbes branded command center (`maggieforbes-unbound-dashboard.html`)
- **Autonomous Agents**: Gap Finder, Auto Outreach, Auto Delivery

## Features

### Discovery Engine
- **RSS Feed Monitoring**: Scans 11+ entrepreneur blogs for pain points
- **Forum Scanning**: Monitors Reddit, Indie Hackers, startup communities
- **Gap Analysis**: AI-powered identification of business opportunities
- **Scoring System**: 1-10 fit scoring with urgency levels

### Autonomous Agents
1. **Gap Finder Agent** - Discovers opportunities from RSS/forums
2. **Auto Outreach Agent** - Sends personalized emails to prospects
3. **Auto Delivery Agent** - Delivers solutions with approval workflows

### Dashboard Control
- Real-time opportunity feed
- Email campaign tracking (sent/opened/replied/converted)
- Agent toggle controls (start/stop/status)
- Live activity monitoring

## Environment Variables

Required environment variables (set in Railway):

```bash
# Supabase Database
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your-anon-key
SUPABASE_SERVICE_KEY=your-service-role-key

# AI/API Keys
ANTHROPIC_API_KEY=sk-ant-your-key

# Optional
PORT=3000
RAILWAY_ENVIRONMENT=production
```

## Database Tables

The system uses these Supabase tables:

- `scored_opportunities` - Discovered opportunities with fit scores
- `market_gaps` - Identified market gaps and pain points
- `outreach_campaigns` - Email outreach tracking
- `solution_deliveries` - Solution delivery records

See `database-schema.sql` for full schema.

## Installation

### Local Development

1. **Clone the repository**
   ```bash
   git clone https://github.com/Modernmum/Unbound-Team.git
   cd Unbound-Team
   ```

2. **Install dependencies**
   ```bash
   npm run install-backend
   ```

3. **Set up environment variables**
   Create `backend/.env` with required variables (see .env.example)

4. **Run the server**
   ```bash
   npm start
   ```

5. **Access the dashboard**
   Open `maggieforbes-unbound-dashboard.html` in a browser

### Railway Deployment

The system is deployed on Railway:

1. **Backend**: Automatically deploys from main branch
2. **Environment**: Set all required env vars in Railway dashboard
3. **Database**: Configure Supabase tables using `database-schema.sql`

## API Endpoints

### Health Check
- `GET /health` - System status and service availability

### Discovery
- `POST /api/scan-rss` - Scan RSS feeds for opportunities
- `POST /api/scan-forums` - Scan forums for opportunities
- `GET /api/opportunities?limit=100` - Get discovered opportunities

### Agent Control
- `POST /api/agents/:agentName/start` - Start an agent
- `POST /api/agents/:agentName/stop` - Stop an agent
- `GET /api/agents/:agentName/status` - Get agent status

Agent names: `gap-finder`, `auto-outreach`, `auto-delivery`

### Email Tracking
- `GET /api/emails` - Get outreach campaigns
- `GET /api/emails/stats` - Get email statistics (sent/opened/replied)

## Usage

1. **Open the Dashboard**: Navigate to `maggieforbes-unbound-dashboard.html`
2. **Start Discovery**: Click "Scan RSS" or "Scan Forums"
3. **Activate Agents**: Toggle agents on/off as needed
4. **Monitor Results**: View opportunities, emails, and deliveries in real-time

## Architecture Independence

Unbound.Team is designed as a **standalone parent system**:

- ✅ No dependencies on other projects
- ✅ Self-contained backend, agents, and services
- ✅ Independent database schema
- ✅ Deployed separately on Railway
- ✅ Own repository at https://github.com/Modernmum/Unbound-Team

## File Structure

```
Unbound-Team/
├── backend/
│   ├── server.js              # Main Express server
│   ├── package.json           # Backend dependencies
│   ├── agents/                # Autonomous agents
│   │   ├── gap-finder-agent.js
│   │   ├── auto-outreach-agent.js
│   │   └── auto-delivery-agent.js
│   └── services/              # Core services
│       ├── rss-monitor.js
│       └── forum-scanner.js
├── maggieforbes-unbound-dashboard.html  # Command center UI
├── database-schema.sql        # Supabase table definitions
├── setup-database.js          # Database setup script
└── package.json               # Root package.json
```

## Support

For issues or questions:
- GitHub: https://github.com/Modernmum/Unbound-Team
- Railway Dashboard: [web-production-486cb](https://railway.app/)

## License

MIT License - Copyright (c) 2024 Unbound.Team
