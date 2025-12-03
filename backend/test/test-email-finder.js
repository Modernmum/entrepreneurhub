// Test Email Finder
require('dotenv').config();

async function testEmailFinder() {
  console.log('\n🚀 Testing Email Finder & Validator\n');

  try {
    const emailFinder = require('../services/email-finder');

    // Test 1: Find email from website
    console.log('Test 1: Find Email from Website');
    console.log('─'.repeat(50));

    const testUrls = [
      'https://maggieforbesstrategies.com',
      'https://www.indiehackers.com',
      'https://nathanbarry.com'
    ];

    for (const url of testUrls) {
      const emails = await emailFinder.findEmailFromWebsite(url);
      console.log(`\n${url}:`);
      if (emails.length > 0) {
        emails.forEach(email => console.log(`  📧 ${email}`));
      } else {
        console.log(`  ℹ️  No emails found`);
      }
    }

    // Test 2: Generate email patterns
    console.log('\n\nTest 2: Generate Email Patterns');
    console.log('─'.repeat(50));

    const patterns = emailFinder.generateEmailPatterns('John', 'Doe', 'example.com');
    console.log('Patterns for John Doe at example.com:');
    patterns.forEach(p => console.log(`  ${p}`));

    // Test 3: Validate email format
    console.log('\n\nTest 3: Validate Email Format');
    console.log('─'.repeat(50));

    const testEmails = [
      'valid@example.com',
      'invalid.email',
      'test@test',
      'good.email@company.co.uk',
      'noreply@example.com'
    ];

    for (const email of testEmails) {
      const isValid = emailFinder.isValidEmailFormat(email);
      const isGeneric = emailFinder.isGenericEmail(email);
      console.log(`${email}:`);
      console.log(`  Valid format: ${isValid}`);
      console.log(`  Generic: ${isGeneric}`);
    }

    // Test 4: Verify emails
    console.log('\n\nTest 4: Verify Emails');
    console.log('─'.repeat(50));

    const toVerify = ['test@example.com', 'invalid', 'hello@startup.com'];
    const verified = await emailFinder.verifyEmails(toVerify);

    verified.forEach(result => {
      console.log(`${result.email}:`);
      console.log(`  Valid: ${result.valid}`);
      console.log(`  Reason: ${result.reason}`);
    });

    console.log('\n✅ Email finder test complete!\n');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// Run test
testEmailFinder();
