'use client';

import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default markers in React Leaflet
delete (L.Icon.Default.prototype as { _getIconUrl?: () => string })._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface LocationData {
  name: string;
  latitude: number;
  longitude: number;
  category?: string;
  description?: string;
  website?: string;
  email?: string;
  focus?: string;
}

interface MapProps {
  data: LocationData[];
  center?: [number, number];
  zoom?: number;
}

export default function Map({ data, center = [40.7128, -74.0060], zoom = 10 }: MapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    // Initialize map
    mapInstanceRef.current = L.map(mapRef.current).setView(center, zoom);

    // Add tile layer
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors'
    }).addTo(mapInstanceRef.current);

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [center, zoom]);

  useEffect(() => {
    if (!mapInstanceRef.current || !data.length) return;

    // Clear existing markers
    mapInstanceRef.current.eachLayer((layer) => {
      if (layer instanceof L.Marker) {
        mapInstanceRef.current?.removeLayer(layer);
      }
    });

    // Add markers for each location
    const markers: L.Marker[] = [];
    data.forEach((location) => {
      if (location.latitude && location.longitude) {
        const marker = L.marker([location.latitude, location.longitude])
          .addTo(mapInstanceRef.current!)
          .bindPopup(`
            <div>
              <h3 class="font-bold text-lg">${location.name}</h3>
              ${location.description ? `<p class="mt-2">${location.description}</p>` : ''}
            </div>
          `);
        markers.push(marker);
      }
    });

    // Fit map to show all markers
    if (markers.length > 0) {
      const group = new L.FeatureGroup(markers);
      mapInstanceRef.current.fitBounds(group.getBounds().pad(0.1));
    }
  }, [data]);

  return (
    <div 
      ref={mapRef} 
      className="w-full h-full min-h-[500px] rounded-lg shadow-lg"
      style={{ height: '100%' }}
    />
  );
}