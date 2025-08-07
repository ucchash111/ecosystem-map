'use client';

import React, { useState, useMemo } from 'react';
import { EcosystemData } from '@/lib/googleSheets';

interface SitePreviewMapProps {
  companies: EcosystemData[];
}

const CATEGORY_COLORS = {
  'Venture Capital': 'border-blue-500 bg-blue-50',
  'Impact Investor': 'border-green-500 bg-green-50',
  'Private Equity': 'border-purple-500 bg-purple-50',
  'Incubators & Accelerators': 'border-red-500 bg-red-50',
  'Angel Syndicate & Network': 'border-orange-500 bg-orange-50',
  'Corporate Venture': 'border-gray-500 bg-gray-50',
  'Government': 'border-emerald-500 bg-emerald-50',
  'DFIs, FIs, & DOs': 'border-yellow-500 bg-yellow-50',
  'Ecosystem Support': 'border-cyan-500 bg-cyan-50',
  'Media and Information Platforms': 'border-pink-500 bg-pink-50',
  'University Programs': 'border-indigo-500 bg-indigo-50',
  'Co-Working': 'border-teal-500 bg-teal-50',
  'Other': 'border-gray-400 bg-gray-50'
};

function getFaviconUrl(website: string): string {
  try {
    const url = new URL(website.startsWith('http') ? website : `https://${website}`);
    return `https://www.google.com/s2/favicons?domain=${url.hostname}&sz=32`;
  } catch {
    return '/favicon.ico';
  }
}

export default function SitePreviewMap({ companies }: SitePreviewMapProps) {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const filteredCompanies = useMemo(() => {
    return companies.filter(company => {
      const matchesCategory = !selectedCategory || company.category === selectedCategory;
      const matchesSearch = !searchTerm || 
        company.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (company.category || '').toLowerCase().includes(searchTerm.toLowerCase());
      
      return matchesCategory && matchesSearch && company.website;
    });
  }, [companies, selectedCategory, searchTerm]);

  const categories = useMemo(() => {
    const categoryCount = companies.reduce((acc, company) => {
      const category = company.category || 'Other';
      acc[category] = (acc[category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(categoryCount)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);
  }, [companies]);

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Bangladesh Startup Ecosystem
          </h1>
          <p className="text-gray-600 text-lg">
            {companies.length} organizations • {filteredCompanies.length} with websites
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white border-b sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex flex-col lg:flex-row gap-4 items-center">
            {/* Search */}
            <div className="flex-1">
              <input
                type="text"
                placeholder="Search organizations..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Category Filter */}
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setSelectedCategory(null)}
                className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                  !selectedCategory
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                All ({companies.filter(c => c.website).length})
              </button>
              {categories.slice(0, 6).map(category => (
                <button
                  key={category.name}
                  onClick={() => setSelectedCategory(selectedCategory === category.name ? null : category.name)}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                    selectedCategory === category.name
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  {category.name} ({companies.filter(c => c.category === category.name && c.website).length})
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Site Preview Grid */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {filteredCompanies.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-500 text-lg">No organizations found</div>
            <p className="text-gray-400 mt-2">Try adjusting your search or category filter</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredCompanies.map((company, index) => {
              const categoryColor = CATEGORY_COLORS[company.category as keyof typeof CATEGORY_COLORS] || CATEGORY_COLORS.Other;
              
              return (
                <div
                  key={`${company.name}-${index}`}
                  className={`bg-white rounded-lg border-l-4 ${categoryColor} shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer group`}
                  onClick={() => window.open(company.website, '_blank')}
                >
                  <div className="p-4">
                    {/* Favicon and Name */}
                    <div className="flex items-center gap-3 mb-3">
                      <img
                        src={getFaviconUrl(company.website || '')}
                        alt={`${company.name} favicon`}
                        className="w-8 h-8 rounded-sm flex-shrink-0"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.src = `data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' width='32' height='32' viewBox='0 0 32 32'><rect width='32' height='32' fill='%23e5e7eb'/><text x='16' y='20' text-anchor='middle' fill='%236b7280' font-size='12' font-family='Arial'>${company.name.charAt(0).toUpperCase()}</text></svg>`;
                        }}
                      />
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-gray-900 truncate group-hover:text-blue-600 transition-colors">
                          {company.name}
                        </h3>
                        <p className="text-sm text-gray-500 truncate">
                          {company.category}
                        </p>
                      </div>
                    </div>

                    {/* Website URL */}
                    <div className="text-sm text-blue-600 truncate mb-2">
                      {(company.website || '').replace(/^https?:\/\//, '').replace(/\/$/, '')}
                    </div>

                    {/* Additional Info */}
                    <div className="flex items-center justify-between">
                      {company.tier && (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-800">
                          Tier {company.tier}
                        </span>
                      )}
                      <div className="text-xs text-gray-400 group-hover:text-blue-500 transition-colors">
                        Visit →
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}