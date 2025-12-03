// ============================================================================
// TENANT IDENTIFIER SERVICE
// ============================================================================
// Automatically identifies which tenant a client belongs to based on:
// - Login domain (maggieforbes.unboundteam.app vs app.unboundteam.com)
// - Email domain (@maggieforbes.com → Maggie Forbes tenant)
// - Referral codes
// - API keys
// - Manual assignment
// ============================================================================

const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

class TenantIdentifier {

  // ==========================================================================
  // AUTOMATIC TENANT DETECTION
  // ==========================================================================

  /**
   * Identify tenant from request
   * Checks multiple sources in priority order
   */
  async identifyTenant(req) {
    // Priority 1: Subdomain (tools.maggieforbes.com, app.unboundteam.com)
    const tenantFromDomain = await this.identifyFromDomain(req.hostname);
    if (tenantFromDomain) return tenantFromDomain;

    // Priority 2: API key (for backend automation)
    const apiKey = req.headers['x-api-key'] || req.query.api_key;
    if (apiKey) {
      const tenantFromApiKey = await this.identifyFromApiKey(apiKey);
      if (tenantFromApiKey) return tenantFromApiKey;
    }

    // Priority 3: User session (already logged in)
    const user = req.user; // Assuming auth middleware adds user to req
    if (user) {
      const tenantFromUser = await this.identifyFromUser(user.email);
      if (tenantFromUser) return tenantFromUser;
    }

    // Priority 4: Email domain (signup flow)
    const email = req.body.email || req.query.email;
    if (email) {
      const tenantFromEmail = await this.identifyFromEmailDomain(email);
      if (tenantFromEmail) return tenantFromEmail;
    }

    // Priority 5: Referral code
    const referralCode = req.query.ref || req.body.referral_code;
    if (referralCode) {
      const tenantFromReferral = await this.identifyFromReferralCode(referralCode);
      if (tenantFromReferral) return tenantFromReferral;
    }

    // Default: Unbound.team main tenant
    return await this.getTenant('unbound-team');
  }

  // ==========================================================================
  // IDENTIFICATION METHODS
  // ==========================================================================

  /**
   * Identify tenant from domain/subdomain
   *
   * Examples:
   * - tools.maggieforbes.com → Maggie Forbes tenant
   * - platform.growthmanagerpro.com → Growth Manager Pro tenant
   * - app.unboundteam.com → Unbound.team tenant
   * - maggieforbes.unboundteam.app → Maggie Forbes tenant
   */
  async identifyFromDomain(hostname) {
    if (!hostname) return null;

    // Subdomain mapping
    const domainMap = {
      // Custom domains
      'tools.maggieforbes.com': 'maggie-forbes',
      'platform.growthmanagerpro.com': 'growth-manager-pro',
      'app.unboundteam.com': 'unbound-team',

      // Subdomains on unboundteam.app
      'maggieforbes.unboundteam.app': 'maggie-forbes',
      'growthmanagerpro.unboundteam.app': 'growth-manager-pro',
      'app.unboundteam.app': 'unbound-team'
    };

    const tenantSlug = domainMap[hostname];
    if (!tenantSlug) return null;

    return await this.getTenant(tenantSlug);
  }

  /**
   * Identify tenant from email domain
   *
   * Examples:
   * - user@maggieforbes.com → Maggie Forbes tenant
   * - user@growthmanagerpro.com → Growth Manager Pro tenant
   * - anyone else → Unbound.team tenant
   */
  async identifyFromEmailDomain(email) {
    if (!email) return null;

    const domain = email.split('@')[1]?.toLowerCase();
    if (!domain) return null;

    const emailDomainMap = {
      'maggieforbes.com': 'maggie-forbes',
      'growthmanagerpro.com': 'growth-manager-pro'
    };

    const tenantSlug = emailDomainMap[domain];
    if (!tenantSlug) {
      // Default to Unbound.team for external emails
      return await this.getTenant('unbound-team');
    }

    return await this.getTenant(tenantSlug);
  }

  /**
   * Identify tenant from user (already assigned)
   */
  async identifyFromUser(userEmail) {
    const { data: user } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', userEmail)
      .single();

    if (!user) return null;

    // Get user's tenant assignment
    const { data: tenantUser } = await supabase
      .from('tenant_users')
      .select('tenant_id, tenants(*)')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .single();

    if (!tenantUser) return null;

    return tenantUser.tenants;
  }

  /**
   * Identify tenant from API key
   *
   * API keys are generated per tenant for backend automation
   * Format: mfs_live_abc123 (Maggie Forbes)
   *         gmp_live_xyz789 (Growth Manager Pro)
   *         ubt_live_def456 (Unbound.team)
   */
  async identifyFromApiKey(apiKey) {
    if (!apiKey) return null;

    // Extract tenant prefix
    const prefix = apiKey.split('_')[0];

    const apiKeyPrefixMap = {
      'mfs': 'maggie-forbes',
      'gmp': 'growth-manager-pro',
      'ubt': 'unbound-team'
    };

    const tenantSlug = apiKeyPrefixMap[prefix];
    if (!tenantSlug) return null;

    // Verify API key is valid (you'd check against stored keys)
    // For now, just return tenant
    return await this.getTenant(tenantSlug);
  }

