import { google } from 'googleapis';

export interface EcosystemData {
  name: string;
  website?: string;
  category?: string;
  type?: string;
  tier?: string;
  investments?: string;
  logo_url?: string;
  description?: string;
  focus?: string;
  email?: string;
}

export class GoogleSheetsService {
  private sheets;

  constructor() {
    this.sheets = google.sheets({
      version: 'v4',
      auth: process.env.GOOGLE_SHEETS_API_KEY,
    });
  }

  async getSheetData(sheetId: string, range: string = 'A:Z'): Promise<EcosystemData[]> {
    try {
      const response = await this.sheets.spreadsheets.values.get({
        spreadsheetId: sheetId,
        range,
      });

      const rows = response.data.values;
      if (!rows || rows.length === 0) {
        return [];
      }

      // Assuming first row contains headers
      const headers = rows[0] as string[];
      const data = rows.slice(1);

      // Normalize header keys and map common synonyms to canonical fields
      const normalize = (s: string) => (s || '')
        .toLowerCase()
        .trim()
        .replace(/\s+/g, ' ');

      const headerToCanonical: Record<string, keyof EcosystemData> = {} as Record<string, keyof EcosystemData>;
      headers.forEach((rawHeader) => {
        const h = normalize(String(rawHeader));
        const underscored = h.replace(/[^a-z0-9]+/g, '_');
        const map: Record<string, keyof EcosystemData> = {
          name: 'name',
          organization: 'name',
          organisation: 'name',
          company: 'name',
          org: 'name',
          website: 'website',
          url: 'website',
          site: 'website',
          link: 'website',
          category: 'category',
          type: 'category',
          group: 'category',
          sector: 'category',
          description: 'description',
          about: 'description',
          email: 'email',
          contact: 'email',
          focus: 'focus',
          investments: 'investments',
          tier: 'tier',
          logo: 'logo_url',
          logo_url: 'logo_url',
          logo_link: 'logo_url',
          logoimage: 'logo_url',
        };

        if (map[h]) headerToCanonical[h] = map[h];
        else if (map[underscored]) headerToCanonical[h] = map[underscored];
      });

      const canonicalizeCategory = (raw: string | undefined): string => {
        const v = (raw || '').toLowerCase().trim();
        if (!v) return '';
        // Venture Capital
        if (/(^|\b)(vc|venture|venture\s*capital|fund)(\b|$)/i.test(v)) return 'Venture Capital';
        // Impact Investor
        if (/impact|esg|sustainab|csr/.test(v)) return 'Impact Investor';
        // Private Equity
        if (/private\s*equity|pe\b/.test(v)) return 'Private Equity';
        // Incubators & Accelerators
        if (/incubat|accelerat|program|cohort|bootcamp/.test(v)) return 'Incubators & Accelerators';
        // Angel Syndicate & Network
        if (/angel|syndicate|network/.test(v)) return 'Angel Syndicate & Network';
        // Ecosystem Support
        if (/support|service|advis|consult|law|audit|account|ops|enable|tool|platform/.test(v)) return 'Ecosystem Support';
        // Media and Information Platforms
        if (/media|news|insight|research|database|info|intelligence|magazine|press/.test(v)) return 'Media and Information Platforms';
        // University Programs
        if (/university|college|school|campus|lab|center|centre|student|faculty/.test(v)) return 'University Programs';
        // Government
        if (/gov|ministry|bureau|agency|public|municipal|state|national/.test(v)) return 'Government';
        // Corporate Venture
        if (/corporate|cvc|conglomerate|group|holdings?/.test(v)) return 'Corporate Venture';
        // DFIs, FIs, & DOs
        if (/(\bdfi\b|\bfi\b|development\s*finance|foundation|ngo|non-?profit|international|multilateral|donor|fund|bank|foundation)/.test(v)) {
          return 'DFIs, FIs, & DOs';
        }
        // Co-Working
        if (/cowork|co-?working|shared\s*office|space/.test(v)) return 'Co-Working';
        return '';
      };

      return data.map((row: string[]) => {
        const record: Partial<EcosystemData> = {};
        headers.forEach((rawHeader, index) => {
          const h = normalize(String(rawHeader));
          const canonical = headerToCanonical[h];
          if (!canonical) return;
          const value = (row[index] ?? '').toString().trim();
          // Prefer first non-empty value for canonical field if duplicates map to same canonical
          if (value && canonical && !record[canonical]) {
            // Special-case website: ensure it has protocol if it looks like a domain
            if (canonical === 'website') {
              record.website = /^https?:\/\//i.test(value) ? value : `https://${value}`;
            } else {
              const key = canonical as keyof EcosystemData;
              (record as Record<keyof EcosystemData, string>)[key] = value;
            }
          }
        });

        // Normalize category values to our canonical set
        const canonicalCategory = canonicalizeCategory(
          (record.category || record.type || '').toString()
        );

        return {
          name: (record.name || '').trim(),
          website: record.website || '',
          // Prefer canonical mapping; if no match, keep original or empty
          category: canonicalCategory || (record.category || '').trim(),
          type: record.type || '',
          tier: record.tier || '',
          investments: record.investments || '',
          logo_url: record.logo_url || '',
          description: record.description || '',
          focus: record.focus || '',
          email: record.email || '',
        } as EcosystemData;
      }).filter(item => item.name.trim() !== '');
    } catch (error) {
      console.error('Error fetching sheet data:', error);
      throw new Error('Failed to fetch data from Google Sheets');
    }
  }
}