export async function fetchLogoFromWebsite(websiteUrl: string): Promise<string | null> {
  if (!websiteUrl || !websiteUrl.startsWith('http')) {
    return null;
  }

  try {
    // Clean up the URL
    const url = new URL(websiteUrl);
    const baseUrl = `${url.protocol}//${url.hostname}`;
    
    // Common logo paths to try
    const logoPatterns = [
      '/favicon.ico',
      '/logo.png',
      '/logo.jpg', 
      '/logo.svg',
      '/images/logo.png',
      '/assets/logo.png',
      '/static/logo.png',
      '/img/logo.png',
      // For specific domains, try their known logo URLs
      ...(url.hostname.includes('linkedin.com') ? ['/favicon.ico'] : []),
      ...(url.hostname.includes('facebook.com') ? ['/favicon.ico'] : []),
      ...(url.hostname.includes('twitter.com') ? ['/favicon.ico'] : []),
    ];

    // Try each logo pattern
    for (const pattern of logoPatterns) {
      const logoUrl = baseUrl + pattern;
      try {
        const response = await fetch(logoUrl, { 
          method: 'HEAD',
          signal: AbortSignal.timeout(5000)
        });
        if (response.ok && response.headers.get('content-type')?.startsWith('image/')) {
          return logoUrl;
        }
      } catch (error) {
        continue; // Try next pattern
      }
    }

    // If no direct logo found, try to get favicon
    return `${baseUrl}/favicon.ico`;
    
  } catch (error) {
    console.error(`Failed to fetch logo for ${websiteUrl}:`, error);
    return null;
  }
}

export function generateLogoPlaceholder(companyName: string): string {
  // Generate a simple placeholder with company initials
  const initials = companyName
    .split(/\s+/)
    .slice(0, 2)
    .map(word => word.charAt(0).toUpperCase())
    .join('');
    
  // Create a data URL for a simple colored square with initials
  const colors = [
    '#3B82F6', '#EF4444', '#10B981', '#F59E0B', 
    '#8B5CF6', '#06B6D4', '#F97316', '#84CC16'
  ];
  const color = colors[companyName.length % colors.length];
  
  return `data:image/svg+xml,${encodeURIComponent(`
    <svg width="64" height="64" xmlns="http://www.w3.org/2000/svg">
      <rect width="64" height="64" fill="${color}"/>
      <text x="32" y="40" font-family="Arial, sans-serif" font-size="24" font-weight="bold" 
            fill="white" text-anchor="middle">${initials}</text>
    </svg>
  `)}`;
}