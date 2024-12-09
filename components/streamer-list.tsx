'use client';

import { useState, useEffect, Suspense } from 'react';
import { StreamerCard } from './streamer-card';
import { Search } from 'lucide-react';

interface StreamerListProps {
  initialStreamers: Streamer[];
  filter: string;
  className?: string;
}

// Create a local skeleton component instead of importing it
function StreamerCardSkeleton() {
  return (
    <div className="group relative bg-transparent w-full font-sans cursor-pointer">
      <div className="relative w-full h-44 sm:h-52 rounded-xl overflow-hidden bg-gray-200 animate-pulse"></div>
      <div className="p-3 sm:p-4 pt-2 sm:pt-3 bg-white/95 rounded-b-xl">
        <div className="flex items-center justify-between gap-1 mb-1">
          <div className="flex items-center gap-1.5">
            <div className="h-4 w-20 bg-gray-200 animate-pulse rounded"></div>
            <div className="h-4 w-12 bg-gray-200 animate-pulse rounded"></div>
          </div>
        </div>
        <div className="flex flex-col mb-1.5">
          <div className="h-4 w-24 bg-gray-200 animate-pulse rounded"></div>
          <div className="h-4 w-16 bg-gray-200 animate-pulse rounded mt-1"></div>
        </div>
        <div className="h-4 w-32 bg-gray-200 animate-pulse rounded mb-2"></div>
        <div className="flex items-center gap-2 mb-3">
          <div className="h-4 w-16 bg-gray-200 animate-pulse rounded"></div>
          <div className="h-4 w-16 bg-gray-200 animate-pulse rounded"></div>
        </div>
        <div className="flex gap-1.5">
          <div className="h-8 w-full bg-gray-200 animate-pulse rounded"></div>
          <div className="h-8 w-8 bg-gray-200 animate-pulse rounded"></div>
        </div>
      </div>
    </div>
  );
}

export function StreamerList({ initialStreamers, filter, className }: StreamerListProps) {
  return (
    <div className={className}>
      {initialStreamers.map((streamer) => (
        <Suspense key={streamer.id} fallback={<StreamerCardSkeleton />}>
          <StreamerCard streamer={streamer} />
        </Suspense>
      ))}
    </div>
  );
}
