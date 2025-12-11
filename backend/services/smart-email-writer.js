/**
 * Smart Email Writer
 *
 * Uses Perplexity research data to write highly personalized emails.
 * This bot writes emails - it doesn't use AI APIs, it uses RULES and INTELLIGENCE
 * based on the research data Perplexity provides.
 *
 * The bot thinks like a skilled salesperson reading a research brief.
 */

class SmartEmailWriter {
  constructor() {
    // Maggie Forbes positioning
    this.sender = {
      name: 'Maggie Forbes',
      company: 'Maggie Forbes Strategies',
      title: 'Strategic Growth Architect'
    };

    // What MFS offers
    this.offering = {
      core: 'Strategic Growth Architecture',
      description: 'intelligent growth systems that create predictable opportunity flow without operational chaos',
      solves: 'The Architecture Gap',
      painPoints: [
        { id: 'leadership_dependency', label: 'Leadership Dependency', signal: 'founder doing everything' },
        { id: 'relationship_revenue', label: 'Relationship-Dependent Revenue', signal: 'no systematic pipeline' },
        { id: 'infrastructure_gap', label: 'Non-Scalable Infrastructure', signal: 'manual processes, no systems' }
      ],
      idealClient: '$3M-$25M founder-led businesses hitting a growth ceiling'
    };

    // Email rules - what makes a good email
    this.rules = {
      // Never do these
      never: [
        'Use generic phrases like "I hope this email finds you well"',
        'Lead with what WE do',
        'Make claims without connecting to THEIR situation',
        'Use buzzwords or jargon',
        'Be longer than 150 words',
        'Include multiple CTAs',
        'Sound like a template'
      ],
      // Always do these
      always: [
        'Lead with something specific about THEM',
        'Connect their situation to a pain point they likely have',
        'Keep it conversational and human',
        'One clear, low-friction CTA',
        'Sound like a smart person who did their homework',
        'Be confident but not arrogant'
      ]
    };
  }

  /**
   * Write a personalized email using research data OR imported lead data
   */
  writeEmail(lead) {
    const research = lead.lead_research || {};

    // Check if this is an imported lead with limited data
    const isImportedLead = lead.job_title || lead.linkedin_url ||
      (research.company_background === 'Research skipped - using opportunity data only.');

    if (isImportedLead && !this.hasRealResearch(research)) {
      // Use job-title based personalization for imported leads
      return this.writeImportedLeadEmail(lead);
    }

    const analysis = this.analyzeResearch(lead, research);

    // Choose the best email angle based on what we know
    const angle = this.chooseAngle(analysis);

    // Write the email
    const email = this.composeEmail(lead, analysis, angle);

    return email;
  }

  /**
   * Check if lead has real Perplexity research
   */
  hasRealResearch(research) {
    const bg = research.company_background || '';
    const pain = research.pain_points || '';
    return (bg.length > 100 && !bg.includes('Research skipped')) ||
           (pain.length > 50 && !pain.includes('Research skipped'));
  }

  /**
   * Write email for imported leads using job title and company info
   */
  writeImportedLeadEmail(lead) {
    const firstName = lead.contact_name?.split(' ')[0] || null;
    const company = lead.company_name;
    const jobTitle = lead.job_title || '';
    const location = lead.location || '';

    // Determine role type from job title
    const roleType = this.categorizeRole(jobTitle);

    // Generate subject based on role
    const subject = this.writeImportedSubject(firstName, company, roleType);

    // Generate body based on what we know
    const body = this.writeImportedBody(firstName, company, jobTitle, roleType, location);

    return {
      subject,
      body,
      analysis: {
        angle: 'imported_lead_' + roleType,
        confidence: firstName ? 'medium' : 'low',
        researchQuality: 'imported_only',
        dataUsed: { firstName: !!firstName, jobTitle: !!jobTitle, location: !!location }
      }
    };
  }

