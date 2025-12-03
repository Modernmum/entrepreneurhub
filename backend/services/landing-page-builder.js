// Landing Page Builder - AI-powered landing page generation
// Creates complete, responsive landing pages ready to deploy

const orchestrator = require('./ai-orchestrator');
const contentSafety = require('./content-safety');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

class LandingPageBuilder {
  constructor() {
    this.supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_KEY
    );
  }

  /**
   * Build complete landing page
   */
  async buildLandingPage(params) {
    const {
      businessName,
      description,
      targetAudience,
      valueProposition,
      features,
      pricing,
      ctaText,
      userId
    } = params;

    console.log(`🏗️  Building landing page for: ${businessName}`);

    // Generate page copy
    const copy = await this.generateCopy({
      businessName,
      description,
      targetAudience,
      valueProposition,
      features,
      pricing
    });

    // Generate HTML/CSS
    const html = await this.generateHTML(copy, businessName, ctaText);

    // Safety check
    const safetyCheck = await contentSafety.checkContent(
      `${copy.headline} ${copy.subheadline} ${copy.description}`,
      { type: 'landing_page', userId, businessName }
    );

    if (!safetyCheck.safe) {
      throw new Error('Landing page content failed safety check');
    }

    // Save to database and generate preview URL
    const saved = await this.saveLandingPage(userId, {
      businessName,
      copy,
      html,
      params
    });

    console.log(`✅ Landing page built: ${businessName}`);

    return saved;
  }

  /**
   * Generate landing page copy with AI
   */
  async generateCopy(params) {
    const { businessName, description, targetAudience, valueProposition, features, pricing } = params;

    const prompt = `Create compelling landing page copy for:

Business: ${businessName}
Description: ${description}
Target Audience: ${targetAudience}
Value Proposition: ${valueProposition}
Features: ${features?.join(', ') || 'Not provided'}
Pricing: ${pricing ? `Starting at ${pricing}` : 'Not provided'}

Create persuasive copy for:
1. Headline (10 words max, benefit-driven)
2. Subheadline (20 words max, expand on headline)
3. Hero description (2-3 sentences, clear value prop)
4. Feature headlines (3-4 features with punchy titles)
5. Feature descriptions (1-2 sentences each)
6. Social proof section (what customers say)
7. FAQ (5 common questions and answers)
8. Final CTA section

Format as JSON:
{
  "headline": "...",
  "subheadline": "...",
  "description": "...",
  "features": [
    {"title": "...", "description": "..."},
    ...
  ],
  "socialProof": "...",
  "faqs": [
    {"question": "...", "answer": "..."},
    ...
  ],
  "finalCTA": "..."
}`;

    try {
      const response = await orchestrator.execute('content-generation', prompt);
      const jsonMatch = response.content.match(/\{[\s\S]*\}/);

      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }

      throw new Error('Failed to parse landing page copy');

    } catch (error) {
      console.error('Copy generation failed:', error.message);
      throw error;
    }
  }

  /**
   * Generate HTML/CSS for landing page
   */
  async generateHTML(copy, businessName, ctaText) {
    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${businessName} - ${copy.headline}</title>
  <meta name="description" content="${copy.subheadline}">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
      line-height: 1.6;
      color: #333;
    }
    .container { max-width: 1200px; margin: 0 auto; padding: 0 20px; }

    /* Hero Section */
    .hero {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 80px 20px;
      text-align: center;
    }
    .hero h1 {
      font-size: 3rem;
      margin-bottom: 20px;
      font-weight: 700;
    }
    .hero h2 {
      font-size: 1.5rem;
      margin-bottom: 30px;
      font-weight: 400;
      opacity: 0.9;
    }
    .hero p {
      font-size: 1.1rem;
      margin-bottom: 40px;
      max-width: 700px;
      margin-left: auto;
      margin-right: auto;
    }

    /* CTA Button */
    .cta-button {
      background: white;
      color: #667eea;
      padding: 15px 40px;
      font-size: 1.2rem;
      border: none;
      border-radius: 5px;
      cursor: pointer;
      font-weight: 600;
      text-decoration: none;
      display: inline-block;
      transition: transform 0.2s;
    }
    .cta-button:hover {
      transform: translateY(-2px);
      box-shadow: 0 10px 20px rgba(0,0,0,0.2);
    }

    /* Features Section */
    .features {
      padding: 80px 20px;
      background: #f8f9fa;
    }
    .features h2 {
      text-align: center;
      font-size: 2.5rem;
      margin-bottom: 60px;
    }
    .feature-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      gap: 40px;
    }
    .feature-card {
      background: white;
      padding: 30px;
      border-radius: 10px;
      box-shadow: 0 5px 15px rgba(0,0,0,0.1);
    }
    .feature-card h3 {
      font-size: 1.5rem;
      margin-bottom: 15px;
      color: #667eea;
    }
    .feature-card p {
      color: #666;
    }

    /* Social Proof */
    .social-proof {
      padding: 80px 20px;
      text-align: center;
      background: white;
    }
    .social-proof h2 {
      font-size: 2.5rem;
      margin-bottom: 40px;
    }
    .testimonial {
      max-width: 800px;
      margin: 0 auto;
      font-size: 1.3rem;
      font-style: italic;
      color: #555;
    }

    /* FAQ Section */
    .faq {
      padding: 80px 20px;
      background: #f8f9fa;
    }
    .faq h2 {
      text-align: center;
      font-size: 2.5rem;
      margin-bottom: 60px;
    }
    .faq-item {
      max-width: 800px;
      margin: 0 auto 30px;
      background: white;
      padding: 25px;
      border-radius: 10px;
    }
    .faq-item h3 {
      font-size: 1.3rem;
      margin-bottom: 10px;
      color: #667eea;
    }
    .faq-item p {
      color: #666;
    }

    /* Final CTA */
    .final-cta {
      padding: 80px 20px;
      text-align: center;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
    }
    .final-cta h2 {
      font-size: 2.5rem;
      margin-bottom: 30px;
    }
    .final-cta p {
      font-size: 1.2rem;
      margin-bottom: 40px;
      max-width: 600px;
      margin-left: auto;
      margin-right: auto;
    }

    /* Footer */
    footer {
      padding: 40px 20px;
      text-align: center;
      background: #333;
      color: white;
    }

    @media (max-width: 768px) {
      .hero h1 { font-size: 2rem; }
      .hero h2 { font-size: 1.2rem; }
      .features h2, .social-proof h2, .faq h2, .final-cta h2 { font-size: 2rem; }
    }
  </style>
