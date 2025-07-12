"use client";

import { useState } from 'react';
import Image from 'next/image';
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { cn } from '@/lib/utils';
import { MockUser, getStatusColor, getStatusText } from '@/data/mock-users';
import { UserPlus, MessageCircle, Star, MapPin } from 'lucide-react';

interface UserCardProps {
  user: MockUser;
  onConnect?: (user: MockUser) => void;
  onMessage?: (user: MockUser) => void;
}

export function UserCard({ user, onConnect, onMessage }: UserCardProps) {
  const [isImageLoaded, setIsImageLoaded] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const handleConnect = (e: React.MouseEvent) => {
    e.stopPropagation();
    onConnect?.(user);
  };

  const handleMessage = (e: React.MouseEvent) => {
    e.stopPropagation();
    onMessage?.(user);
  };

  const statusColor = getStatusColor(user.status);
  const statusText = getStatusText(user.status);

  return (
    <div 
      className={cn(
        "group relative w-full h-[500px] rounded-2xl overflow-hidden",
        "border border-gray-200 bg-white shadow-sm",
        "cursor-pointer transition-all duration-300 ease-out",
        "hover:shadow-xl hover:shadow-black/10 hover:-translate-y-1",
        "transform-gpu"
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
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

      {/* Gradient Overlays */}
      <div className="absolute inset-0">
        {/* Top gradient for text readability */}
        <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-black/40 via-black/20 to-transparent" />
        
        {/* Bottom gradient for button area */}
        <div className={cn(
          "absolute bottom-0 left-0 right-0 h-40",
          "bg-gradient-to-t from-black/70 via-black/40 to-transparent",
          "transition-all duration-300",
          isHovered ? "from-black/80 via-black/50" : ""
        )} />
      </div>

      {/* Top Content - Name and Status */}
      <div className="absolute top-4 left-4 right-4 z-10">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h3 className={cn(
              "text-white font-semibold text-lg leading-tight",
              "drop-shadow-lg transition-all duration-300",
              isHovered ? "text-xl" : ""
            )}>
              {user.displayName}
            </h3>
            
            {/* Status Indicator */}
            <div className="flex items-center gap-2 mt-2">
              <div className={cn(
                "flex items-center gap-1.5 px-2.5 py-1",
                "rounded-full backdrop-blur-md border border-white/20",
                "bg-white/10 transition-all duration-300"
              )}>
                <div className={cn(
                  "w-2 h-2 rounded-full animate-pulse",
                  statusColor
                )} />
                <span className="text-white text-xs font-medium">
                  {statusText}
                </span>
              </div>
            </div>
          </div>

          {/* Rating Badge */}
          <div className={cn(
            "flex items-center gap-1 px-2.5 py-1",
            "rounded-full backdrop-blur-md border border-white/20",
            "bg-white/10 transition-all duration-300"
          )}>
            <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
            <span className="text-white text-xs font-medium">
              {user.rating.toFixed(1)}
            </span>
          </div>
        </div>
      </div>

      {/* Bottom Content - Actions and Info */}
      <div className="absolute bottom-4 left-4 right-4 z-10">
        <div className="flex items-end justify-between">
          {/* Left side - User Info */}
          <div className="flex-1 space-y-2">
            {/* Category Badge */}
            <div className={cn(
              "inline-flex items-center gap-1.5 px-3 py-1.5",
              "rounded-lg backdrop-blur-md border border-white/20",
              "bg-white/10 transition-all duration-300"
            )}>
              <span className="text-white text-sm font-medium">
                {user.category}
              </span>
            </div>

            {/* Location */}
            <div className="flex items-center gap-1.5 text-white/90">
              <MapPin className="w-4 h-4" />
              <span className="text-sm">{user.location}</span>
            </div>

            {/* Platform Tags */}
            <div className="flex gap-1.5">
              {user.platform.map((platform) => (
                <Badge
                  key={platform}
                  variant="secondary"
                  className={cn(
                    "text-xs font-medium border-0",
                    platform === 'Shopee' 
                      ? 'bg-orange-500/90 text-white hover:bg-orange-500' 
                      : 'bg-blue-600/90 text-white hover:bg-blue-600'
                  )}
                >
                  {platform}
                </Badge>
              ))}
            </div>
          </div>

          {/* Right side - Action Button */}
          <div className="flex flex-col gap-2 ml-4">
            <Button
              onClick={handleConnect}
              size="sm"
              className={cn(
                "px-4 py-2 rounded-xl font-medium",
                "bg-white/95 text-gray-900 border-0",
                "hover:bg-white hover:shadow-lg",
                "transition-all duration-300 transform-gpu",
                "backdrop-blur-sm",
                isHovered ? "scale-105 shadow-lg" : "",
                !user.isAvailable && "opacity-60 cursor-not-allowed"
              )}
              disabled={!user.isAvailable}
            >
              <UserPlus className="w-4 h-4 mr-2" />
              {user.isAvailable ? 'Add Member' : 'Unavailable'}
            </Button>

            {/* Secondary Action - Message */}
            <Button
              onClick={handleMessage}
              variant="ghost"
              size="sm"
              className={cn(
                "px-3 py-2 rounded-xl",
                "bg-white/10 text-white border border-white/20",
                "hover:bg-white/20 backdrop-blur-sm",
                "transition-all duration-300"
              )}
            >
              <MessageCircle className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Hover Effect Overlay */}
      <div className={cn(
        "absolute inset-0 transition-all duration-300",
        "bg-gradient-to-t from-blue-600/0 to-blue-600/0",
        isHovered ? "from-blue-600/10 to-blue-600/5" : ""
      )} />
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
      <div className="absolute top-4 left-4 right-4 space-y-3">
        <div className="h-6 bg-white/20 rounded-lg w-3/4 animate-pulse" />
        <div className="h-5 bg-white/20 rounded-full w-24 animate-pulse" />
      </div>
      
      {/* Bottom content placeholder */}
      <div className="absolute bottom-4 left-4 right-4">
        <div className="flex items-end justify-between">
          <div className="space-y-2">
            <div className="h-6 bg-white/20 rounded-lg w-20 animate-pulse" />
            <div className="h-4 bg-white/20 rounded w-16 animate-pulse" />
            <div className="flex gap-2">
              <div className="h-5 bg-white/20 rounded w-12 animate-pulse" />
              <div className="h-5 bg-white/20 rounded w-12 animate-pulse" />
            </div>
          </div>
          <div className="space-y-2">
            <div className="h-8 bg-white/20 rounded-xl w-24 animate-pulse" />
            <div className="h-8 bg-white/20 rounded-xl w-10 animate-pulse" />
          </div>
        </div>
      </div>
    </div>
  );
}