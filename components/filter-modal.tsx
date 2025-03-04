import { useState, useEffect } from 'react';
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Star, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";

interface FilterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyFilters: (filters: {
    priceRange: [number, number];
    location: string;
    platforms: string[];
    minRating: number;
  }) => void;
  initialFilters?: Partial<FilterState>;
}

interface FilterState {
  priceRange: [number | null, number | null];
  location: string;
  platforms: string[];
  minRating: number | null;
}

const PLATFORMS = [
  { id: 'shopee', label: 'Shopee' },
  { id: 'tiktok', label: 'TikTok' },
  { id: 'both', label: 'Shopee & TikTok' }
];
const MAX_PRICE = 1000000;

export function FilterModal({ isOpen, onClose, onApplyFilters, initialFilters }: FilterModalProps) {
  const [filters, setFilters] = useState<FilterState>({
    priceRange: initialFilters?.priceRange || [null, null],
    location: initialFilters?.location || '',
    platforms: initialFilters?.platforms || [],
    minRating: initialFilters?.minRating || null,
  });

  const handlePriceChange = (type: 'min' | 'max', value: string) => {
    const numValue = value === '' ? null : Number(value);
    setFilters(prev => ({
      ...prev,
      priceRange: type === 'min' 
        ? [numValue, prev.priceRange[1]]
        : [prev.priceRange[0], numValue]
    }));
  };

  const togglePlatform = (platformId: string) => {
    setFilters(prev => {
      // If selecting 'both', clear other selections
      if (platformId === 'both') {
        return {
          ...prev,
          platforms: prev.platforms.includes('both') ? [] : ['shopee', 'tiktok']
        };
      }
      
      // If selecting individual platform, remove 'both' if it exists
      const newPlatforms = prev.platforms.includes(platformId)
        ? prev.platforms.filter(p => p !== platformId && p !== 'both')
        : [...prev.platforms.filter(p => p !== 'both'), platformId];

      return {
        ...prev,
        platforms: newPlatforms
      };
    });
  };

  const isPlatformSelected = (platformId: string) => {
    if (platformId === 'both') {
      return filters.platforms.includes('shopee') && filters.platforms.includes('tiktok');
    }
    return filters.platforms.includes(platformId);
  };

  const handleRatingChange = (rating: number) => {
    setFilters(prev => ({
      ...prev,
      minRating: prev.minRating === rating ? null : rating
    }));
  };

  const handleLocationChange = (value: string) => {
    setFilters(prev => ({ ...prev, location: value }));
  };

  const handleApply = () => {
    const [minPrice, maxPrice] = filters.priceRange;
    const validatedFilters = {
      ...filters,
      priceRange: [
        minPrice ?? 0,
        maxPrice ?? Number.MAX_SAFE_INTEGER
      ] as [number, number],
      minRating: filters.minRating ?? 0
    };
    onApplyFilters(validatedFilters);
    onClose();
  };

  const handleClear = () => {
    setFilters({
      priceRange: [null, null],
      location: '',
      platforms: [],
      minRating: null
    });
  };

  const getActiveFilterCount = () => {
    let count = 0;
    if (filters.location) count++;
    if (filters.platforms.length > 0) count++;
    if (filters.minRating !== null && filters.minRating > 0) count++;
    if (
      (filters.priceRange[0] !== null && filters.priceRange[0] > 0) || 
      (filters.priceRange[1] !== null && filters.priceRange[1] < MAX_PRICE)
    ) count++;
    return count;
  };

  return (
    <Dialog open={isOpen} onOpenChange={() => onClose()}>
      <DialogContent className={cn(
        "sm:max-w-[600px] p-0",
        "gpu-accelerated"
      )}>
        {/* Header */}
        <div className={cn(
          "flex items-center justify-between p-4 border-b",
          "gpu-accelerated"
        )}>
          <button
            onClick={onClose}
            className={cn(
              "rounded-full p-2",
              "transition-colors duration-fast ease-out",
              "hover:bg-blue-50",
              "touch-optimized"
            )}
          >
            <X className="h-4 w-4 text-blue-600" />
          </button>
          <h2 className="text-base font-semibold">Filter</h2>
          <div className="w-8" />
        </div>

        {/* Content */}
        <div className={cn(
          "px-6 py-6 max-h-[calc(100vh-180px)]",
          "scroll-container"
        )}>
          {/* Price Range */}
          <div className="mb-8 content-optimized">
            <h3 className="text-lg font-semibold mb-4">Price Range</h3>
            <div className="flex gap-4">
              <div className="flex-1">
                <label className="block text-sm text-gray-600 mb-2">minimum price</label>
                <div className={cn(
                  "flex items-center h-10 px-3 border rounded-lg",
                  "transition-colors duration-fast ease-out",
                  "focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500"
                )}>
                  <span className="text-gray-500">Rp</span>
                  <input
                    type="number"
                    value={filters.priceRange[0] || ''}
                    onChange={(e) => handlePriceChange('min', e.target.value)}
                    className="w-full ml-1 focus:outline-none"
                    placeholder="50,000"
                  />
                </div>
              </div>
              <div className="flex items-center pt-8">
                <div className="w-4 h-[1px] bg-gray-300" />
              </div>
              <div className="flex-1">
                <label className="block text-sm text-gray-600 mb-2">maximum price</label>
                <div className={cn(
                  "flex items-center h-10 px-3 border rounded-lg",
                  "transition-colors duration-fast ease-out",
                  "focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500"
                )}>
                  <span className="text-gray-500">Rp</span>
                  <input
                    type="number"
                    value={filters.priceRange[1] || ''}
                    onChange={(e) => handlePriceChange('max', e.target.value)}
                    className="w-full ml-1 focus:outline-none"
                    placeholder="1,000,000"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Location */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold mb-4">Location</h3>
            <Input
              value={filters.location}
              onChange={(e) => handleLocationChange(e.target.value)}
              placeholder="Enter city name"
              className="h-10"
            />
          </div>

          {/* Platforms */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold mb-4">Platform</h3>
            <div className="flex flex-wrap gap-2">
              {PLATFORMS.map((platform) => (
                <button
                  key={platform.id}
                  onClick={() => togglePlatform(platform.id)}
                  className={cn(
                    "h-10 px-6 rounded-lg border text-sm font-medium transition-all duration-200",
                    isPlatformSelected(platform.id)
                      ? "border-blue-600 bg-blue-50 text-blue-600"
                      : "border-gray-200 hover:bg-blue-50 hover:border-blue-600 hover:text-blue-600"
                  )}
                >
                  {platform.label}
                </button>
              ))}
            </div>
          </div>

          {/* Rating */}
          <div className="content-optimized">
            <h3 className="text-lg font-semibold mb-4">Minimum Rating</h3>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((rating) => (
                <button
                  key={rating}
                  onClick={() => handleRatingChange(rating)}
                  className={cn(
                    "flex items-center gap-1.5 h-10 px-4 rounded-lg border text-sm font-medium",
                    "transition-all duration-fast ease-out",
                    "touch-optimized",
                    filters.minRating === rating
                      ? "border-blue-600 bg-blue-50 text-blue-600"
                      : "border-gray-200 hover:bg-blue-50 hover:border-blue-600 hover:text-blue-600"
                  )}
                >
                  {rating} <Star className={cn(
                    "w-4 h-4",
                    filters.minRating === rating ? "fill-blue-600" : "fill-none stroke-blue-600"
                  )} />
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className={cn(
          "flex items-center justify-between p-4 border-t bg-white",
          "gpu-accelerated"
        )}>
          <Button
            variant="link"
            onClick={handleClear}
            className={cn(
              "text-sm font-medium text-blue-600",
              "transition-all duration-fast ease-out",
              "hover:text-blue-700 underline decoration-1 underline-offset-4 hover:decoration-2",
              "touch-optimized"
            )}
          >
            Clear all
          </Button>
          <Button
            onClick={handleApply}
            className={cn(
              "bg-blue-600 text-white text-sm font-medium h-10 px-6 rounded-lg",
              "transition-colors duration-fast ease-out",
              "hover:bg-blue-700",
              "touch-optimized"
            )}
          >
            Show results
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
} 