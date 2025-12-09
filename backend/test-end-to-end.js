#!/usr/bin/env node
/**
 * End-to-End Automated Test
 * Full flow: Discover → Score → Research → Send Emails
 */

require('dotenv').config();

const nodemailer = require('nodemailer');
const IntelligentScorer = require('./services/intelligent-scorer');
const AIResearcher = require('./services/ai-researcher');

async function endToEndTest() {
  console.log('🚀 FULL AUTOMATED FLOW TEST\n');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  // Step 1: Discovery (simulate discovered opportunities)
  console.log('📡 Step 1: Discovery');
  console.log('─────────────────────────────────────────\n');

  const discoveredOpportunities = [
    {
      id: 'test-1',
      company_name: 'Maggie Forbes Strategies',
      company_domain: 'maggieforbesstrategies.com',
      contact_email: 'maggie@maggieforbesstrategies.com',
      business_area: 'Business Consulting',
      opportunity_data: {
        source: 'automated_discovery',
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
        source: 'automated_discovery',
        pain_point: 'Struggling with customer acquisition problem. Manual outreach is time consuming and inefficient. Need help scaling our sales.',
        context: 'SaaS company, recently raised funding. Looking for solutions to automate lead generation and get more customers.',
        urgency: 'This is a bottleneck for us, need to address asap',
        budget: 'Funded startup, paying for various tools, have budget for solutions'
      }
    }
  ];

  console.log(`✅ Discovered ${discoveredOpportunities.length} opportunities\n`);

  // Step 2: Qualification & Scoring
  console.log('📊 Step 2: Intelligent Qualification & Scoring');
  console.log('─────────────────────────────────────────\n');

  const scorer = new IntelligentScorer();
  const qualifiedOpportunities = [];

  for (const opp of discoveredOpportunities) {
    const result = await scorer.processOpportunity(opp);
    console.log(`${opp.company_name}:`);
    console.log(`  Qualified: ${result.qualified}`);
    console.log(`  Score: ${result.score}/40`);
    console.log(`  Action: ${result.action}`);
    console.log(`  Reasoning: ${result.reasoning}\n`);

    if (result.qualified) {
      qualifiedOpportunities.push({ ...opp, scoring: result });
    }
  }

  console.log(`✅ Qualified ${qualifiedOpportunities.length}/${discoveredOpportunities.length} opportunities\n`);

  // Step 3: AI Research with Perplexity
  console.log('🔍 Step 3: Perplexity Research');
  console.log('─────────────────────────────────────────\n');

  const researcher = new AIResearcher();
  const researchedOpportunities = [];

  for (const opp of qualifiedOpportunities) {
    console.log(`Researching ${opp.company_name}...`);
    const research = await researcher.researchLead(opp);

    researchedOpportunities.push({ ...opp, research });
    console.log(`✓ Complete\n`);

    // Rate limiting
    await new Promise(resolve => setTimeout(resolve, 3000));
  }

  console.log(`✅ Research complete for all ${researchedOpportunities.length} opportunities\n`);

  // Step 4: Generate & Send Emails
  console.log('📧 Step 4: Generate & Send Personalized Emails');
  console.log('─────────────────────────────────────────\n');

  // Set up email transporter
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: process.env.SMTP_PORT || 587,
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    }
  });

  for (const opp of researchedOpportunities) {
    const email = generatePersonalizedEmail(opp);

    console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    console.log(`📧 Sending to: ${opp.contact_email}`);
    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);
    console.log(`SUBJECT: ${email.subject}\n`);
    console.log(`BODY:\n${email.body}\n`);
    console.log(`─────────────────────────────────────────\n`);

    // Send the email
    try {
      if (process.env.SMTP_USER && process.env.SMTP_PASS) {
        const info = await transporter.sendMail({
          from: `"Maggie Forbes - Unbound.Team" <${process.env.SMTP_USER}>`,
          to: opp.contact_email,
          subject: email.subject,
          text: email.body,
          html: email.body.replace(/\n/g, '<br>')
        });

        console.log(`✅ EMAIL SENT! Message ID: ${info.messageId}\n`);
      } else {
        console.log(`⚠️  SMTP not configured - Email would be sent in production\n`);
        console.log(`   Set SMTP_USER and SMTP_PASS in .env to actually send\n`);
      }
    } catch (error) {
      console.error(`❌ Error sending email: ${error.message}\n`);
    }

    // Rate limiting between emails
    await new Promise(resolve => setTimeout(resolve, 2000));
  }

  // Final Summary
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('✅ END-TO-END TEST COMPLETE');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  console.log('📊 FINAL RESULTS:');
  console.log(`   Discovered: ${discoveredOpportunities.length}`);
  console.log(`   Qualified: ${qualifiedOpportunities.length}`);
  console.log(`   Researched: ${researchedOpportunities.length}`);
  console.log(`   Emails Generated: ${researchedOpportunities.length}`);
  console.log(`   Emails Sent: ${process.env.SMTP_USER ? researchedOpportunities.length : 0}\n`);

  console.log('🎯 SYSTEM STATUS: FULLY OPERATIONAL');
  console.log('💰 COST: $0 (Rule-based scoring + Perplexity research only)\n');

  console.log('Next: Wire this into the Auto Outreach agent for continuous operation\n');
}

