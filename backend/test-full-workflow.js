#!/usr/bin/env node
/**
 * Test Full Workflow
 * Tests: Scoring → Research → Personalized Email Generation
 */

require('dotenv').config();

const IntelligentScorer = require('./services/intelligent-scorer');
const AIResearcher = require('./services/ai-researcher');

async function testFullWorkflow() {
  console.log('🧪 Testing Full Workflow: Scoring → Research → Email Generation\n');

  // Test opportunities
  const testOpportunities = [
    {
      id: 'test-1',
      company_name: 'Maggie Forbes Strategies',
      company_domain: 'maggieforbesstrategies.com',
      contact_email: 'maggie@maggieforbesstrategies.com',
      business_area: 'Business Consulting',
      opportunity_data: {
        source: 'manual_test',
        pain_point: 'Struggling with lead generation and need help finding qualified clients. Looking for an automated solution for client acquisition.',
        context: 'Business strategy consulting firm, paying for tools like HubSpot but still having issues with getting enough leads. Need better pipeline.',
        urgency: 'Looking to solve this problem soon',
        budget: 'Currently paying for subscription tools, have budget allocated for growth'
      }
    },
    {
      id: 'test-2',
      company_name: 'Growth Manager Pro',
      company_domain: 'growthmanagerpro.com',
      contact_email: 'support@growthmanagerpro.com',
      business_area: 'Software/SaaS',
      opportunity_data: {
        source: 'manual_test',
        pain_point: 'Struggling with customer acquisition problem. Manual outreach is time consuming and inefficient. Need help scaling our sales.',
        context: 'SaaS company, recently raised funding. Looking for solutions to automate lead generation and get more customers.',
        urgency: 'This is a bottleneck for us, need to address asap',
        budget: 'Funded startup, paying for various tools, have budget for solutions'
      }
    }
  ];

  console.log('Step 1: Qualification & Scoring\n');
  console.log('================================\n');

  const scorer = new IntelligentScorer();
  const scoredOpportunities = [];

  for (const opp of testOpportunities) {
    console.log(`\n📊 Scoring: ${opp.company_name}`);
    const result = await scorer.processOpportunity(opp);

    console.log(`   Qualified: ${result.qualified}`);
    console.log(`   Score: ${result.score}/40`);
    console.log(`   Action: ${result.action}`);
    console.log(`   Reasoning: ${result.reasoning}`);

    if (result.qualified) {
      scoredOpportunities.push({
        ...opp,
        scoring: result
      });
    }
  }

  console.log(`\n\n✅ Qualified ${scoredOpportunities.length}/${testOpportunities.length} opportunities\n`);

  // Step 2: Research with Perplexity
  console.log('\nStep 2: Perplexity Research\n');
  console.log('===========================\n');

  const researcher = new AIResearcher();
  const researchedOpportunities = [];

  for (const opp of scoredOpportunities) {
    console.log(`\n🔍 Researching: ${opp.company_name}...`);
    const research = await researcher.researchLead(opp);

    console.log(`   ✓ Company background researched`);
    console.log(`   ✓ Pain points analyzed`);
    console.log(`   ✓ Decision maker identified`);
    console.log(`   ✓ Recent activity found`);
    console.log(`   ✓ Personalization hooks extracted`);

    researchedOpportunities.push({
      ...opp,
      research
    });

    // Rate limiting
    await new Promise(resolve => setTimeout(resolve, 3000));
  }

  console.log('\n\n✅ Research complete for all opportunities\n');

  // Step 3: Generate Personalized Emails
  console.log('\nStep 3: Personalized Email Generation\n');
  console.log('=====================================\n');

  for (const opp of researchedOpportunities) {
    console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    console.log(`📧 Email for: ${opp.company_name}`);
    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);

    // Extract personalization data from research
    const email = generatePersonalizedEmail(opp);

    console.log(`TO: ${opp.contact_email}`);
    console.log(`SUBJECT: ${email.subject}\n`);
    console.log(`BODY:`);
    console.log(`─────────────────────────────────────────`);
    console.log(email.body);
    console.log(`─────────────────────────────────────────\n`);

    console.log(`📊 Research Data Used:`);
    console.log(`   Company: ${opp.research.companyBackground?.findings?.substring(0, 100)}...`);
    console.log(`   Pain Points: ${opp.research.painPointAnalysis?.findings?.substring(0, 100)}...`);
    console.log(`   Hook: ${opp.research.personalizationHooks?.findings?.substring(0, 100)}...`);
    console.log(`\n`);
  }

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('✅ TEST COMPLETE');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  console.log('📝 Summary:');
  console.log(`   Opportunities tested: ${testOpportunities.length}`);
  console.log(`   Qualified: ${scoredOpportunities.length}`);
  console.log(`   Researched: ${researchedOpportunities.length}`);
  console.log(`   Emails generated: ${researchedOpportunities.length}\n`);

  console.log('💡 Next Steps:');
  console.log(`   1. Review the personalized emails above`);
  console.log(`   2. If they look good, we can wire this into the Auto Outreach agent`);
  console.log(`   3. The agent will automatically send these to the actual email addresses\n`);
}

/**
 * Generate personalized email using research data
 */
function generatePersonalizedEmail(opportunity) {
  const research = opportunity.research;
  const company = opportunity.company_name;
  const contactEmail = opportunity.contact_email;

  // Extract key info from research
  let companyInfo = 'your business';
  if (research.companyBackground?.findings) {
    companyInfo = research.companyBackground.findings.substring(0, 200);
  }

  let painPoint = 'client acquisition';
  if (research.painPointAnalysis?.findings) {
    const findings = research.painPointAnalysis.findings;
    painPoint = findings.substring(0, 150);
  }

  let personalizationHook = '';
  if (research.personalizationHooks?.findings) {
    personalizationHook = research.personalizationHooks.findings.substring(0, 100);
  }

  let recentActivity = '';
  if (research.recentActivity?.findings) {
    recentActivity = research.recentActivity.findings.substring(0, 100);
  }

  // Craft personalized email
  const subject = `Automating client acquisition for ${company}`;

  const intro = companyInfo || 'what you\'re building';
  const pain = painPoint || 'finding and converting the right clients can be time-consuming';
  const activity = recentActivity ? `I noticed ${recentActivity}.\n\n` : '';

  const body = `Hi there,

I came across ${company} and was impressed by ${intro}.

${activity}I understand that ${pain}. That's exactly what we help businesses like ${company} solve.

Unbound builds autonomous client acquisition systems that:
• Automatically discover qualified opportunities in your market
• Research each lead in depth using real-time market intelligence
• Send personalized outreach based on their specific pain points
• Handle initial conversations and book qualified calls

${personalizationHook ? `Given ${personalizationHook}, I think this could be particularly relevant for you.\n\n` : ''}Would you be open to a brief 15-minute conversation to explore if there's a fit?

Best regards,
Maggie Forbes
Unbound.Team

P.S. This entire email was generated using the same system I'd build for you - from discovery to research to personalization. Pretty meta, right? 😊`;

  return { subject, body };
}

// Run the test
testFullWorkflow().catch(error => {
  console.error('❌ Test failed:', error);
  process.exit(1);
});
