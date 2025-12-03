/**
 * GMP Sync Service
 * Pushes Unbound.team data to Growth Manager Pro dashboard
 *
 * Architecture:
 * Unbound.team (backend) → GMP REST API → GMP PostgreSQL → Client Dashboard
 *
 * Integration Points:
 * 1. Leads → POST /api/contacts
 * 2. Content → POST /api/campaigns (or custom table)
 * 3. Research → POST /api/deals (with notes) or custom table
 * 4. Tasks → POST /api/sprints/action-items
 */

const fetch = require('node-fetch');

class GMPSync {
  constructor() {
    this.gmpApiUrl = process.env.GMP_API_URL || 'https://growthmanagerpro.com';
    this.gmpApiKey = process.env.GMP_API_KEY;

    if (!this.gmpApiKey) {
      console.warn('[GMP Sync] WARNING: GMP_API_KEY not set. Sync will not work.');
    }
  }

  /**
   * Push leads to GMP contacts table
   * @param {Array} leads - Array of lead objects from Unbound.team
   * @param {String} clientTenantId - GMP tenant ID for the client
   * @returns {Object} Sync result with success count
   */
  async pushLeads(leads, clientTenantId) {
    console.log(`[GMP Sync] Pushing ${leads.length} leads to GMP tenant: ${clientTenantId}`);

    const results = {
      total: leads.length,
      successful: 0,
      failed: 0,
      errors: []
    };

    for (const lead of leads) {
      try {
        const response = await fetch(`${this.gmpApiUrl}/api/contacts`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-tenant-id': clientTenantId,
            'Authorization': `Bearer ${this.gmpApiKey}`
          },
          body: JSON.stringify({
            name: lead.name || lead.fullName,
            email: lead.email,
            phone: lead.phone || null,
            company: lead.company || lead.businessName,
            title: lead.title || lead.role,
            industry: lead.industry,
            linkedin_url: lead.linkedinUrl || lead.linkedin,
            website: lead.website,
            stage: 'new', // GMP uses: new, qualified, contacted, etc.
            source: 'AI Lead Generation',
            notes: this.formatLeadNotes(lead),
            tags: lead.tags || ['ai-generated', 'unbound-team']
          })
        });

        const data = await response.json();

        if (data.success) {
          results.successful++;
          console.log(`[GMP Sync] ✅ Lead synced: ${lead.email}`);
        } else {
          results.failed++;
          results.errors.push({
            lead: lead.email,
            error: data.error
          });
          console.error(`[GMP Sync] ❌ Failed to sync lead: ${lead.email}`, data.error);
        }

      } catch (error) {
        results.failed++;
        results.errors.push({
          lead: lead.email,
          error: error.message
        });
        console.error(`[GMP Sync] ❌ Error syncing lead: ${lead.email}`, error);
      }
    }

    console.log(`[GMP Sync] Results: ${results.successful}/${results.total} successful`);

    // Log to Unbound.team database for monitoring
    await this.logSync('leads', clientTenantId, results);

    return results;
  }

  /**
   * Format lead notes for GMP display
   */
  formatLeadNotes(lead) {
    const sections = [];

    // Fit score
    if (lead.fitScore) {
      sections.push(`🎯 Fit Score: ${lead.fitScore}/10`);
    }

    // Pain points
    if (lead.painPoints) {
      sections.push(`\n💡 Pain Points:\n${lead.painPoints}`);
    }

    // Business area
    if (lead.businessArea) {
      sections.push(`\n📊 Business Area: ${lead.businessArea}`);
    }

    // Urgency
    if (lead.urgency) {
      sections.push(`\n⏰ Urgency: ${lead.urgency}`);
    }

    // Source
    if (lead.source || lead.platform) {
      sections.push(`\n📍 Source: ${lead.source || lead.platform}`);
    }

    // Outreach tip
    if (lead.outreachTip || lead.recommendedApproach) {
      sections.push(`\n✉️ Recommended Outreach:\n${lead.outreachTip || lead.recommendedApproach}`);
    }

    // Unbound job ID for tracking
    if (lead.jobId) {
      sections.push(`\n🔗 Unbound Job ID: ${lead.jobId}`);
    }

    return sections.join('\n');
  }

  /**
   * Push content to GMP campaigns table
   * @param {Array} content - Array of content objects from Unbound.team
   * @param {String} clientTenantId - GMP tenant ID for the client
   */
  async pushContent(content, clientTenantId) {
    console.log(`[GMP Sync] Pushing ${content.length} content pieces to GMP tenant: ${clientTenantId}`);

    const results = {
      total: content.length,
      successful: 0,
      failed: 0,
      errors: []
    };

    for (const item of content) {
      try {
        const response = await fetch(`${this.gmpApiUrl}/api/campaigns`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-tenant-id': clientTenantId,
            'Authorization': `Bearer ${this.gmpApiKey}`
          },
          body: JSON.stringify({
            name: item.title || `${item.type} - ${new Date().toLocaleDateString()}`,
            type: 'content',
            status: 'draft', // GMP uses: draft, active, completed
            notes: this.formatContentNotes(item),
            channels: [item.type], // 'blog', 'social', 'email'
            goals: item.goals || ['content-marketing'],
            metrics: {
              word_count: item.wordCount,
              seo_score: item.seoScore,
              readability: item.readability
            }
          })
        });

        const data = await response.json();

        if (data.success) {
          results.successful++;
          console.log(`[GMP Sync] ✅ Content synced: ${item.title}`);
        } else {
          results.failed++;
          results.errors.push({
            content: item.title,
            error: data.error
          });
          console.error(`[GMP Sync] ❌ Failed to sync content: ${item.title}`, data.error);
        }

      } catch (error) {
        results.failed++;
        results.errors.push({
          content: item.title,
          error: error.message
        });
        console.error(`[GMP Sync] ❌ Error syncing content: ${item.title}`, error);
      }
    }

    console.log(`[GMP Sync] Results: ${results.successful}/${results.total} successful`);

    await this.logSync('content', clientTenantId, results);

    return results;
  }

  /**
   * Format content notes for GMP display
   */
  formatContentNotes(content) {
    const sections = [];

    sections.push(`📝 Content Type: ${content.type}`);

    if (content.title) {
      sections.push(`\n📌 Title: ${content.title}`);
    }

    if (content.excerpt || content.summary) {
      sections.push(`\n📄 Summary:\n${content.excerpt || content.summary}`);
    }

    if (content.content) {
      // First 500 chars of content
      const preview = content.content.substring(0, 500) + (content.content.length > 500 ? '...' : '');
      sections.push(`\n📖 Preview:\n${preview}`);
    }

    if (content.seoMeta) {
      sections.push(`\n🔍 SEO Meta Description: ${content.seoMeta.description}`);
      sections.push(`🏷️ Keywords: ${content.seoMeta.keywords?.join(', ')}`);
    }

    if (content.wordCount) {
      sections.push(`\n📊 Word Count: ${content.wordCount}`);
    }

    if (content.jobId) {
      sections.push(`\n🔗 Unbound Job ID: ${content.jobId}`);
    }

    // Full content link (if stored in Unbound.team)
    sections.push(`\n\n📎 View full content in Unbound.team dashboard`);

    return sections.join('\n');
  }

  /**
   * Push research reports to GMP deals table (as notes) or custom table
   * @param {Array} reports - Array of research report objects
   * @param {String} clientTenantId - GMP tenant ID for the client
   */
  async pushResearch(reports, clientTenantId) {
    console.log(`[GMP Sync] Pushing ${reports.length} research reports to GMP tenant: ${clientTenantId}`);

    const results = {
      total: reports.length,
      successful: 0,
      failed: 0,
      errors: []
    };

    for (const report of reports) {
      try {
        // Option: Use deals table with notes field
        const response = await fetch(`${this.gmpApiUrl}/api/deals`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-tenant-id': clientTenantId,
            'Authorization': `Bearer ${this.gmpApiKey}`
          },
          body: JSON.stringify({
            title: report.title || `${report.type} Research Report`,
            stage: 'research',
            value: 0, // Internal research, no deal value
            contact_id: null, // Not tied to specific contact
            notes: this.formatResearchNotes(report),
            custom_fields: {
              report_type: report.type,
              unbound_job_id: report.jobId,
              generated_at: new Date().toISOString()
            }
          })
        });

        const data = await response.json();

        if (data.success) {
          results.successful++;
          console.log(`[GMP Sync] ✅ Research synced: ${report.title}`);
        } else {
          results.failed++;
          results.errors.push({
            report: report.title,
            error: data.error
          });
          console.error(`[GMP Sync] ❌ Failed to sync research: ${report.title}`, data.error);
        }

      } catch (error) {
        results.failed++;
        results.errors.push({
          report: report.title,
          error: error.message
        });
        console.error(`[GMP Sync] ❌ Error syncing research: ${report.title}`, error);
      }
    }

    console.log(`[GMP Sync] Results: ${results.successful}/${results.total} successful`);

    await this.logSync('research', clientTenantId, results);

    return results;
  }

  /**
   * Format research notes for GMP display
   */
  formatResearchNotes(report) {
    const sections = [];

    sections.push(`🔬 Research Type: ${report.type}`);

    if (report.summary) {
      sections.push(`\n📊 Executive Summary:\n${report.summary}`);
    }

    if (report.competitors && report.competitors.length > 0) {
      sections.push(`\n🏢 Competitors Analyzed:`);
      report.competitors.forEach(comp => {
        sections.push(`  • ${comp.name} - ${comp.strengths}`);
      });
    }

    if (report.marketGaps && report.marketGaps.length > 0) {
      sections.push(`\n💡 Market Gaps Identified:`);
      report.marketGaps.forEach(gap => {
        sections.push(`  • ${gap.opportunity} (Score: ${gap.score}/10)`);
      });
    }

    if (report.recommendations && report.recommendations.length > 0) {
      sections.push(`\n✅ Recommendations:`);
      report.recommendations.forEach(rec => {
        sections.push(`  • ${rec}`);
      });
    }

    if (report.marketSize) {
      sections.push(`\n💰 Market Size:`);
      sections.push(`  TAM: $${report.marketSize.tam}`);
      sections.push(`  SAM: $${report.marketSize.sam}`);
      sections.push(`  SOM: $${report.marketSize.som}`);
    }

    if (report.jobId) {
      sections.push(`\n🔗 Unbound Job ID: ${report.jobId}`);
    }

    sections.push(`\n\n📎 View full report in Unbound.team dashboard`);

    return sections.join('\n');
  }

  /**
   * Log sync activity to Unbound.team database
   * This helps you monitor sync health and troubleshoot issues
   */
  async logSync(syncType, tenantId, results) {
    try {
      // Store in Supabase for monitoring
      const { createClient } = require('@supabase/supabase-js');
      const supabase = createClient(
        process.env.ENTREPRENEURHUB_SUPABASE_URL,
        process.env.ENTREPRENEURHUB_SUPABASE_SERVICE_KEY
      );

      await supabase.from('gmp_sync_log').insert({
        sync_type: syncType,
        tenant_id: tenantId,
        items_total: results.total,
        items_successful: results.successful,
        items_failed: results.failed,
        errors: results.errors.length > 0 ? results.errors : null,
        success: results.failed === 0,
        synced_at: new Date().toISOString()
      });

      console.log(`[GMP Sync] Logged sync activity: ${syncType} for ${tenantId}`);
    } catch (error) {
      console.error('[GMP Sync] Failed to log sync activity:', error);
      // Don't throw - logging failure shouldn't break the sync
    }
  }

  /**
   * Get sync statistics for a client
   * Shows how many items have been synced in the last 30 days
   */
  async getSyncStats(clientTenantId) {
    try {
      const { createClient } = require('@supabase/supabase-js');
      const supabase = createClient(
        process.env.ENTREPRENEURHUB_SUPABASE_URL,
        process.env.ENTREPRENEURHUB_SUPABASE_SERVICE_KEY
      );

      const thirtyDaysAgo = new Date(Date.now() - 30*24*60*60*1000).toISOString();

      const { data, error } = await supabase
        .from('gmp_sync_log')
        .select('*')
        .eq('tenant_id', clientTenantId)
        .gte('synced_at', thirtyDaysAgo);

      if (error) {
        console.error('[GMP Sync] Error fetching stats:', error);
        return null;
      }

      // Calculate stats
      const stats = {
        total_syncs: data.length,
        successful_syncs: data.filter(d => d.success).length,
        failed_syncs: data.filter(d => !d.success).length,
        leads_synced: data
          .filter(d => d.sync_type === 'leads')
          .reduce((sum, d) => sum + d.items_successful, 0),
        content_synced: data
          .filter(d => d.sync_type === 'content')
          .reduce((sum, d) => sum + d.items_successful, 0),
        research_synced: data
          .filter(d => d.sync_type === 'research')
          .reduce((sum, d) => sum + d.items_successful, 0),
        last_sync: data.length > 0 ? data[0].synced_at : null
      };

      return stats;
    } catch (error) {
      console.error('[GMP Sync] Error calculating stats:', error);
      return null;
    }
  }

  /**
   * Test GMP connection
   * Verifies API key and connection work
   */
  async testConnection() {
    try {
      console.log('[GMP Sync] Testing connection to GMP...');

      const response = await fetch(`${this.gmpApiUrl}/api/health`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.gmpApiKey}`
        }
      });

      if (response.ok) {
        console.log('[GMP Sync] ✅ Connection successful');
        return { success: true };
      } else {
        console.error('[GMP Sync] ❌ Connection failed:', response.status);
        return { success: false, error: `HTTP ${response.status}` };
      }
    } catch (error) {
      console.error('[GMP Sync] ❌ Connection error:', error);
      return { success: false, error: error.message };
    }
  }
}

// Export singleton instance
module.exports = new GMPSync();
