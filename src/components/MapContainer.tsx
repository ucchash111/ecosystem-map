'use client';

import dynamic from 'next/dynamic';

interface LocationData {
  name: string;
  latitude: number;
  longitude: number;
  description?: string;
}

const Map = dynamic(() => import('@/components/Map'), { ssr: false });

interface MapContainerProps {
  data: LocationData[];
}

export default function MapContainer({ data }: MapContainerProps) {
  return <Map data={data} />;
}