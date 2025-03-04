"use client";

import { useState, useEffect, useRef, useCallback } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { StreamerCard, Streamer, StreamerCardSkeleton } from "@/components/streamer-card";
import { createClient } from "@/utils/supabase/client";
import { cn } from "@/lib/utils";

const COLUMN_COUNT = {
  sm: 2,
  lg: 3,
  xl: 4
};

export default function StreamersPage() {
  const [streamers, setStreamers] = useState<Streamer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [columnCount, setColumnCount] = useState(1);

  // Update column count based on window size
  useEffect(() => {
    const updateColumnCount = () => {
      const width = window.innerWidth;
      if (width >= 1280) setColumnCount(COLUMN_COUNT.xl);
      else if (width >= 1024) setColumnCount(COLUMN_COUNT.lg);
      else if (width >= 640) setColumnCount(COLUMN_COUNT.sm);
      else setColumnCount(1);
    };

    updateColumnCount();
    window.addEventListener('resize', updateColumnCount);
    return () => window.removeEventListener('resize', updateColumnCount);
  }, []);

  // Fetch streamers with pagination
  const fetchStreamers = useCallback(async () => {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('streamers')
      .select('*')
      .order('id');

    if (error) {
      setError('Failed to fetch streamers');
      setIsLoading(false);
    } else if (data) {
      setStreamers(data);
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStreamers();
  }, [fetchStreamers]);

  // Calculate rows for virtualization
  const rows = Math.ceil(streamers.length / columnCount);
  
  const rowVirtualizer = useVirtualizer({
    count: rows,
    getScrollElement: () => containerRef.current,
    estimateSize: () => 400, // Estimated row height
    overscan: 5
  });

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {[...Array(8)].map((_, i) => (
            <StreamerCardSkeleton key={i} />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8 text-red-600">
        Error: {error}
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Available Streamers</h1>
      <div 
        ref={containerRef}
        className="h-[calc(100vh-200px)] overflow-auto"
      >
        <div
          style={{
            height: `${rowVirtualizer.getTotalSize()}px`,
            width: '100%',
            position: 'relative',
          }}
        >
          {rowVirtualizer.getVirtualItems().map((virtualRow) => {
            const rowIndex = virtualRow.index;
            return (
              <div
                key={virtualRow.key}
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: `${virtualRow.size}px`,
                  transform: `translateY(${virtualRow.start}px)`,
                }}
              >
                <div className={cn(
                  "grid gap-6",
                  columnCount === 1 ? "grid-cols-1" :
                  columnCount === 2 ? "grid-cols-2" :
                  columnCount === 3 ? "grid-cols-3" :
                  "grid-cols-4"
                )}>
                  {[...Array(columnCount)].map((_, colIndex) => {
                    const streamerIndex = rowIndex * columnCount + colIndex;
                    const streamer = streamers[streamerIndex];
                    
                    if (!streamer) return null;
                    
                    return (
                      <div
                        key={streamer.id}
                        className={cn(
                          "opacity-0 translate-y-4",
                          "animate-fade-in",
                          "will-change-transform will-change-opacity",
                          "gpu-accelerated"
                        )}
                        style={{
                          animationDelay: `${(streamerIndex % 8) * 50}ms`
                        }}
                      >
                        <StreamerCard streamer={streamer} />
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}