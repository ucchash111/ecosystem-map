export type EcosystemCategory = 
  | 'Venture Capital'
  | 'Impact Investor' 
  | 'Private Equity'
  | 'Incubators & Accelerators'
  | 'Angel Syndicate & Network'
  | 'Ecosystem Support'
  | 'Media and Information Platforms'
  | 'University Programs'
  | 'Government'
  | 'Corporate Venture'
  | 'DFIs, FIs, & DOs'
  | 'Co-Working'
  | 'Other';

export interface EcosystemPlayer {
  name: string;
  latitude: number;
  longitude: number;
  category: EcosystemCategory;
  description?: string;
  website?: string;
  email?: string;
  focus?: string;
  logo_url?: string;
  tier?: string;
}

export const CATEGORY_CONFIG: Record<EcosystemCategory, {
  color: string;
  icon: string;
  displayName: string;
}> = {
  'Venture Capital': {
    color: '#2563eb',
    icon: '💰',
    displayName: 'Venture Capital'
  },
  'Impact Investor': {
    color: '#059669',
    icon: '🌱',
    displayName: 'Impact Investor'
  },
  'Private Equity': {
    color: '#7c3aed',
    icon: '🏢',
    displayName: 'Private Equity'
  },
  'Incubators & Accelerators': {
    color: '#dc2626',
    icon: '🚀',
    displayName: 'Incubators & Accelerators'
  },
  'Angel Syndicate & Network': {
    color: '#ea580c',
    icon: '👼',
    displayName: 'Angel Syndicate & Network'
  },
  'Ecosystem Support': {
    color: '#0891b2',
    icon: '🤝',
    displayName: 'Ecosystem Support'
  },
  'Media and Information Platforms': {
    color: '#c026d3',
    icon: '📰',
    displayName: 'Media & Information'
  },
  'University Programs': {
    color: '#1d4ed8',
    icon: '🎓',
    displayName: 'University Programs'
  },
  'Government': {
    color: '#166534',
    icon: '🏛️',
    displayName: 'Government'
  },
  'Corporate Venture': {
    color: '#991b1b',
    icon: '🏭',
    displayName: 'Corporate Venture'
  },
  'DFIs, FIs, & DOs': {
    color: '#92400e',
    icon: '🏦',
    displayName: 'DFIs, FIs, & DOs'
  },
  'Co-Working': {
    color: '#7c2d12',
    icon: '🏢',
    displayName: 'Co-Working'
  },
  'Other': {
    color: '#6b7280',
    icon: '❓',
    displayName: 'Other'
  }
};