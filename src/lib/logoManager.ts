export class LogoManager {
  
  // Convert website URL to filename
  static urlToFilename(websiteUrl: string): string {
    if (!websiteUrl) return '';
    
    try {
      const url = new URL(websiteUrl);
      let domain = url.hostname.replace('www.', '');
      
      // Clean domain for filename
      domain = domain.replace(/[^a-zA-Z0-9.-]/g, '');
      
      return `${domain}.png`;
    } catch {
      // Fallback for invalid URLs
      return websiteUrl
        .replace(/https?:\/\//g, '')
        .replace(/www\./g, '')
        .replace(/[^a-zA-Z0-9.-]/g, '')
        .replace(/\/$/, '') + '.png';
    }
  }
  
  // Check if logo exists locally (client-side version)
  static async logoExists(websiteUrl: string): Promise<boolean> {
    if (!websiteUrl) return false;
    
    const filename = this.urlToFilename(websiteUrl);
    
    try {
      const response = await fetch(`/logos/${filename}`, { method: 'HEAD' });
      return response.ok;
    } catch {
      return false;
    }
  }
  
  // Get logo URL (client-side - always try logo first, fallback handled in component)
  static getLogoUrl(websiteUrl: string, companyName: string): string {
    if (!websiteUrl) return this.generatePlaceholder(companyName);
    
    const filename = this.urlToFilename(websiteUrl);
    return `/logos/${filename}`;
  }
  
  // Generate SVG placeholder with company initials
  static generatePlaceholder(companyName: string): string {
    if (!companyName) return '';
    
    const initials = companyName
      .split(/\s+/)
      .slice(0, 2)
      .map(word => word.charAt(0).toUpperCase())
      .join('');
      
    // Color based on company name hash
    const colors = [
      '#3B82F6', '#EF4444', '#10B981', '#F59E0B', 
      '#8B5CF6', '#06B6D4', '#F97316', '#84CC16',
      '#EC4899', '#6366F1', '#14B8A6', '#F97316'
    ];
    
    const colorIndex = companyName.split('').reduce((acc, char) => 
      acc + char.charCodeAt(0), 0) % colors.length;
    const color = colors[colorIndex];
    
    return `data:image/svg+xml,${encodeURIComponent(`
      <svg width="80" height="80" xmlns="http://www.w3.org/2000/svg">
        <rect width="80" height="80" fill="${color}" rx="8"/>
        <text x="40" y="50" font-family="General Sans, Arial, sans-serif" font-size="24" font-weight="700"
              fill="white" text-anchor="middle" dominant-baseline="central">${initials}</text>
      </svg>
    `)}`;
  }
  
  // Queue a logo for background download
  static async queueLogoDownload(websiteUrl: string): Promise<void> {
    if (!websiteUrl) return;
    
    // Check if logo already exists
    const exists = await this.logoExists(websiteUrl);
    if (exists) return;
    
    try {
      const response = await fetch('/api/download-logo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: websiteUrl })
      });
      
      if (response.ok) {
        console.log(`Queued logo download for ${websiteUrl}`);
      }
    } catch (error) {
      console.error(`Failed to queue logo download for ${websiteUrl}:`, error);
    }
  }
}