import MarketMap from '@/components/MarketMap';
import { GoogleSheetsService } from '@/lib/googleSheets';

// Force dynamic rendering to get fresh data
export const dynamic = 'force-dynamic';
export const revalidate = 0;

async function getSheetData() {
  try {
    const sheetId = process.env.GOOGLE_SHEET_ID;
    if (!sheetId) {
      throw new Error('GOOGLE_SHEET_ID is not set');
    }
    const service = new GoogleSheetsService();
    return await service.getSheetData(sheetId);
  } catch (error) {
    console.error('Failed to fetch sheet data:', error);
    return [];
  }
}

export default async function Home() {
  const data = await getSheetData();
  return <MarketMap companies={data} />;
}
