'use client';

import React, { useState, useEffect } from 'react';
import { EcosystemData } from '@/lib/googleSheets';

interface SectionedEcosystemMapProps {
  companies: EcosystemData[];
}

// Define the sectioned layout like the reference image
const MAP_SECTIONS = [
  {
    id: 'funding',
    title: 'FUNDING',
    subtitle: 'Capital & Investment',
    color: '#3B82F6',
    x: 20,
    y: 80,
    width: 280,
    height: 280,
    categories: ['Venture Capital', 'Impact Investor', 'Angel Syndicate & Network']
  },
  {
    id: 'acceleration',
    title: 'ACCELERATION',
    subtitle: 'Growth & Support',
    color: '#EF4444',
    x: 320,
    y: 80,
    width: 280,
    height: 280,
    categories: ['Incubators & Accelerators', 'Ecosystem Support']
  },
  {
    id: 'corporate',
    title: 'CORPORATE',
    subtitle: 'Enterprise & Private Equity',
    color: '#8B5CF6',
    x: 620,
    y: 80,
    width: 280,
    height: 280,
    categories: ['Corporate Venture', 'Private Equity']
  },
  {
    id: 'institutional',
    title: 'INSTITUTIONAL',
    subtitle: 'Government & Financial Institutions',
    color: '#059669',
    x: 20,
    y: 380,
    width: 420,
    height: 180,
    categories: ['Government', 'DFIs, FIs, & DOs']
  },
  {
    id: 'ecosystem',
    title: 'ECOSYSTEM',
    subtitle: 'Support & Infrastructure',
    color: '#F59E0B',
    x: 460,
    y: 380,
    width: 440,
    height: 180,
    categories: ['Media and Information Platforms', 'University Programs', 'Co-Working', 'Other']
  }
];

