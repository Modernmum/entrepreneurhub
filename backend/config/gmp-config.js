// Growth Manager Pro - Autonomous Agent Configuration
// Marketing and growth consulting for agencies and SaaS companies

module.exports = {
  // Tenant identifier (don't change)
  tenantId: 'gmp-internal',

  // Company info
  company: {
    name: 'Growth Manager Pro',
    industry: 'Marketing & Growth Consulting',
    pricing: '$3,000/month base',
    website: 'https://growthmanagerpro.com'
  },

  // Business goals for autonomous agent
  goals: {
    // Lead Generation
    targetIndustry: 'marketing agencies, growth consultants, SaaS founders, digital marketers',
    targetAudience: 'Marketing professionals, agency owners, SaaS companies $500K-5M revenue',
    location: 'global',
    monthlyLeadTarget: 75,
    leadQualityMin: 7, // 1-10 scale

    // Content Creation
    contentFocus: 'growth marketing, marketing automation, AI tools, agency management, client acquisition',
    contentPerWeek: 5,
    contentTypes: ['blog', 'twitter', 'email', 'linkedin'],
    contentTone: 'actionable, tactical, growth-focused',

    // Market Research
    researchFocus: 'marketing tools comparison, agency trends, pricing analysis, automation opportunities',
    researchFrequency: 'weekly',

    // Email Marketing
    emailCampaigns: true,
    emailType: 'sales', // More aggressive sales sequence
    emailTone: 'friendly, value-driven, conversational'
  },

  // Automation schedule
  schedule: {
    leadGeneration: 'daily at 6:00 AM',
    contentCreation: 'daily at 7:00 AM', // More frequent than Maggie Forbes
    marketResearch: 'Monday at 8:00 AM',
    emailCampaigns: 'daily at 10:00 AM'
  },

  // Success metrics
  metrics: {
    targetConversionRate: 0.05, // 5% of leads to demos
    targetDemosPerMonth: 15,
    targetDealsPerMonth: 5,
    averageDealSize: 3000, // $3K/month
  },

  // AI preferences
  aiPreferences: {
    preferredModel: 'gpt-4o-mini', // Use cheaper model for volume
    safetyLevel: 'medium',
    creativityLevel: 'high' // More creative, casual content
  },

  // Notification settings
  notifications: {
    dailySummary: true,
    weeklyReport: true,
    urgentAlerts: true,
    email: 'kristi@growthmanagerpro.com',
    discord: process.env.DISCORD_WEBHOOK_URL
  }
};
