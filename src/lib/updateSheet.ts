import { google } from 'googleapis';
import { fetchLogoFromWebsite, generateLogoPlaceholder } from './logoFetcher';

export class SheetUpdater {
  private sheets;

  constructor() {
    this.sheets = google.sheets({
      version: 'v4',
      auth: process.env.GOOGLE_SHEETS_API_KEY,
    });
  }

  async addLogoColumn(sheetId: string) {
    try {
      // First, get the current data to see the structure
      const response = await this.sheets.spreadsheets.values.get({
        spreadsheetId: sheetId,
        range: 'All!A1:Z1', // Get headers
      });

      const headers = response.data.values?.[0] || [];
      console.log('Current headers:', headers);

      // Check if Logo column already exists
      if (!headers.includes('Logo')) {
        // Add Logo header
        const newHeaders = [...headers, 'Logo'];
        
        // Update the header row
        await this.sheets.spreadsheets.values.update({
          spreadsheetId: sheetId,
          range: `All!A1:${String.fromCharCode(65 + newHeaders.length - 1)}1`,
          valueInputOption: 'RAW',
          requestBody: {
            values: [newHeaders],
          },
        });

        console.log('Logo column added to headers');
      }

      return true;
    } catch (error) {
      console.error('Error adding logo column:', error);
      return false;
    }
  }

  async populateLogos(sheetId: string) {
    try {
      // Get all data
      const response = await this.sheets.spreadsheets.values.get({
        spreadsheetId: sheetId,
        range: 'All!A:Z',
      });

      const rows = response.data.values;
      if (!rows || rows.length === 0) return false;

      const headers = rows[0] as string[];
      const nameIndex = headers.findIndex(h => h.toLowerCase() === 'name');
      const websiteIndex = headers.findIndex(h => h.toLowerCase() === 'website');
      const logoIndex = headers.findIndex(h => h.toLowerCase() === 'logo');

      if (nameIndex === -1 || websiteIndex === -1 || logoIndex === -1) {
        console.error('Required columns not found');
        return false;
      }

      // Process each row to get logos
      const updatedRows = [];
      for (let i = 1; i < rows.length; i++) {
        const row = rows[i];
        if (!row) continue;

        const name = row[nameIndex];
        const website = row[websiteIndex];
        let logo = row[logoIndex];

        // If logo is empty, try to fetch it
        if (!logo && website) {
          console.log(`Fetching logo for ${name}...`);
          logo = await fetchLogoFromWebsite(website);
          
          // If still no logo, generate placeholder
          if (!logo && name) {
            logo = generateLogoPlaceholder(name);
          }
        }

        // Ensure row has enough columns
        const updatedRow = [...row];
        while (updatedRow.length <= logoIndex) {
          updatedRow.push('');
        }
        updatedRow[logoIndex] = logo || '';
        
        updatedRows.push(updatedRow);
      }

      // Update the sheet with logo data
      if (updatedRows.length > 0) {
        await this.sheets.spreadsheets.values.update({
          spreadsheetId: sheetId,
          range: `All!A2:${String.fromCharCode(65 + Math.max(...updatedRows.map(row => row.length)) - 1)}${updatedRows.length + 1}`,
          valueInputOption: 'RAW',
          requestBody: {
            values: updatedRows,
          },
        });

        console.log(`Updated ${updatedRows.length} rows with logo data`);
      }

      return true;
    } catch (error) {
      console.error('Error populating logos:', error);
      return false;
    }
  }
}