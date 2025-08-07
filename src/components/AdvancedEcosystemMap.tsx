'use client';

import React, { useState, useMemo } from 'react';
import { EcosystemData } from '@/lib/googleSheets';

interface AdvancedEcosystemMapProps {
  companies: EcosystemData[];
}

const CATEGORY_CONFIG = {
  'Venture Capital': { color: '#3B82F6', priority: 1, section: 'funding' },
  'Impact Investor': { color: '#10B981', priority: 2, section: 'funding' },
  'Private Equity': { color: '#8B5CF6', priority: 3, section: 'funding' },
  'Incubators & Accelerators': { color: '#EF4444', priority: 4, section: 'support' },
  'Angel Syndicate & Network': { color: '#F59E0B', priority: 5, section: 'funding' },
  'Corporate Venture': { color: '#6B7280', priority: 6, section: 'corporate' },
  'Government': { color: '#059669', priority: 7, section: 'institutional' },
  'DFIs, FIs, & DOs': { color: '#92400E', priority: 8, section: 'institutional' },
  'Ecosystem Support': { color: '#0891B2', priority: 9, section: 'support' },
  'Media and Information Platforms': { color: '#C026D3', priority: 10, section: 'support' },
  'University Programs': { color: '#1D4ED8', priority: 11, section: 'education' },
  'Co-Working': { color: '#7C2D12', priority: 12, section: 'support' },
  'Other': { color: '#6B7280', priority: 13, section: 'other' }
};

