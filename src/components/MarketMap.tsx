'use client';

import React from 'react';
import { EcosystemData } from '@/lib/googleSheets';

interface MarketMapProps {
  companies: EcosystemData[];
}

function getFaviconUrl(website: string): string {
  const input = (website || '').trim();
  if (!input) return '/favicon.ico';
  // Extract a hostname-like token to avoid SSR/CSR parser differences
  const match = input.match(/([a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/);
  if (!match) return '/favicon.ico';
  const hostname = match[1].replace(/^https?:\/\//, '').replace(/^www\./, '').toLowerCase();
  return `https://www.google.com/s2/favicons?domain=${hostname}&sz=32`;
}

export default function MarketMap({ companies }: MarketMapProps) {
  // Helpers
  const isTierOne = (tier?: string) => {
    const value = (tier || '').trim().toLowerCase();
    return value === '1' || value === 'tier 1' || value === 'tier1' || value === 't1';
  };

  const isExcludedCategory = (category?: string) => {
    const value = (category || '').trim().toLowerCase();
    return value === 'incubators & accelerators' || value === 'incubators and accelerators';
  };

  // Group companies by category (Tier 1 only, exclude I&A, must have website)
  const companiesByCategory = companies
    .filter(company => company.website)
    .filter(company => isTierOne(company.tier))
    .filter(company => !isExcludedCategory(company.category))
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

        {/* Categories Masonry Grid */}
        <div className="columns-1 md:columns-2 lg:columns-3 gap-6">
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
              <div key={category} className={`${colorClass} border-2 rounded-lg p-6 mb-6 break-inside-avoid`}>
                <h2 className="font-bold text-lg text-gray-800 mb-4 uppercase tracking-wide">
                  {category}
                </h2>
                
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 p-2">
                  {companiesInCategory
                    .slice()
                    .sort((a, b) => a.name.localeCompare(b.name))
                    .map((company, index) => (
                    <div
                      key={`${company.name}-${index}`}
                      className="bg-white rounded-lg p-3 hover:shadow-lg transition-all duration-200 cursor-pointer border border-gray-200 hover:border-gray-300 flex flex-col items-center text-center group"
                      onClick={() => window.open(company.website, '_blank')}
                      title={company.name}
                    >
                      <div className="w-12 h-12 mb-2 flex items-center justify-center bg-gray-50 rounded-lg group-hover:bg-gray-100 transition-colors">
                        <img
                          src={getFaviconUrl(company.website || '')}
                          alt={`${company.name} favicon`}
                          className="w-8 h-8 rounded"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.src = `data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' width='32' height='32' viewBox='0 0 32 32'><rect width='32' height='32' fill='%23e5e7eb' rx='4'/><text x='16' y='20' text-anchor='middle' fill='%236b7280' font-size='12' font-family='General Sans, Arial, sans-serif' font-weight='700'>${company.name.charAt(0).toUpperCase()}</text></svg>`;
                          }}
                        />
                      </div>
                      <span className="text-xs text-gray-700 font-medium leading-tight line-clamp-2 px-1">
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