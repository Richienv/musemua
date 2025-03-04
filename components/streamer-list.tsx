'use client';

import { useState, useEffect, Suspense } from 'react';
import { StreamerCard } from './streamer-card';
import { Search } from 'lucide-react';
import type { Streamer } from './streamer-card';
import { useVirtualizer } from '@tanstack/react-virtual';
import { cn } from '@/lib/utils';

interface StreamerListProps {
  initialStreamers: Streamer[];
  filter: string;
  className?: string;
}

function StreamerCardSkeleton() {
  return (
    <div className={cn(
      "group relative bg-transparent w-full font-sans",
      "animate-pulse content-optimized"
    )}>
      <div className="relative w-full h-44 sm:h-52 rounded-xl overflow-hidden bg-gray-200"></div>
      <div className="p-3 sm:p-4 pt-2 sm:pt-3 bg-white/95 rounded-b-xl">
        <div className="flex items-center justify-between gap-1 mb-1">
          <div className="flex items-center gap-1.5">
            <div className="h-4 w-20 bg-gray-200 rounded"></div>
            <div className="h-4 w-12 bg-gray-200 rounded"></div>
          </div>
        </div>
        <div className="flex flex-col mb-1.5">
          <div className="h-4 w-24 bg-gray-200 rounded"></div>
          <div className="h-4 w-16 bg-gray-200 rounded mt-1"></div>
        </div>
        <div className="h-4 w-32 bg-gray-200 rounded mb-2"></div>
        <div className="flex items-center gap-2 mb-3">
          <div className="h-4 w-16 bg-gray-200 rounded"></div>
          <div className="h-4 w-16 bg-gray-200 rounded"></div>
        </div>
        <div className="flex gap-1.5">
          <div className="h-8 w-full bg-gray-200 rounded"></div>
          <div className="h-8 w-8 bg-gray-200 rounded"></div>
        </div>
      </div>
    </div>
  );
}

export function StreamerList({ initialStreamers, filter, className }: StreamerListProps) {
  const [filteredStreamers, setFilteredStreamers] = useState(initialStreamers);

  useEffect(() => {
    if (!filter) {
      setFilteredStreamers(initialStreamers);
      return;
    }

    const filtered = initialStreamers.filter(streamer => 
      streamer.first_name.toLowerCase().includes(filter.toLowerCase()) ||
      streamer.last_name.toLowerCase().includes(filter.toLowerCase()) ||
      streamer.location.toLowerCase().includes(filter.toLowerCase()) ||
      (streamer.platforms && streamer.platforms.some(p => 
        p.toLowerCase().includes(filter.toLowerCase())
      ))
    );
    setFilteredStreamers(filtered);
  }, [filter, initialStreamers]);

  return (
    <div className={cn(
      "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6",
      "content-optimized",
      className
    )}>
      {filteredStreamers.map((streamer) => (
        <Suspense key={streamer.id} fallback={<StreamerCardSkeleton />}>
          <StreamerCard streamer={streamer} />
        </Suspense>
      ))}
      {filteredStreamers.length === 0 && (
        <div className={cn(
          "col-span-full text-center py-8",
          "text-gray-500 animate-fade-in"
        )}>
          No streamers found matching your criteria
        </div>
      )}
    </div>
  );
}
