import MarketMap from '@/components/MarketMap';
import { GoogleSheetsService } from '@/lib/googleSheets';
import { Metadata } from 'next';

// Cache for 5 minutes to improve performance
export const revalidate = 300;

export const metadata: Metadata = {
  title: "Bangladesh Startup Ecosystem Map | Discover Innovation & Opportunities",
  description: "Interactive map of Bangladesh's startup ecosystem featuring 500+ companies across fintech, e-commerce, healthtech, edtech, and emerging sectors. Connect with entrepreneurs and investors.",
};

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
