'use client';

import React, { useEffect, useRef, useState, useMemo } from 'react';
import * as d3 from 'd3';
import { EcosystemData } from '@/lib/googleSheets';

interface Node extends d3.SimulationNodeDatum {
  id: string;
  name: string;
  category: string;
  tier?: string;
  website?: string;
  color: string;
  size: number;
  group: number;
}

interface Link extends d3.SimulationLinkDatum<Node> {
  source: string | Node;
  target: string | Node;
  strength: number;
}

interface ForceDirectedMapProps {
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

const CATEGORY_GROUPS = {
  'Venture Capital': 1,
  'Impact Investor': 1,
  'Private Equity': 1,
  'Angel Syndicate & Network': 1,
  'Incubators & Accelerators': 2,
  'Corporate Venture': 3,
  'Government': 4,
  'DFIs, FIs, & DOs': 4,
  'Ecosystem Support': 5,
  'Media and Information Platforms': 5,
  'University Programs': 6,
  'Co-Working': 5,
  'Other': 7
};

export default function ForceDirectedMap({ companies }: ForceDirectedMapProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [hoveredNode, setHoveredNode] = useState<Node | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const { nodes, links } = useMemo(() => {
    const nodes: Node[] = [];
    const links: Link[] = [];
    
    // Create category center nodes
    const categoryNodes = new Map<string, Node>();
    const categoryCompanies = new Map<string, EcosystemData[]>();
    
    // Group companies by category
    companies.forEach(company => {
      const category = company.category || 'Other';
      if (!categoryCompanies.has(category)) {
        categoryCompanies.set(category, []);
      }
      categoryCompanies.get(category)!.push(company);
    });
    
    // Create category center nodes
    Array.from(categoryCompanies.keys()).forEach(category => {
      const color = CATEGORY_COLORS[category as keyof typeof CATEGORY_COLORS] || '#6B7280';
      const group = CATEGORY_GROUPS[category as keyof typeof CATEGORY_GROUPS] || 7;
      const companiesInCategory = categoryCompanies.get(category)!;
      
      const centerNode: Node = {
        id: `center-${category}`,
        name: category,
        category: category,
        color: color,
        size: Math.min(Math.max(companiesInCategory.length * 2, 20), 60),
        group: group,
        fx: undefined,
        fy: undefined
      };
      
      categoryNodes.set(category, centerNode);
      nodes.push(centerNode);
    });
    
    // Create company nodes and links to category centers
    companies.forEach((company, index) => {
      const category = company.category || 'Other';
      const color = CATEGORY_COLORS[category as keyof typeof CATEGORY_COLORS] || '#6B7280';
      const group = CATEGORY_GROUPS[category as keyof typeof CATEGORY_GROUPS] || 7;
      
      const node: Node = {
        id: `company-${index}`,
        name: company.name,
        category: category,
        tier: company.tier,
        website: company.website,
        color: color,
        size: company.tier ? 15 - parseInt(company.tier) * 2 : 12,
        group: group
      };
      
      nodes.push(node);
      
      // Link company to its category center
      const centerNode = categoryNodes.get(category);
      if (centerNode) {
        links.push({
          source: node.id,
          target: centerNode.id,
          strength: 0.5
        });
      }
    });
    
    // Create inter-category links for related sectors
    const relatedCategories = [
      ['Venture Capital', 'Impact Investor'],
      ['Venture Capital', 'Angel Syndicate & Network'],
      ['Incubators & Accelerators', 'Venture Capital'],
      ['Corporate Venture', 'Venture Capital'],
      ['Government', 'DFIs, FIs, & DOs'],
      ['Ecosystem Support', 'Incubators & Accelerators'],
      ['University Programs', 'Incubators & Accelerators']
    ];
    
    relatedCategories.forEach(([cat1, cat2]) => {
      const node1 = categoryNodes.get(cat1);
      const node2 = categoryNodes.get(cat2);
      if (node1 && node2) {
        links.push({
          source: node1.id,
          target: node2.id,
          strength: 0.1
        });
      }
    });
    
    return { nodes, links };
  }, [companies]);

  useEffect(() => {
    if (!svgRef.current || !containerRef.current) return;

    const container = containerRef.current;
    const svg = d3.select(svgRef.current);
    const width = container.clientWidth;
    const height = container.clientHeight;
    
    svg.selectAll('*').remove();
    
    // Create zoom behavior
    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.1, 4])
      .on('zoom', (event) => {
        g.attr('transform', event.transform);
      });
    
    svg.call(zoom);
    
    const g = svg.append('g');
    
    // Create simulation
    const simulation = d3.forceSimulation<Node>(nodes)
      .force('link', d3.forceLink<Node, Link>(links)
        .id(d => d.id)
        .distance(d => d.strength === 0.1 ? 200 : 80)
        .strength(d => d.strength))
      .force('charge', d3.forceManyBody()
        .strength(d => (d as Node).id.startsWith('center-') ? -1000 : -100))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collision', d3.forceCollide()
        .radius(d => (d as Node).size + 5))
      .force('group', d3.forceRadial(100, width / 2, height / 2)
        .strength(0.1));
    
    // Create links
    const link = g.append('g')
      .selectAll('line')
      .data(links)
      .join('line')
      .attr('stroke', '#999')
      .attr('stroke-opacity', 0.6)
      .attr('stroke-width', d => d.strength === 0.1 ? 2 : 1);
    
