// Referral Tracking System - Track word-of-mouth growth
// Monitors who refers who, conversion rates, and rewards

const { createClient } = require('@supabase/supabase-js');
const crypto = require('crypto');
require('dotenv').config();

class ReferralTracker {
  constructor() {
    this.supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_KEY
    );

    // Referral reward tiers
    this.rewards = {
      signup: {
        referrer: 10, // $10 credit for each signup
        referee: 5    // $5 credit for signing up
      },
      firstPurchase: {
        referrer: 20, // $20 credit when referee makes first purchase
        commission: 0.20 // 20% recurring commission
      },
      blogger: {
        perPost: 50,        // $50 for blog post about us
        perConversion: 30,  // $30 per conversion from their audience
        recurringCommission: 0.30 // 30% recurring for bloggers
      }
    };

    // Viral coefficient target: >1.0 (each user brings 1+ more users)
    this.viralCoefficientTarget = 1.0;
  }

  /**
   * Generate unique referral code for a user
   */
  async generateReferralCode(userId, userEmail) {
    // Create short, memorable code from email + random
    const emailPrefix = userEmail.split('@')[0].substring(0, 4);
    const randomSuffix = crypto.randomBytes(2).toString('hex');
    const referralCode = `${emailPrefix}-${randomSuffix}`.toLowerCase();

    // Save to database
    const { data, error } = await this.supabase
      .from('referral_codes')
      .insert({
        user_id: userId,
        referral_code: referralCode,
        created_at: new Date().toISOString(),
        active: true
      })
      .select()
      .single();

    if (error) {
      console.error('Failed to create referral code:', error);
      return null;
    }

    return {
      code: referralCode,
      referralLink: `https://unbound.team?ref=${referralCode}`,
      shareableMessage: this.getShareableMessage(referralCode)
    };
  }

  /**
   * Get shareable referral message
   */
  getShareableMessage(referralCode) {
    return `Check out Unbound.team - an AI team that solves entrepreneur problems 24/7.

Use my code "${referralCode}" to get $5 credit when you sign up!

https://unbound.team?ref=${referralCode}`;
  }

  /**
   * Track referral signup
   */
  async trackSignup(referralCode, newUserId, newUserEmail) {
    // Find referrer
    const { data: referralData } = await this.supabase
      .from('referral_codes')
      .select('user_id')
      .eq('referral_code', referralCode)
      .eq('active', true)
      .single();

    if (!referralData) {
      console.log('Invalid or inactive referral code');
      return null;
    }

    const referrerId = referralData.user_id;

    // Create referral record
    const { data: referral, error } = await this.supabase
      .from('referrals')
      .insert({
        referrer_id: referrerId,
        referee_id: newUserId,
        referral_code: referralCode,
        status: 'signed_up',
        referred_at: new Date().toISOString(),
        referee_email: newUserEmail
      })
      .select()
      .single();

    if (error) {
      console.error('Failed to track referral:', error);
      return null;
    }

    // Award credits
    await this.awardSignupCredits(referrerId, newUserId);

    // Send notification
    await this.notifyReferralSuccess(referrerId, newUserEmail);

    return referral;
  }

  /**
   * Award signup credits to both referrer and referee
   */
  async awardSignupCredits(referrerId, refereeId) {
    // Award referrer
    await this.supabase
      .from('user_credits')
      .insert({
        user_id: referrerId,
        amount: this.rewards.signup.referrer,
        type: 'referral_signup',
        description: 'Referral signup bonus',
        created_at: new Date().toISOString()
      });

    // Award referee
    await this.supabase
      .from('user_credits')
      .insert({
        user_id: refereeId,
        amount: this.rewards.signup.referee,
        type: 'signup_bonus',
        description: 'Welcome bonus for using referral code',
        created_at: new Date().toISOString()
      });

    console.log(`✅ Awarded signup credits: $${this.rewards.signup.referrer} to referrer, $${this.rewards.signup.referee} to referee`);
  }

  /**
   * Track first purchase from referred user
   */
  async trackFirstPurchase(userId, amount) {
    // Find if this user was referred
    const { data: referral } = await this.supabase
      .from('referrals')
      .select('*')
      .eq('referee_id', userId)
      .eq('status', 'signed_up')
      .single();

    if (!referral) {
      return null; // Not a referred user
    }

    // Update referral status
    await this.supabase
      .from('referrals')
      .update({
        status: 'converted',
        converted_at: new Date().toISOString(),
        first_purchase_amount: amount
      })
      .eq('id', referral.id);

    // Award first purchase bonus
    await this.supabase
      .from('user_credits')
      .insert({
        user_id: referral.referrer_id,
        amount: this.rewards.firstPurchase.referrer,
        type: 'referral_conversion',
        description: `Referral converted - first purchase $${amount}`,
        created_at: new Date().toISOString()
      });

    console.log(`✅ Referral converted! Awarded $${this.rewards.firstPurchase.referrer} to referrer`);

    return referral;
  }

  /**
   * Track recurring commission for referrals
   */
  async trackRecurringCommission(userId, purchaseAmount, isBloggerReferral = false) {
    // Find if this user was referred
    const { data: referral } = await this.supabase
      .from('referrals')
      .select('*')
      .eq('referee_id', userId)
      .eq('status', 'converted')
      .single();

    if (!referral) return null;

    // Calculate commission
    const commissionRate = isBloggerReferral
      ? this.rewards.blogger.recurringCommission
      : this.rewards.firstPurchase.commission;

    const commissionAmount = purchaseAmount * commissionRate;

    // Award commission
    await this.supabase
      .from('user_credits')
      .insert({
        user_id: referral.referrer_id,
        amount: commissionAmount,
        type: 'recurring_commission',
        description: `${Math.round(commissionRate * 100)}% commission on $${purchaseAmount} purchase`,
        created_at: new Date().toISOString(),
        metadata: {
          purchase_amount: purchaseAmount,
          commission_rate: commissionRate,
          referee_id: userId
        }
      });

    console.log(`✅ Recurring commission: $${commissionAmount.toFixed(2)} to referrer`);

    return {
      referrerId: referral.referrer_id,
      amount: commissionAmount,
      rate: commissionRate
    };
  }

  /**
   * Register blogger partnership
   */
  async registerBlogger(userId, blogUrl, audienceSize, niche) {
    const { data, error } = await this.supabase
      .from('blogger_partnerships')
      .insert({
        user_id: userId,
        blog_url: blogUrl,
        audience_size: audienceSize,
        niche,
        status: 'active',
        joined_at: new Date().toISOString(),
        total_posts: 0,
        total_conversions: 0,
        total_commission: 0
      })
      .select()
      .single();

    if (error) {
      console.error('Failed to register blogger:', error);
      return null;
    }

    // Generate special blogger referral code
    const bloggerCode = await this.generateReferralCode(userId, `blogger-${userId}`);

    console.log(`✅ Registered blogger: ${blogUrl} (${audienceSize} audience)`);

    return {
      partnership: data,
      referralCode: bloggerCode
    };
  }

  /**
   * Track blog post about Unbound.team
   */
  async trackBlogPost(bloggerId, postUrl, postTitle) {
    // Award blog post bonus
    await this.supabase
      .from('user_credits')
      .insert({
        user_id: bloggerId,
        amount: this.rewards.blogger.perPost,
        type: 'blog_post',
        description: `Blog post: ${postTitle}`,
        created_at: new Date().toISOString(),
        metadata: {
          post_url: postUrl,
          post_title: postTitle
        }
      });

    // Update blogger stats
    await this.supabase.rpc('increment_blogger_posts', {
      blogger_user_id: bloggerId
    });

    console.log(`✅ Blog post tracked: $${this.rewards.blogger.perPost} awarded`);

    return {
      bonus: this.rewards.blogger.perPost,
      postUrl
    };
  }

  /**
   * Get referral statistics for a user
   */
  async getReferralStats(userId) {
    // Get all referrals
    const { data: referrals } = await this.supabase
      .from('referrals')
      .select('*')
      .eq('referrer_id', userId);

    // Get total credits earned
    const { data: credits } = await this.supabase
      .from('user_credits')
      .select('amount, type')
      .eq('user_id', userId)
      .in('type', ['referral_signup', 'referral_conversion', 'recurring_commission', 'blog_post']);

    const stats = {
      totalReferrals: referrals?.length || 0,
      signedUp: referrals?.filter(r => r.status === 'signed_up').length || 0,
      converted: referrals?.filter(r => r.status === 'converted').length || 0,
      conversionRate: 0,
      totalEarnings: 0,
      breakdown: {
        signupBonuses: 0,
        conversionBonuses: 0,
        recurringCommissions: 0,
        blogPostBonuses: 0
      }
    };

    if (stats.totalReferrals > 0) {
      stats.conversionRate = (stats.converted / stats.totalReferrals * 100).toFixed(1);
    }

    if (credits) {
      credits.forEach(c => {
        stats.totalEarnings += c.amount;

        switch(c.type) {
          case 'referral_signup':
            stats.breakdown.signupBonuses += c.amount;
            break;
          case 'referral_conversion':
            stats.breakdown.conversionBonuses += c.amount;
            break;
          case 'recurring_commission':
            stats.breakdown.recurringCommissions += c.amount;
            break;
          case 'blog_post':
            stats.breakdown.blogPostBonuses += c.amount;
            break;
        }
      });
    }

    return stats;
  }

  /**
   * Calculate viral coefficient
   */
  async calculateViralCoefficient() {
    // Viral Coefficient = (# of invites sent × conversion rate) / # of users

    const { count: totalUsers } = await this.supabase
      .from('users')
      .select('*', { count: 'exact', head: true });

    const { data: referrals } = await this.supabase
      .from('referrals')
      .select('status');

    if (!totalUsers || !referrals || totalUsers === 0) {
      return 0;
    }

    const converted = referrals.filter(r => r.status === 'converted').length;
    const viralCoefficient = converted / totalUsers;

    return {
      coefficient: viralCoefficient.toFixed(2),
      target: this.viralCoefficientTarget,
      status: viralCoefficient >= this.viralCoefficientTarget ? 'viral' : 'growing',
      totalUsers,
      totalReferrals: referrals.length,
      conversions: converted
    };
  }

  /**
   * Send notification about referral success
   */
  async notifyReferralSuccess(referrerId, refereeEmail) {
    // TODO: Send email/Discord notification
    console.log(`📧 Notifying user ${referrerId} about new referral: ${refereeEmail}`);
  }

  /**
   * Get leaderboard of top referrers
   */
  async getLeaderboard(limit = 10) {
    const { data } = await this.supabase
      .from('referrals')
      .select('referrer_id')
      .eq('status', 'converted');

    if (!data) return [];

    // Count conversions per referrer
    const counts = {};
    data.forEach(r => {
      counts[r.referrer_id] = (counts[r.referrer_id] || 0) + 1;
    });

    // Sort by count
    const leaderboard = Object.entries(counts)
      .map(([userId, count]) => ({ userId, conversions: count }))
      .sort((a, b) => b.conversions - a.conversions)
      .slice(0, limit);

    return leaderboard;
  }
}

module.exports = new ReferralTracker();
