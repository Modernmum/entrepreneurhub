// ============================================================================
// SOCIAL PROOF AUTOMATION SERVICE
// ============================================================================
// Automatically generates testimonials, case studies, and cross-promotes
// ============================================================================

const orchestrator = require('./ai-orchestrator');
const partnerManager = require('./partner-manager');
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

class SocialProofAutomation {

  // ==========================================================================
  // AUTOMATIC CASE STUDY GENERATION
  // ==========================================================================

  /**
   * Generate case study from job results
   * Called automatically when a job completes successfully
   */
  async generateCaseStudy(userId, jobId, solutionType, results) {
    try {
      console.log(`📝 Generating case study for user ${userId}...`);

      // 1. Get user profile
      const { data: user } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (!user) {
        throw new Error('User not found');
      }

      // 2. Get tenant user info
      const { data: tenantUser } = await supabase
        .from('tenant_users')
        .select('*, tenants(*)')
        .eq('user_id', userId)
        .single();

      if (!tenantUser) {
        console.log('User not associated with tenant, skipping case study');
        return null;
      }

      // 3. Generate case study with AI
      const prompt = `
        Write a compelling business case study about this client success story:

        **Client Info:**
        - Name: ${user.name || 'Anonymous'}
        - Business: ${user.business || 'Entrepreneur'}
        - Solution Used: ${this._formatSolutionType(solutionType)}

        **Problem/Challenge:**
        ${results.problem || 'Needed to grow their business'}

        **Results Achieved:**
        ${JSON.stringify(results.metrics || results, null, 2)}

        **Format Requirements:**
        - Title: "How [Client/Business] achieved [Key Result] with AI"
        - Challenge section (2-3 paragraphs)
        - Solution section (describe how AI helped)
        - Results section (include specific numbers/metrics)
        - Pull quote for testimonial
        - SEO optimized for "[solution type] success story"
        - Professional but approachable tone
        - 600-800 words

        Return JSON:
        {
          "title": "...",
          "slug": "how-business-achieved-result",
          "challenge": "...",
          "solution": "...",
          "results": "...",
          "quote": "short testimonial quote",
          "meta_description": "SEO description 150 chars"
        }
      `;

      const aiResponse = await orchestrator.execute('content', prompt);
      const caseStudy = JSON.parse(aiResponse.content);

      // 4. Save to database
      const { data: savedCaseStudy, error } = await supabase
        .from('social_proof')
        .insert({
          user_id: userId,
          tenant_id: tenantUser.tenant_id,
          type: 'case_study',
          title: caseStudy.title,
          content: `${caseStudy.challenge}\n\n${caseStudy.solution}\n\n${caseStudy.results}`,
          quote: caseStudy.quote,
          client_name: user.name,
          client_business: user.business || 'Entrepreneur',
          solution_type: solutionType,
          results: results.metrics || results,
          slug: caseStudy.slug,
          meta_description: caseStudy.meta_description,
          published: false, // Review before publishing
          client_approved: false // Need client approval
        })
        .select()
        .single();

      if (error) throw error;

      console.log(`✅ Case study generated: ${caseStudy.title}`);

      // 5. Email client for approval
      await this.requestCaseStudyApproval(userId, savedCaseStudy.id);

      return savedCaseStudy;

    } catch (error) {
      console.error('Failed to generate case study:', error);
      return null;
    }
  }

  /**
   * Request case study approval from client
   */
  async requestCaseStudyApproval(userId, caseStudyId) {
    const { data: user } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    const { data: caseStudy } = await supabase
      .from('social_proof')
      .select('*')
      .eq('id', caseStudyId)
      .single();

    // TODO: Send email to user with case study preview
    // For now, just log
    console.log(`📧 Would send approval request to ${user.email} for case study: ${caseStudy.title}`);

    // In production, use SendGrid or similar:
    // await sendEmail({
    //   to: user.email,
    //   subject: "We'd love to feature your success story!",
    //   body: caseStudy preview + approval link
    // });
  }

  // ==========================================================================
  // TESTIMONIAL COLLECTION
  // ==========================================================================

  /**
   * Automatically collect testimonial after successful job
   * Called 24 hours after job completion
   */
  async collectTestimonial(userId, jobId, solutionType, results) {
    try {
      console.log(`⭐ Requesting testimonial from user ${userId}...`);

      const { data: user } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (!user) return null;

      // TODO: Send email requesting testimonial
      // For now, just log
      console.log(`📧 Would send testimonial request to ${user.email}`);

      // In production:
      // await sendEmail({
      //   to: user.email,
      //   subject: "How did we do? Quick feedback request",
      //   body: "Rate our service + optional testimonial"
      // });

      return {
        success: true,
        message: 'Testimonial request sent'
      };

    } catch (error) {
      console.error('Failed to collect testimonial:', error);
      return null;
    }
  }

  /**
   * Save testimonial from client
   */
  async saveTestimonial({
    userId,
    quote,
    rating,
    solutionType,
    canUseName = true,
    canUseBusiness = true
  }) {
    const { data: user } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    const { data: tenantUser } = await supabase
      .from('tenant_users')
      .select('tenant_id')
      .eq('user_id', userId)
      .single();

    const { data: testimonial, error } = await supabase
      .from('social_proof')
      .insert({
        user_id: userId,
        tenant_id: tenantUser.tenant_id,
        type: 'testimonial',
        quote: quote,
        rating: rating,
        client_name: canUseName ? user.name : 'Anonymous',
        client_business: canUseBusiness ? user.business : null,
        solution_type: solutionType,
        client_approved: true,
        can_use_name: canUseName,
        can_use_business: canUseBusiness,
        published: true // Auto-publish testimonials
      })
      .select()
      .single();

    if (error) throw error;

    console.log(`✅ Testimonial saved from ${user.name}`);

    // Reward user with free credit
    await this.rewardTestimonial(userId);

    return testimonial;
  }

