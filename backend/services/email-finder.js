// Email Finder & Validator
// Extracts emails from websites and validates them

const axios = require('axios');
const cheerio = require('cheerio');

class EmailFinder {
  constructor() {
    // Common email patterns
    this.emailRegex = /([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]+)/gi;

    // Common email locations on websites
    this.emailSelectors = [
      'a[href^="mailto:"]',
      '.email',
      '.contact-email',
      '#email',
      '[class*="email"]',
      '[id*="email"]'
    ];
  }

  // Find email from a website URL
  async findEmailFromWebsite(url) {
    console.log(`📧 Searching for email on: ${url}`);

    try {
      const response = await axios.get(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; Unbound.team/1.0)'
        },
        timeout: 10000
      });

      const $ = cheerio.load(response.data);
      const emails = new Set();

      // Method 1: Check mailto links
      $('a[href^="mailto:"]').each((i, elem) => {
        const href = $(elem).attr('href');
        const email = href.replace('mailto:', '').split('?')[0].trim();
        if (this.isValidEmailFormat(email)) {
          emails.add(email.toLowerCase());
        }
      });

      // Method 2: Check email selectors
      this.emailSelectors.forEach(selector => {
        $(selector).each((i, elem) => {
          const text = $(elem).text();
          const matches = text.match(this.emailRegex);
          if (matches) {
            matches.forEach(email => {
              if (this.isValidEmailFormat(email)) {
                emails.add(email.toLowerCase());
              }
            });
          }
        });
      });

      // Method 3: Scan page text for email patterns
      const pageText = $.text();
      const textMatches = pageText.match(this.emailRegex);
      if (textMatches) {
        textMatches.forEach(email => {
          if (this.isValidEmailFormat(email) && !this.isGenericEmail(email)) {
            emails.add(email.toLowerCase());
          }
        });
      }

      // Method 4: Check common contact pages
      if (emails.size === 0) {
        const contactEmails = await this.checkContactPage(url);
        contactEmails.forEach(email => emails.add(email));
      }

      const emailArray = Array.from(emails);
      console.log(`  ✓ Found ${emailArray.length} email(s)`);

      return emailArray;

    } catch (error) {
      console.error(`  ✗ Failed to find email from ${url}:`, error.message);
      return [];
    }
  }

  // Check common contact pages
  async checkContactPage(baseUrl) {
    const contactPaths = ['/contact', '/about', '/team'];
    const emails = new Set();

    for (const path of contactPaths) {
      try {
        const url = new URL(path, baseUrl).href;
        const response = await axios.get(url, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (compatible; Unbound.team/1.0)'
          },
          timeout: 5000
        });

        const $ = cheerio.load(response.data);

        // Look for emails
        $('a[href^="mailto:"]').each((i, elem) => {
          const href = $(elem).attr('href');
          const email = href.replace('mailto:', '').split('?')[0].trim();
          if (this.isValidEmailFormat(email)) {
            emails.add(email.toLowerCase());
          }
        });

        const pageText = $.text();
        const matches = pageText.match(this.emailRegex);
        if (matches) {
          matches.forEach(email => {
            if (this.isValidEmailFormat(email) && !this.isGenericEmail(email)) {
              emails.add(email.toLowerCase());
            }
          });
        }

        // Don't overwhelm servers
        await this.sleep(1000);

      } catch (error) {
        // Contact page might not exist, that's ok
      }
    }

    return Array.from(emails);
  }

  // Generate potential email patterns for a person/company
  generateEmailPatterns(firstName, lastName, domain) {
    const patterns = [];
    const f = firstName ? firstName.toLowerCase() : '';
    const l = lastName ? lastName.toLowerCase() : '';
    const fInitial = f.charAt(0);
    const lInitial = l.charAt(0);

    if (f && l && domain) {
      patterns.push(`${f}.${l}@${domain}`);
      patterns.push(`${f}${l}@${domain}`);
      patterns.push(`${fInitial}${l}@${domain}`);
      patterns.push(`${f}${lInitial}@${domain}`);
      patterns.push(`${f}_${l}@${domain}`);
      patterns.push(`${f}-${l}@${domain}`);
      patterns.push(`${l}.${f}@${domain}`);
    }

    if (f && domain) {
      patterns.push(`${f}@${domain}`);
    }

    if (l && domain) {
      patterns.push(`${l}@${domain}`);
    }

    // Common patterns
    if (domain) {
      patterns.push(`hello@${domain}`);
      patterns.push(`contact@${domain}`);
      patterns.push(`info@${domain}`);
      patterns.push(`support@${domain}`);
    }

    return patterns;
  }

  // Validate email format
  isValidEmailFormat(email) {
    if (!email || typeof email !== 'string') return false;

    const emailPattern = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return emailPattern.test(email);
  }

  // Check if email is generic/not useful
  isGenericEmail(email) {
    const generic = [
      'example.com',
      'test.com',
      'placeholder',
      'yourdomain',
      'domain.com',
      'email.com',
      'noreply',
      'no-reply',
      'donotreply'
    ];

    const lower = email.toLowerCase();
    return generic.some(g => lower.includes(g));
  }

  // Verify if email exists (basic DNS check)
  async verifyEmail(email) {
    if (!this.isValidEmailFormat(email)) {
      return {
        email,
        valid: false,
        reason: 'Invalid format'
      };
    }

    // For MVP, we just do format validation
    // In production, you'd use a service like ZeroBounce, Hunter.io, or NeverBounce
    return {
      email,
      valid: true,
      confidence: 'format-only', // format-checked only, not smtp-verified
      reason: 'Format valid (SMTP verification not implemented)'
    };
  }

  // Batch verify emails
  async verifyEmails(emails) {
    const results = [];

    for (const email of emails) {
      const result = await this.verifyEmail(email);
      results.push(result);
    }

    return results;
  }

  // Find email from lead data
  async findEmailFromLead(lead) {
    const emails = [];

    // Check if lead has a website
    if (lead.url) {
      const websiteEmails = await this.findEmailFromWebsite(lead.url);
      emails.push(...websiteEmails);
    }

    // If we have name and domain, generate patterns
    if (lead.name && lead.company) {
      const parts = lead.name.split(' ');
      const firstName = parts[0];
      const lastName = parts[parts.length - 1];

      // Extract domain from company or URL
      let domain = lead.company.toLowerCase().replace(/[^a-z0-9]/g, '');
      if (lead.url) {
        try {
          const urlObj = new URL(lead.url);
          domain = urlObj.hostname.replace('www.', '');
        } catch (e) {}
      }

      const patterns = this.generateEmailPatterns(firstName, lastName, domain);
      emails.push(...patterns);
    }

    // Remove duplicates
    const unique = [...new Set(emails)];

    // Verify emails
    const verified = await this.verifyEmails(unique);

    return verified.filter(v => v.valid);
  }

  // Helper: sleep
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

module.exports = new EmailFinder();
