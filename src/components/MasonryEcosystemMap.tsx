'use client';

import React, { useState, useMemo, useRef } from 'react';
import { EcosystemData } from '@/lib/googleSheets';

interface MasonryEcosystemMapProps {
  companies: EcosystemData[];
}

const CATEGORY_THEMES = {
  'Venture Capital': { 
    gradient: 'from-blue-500 to-indigo-600', 
    icon: '💰', 
    accent: '#3B82F6',
    pattern: 'funding'
  },
  'Impact Investor': { 
    gradient: 'from-green-500 to-emerald-600', 
    icon: '🌱', 
    accent: '#10B981',
    pattern: 'impact'
  },
  'Private Equity': { 
    gradient: 'from-purple-500 to-violet-600', 
    icon: '🏢', 
    accent: '#8B5CF6',
    pattern: 'equity'
  },
  'Incubators & Accelerators': { 
    gradient: 'from-red-500 to-rose-600', 
    icon: '🚀', 
    accent: '#EF4444',
    pattern: 'growth'
  },
  'Angel Syndicate & Network': { 
    gradient: 'from-orange-500 to-amber-600', 
    icon: '👼', 
    accent: '#F59E0B',
    pattern: 'network'
  },
  'Corporate Venture': { 
    gradient: 'from-gray-500 to-slate-600', 
    icon: '🏭', 
    accent: '#6B7280',
    pattern: 'corporate'
  },
  'Government': { 
    gradient: 'from-emerald-600 to-teal-700', 
    icon: '🏛️', 
    accent: '#059669',
    pattern: 'gov'
  },
  'DFIs, FIs, & DOs': { 
    gradient: 'from-yellow-600 to-orange-700', 
    icon: '🏦', 
    accent: '#D97706',
    pattern: 'finance'
  },
  'Ecosystem Support': { 
    gradient: 'from-cyan-500 to-blue-600', 
    icon: '🤝', 
    accent: '#0891B2',
    pattern: 'support'
  },
  'Media and Information Platforms': { 
    gradient: 'from-pink-500 to-rose-600', 
    icon: '📺', 
    accent: '#EC4899',
    pattern: 'media'
  },
  'University Programs': { 
    gradient: 'from-indigo-600 to-blue-700', 
    icon: '🎓', 
    accent: '#3730A3',
    pattern: 'education'
  },
  'Co-Working': { 
    gradient: 'from-teal-500 to-cyan-600', 
    icon: '🏢', 
    accent: '#14B8A6',
    pattern: 'cowork'
  },
  'Other': { 
    gradient: 'from-gray-400 to-gray-600', 
    icon: '❓', 
    accent: '#6B7280',
    pattern: 'other'
  }
};


