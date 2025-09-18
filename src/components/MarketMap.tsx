'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { EcosystemData } from '@/lib/googleSheets';

interface MarketMapProps {
  companies: EcosystemData[];
}

function getHostFromWebsite(website?: string): string | null {
  const site = (website || '').trim();
  if (!site) return null;
  const match = site.match(/([a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/);
  if (match) {
    const hostname = match[1].replace(/^https?:\/\//, '').replace(/^www\./, '').toLowerCase();
    return hostname;
  }
  return null;
}

function slugifyName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-+|-+$)/g, '') || 'logo';
}

function makeShortHash(input: string): string {
  const s = String(input || '');
  let hash = 5381;
  for (let i = 0; i < s.length; i++) {
    hash = ((hash << 5) + hash) ^ s.charCodeAt(i);
    hash |= 0;
  }
  const hex = (hash >>> 0).toString(16);
  return hex.padStart(8, '0').slice(-8);
}

function deriveRowKey(company: EcosystemData): string {
  const slug = slugifyName(company.name || '');
  const fingerprint = `${company.name}|${company.website}|${company.logo_url}`;
  const short = makeShortHash(fingerprint);
  return `${slug}-${short}`;
}

function getBaseKey(company: EcosystemData): string {
  const host = getHostFromWebsite(company.website || undefined);
  // If host is a generic CDN/social host, prefer name slug to avoid collapsing
  const generic = host ? /^(facebook\.com|.*linkedin\.com|media\.licdn\.com|scontent\.|drive\.google\.com|.*googleusercontent\.com|dropbox\.com|.*dropboxusercontent\.com|.*\.framer\.ai)$/i.test(host) : false;
  if (!generic && host) return host;
  return slugifyName(company.name || '');
}

function getCompanyLogoUrl(company: EcosystemData): string {
  // Always prefer local per-row hashed PNG
  return `/logos/${deriveRowKey(company)}.png`;
}

