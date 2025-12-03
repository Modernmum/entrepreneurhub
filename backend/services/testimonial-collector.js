// Testimonial Collector - Automatically collect and curate user testimonials
// Requests feedback at the right time and formats for maximum impact

const { createClient } = require('@supabase/supabase-js');
const orchestrator = require('./ai-orchestrator');
const notifications = require('./notifications');
require('dotenv').config();

class TestimonialCollector {
  constructor() {
    this.supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_KEY
    );

    // When to ask for testimonials
    this.triggers = {
      afterSuccessfulSolution: true,  // Ask after completing a solution
      after3Solutions: true,           // Ask after 3 successful solutions
      highSatisfaction: true,          // Ask when user rates 5/5
      referralMade: true              // Ask after they refer someone
    };

    // Rating thresholds
    this.minRatingForTestimonial = 4; // Only ask if 4+ stars
  }

  /**
   * Check if we should request testimonial from user
   */
  async shouldRequestTestimonial(userId, context = {}) {
    // Check if already has testimonial
    const { data: existing } = await this.supabase
      .from('testimonials')
      .select('id')
      .eq('user_id', userId)
      .single();

    if (existing) {
      return false; // Already have testimonial
    }

    // Check user's solution history
    const { data: solutions } = await this.supabase
      .from('solution_results')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'completed');

    const solutionCount = solutions?.length || 0;

    // Triggers
    if (context.justCompletedSolution && this.triggers.afterSuccessfulSolution) {
      if (context.satisfaction >= this.minRatingForTestimonial) {
        return true;
      }
    }

    if (solutionCount >= 3 && this.triggers.after3Solutions) {
      return true;
    }

    if (context.madeReferral && this.triggers.referralMade) {
      return true;
    }

    return false;
  }

  /**
   * Request testimonial from user
   */
  async requestTestimonial(userId, context = {}) {
    const shouldRequest = await this.shouldRequestTestimonial(userId, context);

    if (!shouldRequest) {
      console.log(`Not requesting testimonial from user ${userId} at this time`);
      return null;
    }

    // Create testimonial request
    const { data, error } = await this.supabase
      .from('testimonial_requests')
      .insert({
        user_id: userId,
        requested_at: new Date().toISOString(),
        status: 'pending',
        context: context,
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7 days
      })
      .select()
      .single();

    if (error) {
      console.error('Failed to create testimonial request:', error);
      return null;
    }

    // Send notification (email or Discord)
    await this.sendTestimonialRequest(userId, data.id);

    console.log(`✅ Testimonial requested from user ${userId}`);

    return data;
  }

  /**
   * Send testimonial request notification
   */
  async sendTestimonialRequest(userId, requestId) {
    // Generate personalized request message
    const message = `Hi! We'd love to hear about your experience with Unbound.team.

Your feedback helps other entrepreneurs discover how AI can solve their problems.

Could you share:
1. What problem were you trying to solve?
2. How did Unbound.team help?
3. What results did you achieve?

This will only take 2 minutes and you'll get $10 credit as a thank you!

Share your story: https://unbound.team/testimonial/${requestId}`;

    // In production, send email here
    console.log(`📧 Testimonial request sent to user ${userId}`);

    return message;
  }

  /**
   * Submit testimonial from user
   */
  async submitTestimonial(userId, testimonialData) {
    const {
      testimonialText,
      rating,
      problemSolved,
      resultsAchieved,
      userName,
      userTitle
    } = testimonialData;

    // Validate
    if (!testimonialText || testimonialText.length < 20) {
      return { error: 'Testimonial text must be at least 20 characters' };
    }

    if (!rating || rating < 1 || rating > 5) {
      return { error: 'Rating must be between 1 and 5' };
    }

    // Save testimonial
    const { data, error } = await this.supabase
      .from('testimonials')
      .insert({
        user_id: userId,
        user_name: userName,
        user_title: userTitle,
        testimonial_text: testimonialText,
        rating,
        problem_solved: problemSolved,
        results_achieved: resultsAchieved,
        approved: rating >= this.minRatingForTestimonial, // Auto-approve if 4+ stars
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      console.error('Failed to save testimonial:', error);
      return { error: 'Failed to save testimonial' };
    }

    // Award credit for submitting testimonial
    await this.awardTestimonialCredit(userId);

    // Mark request as completed
    await this.supabase
      .from('testimonial_requests')
      .update({ status: 'completed' })
      .eq('user_id', userId);

    console.log(`✅ Testimonial submitted by user ${userId} (${rating}/5)`);

    return { success: true, testimonial: data };
  }

  /**
   * Award credit for submitting testimonial
   */
  async awardTestimonialCredit(userId) {
    await this.supabase
      .from('user_credits')
      .insert({
        user_id: userId,
        amount: 10,
        type: 'testimonial_bonus',
        description: 'Thank you for sharing your testimonial!',
        created_at: new Date().toISOString()
      });

    console.log(`  ✓ Awarded $10 credit to user ${userId}`);
  }

  /**
   * Approve testimonial (for admin review)
   */
  async approveTestimonial(testimonialId) {
    const { data, error } = await this.supabase
      .from('testimonials')
      .update({ approved: true })
      .eq('id', testimonialId)
      .select()
      .single();

    if (error) {
      console.error('Failed to approve testimonial:', error);
      return null;
    }

    console.log(`✅ Testimonial approved: ${testimonialId}`);

    return data;
  }

  /**
   * Feature testimonial (highlight on homepage)
   */
  async featureTestimonial(testimonialId) {
    const { data, error } = await this.supabase
      .from('testimonials')
      .update({ featured: true })
      .eq('id', testimonialId)
      .select()
      .single();

    if (error) {
      console.error('Failed to feature testimonial:', error);
      return null;
    }

    console.log(`✅ Testimonial featured: ${testimonialId}`);

    return data;
  }

  /**
   * Get featured testimonials
   */
  async getFeaturedTestimonials(limit = 5) {
    const { data } = await this.supabase
      .from('testimonials')
      .select('*')
      .eq('approved', true)
      .eq('featured', true)
      .order('created_at', { ascending: false })
      .limit(limit);

    return data || [];
  }

  /**
   * Get all approved testimonials
   */
  async getApprovedTestimonials(limit = 20) {
    const { data } = await this.supabase
      .from('testimonials')
      .select('*')
      .eq('approved', true)
      .order('rating', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(limit);

    return data || [];
  }

  /**
   * Get testimonials pending approval
   */
  async getPendingTestimonials() {
    const { data } = await this.supabase
      .from('testimonials')
      .select('*')
      .eq('approved', false)
      .order('created_at', { ascending: false });

    return data || [];
  }

  /**
   * Generate formatted testimonial for display
   */
  formatTestimonial(testimonial) {
    const stars = '⭐'.repeat(testimonial.rating);

    return {
      id: testimonial.id,
      name: testimonial.user_name || 'Anonymous',
      title: testimonial.user_title || 'Entrepreneur',
      text: testimonial.testimonial_text,
      rating: testimonial.rating,
      stars,
      problemSolved: testimonial.problem_solved,
      results: testimonial.results_achieved,
      date: new Date(testimonial.created_at).toLocaleDateString(),
      featured: testimonial.featured
    };
  }

  /**
   * Get testimonial statistics
   */
  async getStats() {
    const { data: all } = await this.supabase
      .from('testimonials')
      .select('rating, approved, featured');

    if (!all || all.length === 0) {
      return {
        total: 0,
        approved: 0,
        featured: 0,
        averageRating: 0,
        ratingBreakdown: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }
      };
    }

    const stats = {
      total: all.length,
      approved: all.filter(t => t.approved).length,
      featured: all.filter(t => t.featured).length,
      averageRating: 0,
      ratingBreakdown: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }
    };

    // Calculate average
    const totalRating = all.reduce((sum, t) => sum + t.rating, 0);
    stats.averageRating = (totalRating / all.length).toFixed(1);

    // Rating breakdown
    all.forEach(t => {
      if (t.rating >= 1 && t.rating <= 5) {
        stats.ratingBreakdown[t.rating]++;
      }
    });

    return stats;
  }

  /**
   * Auto-collect testimonials from successful users
   */
  async autoCollect(limit = 10) {
    console.log(`🎯 Auto-collecting testimonials from successful users...`);

    // Find users with successful solutions but no testimonials
    const { data: candidates } = await this.supabase
      .from('solution_results')
      .select('user_id')
      .eq('status', 'completed')
      .order('completed_at', { ascending: false })
      .limit(limit * 2);

    if (!candidates || candidates.length === 0) {
      console.log('No candidates found');
      return [];
    }

    const requested = [];

    for (const candidate of candidates) {
      const shouldRequest = await this.shouldRequestTestimonial(candidate.user_id, {
        justCompletedSolution: true,
        satisfaction: 5
      });

      if (shouldRequest) {
        const request = await this.requestTestimonial(candidate.user_id);
        if (request) {
          requested.push(request);
        }
      }

      if (requested.length >= limit) break;
    }

    console.log(`✅ Sent ${requested.length} testimonial requests`);

    return requested;
  }
}

module.exports = new TestimonialCollector();
