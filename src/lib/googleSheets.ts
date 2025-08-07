import { google } from 'googleapis';

export interface EcosystemData {
  name: string;
  website?: string;
  category?: string;
  type?: string;
  tier?: string;
  investments?: string;
  logo?: string;
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

      return data.map((row: string[]) => {
        const item: Record<string, string> = {};
        headers.forEach((header, index) => {
          item[header.toLowerCase()] = row[index] || '';
        });

        return {
          name: item.name || '',
          website: item.website || '',
          category: item.category || '',
          type: item.type || '',
          tier: item.tier || '',
          investments: item.investments || '',
          logo: item.logo || '',
        };
      }).filter(item => item.name.trim() !== '');
    } catch (error) {
      console.error('Error fetching sheet data:', error);
      throw new Error('Failed to fetch data from Google Sheets');
    }
  }
}