export default function MasonryEcosystemMap({ companies }: MasonryEcosystemMapProps) {
  const [hoveredCompany, setHoveredCompany] = useState<EcosystemData | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Create masonry items from categories
  const masonryItems = useMemo(() => {
    const categoryGroups = companies.reduce((acc, company) => {
      const category = company.category || 'Other';
      if (!acc[category]) acc[category] = [];
      acc[category].push(company);
      return acc;
    }, {} as Record<string, EcosystemData[]>);

    return Object.entries(categoryGroups).map(([category, categoryCompanies]) => {
      const theme = CATEGORY_THEMES[category as keyof typeof CATEGORY_THEMES] || CATEGORY_THEMES.Other;
      
      // Calculate dynamic height based on company count
      const baseHeight = 280;
      const companyCount = categoryCompanies.length;
      const extraHeight = Math.min(companyCount * 8, 200); // Max 200px extra
      const height = baseHeight + extraHeight;

      return {
        category,
        companies: categoryCompanies,
        height,
        theme
      };
    }).sort((a, b) => b.companies.length - a.companies.length); // Sort by company count
  }, [companies]);

  // Masonry layout calculation
  const columns = 3;
  const gap = 24;

  const masonryLayout = useMemo(() => {
    const columnHeights = new Array(columns).fill(0);
    const items = masonryItems.map((item, index) => {
      // Find shortest column
      const shortestColumn = columnHeights.indexOf(Math.min(...columnHeights));
      
      const x = shortestColumn * (100 / columns);
      const y = columnHeights[shortestColumn];
      
      // Update column height
      columnHeights[shortestColumn] += item.height + gap;
      
      return {
        ...item,
        x: `${x}%`,
        y: y,
        width: `${100 / columns - (gap / 10)}%`
      };
    });

    return {
      items,
      totalHeight: Math.max(...columnHeights)
    };
  }, [masonryItems]);

  return (
    <div className="w-full bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 min-h-screen">
      {/* Header */}
      <div className="relative overflow-hidden bg-gradient-to-r from-indigo-900 via-purple-900 to-pink-900">
        <div className="absolute inset-0 bg-black opacity-20"></div>
        <div className="relative z-10 px-8 py-12">
          <div className="max-w-7xl mx-auto">
            <div className="text-center">
              <h1 className="text-5xl font-bold text-white mb-4 tracking-tight">
                <span className="bg-gradient-to-r from-blue-400 to-emerald-400 bg-clip-text text-transparent">
                  Bangladesh Startup
                </span>
                <br />
                <span className="text-white">Ecosystem Map</span>
              </h1>
              <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto leading-relaxed">
                Discover {companies.length} organizations across {masonryItems.length} categories 
                shaping Bangladesh&apos;s entrepreneurial landscape
              </p>
              
              {/* Stats Row */}
              <div className="flex justify-center space-x-8 text-center">
                <div className="bg-white bg-opacity-10 rounded-lg px-6 py-4 backdrop-blur-sm">
                  <div className="text-3xl font-bold text-white">{companies.length}</div>
                  <div className="text-sm text-gray-300">Organizations</div>
                </div>
                <div className="bg-white bg-opacity-10 rounded-lg px-6 py-4 backdrop-blur-sm">
                  <div className="text-3xl font-bold text-emerald-400">{masonryItems.length}</div>
                  <div className="text-sm text-gray-300">Categories</div>
                </div>
                <div className="bg-white bg-opacity-10 rounded-lg px-6 py-4 backdrop-blur-sm">
                  <div className="text-3xl font-bold text-purple-400">
                    {Math.max(...masonryItems.map(item => item.companies.length))}
                  </div>
                  <div className="text-sm text-gray-300">Largest Sector</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Category Filter Tabs */}
      <div className="sticky top-0 z-30 bg-slate-900 bg-opacity-95 backdrop-blur-lg border-b border-slate-700">
        <div className="max-w-7xl mx-auto px-8 py-4">
          <div className="flex flex-wrap gap-2 justify-center">
            <button
              onClick={() => setSelectedCategory(null)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                !selectedCategory 
                  ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg' 
                  : 'bg-slate-800 text-gray-300 hover:bg-slate-700'
              }`}
            >
              All Categories
            </button>
            {masonryItems.map((item) => (
              <button
                key={item.category}
                onClick={() => setSelectedCategory(selectedCategory === item.category ? null : item.category)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all flex items-center gap-2 ${
                  selectedCategory === item.category
                    ? `bg-gradient-to-r ${item.theme.gradient} text-white shadow-lg scale-105`
                    : 'bg-slate-800 text-gray-300 hover:bg-slate-700 hover:scale-105'
                }`}
                style={{
                  borderColor: selectedCategory === item.category ? item.theme.accent : 'transparent',
                  borderWidth: '2px'
                }}
              >
                <span>{item.theme.icon}</span>
                <span>{item.category}</span>
                <span className="bg-white bg-opacity-20 px-2 py-0.5 rounded-full text-xs">
                  {item.companies.length}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Masonry Grid */}
      <div className="max-w-7xl mx-auto px-8 py-12">
        <div 
          ref={containerRef}
          className="relative"
          style={{ height: `${masonryLayout.totalHeight + 100}px` }}
        >
          {masonryLayout.items.map((item) => {
            const isFiltered = selectedCategory && selectedCategory !== item.category;
            
            return (
              <div
                key={item.category}
                className={`absolute transition-all duration-500 ease-in-out ${
                  isFiltered ? 'opacity-30 scale-95' : 'opacity-100 scale-100'
                }`}
                style={{
                  left: item.x,
                  top: `${item.y}px`,
                  width: item.width,
                  height: `${item.height}px`
                }}
              >
                <div className={`h-full rounded-2xl bg-gradient-to-br ${item.theme.gradient} p-1 shadow-2xl hover:shadow-3xl transition-all duration-300 group hover:scale-105`}>
                  <div className="h-full bg-slate-900 bg-opacity-60 rounded-2xl backdrop-blur-sm p-6 flex flex-col">
                    {/* Category Header */}
                    <div className="flex items-center justify-between mb-6">
                      <div className="flex items-center gap-3">
                        <div className="text-3xl">{item.theme.icon}</div>
                        <div>
                          <h3 className="text-xl font-bold text-white leading-tight">
                            {item.category}
                          </h3>
                          <p className="text-sm text-gray-300">
                            {item.companies.length} organizations
                          </p>
                        </div>
                      </div>
                      <div className="bg-white bg-opacity-20 rounded-full w-12 h-12 flex items-center justify-center">
                        <span className="text-white font-bold text-lg">
                          {item.companies.length}
                        </span>
                      </div>
                    </div>

                    {/* Companies Grid */}
                    <div className="flex-1 overflow-hidden">
                      <div className="grid grid-cols-2 gap-2 h-full overflow-y-auto scrollbar-hide">
                        {item.companies.map((company, companyIndex) => (
                          <div
                            key={`${company.name}-${companyIndex}`}
                            className="bg-white bg-opacity-10 rounded-lg p-3 hover:bg-opacity-20 transition-all duration-200 cursor-pointer group/card backdrop-blur-sm border border-white border-opacity-20 hover:border-opacity-40"
                            onMouseEnter={() => setHoveredCompany(company)}
                            onMouseLeave={() => setHoveredCompany(null)}
                            onClick={() => company.website && window.open(company.website, '_blank')}
                          >
                            <div className="text-white font-medium text-sm leading-tight mb-1 group-hover/card:text-blue-200 transition-colors">
                              {company.name}
                            </div>
                            {company.tier && (
                              <div className="text-xs text-gray-400 mb-1">
                                Tier {company.tier}
                              </div>
                            )}
                            <div className="flex items-center justify-between">
                              <div className="text-xs text-gray-400 truncate">
                                {company.category}
                              </div>
                              {company.website && (
                                <div className="text-xs text-blue-300 opacity-0 group-hover/card:opacity-100 transition-opacity">
                                  →
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Category Footer */}
                    <div className="mt-4 pt-4 border-t border-white border-opacity-20">
                      <div className="flex justify-between items-center text-sm text-gray-300">
                        <span>
                          {item.companies.filter(c => c.website).length} have websites
                        </span>
                        <span>
                          {item.companies.filter(c => c.tier).length} with tiers
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Hover Tooltip */}
      {hoveredCompany && (
        <div 
          className="fixed bg-black bg-opacity-90 text-white px-4 py-3 rounded-xl shadow-2xl pointer-events-none z-50 max-w-xs backdrop-blur-sm border border-white border-opacity-20"
          style={{
            left: '50%',
            top: '20px',
            transform: 'translateX(-50%)'
          }}
        >
          <div className="font-bold text-lg">{hoveredCompany.name}</div>
          <div className="text-sm text-gray-300 mb-2">{hoveredCompany.category}</div>
          {hoveredCompany.tier && (
            <div className="text-sm text-blue-300 mb-1">Tier {hoveredCompany.tier}</div>
          )}
          {hoveredCompany.website && (
            <div className="text-sm text-green-300">Click to visit website →</div>
          )}
        </div>
      )}

      {/* Footer */}
      <footer className="bg-slate-900 border-t border-slate-800 py-12">
        <div className="max-w-7xl mx-auto px-8 text-center">
          <div className="text-gray-400 mb-4">
            Bangladesh Startup Ecosystem Map
          </div>
          <div className="text-sm text-gray-500">
            Powered by Next.js & Google Sheets • Data updates in real-time
          </div>
        </div>
      </footer>
    </div>
  );
}