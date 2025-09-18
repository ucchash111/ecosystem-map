const fs = require('fs');
const path = require('path');
const { google } = require('googleapis');

function loadEnv() {
  try {
    const env = fs.readFileSync(path.join(process.cwd(), '.env.local'), 'utf8');
    env.split(/\r?\n/).forEach(l => {
      l = l.trim(); if (!l || l.startsWith('#')) return;
      const i = l.indexOf('='); if (i < 0) return;
      const k = l.slice(0,i).trim(); const v = l.slice(i+1).trim();
      if (!(k in process.env)) process.env[k] = v;
    });
  } catch {}
}

function getHostFromWebsite(website) {
  const site = String(website || '').trim();
  if (!site) return null;
  const match = site.match(/([a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/);
  if (match) {
    const hostname = match[1].replace(/^https?:\/\//, '').replace(/^www\./, '').toLowerCase();
    return hostname;
  }
  return null;
}

function slugifyName(name) {
  const s = String(name || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-+|-+$)/g, '');
  return s || 'logo';
}

function isTierOne(tier) {
  const v = String(tier || '').trim().toLowerCase();
  return v === '1' || v === 'tier 1' || v === 'tier1' || v === 't1';
}

function isGenericHost(host) {
  if (!host) return false;
  const re = /^(facebook\.com|.*linkedin\.com|media\.licdn\.com|scontent\.|drive\.google\.com|.*googleusercontent\.com|dropbox\.com|.*dropboxusercontent\.com|.*\.framer\.ai)$/i;
  return re.test(host);
}

function getBaseKey(row) {
  const websiteHost = getHostFromWebsite(row.website);
  const effectiveHost = websiteHost;
  if (effectiveHost && isGenericHost(effectiveHost)) return slugifyName(row.name);
  return effectiveHost || slugifyName(row.name);
}

async function getSheetRows(sheetId, apiKey) {
  const sheets = google.sheets({ version: 'v4', auth: apiKey });
  const res = await sheets.spreadsheets.values.get({ spreadsheetId: sheetId, range: 'A:Z' });
  const rows = res.data.values || [];
  if (rows.length === 0) return [];
  const headers = rows[0].map(h => String(h || '').toLowerCase().trim());
  return rows.slice(1).map(r => {
    const it = {}; headers.forEach((h,i)=> it[h] = r[i] || '');
    return {
      name: it.name || it.organization || it.organisation || it.company || it.org || '',
      website: it.website || it.url || it.link || '',
      logo_url: it.logo_url || it.logo || '',
      category: it.category || it.type || it.sector || it.group || '',
      tier: it.tier || ''
    };
  }).filter(x => String(x.name || '').trim() !== '');
}

(async () => {
  loadEnv();
  const sheetId = process.env.GOOGLE_SHEET_ID;
  const apiKey = process.env.GOOGLE_SHEETS_API_KEY;
  if (!sheetId || !apiKey) {
    console.error('Missing GOOGLE_SHEET_ID or GOOGLE_SHEETS_API_KEY');
    process.exit(1);
  }
  const rows = await getSheetRows(sheetId, apiKey);
  const total = rows.length;
  const tierOne = rows.filter(r => isTierOne(r.tier));
  const seen = new Set();
  const unique = [];
  const collapsed = [];
  for (const r of tierOne) {
    const key = getBaseKey(r);
    if (seen.has(key)) {
      collapsed.push({ ...r, baseKey: key });
    } else {
      seen.add(key);
      unique.push({ ...r, baseKey: key });
    }
  }
  const report = {
    totalRows: total,
    tierOneRows: tierOne.length,
    uniqueAfterDedupe: unique.length,
    collapsedCount: collapsed.length,
  };
  console.log(JSON.stringify(report, null, 2));
  if (collapsed.length) {
    console.log('\nCollapsed (deduped away):');
    for (const c of collapsed.slice(0, 50)) {
      console.log(`- ${c.name} | ${c.website} | key=${c.baseKey}`);
    }
  }
})();