    // Create nodes
    const node = g.append('g')
      .selectAll('circle')
      .data(nodes)
      .join('circle')
      .attr('r', d => d.size)
      .attr('fill', d => d.color)
      .attr('stroke', '#fff')
      .attr('stroke-width', 2)
      .style('cursor', 'pointer')
      .style('opacity', d => selectedCategory && d.category !== selectedCategory ? 0.3 : 1);
    
    // Create labels
    const labels = g.append('g')
      .selectAll('text')
      .data(nodes.filter(d => d.id.startsWith('center-')))
      .join('text')
      .attr('text-anchor', 'middle')
      .attr('dy', '.35em')
      .style('font-size', '12px')
      .style('font-weight', 'bold')
      .style('fill', '#fff')
      .style('pointer-events', 'none')
      .text(d => d.name);
    
    // Add hover effects
    node
      .on('mouseover', function(event, d) {
        setHoveredNode(d);
        d3.select(this)
          .transition()
          .duration(200)
          .attr('r', d.size * 1.2)
          .attr('stroke-width', 3);
      })
      .on('mouseout', function(event, d) {
        setHoveredNode(null);
        d3.select(this)
          .transition()
          .duration(200)
          .attr('r', d.size)
          .attr('stroke-width', 2);
      })
      .on('click', function(event, d) {
        if (d.id.startsWith('center-')) {
          setSelectedCategory(selectedCategory === d.category ? null : d.category);
        } else if (d.website) {
          window.open(d.website, '_blank');
        }
      });
    
    // Drag behavior
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const drag = d3.drag<any, Node>()
      .on('start', (event, d) => {
        if (!event.active) simulation.alphaTarget(0.3).restart();
        d.fx = d.x;
        d.fy = d.y;
      })
      .on('drag', (event, d) => {
        d.fx = event.x;
        d.fy = event.y;
      })
      .on('end', (event, d) => {
        if (!event.active) simulation.alphaTarget(0);
        d.fx = null;
        d.fy = null;
      });
    
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    node.call(drag as any);
    
    // Update positions on tick
    simulation.on('tick', () => {
      link
        .attr('x1', d => (d.source as Node).x!)
        .attr('y1', d => (d.source as Node).y!)
        .attr('x2', d => (d.target as Node).x!)
        .attr('y2', d => (d.target as Node).y!);
      
      node
        .attr('cx', d => d.x!)
        .attr('cy', d => d.y!);
      
      labels
        .attr('x', d => d.x!)
        .attr('y', d => d.y!);
    });
    
    // Update node opacity based on selected category
    node.style('opacity', d => selectedCategory && d.category !== selectedCategory ? 0.3 : 1);
    
    return () => {
      simulation.stop();
    };
    
  }, [nodes, links, selectedCategory]);

  const categoryStats = useMemo(() => {
    const stats: Record<string, number> = {};
    companies.forEach(company => {
      const category = company.category || 'Other';
      stats[category] = (stats[category] || 0) + 1;
    });
    return stats;
  }, [companies]);

  return (
    <div className="w-full bg-gray-50 rounded-lg">
      {/* Header */}
      <div className="bg-white rounded-t-lg border-b border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
              Bangladesh Startup Ecosystem Network
              <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                <span className="text-white text-xs">✓</span>
              </div>
            </h1>
            <p className="text-gray-600 mt-1">
              Interactive force-directed visualization • {companies.length} organizations
            </p>
          </div>
          <button
            onClick={() => setSelectedCategory(null)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Reset View
          </button>
        </div>

        {/* Category Legend */}
        <div className="flex flex-wrap gap-2">
          {Object.entries(categoryStats).map(([category, count]) => {
            const color = CATEGORY_COLORS[category as keyof typeof CATEGORY_COLORS] || '#6B7280';
            const isSelected = selectedCategory === category;
            
            return (
              <button
                key={category}
                onClick={() => setSelectedCategory(isSelected ? null : category)}
                className={`px-3 py-1 rounded-full text-sm font-medium transition-all duration-200 ${
                  isSelected ? 'ring-2 ring-offset-2' : 'hover:scale-105'
                }`}
                style={{
                  backgroundColor: color,
                  color: 'white',
                  ...(isSelected && { boxShadow: `0 0 0 2px white, 0 0 0 4px ${color}` })
                }}
              >
                {category} ({count})
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Visualization */}
      <div ref={containerRef} className="relative w-full h-[700px] bg-white">
        <svg
          ref={svgRef}
          width="100%"
          height="100%"
          className="border-2 border-gray-200 rounded-b-lg"
        />
        
        {/* Instructions */}
        <div className="absolute bottom-4 left-4 bg-black bg-opacity-75 text-white px-3 py-2 rounded-lg text-xs">
          🖱️ Drag nodes • 🔍 Scroll to zoom • 📱 Click category centers to filter
        </div>
        
        {/* Hover tooltip */}
        {hoveredNode && (
          <div 
            className="absolute bg-black bg-opacity-90 text-white px-3 py-2 rounded-lg text-sm pointer-events-none z-10"
            style={{
              left: '50%',
              top: '20px',
              transform: 'translateX(-50%)'
            }}
          >
            <div className="font-bold">{hoveredNode.name}</div>
            <div className="text-xs opacity-75">{hoveredNode.category}</div>
            {hoveredNode.tier && (
              <div className="text-xs opacity-75">Tier {hoveredNode.tier}</div>
            )}
            {hoveredNode.website && !hoveredNode.id.startsWith('center-') && (
              <div className="text-xs text-blue-300">Click to visit website</div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}