  /**
   * Identify tenant from referral code
   *
   * Referral codes format: MFS-ABC123, GMP-XYZ789
   */
  async identifyFromReferralCode(referralCode) {
    if (!referralCode) return null;

    const prefix = referralCode.split('-')[0]?.toUpperCase();

    const referralPrefixMap = {
      'MFS': 'maggie-forbes',
      'GMP': 'growth-manager-pro',
      'UBT': 'unbound-team'
    };

    const tenantSlug = referralPrefixMap[prefix];
    if (!tenantSlug) return null;

    return await this.getTenant(tenantSlug);
  }

  // ==========================================================================
  // TENANT ASSIGNMENT
  // ==========================================================================

  /**
   * Auto-assign user to tenant on signup
   */
  async autoAssignTenant(userEmail, detectionSource, plan = 'free') {
    // Detect tenant
    const tenant = await this.identifyFromEmailDomain(userEmail);
    if (!tenant) {
      throw new Error('Could not identify tenant for user');
    }

    // Check if user exists
    let { data: user } = await supabase
      .from('profiles')
      .select('*')
      .eq('email', userEmail)
      .single();

    if (!user) {
      throw new Error('User profile not found');
    }

    // Check if already assigned to this tenant
    const { data: existingAssignment } = await supabase
      .from('tenant_users')
      .select('*')
      .eq('tenant_id', tenant.id)
      .eq('user_id', user.id)
      .single();

    if (existingAssignment) {
      return {
        success: true,
        tenant: tenant,
        message: 'User already assigned to this tenant',
        existing: true
      };
    }

    // Assign to tenant
    const planLimits = this._getPlanLimits(plan);

    await supabase
      .from('tenant_users')
      .insert({
        tenant_id: tenant.id,
        user_id: user.id,
        plan: plan,
        plan_limits: planLimits,
        source: detectionSource, // 'email-domain', 'referral', 'manual', etc.
        status: 'active'
      });

    // Log provisioning
    await supabase.from('client_provisioning_log').insert({
      tenant_id: tenant.id,
      user_id: user.id,
      action: 'created',
      to_plan: plan,
      provisioned_by: 'auto-detection'
    });

    // Initialize usage tracking
    const currentMonth = new Date().toISOString().slice(0, 7);
    await supabase.from('tenant_user_usage').insert({
      tenant_id: tenant.id,
      user_id: user.id,
      month: currentMonth,
      problems_solved: 0,
      limit: planLimits.problems_per_month
    });

    return {
      success: true,
      tenant: tenant,
      message: `User auto-assigned to ${tenant.name}`,
      existing: false
    };
  }

  /**
   * Get tenant branding for white-label UI
   */
  async getTenantBranding(tenantSlug) {
    const tenant = await this.getTenant(tenantSlug);

    return {
      name: tenant.name,
      logo: tenant.branding.logo,
      colors: tenant.branding.colors,
      tagline: tenant.branding.tagline,
      domain: tenant.domain || tenant.subdomain
    };
  }

  // ==========================================================================
  // MIDDLEWARE FOR EXPRESS
  // ==========================================================================

  /**
   * Express middleware to auto-detect and attach tenant to request
   *
   * Usage:
   * app.use(tenantIdentifier.middleware());
   */
  middleware() {
    return async (req, res, next) => {
      try {
        const tenant = await this.identifyTenant(req);
        req.tenant = tenant; // Attach tenant to request

        // Also attach branding for rendering
        if (tenant) {
          req.tenantBranding = await this.getTenantBranding(tenant.slug);
        }

        next();
      } catch (error) {
        console.error('Tenant identification error:', error);
        // Continue without tenant (will use default)
        next();
      }
    };
  }

  /**
   * Check if user has access to specific tenant
   */
  async checkTenantAccess(userEmail, tenantSlug) {
    const { data: user } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', userEmail)
      .single();

    if (!user) return false;

    const tenant = await this.getTenant(tenantSlug);
    if (!tenant) return false;

    const { data: tenantUser } = await supabase
      .from('tenant_users')
      .select('*')
      .eq('tenant_id', tenant.id)
      .eq('user_id', user.id)
      .eq('status', 'active')
      .single();

    return !!tenantUser;
  }

  // ==========================================================================
  // HELPER METHODS
  // ==========================================================================

  async getTenant(slug) {
    const { data, error } = await supabase
      .from('tenants')
      .select('*')
      .eq('slug', slug)
      .single();

    if (error) return null;
    return data;
  }

  _getPlanLimits(plan) {
    const limits = {
      free: { problems_per_month: 1 },
      starter: { problems_per_month: 5 },
      growth: { problems_per_month: -1 }, // Unlimited
      consulting: { problems_per_month: -1 } // Unlimited for consulting clients
    };

    return limits[plan] || limits.free;
  }
}

module.exports = new TenantIdentifier();
