'use client';

import { useState } from 'react';
import Image from 'next/image';

interface CompanyLogoProps {
  logoUrl?: string;
  companyName: string;
  size?: number;
  className?: string;
}

export default function CompanyLogo({ 
  logoUrl, 
  companyName, 
  size = 60, 
  className = '' 
}: CompanyLogoProps) {
  const [imageError, setImageError] = useState(false);

  // Generate placeholder with company initials
  const generatePlaceholder = (name: string) => {
    const initials = name
      .split(' ')
      .map(word => word.charAt(0).toUpperCase())
      .join('')
      .substring(0, 2);
    
    const colors = ['#2563eb', '#059669', '#7c3aed', '#dc2626', '#ea580c'];
    const colorIndex = name.length % colors.length;
    const backgroundColor = colors[colorIndex];
    
    return (
      <div 
        className={`flex items-center justify-center rounded text-white font-semibold ${className}`}
        style={{ 
          width: size, 
          height: size,
          backgroundColor,
          fontSize: size * 0.4
        }}
      >
        {initials}
      </div>
    );
  };

  // If no logo URL or image failed to load, show placeholder
  if (!logoUrl || imageError) {
    return generatePlaceholder(companyName);
  }

  return (
    <div className={`relative ${className}`} style={{ width: size, height: size }}>
      <Image
        src={logoUrl}
        alt={`${companyName} logo`}
        fill
        className="object-contain rounded"
        sizes={`${size}px`}
        onError={() => setImageError(true)}
      />
    </div>
  );
}