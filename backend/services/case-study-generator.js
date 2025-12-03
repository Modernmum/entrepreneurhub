// Case Study Generator - Automatically create compelling case studies from user successes
// Turns testimonials into detailed, shareable success stories

const { createClient } = require('@supabase/supabase-js');
const orchestrator = require('./ai-orchestrator');
require('dotenv').config();

class CaseStudyGenerator {
  constructor() {
    this.supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_KEY
    );
  }

  /**
   * Generate case study from user data and testimonial
   */
  async generateCaseStudy(userId, testimonialId = null) {
    console.log(`📝 Generating case study for user: ${userId}`);

    // Gather user data
    const userData = await this.gatherUserData(userId, testimonialId);

    if (!userData) {
      console.error('Failed to gather user data');
      return null;
    }

    // Generate case study with AI
    const caseStudy = await this.generateWithAI(userData);

    if (!caseStudy) {
      console.error('Failed to generate case study');
      return null;
    }

    // Save to database
    const saved = await this.saveCaseStudy(userId, caseStudy, userData);

    console.log(`✅ Case study generated: ${caseStudy.title}`);

    return saved;
  }

  /**
   * Gather all relevant user data
   */
  async gatherUserData(userId, testimonialId) {
    // Get testimonial if provided
    let testimonial = null;
    if (testimonialId) {
      const { data } = await this.supabase
        .from('testimonials')
        .select('*')
        .eq('id', testimonialId)
        .single();

      testimonial = data;
    }

    // Get user profile (if available)
    const { data: profile } = await this.supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    // Get user's successful solutions
    const { data: solutions } = await this.supabase
      .from('solution_results')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'completed')
      .order('completed_at', { ascending: false });

    // Get referral stats (shows impact)
    const { data: referrals } = await this.supabase
      .from('referrals')
      .select('*')
      .eq('referrer_id', userId);

    return {
      userId,
      testimonial,
      profile,
      solutions: solutions || [],
      referrals: referrals || [],
      metrics: this.calculateMetrics(solutions)
    };
  }

  /**
   * Calculate key metrics from user data
   */
  calculateMetrics(solutions) {
    if (!solutions || solutions.length === 0) {
      return {
        totalSolutions: 0,
        timeSaved: 0,
        leadGenerated: 0,
        revenueImpact: 0
      };
    }

    const metrics = {
      totalSolutions: solutions.length,
      timeSaved: 0,
      leadsGenerated: 0,
      revenueImpact: 0
    };

    solutions.forEach(solution => {
      const meta = solution.metadata || {};

      // Time saved (hours)
      metrics.timeSaved += meta.timeSaved || meta.time_saved || 0;

      // Leads generated
      metrics.leadsGenerated += meta.leadsGenerated || meta.leads_count || 0;

      // Revenue impact
      metrics.revenueImpact += meta.revenueImpact || meta.revenue_increase || 0;
    });

    return metrics;
  }

  /**
   * Generate case study content with AI
   */
  async generateWithAI(userData) {
    const prompt = `Create a compelling case study for a customer success story.

Customer Data:
- User: ${userData.profile?.name || 'Anonymous'}
- Industry: ${userData.profile?.industry || 'Entrepreneurship'}
- Solutions Used: ${userData.solutions.length}
${userData.testimonial ? `- Testimonial: "${userData.testimonial.testimonial_text}"` : ''}

Key Metrics:
- Time Saved: ${userData.metrics.timeSaved} hours
- Leads Generated: ${userData.metrics.leadsGenerated}
- Revenue Impact: $${userData.metrics.revenueImpact}

Generate a detailed case study with:

1. **Title**: Catchy, benefit-driven title (10 words max)

2. **Hook**: One sentence that captures the transformation

3. **The Challenge**: 2-3 sentences describing the problem they faced before using Unbound.team

4. **The Solution**: 2-3 sentences explaining what they did with Unbound.team

5. **The Results**: Specific, measurable outcomes with numbers

6. **Quote**: A powerful quote from the customer (based on testimonial or create realistic one)

7. **Conclusion**: 1-2 sentences on the long-term impact

Format as JSON:
{
  "title": "...",
  "hook": "...",
  "challenge": "...",
  "solution": "...",
  "results": "...",
  "quote": "...",
  "conclusion": "..."
}`;

    try {
      const response = await orchestrator.execute('content-generation', prompt);

      // Parse JSON from response
      const jsonMatch = response.content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in AI response');
      }

      const caseStudy = JSON.parse(jsonMatch[0]);

      return {
        ...caseStudy,
        metrics: userData.metrics,
        industry: userData.profile?.industry || 'Entrepreneurship',
        userProfile: {
          name: userData.profile?.name,
          title: userData.profile?.title,
          company: userData.profile?.company
        }
      };

    } catch (error) {
      console.error('AI generation failed:', error.message);
      return null;
    }
  }

  /**
   * Save case study to database
   */
  async saveCaseStudy(userId, caseStudy, userData) {
    const { data, error } = await this.supabase
      .from('case_studies')
      .insert({
        user_id: userId,
        title: caseStudy.title,
        industry: caseStudy.industry,
        problem: caseStudy.challenge,
        solution: caseStudy.solution,
        results: caseStudy.results,
        metrics: caseStudy.metrics,
        published: false,
        metadata: {
          hook: caseStudy.hook,
          quote: caseStudy.quote,
          conclusion: caseStudy.conclusion,
          userProfile: caseStudy.userProfile,
          generatedAt: new Date().toISOString()
        }
      })
      .select()
      .single();

    if (error) {
      console.error('Failed to save case study:', error);
      return null;
    }

    return data;
  }

  /**
   * Publish case study (make it public)
   */
  async publishCaseStudy(caseStudyId) {
    const { data, error } = await this.supabase
      .from('case_studies')
      .update({
        published: true,
        published_at: new Date().toISOString()
      })
      .eq('id', caseStudyId)
      .select()
      .single();

    if (error) {
      console.error('Failed to publish case study:', error);
      return null;
    }

    console.log(`✅ Case study published: ${data.title}`);

    return data;
  }

  /**
   * Get all published case studies
   */
  async getPublishedCaseStudies(limit = 10) {
    const { data } = await this.supabase
      .from('case_studies')
      .select('*')
      .eq('published', true)
      .order('published_at', { ascending: false })
      .limit(limit);

    return data || [];
  }

  /**
   * Track case study views
   */
  async trackView(caseStudyId) {
    await this.supabase.rpc('increment_case_study_views', {
      case_study_id: caseStudyId
    });
  }

  /**
   * Track conversions from case study
   */
  async trackConversion(caseStudyId, userId) {
    await this.supabase.rpc('increment_case_study_conversions', {
      case_study_id: caseStudyId
    });

    // Log the conversion
    await this.supabase
      .from('case_study_conversions')
      .insert({
        case_study_id: caseStudyId,
        converted_user_id: userId,
        converted_at: new Date().toISOString()
      });
  }

  /**
   * Get case study performance stats
   */
  async getCaseStudyStats(caseStudyId) {
    const { data } = await this.supabase
      .from('case_studies')
      .select('views, conversions, published_at')
      .eq('id', caseStudyId)
      .single();

    if (!data) return null;

    const conversionRate = data.views > 0
      ? ((data.conversions / data.views) * 100).toFixed(2)
      : 0;

    return {
      views: data.views,
      conversions: data.conversions,
      conversionRate: `${conversionRate}%`,
      publishedAt: data.published_at
    };
  }

  /**
   * Generate multiple case studies from successful users
   */
  async generateBatch(limit = 5) {
    console.log(`📝 Generating batch of ${limit} case studies...`);

    // Find users with testimonials who don't have case studies yet
    const { data: testimonials } = await this.supabase
      .from('testimonials')
      .select('user_id, id')
      .eq('approved', true)
      .limit(limit * 2); // Get more to filter

    if (!testimonials || testimonials.length === 0) {
      console.log('No approved testimonials found');
      return [];
    }

    const generated = [];

    for (const t of testimonials.slice(0, limit)) {
      // Check if case study already exists
      const { data: existing } = await this.supabase
        .from('case_studies')
        .select('id')
        .eq('user_id', t.user_id)
        .single();

      if (existing) {
        console.log(`  → Case study already exists for user ${t.user_id}`);
        continue;
      }

      // Generate case study
      const caseStudy = await this.generateCaseStudy(t.user_id, t.id);

      if (caseStudy) {
        generated.push(caseStudy);
        console.log(`  ✓ Generated: ${caseStudy.title}`);
      }

      // Rate limiting
      await this.sleep(3000);
    }

    console.log(`✅ Generated ${generated.length} case studies`);

    return generated;
  }

  /**
   * Helper: sleep
   */
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

module.exports = new CaseStudyGenerator();
