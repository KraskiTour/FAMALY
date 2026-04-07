'use client';

import { useState, useMemo } from 'react';
import { Tour } from '@/lib/types';
import TourGrid from './tour-grid';

type TypeTab = 'all' | 'oneday' | 'multiday';

export default function CityToursSection({
  tours,
  emptyMessage,
}: {
  tours: Tour[];
  emptyMessage: string;
}) {
  const [typeTab, setTypeTab] = useState<TypeTab>('all');

  const onedayCount = useMemo(() => tours.filter((t) => t.durationDays <= 1).length, [tours]);
  const multidayCount = useMemo(() => tours.filter((t) => t.durationDays >= 2).length, [tours]);

  const filtered = useMemo(() => {
    if (typeTab === 'oneday') return tours.filter((t) => t.durationDays <= 1);
    if (typeTab === 'multiday') return tours.filter((t) => t.durationDays >= 2);
    return tours;
  }, [tours, typeTab]);

  const tabs: { label: string; value: TypeTab; count: number }[] = [
    { label: 'Все', value: 'all', count: tours.length },
    { label: 'Однодневные', value: 'oneday', count: onedayCount },
    { label: 'Многодневные', value: 'multiday', count: multidayCount },
  ];

  if (onedayCount === 0 || multidayCount === 0) {
    return <TourGrid tours={tours} emptyMessage={emptyMessage} />;
  }

  return (
    <div>
      <div className="flex items-center gap-2 mb-6">
        {tabs.map((tab) => {
          const isActive = typeTab === tab.value;
          return (
            <button
              key={tab.value}
              onClick={() => setTypeTab(tab.value)}
              className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                isActive
                  ? 'bg-brand-600 text-white shadow-sm shadow-brand-600/20'
                  : 'bg-white text-gray-600 border border-gray-200 hover:border-brand-200 hover:text-brand-600'
              }`}
            >
              {tab.label}
              <span className={`ml-1.5 text-xs ${isActive ? 'text-white/70' : 'text-gray-400'}`}>
                {tab.count}
              </span>
            </button>
          );
        })}
      </div>
      <TourGrid tours={filtered} emptyMessage={emptyMessage} />
    </div>
  );
}
