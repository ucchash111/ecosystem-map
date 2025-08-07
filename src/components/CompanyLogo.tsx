'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { LogoManager } from '@/lib/logoManager';

interface CompanyLogoProps {
  websiteUrl: string;
  companyName: string;
  size?: number;
  className?: string;
}

export default function CompanyLogo({ 
  websiteUrl, 
  companyName, 
  size = 60, 
  className = '' 
}: CompanyLogoProps) {
  const [logoUrl, setLogoUrl] = useState<string>('');
  const [hasLogo, setHasLogo] = useState(false);

  useEffect(() => {
    const setupLogo = async () => {
      if (!websiteUrl) {
        const placeholder = LogoManager.generatePlaceholder(companyName);
        setLogoUrl(placeholder);
        setHasLogo(false);
        return;
      }
      
      // Try to get the logo URL
      const logoPath = LogoManager.getLogoUrl(websiteUrl, companyName);
      
      // Check if logo exists by trying to load it
      const logoExists = await LogoManager.logoExists(websiteUrl);
      
      if (logoExists) {
        setLogoUrl(logoPath);
        setHasLogo(true);
      } else {
        // Use placeholder and queue download
        const placeholder = LogoManager.generatePlaceholder(companyName);
        setLogoUrl(placeholder);
        setHasLogo(false);
        
        // Queue download
        LogoManager.queueLogoDownload(websiteUrl);
      }
    };
    
    setupLogo();
  }, [websiteUrl, companyName]);

  if (hasLogo) {
    return (
      <div className={`relative ${className}`} style={{ width: size, height: size }}>
        <Image
          src={logoUrl}
          alt={`${companyName} logo`}
          fill
          className="object-contain rounded"
          sizes={`${size}px`}
          onError={() => {
            // If logo fails to load, fall back to placeholder
            const placeholder = LogoManager.generatePlaceholder(companyName);
            setLogoUrl(placeholder);
            setHasLogo(false);
          }}
        />
      </div>
    );
  }

  // Show placeholder with initials
  return (
    <div 
      className={`flex items-center justify-center rounded ${className}`}
      style={{ 
        width: size, 
        height: size,
        background: `url("${logoUrl}")`,
        backgroundSize: 'cover',
        backgroundPosition: 'center'
      }}
    />
  );
}