import { NextResponse } from 'next/server';
import { SheetUpdater } from '@/lib/updateSheet';

export async function POST() {
  try {
    const sheetId = process.env.GOOGLE_SHEET_ID;
    
    if (!sheetId) {
      return NextResponse.json(
        { error: 'Google Sheet ID not configured' },
        { status: 500 }
      );
    }

    const updater = new SheetUpdater();
    
    // First add the Logo column if it doesn't exist
    const columnAdded = await updater.addLogoColumn(sheetId);
    if (!columnAdded) {
      return NextResponse.json(
        { error: 'Failed to add logo column' },
        { status: 500 }
      );
    }

    // Then populate the logos
    const logosPopulated = await updater.populateLogos(sheetId);
    if (!logosPopulated) {
      return NextResponse.json(
        { error: 'Failed to populate logos' },
        { status: 500 }
      );
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Logo column added and populated successfully' 
    });
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json(
      { error: 'Failed to update sheet' },
      { status: 500 }
    );
  }
}