export default function MarketMap({ companies }: MarketMapProps) {
  const [showTierOneOnly, setShowTierOneOnly] = useState(true);

  // Helpers
  const isTierOne = (tier?: string) => {
    const value = (tier || '').trim().toLowerCase();
    return value === '1' || value === 'tier 1' || value === 'tier1' || value === 't1';
  };

  // Filter companies based on current filters
  const getFilteredCompanies = () => {
    let filtered = companies.filter(company => company.website || company.logo_url || company.name);

    if (showTierOneOnly) {
      filtered = filtered.filter(company => isTierOne(company.tier));
    }

    // Dedupe by base key (hostname or name slug)
    const seen = new Set<string>();
    const unique: EcosystemData[] = [];
    for (const c of filtered) {
      const key = getBaseKey(c);
      if (seen.has(key)) continue;
      seen.add(key);
      unique.push(c);
    }
    return unique;
  };

  // Group companies by category
  const companiesByCategory = getFilteredCompanies().reduce((acc, company) => {
    const category = company.category || 'Other';
    if (!acc[category]) acc[category] = [];
    acc[category].push(company);
    return acc;
  }, {} as Record<string, EcosystemData[]>);

  const categories = Object.keys(companiesByCategory).sort();

  // ExitStack color scheme
  const categoryColors = {
    'Venture Capital': {
      bg: 'bg-gradient-to-br from-orange-500 to-orange-600',
      border: 'border-orange-400',
      text: 'text-white',
      accent: 'bg-orange-100'
    },
    'Impact Investor': {
      bg: 'bg-gradient-to-br from-emerald-500 to-emerald-600',
      border: 'border-emerald-400',
      text: 'text-white',
      accent: 'bg-emerald-100'
    },
    'Incubators & Accelerators': {
      bg: 'bg-gradient-to-br from-red-500 to-red-600',
      border: 'border-red-400',
      text: 'text-white',
      accent: 'bg-red-100'
    },
    'Angel Syndicate & Network': {
      bg: 'bg-gradient-to-br from-purple-500 to-purple-600',
      border: 'border-purple-400',
      text: 'text-white',
      accent: 'bg-purple-100'
    },
    'Government': {
      bg: 'bg-gradient-to-br from-blue-600 to-blue-700',
      border: 'border-blue-500',
      text: 'text-white',
      accent: 'bg-blue-100'
    },
    'Private Equity': {
      bg: 'bg-gradient-to-br from-indigo-500 to-indigo-600',
      border: 'border-indigo-400',
      text: 'text-white',
      accent: 'bg-indigo-100'
    },
    'Ecosystem Support': {
      bg: 'bg-gradient-to-br from-teal-500 to-teal-600',
      border: 'border-teal-400',
      text: 'text-white',
      accent: 'bg-teal-100'
    },
    'Media and Information Platforms': {
      bg: 'bg-gradient-to-br from-pink-500 to-pink-600',
      border: 'border-pink-400',
      text: 'text-white',
      accent: 'bg-pink-100'
    },
    'University Programs': {
      bg: 'bg-gradient-to-br from-cyan-500 to-cyan-600',
      border: 'border-cyan-400',
      text: 'text-white',
      accent: 'bg-cyan-100'
    },
    'Corporate Venture': {
      bg: 'bg-gradient-to-br from-amber-600 to-amber-700',
      border: 'border-amber-500',
      text: 'text-white',
      accent: 'bg-amber-100'
    },
    'DFIs, FIs, & DOs': {
      bg: 'bg-gradient-to-br from-slate-600 to-slate-700',
      border: 'border-slate-500',
      text: 'text-white',
      accent: 'bg-slate-100'
    },
    'Co-Working': {
      bg: 'bg-gradient-to-br from-stone-500 to-stone-600',
      border: 'border-stone-400',
      text: 'text-white',
      accent: 'bg-stone-100'
    },
    'Other': {
      bg: 'bg-gradient-to-br from-gray-500 to-gray-600',
      border: 'border-gray-400',
      text: 'text-white',
      accent: 'bg-gray-100'
    }
  };

  const filteredCompanies = getFilteredCompanies();
  const uncategorizedCount = filteredCompanies.filter(c => !c.category || !c.category.trim()).length;
  const totalByCategory = Object.fromEntries(
    Object.entries(companiesByCategory).map(([cat, list]) => [cat, list.length])
  );

  return (
    <div className="min-h-screen bg-slate-50" style={{ fontFamily: '"General Sans", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
      <div className="max-w-7xl mx-auto p-3">
        {/* Ultra Compact Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-gradient-to-r from-orange-500 to-yellow-500 rounded flex items-center justify-center">
              <span className="text-white text-xs font-bold">🇧🇩</span>
            </div>
            <div>
              <h1 className="text-lg font-bold text-slate-900">Bangladesh Startup Ecosystem</h1>
              <p className="text-slate-500 text-xs">A work in progress</p>
            </div>
          </div>
          
          {/* Minimal Filter Controls */}
          <div className="flex gap-1">
            <button
              onClick={() => setShowTierOneOnly(!showTierOneOnly)}
              className={`px-2 py-1 rounded text-xs font-medium transition-all ${
                showTierOneOnly 
                  ? 'bg-gradient-to-r from-orange-500 to-yellow-500 text-white' 
                  : 'bg-white text-slate-600 hover:bg-slate-100'
              }`}
            >
              T1
            </button>
          </div>
        </div>

        {/* Data sanity chips */}
        <div className="flex flex-wrap items-center gap-1 mb-2">
          {categories.map((cat) => (
            <span
              key={`chip-${cat}`}
              className="text-[10px] px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200"
              title={cat}
            >
              {cat.replace(' & ', ' &\u00A0')}: {totalByCategory[cat]}
            </span>
          ))}
          {uncategorizedCount > 0 && (
            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-yellow-100 text-yellow-800 border border-yellow-200">
              Uncategorized: {uncategorizedCount}
            </span>
          )}
        </div>

        {/* Beautiful Integrated Flow Layout */}
        <div 
          className="grid gap-2" 
          style={{
            gridTemplateColumns: 'repeat(20, 1fr)', // Ultra-fine 20-column grid for perfect control
            gridAutoRows: 'minmax(15px, auto)',
            alignItems: 'start'
          }}
        >
          {(() => {
            // Create a beautiful, strategic arrangement
            const layoutConfig = [
              // Row 1: Hero section - Venture Capital takes prime real estate
              { category: 'Venture Capital', gridColumn: '1 / 15', gridRow: '1 / 8' },
              
              // Row 1: Side cluster - Funding related
              { category: 'Angel Syndicate & Network', gridColumn: '15 / 21', gridRow: '1 / 4' },
              { category: 'Private Equity', gridColumn: '15 / 18', gridRow: '4 / 6' },
              { category: 'Government', gridColumn: '18 / 21', gridRow: '4 / 6' },
              
              // Row 2: Impact & Support cluster - with small gap after Venture Capital
              { category: 'Impact Investor', gridColumn: '1 / 8', gridRow: '8 / 10' },
              { category: 'Ecosystem Support', gridColumn: '8 / 15', gridRow: '8 / 11' },
              
              // Row 2: Corporate cluster - moved up
              { category: 'Corporate Venture', gridColumn: '15 / 21', gridRow: '6 / 10' },
              
              // Row 3: Infrastructure layer - DFIs with small gap after Impact
              { category: 'DFIs, FIs, & DOs', gridColumn: '1 / 8', gridRow: '10 / 13' }, // Small gap after Impact
              { category: 'Media and Information Platforms', gridColumn: '8 / 15', gridRow: '10.05 / 13.05' }, // Extremely close to Ecosystem Support  
              
              // Row 4: Large Incubators section - needs its own space
              { category: 'Incubators & Accelerators', gridColumn: '1 / 15', gridRow: '14 / 20' }, // Large section for 27 companies
              
              { category: 'University Programs', gridColumn: '8 / 15', gridRow: '21 / 23' },
              
              // Row 4: Service cluster - below Corporate Venture
              { category: 'Co-Working', gridColumn: '15 / 21', gridRow: '10 / 12' }, // Below Corporate Venture
              
              // Any remaining categories get placed automatically
              { category: 'Other', gridColumn: '15 / 21', gridRow: '13 / 15' }
            ];

            return categories.map((category) => {
              const companiesInCategory = companiesByCategory[category];
              const colorScheme = categoryColors[category as keyof typeof categoryColors] || categoryColors['Other'];
              const companyCount = companiesInCategory.length;
              
              // Find layout config for this category
              const config = layoutConfig.find(c => c.category === category);
              
              // Uniform grid - all companies take the same space regardless of section
              let gridCols;
              if (config) {
                const colSpan = parseInt(config.gridColumn.split(' / ')[1]) - parseInt(config.gridColumn.split(' / ')[0]);
                
                // Fixed grid based on available space, not company count
                if (colSpan >= 14) {
                  gridCols = 12; // Always 12 columns for large sections
                } else if (colSpan >= 7) {
                  gridCols = 6; // Always 6 columns for medium sections  
                } else if (colSpan >= 4) {
                  gridCols = 4; // Always 4 columns for small sections
                } else {
                  gridCols = 3; // Always 3 columns for tiny sections
                }
              } else {
                // Default uniform sizing
                gridCols = 6;
              }

              return (
                <div 
                  key={category} 
                  className="bg-white border border-slate-200 overflow-hidden hover:shadow-lg transition-shadow duration-300"
                  style={{
                    gridColumn: config?.gridColumn || 'auto',
                    gridRow: config?.gridRow || 'auto',
                    borderRadius: '6px',
                    alignSelf: 'start'
                  }}
                >
                  {/* Beautiful Header with subtle gradient */}
                  <div 
                    className={`${colorScheme.bg} ${colorScheme.text} px-2 py-1.5 flex items-center justify-between relative`}
                    style={{
                      background: `linear-gradient(135deg, ${colorScheme.bg.includes('orange') ? '#ea580c, #f97316' : colorScheme.bg.includes('emerald') ? '#047857, #059669' : colorScheme.bg.includes('red') ? '#dc2626, #ef4444' : colorScheme.bg.includes('purple') ? '#7c3aed, #8b5cf6' : colorScheme.bg.includes('blue') ? '#1d4ed8, #2563eb' : colorScheme.bg.includes('indigo') ? '#4f46e5, #6366f1' : colorScheme.bg.includes('teal') ? '#0f766e, #14b8a6' : colorScheme.bg.includes('pink') ? '#be185d, #db2777' : colorScheme.bg.includes('cyan') ? '#0e7490, #0891b2' : colorScheme.bg.includes('amber') ? '#b45309, #d97706' : colorScheme.bg.includes('slate') ? '#475569, #64748b' : colorScheme.bg.includes('stone') ? '#57534e, #78716c' : '#6b7280, #9ca3af'})`
                    }}
                  >
                    <h3 className="text-xs font-bold uppercase tracking-tight truncate">
                      {category.replace(' & ', ' &\u00A0').replace('DFIs, FIs, & DOs', 'DFI/FI/DO')}
                    </h3>
                    <span className="text-xs opacity-90 ml-1 bg-black bg-opacity-20 px-1.5 py-0.5 rounded-full">
                      {companyCount}
                    </span>
                  </div>
                  
                  {/* Ultra Dense Grid with improved spacing */}
                  <div className="p-1.5">
                    <div className="grid gap-1" style={{
                      gridTemplateColumns: `repeat(${gridCols}, 1fr)`
                    }}>
                      {companiesInCategory
                        .slice()
                        .sort((a, b) => a.name.localeCompare(b.name))
                        .map((company, index) => (
                        <div
                          key={`${company.name}-${index}`}
                          className={`group bg-slate-50 hover:bg-white rounded p-1 transition-all duration-200 border border-transparent hover:border-slate-300 hover:scale-105 ${
                            (company.website || '').trim() ? 'cursor-pointer' : 'cursor-default'
                          }`}
                          onClick={() => {
                            const url = (company.website || '').trim();
                            if (url) window.open(url, '_blank');
                          }}
                          title={company.name}
                        >
                          <div className="flex flex-col items-center text-center">
                            <div className="w-4 h-4 mb-0.5 flex items-center justify-center">
                              <Image
                                src={getCompanyLogoUrl(company)}
                                alt={`${company.name} logo`}
                                width={14}
                                height={14}
                                unoptimized
                                className="w-3.5 h-3.5 object-contain drop-shadow-sm"
                                onError={(e) => {
                                  const img = e.currentTarget as HTMLImageElement;
                                  // Local-only policy: if the hashed PNG is missing, show an inline placeholder and do not fetch externally
                                  img.src = `data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' width='14' height='14' viewBox='0 0 14 14'><rect width='14' height='14' fill='%23e2e8f0' rx='2'/><text x='7' y='10' text-anchor='middle' fill='%23475569' font-size='6' font-family='General Sans, Arial, sans-serif' font-weight='700'>${company.name.charAt(0).toUpperCase()}</text></svg>`;
                                }}
                              />
                            </div>
                            <span className="text-slate-700 font-medium leading-none line-clamp-2 max-w-full" style={{ 
                              fontSize: '8px',
                              lineHeight: '9px'
                            }}>
                              {company.name}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              );
            });
          })()}
        </div>

        {/* Minimal Footer */}
        <div className="mt-3 text-center">
          <p className="text-xs text-slate-400">
            {filteredCompanies.length} / {companies.length}
          </p>
        </div>
      </div>
    </div>
  );
}