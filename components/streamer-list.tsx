'use client';

import { useState } from 'react';
import { StreamerCard, Streamer } from './streamer-card';

interface StreamerListProps {
  initialStreamers: Streamer[];
}

export function StreamerList({ initialStreamers }: StreamerListProps) {
  const [textFilter, setTextFilter] = useState('');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');

  const filteredStreamers = initialStreamers.filter((streamer) => {
    const matchesText = 
      streamer.name.toLowerCase().includes(textFilter.toLowerCase()) ||
      streamer.platform.toLowerCase().includes(textFilter.toLowerCase()) ||
      streamer.category.toLowerCase().includes(textFilter.toLowerCase()) ||
      streamer.location.toLowerCase().includes(textFilter.toLowerCase()) ||
      streamer.bio.toLowerCase().includes(textFilter.toLowerCase());

    const matchesPrice = 
      (!minPrice || streamer.price >= parseFloat(minPrice)) &&
      (!maxPrice || streamer.price <= parseFloat(maxPrice));

    return matchesText && matchesPrice;
  });

  const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>, setter: React.Dispatch<React.SetStateAction<string>>) => {
    const value = e.target.value;
    if (value === '' || /^\d+(\.\d{0,2})?$/.test(value)) {
      setter(value);
    }
  };

  return (
    <>
      <div className="mb-8 space-y-4 w-full">
        <input
          type="text"
          placeholder="Filter by name, platform, category, location, or bio..."
          value={textFilter}
          onChange={(e) => setTextFilter(e.target.value)}
          className="w-full p-2 border border-gray-300 rounded bg-[#000000]/60 text-white placeholder-gray-300"
        />
        <div className="flex space-x-4">
          <input
            type="text"
            inputMode="decimal"
            placeholder="Min price"
            value={minPrice}
            onChange={(e) => handlePriceChange(e, setMinPrice)}
            className="w-1/2 p-2 border border-gray-300 rounded bg-[#000000]/60 text-white placeholder-gray-300"
          />
          <input
            type="text"
            inputMode="decimal"
            placeholder="Max price"
            value={maxPrice}
            onChange={(e) => handlePriceChange(e, setMaxPrice)}
            className="w-1/2 p-2 border border-gray-300 rounded bg-[#000000]/60 text-white placeholder-gray-300"
          />
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 w-full">
        {filteredStreamers.map((streamer) => (
          <StreamerCard key={streamer.id} streamer={streamer} />
        ))}
      </div>
    </>
  );
}