export default function AdvancedEcosystemMap({ companies }: AdvancedEcosystemMapProps) {
  const [selectedCategories, setSelectedCategories] = useState<Set<string>>(new Set(Object.keys(CATEGORY_CONFIG)));
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'compact' | 'detailed'>('compact');

  const filteredCompanies = useMemo(() => {
    return companies.filter(company => {
      const category = company.category || 'Other';
      const matchesCategory = selectedCategories.has(category);
      const matchesSearch = company.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           (company.category && company.category.toLowerCase().includes(searchTerm.toLowerCase()));
      return matchesCategory && matchesSearch;
    });
  }, [companies, selectedCategories, searchTerm]);

  const groupedCompanies = useMemo(() => {
    const groups: Record<string, EcosystemData[]> = {};
    filteredCompanies.forEach(company => {
      const category = company.category || 'Other';
      if (!groups[category]) groups[category] = [];
      groups[category].push(company);
    });

    // Sort categories by priority
    const sortedGroups: Record<string, EcosystemData[]> = {};
    Object.keys(groups)
      .sort((a, b) => (CATEGORY_CONFIG[a as keyof typeof CATEGORY_CONFIG]?.priority || 99) - 
                     (CATEGORY_CONFIG[b as keyof typeof CATEGORY_CONFIG]?.priority || 99))
      .forEach(key => {
        sortedGroups[key] = groups[key];
      });

    return sortedGroups;
  }, [filteredCompanies]);

  const toggleCategory = (category: string) => {
    const newSelected = new Set(selectedCategories);
    if (newSelected.has(category)) {
      newSelected.delete(category);
    } else {
      newSelected.add(category);
    }
    setSelectedCategories(newSelected);
  };

  const toggleAll = () => {
    if (selectedCategories.size === Object.keys(CATEGORY_CONFIG).length) {
      setSelectedCategories(new Set());
    } else {
      setSelectedCategories(new Set(Object.keys(CATEGORY_CONFIG)));
    }
  };

  return (
    <div className="w-full bg-gray-50 rounded-lg">
      {/* Header */}
      <div className="bg-white rounded-t-lg border-b border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
              Bangladesh Startup Ecosystem Map
              <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                <span className="text-white text-xs">✓</span>
              </div>
            </h1>
            <p className="text-gray-600 mt-1">
              {filteredCompanies.length} of {companies.length} organizations • Interactive ecosystem visualization
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setViewMode(viewMode === 'compact' ? 'detailed' : 'compact')}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
            >
              {viewMode === 'compact' ? '📋 Detailed View' : '🎯 Compact View'}
            </button>
          </div>
        </div>

        {/* Search and Controls */}
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search organizations or categories..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <button
            onClick={toggleAll}
            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors whitespace-nowrap"
          >
            {selectedCategories.size === Object.keys(CATEGORY_CONFIG).length ? 'Unselect All' : 'Select All'}
          </button>
        </div>

        {/* Category Filters */}
        <div className="flex flex-wrap gap-2 mt-4">
          {Object.entries(CATEGORY_CONFIG).map(([category, config]) => {
            const isSelected = selectedCategories.has(category);
            const count = groupedCompanies[category]?.length || 0;
            
            return (
              <button
                key={category}
                onClick={() => toggleCategory(category)}
                className={`px-3 py-1 rounded-full text-sm font-medium transition-all duration-200 ${
                  isSelected 
                    ? 'text-white shadow-md' 
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
                style={{
                  backgroundColor: isSelected ? config.color : undefined,
                  borderColor: config.color,
                  border: `2px solid ${config.color}`
                }}
              >
                {category} ({count})
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Content */}
      <div className="p-6">
        {viewMode === 'compact' ? (
          // Compact Grid View
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {Object.entries(groupedCompanies).map(([category, categoryCompanies]) => {
              const config = CATEGORY_CONFIG[category as keyof typeof CATEGORY_CONFIG];
              if (!config || categoryCompanies.length === 0) return null;

              return (
                <div 
                  key={category} 
                  className="bg-white rounded-lg border-2 shadow-sm hover:shadow-md transition-shadow"
                  style={{ borderColor: `${config.color}40` }}
                >
                  <div 
                    className="p-4 rounded-t-lg"
                    style={{ backgroundColor: `${config.color}10` }}
                  >
                    <h3 
                      className="font-bold text-sm mb-1"
                      style={{ color: config.color }}
                    >
                      {category}
                    </h3>
                    <p className="text-xs text-gray-600">{categoryCompanies.length} organizations</p>
                  </div>
                  <div className="p-4 space-y-2 max-h-80 overflow-y-auto">
                    {categoryCompanies.map((company, index) => (
                      <div
                        key={`${company.name}-${index}`}
                        className="p-2 bg-gray-50 rounded cursor-pointer hover:bg-gray-100 transition-colors"
                        onClick={() => company.website && window.open(company.website, '_blank')}
                      >
                        <div className="font-medium text-sm text-gray-800 truncate">
                          {company.name}
                        </div>
                        {company.tier && (
                          <div className="text-xs text-gray-500">Tier {company.tier}</div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          // Detailed List View
          <div className="space-y-8">
            {Object.entries(groupedCompanies).map(([category, categoryCompanies]) => {
              const config = CATEGORY_CONFIG[category as keyof typeof CATEGORY_CONFIG];
              if (!config || categoryCompanies.length === 0) return null;

              return (
                <div key={category} className="bg-white rounded-lg shadow-sm border">
                  <div 
                    className="p-6 border-b"
                    style={{ backgroundColor: `${config.color}05` }}
                  >
                    <h2 
                      className="text-2xl font-bold flex items-center gap-3"
                      style={{ color: config.color }}
                    >
                      <div 
                        className="w-4 h-4 rounded-full"
                        style={{ backgroundColor: config.color }}
                      />
                      {category}
                      <span className="text-sm font-normal text-gray-500">
                        ({categoryCompanies.length} organizations)
                      </span>
                    </h2>
                  </div>
                  <div className="p-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                      {categoryCompanies.map((company, index) => (
                        <div
                          key={`${company.name}-${index}`}
                          className="p-4 border rounded-lg hover:shadow-md transition-shadow cursor-pointer group"
                          onClick={() => company.website && window.open(company.website, '_blank')}
                        >
                          <div className="font-medium text-gray-800 group-hover:text-blue-600 transition-colors">
                            {company.name}
                          </div>
                          {company.tier && (
                            <div className="text-sm text-gray-500 mt-1">Tier {company.tier}</div>
                          )}
                          {company.website && (
                            <div className="text-xs text-blue-500 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                              Click to visit →
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Empty State */}
        {filteredCompanies.length === 0 && (
          <div className="text-center py-20 bg-white rounded-lg">
            <div className="text-6xl mb-4">🔍</div>
            <h3 className="text-xl font-medium text-gray-900 mb-2">No organizations found</h3>
            <p className="text-gray-500 mb-4">
              Try adjusting your search terms or selecting different categories.
            </p>
            <button
              onClick={() => {
                setSearchTerm('');
                setSelectedCategories(new Set(Object.keys(CATEGORY_CONFIG)));
              }}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Reset Filters
            </button>
          </div>
        )}
      </div>
    </div>
  );
}