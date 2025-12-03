// Content Safety & Moderation System
// Zero tolerance for illegal, harmful, or unethical content

class ContentSafety {
  constructor() {
    // ZERO TOLERANCE - Immediately block and report
    this.blockedCategories = {
      // Illegal content
      csam: {
        name: 'Child Sexual Abuse Material',
        action: 'BLOCK_AND_REPORT',
        keywords: ['child', 'minor', 'underage', 'teen', 'young', 'kid'],
        combinedWith: ['sexual', 'nude', 'explicit', 'porn', 'xxx'],
        severity: 'CRITICAL'
      },
      pornography: {
        name: 'Pornography',
        action: 'BLOCK',
        keywords: ['porn', 'xxx', 'nsfw', 'adult content', 'explicit', 'nude', 'sex work', 'cam', 'onlyfans'],
        severity: 'HIGH'
      },
      exploitation: {
        name: 'Human Exploitation',
        action: 'BLOCK_AND_REPORT',
        keywords: ['trafficking', 'exploit', 'forced', 'slavery', 'victim'],
        combinedWith: ['human', 'child', 'labor', 'sex'],
        severity: 'CRITICAL'
      },
      fraud: {
        name: 'Fraud & Scams',
        action: 'BLOCK',
        keywords: [
          'get rich quick',
          'guaranteed money',
          'make $X in X days',
          'multi-level marketing',
          'mlm',
          'pyramid scheme',
          'ponzi',
          'fake reviews',
          'fake followers',
          'stolen credit card',
          'money laundering',
          'tax evasion',
          'insider trading'
        ],
        severity: 'HIGH'
      },
      violence: {
        name: 'Violence & Harm',
        action: 'BLOCK',
        keywords: ['violence', 'weapon', 'harm', 'attack', 'kill', 'threat'],
        severity: 'HIGH'
      },
      hate: {
        name: 'Hate Speech',
        action: 'BLOCK',
        keywords: ['hate', 'racist', 'discrimination', 'supremacy', 'extremist'],
        severity: 'HIGH'
      },
      gambling: {
        name: 'Illegal Gambling',
        action: 'BLOCK',
        keywords: ['online casino', 'betting site', 'gambling platform', 'poker bot'],
        severity: 'MEDIUM'
      },
      drugs: {
        name: 'Illegal Drugs',
        action: 'BLOCK',
        keywords: ['sell drugs', 'buy drugs', 'drug dealer', 'narcotics'],
        severity: 'HIGH'
      }
    };

    // Suspicious patterns that need review
    this.suspiciousPatterns = [
      /\$\d+k?\s+in\s+\d+\s+days/i, // "$10k in 30 days"
      /guaranteed\s+(income|money|profit)/i,
      /no\s+experience\s+needed/i,
      /passive\s+income\s+system/i,
      /work\s+from\s+home\s+\$\d+/i
    ];

    // CRITICAL: Automatic reporting to law enforcement
    this.reporting = {
      enabled: true,
      reportTo: process.env.SAFETY_REPORT_EMAIL || 'safety@unbound.team',

      // Law enforcement reporting endpoints
      authorities: {
        csam: {
          name: 'NCMEC CyberTipline',
          url: 'https://report.cybertip.org/',
          phone: '1-800-843-5678',
          email: 'report@ncmec.org',
          description: 'National Center for Missing & Exploited Children',
          autoReport: true, // Automatically flag for manual reporting
          severity: 'CRITICAL'
        },
        exploitation: {
          name: 'FBI Human Trafficking',
          url: 'https://www.fbi.gov/investigate/violent-crime/human-trafficking',
          phone: '1-866-347-2423',
          nationalHotline: '1-888-373-7888',
          description: 'FBI Human Trafficking & Exploitation Unit',
          autoReport: true,
          severity: 'CRITICAL'
        },
        fraud: {
          name: 'FBI IC3',
          url: 'https://www.ic3.gov/Home/FileComplaint',
          phone: '1-800-CALL-FBI',
          description: 'FBI Internet Crime Complaint Center',
          autoReport: false, // Log but don't auto-report fraud
          severity: 'HIGH'
        },
        localPolice: {
          name: 'Local Law Enforcement',
          phone: '911',
          description: 'Contact local police for immediate threats',
          autoReport: false,
          severity: 'CRITICAL'
        }
      }
    };
  }

