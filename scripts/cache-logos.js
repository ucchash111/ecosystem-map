// scripts/cache-logos.js
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
      if (!(key in process.env)) {
        process.env[key] = value;
      }
    }
  } catch {
    // ignore if missing
  }
}

function parseArgs(argv) {
  const args = { limit: undefined, force: false, logoOnly: false };
  for (const arg of argv.slice(2)) {
    if (arg.startsWith("--limit=")) {
      const v = parseInt(arg.split("=")[1] || "0", 10);
      if (!Number.isNaN(v) && v > 0)
        args.limit = Math.max(1, Math.min(5000, v));
    }
    if (arg === "--force") {
      args.force = true;
    }
    if (arg === "--logo-only") {
      args.logoOnly = true;
    }
  }
  return args;
}

function extractHostname(website) {
  try {
    const raw = String(website || "").trim();
    if (!raw) return null;
    // Split on common separators or whitespace (handles "or", commas, etc.)
    const candidates = raw
      .split(/\s+|,|;|\||\bor\b/gi)
      .map((t) => t.trim())
      .filter(Boolean);
    for (const cand of candidates) {
      let candidate = cand;
      // If it looks like a URL path, try to build a URL
      if (!/^https?:\/\//i.test(candidate)) {
        candidate = `https://${candidate}`;
      }
      try {
        const u = new URL(candidate);
        const host = u.hostname.replace(/^www\./i, "").toLowerCase();
        if (/^[a-z0-9.-]+\.[a-z]{2,}$/i.test(host)) return host;
      } catch {
        // ignore and continue
      }
      // Fallback simple domain extraction
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
  const dataRows = rows.slice(1);
  return dataRows
    .map((row) => {
      const item = {};
      headers.forEach((h, i) => {
        item[h] = row[i] || "";
      });
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
    })
    .filter((x) => (x.name || "").trim() !== "");
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
  const res = await fetch(url, {
    cache: "no-store",
    headers: { "User-Agent": "Mozilla/5.0 (compatible; LogoCache/1.0)" },
    redirect: "follow",
  });
  if (!res.ok) throw new Error(`fetch ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());
  if (buf.length === 0) throw new Error("empty favicon");
  const target = path.join(logosDir, `${hostname}.png`);
  try {
    await sharp(buf).png({ quality: 90 }).toFile(target);
  } catch {
    await fs.writeFile(target, buf);
  }
  return target;
}

// Save favicon content but write to a per-row base (unique) filename instead of hostname
async function saveFaviconToBase(hostname, base, logosDir) {
  const url = `https://www.google.com/s2/favicons?domain=${hostname}&sz=64`;
  const res = await fetch(url, {
    cache: "no-store",
    headers: { "User-Agent": "Mozilla/5.0 (compatible; LogoCache/1.0)" },
    redirect: "follow",
  });
  if (!res.ok) throw new Error(`fetch ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());
  if (buf.length === 0) throw new Error("empty favicon");
  const target = path.join(logosDir, `${base}.png`);
  try {
    await sharp(buf).png({ quality: 90 }).toFile(target);
  } catch {
    await fs.writeFile(target, buf);
  }
  return target;
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

function extFromContentType(ct) {
  if (!ct) return null;
  const mime = String(ct).toLowerCase();
  if (mime.includes("image/png")) return "png";
  if (mime.includes("image/svg")) return "svg";
  if (mime.includes("image/jpeg") || mime.includes("image/jpg")) return "jpg";
  if (mime.includes("image/webp")) return "webp";
  if (mime.includes("image/gif")) return "gif";
  return null;
}

function extFromUrl(url) {
  try {
    const u = new URL(url);
    const m = u.pathname.match(/\.([a-zA-Z0-9]+)$/);
    if (!m) return null;
    const ext = m[1].toLowerCase();
    if (["png", "svg", "jpg", "jpeg", "webp", "gif"].includes(ext))
      return ext === "jpeg" ? "jpg" : ext;
    return null;
  } catch {
    return null;
  }
}

async function saveFromLogoUrl(logoUrl, base, logosDir) {
  const normalized = normalizeLogoUrl(logoUrl);
  const res = await fetch(normalized, {
    cache: "no-store",
    headers: { "User-Agent": "Mozilla/5.0 (compatible; LogoCache/1.0)" },
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
  return target;
}

function normalizeLogoUrl(url) {
  try {
    const u = new URL(url);
    // Google Drive file page -> direct download
    if (u.hostname.includes("drive.google.com")) {
      const m = u.pathname.match(/\/d\/([^/]+)/);
      if (m && m[1])
        return `https://drive.google.com/uc?export=download&id=${m[1]}`;
    }
    // Dropbox share -> direct download
    if (u.hostname.includes("dropbox.com")) {
      u.searchParams.set("dl", "1");
      return u.toString();
    }
    return url;
  } catch {
    return url;
  }
}

function isGenericHost(host) {
  const h = String(host || "").toLowerCase();
  if (h === "facebook.com") return true;
  if (
    h === "linkedin.com" ||
    h.endsWith(".linkedin.com") ||
    h === "media.licdn.com"
  )
    return true;
  if (h.startsWith("scontent.")) return true;
  if (h === "drive.google.com" || h.endsWith(".googleusercontent.com"))
    return true;
  if (h === "dropbox.com" || h.endsWith(".dropboxusercontent.com")) return true;
  if (h.endsWith(".framer.ai")) return true;
  return false;
}

async function main() {
  await loadEnvLocal();
  const { limit, force, logoOnly } = parseArgs(process.argv);
  const sheetId = process.env.GOOGLE_SHEET_ID;
  if (!sheetId) {
    console.error("GOOGLE_SHEET_ID is not set");
    process.exit(1);
  }
  if (!process.env.GOOGLE_SHEETS_API_KEY) {
    console.error("GOOGLE_SHEETS_API_KEY is not set");
    process.exit(1);
  }

  const logosDir = path.join(process.cwd(), "public", "logos");
  await ensureDir(logosDir);

  const rows = await getSheetRows(sheetId);
  let processed = 0;
  let saved = 0;
  let skipped = 0;
  let errors = 0;
  let skippedExists = 0;
  let skippedNoHost = 0;
  let savedFromLogoUrl = 0;
  let savedFromFavicon = 0;

  // simple concurrency control
  const concurrency = 6;
  const queue = [...rows];
  const workers = Array.from({ length: concurrency }, async () => {
    while (queue.length) {
      if (limit && processed >= limit) break;
      const row = queue.shift();
      if (!row) break;
      processed += 1;
      const base = deriveRowKey(row);
      // Skip if any of common extensions exist and not forcing
      if (!force) {
        const exts = ["png", "svg", "jpg", "webp", "gif"];
        let existsAny = false;
        for (const ext of exts) {
          if (await fileExists(path.join(logosDir, `${base}.${ext}`))) {
            existsAny = true;
            break;
          }
        }
        if (existsAny) {
          skipped += 1;
          skippedExists += 1;
          continue;
        }
      }
      try {
        const hasLogoUrl = row.logo_url && String(row.logo_url).trim();
        if (hasLogoUrl) {
          try {
            await saveFromLogoUrl(String(row.logo_url).trim(), base, logosDir);
            saved += 1;
            savedFromLogoUrl += 1;
            continue;
          } catch (_) {
            // If logo fetch fails, we DO NOT use favicon. We write a placeholder instead.
          }
        }

        if (!logoOnly) {
          // Generate placeholder PNG to guarantee 1:1 coverage (no favicon fallback)
          const target = path.join(logosDir, `${base}.png`);
          const buf = Buffer.from(
            await sharp({
              create: {
                width: 64,
                height: 64,
                channels: 3,
                background: "#e2e8f0",
              },
            })
              .png()
              .toBuffer()
          );
          await fs.writeFile(target, buf);
          saved += 1;
        } else {
          skipped += 1; // logo-only mode and no usable logo_url
        }
      } catch (e) {
        errors += 1;
      }
    }
  });

  await Promise.all(workers);
  console.log(
    JSON.stringify(
      {
        processed,
        saved,
        savedFromLogoUrl,
        savedFromFavicon,
        skipped,
        skippedExists,
        skippedNoHost,
        errors,
      },
      null,
      2
    )
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