  /**
   * Categorize role from job title
   */
  categorizeRole(jobTitle) {
    const title = (jobTitle || '').toLowerCase();

    if (title.includes('ceo') || title.includes('chief executive') || title.includes('founder') ||
        title.includes('owner') || title.includes('president') || title.includes('principal')) {
      return 'founder';
    }
    if (title.includes('coo') || title.includes('operations')) {
      return 'operations';
    }
    if (title.includes('cfo') || title.includes('finance') || title.includes('financial')) {
      return 'finance';
    }
    if (title.includes('managing director') || title.includes('general manager') || title.includes('gm')) {
      return 'executive';
    }
    if (title.includes('partner')) {
      return 'partner';
    }
    if (title.includes('director') || title.includes('vp') || title.includes('vice president')) {
      return 'director';
    }
    return 'leader';
  }

  /**
   * Write subject for imported leads
   */
  writeImportedSubject(firstName, company, roleType) {
    if (firstName) {
      if (roleType === 'founder' || roleType === 'partner') {
        return `${firstName} - a thought about ${company}'s next chapter`;
      }
      return `${firstName} - quick question about ${company}`;
    }
    return `${company} - growth without the growing pains`;
  }

  /**
   * Write body for imported leads based on role
   */
  writeImportedBody(firstName, company, jobTitle, roleType, location) {
    let body = firstName ? `Hi ${firstName},\n\n` : `Hi,\n\n`;

    // Opening based on role type
    switch (roleType) {
      case 'founder':
        body += `Building ${company} to where it is today took real vision. `;
        body += `Most founders I work with hit a point where the business works - but only because they're in every room.\n\n`;
        body += `The question becomes: how do you grow without becoming the bottleneck?\n\n`;
        break;

      case 'operations':
        body += `Running operations at ${company} means you see both the potential and the friction points.\n\n`;
        body += `In my experience, the companies that scale smoothly are the ones that build the right systems before they desperately need them.\n\n`;
        break;

      case 'partner':
        body += `Leading a firm like ${company} means balancing growth with the quality that built your reputation.\n\n`;
        body += `Most partners I work with are looking for ways to expand without diluting what makes them valuable.\n\n`;
        break;

      case 'executive':
      case 'director':
        body += `I came across ${company} and was curious about what you're building there.\n\n`;
        body += `Leaders in your position often see opportunities the business isn't quite set up to capture yet.\n\n`;
        break;

      default:
        body += `I've been looking at ${company} and the business you're building.\n\n`;
        body += `Companies at your stage often hit a point where the systems that got you here won't get you to the next level.\n\n`;
    }

    // Value prop
    body += `I help established businesses architect growth that doesn't create chaos - building the infrastructure for scale before you're drowning in it.\n\n`;

    // CTA
    if (roleType === 'founder' || roleType === 'partner') {
      body += `If you're thinking about what the next chapter looks like for ${company}, I'd welcome a conversation.\n`;
    } else {
      body += `If that resonates, I'd enjoy a quick conversation about what might be possible.\n`;
    }

    body += `\nBest,\nMaggie Forbes`;

    return body;
  }

  /**
   * Analyze the research to extract actionable insights
   */
  analyzeResearch(lead, research) {
    const analysis = {
      // Basic info
      firstName: this.extractFirstName(lead.contact_name),
      company: lead.company_name,
      domain: lead.company_domain,

      // From research
      tenure: this.extractTenure(research),
      revenue: this.extractRevenue(research),
      employees: this.extractEmployees(research),
      industry: this.extractIndustry(research, lead),

      // Pain points detected
      painPoints: this.detectPainPoints(research),
      primaryPain: null,

      // Personalization
      hooks: this.extractHooks(research),
      bestHook: null,

      // Quality scores
      researchQuality: 'unknown',
      confidenceLevel: 'low'
    };

    // Determine primary pain point
    if (analysis.painPoints.length > 0) {
      analysis.primaryPain = analysis.painPoints[0];
    }

    // Find best personalization hook
    if (analysis.hooks.length > 0) {
      analysis.bestHook = this.selectBestHook(analysis.hooks);
    }

    // Assess research quality
    analysis.researchQuality = this.assessResearchQuality(research);
    analysis.confidenceLevel = this.calculateConfidence(analysis);

    return analysis;
  }

