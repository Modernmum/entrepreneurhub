// ============================================================================
// PARTNER MANAGER SERVICE
// ============================================================================
// Handles multi-tenant operations, client provisioning, revenue tracking
// ============================================================================

const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

class PartnerManager {

  // ==========================================================================
  // TENANT MANAGEMENT
  // ==========================================================================

  /**
   * Get tenant by slug
   */
  async getTenant(slug) {
    const { data, error } = await supabase
      .from('tenants')
      .select('*')
      .eq('slug', slug)
      .single();

    if (error) throw new Error(`Failed to get tenant: ${error.message}`);
    return data;
  }

  /**
   * Get all tenants
   */
  async getAllTenants() {
    const { data, error } = await supabase
      .from('tenants')
      .select('*')
      .order('created_at', { ascending: true });

    if (error) throw new Error(`Failed to get tenants: ${error.message}`);
    return data;
  }

  /**
   * Get tenant stats (users, revenue, social proof)
   */
  async getTenantStats(tenantSlug) {
    const { data, error } = await supabase
      .rpc('get_tenant_stats', { tenant_slug: tenantSlug });

    if (error) throw new Error(`Failed to get stats: ${error.message}`);
    return data[0] || {
      total_users: 0,
      active_users: 0,
      paying_users: 0,
      mrr: 0,
      testimonials: 0,
      case_studies: 0
    };
  }

  // ==========================================================================
  // CLIENT PROVISIONING
  // ==========================================================================

  /**
   * Add client to tenant
   * Used by partners to onboard their clients
   */
  async provisionClient({
    tenantSlug,
    userEmail,
    userName,
    plan = 'free',
    source = 'partner'
  }) {
    // 1. Get tenant
    const tenant = await this.getTenant(tenantSlug);

    // 2. Check if user exists
    let { data: user } = await supabase
      .from('profiles')
      .select('*')
      .eq('email', userEmail)
      .single();

    // 3. Create user if doesn't exist
    if (!user) {
      const { data: newUser, error: createError } = await supabase
        .from('profiles')
        .insert({
          email: userEmail,
          name: userName,
          created_at: new Date().toISOString()
        })
        .select()
        .single();

      if (createError) throw new Error(`Failed to create user: ${createError.message}`);
      user = newUser;
    }

    // 4. Add user to tenant
    const planLimits = this._getPlanLimits(plan);

    const { data: tenantUser, error: tenantUserError } = await supabase
      .from('tenant_users')
      .insert({
        tenant_id: tenant.id,
        user_id: user.id,
        plan: plan,
        plan_limits: planLimits,
        source: source,
        status: 'active'
      })
      .select()
      .single();

    if (tenantUserError) {
      // Check if already exists
      if (tenantUserError.code === '23505') {
        throw new Error('User already exists in this tenant');
      }
      throw new Error(`Failed to add user to tenant: ${tenantUserError.message}`);
    }

    // 5. Log provisioning action
    await supabase.from('client_provisioning_log').insert({
      tenant_id: tenant.id,
      user_id: user.id,
      action: 'created',
      to_plan: plan,
      provisioned_by: 'partner'
    });

    // 6. Initialize usage tracking
    const currentMonth = new Date().toISOString().slice(0, 7); // '2025-11'
    await supabase.from('tenant_user_usage').insert({
      tenant_id: tenant.id,
      user_id: user.id,
      month: currentMonth,
      problems_solved: 0,
      limit: planLimits.problems_per_month
    });

    return {
      success: true,
      user: user,
      tenantUser: tenantUser,
      message: `Client ${userName} added to ${tenant.name}`
    };
  }

  /**
   * Bulk provision clients
   * Upload CSV of clients to onboard
   */
  async bulkProvisionClients(tenantSlug, clients) {
    const results = {
      success: [],
      failed: []
    };

    for (const client of clients) {
      try {
        const result = await this.provisionClient({
          tenantSlug,
          userEmail: client.email,
          userName: client.name,
          plan: client.plan || 'free',
          source: client.source || 'partner'
        });
        results.success.push(result);
      } catch (error) {
        results.failed.push({
          client,
          error: error.message
        });
      }
    }

    return results;
  }

