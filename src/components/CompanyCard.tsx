'use client';

import { EcosystemData } from '@/lib/googleSheets';

interface CompanyCardProps {
  company: EcosystemData;
}

export default function CompanyCard({ company }: CompanyCardProps) {
  const handleClick = () => {
    if (company.website) {
      window.open(company.website, '_blank');
    }
  };

  return (
    <div 
      className="bg-white border border-gray-300 rounded-md p-2 hover:shadow-lg hover:border-blue-400 transition-all cursor-pointer group text-center"
      title={`${company.name}${company.type ? ` • ${company.type}` : ''}${company.tier ? ` • Tier ${company.tier}` : ''}`}
      onClick={handleClick}
    >
      <div className="text-xs font-medium text-gray-800 leading-tight line-clamp-2">
        {company.name}
      </div>
      {company.tier && (
        <div className="text-xs text-gray-500 mt-1">
          T{company.tier}
        </div>
      )}
    </div>
  );
}