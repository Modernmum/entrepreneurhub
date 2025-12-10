/**
 * Domain Extractor Service
 * Visits ProductHunt/IndieHackers pages and extracts the actual company website
 */

const axios = require('axios');
const cheerio = require('cheerio');

class DomainExtractor {
  constructor() {
    // Platform domains that are sources, not real company domains
    this.platformDomains = [
      'producthunt.com',
      'indiehackers.com',
      'reddit.com',
      'twitter.com',
      'x.com',
      'linkedin.com',
      'facebook.com',
      'instagram.com',
      'youtube.com',
      'medium.com',
      'substack.com',
      'github.com',
      'news.ycombinator.com',
      'techcrunch.com',
      'entrepreneur.com'
    ];
  }

  /**
   * Extract real company domain from a platform URL
   */
  async extractCompanyDomain(platformUrl, companyName) {
    try {
      const url = new URL(platformUrl);
      const hostname = url.hostname.replace('www.', '');

      // Route to appropriate extractor
      if (hostname.includes('producthunt.com')) {
        return await this.extractFromProductHunt(platformUrl, companyName);
      } else if (hostname.includes('indiehackers.com')) {
        return await this.extractFromIndieHackers(platformUrl, companyName);
      } else {
        // Unknown platform - try generic extraction
        return await this.extractGeneric(platformUrl, companyName);
      }
    } catch (error) {
      console.log(`   ⚠️  Domain extraction failed: ${error.message}`);
      return null;
    }
  }

  /**
   * Extract company website from ProductHunt page
   */
  async extractFromProductHunt(url, companyName) {
    try {
      console.log(`   🔍 Extracting domain from ProductHunt: ${url}`);

      const response = await axios.get(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
        },
        timeout: 15000
      });

      const $ = cheerio.load(response.data);

      // ProductHunt has the website link in several possible places
      let websiteUrl = null;

      // Method 1: Look for "Visit" or "Get it" button/link
      $('a[href]').each((i, el) => {
        const href = $(el).attr('href');
        const text = $(el).text().toLowerCase();

        if ((text.includes('visit') || text.includes('get it') || text.includes('website')) && href) {
          if (!this.isPlatformDomain(href)) {
            websiteUrl = href;
            return false; // break
          }
        }
      });

      // Method 2: Look for external links that aren't social media
      if (!websiteUrl) {
        $('a[href^="http"]').each((i, el) => {
          const href = $(el).attr('href');
          if (href && !this.isPlatformDomain(href)) {
            // Verify it's not a social link or tracking link
            if (!href.includes('utm_') &&
                !href.includes('twitter.com') &&
                !href.includes('linkedin.com') &&
                !href.includes('facebook.com')) {
              websiteUrl = href;
              return false; // break
            }
          }
        });
      }

      // Method 3: Look in meta tags
      if (!websiteUrl) {
        const ogUrl = $('meta[property="og:url"]').attr('content');
        if (ogUrl && !this.isPlatformDomain(ogUrl)) {
          websiteUrl = ogUrl;
        }
      }

      // Method 4: Search page content for URLs
      if (!websiteUrl) {
        const pageText = $('body').text();
        const urlMatches = pageText.match(/https?:\/\/[a-zA-Z0-9][a-zA-Z0-9-]*\.[a-zA-Z]{2,}/g);
        if (urlMatches) {
          for (const match of urlMatches) {
            if (!this.isPlatformDomain(match)) {
              websiteUrl = match;
              break;
            }
          }
        }
      }

      if (websiteUrl) {
        const domain = this.extractDomainFromUrl(websiteUrl);
        if (domain && !this.isPlatformDomain(domain)) {
          console.log(`   ✅ Found domain: ${domain}`);
          return domain;
        }
      }