  /**
   * Extract first name from full name
   */
  extractFirstName(fullName) {
    if (!fullName) return null;
    return fullName.split(' ')[0];
  }

  /**
   * Extract tenure/years in business
   */
  extractTenure(research) {
    const background = research.company_background || research.companyBackground?.findings || '';

    // Look for "X years" pattern
    const yearsMatch = background.match(/(\d+)\+?\s*years?/i);
    if (yearsMatch) {
      return { years: parseInt(yearsMatch[1]), source: 'explicit' };
    }

    // Look for "founded in YYYY" pattern
    const foundedMatch = background.match(/(?:founded|established|since|started)\s*(?:in\s*)?(\d{4})/i);
    if (foundedMatch) {
      const year = parseInt(foundedMatch[1]);
      return { years: 2025 - year, source: 'calculated', foundedYear: year };
    }

    return null;
  }

  /**
   * Extract revenue indicators
   */
  extractRevenue(research) {
    const background = research.company_background || research.companyBackground?.findings || '';

    const patterns = [
      { regex: /\$(\d+(?:\.\d+)?)\s*(?:million|M)/i, multiplier: 1000000 },
      { regex: /\$(\d+(?:\.\d+)?)\s*(?:billion|B)/i, multiplier: 1000000000 },
      { regex: /(\d+(?:\.\d+)?)\s*million\s*(?:in\s*)?(?:revenue|ARR)/i, multiplier: 1000000 }
    ];

    for (const { regex, multiplier } of patterns) {
      const match = background.match(regex);
      if (match) {
        return { amount: parseFloat(match[1]) * multiplier, raw: match[0] };
      }
    }

    return null;
  }

  /**
   * Extract employee count
   */
  extractEmployees(research) {
    const background = research.company_background || research.companyBackground?.findings || '';

    const match = background.match(/(\d+)\s*(?:\+\s*)?(?:employees?|team members?|people|staff)/i);
    if (match) {
      return parseInt(match[1]);
    }

    return null;
  }

  /**
   * Extract industry
   */
  extractIndustry(research, lead) {
    const background = research.company_background || research.companyBackground?.findings || '';
    const text = (background + ' ' + (lead.company_name || '')).toLowerCase();

    const industries = {
      'consulting': ['consulting', 'consultancy', 'advisory', 'advisor'],
      'technology': ['software', 'saas', 'tech', 'technology', 'platform', 'app'],
      'marketing': ['marketing', 'agency', 'advertising', 'creative', 'digital'],
      'finance': ['finance', 'investment', 'wealth', 'capital', 'financial'],
      'healthcare': ['health', 'medical', 'healthcare', 'pharma', 'clinical'],
      'manufacturing': ['manufacturing', 'industrial', 'production'],
      'professional_services': ['legal', 'law', 'accounting', 'cpa', 'architecture'],
      'real_estate': ['real estate', 'property', 'realty', 'brokerage'],
      'staffing': ['staffing', 'recruiting', 'recruitment', 'hr ', 'talent']
    };

    for (const [industry, keywords] of Object.entries(industries)) {
      for (const keyword of keywords) {
        if (text.includes(keyword)) {
          return industry;
        }
      }
    }

    return 'business';
  }

