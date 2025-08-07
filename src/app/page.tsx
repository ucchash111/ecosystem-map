import { GoogleSheetsService, EcosystemData } from '@/lib/googleSheets';
import MarketMap from '@/components/MarketMap';

async function getSheetData(): Promise<EcosystemData[]> {
  try {
    const sheetId = process.env.GOOGLE_SHEET_ID;
    if (!sheetId) {
      console.error('GOOGLE_SHEET_ID not configured');
      return [];
    }

    const googleSheetsService = new GoogleSheetsService();
    return await googleSheetsService.getSheetData(sheetId);
  } catch (error) {
    console.error('Failed to fetch sheet data:', error);
    return [];
  }
}

export default async function Home() {
  const data = await getSheetData();
  
  return <MarketMap companies={data} />;
}
