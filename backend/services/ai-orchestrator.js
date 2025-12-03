// AI Orchestrator - Smart model routing with cost protection
const config = require('../config/ai-models');
const notifications = require('./notifications');

class AIOrchestrator {
  constructor() {
    this.usage = {
      daily: {},
      totalCost: 0,
      lastReset: new Date().toDateString()
    };

    this.apiKeys = {
      openai: process.env.OPENAI_API_KEY,
      anthropic: process.env.ANTHROPIC_API_KEY,
      google: process.env.GOOGLE_API_KEY,
      perplexity: process.env.PERPLEXITY_API_KEY
    };
  }

  // Reset daily usage at midnight
  resetDailyUsage() {
    const today = new Date().toDateString();
    if (this.usage.lastReset !== today) {
      this.usage.daily = {};
      this.usage.totalCost = 0;
      this.usage.lastReset = today;
      this.warningShown = false;
      this.capReachedShown = false;
    }
  }

  // Calculate cost for a request
  calculateCost(modelId, inputTokens, outputTokens) {
    const model = config.models[modelId];
    const inputCost = (inputTokens / 1000000) * model.inputCostPer1M;
    const outputCost = (outputTokens / 1000000) * model.outputCostPer1M;
    return inputCost + outputCost;
  }

  // Check if we can afford this request
  canAffordRequest(modelId, estimatedTokens = 2000) {
    this.resetDailyUsage();

    const model = config.models[modelId];
    const estimatedCost = this.calculateCost(modelId, estimatedTokens, estimatedTokens);

    // Warn at 80% of daily cap
    const warningThreshold = config.DAILY_SPENDING_CAP * 0.8;
    if (this.usage.totalCost >= warningThreshold && this.usage.totalCost < config.DAILY_SPENDING_CAP) {
      if (!this.warningShown) {
        notifications.notifyDailySpendingWarning(this.usage.totalCost, config.DAILY_SPENDING_CAP);
        this.warningShown = true;
      }
    }

    // Check daily spending cap
    if (this.usage.totalCost + estimatedCost > config.DAILY_SPENDING_CAP) {
      console.warn(`⚠️  Daily spending cap reached: $${this.usage.totalCost.toFixed(2)}/$${config.DAILY_SPENDING_CAP}`);
      if (!this.capReachedShown) {
        notifications.notifySpendingCapReached(this.usage.totalCost, config.DAILY_SPENDING_CAP);
        this.capReachedShown = true;
      }
      return false;
    }

    // Check model daily limit
    if (model.dailyLimit) {
      const modelUsage = this.usage.daily[modelId] || 0;
      if (modelUsage >= model.dailyLimit) {
        console.warn(`⚠️  ${model.name} daily limit reached: ${modelUsage}/${model.dailyLimit}`);
        return false;
      }
    }

    return true;
  }

  // Find best available model for task
  selectModel(taskType) {
    this.resetDailyUsage();

    const candidates = config.taskRouting[taskType] || ['gemini', 'gpt-4o-mini'];

    for (const modelId of candidates) {
      if (this.canAffordRequest(modelId)) {
        console.log(`✓ Selected ${config.models[modelId].name} for ${taskType}`);
        return modelId;
      }
    }

    throw new Error(`No available models for ${taskType}. Daily cap reached or all models exhausted.`);
  }

  // Track usage after request
  trackUsage(modelId, inputTokens, outputTokens) {
    const cost = this.calculateCost(modelId, inputTokens, outputTokens);

    this.usage.daily[modelId] = (this.usage.daily[modelId] || 0) + 1;
    this.usage.totalCost += cost;

    console.log(`💰 Cost: $${cost.toFixed(4)} | Daily total: $${this.usage.totalCost.toFixed(2)}/$${config.DAILY_SPENDING_CAP}`);

    return {
      modelUsed: modelId,
      cost: cost,
      dailyTotal: this.usage.totalCost,
      dailyLimit: config.DAILY_SPENDING_CAP
    };
  }

  // Main method: execute AI task with automatic model selection
  async execute(taskType, prompt, options = {}) {
    this.resetDailyUsage();

    const candidates = config.taskRouting[taskType] || ['gemini', 'gpt-4o-mini', 'claude-haiku'];
    let lastError = null;

    // Try each model in order until one succeeds
    for (const modelId of candidates) {
      try {
        const model = config.models[modelId];

        // Check if model is available and affordable
        if (!this.canAffordRequest(modelId)) {
          console.log(`⏭️  Skipping ${model.name} - budget/limit reached`);
          continue;
        }

        console.log(`🔄 Trying ${model.name} for ${taskType}...`);
        let result;

        switch (model.provider) {
          case 'google':
            result = await this.callGemini(prompt, options);
            break;
          case 'openai':
            result = await this.callOpenAI(modelId, prompt, options);
            break;
          case 'anthropic':
            result = await this.callClaude(modelId, prompt, options);
            break;
          case 'perplexity':
            result = await this.callPerplexity(prompt, options);
            break;
          default:
            throw new Error(`Unknown provider: ${model.provider}`);
        }

        // Track usage
        const usage = this.trackUsage(
          modelId,
          result.inputTokens || 1000,
          result.outputTokens || 1000
        );

        console.log(`✅ Success with ${model.name}`);

        return {
          content: result.content,
          modelUsed: modelId,
          usage: usage
        };

      } catch (error) {
        lastError = error;
        console.error(`❌ ${config.models[modelId].name} failed: ${error.message}`);
        console.log(`🔄 Falling back to next model...`);
        continue;
      }
    }

    // If all models failed, throw the last error
    throw new Error(`All AI models failed. Last error: ${lastError?.message || 'Unknown error'}`);
  }

  // Provider-specific API calls (delegated to AIProviders)
  async callGemini(prompt, options) {
    const providers = require('./ai-providers');
    console.log('📝 Calling Gemini API...');
    return await providers.callGemini(prompt, options);
  }

  async callOpenAI(modelId, prompt, options) {
    const providers = require('./ai-providers');
    console.log(`📝 Calling OpenAI ${modelId}...`);
    return await providers.callOpenAI(modelId, prompt, options);
  }

  async callClaude(modelId, prompt, options) {
    const providers = require('./ai-providers');
    console.log(`📝 Calling Claude ${modelId}...`);
    return await providers.callClaude(modelId, prompt, options);
  }

  async callPerplexity(prompt, options) {
    const providers = require('./ai-providers');
    console.log('📝 Calling Perplexity API...');
    return await providers.callPerplexity(prompt, options);
  }

  // Get current usage stats
  getStats() {
    this.resetDailyUsage();
    return {
      dailySpending: this.usage.totalCost,
      dailyLimit: config.DAILY_SPENDING_CAP,
      remainingBudget: config.DAILY_SPENDING_CAP - this.usage.totalCost,
      percentUsed: (this.usage.totalCost / config.DAILY_SPENDING_CAP * 100).toFixed(1),
      modelUsage: this.usage.daily
    };
  }
}

module.exports = new AIOrchestrator();
