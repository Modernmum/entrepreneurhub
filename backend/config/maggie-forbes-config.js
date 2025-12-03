// Maggie Forbes Strategies - Autonomous Agent Configuration
// High-end business consulting for executives and companies

module.exports = {
  // Tenant identifier (don't change)
  tenantId: 'maggie-forbes-internal',

  // Company info
  company: {
    name: 'Maggie Forbes Strategies',
    industry: 'Executive Business Consulting',
    pricing: '$25,000/month',
    website: 'https://maggieforbesstrategies.com'
  },

  // Business goals for autonomous agent
  goals: {
    // Lead Generation
    targetIndustry: 'high-end business clients seeking strategist for optimization and scaling',
    targetAudience: 'C-suite executives, business owners doing $5M-50M revenue',
    location: 'global',
    monthlyLeadTarget: 50,
    leadQualityMin: 8, // 1-10 scale

    // Content Creation
    contentFocus: 'business strategy, scaling operations, executive coaching, organizational optimization',
    contentPerWeek: 3,
    contentTypes: ['blog', 'linkedin', 'case-study'],
    contentTone: 'authoritative, strategic, executive-level',

    // Market Research
    researchFocus: 'competitive landscape, high-end consulting trends, pricing strategies, market gaps',
    researchFrequency: 'weekly',

    // Email Marketing
    emailCampaigns: true,
    emailType: 'nurture', // nurture sequence for high-value leads
    emailTone: 'professional, consultative'
  },

  // Automation schedule
  schedule: {
    leadGeneration: 'daily at 6:00 AM',
    contentCreation: 'Monday, Wednesday, Friday at 7:00 AM',
    marketResearch: 'Monday at 8:00 AM',
    emailCampaigns: 'Tuesday, Thursday at 9:00 AM'
  },

  // Success metrics
  metrics: {
    targetConversionRate: 0.10, // 10% of leads to meetings
    targetMeetingsPerMonth: 5,
    targetDealsPerQuarter: 2,
    averageDealSize: 75000, // $25K/mo × 3 months average
  },

  // AI preferences
  aiPreferences: {
    preferredModel: 'claude-sonnet', // Use best model for high-end content
    safetyLevel: 'high',
    creativityLevel: 'medium-high'
  },

  // Notification settings
  notifications: {
    dailySummary: true,
    weeklyReport: true,
    urgentAlerts: true,
    email: 'kristi@maggieforbesstrategies.com',
    discord: process.env.DISCORD_WEBHOOK_URL
  }
};
