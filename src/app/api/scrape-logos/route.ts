import { NextResponse } from 'next/server';
import { GoogleSheetsService } from '@/lib/googleSheets';
import { LogoScraper } from '@/lib/logoScraper';

export async function POST() {
  try {
    console.log('Starting logo scraping process...');
    
    // Get companies data
    const sheetId = process.env.GOOGLE_SHEET_ID;
    if (!sheetId) {
      return NextResponse.json(
        { error: 'Google Sheet ID not configured' },
        { status: 500 }
      );
    }

    const googleSheetsService = new GoogleSheetsService();
    const companies = await googleSheetsService.getSheetData(sheetId);
    
    console.log(`Found ${companies.length} companies to process`);

    // Filter companies with websites
    const companiesWithWebsites = companies.filter(company => 
      company.website && company.website.trim() !== ''
    );

    console.log(`${companiesWithWebsites.length} companies have websites`);

    // Scrape logos
    const results = await LogoScraper.scrapeCompanyLogos(companiesWithWebsites);
    
    const summary = {
      total: companies.length,
      withWebsites: companiesWithWebsites.length,
      logosFound: results.filter(r => r.logoUrl).length,
      logosSaved: results.filter(r => r.saved).length,
      errors: results.filter(r => r.error).length
    };

    console.log('Logo scraping summary:', summary);

    return NextResponse.json({
      message: 'Logo scraping completed',
      summary,
      results: results.slice(0, 10) // Return first 10 results as sample
    });

  } catch (error) {
    console.error('Logo scraping error:', error);
    return NextResponse.json(
      { error: 'Failed to scrape logos' },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Logo scraping API ready. Use POST to start scraping.',
    endpoint: '/api/scrape-logos'
  });
}