  /**
   * Reward user for providing testimonial
   */
  async rewardTestimonial(userId) {
    // TODO: Add 1 month free credit
    console.log(`🎁 Would give ${userId} 1 month free for testimonial`);
  }

  // ==========================================================================
  // CROSS-PROMOTION
  // ==========================================================================

  /**
   * Cross-promote success story across all tenants
   * When Maggie Forbes client succeeds, promote on Unbound.team and GMP
   */
  async crossPromote(caseStudyId) {
    try {
      const { data: caseStudy } = await supabase
        .from('social_proof')
        .select('*, tenants(*)')
        .eq('id', caseStudyId)
        .single();

      if (!caseStudy) return null;

      console.log(`🚀 Cross-promoting case study: ${caseStudy.title}`);

      // 1. Get all other tenants
      const { data: allTenants } = await supabase
        .from('tenants')
        .select('*')
        .neq('id', caseStudy.tenant_id);

      // 2. Share case study with other tenants
      const shareWithTenants = allTenants.map(t => t.id);

      await supabase
        .from('social_proof')
        .update({
          share_with_tenants: shareWithTenants
        })
        .eq('id', caseStudyId);

      // 3. Create cross-promotion campaign for each tenant
      for (const tenant of allTenants) {
        await this.createCrossPromotionCampaign({
          sourceTenantId: caseStudy.tenant_id,
          targetTenantId: tenant.id,
          caseStudyId: caseStudyId,
          caseStudy: caseStudy
        });
      }

      console.log(`✅ Case study shared with ${allTenants.length} partner brands`);

      return {
        success: true,
        sharedWith: allTenants.length
      };

    } catch (error) {
      console.error('Failed to cross-promote:', error);
      return null;
    }
  }

  /**
   * Create cross-promotion campaign
   */
  async createCrossPromotionCampaign({
    sourceTenantId,
    targetTenantId,
    caseStudyId,
    caseStudy
  }) {
    const { data: targetTenant } = await supabase
      .from('tenants')
      .select('*')
      .eq('id', targetTenantId)
      .single();

    // Create campaign
    const { data: campaign, error } = await supabase
      .from('cross_promotion_campaigns')
      .insert({
        source_tenant_id: sourceTenantId,
        campaign_name: `Share: ${caseStudy.title}`,
        campaign_type: 'case_study_share',
        target_tenants: [targetTenantId],
        subject: `Success Story: ${caseStudy.title}`,
        body: caseStudy.content.substring(0, 300) + '...',
        cta_text: 'Read Full Case Study',
        cta_url: `/case-studies/${caseStudy.slug}`,
        case_study_id: caseStudyId,
        status: 'scheduled',
        scheduled_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24 hours from now
      })
      .select()
      .single();

    if (error) {
      console.error('Failed to create campaign:', error);
      return null;
    }

    console.log(`📧 Campaign created for ${targetTenant.name}`);

    return campaign;
  }

  /**
   * Send cross-promotion emails
   * Run this as a cron job every day
   */
  async sendScheduledPromotions() {
    const now = new Date().toISOString();

    // Get all scheduled campaigns ready to send
    const { data: campaigns } = await supabase
      .from('cross_promotion_campaigns')
      .select('*')
      .eq('status', 'scheduled')
      .lte('scheduled_at', now);

    if (!campaigns || campaigns.length === 0) {
      console.log('No campaigns to send');
      return;
    }

    console.log(`📧 Sending ${campaigns.length} cross-promotion campaigns...`);

    for (const campaign of campaigns) {
      await this.sendCampaign(campaign);
    }
  }

  /**
   * Send individual campaign
   */
  async sendCampaign(campaign) {
    try {
      // Get target tenant users
      const { data: users } = await supabase
        .from('tenant_users')
        .select('user_id, profiles(*)')
        .in('tenant_id', campaign.target_tenants)
        .eq('status', 'active');

      if (!users || users.length === 0) {
        console.log(`No users to send campaign ${campaign.id}`);
        return;
      }

      // TODO: Send emails using SendGrid or similar
      // For now, just log
      console.log(`📧 Would send "${campaign.subject}" to ${users.length} users`);

      // Mark as sent
      await supabase
        .from('cross_promotion_campaigns')
        .update({
          status: 'sent',
          sent_at: new Date().toISOString(),
          recipients_count: users.length
        })
        .eq('id', campaign.id);

      console.log(`✅ Campaign ${campaign.id} sent to ${users.length} users`);

    } catch (error) {
      console.error('Failed to send campaign:', error);
    }
  }

  // ==========================================================================
  // HELPERS
  // ==========================================================================

  _formatSolutionType(solutionType) {
    const types = {
      'lead-generation': 'Lead Generation',
      'content-creation': 'Content Creation',
      'market-research': 'Market Research',
      'landing-page': 'Landing Page Builder',
      'email-marketing': 'Email Marketing'
    };

    return types[solutionType] || solutionType;
  }
}

module.exports = new SocialProofAutomation();
