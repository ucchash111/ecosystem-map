'use client';

import React from 'react';
import { EcosystemData } from '@/lib/googleSheets';

interface VisualEcosystemMapProps {
  companies: EcosystemData[];
}

const CATEGORY_COLORS = {
  'Venture Capital': '#3B82F6',
  'Impact Investor': '#10B981', 
  'Private Equity': '#8B5CF6',
  'Incubators & Accelerators': '#EF4444',
  'Angel Syndicate & Network': '#F59E0B',
  'Corporate Venture': '#6B7280',
  'Government': '#059669',
  'DFIs, FIs, & DOs': '#92400E',
  'Ecosystem Support': '#0891B2',
  'Media and Information Platforms': '#C026D3',
  'University Programs': '#1D4ED8',
  'Co-Working': '#7C2D12',
  'Other': '#6B7280'
};

// Define strategic layout sections like the reference image
const LAYOUT_SECTIONS = [
  { id: 'vc', title: 'Venture Capital', x: 20, y: 100, width: 280, height: 200, maxItems: 25 },
  { id: 'impact', title: 'Impact Investor', x: 320, y: 100, width: 280, height: 200, maxItems: 20 },
  { id: 'pe', title: 'Private Equity', x: 620, y: 100, width: 280, height: 200, maxItems: 15 },
  { id: 'incubator', title: 'Incubators & Accelerators', x: 20, y: 320, width: 280, height: 160, maxItems: 20 },
  { id: 'corporate', title: 'Corporate Venture', x: 320, y: 320, width: 280, height: 160, maxItems: 15 },
  { id: 'angel', title: 'Angel Syndicate & Network', x: 620, y: 320, width: 280, height: 160, maxItems: 12 },
  { id: 'other', title: 'Other Organizations', x: 20, y: 500, width: 880, height: 120, maxItems: 30 }
];

export default function VisualEcosystemMap({ companies }: VisualEcosystemMapProps) {
  // Group companies by category
  const categoryGroups = companies.reduce((acc, company) => {
    let category = company.category || 'Other';
    
    // Map categories to layout sections
    if (!CATEGORY_COLORS[category as keyof typeof CATEGORY_COLORS]) {
      category = 'Other';
    }
    
    if (!acc[category]) acc[category] = [];
    acc[category].push(company);
    return acc;
  }, {} as Record<string, EcosystemData[]>);

  const generateCompanyPositions = (sectionData: typeof LAYOUT_SECTIONS[0], companies: EcosystemData[]) => {
    const positions: Array<{ x: number; y: number; company: EcosystemData }> = [];
    const itemsToShow = Math.min(companies.length, sectionData.maxItems);
    
    // Calculate grid dimensions
    const padding = 25;
    const cardWidth = 75;
    const cardHeight = 25;
    const availableWidth = sectionData.width - (padding * 2);
    const availableHeight = sectionData.height - (padding * 2) - 20; // space for title
    
    const cols = Math.floor(availableWidth / (cardWidth + 5));
    const rows = Math.ceil(itemsToShow / cols);
    
    for (let i = 0; i < itemsToShow; i++) {
      const row = Math.floor(i / cols);
      const col = i % cols;
      
      // Add some randomness to avoid perfect grid
      const randomOffsetX = (Math.random() - 0.5) * 10;
      const randomOffsetY = (Math.random() - 0.5) * 8;
      
      const x = sectionData.x + padding + (col * (cardWidth + 5)) + randomOffsetX;
      const y = sectionData.y + 25 + (row * (cardHeight + 3)) + randomOffsetY;
      
      positions.push({ x, y, company: companies[i] });
    }
    
    return positions;
  };

  return (
    <div className="w-full bg-gray-50 p-4 rounded-lg">
      <div className="mb-4 text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-1 flex items-center justify-center gap-2">
          Bangladesh Startup Ecosystem Map
          <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
            <span className="text-white text-xs">✓</span>
          </div>
        </h1>
        <p className="text-gray-600 text-sm">A work in progress • {companies.length} organizations</p>
      </div>

      <div className="relative w-full h-[650px] bg-white border-2 border-gray-200 rounded-lg overflow-hidden">
        {LAYOUT_SECTIONS.map(section => {
          const categoryKey = section.title as keyof typeof CATEGORY_COLORS;
          const companies = categoryGroups[categoryKey] || [];
          const color = CATEGORY_COLORS[categoryKey] || '#6B7280';
          
          if (companies.length === 0 && section.id !== 'other') return null;
          
          // For "Other Organizations" section, collect all remaining categories
          let companiesToShow = companies;
          if (section.id === 'other') {
            companiesToShow = Object.entries(categoryGroups)
              .filter(([cat]) => !LAYOUT_SECTIONS.some(s => s.title === cat) || cat === 'Other')
              .flatMap(([, comps]) => comps);
          }
          
          const positions = generateCompanyPositions(section, companiesToShow);
          
          return (
            <div key={section.id}>
              {/* Section background */}
              <div
                className="absolute rounded-md border"
                style={{
                  left: section.x,
                  top: section.y,
                  width: section.width,
                  height: section.height,
                  backgroundColor: `${color}08`,
                  borderColor: `${color}25`
                }}
              >
                <div 
                  className="absolute top-2 left-3 text-sm font-bold"
                  style={{ color: color }}
                >
                  {section.title}
                </div>
              </div>

              {/* Company cards */}
              {positions.map(({ x, y, company }, index) => (
                <div
                  key={`${company.name}-${index}`}
                  className="absolute cursor-pointer hover:scale-105 transition-all duration-150 hover:z-30"
                  style={{ left: x, top: y, zIndex: 10 }}
                  onClick={() => company.website && window.open(company.website, '_blank')}
                >
                  <div 
                    className="bg-white border border-gray-300 rounded px-2 py-1 shadow-sm hover:shadow-md text-center"
                    style={{
                      borderLeftColor: color,
                      borderLeftWidth: '3px',
                      minWidth: '70px',
                      maxWidth: '75px',
                      fontSize: '9px'
                    }}
                  >
                    <div className="font-medium text-gray-800 leading-tight truncate">
                      {company.name}
                    </div>
                  </div>
                </div>
              ))}

              {/* Show count if more companies */}
              {companiesToShow.length > section.maxItems && (
                <div
                  className="absolute text-xs text-gray-500 font-medium bg-white px-2 py-1 rounded border"
                  style={{
                    left: section.x + section.width - 80,
                    top: section.y + section.height - 25,
                    zIndex: 20
                  }}
                >
                  +{companiesToShow.length - section.maxItems} more
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Compact Legend */}
      <div className="mt-3 flex flex-wrap gap-3 justify-center">
        {Object.entries(CATEGORY_COLORS).slice(0, 8).map(([category, color]) => (
          <div key={category} className="flex items-center space-x-1">
            <div 
              className="w-3 h-3 rounded border"
              style={{ 
                backgroundColor: `${color}30`,
                borderColor: color 
              }}
            />
            <span className="text-xs text-gray-700">{category}</span>
          </div>
        ))}
      </div>
    </div>
  );
}