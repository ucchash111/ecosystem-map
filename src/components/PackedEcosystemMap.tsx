'use client';

import React, { useState, useEffect, useRef } from 'react';
import { EcosystemData } from '@/lib/googleSheets';

interface PackedEcosystemMapProps {
  companies: EcosystemData[];
}

const MAP_SECTIONS = [
  {
    id: 'consumer',
    title: 'CONSUMER',
    color: '#60A5FA',
    x: 20,
    y: 80,
    width: 300,
    height: 220,
    categories: ['Venture Capital', 'Impact Investor']
  },
  {
    id: 'enterprise-h',
    title: 'ENTERPRISE HORIZONTAL',
    color: '#34D399',
    x: 340,
    y: 80,
    width: 300,
    height: 220,
    categories: ['Incubators & Accelerators', 'Ecosystem Support']
  },
  {
    id: 'enterprise-v',
    title: 'ENTERPRISE VERTICAL',
    color: '#F87171',
    x: 660,
    y: 80,
    width: 300,
    height: 220,
    categories: ['Corporate Venture', 'Private Equity']
  },
  {
    id: 'prosumer',
    title: 'PROSUMER',
    color: '#A78BFA',
    x: 20,
    y: 320,
    width: 940,
    height: 180,
    categories: ['Government', 'DFIs, FIs, & DOs', 'Angel Syndicate & Network', 'Media and Information Platforms', 'University Programs', 'Co-Working', 'Other']
  }
];

interface CompanyCard {
  company: EcosystemData;
  x: number;
  y: number;
  width: number;
  height: number;
  fontSize: number;
}

