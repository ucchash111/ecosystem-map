const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');
const { URL } = require('url');

// Fetch sheet data
async function fetchSheetData() {
    return new Promise((resolve, reject) => {
        const req = http.request('http://localhost:3000/api/sheet-data', { method: 'GET' }, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    resolve(JSON.parse(data));
                } catch (e) {
                    reject(e);
                }
            });
        });
        req.on('error', reject);
        req.end();
    });
}

// Extract domain from URL
function getDomain(url) {
    try {
        const parsedUrl = new URL(url);
        return parsedUrl.hostname.replace(/^www\./, '');
    } catch {
        return null;
    }
}

// Fetch webpage content
async function fetchWebpage(url) {
    return new Promise((resolve, reject) => {
        const client = url.startsWith('https') ? https : http;
        const req = client.request(url, { 
            timeout: 10000,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
        }, (res) => {
            if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
                return fetchWebpage(res.headers.location).then(resolve).catch(reject);
            }
            
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => resolve(data));
        });
        req.on('error', reject);
        req.on('timeout', () => {
            req.destroy();
            reject(new Error('Request timeout'));
        });
        req.end();
    });
}

// Extract logo URLs from HTML
function extractLogoUrls(html, baseUrl) {
    const logoSelectors = [
        'link[rel*="icon"]',
        'link[rel*="shortcut"]',
        'meta[property="og:image"]',
        'img[alt*="logo" i]',
        'img[class*="logo" i]',
        'img[id*="logo" i]',
        '.logo img',
        '#logo img',
        'header img'
    ];
    
    const urls = [];
    
    // Extract favicon and meta images
    const faviconMatch = html.match(/<link[^>]*rel=["'][^"']*icon[^"']*["'][^>]*>/gi);
    if (faviconMatch) {
        faviconMatch.forEach(match => {
            const hrefMatch = match.match(/href=["']([^"']+)["']/i);
            if (hrefMatch) urls.push(hrefMatch[1]);
        });
    }
    
    // Extract og:image
    const ogImageMatch = html.match(/<meta[^>]*property=["']og:image["'][^>]*>/gi);
    if (ogImageMatch) {
        ogImageMatch.forEach(match => {
            const contentMatch = match.match(/content=["']([^"']+)["']/i);
            if (contentMatch) urls.push(contentMatch[1]);
        });
    }
    
    // Extract logo images
    const imgMatches = html.match(/<img[^>]*>/gi) || [];
    imgMatches.forEach(match => {
        if (match.match(/(logo|brand)/i)) {
            const srcMatch = match.match(/src=["']([^"']+)["']/i);
            if (srcMatch) urls.push(srcMatch[1]);
        }
    });
    
    // Convert relative URLs to absolute
    return urls.map(url => {
        try {
            return new URL(url, baseUrl).href;
        } catch {
            return null;
        }
    }).filter(Boolean);
}

// Download image
async function downloadImage(imageUrl, filePath) {
    return new Promise((resolve, reject) => {
        const client = imageUrl.startsWith('https') ? https : http;
        const req = client.request(imageUrl, { timeout: 10000 }, (res) => {
            if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
                return downloadImage(res.headers.location, filePath).then(resolve).catch(reject);
            }
            
            if (res.statusCode !== 200) {
                return reject(new Error(`HTTP ${res.statusCode}`));
            }
            
            const fileStream = fs.createWriteStream(filePath);
            res.pipe(fileStream);
            
            fileStream.on('finish', () => {
                fileStream.close();
                resolve();
            });
            
            fileStream.on('error', reject);
        });
        
        req.on('error', reject);
        req.on('timeout', () => {
            req.destroy();
            reject(new Error('Request timeout'));
        });
        req.end();
    });
}

// Main function
async function extractLogos() {
    try {
        console.log('Fetching sheet data...');
        const companies = await fetchSheetData();
        
        console.log(`Found ${companies.length} companies`);
        
        // Ensure logos directory exists
        const logosDir = path.join(__dirname, 'public', 'logos');
        if (!fs.existsSync(logosDir)) {
            fs.mkdirSync(logosDir, { recursive: true });
        }
        
        const results = [];
        
        for (let i = 0; i < companies.length; i++) {
            const company = companies[i];
            const { name, website } = company;
            
            if (!website || !website.startsWith('http')) {
                console.log(`⚠️  Skipping ${name} - No valid website`);
                continue;
            }
            
            const domain = getDomain(website);
            if (!domain) {
                console.log(`⚠️  Skipping ${name} - Invalid domain`);
                continue;
            }
            
            console.log(`\n[${i + 1}/${companies.length}] Processing ${name} (${domain})`);
            
            try {
                // Fetch webpage
                console.log(`  Fetching ${website}`);
                const html = await fetchWebpage(website);
                
                // Extract logo URLs
                const logoUrls = extractLogoUrls(html, website);
                console.log(`  Found ${logoUrls.length} potential logos`);
                
                if (logoUrls.length === 0) {
                    console.log(`  ❌ No logos found for ${name}`);
                    continue;
                }
                
                // Try to download the first valid logo
                let downloaded = false;
                for (const logoUrl of logoUrls) {
                    try {
                        const ext = path.extname(new URL(logoUrl).pathname) || '.png';
                        const filename = `${domain}${ext}`;
                        const filePath = path.join(logosDir, filename);
                        
                        console.log(`  Downloading ${logoUrl}`);
                        await downloadImage(logoUrl, filePath);
                        
                        console.log(`  ✅ Downloaded ${filename}`);
                        results.push({ name, domain, logoUrl, filename, status: 'success' });
                        downloaded = true;
                        break;
                    } catch (err) {
                        console.log(`  ❌ Failed to download ${logoUrl}: ${err.message}`);
                    }
                }
                
                if (!downloaded) {
                    console.log(`  ❌ Failed to download any logo for ${name}`);
                    results.push({ name, domain, status: 'failed', reason: 'Download failed' });
                }
                
            } catch (err) {
                console.log(`  ❌ Error processing ${name}: ${err.message}`);
                results.push({ name, domain, status: 'error', reason: err.message });
            }
            
            // Add small delay to be respectful
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
        
        // Save results
        fs.writeFileSync(
            path.join(__dirname, 'logo-extraction-results.json'),
            JSON.stringify(results, null, 2)
        );
        
        const successful = results.filter(r => r.status === 'success').length;
        console.log(`\n🎉 Completed! Successfully downloaded ${successful}/${companies.length} logos`);
        
    } catch (err) {
        console.error('Error:', err);
    }
}

// Run the script
if (require.main === module) {
    extractLogos();
}

module.exports = { extractLogos };