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
                
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-4">
                  {companiesInCategory.map((company, index) => (
                    <div
                      key={`${company.name}-${index}`}
                      className="bg-white rounded-lg p-3 hover:shadow-md transition-shadow cursor-pointer border border-gray-200 hover:border-gray-300 flex flex-col items-center text-center"
                      onClick={() => window.open(company.website, '_blank')}
                    >
                      <img
                        src={getFaviconUrl(company.website || '')}
                        alt={`${company.name} favicon`}
                        className="w-8 h-8 mb-2 rounded"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.src = `data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' width='32' height='32' viewBox='0 0 32 32'><rect width='32' height='32' fill='%23e5e7eb'/><text x='16' y='20' text-anchor='middle' fill='%236b7280' font-size='12' font-family='Arial'>${company.name.charAt(0).toUpperCase()}</text></svg>`;
                        }}
                      />
                      <span className="text-xs text-gray-700 font-medium leading-tight">
                        {company.name}
                      </span>
                    </div>
                  ))}
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