  /**
   * Detect pain points from research
   */
  detectPainPoints(research) {
    const painPoints = [];
    const painText = (
      (research.pain_points || '') +
      (research.painPointAnalysis?.findings || '') +
      (research.company_background || '') +
      (research.companyBackground?.findings || '')
    ).toLowerCase();

    // Leadership dependency indicators
    if (
      painText.includes('founder') ||
      painText.includes('owner-operated') ||
      painText.includes('leadership dependency') ||
      painText.includes('key person') ||
      painText.includes('bottleneck') ||
      painText.includes('wears many hats') ||
      painText.includes('hands-on')
    ) {
      painPoints.push({
        type: 'leadership_dependency',
        confidence: 'high',
        message: "you're still the one everyone turns to for the big decisions",
        solution: "building a leadership layer that can carry the weight"
      });
    }

    // Relationship-dependent revenue
    if (
      painText.includes('relationship') ||
      painText.includes('referral') ||
      painText.includes('word of mouth') ||
      painText.includes('network') ||
      painText.includes('personal connections') ||
      painText.includes('no systematic')
    ) {
      painPoints.push({
        type: 'relationship_revenue',
        confidence: 'high',
        message: "your best clients came through relationships you personally built",
        solution: "creating a pipeline that doesn't depend on your personal network"
      });
    }

    // Infrastructure/scaling issues
    if (
      painText.includes('manual') ||
      painText.includes('scale') ||
      painText.includes('scaling') ||
      painText.includes('infrastructure') ||
      painText.includes('systems') ||
      painText.includes('process') ||
      painText.includes('operational')
    ) {
      painPoints.push({
        type: 'infrastructure_gap',
        confidence: 'medium',
        message: "the systems that got you here won't get you to the next level",
        solution: "architecting infrastructure that scales without adding complexity"
      });
    }

    // Team dependency
    if (
      painText.includes('team needs') ||
      painText.includes('can\'t delegate') ||
      painText.includes('quality control') ||
      painText.includes('standards')
    ) {
      painPoints.push({
        type: 'team_dependency',
        confidence: 'medium',
        message: "your team needs you in the room to deliver at your standard",
        solution: "building systems so your team can operate at your level"
      });
    }

    // Default pain point if nothing detected
    if (painPoints.length === 0) {
      painPoints.push({
        type: 'general_growth',
        confidence: 'low',
        message: "you've built something valuable but it still runs through you",
        solution: "creating systems that let you step back without stepping down"
      });
    }

    return painPoints;
  }

  /**
   * Extract personalization hooks from research
   */
  extractHooks(research) {
    const hooks = [];
    const hookText = (
      (research.personalization_hooks || '') +
      (research.personalizationHooks?.findings || '') +
      (research.company_background || '') +
      (research.companyBackground?.findings || '')
    );

    if (!hookText || hookText.length < 20) return hooks;

    // Achievement patterns
    const achievementPatterns = [
      /(?:won|received|named|awarded|recognized)\s+(?:as\s+)?(?:the\s+)?[^.]{10,60}/gi,
      /(?:featured|quoted|interviewed)\s+(?:in|on|by)\s+[^.]{5,40}/gi,
      /(?:grew|scaled|expanded)\s+(?:from|to)\s+[^.]{10,50}/gi,
      /(?:launched|built|created|founded)\s+[^.]{10,50}/gi
    ];

    for (const pattern of achievementPatterns) {
      const matches = hookText.match(pattern);
      if (matches) {
        for (const match of matches) {
          const cleaned = match.trim();
          if (cleaned.length > 15 && cleaned.length < 100) {
            hooks.push({
              type: 'achievement',
              text: cleaned,
              quality: this.assessHookQuality(cleaned)
            });
          }
        }
      }
    }

    // Milestone patterns
    const milestonePatterns = [
      /(?:recently|just)\s+(?:launched|announced|completed|closed|raised)[^.]{10,60}/gi,
      /(?:celebrating|marks|marks)\s+(?:\d+\s+years?)[^.]{5,40}/gi
    ];

    for (const pattern of milestonePatterns) {
      const matches = hookText.match(pattern);
      if (matches) {
        for (const match of matches) {
          const cleaned = match.trim();
          if (cleaned.length > 15 && cleaned.length < 100) {
            hooks.push({
              type: 'milestone',
              text: cleaned,
              quality: this.assessHookQuality(cleaned)
            });
          }
        }
      }
    }

    return hooks;
  }

