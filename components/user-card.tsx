"use client";

import { useState } from 'react';
import Image from 'next/image';
import { Button } from "./ui/button";
import { cn } from '@/lib/utils';
import { MockUser, getStatusColor, getConversionRate } from '@/data/mock-users';
import { MapPin, Users, TrendingUp, Sparkles, Instagram } from 'lucide-react';

interface UserCardProps {
  user: MockUser;
  onCollaborate?: (user: MockUser) => void;
}

export function UserCard({ user, onCollaborate }: UserCardProps) {
  const [isImageLoaded, setIsImageLoaded] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const handleCollaborate = (e: React.MouseEvent) => {
    e.stopPropagation();
    onCollaborate?.(user);
  };

  const handleCardClick = () => {
    // Navigate to MUA portfolio detail page
    window.location.href = `/mua/${user.id}`;
  };

  const conversionRate = getConversionRate(user);

  return (
    <div 
      className={cn(
        "group relative w-full aspect-[3/4] overflow-hidden",
        "bg-white cursor-pointer transition-all duration-300 ease-out",
        "hover:-translate-y-1 transform-gpu"
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={handleCardClick}
    >
      {/* Background Image */}
      <div className="absolute inset-0">
        <Image
          src={user.imageUrl}
          alt={user.displayName}
          fill
          className={cn(
            "object-cover transition-all duration-700 ease-out",
            isHovered ? "scale-110" : "scale-100",
            isImageLoaded ? "opacity-100" : "opacity-0"
          )}
          onLoad={() => setIsImageLoaded(true)}
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
          priority
        />
        
        {/* Image Loading Placeholder */}
        {!isImageLoaded && (
          <div className="absolute inset-0 bg-gradient-to-br from-gray-100 to-gray-200 animate-pulse" />
        )}
      </div>


      {/* Model Info Overlay - Minimal Bottom Gradient */}
      <div className="absolute bottom-0 left-0 right-0 z-10">
        <div className="bg-gradient-to-t from-black/70 via-black/30 to-transparent p-3">
          <div className="text-white">
            <h3 className="font-bold text-sm leading-tight mb-1">
              {user.displayName.toUpperCase()}
            </h3>
            
            <div className="text-xs text-white/90 mb-2">
              {user.expertise} • {user.location}
            </div>
            
            {/* Stats */}
            <div className="flex items-center gap-2 text-white/80">
              <div className="flex items-center gap-1">
                <Users className="w-3 h-3" />
                <span className="text-xs">{user.clientsReached}</span>
              </div>
              
              <div className="flex items-center gap-1">
                <Sparkles className="w-3 h-3" />
                <span className="text-xs">{conversionRate}%</span>
              </div>
              
              <div className="flex items-center gap-1">
                <Instagram className="w-3 h-3" />
                <span className="text-xs">{user.instagramFollowers}</span>
              </div>
            </div>
          </div>
        </div>
      </div>


      {/* Status Indicator (Small dot in top right) */}
      <div className="absolute top-4 right-4 z-10">
        <div className={cn(
          "w-3 h-3 rounded-full border-2 border-white/50",
          getStatusColor(user.status),
          "shadow-lg animate-pulse"
        )} />
      </div>

    </div>
  );
}

// Skeleton component for loading state
export function UserCardSkeleton() {
  return (
    <div className="relative w-full h-[500px] rounded-2xl overflow-hidden border border-gray-200 bg-white shadow-sm">
      {/* Image placeholder */}
      <div className="absolute inset-0 bg-gradient-to-br from-gray-100 to-gray-200 animate-pulse" />
      
      {/* Top content placeholder */}
      <div className="absolute top-6 left-6 right-6 text-center space-y-3">
        <div className="h-6 bg-white/20 rounded-lg w-3/4 mx-auto animate-pulse" />
        <div className="h-8 bg-white/20 rounded-full w-32 mx-auto animate-pulse" />
      </div>
      
      {/* Bottom content placeholder */}
      <div className="absolute bottom-6 left-6 right-6">
        <div className="flex items-end justify-between">
          <div className="space-y-3">
            <div className="h-4 bg-white/20 rounded w-24 animate-pulse" />
            <div className="flex gap-4">
              <div className="h-4 bg-white/20 rounded w-20 animate-pulse" />
              <div className="h-4 bg-white/20 rounded w-20 animate-pulse" />
            </div>
          </div>
          <div className="h-12 bg-white/20 rounded-xl w-28 animate-pulse" />
        </div>
      </div>
    </div>
  );
}