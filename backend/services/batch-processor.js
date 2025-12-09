/**
 * Batch Processor
 * Manages processing 100 leads at a time from 10k inventory
 */

const { createClient } = require('@supabase/supabase-js');

class BatchProcessor {
  constructor() {
    this.supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_KEY
    );

    this.config = {
      batchSize: 100,               // Process 100 at a time
      inventoryTarget: 10000,       // Maintain 10k inventory
      minScore: 25,                 // Only process 25+ scored leads
    };
  }

  /**
   * Get current inventory status
   */
  async getInventoryStatus() {
    // Count qualified leads in inventory
    const { data: qualified, error } = await this.supabase
      .from('scored_opportunities')
      .select('id', { count: 'exact', head: true })
      .eq('qualified', true)
      .gte('overall_score', this.config.minScore)
      .is('batch_id', null);  // Not yet assigned to a batch

    // Count leads in processing
    const { data: processing } = await this.supabase
      .from('processing_batches')
      .select('id, status', { count: 'exact' })
      .in('status', ['researching', 'ready_to_send', 'sending']);

    return {
      available: qualified?.count || 0,
      target: this.config.inventoryTarget,
      needsReplenishment: (qualified?.count || 0) < 1000,
      inProcessing: processing?.length || 0
    };
  }

  /**
   * Create new batch of 100 leads
   */
  async createBatch(clientId = 'maggie-forbes') {
    try {
      // Check if we have enough inventory
      const status = await getInventoryStatus();
      if (status.available < this.config.batchSize) {
        throw new Error(`Insufficient inventory: ${status.available} available, need ${this.config.batchSize}`);
      }

      // Create batch record
      const { data: batch, error: batchError } = await this.supabase
        .from('processing_batches')
        .insert({
          client_id: clientId,
          batch_size: this.config.batchSize,
          status: 'created',
          created_at: new Date().toISOString()
        })
        .select()
        .single();

      if (batchError) throw batchError;

      // Get top 100 qualified leads
      const { data: leads, error: leadsError } = await this.supabase
        .from('scored_opportunities')
        .select('*')
        .eq('qualified', true)
        .gte('overall_score', this.config.minScore)
        .is('batch_id', null)
        .order('overall_score', { ascending: false })
        .limit(this.config.batchSize);

      if (leadsError) throw leadsError;

      // Assign leads to batch
      const leadIds = leads.map(l => l.id);
      const { error: updateError } = await this.supabase
        .from('scored_opportunities')
        .update({ batch_id: batch.id })
        .in('id', leadIds);

      if (updateError) throw updateError;

      console.log(`✅ Created batch ${batch.id} with ${leads.length} leads`);

      return {
        batchId: batch.id,
        leadCount: leads.length,
        leads: leads,
        status: 'created'
      };

    } catch (error) {
      console.error('Error creating batch:', error);
      throw error;
    }
  }

  /**
   * Get current batch for processing
   */
  async getCurrentBatch(clientId = 'maggie-forbes') {
    const { data: batch, error } = await this.supabase
      .from('processing_batches')
      .select('*, scored_opportunities(*)')
      .eq('client_id', clientId)
      .in('status', ['created', 'researching', 'ready_to_send'])
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error && error.code !== 'PGRST116') throw error;

    return batch;
  }

  /**
   * Update batch status
   */
  async updateBatchStatus(batchId, status, metadata = {}) {
    const { data, error } = await this.supabase
      .from('processing_batches')
      .update({
        status: status,
        ...metadata,
        updated_at: new Date().toISOString()
      })
      .eq('id', batchId)
      .select()
      .single();

    if (error) throw error;

    console.log(`✅ Batch ${batchId} status updated to: ${status}`);
    return data;
  }

  /**
   * Mark batch as complete and create next one
   */
  async completeBatch(batchId) {
    await this.updateBatchStatus(batchId, 'complete', {
      completed_at: new Date().toISOString()
    });

    // Check if we should create next batch
    const status = await this.getInventoryStatus();
    if (status.available >= this.config.batchSize) {
      console.log('📦 Creating next batch...');
      return await this.createBatch();
    } else {
      console.log('⏸️  Insufficient inventory for next batch. Waiting for discovery...');
      return null;
    }
  }

  /**
   * Get batch statistics
   */
  async getBatchStats(batchId) {
    const { data: batch, error } = await this.supabase
      .from('processing_batches')
      .select(`
        *,
        scored_opportunities(count),
        outreach_campaigns(count)
      `)
      .eq('id', batchId)
      .single();

    if (error) throw error;

    // Get email stats for this batch
    const { data: emails } = await this.supabase
      .from('outreach_campaigns')
      .select('*')
      .eq('batch_id', batchId);

    const stats = {
      batchId: batch.id,
      status: batch.status,
      totalLeads: batch.batch_size,
      emailsSent: emails?.filter(e => e.sent_at).length || 0,
      emailsOpened: emails?.filter(e => e.opened_at).length || 0,
      emailsReplied: emails?.filter(e => e.replied_at).length || 0,
      conversions: emails?.filter(e => e.converted).length || 0,
      createdAt: batch.created_at,
      completedAt: batch.completed_at
    };

    return stats;
  }
}

module.exports = BatchProcessor;
