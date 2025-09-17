// scripts/report-needs-sourcing.js
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
      category: item.category || item.type || "",
    };
  });
}

async function main() {
  await loadEnvLocal();
  const sheetId = process.env.GOOGLE_SHEET_ID;
  if (!sheetId || !process.env.GOOGLE_SHEETS_API_KEY) {
    console.error("Missing GOOGLE_SHEET_ID or GOOGLE_SHEETS_API_KEY");
    process.exit(1);
  }
  const rows = await getSheetRows(sheetId);

  const needs = rows.filter(
    (r) => !String(r.logo_url || "").trim() && !String(r.website || "").trim()
  );

  const header = "name,category,website,logo_url\n";
  const csv =
    header +
    needs
      .map((r) =>
        [r.name, r.category, r.website, r.logo_url]
          .map((v) => '"' + String(v || "").replace(/"/g, '""') + '"')
          .join(",")
      )
      .join("\n");

  const outPath = path.join(process.cwd(), "needs-sourcing.csv");
  await fs.writeFile(outPath, csv, "utf8");
  console.log(csv);
  console.error(`\nWrote ${needs.length} rows to ${outPath}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