  /**
   * Update client plan
   */
  async updateClientPlan(tenantSlug, userEmail, newPlan) {
    const tenant = await this.getTenant(tenantSlug);

    const { data: user } = await supabase
      .from('profiles')
      .select('*')
      .eq('email', userEmail)
      .single();

    if (!user) throw new Error('User not found');

    // Get current plan
    const { data: tenantUser } = await supabase
      .from('tenant_users')
      .select('*')
      .eq('tenant_id', tenant.id)
      .eq('user_id', user.id)
      .single();

    if (!tenantUser) throw new Error('User not in this tenant');

    const oldPlan = tenantUser.plan;
    const planLimits = this._getPlanLimits(newPlan);

    // Update plan
    await supabase
      .from('tenant_users')
      .update({
        plan: newPlan,
        plan_limits: planLimits,
        updated_at: new Date().toISOString()
      })
      .eq('tenant_id', tenant.id)
      .eq('user_id', user.id);

    // Log action
    await supabase.from('client_provisioning_log').insert({
      tenant_id: tenant.id,
      user_id: user.id,
      action: oldPlan === 'free' ? 'upgraded' : 'downgraded',
      from_plan: oldPlan,
      to_plan: newPlan,
      provisioned_by: 'partner'
    });

    return {
      success: true,
      message: `Plan updated from ${oldPlan} to ${newPlan}`
    };
  }

  // ==========================================================================
  // REVENUE TRACKING
  // ==========================================================================

  /**
   * Calculate monthly revenue for tenant
   */
  async calculateMonthlyRevenue(tenantSlug, month) {
    const tenant = await this.getTenant(tenantSlug);

    // Get all active paying users
    const { data: payingUsers } = await supabase
      .from('tenant_users')
      .select('plan')
      .eq('tenant_id', tenant.id)
      .eq('status', 'active')
      .neq('plan', 'free');

    // Calculate revenue
    let totalRevenue = 0;
    let revenueBreakdown = { starter: 0, growth: 0 };

    payingUsers.forEach(user => {
      if (user.plan === 'starter') {
        totalRevenue += 50;
        revenueBreakdown.starter += 50;
      } else if (user.plan === 'growth') {
        totalRevenue += 150;
        revenueBreakdown.growth += 150;
      }
    });

    // Calculate revenue share
    const partnerShare = (totalRevenue * tenant.revenue_share_percent) / 100;
    const unboundShare = totalRevenue - partnerShare;

    // Get user counts
    const { data: allUsers } = await supabase
      .from('tenant_users')
      .select('status')
      .eq('tenant_id', tenant.id);

    const activeUsers = allUsers.filter(u => u.status === 'active').length;

    // Save to database
    const { data: revenue, error } = await supabase
      .from('tenant_revenue')
      .upsert({
        tenant_id: tenant.id,
        month: month,
        total_revenue: totalRevenue,
        partner_share: partnerShare,
        unbound_share: unboundShare,
        revenue_breakdown: revenueBreakdown,
        active_users: activeUsers,
        paying_users: payingUsers.length,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'tenant_id,month'
      })
      .select()
      .single();

    if (error) throw new Error(`Failed to save revenue: ${error.message}`);

    return revenue;
  }

  /**
   * Get revenue share report for partner
   */
  async getRevenueShareReport(tenantSlug, startMonth, endMonth) {
    const tenant = await this.getTenant(tenantSlug);

    const { data: revenue } = await supabase
      .from('tenant_revenue')
      .select('*')
      .eq('tenant_id', tenant.id)
      .gte('month', startMonth)
      .lte('month', endMonth)
      .order('month', { ascending: true });

    const summary = {
      tenant: tenant.name,
      period: `${startMonth} to ${endMonth}`,
      total_revenue: 0,
      partner_share: 0,
      unbound_share: 0,
      months: revenue
    };

    revenue.forEach(r => {
      summary.total_revenue += parseFloat(r.total_revenue);
      summary.partner_share += parseFloat(r.partner_share);
      summary.unbound_share += parseFloat(r.unbound_share);
    });

    return summary;
  }

  // ==========================================================================
  // SOCIAL PROOF
  // ==========================================================================