  /**
   * Assess hook quality
   */
  assessHookQuality(hook) {
    let score = 0;

    // Has specific numbers
    if (/\d+/.test(hook)) score += 2;

    // Has a recognizable entity
    if (/(?:Inc|Forbes|TechCrunch|NYT|LinkedIn|award|prize)/i.test(hook)) score += 2;

    // Reasonable length
    if (hook.length > 30 && hook.length < 80) score += 1;

    // Starts with action word
    if (/^(?:won|received|launched|grew|built|featured)/i.test(hook)) score += 1;

    return score >= 3 ? 'high' : score >= 2 ? 'medium' : 'low';
  }

  /**
   * Select the best hook to use
   */
  selectBestHook(hooks) {
    if (hooks.length === 0) return null;

    // Sort by quality
    const sorted = hooks.sort((a, b) => {
      const qualityOrder = { high: 3, medium: 2, low: 1 };
      return (qualityOrder[b.quality] || 0) - (qualityOrder[a.quality] || 0);
    });

    return sorted[0];
  }

  /**
   * Assess overall research quality
   */
  assessResearchQuality(research) {
    let score = 0;

    if (research.company_background || research.companyBackground?.findings) score++;
    if (research.pain_points || research.painPointAnalysis?.findings) score++;
    if (research.decision_maker || research.decisionMaker?.findings) score++;
    if (research.personalization_hooks || research.personalizationHooks?.findings) score++;

    if (score >= 4) return 'excellent';
    if (score >= 3) return 'good';
    if (score >= 2) return 'fair';
    return 'poor';
  }

  /**
   * Calculate confidence level for personalization
   */
  calculateConfidence(analysis) {
    let score = 0;

    if (analysis.firstName) score++;
    if (analysis.tenure) score++;
    if (analysis.bestHook) score++;
    if (analysis.primaryPain?.confidence === 'high') score += 2;
    if (analysis.researchQuality === 'excellent' || analysis.researchQuality === 'good') score++;

    if (score >= 5) return 'high';
    if (score >= 3) return 'medium';
    return 'low';
  }

  /**
   * Choose the best email angle based on analysis
   */
  chooseAngle(analysis) {
    // If we have a strong personalization hook, lead with that
    if (analysis.bestHook?.quality === 'high') {
      return 'achievement_hook';
    }

    // If we know their tenure and it's significant, lead with that
    if (analysis.tenure?.years >= 10) {
      return 'tenure_based';
    }

    // If we detected a strong pain point, lead with that
    if (analysis.primaryPain?.confidence === 'high') {
      return 'pain_point';
    }

    // Default: company-focused opener
    return 'company_observation';
  }

  /**
   * Compose the email
   */
  composeEmail(lead, analysis, angle) {
    const { firstName, company, tenure, primaryPain, bestHook } = analysis;

    // Subject line
    const subject = this.writeSubject(firstName, company, analysis);

    // Email body
    let body = '';

    // Greeting
    body += firstName ? `Hi ${firstName},\n\n` : `Hi,\n\n`;

    // Opening - varies by angle
    body += this.writeOpening(analysis, angle);

    // Pain point connection
    body += this.writePainConnection(analysis);

    // Value proposition (brief)
    body += this.writeValue(analysis);

    // Call to action
    body += this.writeCTA(analysis);

    // Sign off
    body += `\nBest,\n${this.sender.name}`;

    return {
      subject,
      body,
      analysis: {
        angle,
        confidence: analysis.confidenceLevel,
        researchQuality: analysis.researchQuality,
        painPointUsed: analysis.primaryPain?.type,
        hookUsed: analysis.bestHook?.type
      }
    };
  }

  /**
   * Write subject line
   */
  writeSubject(firstName, company, analysis) {
    const { tenure, primaryPain } = analysis;

    // Tenure-based subjects
    if (tenure?.years >= 15) {
      return firstName
        ? `${firstName} - thinking about what's next?`
        : `${company} - the next chapter`;
    }

    // Pain-point subjects
    if (primaryPain?.type === 'leadership_dependency') {
      return firstName
        ? `${firstName} - a question about ${company}`
        : `Quick question about ${company}`;
    }

    // Default
    return firstName
      ? `${firstName} - quick thought about ${company}`
      : `${company} - growth without the chaos`;
  }

