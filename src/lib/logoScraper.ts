import { EcosystemData } from './googleSheets';
import fs from 'fs';
import path from 'path';

interface LogoResult {
  company: string;
  domain: string;
  logoUrl: string | null;
  saved: boolean;
  error?: string;
}

export class LogoScraper {
  private static async downloadImage(url: string, filepath: string): Promise<boolean> {
    try {
      const response = await fetch(url);
      if (!response.ok) return false;
      
      const arrayBuffer = await response.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      
      // Ensure directory exists
      const dir = path.dirname(filepath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      
      fs.writeFileSync(filepath, buffer);
      return true;
    } catch (error) {
      console.error(`Error downloading ${url}:`, error);
      return false;
    }
  }

  private static extractDomain(url: string): string {
    try {
      const urlObj = new URL(url.startsWith('http') ? url : `https://${url}`);
      return urlObj.hostname.replace('www.', '');
    } catch {
      return url.replace(/https?:\/\//g, '').replace('www.', '').split('/')[0];
    }
  }

  private static async findLogoOnPage(websiteUrl: string): Promise<string | null> {
    try {
      const response = await fetch(websiteUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      });
      
      if (!response.ok) return null;
      
      const html = await response.text();
      const domain = this.extractDomain(websiteUrl);
      
      // Try multiple logo detection methods
      const logoSelectors = [
        // Common logo patterns
        /rel=["']icon["'][^>]*href=["']([^"']+)["']/i,
        /rel=["']apple-touch-icon["'][^>]*href=["']([^"']+)["']/i,
        /rel=["']shortcut icon["'][^>]*href=["']([^"']+)["']/i,
        /<link[^>]*href=["']([^"']*logo[^"']*)["']/i,
        /<img[^>]*src=["']([^"']*logo[^"']*)["']/i,
        /<img[^>]*class=["'][^"']*logo[^"']*["'][^>]*src=["']([^"']+)["']/i,
        // Open Graph and Twitter meta tags
        /<meta[^>]*property=["']og:image["'][^>]*content=["']([^"']+)["']/i,
        /<meta[^>]*name=["']twitter:image["'][^>]*content=["']([^"']+)["']/i,
      ];

      for (const regex of logoSelectors) {
        const match = html.match(regex);
        if (match && match[1]) {
          let logoUrl = match[1];
          
          // Convert relative URLs to absolute
          if (logoUrl.startsWith('/')) {
            logoUrl = `${websiteUrl.split('/').slice(0, 3).join('/')}${logoUrl}`;
          } else if (!logoUrl.startsWith('http')) {
            logoUrl = `${websiteUrl}/${logoUrl}`;
          }
          
          return logoUrl;
        }
      }

      // Fallback: try common favicon paths
      const commonPaths = [
        '/favicon.ico',
        '/favicon.png',
        '/logo.png',
        '/assets/logo.png',
        '/images/logo.png',
        '/img/logo.png'
      ];

      for (const path of commonPaths) {
        const logoUrl = `${websiteUrl.split('/').slice(0, 3).join('/')}${path}`;
        try {
          const testResponse = await fetch(logoUrl, { method: 'HEAD' });
          if (testResponse.ok) {
            return logoUrl;
          }
        } catch {
          continue;
        }
      }

      return null;
    } catch (error) {
      console.error(`Error scraping ${websiteUrl}:`, error);
      return null;
    }
  }

  static async scrapeCompanyLogos(companies: EcosystemData[]): Promise<LogoResult[]> {
    const results: LogoResult[] = [];
    const publicDir = path.join(process.cwd(), 'public', 'company-logos');

    // Ensure directory exists
    if (!fs.existsSync(publicDir)) {
      fs.mkdirSync(publicDir, { recursive: true });
    }

    console.log(`Starting logo scraping for ${companies.length} companies...`);

    for (let i = 0; i < companies.length; i++) {
      const company = companies[i];
      console.log(`[${i + 1}/${companies.length}] Processing: ${company.name}`);

      if (!company.website) {
        results.push({
          company: company.name,
          domain: '',
          logoUrl: null,
          saved: false,
          error: 'No website URL provided'
        });
        continue;
      }

      const domain = this.extractDomain(company.website);
      const logoPath = path.join(publicDir, `${domain}.png`);

      // Skip if logo already exists
      if (fs.existsSync(logoPath)) {
        results.push({
          company: company.name,
          domain,
          logoUrl: `/company-logos/${domain}.png`,
          saved: true
        });
        continue;
      }

      try {
        // Add protocol if missing
        let websiteUrl = company.website;
        if (!websiteUrl.startsWith('http')) {
          websiteUrl = `https://${websiteUrl}`;
        }

        const logoUrl = await this.findLogoOnPage(websiteUrl);
        
        if (logoUrl) {
          const saved = await this.downloadImage(logoUrl, logoPath);
          results.push({
            company: company.name,
            domain,
            logoUrl: saved ? `/company-logos/${domain}.png` : logoUrl,
            saved
          });
        } else {
          results.push({
            company: company.name,
            domain,
            logoUrl: null,
            saved: false,
            error: 'No logo found on website'
          });
        }

        // Add small delay to avoid overwhelming servers
        await new Promise(resolve => setTimeout(resolve, 500));
        
      } catch (error) {
        results.push({
          company: company.name,
          domain,
          logoUrl: null,
          saved: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    console.log(`Logo scraping completed. Successfully saved ${results.filter(r => r.saved).length}/${companies.length} logos`);
    return results;
  }
}