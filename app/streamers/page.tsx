"use client";

import { useState, useEffect } from 'react';
import { StreamerCard, Streamer } from "@/components/streamer-card";
import { createClient } from "@/utils/supabase/client";

export default function StreamersPage() {
  const [streamers, setStreamers] = useState<Streamer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStreamers = async () => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('streamers')
        .select('*');

      if (error) {
        setError('Failed to fetch streamers');
        setIsLoading(false);
      } else if (data) {
        setStreamers(data);
        setIsLoading(false);
      }
    };

    fetchStreamers();
  }, []);

  if (isLoading) {
    return <div className="container mx-auto px-4 py-8">Loading...</div>;
  }

  if (error) {
    return <div className="container mx-auto px-4 py-8">Error: {error}</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Available Streamers</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"> {/* Adjusted grid and gap */}
        {streamers.map((streamer) => (
          <div key={streamer.id} className="flex justify-center">
            <StreamerCard streamer={streamer} />
          </div>
        ))}
      </div>
    </div>
  );
}