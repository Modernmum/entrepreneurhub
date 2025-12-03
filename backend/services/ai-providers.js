// AI Provider Implementations
const Anthropic = require('@anthropic-ai/sdk');
const OpenAI = require('openai');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const axios = require('axios');

class AIProviders {
  constructor() {
    // Initialize API clients
    this.anthropic = process.env.ANTHROPIC_API_KEY
      ? new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
      : null;

    this.openai = process.env.OPENAI_API_KEY
      ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
      : null;

    this.gemini = process.env.GOOGLE_API_KEY
      ? new GoogleGenerativeAI(process.env.GOOGLE_API_KEY)
      : null;

    this.perplexityKey = process.env.PERPLEXITY_API_KEY;
  }

  // Gemini API
  async callGemini(prompt, options = {}) {
    if (!this.gemini) {
      throw new Error('Gemini API key not configured');
    }

    try {
      const model = this.gemini.getGenerativeModel({ model: 'gemini-pro' });

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      return {
        content: text,
        inputTokens: response.usageMetadata?.promptTokenCount || 0,
        outputTokens: response.usageMetadata?.candidatesTokenCount || 0
      };
    } catch (error) {
      console.error('Gemini API Error:', error.message);
      throw error;
    }
  }

  // OpenAI API
  async callOpenAI(modelId, prompt, options = {}) {
    if (!this.openai) {
      throw new Error('OpenAI API key not configured');
    }

    try {
      const completion = await this.openai.chat.completions.create({
        model: modelId,
        messages: [
          { role: 'system', content: options.systemPrompt || 'You are a helpful AI assistant for entrepreneurs.' },
          { role: 'user', content: prompt }
        ],
        temperature: options.temperature || 0.7,
        max_tokens: options.maxTokens || 2000
      });

      return {
        content: completion.choices[0].message.content,
        inputTokens: completion.usage.prompt_tokens,
        outputTokens: completion.usage.completion_tokens
      };
    } catch (error) {
      console.error('OpenAI API Error:', error.message);
      throw error;
    }
  }

  // Claude API
  async callClaude(modelId, prompt, options = {}) {
    if (!this.anthropic) {
      throw new Error('Anthropic API key not configured');
    }

    try {
      const message = await this.anthropic.messages.create({
        model: modelId === 'claude-haiku' ? 'claude-3-5-haiku-20241022' : 'claude-3-5-sonnet-20241022',
        max_tokens: options.maxTokens || 2000,
        temperature: options.temperature || 0.7,
        system: options.systemPrompt || 'You are a helpful AI assistant for entrepreneurs.',
        messages: [
          { role: 'user', content: prompt }
        ]
      });

      return {
        content: message.content[0].text,
        inputTokens: message.usage.input_tokens,
        outputTokens: message.usage.output_tokens
      };
    } catch (error) {
      console.error('Claude API Error:', error.message);
      throw error;
    }
  }

  // Perplexity API
  async callPerplexity(prompt, options = {}) {
    if (!this.perplexityKey) {
      throw new Error('Perplexity API key not configured');
    }

    try {
      const response = await axios.post(
        'https://api.perplexity.ai/chat/completions',
        {
          model: 'llama-3.1-sonar-small-128k-online',
          messages: [
            { role: 'system', content: options.systemPrompt || 'You are a research assistant helping entrepreneurs.' },
            { role: 'user', content: prompt }
          ],
          temperature: options.temperature || 0.2,
          max_tokens: options.maxTokens || 2000
        },
        {
          headers: {
            'Authorization': `Bearer ${this.perplexityKey}`,
            'Content-Type': 'application/json'
          }
        }
      );

      return {
        content: response.data.choices[0].message.content,
        inputTokens: response.data.usage?.prompt_tokens || 0,
        outputTokens: response.data.usage?.completion_tokens || 0
      };
    } catch (error) {
      console.error('Perplexity API Error:', error.response?.data || error.message);
      throw error;
    }
  }
}

module.exports = new AIProviders();
