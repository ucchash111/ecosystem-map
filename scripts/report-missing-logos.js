// scripts/report-missing-logos.js
const fs = require("fs/promises");
const path = require("path");
const { google } = require("googleapis");

async function loadEnvLocal() {
  try {
    const envPath = path.join(process.cwd(), ".env.local");
    const content = await fs.readFile(envPath, "utf8");
    for (const line of content.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eq = trimmed.indexOf("=");
      if (eq === -1) continue;
      const key = trimmed.slice(0, eq).trim();
      const value = trimmed.slice(eq + 1).trim();
      if (!(key in process.env)) process.env[key] = value;
    }
  } catch {}
}

function extractHostname(website) {
  try {
    const raw = String(website || "").trim();
    if (!raw) return null;
    const candidates = raw
      .split(/\s+|,|;|\||\bor\b/gi)
      .map((t) => t.trim())
      .filter(Boolean);
    for (const cand of candidates) {
      let candidate = cand;
      if (!/^https?:\/\//i.test(candidate)) candidate = `https://${candidate}`;
      try {
        const u = new URL(candidate);
        const host = u.hostname.replace(/^www\./i, "").toLowerCase();
        if (/^[a-z0-9.-]+\.[a-z]{2,}$/i.test(host)) return host;
      } catch {}
      const match = cand
        .replace(/^https?:\/\//i, "")
        .replace(/^www\./i, "")
        .match(/^([a-z0-9.-]+)\b/i);
      if (match && /\./.test(match[1])) return match[1].toLowerCase();
    }
    return null;
  } catch {
    return null;
  }
}

async function getSheetRows(sheetId) {
  const sheets = google.sheets({
    version: "v4",
    auth: process.env.GOOGLE_SHEETS_API_KEY,
  });
  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: sheetId,
    range: "A:Z",
  });
  const rows = response.data.values || [];
  if (rows.length === 0) return [];
  const headers = rows[0].map((h) =>
    String(h || "")
      .toLowerCase()
      .trim()
  );
  return rows.slice(1).map((row) => {
    const item = {};
    headers.forEach((h, i) => (item[h] = row[i] || ""));
    return {
      name:
        item.name ||
        item.organization ||
        item.organisation ||
        item.company ||
        item.org ||
        "",
      website: item.website || item.url || item.link || "",
      logo_url: item.logo_url || item.logo || "",
    };
  });
}

function slugifyName(name) {
  return (
    String(name || "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-+|-+$)/g, "") || "logo"
  );
}

function makeShortHash(input) {
  const s = String(input || "");
  let hash = 5381;
  for (let i = 0; i < s.length; i++) {
    hash = ((hash << 5) + hash) ^ s.charCodeAt(i);
    hash |= 0;
  }
  const hex = (hash >>> 0).toString(16);
  return hex.padStart(8, "0").slice(-8);
}

function deriveRowKey(row) {
  const slug = slugifyName(row.name);
  const fingerprint = `${row.name}|${row.website}|${row.logo_url}`;
  const short = makeShortHash(fingerprint);
  return `${slug}-${short}`;
}

async function listExistingBases(logosDir) {
  try {
    const files = await fs.readdir(logosDir);
    return new Set(
      files
        .filter((f) => f.toLowerCase().endsWith(".png"))
        .map((f) => f.replace(/\.png$/i, ""))
    );
  } catch {
    return new Set();
  }
}

async function main() {
  await loadEnvLocal();
  const sheetId = process.env.GOOGLE_SHEET_ID;
  if (!sheetId || !process.env.GOOGLE_SHEETS_API_KEY) {
    console.error("Missing GOOGLE_SHEET_ID or GOOGLE_SHEETS_API_KEY");
    process.exit(1);
  }
  const rows = (await getSheetRows(sheetId)).filter(
    (r) => String(r.name || "").trim() !== ""
  );
  const logosDir = path.join(process.cwd(), "public", "logos");
  const existingBases = await listExistingBases(logosDir);

  // Build base -> rows mapping using per-row keys
  const baseToRows = new Map();
  const withAny = rows.slice();
  for (const row of withAny) {
    const base = deriveRowKey(row);
    if (!baseToRows.has(base)) baseToRows.set(base, []);
    baseToRows.get(base).push(row);
  }

  // Determine which bases are missing local PNGs (unique bases only)
  const missingBases = [];
  for (const base of baseToRows.keys()) {
    if (!existingBases.has(base)) missingBases.push(base);
  }

  // Expand to rows for CSV output
  const missing = [];
  for (const base of missingBases) {
    const list = baseToRows.get(base) || [];
    for (const row of list) {
      missing.push({
        name: row.name,
        website: row.website,
        logo_url: row.logo_url,
        output: `public/logos/${base}.png`,
      });
    }
  }

  // Duplicates: bases that map to multiple sheet rows
  const duplicates = [];
  for (const [base, list] of baseToRows.entries()) {
    if (list.length > 1) {
      for (const row of list) {
        duplicates.push({
          base,
          name: row.name,
          website: row.website,
          logo_url: row.logo_url,
          output: `public/logos/${base}.png`,
        });
      }
    }
  }

  // Output CSVs
  const header = "name,website,logo_url,output_path\n";
  const csv =
    header +
    missing
      .map((r) =>
        [r.name, r.website, r.logo_url, r.output]
          .map((v) => '"' + String(v || "").replace(/"/g, '""') + '"')
          .join(",")
      )
      .join("\n");
  const outPath = path.join(process.cwd(), "missing-logos.csv");
  await fs.writeFile(outPath, csv, "utf8");
  console.log(csv);

  const dupHeader = "base,name,website,logo_url,output_path\n";
  const dupCsv =
    dupHeader +
    duplicates
      .map((r) =>
        [r.base, r.name, r.website, r.logo_url, r.output]
          .map((v) => '"' + String(v || "").replace(/"/g, '""') + '"')
          .join(",")
      )
      .join("\n");
  const dupPath = path.join(process.cwd(), "duplicate-logo-bases.csv");
  await fs.writeFile(dupPath, dupCsv, "utf8");

  // Summary (clear, consistent counts)
  const summary = {
    totalRows: rows.length,
    withLogoUrl: rows.filter((r) => r.logo_url && String(r.logo_url).trim())
      .length,
    uniqueBasesWithLogoUrl: baseToRows.size,
    existingLocalPngBases: existingBases.size,
    missingLocalPngBases: missingBases.length,
    missingRowsExpanded: missing.length,
    duplicateBasesCount: Array.from(baseToRows.values()).filter(
      (l) => l.length > 1
    ).length,
  };
  console.error(`\nSummary: ${JSON.stringify(summary, null, 2)}`);
  console.error(`Wrote ${missing.length} rows to ${outPath}`);
  console.error(`Wrote ${duplicates.length} rows to ${dupPath}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