</head>
<body>
  <!-- Hero Section -->
  <section class="hero">
    <div class="container">
      <h1>${copy.headline}</h1>
      <h2>${copy.subheadline}</h2>
      <p>${copy.description}</p>
      <a href="#cta" class="cta-button">${ctaText || 'Get Started'}</a>
    </div>
  </section>

  <!-- Features Section -->
  <section class="features">
    <div class="container">
      <h2>Why Choose ${businessName}?</h2>
      <div class="feature-grid">
        ${copy.features.map(f => `
        <div class="feature-card">
          <h3>${f.title}</h3>
          <p>${f.description}</p>
        </div>
        `).join('')}
      </div>
    </div>
  </section>

  <!-- Social Proof -->
  <section class="social-proof">
    <div class="container">
      <h2>What Our Customers Say</h2>
      <div class="testimonial">
        "${copy.socialProof}"
      </div>
    </div>
  </section>

  <!-- FAQ Section -->
  <section class="faq">
    <div class="container">
      <h2>Frequently Asked Questions</h2>
      ${copy.faqs.map(faq => `
      <div class="faq-item">
        <h3>${faq.question}</h3>
        <p>${faq.answer}</p>
      </div>
      `).join('')}
    </div>
  </section>

  <!-- Final CTA -->
  <section class="final-cta" id="cta">
    <div class="container">
      <h2>Ready to Get Started?</h2>
      <p>${copy.finalCTA}</p>
      <a href="#" class="cta-button">${ctaText || 'Get Started Now'}</a>
    </div>
  </section>

  <!-- Footer -->
  <footer>
    <div class="container">
      <p>&copy; ${new Date().getFullYear()} ${businessName}. All rights reserved.</p>
      <p style="margin-top: 10px; font-size: 0.9rem; opacity: 0.7;">
        Built with <a href="https://unbound.team" style="color: white;">Unbound.team</a>
      </p>
    </div>
  </footer>
</body>
</html>`;

    return html;
  }

  /**
   * Save landing page to database
   */
  async saveLandingPage(userId, pageData) {
    const { data, error } = await this.supabase
      .from('landing_pages')
      .insert({
        user_id: userId,
        business_name: pageData.businessName,
        html_content: pageData.html,
        status: 'completed',
        created_at: new Date().toISOString(),
        metadata: {
          copy: pageData.copy,
          params: pageData.params
        }
      })
      .select()
      .single();

    if (error) {
      console.error('Failed to save landing page:', error);
      throw new Error('Failed to save landing page');
    }

    // Generate preview URL
    data.previewUrl = `/landing-page/${data.id}.html`;

    return data;
  }

  /**
   * Get user's landing pages
   */
  async getUserLandingPages(userId) {
    const { data } = await this.supabase
      .from('landing_pages')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    return data || [];
  }

  /**
   * Get landing page by ID
   */
  async getLandingPage(pageId) {
    const { data } = await this.supabase
      .from('landing_pages')
      .select('*')
      .eq('id', pageId)
      .single();

    return data;
  }

  /**
   * Publish landing page (make it live)
   */
  async publishLandingPage(pageId) {
    const { data, error } = await this.supabase
      .from('landing_pages')
      .update({
        status: 'published',
        published_at: new Date().toISOString()
      })
      .eq('id', pageId)
      .select()
      .single();

    if (error) {
      console.error('Failed to publish landing page:', error);
      return null;
    }

    console.log(`✅ Landing page published: ${pageId}`);

    return data;
  }
}

module.exports = new LandingPageBuilder();
