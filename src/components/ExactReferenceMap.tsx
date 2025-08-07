'use client';

import React, { useState } from 'react';
import { EcosystemData } from '@/lib/googleSheets';

interface ExactReferenceMapProps {
  companies: EcosystemData[];
}

// Exact layout matching the reference image
const SECTIONS = [
  // Top row - 4 sections
  {
    id: 'consumer',
    title: 'Consumer',
    subtitle: 'B2C / CONVERSATIONAL',
    color: '#4AAEDE',
    x: 20,
    y: 90,
    width: 220,
    height: 160,
    categories: ['Venture Capital', 'Impact Investor']
  },
  {
    id: 'models',
    title: 'Models',
    subtitle: 'APIS / INFRASTRUCTURE',
    color: '#90C695',
    x: 260,
    y: 90,
    width: 220,
    height: 160,
    categories: ['Private Equity']
  },
  {
    id: 'medical',
    title: 'Medical & Health',
    subtitle: 'VERTICAL APPLICATIONS',
    color: '#F4A261',
    x: 500,
    y: 90,
    width: 220,
    height: 160,
    categories: ['Corporate Venture']
  },
  {
    id: 'gaming',
    title: 'Gaming',
    subtitle: 'ENTERTAINMENT',
    color: '#E76F51',
    x: 740,
    y: 90,
    width: 220,
    height: 160,
    categories: ['Angel Syndicate & Network']
  },
  // Middle row - 3 sections
  {
    id: 'enterprise-horizontal',
    title: 'Enterprise Horizontal',
    subtitle: 'HR / AUTOMATION',
    color: '#FFB085',
    x: 20,
    y: 270,
    width: 300,
    height: 160,
    categories: ['Incubators & Accelerators', 'Ecosystem Support']
  },
  {
    id: 'enterprise-vertical',
    title: 'Enterprise Vertical',
    subtitle: 'HEALTHCARE',
    color: '#C9A96E',
    x: 340,
    y: 270,
    width: 300,
    height: 160,
    categories: ['Government', 'DFIs, FIs, & DOs']
  },
  {
    id: 'enterprise-legal',
    title: 'Legal',
    subtitle: 'LEGAL',
    color: '#A8DADC',
    x: 660,
    y: 270,
    width: 300,
    height: 160,
    categories: ['Media and Information Platforms', 'University Programs']
  },
  // Bottom row - 4 sections  
  {
    id: 'prosumer-digital',
    title: 'Digital Marketing',
    subtitle: 'MARKETING',
    color: '#457B9D',
    x: 20,
    y: 450,
    width: 180,
    height: 140,
    categories: ['Co-Working']
  },
  {
    id: 'prosumer-creator',
    title: 'Creator Tools',
    subtitle: 'CONTENT CREATION / EDITING',
    color: '#F1FAEE',
    x: 220,
    y: 450,
    width: 240,
    height: 140,
    categories: ['Other']
  },
  {
    id: 'prosumer-video',
    title: 'Video Creation',
    subtitle: 'VIDEO CREATION / EDITING',
    color: '#A8DADC',
    x: 480,
    y: 450,
    width: 220,
    height: 140,
    categories: []
  },
  {
    id: 'prosumer-support',
    title: 'Support & Tools',
    subtitle: 'SUPPORT SYSTEMS',
    color: '#E63946',
    x: 720,
    y: 450,
    width: 240,
    height: 140,
    categories: []
  }
];

export default function ExactReferenceMap({ companies }: ExactReferenceMapProps) {
  const [hoveredCompany, setHoveredCompany] = useState<EcosystemData | null>(null);

  // Distribute companies across all sections evenly
  const distributeCompanies = () => {
    const distributed: Record<string, EcosystemData[]> = {};
    
    // Initialize all sections
    SECTIONS.forEach(section => {
      distributed[section.id] = [];
    });
    
    // First, place companies in their category sections
    companies.forEach(company => {
      const category = company.category || 'Other';
      const section = SECTIONS.find(s => s.categories.includes(category));
      if (section) {
        distributed[section.id].push(company);
      } else {
        // Distribute remaining companies across empty sections
        const emptySections = SECTIONS.filter(s => s.categories.length === 0);
        if (emptySections.length > 0) {
          const targetSection = emptySections[Math.floor(Math.random() * emptySections.length)];
          distributed[targetSection.id].push(company);
        }
      }
    });
    
    // Balance the distribution - move excess companies to less populated sections
    const totalCompanies = companies.length;
    const averagePerSection = Math.ceil(totalCompanies / SECTIONS.length);
    
    SECTIONS.forEach(section => {
      const currentCount = distributed[section.id].length;
      if (currentCount > averagePerSection * 1.5) {
        // Move excess companies to less populated sections
        const excess = distributed[section.id].slice(averagePerSection);
        distributed[section.id] = distributed[section.id].slice(0, averagePerSection);
        
        excess.forEach(company => {
          // Find section with least companies
          const leastPopulated = SECTIONS.reduce((min, current) => 
            distributed[current.id].length < distributed[min.id].length ? current : min
          );
          distributed[leastPopulated.id].push(company);
        });
      }
    });
    
    return distributed;
  };

  const sectionCompanies = distributeCompanies();

  // Generate positions for companies within a section
  const generatePositions = (companies: EcosystemData[], section: typeof SECTIONS[0]) => {
    const positions: Array<{
      company: EcosystemData;
      x: number;
      y: number;
      width: number;
      height: number;
    }> = [];
    const padding = 8;
    const headerHeight = 30;
    const cardWidth = 48;
    const cardHeight = 14;
    const spacing = 1;
    
    const availableWidth = section.width - (padding * 2);
    const availableHeight = section.height - headerHeight - (padding * 2);
    
    const cols = Math.floor(availableWidth / (cardWidth + spacing));
    const rows = Math.floor(availableHeight / (cardHeight + spacing));
    
    companies.slice(0, cols * rows).forEach((company, index) => {
      const row = Math.floor(index / cols);
      const col = index % cols;
      
      positions.push({
        company,
        x: section.x + padding + (col * (cardWidth + spacing)),
        y: section.y + headerHeight + padding + (row * (cardHeight + spacing)),
        width: cardWidth,
        height: cardHeight
      });
    });
    
    return positions;
  };

  return (
    <div className="w-full bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Header - exactly like reference */}
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
      <div className="relative w-full h-[620px] bg-gradient-to-br from-blue-50 to-purple-50 p-4">
        {SECTIONS.map(section => {
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
                <h3 className="font-bold text-sm text-gray-800 leading-tight">
                  {section.title}
                </h3>
                <p className="text-xs text-gray-600 font-medium uppercase tracking-wide">
                  {section.subtitle}
                </p>
              </div>

              {/* Company logos/cards */}
              {positions.map((pos, index) => (
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
                  >
                    <span 
                      className="text-gray-700 font-medium text-center leading-none truncate"
                      style={{ fontSize: '7px' }}
                      title={pos.company.name}
                    >
                      {pos.company.name.length > 8 ? 
                        pos.company.name.substring(0, 7) + '..' : 
                        pos.company.name}
                    </span>
                  </div>
                </div>
              ))}
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
            {hoveredCompany.website && (
              <div className="text-xs text-blue-300 mt-1">Click to visit →</div>
            )}
          </div>
        )}
      </div>

      {/* Footer stats */}
      <div className="bg-white border-t p-4">
        <div className="text-center text-sm text-gray-600">
          {companies.length} organizations mapped across {SECTIONS.length} categories
        </div>
      </div>
    </div>
  );
}