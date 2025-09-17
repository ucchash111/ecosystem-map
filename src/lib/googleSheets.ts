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

        return {
          name: (record.name || '').trim(),
          website: record.website || '',
          // If both category and type existed, category takes precedence (already mapped); fallback to empty
          category: record.category || '',
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