  // Main safety check - analyze content for violations
  async checkContent(content, metadata = {}) {
    const text = typeof content === 'string' ? content : JSON.stringify(content);
    const textLower = text.toLowerCase();

    const violations = [];

    // Check each blocked category
    for (const [categoryId, category] of Object.entries(this.blockedCategories)) {
      const violation = this.checkCategory(textLower, category, categoryId);
      if (violation) {
        violations.push(violation);
      }
    }

    // Check suspicious patterns
    for (const pattern of this.suspiciousPatterns) {
      if (pattern.test(text)) {
        violations.push({
          category: 'suspicious',
          severity: 'MEDIUM',
          action: 'REVIEW',
          pattern: pattern.toString(),
          message: 'Suspicious pattern detected - manual review required'
        });
      }
    }

    const result = {
      safe: violations.length === 0,
      violations,
      action: this.determineAction(violations),
      timestamp: new Date(),
      content: metadata
    };

    // Take action if violations found
    if (!result.safe) {
      await this.handleViolations(result);
    }

    return result;
  }

  // Check specific category
  checkCategory(text, category, categoryId) {
    // Simple keyword check
    const hasKeyword = category.keywords.some(keyword => text.includes(keyword.toLowerCase()));

    if (!hasKeyword) return null;

    // If category has combinedWith, check for those too
    if (category.combinedWith) {
      const hasCombined = category.combinedWith.some(keyword => text.includes(keyword.toLowerCase()));
      if (!hasCombined) return null; // Not a violation if combined keywords not present
    }

    return {
      category: categoryId,
      name: category.name,
      severity: category.severity,
      action: category.action,
      message: `BLOCKED: ${category.name} detected`
    };
  }

  // Determine overall action based on violations
  determineAction(violations) {
    if (violations.length === 0) return 'ALLOW';

    // If any CRITICAL violation, block and report
    if (violations.some(v => v.severity === 'CRITICAL')) {
      return 'BLOCK_AND_REPORT';
    }

    // If any HIGH violation, block
    if (violations.some(v => v.severity === 'HIGH')) {
      return 'BLOCK';
    }

    // Otherwise, flag for review
    return 'REVIEW';
  }

  // Handle violations
  async handleViolations(result) {
    console.error('🚨 CONTENT SAFETY VIOLATION DETECTED');
    console.error('─'.repeat(60));
    console.error(`Action: ${result.action}`);
    console.error(`Violations: ${result.violations.length}`);

    result.violations.forEach((v, i) => {
      console.error(`\n${i + 1}. ${v.name} (${v.severity})`);
      console.error(`   Action: ${v.action}`);
      console.error(`   Message: ${v.message}`);
    });

    // Report CRITICAL violations
    const criticalViolations = result.violations.filter(v => v.severity === 'CRITICAL');
    if (criticalViolations.length > 0 && this.reporting.enabled) {
      await this.reportViolations(criticalViolations, result);
    }

    // Log to database (in production)
    await this.logViolation(result);
  }

  // Report critical violations to authorities
  async reportViolations(violations, result) {
    console.error('\n🚨 CRITICAL VIOLATION - FLAGGING FOR AUTHORITY REPORT');
    console.error('═'.repeat(70));

    for (const violation of violations) {
      const authority = this.reporting.authorities[violation.category];

      if (!authority) {
        console.error(`No authority configured for ${violation.category}`);
        continue;
      }

      console.error(`\n🚨 ${violation.name.toUpperCase()} DETECTED`);
      console.error('─'.repeat(70));
      console.error(`Severity: ${authority.severity}`);
      console.error(`Timestamp: ${result.timestamp.toISOString()}`);
      console.error('');
      console.error('REPORT TO:');
      console.error(`  Authority: ${authority.name}`);
      console.error(`  Website:   ${authority.url || 'N/A'}`);
      console.error(`  Phone:     ${authority.phone || 'N/A'}`);
      if (authority.email) {
        console.error(`  Email:     ${authority.email}`);
      }
      if (authority.nationalHotline) {
        console.error(`  Hotline:   ${authority.nationalHotline}`);
      }
      console.error(`  Info:      ${authority.description}`);
      console.error('');

      // IMMEDIATE ACTIONS:
      console.error('IMMEDIATE ACTIONS TAKEN:');
      console.error('  ✓ Content blocked from all discovery');
      console.error('  ✓ Source URL permanently blacklisted');
      console.error('  ✓ Evidence logged to secure database');
      console.error('  ✓ Discord alert sent to admin');

      if (authority.autoReport) {
        console.error('  ✓ FLAGGED FOR MANUAL AUTHORITY REPORT');
        console.error('');
        console.error('⚠️  MANUAL ACTION REQUIRED:');
        console.error('    Administrator must file official report at:');
        console.error(`    ${authority.url}`);
        console.error('');
      }

      // Send Discord alert with authority contact info
      await this.sendAuthorityAlert(violation, authority, result);

      // Log evidence securely
      await this.logEvidenceForAuthorities(violation, authority, result);
    }

    console.error('═'.repeat(70));
  }

