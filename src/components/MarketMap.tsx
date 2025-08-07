'use client';

import React from 'react';
import { EcosystemData } from '@/lib/googleSheets';

interface MarketMapProps {
  companies: EcosystemData[];
}

function getFaviconUrl(website: string): string {
  try {
    const url = new URL(website.startsWith('http') ? website : `https://${website}`);
    return `https://www.google.com/s2/favicons?domain=${url.hostname}&sz=32`;
  } catch {
    return '/favicon.ico';
  }
}

export default function MarketMap({ companies }: MarketMapProps) {
  // Group companies by category
  const companiesByCategory = companies
    .filter(company => company.website) // Only show companies with websites
    .reduce((acc, company) => {
      const category = company.category || 'Other';
      if (!acc[category]) acc[category] = [];
      acc[category].push(company);
      return acc;
    }, {} as Record<string, EcosystemData[]>);

  const categories = Object.keys(companiesByCategory).sort();

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              The Bangladesh Startup Ecosystem Map
            </h1>
            <p className="text-gray-600 mt-2">A work in progress</p>
          </div>
          <div className="text-green-600">
            <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
              <span className="text-green-600 font-bold">✓</span>
            </div>
          </div>
        </div>

        {/* Categories Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {categories.map((category) => {
            const companiesInCategory = companiesByCategory[category];
            const categoryColors = {
              'Venture Capital': 'bg-blue-100 border-blue-300',
              'Impact Investor': 'bg-green-100 border-green-300',
              'Incubators & Accelerators': 'bg-red-100 border-red-300',
              'Government': 'bg-teal-100 border-teal-300',
              'Other': 'bg-gray-100 border-gray-300'
            };
            
            const colorClass = categoryColors[category as keyof typeof categoryColors] || 'bg-gray-100 border-gray-300';

            return (
              <div key={category} className={`${colorClass} border-2 rounded-lg p-6`}>
                <h2 className="font-bold text-lg text-gray-800 mb-4 uppercase tracking-wide">
                  {category}
                </h2>
                
                <div className="flex flex-wrap justify-center gap-3 leading-relaxed items-center min-h-[200px] py-4">
                  {companiesInCategory.map((company, index) => {
                    // Create varying text sizes based on company name length and index
                    const sizeVariants = ['text-xs', 'text-sm', 'text-base', 'text-lg', 'text-xl'];
                    const sizeIndex = (company.name.length + index) % sizeVariants.length;
                    const textSize = sizeVariants[sizeIndex];
                    
                    // Icon sizes to match text sizes
                    const iconSizeMap = {
                      'text-xs': 'w-3 h-3',
                      'text-sm': 'w-3.5 h-3.5', 
                      'text-base': 'w-4 h-4',
                      'text-lg': 'w-5 h-5',
                      'text-xl': 'w-6 h-6'
                    };
                    const iconSize = iconSizeMap[textSize as keyof typeof iconSizeMap];
                    
                    // Padding variations to match text sizes for better separation
                    const paddingMap = {
                      'text-xs': 'px-2 py-1',
                      'text-sm': 'px-2 py-1', 
                      'text-base': 'px-2.5 py-1.5',
                      'text-lg': 'px-3 py-2',
                      'text-xl': 'px-3.5 py-2'
                    };
                    const paddingSize = paddingMap[textSize as keyof typeof paddingMap];
                    
                    // Color variations for word cloud effect
                    const colorVariants = ['text-gray-600', 'text-gray-700', 'text-gray-800', 'text-gray-900'];
                    const colorIndex = (company.name.charCodeAt(0) + index) % colorVariants.length;
                    const textColor = colorVariants[colorIndex];
                    
                    return (
                      <div
                        key={`${company.name}-${index}`}
                        className={`${textSize} ${textColor} hover:text-blue-600 cursor-pointer transition-all duration-200 font-medium ${paddingSize} rounded-lg hover:bg-white/80 hover:shadow-sm border border-transparent hover:border-gray-200 flex items-center gap-1.5 backdrop-blur-sm`}
                        onClick={() => window.open(company.website, '_blank')}
                        title={company.name}
                      >
                        <img
                          src={getFaviconUrl(company.website || '')}
                          alt={`${company.name} favicon`}
                          className={`${iconSize} rounded flex-shrink-0`}
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            const svgSize = iconSize === 'w-3 h-3' ? '12' : iconSize === 'w-3.5 h-3.5' ? '14' : iconSize === 'w-4 h-4' ? '16' : iconSize === 'w-5 h-5' ? '20' : '24';
                            const fontSize = iconSize === 'w-3 h-3' ? '6' : iconSize === 'w-3.5 h-3.5' ? '7' : iconSize === 'w-4 h-4' ? '8' : iconSize === 'w-5 h-5' ? '10' : '12';
                            const yPos = iconSize === 'w-3 h-3' ? '8' : iconSize === 'w-3.5 h-3.5' ? '9' : iconSize === 'w-4 h-4' ? '11' : iconSize === 'w-5 h-5' ? '13' : '15';
                            target.src = `data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' width='${svgSize}' height='${svgSize}' viewBox='0 0 ${svgSize} ${svgSize}'><rect width='${svgSize}' height='${svgSize}' fill='%23e5e7eb'/><text x='${parseInt(svgSize)/2}' y='${yPos}' text-anchor='middle' fill='%236b7280' font-size='${fontSize}' font-family='Arial'>${company.name.charAt(0).toUpperCase()}</text></svg>`;
                          }}
                        />
                        <span className="whitespace-nowrap">{company.name}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer Stats */}
        <div className="mt-12 text-center text-gray-600">
          <p>{companies.length} total organizations • {companies.filter(c => c.website).length} with websites</p>
        </div>
      </div>
    </div>
  );
}