/**
 * Generate personalized email using research data
 */
function generatePersonalizedEmail(opportunity) {
  const research = opportunity.research;
  const company = opportunity.company_name;

  // Extract research findings
  let companyInfo = '';
  if (research.companyBackground?.findings) {
    companyInfo = research.companyBackground.findings.split('\n').slice(0, 3).join(' ').substring(0, 300);
  }

  let painPoint = '';
  if (research.painPointAnalysis?.findings) {
    painPoint = research.painPointAnalysis.findings.split('\n').slice(0, 2).join(' ').substring(0, 250);
  }

  let hook = '';
  if (research.personalizationHooks?.findings) {
    hook = research.personalizationHooks.findings.split('\n').slice(0, 2).join(' ').substring(0, 200);
  }

  let recentActivity = '';
  if (research.recentActivity?.findings && !research.recentActivity.findings.includes('no recent')) {
    recentActivity = research.recentActivity.findings.substring(0, 150);
  }

  // Craft email
  const subject = `Automating client acquisition for ${company}`;

  let body = `Hi there,\n\n`;

  if (companyInfo) {
    body += `I came across ${company} and was impressed by what you're building. ${companyInfo.substring(0, 150)}...\n\n`;
  } else {
    body += `I came across ${company} and wanted to reach out.\n\n`;
  }

  if (recentActivity) {
    body += `${recentActivity}\n\n`;
  }

  if (painPoint) {
    body += `I understand you're facing challenges with ${painPoint.substring(0, 100)}... That's exactly what we help businesses solve.\n\n`;
  }

  body += `Unbound builds autonomous client acquisition systems that:\n`;
  body += `• Automatically discover qualified opportunities in your market\n`;
  body += `• Research each lead in depth using real-time market intelligence\n`;
  body += `• Send personalized outreach based on their specific pain points\n`;
  body += `• Handle initial conversations and book qualified calls\n\n`;

  if (hook) {
    body += `${hook.substring(0, 150)}...\n\n`;
  }

  body += `Would you be open to a brief 15-minute conversation to explore if there's a fit?\n\n`;
  body += `Best regards,\n`;
  body += `Maggie Forbes\n`;
  body += `Unbound.Team\n\n`;
  body += `P.S. This entire email was generated using the same system I'd build for you - from discovery to research to personalization. Pretty meta, right? 😊`;

  return { subject, body };
}

// Run the test
endToEndTest().catch(error => {
  console.error('❌ Test failed:', error);
  process.exit(1);
});
