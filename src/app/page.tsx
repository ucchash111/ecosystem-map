import MarketMap from '@/components/MarketMap';

// Force dynamic rendering to get fresh data
export const dynamic = 'force-dynamic';
export const revalidate = 0;

async function getSheetData() {
  try {
    // Use absolute URL for server-side fetch
    const baseUrl = process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000';
    const response = await fetch(`${baseUrl}/api/sheet-data`, {
      cache: 'no-store', // Ensure no caching
      headers: {
        'Cache-Control': 'no-cache'
      }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Failed to fetch sheet data:', error);
    return [];
  }
}

export default async function Home() {
  const data = await getSheetData();
  
  return <MarketMap companies={data} />;
}
