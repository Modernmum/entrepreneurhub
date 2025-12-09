/**
 * Intelligent Qualification & Scoring Service
 * Rule-based scoring - NO API COSTS
 */

class IntelligentScorer {
  constructor() {
    // No API dependencies - pure rule-based logic
  }

  /**
   * STEP 1: Pre-qualification (FILTER FIRST)
   * More lenient - qualify if they show buying signals
   */
  async preQualify(opportunity) {
    const signals = this.detectSignals(opportunity);

    // Check if opportunity has high score from discovery
    const hasHighScore = (opportunity.overall_score || 0) >= 70;
    const isRoutedToOutreach = opportunity.route_to_outreach === true;

    const qualificationCriteria = {
      lookingForSolutions: signals.needsHelp || signals.hiring || signals.sourcingSolutions || hasHighScore,
      hasBudget: signals.fundingMentioned || signals.payingForTools || signals.budgetSignals || hasHighScore,
      relevantPainPoint: signals.painPointDetected || hasHighScore,
      reachable: signals.hasContactInfo || isRoutedToOutreach // Allow outreach-routed leads
    };

    // Qualify if 3 out of 4 criteria are met OR if already marked for outreach
    const metCriteria = Object.values(qualificationCriteria).filter(v => v === true).length;
    const isQualified = metCriteria >= 3 || isRoutedToOutreach || hasHighScore;

    return {
      qualified: isQualified,
      criteria: qualificationCriteria,
      signals: signals,
      reason: isQualified ? 'Meets qualification criteria' : this.getDisqualificationReason(qualificationCriteria)
    };
  }

  /**
   * Detect signals in opportunity data
   */
  detectSignals(opportunity) {
    const text = JSON.stringify(opportunity).toLowerCase();

    return {
      // Looking for solutions signals
      needsHelp: this.containsAny(text, [
        'need help', 'looking for', 'anyone know', 'recommendations',
        'struggle with', 'problem with', 'issue with', 'difficulty',
        'cant figure out', 'stuck on', 'how to', 'best way to'
      ]),

      hiring: this.containsAny(text, [
        'hiring', 'looking to hire', 'need developer', 'need designer',
        'freelancer', 'contractor', 'agency', 'consultant', 'full-time',
        'part-time', 'seeking', 'recruiting'
      ]),

      sourcingSolutions: this.containsAny(text, [
        'tool for', 'software for', 'platform for', 'service for',
        'solution for', 'alternative to', 'better than', 'recommend',
        'which tool', 'what software', 'looking at'
      ]),

      // Budget signals
      fundingMentioned: this.containsAny(text, [
        'funded', 'raised', 'series a', 'series b', 'seed round',
        'venture', 'investors', 'valuation', '$', 'million', 'k funding'
      ]),

      payingForTools: this.containsAny(text, [
        'subscription', 'paying for', 'using', 'license',
        'per month', 'annual plan', 'pricing', 'cost'
      ]),

      budgetSignals: this.containsAny(text, [
        'budget', 'spend', 'invest', 'allocate', 'worth it',
        'roi', 'return', 'revenue', 'profitable', 'customers'
      ]),

      // Pain point signals
      painPointDetected: this.containsAny(text, [
        'problem', 'issue', 'challenge', 'struggle', 'difficult',
        'frustrating', 'slow', 'manual', 'time consuming', 'inefficient',
        'bottleneck', 'blocker', 'broken'
      ]),

      // Urgency signals
      urgencyHigh: this.containsAny(text, [
        'asap', 'urgent', 'immediately', 'right now', 'today',
        'this week', 'deadline', 'critical', 'emergency'
      ]),

      urgencyMedium: this.containsAny(text, [
        'soon', 'next week', 'this month', 'looking to start',
        'planning to', 'need by'
      ]),

      // Client acquisition fit signals
      clientAcquisitionFit: this.containsAny(text, [
        'lead generation', 'get clients', 'find customers', 'sales',
        'outreach', 'marketing', 'growth', 'acquisition', 'convert',
        'closing deals', 'pipeline', 'prospecting'
      ]),

      // Contact signals - be more lenient
      hasContactInfo: !!(opportunity.company_domain || opportunity.contact_email || opportunity.route_to_outreach),

      // Check opportunity_data for additional signals
      hasOpportunityData: !!(opportunity.opportunity_data && Object.keys(opportunity.opportunity_data).length > 0)
    };
  }

