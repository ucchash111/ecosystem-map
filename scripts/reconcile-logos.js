// scripts/reconcile-logos.js
const fs = require("fs/promises");
const path = require("path");
const { google } = require("googleapis");
const sharp = require("sharp");

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
  return rows
    .slice(1)
    .map((row) => {
      const item = {};
      headers.forEach((h, i) => (item[h] = row[i] || ""));
      // Normalize website to include scheme to keep hashing stable with UI/API logic
      let website = item.website || item.url || item.link || "";
      website = String(website || "").trim();
      if (website && !/^https?:\/\//i.test(website)) {
        website = `https://${website}`;
      }
      return {
        name:
          item.name ||
          item.organization ||
          item.organisation ||
          item.company ||
          item.org ||
          "",
        website,
        logo_url: item.logo_url || item.logo || "",
      };
    })
    .filter((x) => (x.name || "").trim() !== "");
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
  const nameTrim = String(row.name || "").trim();
  const websiteTrim = String(row.website || "").trim();
  const logoUrlTrim = String(row.logo_url || "").trim();
  const slug = slugifyName(nameTrim);
  const fingerprint = `${nameTrim}|${websiteTrim}|${logoUrlTrim}`;
  const short = makeShortHash(fingerprint);
  return `${slug}-${short}`;
}

function normalizeLogoUrl(url) {
  try {
    const u = new URL(url);
    if (u.hostname.includes("drive.google.com")) {
      const m = u.pathname.match(/\/d\/([^/]+)/);
      if (m && m[1])
        return `https://drive.google.com/uc?export=download&id=${m[1]}`;
    }
    if (u.hostname.includes("dropbox.com")) {
      u.searchParams.set("dl", "1");
      return u.toString();
    }
    return url;
  } catch {
    return url;
  }
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

async function saveFromLogoUrl(logoUrl, base, logosDir) {
  const normalized = normalizeLogoUrl(logoUrl);
  const res = await fetch(normalized, {
    cache: "no-store",
    headers: { "User-Agent": "Mozilla/5.0 (compatible; LogoReconcile/1.0)" },
    redirect: "follow",
  });
  if (!res.ok) throw new Error(`fetch ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());
  if (buf.length === 0) throw new Error("empty");
  const target = path.join(logosDir, `${base}.png`);
  try {
    await sharp(buf).png({ quality: 90 }).toFile(target);
  } catch {
    await fs.writeFile(target, buf);
  }
}

async function writePlaceholder(base, logosDir) {
  const target = path.join(logosDir, `${base}.png`);
  const buf = Buffer.from(
    await sharp({
      create: { width: 64, height: 64, channels: 3, background: "#e2e8f0" },
    })
      .png()
      .toBuffer()
  );
  await fs.writeFile(target, buf);
}

async function main() {
  await loadEnvLocal();
  const sheetId = process.env.GOOGLE_SHEET_ID;
  if (!sheetId || !process.env.GOOGLE_SHEETS_API_KEY) {
    console.error("Missing GOOGLE_SHEET_ID or GOOGLE_SHEETS_API_KEY");
    process.exit(1);
  }

  const rows = await getSheetRows(sheetId);
  const expected = rows.map((r) => ({ row: r, base: deriveRowKey(r) }));
  const expectedSet = new Set(expected.map((x) => x.base));

  const logosDir = path.join(process.cwd(), "public", "logos");
  const archiveDir = path.join(logosDir, "_archive");
  await ensureDir(logosDir);
  await ensureDir(archiveDir);

  const files = (await fs.readdir(logosDir)).filter((f) =>
    f.toLowerCase().endsWith(".png")
  );
  const existingBases = new Set(files.map((f) => f.replace(/\.png$/i, "")));

  let created = 0;
  let placeholders = 0;
  let movedToArchive = 0;
  let errors = 0;

  // Create missing expected files
  for (const { row, base } of expected) {
    if (existingBases.has(base)) continue;
    try {
      const hasLogoUrl = row.logo_url && String(row.logo_url).trim();
      if (hasLogoUrl) {
        try {
          await saveFromLogoUrl(String(row.logo_url).trim(), base, logosDir);
          created += 1;
          continue;
        } catch {}
      }
      await writePlaceholder(base, logosDir);
      placeholders += 1;
    } catch {
      errors += 1;
    }
  }

  // Move extras to archive (not delete) to reach exact set
  for (const f of files) {
    const base = f.replace(/\.png$/i, "");
    if (!expectedSet.has(base)) {
      try {
        await fs.rename(path.join(logosDir, f), path.join(archiveDir, f));
        movedToArchive += 1;
      } catch {
        errors += 1;
      }
    }
  }

  const finalFiles = (await fs.readdir(logosDir)).filter((f) =>
    f.toLowerCase().endsWith(".png")
  );
  const summary = {
    expected: expected.length,
    existingBefore: existingBases.size,
    created,
    placeholders,
    movedToArchive,
    errors,
    finalCount: finalFiles.length,
  };
  console.log(JSON.stringify(summary, null, 2));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
