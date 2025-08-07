'use client';

import React, { useState, useMemo } from 'react';
import { EcosystemData } from '@/lib/googleSheets';

interface DynamicReferenceMapProps {
  companies: EcosystemData[];
}

const SECTION_COLORS = [
  '#4AAEDE', '#90C695', '#F4A261', '#E76F51',
  '#FFB085', '#C9A96E', '#A8DADC', '#457B9D',
  '#F1FAEE', '#E63946', '#A78BFA', '#34D399'
];

export default function DynamicReferenceMap({ companies }: DynamicReferenceMapProps) {
  const [hoveredCompany, setHoveredCompany] = useState<EcosystemData | null>(null);

  // Dynamically create sections from actual categories in the data
  const dynamicSections = useMemo(() => {
    // Get unique categories from the data
    const categories = [...new Set(companies.map(c => c.category || 'Other'))];
    
    // Create sections based on available categories
    const sections = categories.map((category, index) => {
      // Calculate grid position (4 columns layout like reference)
      const cols = 4;
      const row = Math.floor(index / cols);
      const col = index % cols;
      
      // Section dimensions
      const baseWidth = 220;
      const baseHeight = 160;
      const padding = 20;
      const startX = 20;
      const startY = 90;
      
      // Adjust for different row layouts
      let width = baseWidth;
      const height = baseHeight;
      let x = startX + (col * (baseWidth + padding));
      const y = startY + (row * (baseHeight + padding));
      
      // Make bottom sections wider if fewer items
      if (row >= 2 && categories.length <= (row * cols + col + 1)) {
        const remainingInRow = categories.length - (row * cols);
        if (remainingInRow <= 3) {
          width = (4 * baseWidth + 3 * padding) / remainingInRow - padding;
          x = startX + (col * (width + padding));
        }
      }
      
      return {
        id: category.toLowerCase().replace(/\s+/g, '-'),
        title: category,
        subtitle: category.toUpperCase(),
        color: SECTION_COLORS[index % SECTION_COLORS.length],
        x,
        y,
        width,
        height,
        category
      };
    });
    
    return sections;
  }, [companies]);

  // Group companies by their actual categories
  const sectionCompanies = useMemo(() => {
    const grouped: Record<string, EcosystemData[]> = {};
    
    dynamicSections.forEach(section => {
      grouped[section.id] = companies.filter(company => 
        (company.category || 'Other') === section.category
      );
    });
    
    return grouped;
  }, [companies, dynamicSections]);

  // Generate positions for companies within a section
  const generatePositions = (companies: EcosystemData[], section: typeof dynamicSections[0]) => {
    const positions: Array<{
      company: EcosystemData;
      x: number;
      y: number;
      width: number;
      height: number;
    }> = [];
    
    const padding = 8;
    const headerHeight = 35;
    const spacing = 1;
    
    const availableWidth = section.width - (padding * 2);
    const availableHeight = section.height - headerHeight - (padding * 2);
    
    // Adaptive card sizing based on company count
    const companyCount = companies.length;
    let cardWidth = Math.max(35, Math.min(55, availableWidth / Math.ceil(Math.sqrt(companyCount))));
    let cardHeight = Math.max(12, Math.min(18, availableHeight / Math.ceil(companyCount / Math.floor(availableWidth / cardWidth))));
    
    // Ensure cards fit
    const cols = Math.floor(availableWidth / (cardWidth + spacing));
    const rows = Math.floor(availableHeight / (cardHeight + spacing));
    const maxCards = cols * rows;
    
    // If too many companies, make cards smaller
    if (companyCount > maxCards) {
      const scaleFactor = Math.sqrt(maxCards / companyCount);
      cardWidth *= scaleFactor;
      cardHeight *= scaleFactor;
    }
    
    companies.forEach((company, index) => {
      const actualCols = Math.floor(availableWidth / (cardWidth + spacing));
      const row = Math.floor(index / actualCols);
      const col = index % actualCols;
      
      // Check if card fits in section
      const x = section.x + padding + (col * (cardWidth + spacing));
      const y = section.y + headerHeight + padding + (row * (cardHeight + spacing));
      
      if (x + cardWidth <= section.x + section.width - padding && 
          y + cardHeight <= section.y + section.height - padding) {
        positions.push({
          company,
          x,
          y,
          width: cardWidth,
          height: cardHeight
        });
      }
    });
    
    return positions;
  };

  // Calculate total map height based on sections
  const mapHeight = useMemo(() => {
    if (dynamicSections.length === 0) return 500;
    const maxY = Math.max(...dynamicSections.map(s => s.y + s.height));
    return maxY + 40; // Add some bottom padding
  }, [dynamicSections]);

  return (
    <div className="w-full bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Header */}
      <div className="bg-white p-6 border-b">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
              The Bangladesh Startup Ecosystem Map
              <div className="w-6 h-6 bg-teal-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
                ✓
              </div>
            </h1>
            <p className="text-teal-600 font-medium mt-1">A work in progress</p>
          </div>
          <div className="text-right">
            <div className="w-8 h-8 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>

      {/* Main map area */}
      <div 
        className="relative w-full bg-gradient-to-br from-blue-50 to-purple-50 p-4 overflow-hidden"
        style={{ height: `${mapHeight}px` }}
      >
        {dynamicSections.map(section => {
          const positions = generatePositions(sectionCompanies[section.id] || [], section);
          
          return (
            <div key={section.id}>
              {/* Section background */}
              <div
                className="absolute rounded-lg border-2"
                style={{
                  left: section.x,
                  top: section.y,
                  width: section.width,
                  height: section.height,
                  backgroundColor: section.color,
                  borderColor: `${section.color}CC`,
                  opacity: 0.3
                }}
              />
              
              {/* Section header */}
              <div
                className="absolute p-2"
                style={{
                  left: section.x + 8,
                  top: section.y + 6,
                  width: section.width - 16
                }}
              >
                <h3 className="font-bold text-sm text-gray-800 leading-tight truncate">
                  {section.title}
                </h3>
                <p className="text-xs text-gray-600 font-medium uppercase tracking-wide truncate">
                  {sectionCompanies[section.id]?.length || 0} organizations
                </p>
              </div>

              {/* Company logos/cards */}
              {positions.map((pos, index) => {
                const fontSize = Math.max(6, Math.min(9, pos.width / 6));
                
                return (
                  <div
                    key={`${pos.company.name}-${index}`}
                    className="absolute cursor-pointer hover:z-20 transition-all duration-200 hover:scale-110"
                    style={{
                      left: pos.x,
                      top: pos.y,
                      width: pos.width,
                      height: pos.height,
                      zIndex: 10
                    }}
                    onMouseEnter={() => setHoveredCompany(pos.company)}
                    onMouseLeave={() => setHoveredCompany(null)}
                    onClick={() => pos.company.website && window.open(pos.company.website, '_blank')}
                  >
                    <div 
                      className="bg-white rounded border border-gray-300 shadow-sm hover:shadow-md w-full h-full flex items-center justify-center px-1"
                      style={{
                        borderLeftColor: section.color,
                        borderLeftWidth: '2px'
                      }}
                    >
                      <span 
                        className="text-gray-700 font-medium text-center leading-none truncate"
                        style={{ fontSize: `${fontSize}px` }}
                        title={pos.company.name}
                      >
                        {pos.company.name.length > Math.floor(pos.width / 4) ? 
                          pos.company.name.substring(0, Math.floor(pos.width / 4) - 1) + '..' : 
                          pos.company.name}
                      </span>
                    </div>
                  </div>
                );
              })}

              {/* Company count badge */}
              <div
                className="absolute bg-white bg-opacity-90 px-2 py-1 rounded text-xs font-bold text-gray-700 shadow-sm"
                style={{
                  right: section.x + section.width - 8,
                  top: section.y + 8,
                  transform: 'translateX(100%)',
                  zIndex: 15,
                  backgroundColor: section.color,
                  color: 'white'
                }}
              >
                {sectionCompanies[section.id]?.length || 0}
              </div>
            </div>
          );
        })}

        {/* Hover tooltip */}
        {hoveredCompany && (
          <div 
            className="absolute bg-black bg-opacity-90 text-white px-3 py-2 rounded shadow-xl pointer-events-none z-50"
            style={{
              left: '50%',
              top: '10px',
              transform: 'translateX(-50%)'
            }}
          >
            <div className="font-bold text-sm">{hoveredCompany.name}</div>
            <div className="text-xs opacity-75">{hoveredCompany.category}</div>
            {hoveredCompany.tier && (
              <div className="text-xs text-blue-300">Tier {hoveredCompany.tier}</div>
            )}
            {hoveredCompany.website && (
              <div className="text-xs text-green-300 mt-1">Click to visit →</div>
            )}
          </div>
        )}
      </div>

      {/* Footer stats */}
      <div className="bg-white border-t p-4">
        <div className="flex justify-center space-x-6 text-sm">
          <div className="text-center">
            <div className="font-bold text-lg text-gray-900">{companies.length}</div>
            <div className="text-gray-600">Total Organizations</div>
          </div>
          <div className="text-center">
            <div className="font-bold text-lg text-teal-600">{dynamicSections.length}</div>
            <div className="text-gray-600">Categories</div>
          </div>
          <div className="text-center">
            <div className="font-bold text-lg text-purple-600">
              {Object.values(sectionCompanies).reduce((max, arr) => Math.max(max, arr.length), 0)}
            </div>
            <div className="text-gray-600">Largest Category</div>
          </div>
        </div>
      </div>
    </div>
  );
}