  /**
   * STEP 2: Rule-Based Scoring (ONLY for qualified leads)
   * Calculate score from signals - NO API CALLS
   */
  async scoreQualifiedLead(opportunity) {
    const text = JSON.stringify(opportunity).toLowerCase();
    const signals = this.detectSignals(opportunity);

    // 1. PAIN POINT SEVERITY (1-10)
    let painSeverity = 0;
    const painKeywords = [
      'problem', 'issue', 'challenge', 'struggle', 'difficult',
      'frustrating', 'slow', 'manual', 'time consuming', 'inefficient',
      'bottleneck', 'blocker', 'broken', 'failing', 'losing money'
    ];
    painKeywords.forEach(keyword => {
      if (text.includes(keyword)) painSeverity += 0.8;
    });
    painSeverity = Math.min(10, Math.round(painSeverity));

    // 2. BUDGET LIKELIHOOD (1-10)
    let budgetLikelihood = 0;
    if (signals.fundingMentioned) budgetLikelihood += 4;
    if (signals.payingForTools) budgetLikelihood += 3;
    if (signals.budgetSignals) budgetLikelihood += 3;
    budgetLikelihood = Math.min(10, budgetLikelihood);

    // 3. URGENCY (1-10)
    let urgency = 5; // default medium
    if (signals.urgencyHigh) urgency = 9;
    else if (signals.urgencyMedium) urgency = 7;
    else if (signals.needsHelp || signals.hiring) urgency = 6;

    // 4. FIT WITH UNBOUND SERVICES (1-10)
    let serviceFit = 0;
    if (signals.clientAcquisitionFit) serviceFit += 5;
    if (signals.needsHelp) serviceFit += 2;
    if (signals.hiring || signals.sourcingSolutions) serviceFit += 3;
    serviceFit = Math.min(10, serviceFit);

    const totalScore = painSeverity + budgetLikelihood + urgency + serviceFit;

    // Determine recommendation
    let recommendation = 'SKIP';
    if (totalScore >= 30) recommendation = 'PRIORITY';
    else if (totalScore >= 25) recommendation = 'QUALIFIED';
    else if (totalScore >= 20) recommendation = 'MAYBE';

    // Generate insights
    const keyInsights = [];
    if (painSeverity >= 7) keyInsights.push('High pain point severity detected');
    if (budgetLikelihood >= 7) keyInsights.push('Strong budget indicators');
    if (urgency >= 8) keyInsights.push('High urgency - act quickly');
    if (serviceFit >= 7) keyInsights.push('Excellent fit for our services');

    // Generate approach
    let suggestedApproach = 'Standard outreach';
    if (totalScore >= 30) {
      suggestedApproach = 'Priority contact - personalized approach, reference specific pain points';
    } else if (totalScore >= 25) {
      suggestedApproach = 'Qualified lead - personalized outreach with value proposition';
    }

    return {
      painSeverity,
      budgetLikelihood,
      urgency,
      serviceFit,
      totalScore,
      recommendation,
      reasoning: `Score ${totalScore}/40: Pain=${painSeverity}, Budget=${budgetLikelihood}, Urgency=${urgency}, Fit=${serviceFit}`,
      keyInsights,
      suggestedApproach
    };
  }

  /**
   * Complete qualification + scoring flow
   */
  async processOpportunity(opportunity) {
    // Step 1: Pre-qualify
    const qualification = await this.preQualify(opportunity);

    if (!qualification.qualified) {
      return {
        qualified: false,
        reason: qualification.reason,
        action: 'SKIP',
        score: 0
      };
    }

    // Step 2: Score qualified lead
    const scoring = await this.scoreQualifiedLead(opportunity);

    // Step 3: Determine action
    let action = 'SKIP';
    if (scoring.totalScore >= 30) {
      action = 'PRIORITY'; // Top priority
    } else if (scoring.totalScore >= 25) {
      action = 'QUALIFIED'; // Worth pursuing
    } else if (scoring.totalScore >= 20) {
      action = 'MAYBE'; // Review manually
    }

    return {
      qualified: true,
      action: action,
      score: scoring.totalScore,
      breakdown: {
        painSeverity: scoring.painSeverity,
        budgetLikelihood: scoring.budgetLikelihood,
        urgency: scoring.urgency,
        serviceFit: scoring.serviceFit
      },
      recommendation: scoring.recommendation,
      reasoning: scoring.reasoning,
      keyInsights: scoring.keyInsights,
      suggestedApproach: scoring.suggestedApproach,
      signals: qualification.signals
    };
  }

  /**
   * Batch process opportunities
   */
  async processBatch(opportunities) {
    console.log(`📊 Processing batch of ${opportunities.length} opportunities...`);

    const results = [];
    let qualified = 0;
    let priority = 0;

    for (const opp of opportunities) {
      const result = await this.processOpportunity(opp);
      results.push({
        opportunityId: opp.id,
        ...result
      });

      if (result.qualified) qualified++;
      if (result.action === 'PRIORITY') priority++;
    }

    console.log(`✅ Processed ${opportunities.length}: ${qualified} qualified, ${priority} priority`);

    return {
      total: opportunities.length,
      qualified,
      priority,
      results
    };
  }

  // Helper methods
  containsAny(text, keywords) {
    return keywords.some(keyword => text.includes(keyword.toLowerCase()));
  }

  getDisqualificationReason(criteria) {
    const failed = Object.entries(criteria)
      .filter(([_, value]) => !value)
      .map(([key]) => key);

    return `Missing: ${failed.join(', ')}`;
  }
}

module.exports = IntelligentScorer;