export default function SectionedEcosystemMap({ companies }: SectionedEcosystemMapProps) {
  const [hoveredCompany, setHoveredCompany] = useState<EcosystemData | null>(null);
  const [animationDelay, setAnimationDelay] = useState<Record<string, number>>({});

  // Group companies by section
  const sectionCompanies = MAP_SECTIONS.map(section => ({
    ...section,
    companies: companies.filter(company => 
      section.categories.includes(company.category || 'Other')
    )
  }));

  // Generate staggered animation delays
  useEffect(() => {
    const delays: Record<string, number> = {};
    let totalDelay = 0;
    
    sectionCompanies.forEach((section) => {
      section.companies.forEach((company, index) => {
        delays[`${company.name}-${index}`] = totalDelay;
        totalDelay += Math.random() * 100 + 50; // 50-150ms intervals
      });
    });
    
    setAnimationDelay(delays);
  }, [companies]);

  const generateCompanyPosition = (sectionIndex: number, companyIndex: number, totalCompanies: number) => {
    const section = MAP_SECTIONS[sectionIndex];
    
    // Adaptive sizing based on number of companies
    const baseCardWidth = Math.max(65, 90 - Math.floor(totalCompanies / 10));
    const baseCardHeight = Math.max(18, 24 - Math.floor(totalCompanies / 15));
    const padding = 15;
    
    const availableWidth = section.width - (padding * 2);
    const availableHeight = section.height - 45 - (padding * 2); // Account for title
    
    // Dynamic spacing based on density
    const spacingX = Math.max(2, 6 - Math.floor(totalCompanies / 20));
    const spacingY = Math.max(2, 4 - Math.floor(totalCompanies / 25));
    
    const cols = Math.floor(availableWidth / (baseCardWidth + spacingX));
    const maxRows = Math.floor(availableHeight / (baseCardHeight + spacingY));
    const maxItems = cols * maxRows;
    
    if (companyIndex >= maxItems) return null; // Don't show if too many
    
    const row = Math.floor(companyIndex / cols);
    const col = companyIndex % cols;
    
    // Smart randomization that avoids overlaps
    const baseX = col * (baseCardWidth + spacingX);
    const baseY = row * (baseCardHeight + spacingY);
    
    // Controlled jitter within safe bounds
    const maxJitterX = Math.min(spacingX / 2, 4);
    const maxJitterY = Math.min(spacingY / 2, 3);
    const jitterX = (Math.random() - 0.5) * maxJitterX;
    const jitterY = (Math.random() - 0.5) * maxJitterY;
    
    return {
      x: section.x + padding + baseX + jitterX,
      y: section.y + 40 + padding + baseY + jitterY,
      width: baseCardWidth,
      height: baseCardHeight,
      fontSize: Math.max(8, 11 - Math.floor(totalCompanies / 30)),
      visible: companyIndex < maxItems
    };
  };

  return (
    <div className="w-full bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg">
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
            A work in progress • {companies.length} organizations mapped
          </p>
        </div>
      </div>

      {/* Main Map */}
      <div className="relative w-full h-[600px] bg-gradient-to-br from-blue-50 via-purple-50 to-green-50 overflow-hidden">
        {sectionCompanies.map((section, sectionIndex) => (
          <div key={section.id}>
            {/* Section Background */}
            <div
              className="absolute border-2 border-opacity-60 rounded-lg shadow-sm"
              style={{
                left: section.x,
                top: section.y,
                width: section.width,
                height: section.height,
                backgroundColor: `${section.color}08`,
                borderColor: `${section.color}40`
              }}
            />
            
            {/* Section Header */}
            <div
              className="absolute rounded-t-lg px-4 py-2 border-b-2"
              style={{
                left: section.x,
                top: section.y,
                width: section.width,
                backgroundColor: `${section.color}15`,
                borderColor: `${section.color}60`
              }}
            >
              <h2 
                className="text-lg font-bold tracking-wide"
                style={{ color: section.color }}
              >
                {section.title}
              </h2>
              <p className="text-xs text-gray-600 font-medium">
                {section.subtitle} • {section.companies.length} orgs
              </p>
            </div>

            {/* Company Cards */}
            {section.companies.map((company, companyIndex) => {
              const position = generateCompanyPosition(sectionIndex, companyIndex, section.companies.length);
              
              if (!position || !position.visible) {
                return null;
              }

              const cardKey = `${company.name}-${companyIndex}`;
              const delay = animationDelay[cardKey] || 0;

              return (
                <div
                  key={cardKey}
                  className="absolute cursor-pointer transition-all duration-300 hover:scale-105 hover:z-30 hover:shadow-xl animate-in fade-in slide-in-from-bottom-4"
                  style={{ 
                    left: position.x, 
                    top: position.y,
                    width: position.width,
                    height: position.height,
                    zIndex: 10,
                    animationDelay: `${delay}ms`,
                    animationDuration: '600ms',
                    animationFillMode: 'both'
                  }}
                  onMouseEnter={() => setHoveredCompany(company)}
                  onMouseLeave={() => setHoveredCompany(null)}
                  onClick={() => company.website && window.open(company.website, '_blank')}
                >
                  <div 
                    className="bg-white border-l-3 border border-gray-200 rounded-sm px-2 py-1 shadow-sm hover:shadow-md w-full h-full flex flex-col justify-center"
                    style={{
                      borderLeftColor: section.color,
                      borderLeftWidth: '3px'
                    }}
                  >
                    <div 
                      className="font-semibold text-gray-800 leading-tight truncate text-center"
                      style={{ fontSize: `${position.fontSize}px` }}
                    >
                      {company.name.length > 15 ? company.name.substring(0, 12) + '...' : company.name}
                    </div>
                    {company.tier && position.height > 20 && (
                      <div 
                        className="text-gray-500 text-center mt-0.5"
                        style={{ fontSize: `${Math.max(6, position.fontSize - 2)}px` }}
                      >
                        T{company.tier}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

            {/* Smart overflow indicator */}
            {(() => {
              const maxVisible = Math.floor((section.width - 30) / 75) * Math.floor((section.height - 85) / 25);
              const hiddenCount = Math.max(0, section.companies.length - maxVisible);
              
              if (hiddenCount > 0) {
                return (
                  <div
                    className="absolute bg-gradient-to-r from-blue-500 to-purple-600 text-white px-3 py-1 rounded-full text-xs font-bold shadow-lg animate-pulse"
                    style={{
                      left: section.x + section.width - 90,
                      top: section.y + section.height - 25,
                      zIndex: 25
                    }}
                  >
                    +{hiddenCount} more
                  </div>
                );
              }
              return null;
            })()}
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

        {/* Corner Logo/Branding */}
        <div className="absolute bottom-4 right-4 bg-white bg-opacity-90 px-3 py-2 rounded-lg shadow-md">
          <div className="text-xs font-bold text-gray-700">Bangladesh Startup</div>
          <div className="text-xs text-gray-500">Ecosystem Map</div>
        </div>
      </div>

      {/* Section Legend */}
      <div className="bg-white rounded-b-lg p-4 border-t border-gray-200">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {MAP_SECTIONS.map(section => (
            <div key={section.id} className="flex items-center space-x-3">
              <div 
                className="w-4 h-4 rounded border-2"
                style={{ 
                  backgroundColor: `${section.color}20`,
                  borderColor: section.color 
                }}
              />
              <div>
                <div className="text-sm font-bold" style={{ color: section.color }}>
                  {section.title}
                </div>
                <div className="text-xs text-gray-500">
                  {sectionCompanies.find(s => s.id === section.id)?.companies.length || 0} orgs
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}