"use client";

import { useEffect, useState } from 'react';
import MarketMap from '@/components/MarketMap';
import type { EcosystemData } from '@/lib/googleSheets';

export default function Home() {
  const [companies, setCompanies] = useState<EcosystemData[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const res = await fetch('/api/sheet-data', { cache: 'no-store' });
        if (!res.ok) throw new Error(`API ${res.status}`);
        const data = await res.json();
        if (!cancelled) setCompanies(data);
      } catch {
        if (!cancelled) setError('Failed to load data');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-slate-500">
        Loading…
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center text-red-600">
        {error}
      </div>
    );
  }

  return <MarketMap companies={companies} />;
}
