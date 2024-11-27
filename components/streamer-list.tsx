'use client';

import { useState, useEffect } from 'react';
import { StreamerCard, Streamer } from './streamer-card';
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
        <StreamerCard key={streamer.id} streamer={streamer} />
      ))}
    </div>
  );
}