  /**
   * Write opening paragraph based on angle
   */
  writeOpening(analysis, angle) {
    const { firstName, company, tenure, bestHook } = analysis;

    switch (angle) {
      case 'achievement_hook':
        // Lead with their achievement
        const hook = bestHook.text.toLowerCase();
        return `I noticed ${hook.startsWith('you') ? '' : 'that '}${hook}.\n\nLeaders who've achieved that level often hit a similar inflection point: `;

      case 'tenure_based':
        // Lead with their tenure
        if (tenure.years >= 20) {
          return `${tenure.years} years building ${company}. That's a legacy worth protecting.\n\nAt this stage, the question often shifts from "how do I grow?" to "how do I transition without losing what I've built?"\n\n`;
        } else if (tenure.years >= 15) {
          return `${tenure.years} years building ${company} - that's not luck, that's proof you've created something real.\n\nLeaders at this stage often start thinking about the next chapter - `;
        } else {
          return `A decade building ${company} means you've figured out how to create value. The question now is whether the business can create that value without you in every room.\n\n`;
        }

      case 'pain_point':
        // Lead with observation about their situation
        return `I've been looking at ${company} and what you're building.\n\nMy guess is `;

      case 'company_observation':
      default:
        // Generic but personalized opener
        return `I came across ${company} and was curious about what you're building.\n\nLeaders like you often hit a point where `;
    }
  }

  /**
   * Write pain point connection
   */
  writePainConnection(analysis) {
    const { primaryPain, tenure } = analysis;

    if (!primaryPain) {
      return "you've built something valuable but it still runs through you.\n\n";
    }

    // Don't repeat if we already mentioned it in the opening
    if (analysis.confidenceLevel === 'high' && tenure?.years >= 15) {
      return ''; // Skip - already covered in tenure-based opening
    }

    return `${primaryPain.message}.\n\n`;
  }

  /**
   * Write value proposition
   */
  writeValue(analysis) {
    const { primaryPain, company } = analysis;

    const solution = primaryPain?.solution || "creating systems that let you step back without stepping down";

    return `That's the gap I help established leaders close - ${solution}.\n\n`;
  }

  /**
   * Write call to action
   */
  writeCTA(analysis) {
    const { tenure, company, confidenceLevel } = analysis;

    if (tenure?.years >= 20) {
      return `If you're starting to think about what the next chapter looks like, I'd enjoy a conversation.\n`;
    }

    if (tenure?.years >= 15) {
      return `If that resonates, I'd welcome a conversation about what options might look like for ${company}.\n`;
    }

    return `If that resonates, I'd enjoy a quick conversation about what the next level could look like for ${company}.\n`;
  }

  /**
   * Validate email quality before sending
   */
  validateEmail(email) {
    const issues = [];

    // Check length
    const wordCount = email.body.split(/\s+/).length;
    if (wordCount > 200) {
      issues.push(`Too long: ${wordCount} words (max 200)`);
    }

    // Check for banned phrases
    const bannedPhrases = [
      'hope this email finds you',
      'i wanted to reach out',
      'i\'m reaching out',
      'touching base',
      'circle back',
      'synergy',
      'leverage',
      'paradigm'
    ];

    const bodyLower = email.body.toLowerCase();
    for (const phrase of bannedPhrases) {
      if (bodyLower.includes(phrase)) {
        issues.push(`Contains banned phrase: "${phrase}"`);
      }
    }

    // Check for personalization
    if (!email.body.includes(email.analysis?.company || '___')) {
      issues.push('Missing company name personalization');
    }

    return {
      valid: issues.length === 0,
      issues,
      quality: issues.length === 0 ? 'good' : issues.length <= 2 ? 'acceptable' : 'poor'
    };
  }
}

module.exports = SmartEmailWriter;