  /**
   * Add testimonial
   */
  async addTestimonial({
    tenantSlug,
    userEmail,
    quote,
    rating,
    clientName,
    clientBusiness,
    clientTitle,
    solutionType,
    results = {}
  }) {
    const tenant = await this.getTenant(tenantSlug);

    const { data: user } = await supabase
      .from('profiles')
      .select('*')
      .eq('email', userEmail)
      .single();

    if (!user) throw new Error('User not found');

    const { data: testimonial, error } = await supabase
      .from('social_proof')
      .insert({
        user_id: user.id,
        tenant_id: tenant.id,
        type: 'testimonial',
        quote: quote,
        rating: rating,
        client_name: clientName,
        client_business: clientBusiness,
        client_title: clientTitle,
        solution_type: solutionType,
        results: results,
        client_approved: true,
        published: false // Review before publishing
      })
      .select()
      .single();

    if (error) throw new Error(`Failed to add testimonial: ${error.message}`);

    return testimonial;
  }

  /**
   * Get social proof for tenant
   */
  async getSocialProof(tenantSlug, type = null, publishedOnly = true) {
    const tenant = await this.getTenant(tenantSlug);

    let query = supabase
      .from('social_proof')
      .select('*')
      .eq('tenant_id', tenant.id);

    if (type) {
      query = query.eq('type', type);
    }

    if (publishedOnly) {
      query = query.eq('published', true);
    }

    query = query.order('created_at', { ascending: false });

    const { data, error } = await query;

    if (error) throw new Error(`Failed to get social proof: ${error.message}`);

    return data;
  }

  // ==========================================================================
  // USAGE TRACKING
  // ==========================================================================

  /**
   * Track solution usage
   */
  async trackUsage(userEmail, tenantSlug, solutionType) {
    const tenant = await this.getTenant(tenantSlug);

    const { data: user } = await supabase
      .from('profiles')
      .select('*')
      .eq('email', userEmail)
      .single();

    if (!user) throw new Error('User not found');

    const currentMonth = new Date().toISOString().slice(0, 7);

    // Get or create usage record
    let { data: usage } = await supabase
      .from('tenant_user_usage')
      .select('*')
      .eq('tenant_id', tenant.id)
      .eq('user_id', user.id)
      .eq('month', currentMonth)
      .single();

    if (!usage) {
      // Create new usage record
      const { data: tenantUser } = await supabase
        .from('tenant_users')
        .select('plan_limits')
        .eq('tenant_id', tenant.id)
        .eq('user_id', user.id)
        .single();

      const { data: newUsage } = await supabase
        .from('tenant_user_usage')
        .insert({
          tenant_id: tenant.id,
          user_id: user.id,
          month: currentMonth,
          problems_solved: 0,
          limit: tenantUser.plan_limits.problems_per_month
        })
        .select()
        .single();

      usage = newUsage;
    }

    // Check if limit reached
    if (usage.problems_solved >= usage.limit && usage.limit !== -1) {
      throw new Error('Monthly limit reached. Please upgrade your plan.');
    }

    // Increment usage
    const updates = {
      problems_solved: usage.problems_solved + 1
    };

    // Track solution-specific usage
    const solutionField = `${solutionType.replace('-', '_')}_count`;
    updates[solutionField] = (usage[solutionField] || 0) + 1;

    // Check if limit reached after increment
    if (updates.problems_solved >= usage.limit && usage.limit !== -1) {
      updates.limit_reached = true;
      updates.limit_reached_at = new Date().toISOString();
    }

    await supabase
      .from('tenant_user_usage')
      .update(updates)
      .eq('id', usage.id);

    return {
      success: true,
      usage: updates.problems_solved,
      limit: usage.limit,
      remaining: usage.limit === -1 ? 'unlimited' : usage.limit - updates.problems_solved
    };
  }

  // ==========================================================================
  // HELPER METHODS
  // ==========================================================================

  _getPlanLimits(plan) {
    const limits = {
      free: { problems_per_month: 1 },
      starter: { problems_per_month: 5 },
      growth: { problems_per_month: -1 } // Unlimited
    };

    return limits[plan] || limits.free;
  }
}

module.exports = new PartnerManager();
