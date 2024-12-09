'use client';

import { useState, useEffect, Suspense } from 'react';
import { StreamerCard, StreamerCardSkeleton } from './streamer-card';
import { Search } from 'lucide-react'; // Import the Search icon from lucide-react

interface StreamerListProps {
  initialStreamers: Streamer[];
  filter: string;
  className?: string;
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