export default function PackedEcosystemMap({ companies }: PackedEcosystemMapProps) {
  const [hoveredCompany, setHoveredCompany] = useState<EcosystemData | null>(null);
  const [packedCards, setPackedCards] = useState<Record<string, CompanyCard[]>>({});

  // Pack companies into sections using a simple bin packing algorithm
  const packCompanies = (sectionCompanies: EcosystemData[], section: typeof MAP_SECTIONS[0]): CompanyCard[] => {
    const cards: CompanyCard[] = [];
    const padding = 15;
    const headerHeight = 35;
    
    const availableWidth = section.width - (padding * 2);
    const availableHeight = section.height - headerHeight - (padding * 2);
    
    // Base card dimensions - smaller for dense packing
    const baseWidth = 70;
    const baseHeight = 20;
    const spacing = 2;
    
    // Calculate how many we can fit and adjust size accordingly
    const maxCols = Math.floor(availableWidth / (baseWidth + spacing));
    const maxRows = Math.floor(availableHeight / (baseHeight + spacing));
    const maxCards = maxCols * maxRows;
    
    // If we have more companies than can fit, make cards smaller
    let cardWidth = baseWidth;
    let cardHeight = baseHeight;
    let fontSize = 10;
    
    if (sectionCompanies.length > maxCards) {
      const scaleFactor = Math.sqrt(maxCards / sectionCompanies.length);
      cardWidth = Math.max(50, baseWidth * scaleFactor);
      cardHeight = Math.max(16, baseHeight * scaleFactor);
      fontSize = Math.max(7, 10 * scaleFactor);
    }
    
    // Recalculate cols with new card width
    const cols = Math.floor(availableWidth / (cardWidth + spacing));
    
    sectionCompanies.forEach((company, index) => {
      if (index >= maxCards * 1.5) return; // Hard limit to prevent overflow
      
      const row = Math.floor(index / cols);
      const col = index % cols;
      
      // Add slight randomization for organic look
      const jitterX = (Math.random() - 0.5) * Math.min(spacing, 3);
      const jitterY = (Math.random() - 0.5) * Math.min(spacing, 2);
      
      const x = section.x + padding + (col * (cardWidth + spacing)) + jitterX;
      const y = section.y + headerHeight + padding + (row * (cardHeight + spacing)) + jitterY;
      
      // Ensure cards don't overflow section bounds
      if (x + cardWidth <= section.x + section.width - padding && 
          y + cardHeight <= section.y + section.height - padding) {
        cards.push({
          company,
          x: Math.max(section.x + padding, x),
          y: Math.max(section.y + headerHeight + padding, y),
          width: cardWidth,
          height: cardHeight,
          fontSize
        });
      }
    });
    
    return cards;
  };

  useEffect(() => {
    const packed: Record<string, CompanyCard[]> = {};
    
    MAP_SECTIONS.forEach(section => {
      const sectionCompanies = companies.filter(company => 
        section.categories.includes(company.category || 'Other')
      );
      packed[section.id] = packCompanies(sectionCompanies, section);
    });
    
    setPackedCards(packed);
  }, [companies]);

  return (
    <div className="w-full bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg">
      {/* Header */}
      <div className="bg-white rounded-t-lg border-b-2 border-gray-200 p-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            The Bangladesh Startup Ecosystem Map
            <span className="ml-3 inline-flex items-center justify-center w-8 h-8 bg-green-500 text-white rounded-full text-sm">
              ✓
            </span>
          </h1>
          <p className="text-lg text-gray-600 font-medium">
            A work in progress
          </p>
        </div>
      </div>

      {/* Main Map */}
      <div className="relative w-full h-[540px] bg-white overflow-hidden">
        {MAP_SECTIONS.map((section) => (
          <div key={section.id}>
            {/* Section Background */}
            <div
              className="absolute border-2 rounded-lg"
              style={{
                left: section.x,
                top: section.y,
                width: section.width,
                height: section.height,
                backgroundColor: `${section.color}10`,
                borderColor: `${section.color}40`
              }}
            />
            
            {/* Section Header */}
            <div
              className="absolute px-4 py-2 font-bold text-sm tracking-wide"
              style={{
                left: section.x + 10,
                top: section.y + 8,
                color: section.color
              }}
            >
              {section.title}
            </div>

            {/* Company Cards */}
            {packedCards[section.id]?.map((card, index) => (
              <div
                key={`${card.company.name}-${index}`}
                className="absolute cursor-pointer transition-all duration-200 hover:scale-110 hover:z-30 hover:shadow-lg"
                style={{ 
                  left: card.x, 
                  top: card.y,
                  width: card.width,
                  height: card.height,
                  zIndex: 10
                }}
                onMouseEnter={() => setHoveredCompany(card.company)}
                onMouseLeave={() => setHoveredCompany(null)}
                onClick={() => card.company.website && window.open(card.company.website, '_blank')}
              >
                <div 
                  className="bg-white border border-gray-300 rounded px-1 py-0.5 shadow-sm hover:shadow-md w-full h-full flex items-center justify-center text-center"
                  style={{
                    borderLeftColor: section.color,
                    borderLeftWidth: '2px'
                  }}
                >
                  <div 
                    className="font-medium text-gray-800 leading-tight truncate"
                    style={{ fontSize: `${card.fontSize}px` }}
                    title={card.company.name}
                  >
                    {card.company.name.length > 12 ? 
                      card.company.name.substring(0, 10) + '..' : 
                      card.company.name}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ))}

        {/* Hover Tooltip */}
        {hoveredCompany && (
          <div 
            className="absolute bg-gray-900 bg-opacity-95 text-white px-4 py-3 rounded-lg shadow-xl pointer-events-none z-40 max-w-xs"
            style={{
              left: '50%',
              top: '20px',
              transform: 'translateX(-50%)'
            }}
          >
            <div className="font-bold text-sm">{hoveredCompany.name}</div>
            <div className="text-xs text-gray-300">{hoveredCompany.category}</div>
            {hoveredCompany.tier && (
              <div className="text-xs text-blue-300">Tier {hoveredCompany.tier}</div>
            )}
            {hoveredCompany.website && (
              <div className="text-xs text-green-300 mt-1">💡 Click to visit website</div>
            )}
          </div>
        )}

        {/* Corner Branding */}
        <div className="absolute bottom-4 right-4 bg-white bg-opacity-90 px-3 py-2 rounded-lg shadow-md">
          <div className="text-xs font-bold text-gray-700">Startup</div>
          <div className="text-xs text-gray-500">Bangladesh</div>
        </div>
      </div>

      {/* Stats Footer */}
      <div className="bg-gray-50 rounded-b-lg p-4 border-t border-gray-200">
        <div className="flex justify-center space-x-8 text-sm">
          {MAP_SECTIONS.map(section => {
            const count = packedCards[section.id]?.length || 0;
            return (
              <div key={section.id} className="text-center">
                <div className="font-bold" style={{ color: section.color }}>
                  {count}
                </div>
                <div className="text-gray-600 text-xs">
                  {section.title.split(' ')[0]}
                </div>
              </div>
            );
          })}
          <div className="text-center">
            <div className="font-bold text-gray-900">
              {Object.values(packedCards).flat().length}
            </div>
            <div className="text-gray-600 text-xs">TOTAL</div>
          </div>
        </div>
      </div>
    </div>
  );
}