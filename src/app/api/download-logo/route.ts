import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { LogoManager } from '@/lib/logoManager';

// Queue for managing downloads
const downloadQueue: Set<string> = new Set();
let isProcessing = false;

async function extractLogoFromWebsite(websiteUrl: string): Promise<string | null> {
  try {
    const response = await fetch(websiteUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      },
      signal: AbortSignal.timeout(10000) // 10 second timeout
    });
    
    if (!response.ok) return null;
    
    const html = await response.text();
    const url = new URL(websiteUrl);
    const baseUrl = `${url.protocol}//${url.hostname}`;
    
    // Try to find logo in HTML
    const logoPatterns = [
      // Meta property logos
      /<meta[^>]+property="og:image"[^>]+content="([^"]+)"/i,
      // Common logo selectors
      /<img[^>]+(?:class|id|alt)="[^"]*logo[^"]*"[^>]+src="([^"]+)"/i,
      /<img[^>]+src="([^"]+)"[^>]+(?:class|id|alt)="[^"]*logo[^"]*"/i,
      // Brand/header images
      /<img[^>]+(?:class|id)="[^"]*brand[^"]*"[^>]+src="([^"]+)"/i,
      /<img[^>]+src="([^"]+)"[^>]+(?:class|id)="[^"]*brand[^"]*"/i,
      // Header logo patterns
      /<header[^>]*>[\s\S]*?<img[^>]+src="([^"]+)"[^>]*>[\s\S]*?<\/header>/i,
    ];
    
    for (const pattern of logoPatterns) {
      const match = html.match(pattern);
      if (match && match[1]) {
        let logoUrl = match[1];
        
        // Convert relative URLs to absolute
        if (logoUrl.startsWith('//')) {
          logoUrl = url.protocol + logoUrl;
        } else if (logoUrl.startsWith('/')) {
          logoUrl = baseUrl + logoUrl;
        } else if (!logoUrl.startsWith('http')) {
          logoUrl = baseUrl + '/' + logoUrl;
        }
        
        // Skip very small images (likely not logos)
        if (logoUrl.includes('favicon') && !logoUrl.includes('32') && !logoUrl.includes('64')) {
          continue;
        }
        
        return logoUrl;
      }
    }
    
    // Fallback: try common logo paths
    const commonPaths = [
      '/logo.png', '/logo.svg', '/assets/logo.png', 
      '/images/logo.png', '/img/logo.png', '/static/logo.png'
    ];
    
    for (const logoPath of commonPaths) {
      try {
        const logoResponse = await fetch(baseUrl + logoPath, { 
          method: 'HEAD',
          signal: AbortSignal.timeout(5000)
        });
        if (logoResponse.ok) {
          return baseUrl + logoPath;
        }
      } catch {
        continue;
      }
    }
    
    return null;
  } catch (error) {
    console.error(`Error extracting logo from ${websiteUrl}:`, error);
    return null;
  }
}

async function downloadImage(imageUrl: string, outputPath: string): Promise<boolean> {
  try {
    const response = await fetch(imageUrl, {
      signal: AbortSignal.timeout(15000)
    });
    
    if (!response.ok) return false;
    
    const buffer = await response.arrayBuffer();
    
    // Ensure directory exists
    const dir = path.dirname(outputPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    
    fs.writeFileSync(outputPath, Buffer.from(buffer));
    return true;
  } catch (error) {
    console.error(`Error downloading image ${imageUrl}:`, error);
    return false;
  }
}

async function processDownloadQueue() {
  if (isProcessing || downloadQueue.size === 0) return;
  
  isProcessing = true;
  
  const urlsToProcess = Array.from(downloadQueue).slice(0, 5); // Process 5 at a time
  
  for (const websiteUrl of urlsToProcess) {
    try {
      downloadQueue.delete(websiteUrl);
      
      // Skip if already exists (create server-side check)
      const filename = LogoManager.urlToFilename(websiteUrl);
      const logoPath = path.join(process.cwd(), 'public', 'logos', filename);
      if (fs.existsSync(logoPath)) continue;
      
      console.log(`Processing logo download for: ${websiteUrl}`);
      
      const logoUrl = await extractLogoFromWebsite(websiteUrl);
      if (logoUrl) {
        const filename = LogoManager.urlToFilename(websiteUrl);
        const outputPath = path.join(process.cwd(), 'public', 'logos', filename);
        
        const success = await downloadImage(logoUrl, outputPath);
        if (success) {
          console.log(`Successfully downloaded logo for ${websiteUrl}`);
        } else {
          console.log(`Failed to download logo from ${logoUrl} for ${websiteUrl}`);
        }
      } else {
        console.log(`No logo found for ${websiteUrl}`);
      }
      
      // Small delay between downloads
      await new Promise(resolve => setTimeout(resolve, 500));
      
    } catch (error) {
      console.error(`Error processing ${websiteUrl}:`, error);
    }
  }
  
  isProcessing = false;
  
  // Continue processing if more items in queue
  if (downloadQueue.size > 0) {
    setTimeout(processDownloadQueue, 1000);
  }
}

export async function POST(request: NextRequest) {
  try {
    const { url } = await request.json();
    
    if (!url) {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 });
    }
    
    // Add to queue
    downloadQueue.add(url);
    
    // Start processing if not already running
    setTimeout(processDownloadQueue, 100);
    
    return NextResponse.json({ success: true, message: 'Logo queued for download' });
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ error: 'Failed to queue logo download' }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ 
    queueSize: downloadQueue.size,
    isProcessing 
  });
}