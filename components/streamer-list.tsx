'use client';

import { useState, useEffect } from 'react';
import { StreamerCard, Streamer } from './streamer-card';
import { Search } from 'lucide-react'; // Import the Search icon from lucide-react

interface StreamerListProps {
  initialStreamers: Streamer[];
  filter: string;
}

export function StreamerList({ initialStreamers, filter }: StreamerListProps) {
  const [filteredStreamers, setFilteredStreamers] = useState<Streamer[]>(initialStreamers);

  useEffect(() => {
    const lowercasedFilter = filter.toLowerCase();
    const filtered = initialStreamers.filter((streamer) => {
      return (
        streamer.first_name.toLowerCase().includes(lowercasedFilter) ||
        streamer.last_name.toLowerCase().includes(lowercasedFilter) ||
        streamer.platform.toLowerCase().includes(lowercasedFilter) ||
        streamer.category.toLowerCase().includes(lowercasedFilter) ||
        streamer.location.toLowerCase().includes(lowercasedFilter) ||
        streamer.bio.toLowerCase().includes(lowercasedFilter)
      );
    });
    setFilteredStreamers(filtered);
  }, [filter, initialStreamers]);

  if (filteredStreamers.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center">
        <Search className="w-16 h-16 text-gray-400 mb-4" />
        <h2 className="text-2xl font-semibold text-gray-700 mb-2">No streamers found</h2>
        <p className="text-gray-500 max-w-md">
          We couldn't find any streamers related to "{filter}". 
          Try adjusting your search or explore our other talented creators!
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 w-full">
      {filteredStreamers.map((streamer) => (
        <StreamerCard key={streamer.id} streamer={streamer} />
      ))}
    </div>
  );
}
