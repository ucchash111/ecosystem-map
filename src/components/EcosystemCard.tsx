import { EcosystemData } from '@/lib/googleSheets';

interface EcosystemCardProps {
  data: EcosystemData;
}

export default function EcosystemCard({ data }: EcosystemCardProps) {
  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      'Venture Capital': 'bg-blue-100 text-blue-800',
      'Impact Investor': 'bg-green-100 text-green-800', 
      'Private Equity': 'bg-purple-100 text-purple-800',
      'Incubators & Accelerators': 'bg-red-100 text-red-800',
      'Angel Syndicate & Network': 'bg-orange-100 text-orange-800',
      'Ecosystem Support': 'bg-cyan-100 text-cyan-800',
      'Media and Information Platforms': 'bg-pink-100 text-pink-800',
      'University Programs': 'bg-indigo-100 text-indigo-800',
      'Government': 'bg-emerald-100 text-emerald-800',
      'Corporate Venture': 'bg-gray-100 text-gray-800',
      'DFIs, FIs, & DOs': 'bg-yellow-100 text-yellow-800',
      'Co-Working': 'bg-teal-100 text-teal-800',
    };
    return colors[category] || 'bg-gray-100 text-gray-800';
  };

  const getTierBadge = (tier: string) => {
    if (!tier) return null;
    return (
      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
        Tier {tier}
      </span>
    );
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
      <div className="flex justify-between items-start mb-3">
        <h3 className="text-lg font-semibold text-gray-900 flex-1">
          {data.website ? (
            <a 
              href={data.website} 
              target="_blank" 
              rel="noopener noreferrer" 
              className="hover:text-blue-600"
            >
              {data.name}
            </a>
          ) : (
            data.name
          )}
        </h3>
        {data.tier && getTierBadge(data.tier)}
      </div>
      
      <div className="space-y-2">
        {data.category && (
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getCategoryColor(data.category)}`}>
            {data.category}
          </span>
        )}
        
        {data.type && (
          <div className="text-sm text-gray-600">
            <span className="font-medium">Type:</span> {data.type}
          </div>
        )}
        
        {data.investments && (
          <div className="text-sm text-gray-600">
            <span className="font-medium">Investments:</span> {data.investments}
          </div>
        )}
        
        {data.website && (
          <div className="text-sm">
            <a 
              href={data.website} 
              target="_blank" 
              rel="noopener noreferrer" 
              className="text-blue-600 hover:text-blue-800 break-all"
            >
              {data.website}
            </a>
          </div>
        )}
      </div>
    </div>
  );
}