      console.log(`   ⚠️  No domain found on ProductHunt page`);
      return null;

    } catch (error) {
      console.log(`   ⚠️  ProductHunt extraction failed: ${error.message}`);
      return null;
    }
  }

  /**
   * Extract company website from IndieHackers page
   */
  async extractFromIndieHackers(url, companyName) {
    try {
      console.log(`   🔍 Extracting domain from IndieHackers: ${url}`);

      const response = await axios.get(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
        },
        timeout: 15000
      });

      const $ = cheerio.load(response.data);
      let websiteUrl = null;

      // IndieHackers product pages have website links
      // Look for links with "website" text or external product links
      $('a[href]').each((i, el) => {
        const href = $(el).attr('href');
        const text = $(el).text().toLowerCase();
        const rel = $(el).attr('rel') || '';

        // Check for website links
        if (href && (text.includes('website') || text.includes('visit') || rel.includes('nofollow'))) {
          if (!this.isPlatformDomain(href)) {
            websiteUrl = href;
            return false;
          }
        }
      });

      // Look for product cards with external links
      if (!websiteUrl) {
        $('a[href^="http"]').each((i, el) => {
          const href = $(el).attr('href');
          if (href && !this.isPlatformDomain(href)) {
            websiteUrl = href;
            return false;
          }
        });
      }

      // Search page content
      if (!websiteUrl) {
        const pageText = $('body').text();
        const urlMatches = pageText.match(/https?:\/\/[a-zA-Z0-9][a-zA-Z0-9-]*\.[a-zA-Z]{2,}/g);
        if (urlMatches) {
          for (const match of urlMatches) {
            if (!this.isPlatformDomain(match)) {
              websiteUrl = match;
              break;
            }
          }
        }
      }

      if (websiteUrl) {
        const domain = this.extractDomainFromUrl(websiteUrl);
        if (domain && !this.isPlatformDomain(domain)) {
          console.log(`   ✅ Found domain: ${domain}`);
          return domain;
        }
      }

      console.log(`   ⚠️  No domain found on IndieHackers page`);
      return null;

    } catch (error) {
      console.log(`   ⚠️  IndieHackers extraction failed: ${error.message}`);
      return null;
    }
  }

  /**
   * Generic extraction for unknown platforms
   */
  async extractGeneric(url, companyName) {
    try {
      const response = await axios.get(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
          'Accept': 'text/html,application/xhtml+xml'
        },
        timeout: 10000
      });

      const $ = cheerio.load(response.data);

      // Look for external links
      let websiteUrl = null;
      $('a[href^="http"]').each((i, el) => {
        const href = $(el).attr('href');
        if (href && !this.isPlatformDomain(href)) {
          websiteUrl = href;
          return false;
        }
      });

      if (websiteUrl) {
        return this.extractDomainFromUrl(websiteUrl);
      }

      return null;
    } catch (error) {
      return null;
    }
  }

  /**
   * Check if a URL or domain belongs to a platform (not a real company)
   */
  isPlatformDomain(urlOrDomain) {
    const domain = urlOrDomain.includes('://')
      ? this.extractDomainFromUrl(urlOrDomain)
      : urlOrDomain;

    if (!domain) return true;

    return this.platformDomains.some(platform =>
      domain.toLowerCase().includes(platform.toLowerCase())
    );
  }

  /**
   * Extract domain from full URL
   */
  extractDomainFromUrl(url) {
    try {
      const urlObj = new URL(url);
      return urlObj.hostname.replace('www.', '');
    } catch {
      // Try to extract domain from malformed URL
      const match = url.match(/(?:https?:\/\/)?(?:www\.)?([a-zA-Z0-9][a-zA-Z0-9-]*\.[a-zA-Z]{2,})/);
      return match ? match[1] : null;
    }
  }

  /**
   * Batch extract domains for multiple leads
   */
  async extractBatch(leads) {
    const results = [];

    for (const lead of leads) {
      const url = lead.opportunity_data?.url || lead.url;
      if (url) {
        const domain = await this.extractCompanyDomain(url, lead.company_name);
        results.push({
          id: lead.id,
          company_name: lead.company_name,
          original_domain: lead.company_domain,
          extracted_domain: domain,
          url: url
        });

        // Rate limit: 1 second between requests
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    return results;
  }
}

module.exports = DomainExtractor;
