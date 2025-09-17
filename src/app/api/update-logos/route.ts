import { NextResponse } from 'next/server';
import { GoogleSheetsService } from '@/lib/googleSheets';
import fs from 'fs/promises';
import path from 'path';

function extractHostname(url: string): string | null {
  try {
    const clean = url.replace(/^https?:\/\//i, '').replace(/^www\./i, '');
    const match = clean.match(/^([a-z0-9.-]+)\b/i);
    return match ? match[1].toLowerCase() : null;
  } catch {
    return null;
  }
}

export async function POST(req: Request) {
  try {
    const url = new URL(req.url);
    const limitParam = url.searchParams.get('limit');
    const limit = limitParam ? Math.max(1, Math.min(1000, parseInt(limitParam))) : undefined;

    const sheetId = process.env.GOOGLE_SHEET_ID;
    if (!sheetId) {
      return NextResponse.json({ error: 'GOOGLE_SHEET_ID not configured' }, { status: 500 });
    }

    const service = new GoogleSheetsService();
    const data = await service.getSheetData(sheetId);

    const logosDir = path.join(process.cwd(), 'public', 'logos');
    await fs.mkdir(logosDir, { recursive: true });

    let processed = 0;
    let skipped = 0;
    let saved = 0;
    const errors: Array<{ name: string; reason: string }> = [];

    for (const company of data) {
      if (limit && processed >= limit) break;
      processed += 1;

      const website = (company.website || '').trim();
      const hostname = extractHostname(website);
      if (!hostname) {
        skipped += 1;
        continue;
      }

      const target = path.join(logosDir, `${hostname}.png`);
      try {
        // Skip if already exists
        await fs.access(target).then(() => { skipped += 1; throw new Error('exists'); }).catch((e) => { if (e.message === 'exists') throw e; });
      } catch (e) {
        if ((e as Error).message === 'exists') continue;
      }

      const faviconUrl = `https://www.google.com/s2/favicons?domain=${hostname}&sz=64`;
      try {
        const res = await fetch(faviconUrl, { cache: 'no-store' });
        if (!res.ok) throw new Error(`fetch ${res.status}`);
        const buf = Buffer.from(await res.arrayBuffer());
        if (buf.length === 0) throw new Error('empty');
        await fs.writeFile(target, buf);
        saved += 1;
      } catch (err) {
        errors.push({ name: company.name, reason: (err as Error).message });
      }
    }

    return NextResponse.json({ processed, saved, skipped, errorsCount: errors.length });
  } catch (error) {
    console.error('update-logos error:', error);
    return NextResponse.json({ error: 'Failed to update logos' }, { status: 500 });
  }
}


