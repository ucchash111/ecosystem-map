// scripts/cache-logos.js
const fs = require('fs/promises');
const path = require('path');
const { google } = require('googleapis');

async function loadEnvLocal() {
	try {
		const envPath = path.join(process.cwd(), '.env.local');
		const content = await fs.readFile(envPath, 'utf8');
		for (const line of content.split(/\r?\n/)) {
			const trimmed = line.trim();
			if (!trimmed || trimmed.startsWith('#')) continue;
			const eq = trimmed.indexOf('=');
			if (eq === -1) continue;
			const key = trimmed.slice(0, eq).trim();
			const value = trimmed.slice(eq + 1).trim();
			if (!(key in process.env)) {
				process.env[key] = value;
			}
		}
	} catch {
		// ignore if missing
	}
}

function parseArgs(argv) {
	const args = { limit: undefined };
	for (const arg of argv.slice(2)) {
		if (arg.startsWith('--limit=')) {
			const v = parseInt(arg.split('=')[1] || '0', 10);
			if (!Number.isNaN(v) && v > 0) args.limit = Math.max(1, Math.min(5000, v));
		}
	}
	return args;
}

function extractHostname(url) {
	try {
		const clean = String(url || '').trim().replace(/^https?:\/\//i, '').replace(/^www\./i, '');
		const match = clean.match(/^([a-z0-9.-]+)\b/i);
		return match ? match[1].toLowerCase() : null;
	} catch {
		return null;
	}
}

async function getSheetRows(sheetId) {
    const sheets = google.sheets({ version: 'v4', auth: process.env.GOOGLE_SHEETS_API_KEY });
    const response = await sheets.spreadsheets.values.get({ spreadsheetId: sheetId, range: 'A:Z' });
    const rows = response.data.values || [];
    if (rows.length === 0) return [];
    const headers = rows[0].map((h) => String(h || '').toLowerCase().trim());
    const dataRows = rows.slice(1);
    return dataRows.map((row) => {
        const item = {};
        headers.forEach((h, i) => {
            item[h] = row[i] || '';
        });
        return {
            name: item.name || item.organization || item.organisation || item.company || item.org || '',
            website: item.website || item.url || item.link || '',
            logo_url: item.logo_url || item.logo || '',
        };
    }).filter((x) => (x.name || '').trim() !== '');
}

async function ensureDir(p) {
    await fs.mkdir(p, { recursive: true });
}

async function fileExists(p) {
    try {
        await fs.access(p);
        return true;
    } catch {
        return false;
    }
}

async function saveFavicon(hostname, logosDir) {
    const url = `https://www.google.com/s2/favicons?domain=${hostname}&sz=64`;
    const res = await fetch(url, { cache: 'no-store' });
    if (!res.ok) throw new Error(`fetch ${res.status}`);
    const buf = Buffer.from(await res.arrayBuffer());
    if (buf.length === 0) throw new Error('empty favicon');
    const target = path.join(logosDir, `${hostname}.png`);
    await fs.writeFile(target, buf);
    return target;
}

async function main() {
	await loadEnvLocal();
	const { limit } = parseArgs(process.argv);
	const sheetId = process.env.GOOGLE_SHEET_ID;
	if (!sheetId) {
		console.error('GOOGLE_SHEET_ID is not set');
		process.exit(1);
	}
	if (!process.env.GOOGLE_SHEETS_API_KEY) {
		console.error('GOOGLE_SHEETS_API_KEY is not set');
		process.exit(1);
	}

    const logosDir = path.join(process.cwd(), 'public', 'logos');
	await ensureDir(logosDir);

	const rows = await getSheetRows(sheetId);
	let processed = 0;
	let saved = 0;
	let skipped = 0;
	let errors = 0;

	// simple concurrency control
    const concurrency = 6;
	const queue = [...rows];
	const workers = Array.from({ length: concurrency }, async () => {
		while (queue.length) {
			if (limit && processed >= limit) break;
			const row = queue.shift();
			if (!row) break;
			processed += 1;
			const hostname = extractHostname(row.website);
			if (!hostname) { skipped += 1; continue; }
			const target = path.join(logosDir, `${hostname}.png`);
			if (await fileExists(target)) { skipped += 1; continue; }
			try {
				await saveFavicon(hostname, logosDir);
				saved += 1;
			} catch (e) {
				errors += 1;
			}
		}
	});

	await Promise.all(workers);
	console.log(JSON.stringify({ processed, saved, skipped, errors }, null, 2));
}

main().catch((err) => {
	console.error(err);
	process.exit(1);
});