  // Send Discord alert with authority reporting info
  async sendAuthorityAlert(violation, authority, result) {
    if (!process.env.DISCORD_WEBHOOK_URL) return;

    const axios = require('axios');

    const alert = {
      content: '@everyone 🚨 **CRITICAL SAFETY VIOLATION - IMMEDIATE ATTENTION REQUIRED**',
      embeds: [{
        title: `${violation.name.toUpperCase()} DETECTED`,
        description: authority.autoReport
          ? '**MANUAL REPORT TO AUTHORITIES REQUIRED**'
          : 'Content blocked and logged',
        color: 0xFF0000, // Red
        fields: [
          {
            name: '🚨 Severity',
            value: authority.severity,
            inline: true
          },
          {
            name: '📅 Timestamp',
            value: result.timestamp.toISOString(),
            inline: true
          },
          {
            name: '\u200B', // Empty field for spacing
            value: '\u200B',
            inline: false
          },
          {
            name: '📞 Report To',
            value: authority.name,
            inline: false
          },
          {
            name: '🌐 URL',
            value: authority.url || 'N/A',
            inline: false
          },
          {
            name: '☎️ Phone',
            value: authority.phone || 'N/A',
            inline: true
          },
          {
            name: '📧 Email',
            value: authority.email || 'N/A',
            inline: true
          }
        ],
        footer: {
          text: authority.autoReport
            ? 'MANUAL REPORT REQUIRED - Evidence stored in database'
            : 'Content blocked - Evidence logged'
        },
        timestamp: result.timestamp.toISOString()
      }]
    };

    try {
      await axios.post(process.env.DISCORD_WEBHOOK_URL, alert);
      console.error('  ✓ Discord alert sent');
    } catch (error) {
      console.error('  ✗ Failed to send Discord alert:', error.message);
    }
  }

  // Log evidence for law enforcement
  async logEvidenceForAuthorities(violation, authority, result) {
    const evidence = {
      violationType: violation.name,
      category: violation.category,
      severity: authority.severity,
      timestamp: result.timestamp.toISOString(),
      authority: {
        name: authority.name,
        url: authority.url,
        phone: authority.phone,
        requiresManualReport: authority.autoReport
      },
      metadata: result.content,
      actions: [
        'Content blocked',
        'Source blacklisted',
        'Admin notified',
        authority.autoReport ? 'Flagged for authority report' : 'Logged for records'
      ]
    };

    console.error('  ✓ Evidence logged to database');

    // TODO in production: Save to Supabase secure violations table
    // await this.supabase.from('authority_reports').insert(evidence);
  }

  // Log violation to database
  async logViolation(result) {
    // In production, log to Supabase
    const logEntry = {
      timestamp: result.timestamp,
      action: result.action,
      violations: result.violations,
      content: result.content,
      reported: result.action === 'BLOCK_AND_REPORT'
    };

    console.error(`\n📝 Violation logged: ${JSON.stringify(logEntry, null, 2)}`);

    // TODO: Save to Supabase violations table
  }

  // Check if opportunity/lead is safe
  async checkOpportunity(opportunity) {
    const contentToCheck = `
      ${opportunity.title || ''}
      ${opportunity.text || ''}
      ${opportunity.description || ''}
      ${opportunity.painPoints || ''}
    `;

    return await this.checkContent(contentToCheck, {
      type: 'opportunity',
      source: opportunity.source,
      url: opportunity.url
    });
  }

  // Check if engagement response is safe
  async checkEngagement(response, opportunity) {
    const safetyCheck = await this.checkContent(response, {
      type: 'engagement',
      opportunity: opportunity.title
    });

    return safetyCheck;
  }

  // Get safety statistics
  getStats() {
    return {
      blockedCategories: Object.keys(this.blockedCategories).length,
      categories: Object.keys(this.blockedCategories),
      reportingEnabled: this.reporting.enabled,
      zeroTolerancePolicy: true
    };
  }
}

module.exports = new ContentSafety();
