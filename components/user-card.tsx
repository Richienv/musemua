"use client";

import { useState } from 'react';
import Image from 'next/image';
import { Button } from "./ui/button";
import { cn } from '@/lib/utils';
import { type CompleteUserProfile, userService } from '@/services/user-service';
import { MapPin, Users, TrendingUp, Sparkles, Instagram, Star, Heart } from 'lucide-react';

// City name to elegant code mapping
const cityCodeMap: { [key: string]: string } = {
  'Jakarta': 'JKT',
  'Bandung': 'BDG',
  'Surabaya': 'SBY',
  'Yogyakarta': 'YGY',
  'Bali': 'DPS',
  'Medan': 'MDN',
  'Semarang': 'SMG',
  'Malang': 'MLG',
  'Makassar': 'MKS',
  'Palembang': 'PLM',
  'Denpasar': 'DPS',
  'Batam': 'BTM'
};

interface UserCardProps {
  user: CompleteUserProfile;
  onCollaborate?: (user: CompleteUserProfile) => void;
  layout?: 'grid' | 'editorial';
}

export function UserCard({ user, onCollaborate, layout = 'grid' }: UserCardProps) {
  const [isImageLoaded, setIsImageLoaded] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const handleCollaborate = (e: React.MouseEvent) => {
    e.stopPropagation();
    onCollaborate?.(user);
  };

  const handleCardClick = () => {
    const userType = user.muaPortfolio ? 'mua' : 'muse';
    window.location.href = `/mua/${user.id}`;
  };

  const conversionRate = userService.getConversionRate(user);
  const cityCode = (user.location && cityCodeMap[user.location]) || user.location?.slice(0, 3)?.toUpperCase() || 'LOC';

  if (layout === 'editorial') {
    // Editorial layout for MUA professionals - Vogue magazine style
    return (
      <div 
        className={cn(
          "group relative w-full h-96 overflow-hidden bg-white cursor-pointer",
          "transition-all duration-500 ease-out border-b border-black/10",
          "hover:bg-black"
        )}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onClick={handleCardClick}
      >
        <div className="flex h-full">
          {/* Left: Editorial Information */}
          <div className="w-80 flex-shrink-0 px-8 py-12 flex flex-col justify-between">
            {/* Header */}
            <div>
              <h3 className="editorial-title text-black group-hover:text-white transition-colors duration-500 mb-2">
                {user.display_name}
              </h3>
              <p className="editorial-caption text-vogue-silver group-hover:text-vogue-gold transition-colors duration-500 mb-6">
                {cityCode} • {user.user_type.toUpperCase()}
              </p>
              
              {/* Stats in editorial style */}
              <div className="space-y-4 mb-8">
                <div className="flex justify-between items-center py-2 border-b border-black/10 group-hover:border-white/20 transition-colors duration-500">
                  <span className="editorial-caption text-vogue-silver group-hover:text-vogue-gold transition-colors duration-500">
                    PROJECTS
                  </span>
                  <span className="font-body font-light text-xl text-black group-hover:text-white transition-colors duration-500">
                    {user.projects_completed}
                  </span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-black/10 group-hover:border-white/20 transition-colors duration-500">
                  <span className="editorial-caption text-vogue-silver group-hover:text-vogue-gold transition-colors duration-500">
                    CLIENTS
                  </span>
                  <span className="font-body font-light text-xl text-black group-hover:text-white transition-colors duration-500">
                    {user.clients_reached}
                  </span>
                </div>
                {conversionRate > 0 && (
                  <div className="flex justify-between items-center py-2">
                    <span className="editorial-caption text-vogue-silver group-hover:text-vogue-gold transition-colors duration-500">
                      SUCCESS RATE
                    </span>
                    <span className="font-body font-light text-xl text-black group-hover:text-white transition-colors duration-500">
                      {conversionRate}%
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Footer Action */}
            <div>
              <Button 
                variant="luxury-ghost"
                className="w-full justify-start px-0 group-hover:text-vogue-gold"
                onClick={handleCollaborate}
              >
                View Portfolio
              </Button>
            </div>
          </div>

          {/* Right: Image Gallery Grid */}
          <div className="flex-1 grid grid-cols-2 gap-0">
            {[...Array(4)].map((_, index) => {
              // Use portfolio/showcase images for the work display
              const getPortfolioImage = () => {
                // If user has portfolio images from database, use those
                if (user.muaPortfolio?.beforeAfterImages && user.muaPortfolio.beforeAfterImages[index]) {
                  return user.muaPortfolio.beforeAfterImages[index].after_image_url;
                }
                
                // Use different showcase images for each grid position
                const showcaseImages = [
                  '/images/landingpage-main-headshot.png',
                  '/images/landingpage-eyes-closeup.png', 
                  '/images/landingpage-lip-closeup.png',
                  '/images/landing-page-sideview-closeup.png'
                ];
                
                // Rotate through different sets of images for variety
                const baseIndex = (parseInt(user.id || '0') + index) % showcaseImages.length;
                return showcaseImages[baseIndex];
              };
              
              const portfolioImageUrl = getPortfolioImage();
              
              return (
                <div key={index} className="relative overflow-hidden aspect-[4/5] group/image">
                  <Image
                    src={portfolioImageUrl}
                    alt={`${user.display_name} portfolio ${index + 1}`}
                    fill
                    className={cn(
                      "object-cover transition-all duration-700 ease-out",
                      "group-hover:brightness-110 group/image:hover:scale-105",
                      isImageLoaded ? "opacity-100" : "opacity-0"
                    )}
                    onLoad={() => setIsImageLoaded(true)}
                    sizes="(max-width: 640px) 50vw, 25vw"
                  />
                  
                  {/* Subtle overlay */}
                  <div className="absolute inset-0 bg-black/0 group/image:hover:bg-black/20 transition-colors duration-300" />
                  
                  {/* Portfolio piece indicator */}
                  {index === 0 && (
                    <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                      <div className="w-2 h-2 bg-vogue-gold rounded-full"></div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  // Grid layout for MUSE models - Fashion editorial card
  return (
    <div 
      className={cn(
        "group relative w-full aspect-[3/4] overflow-hidden",
        "bg-white cursor-pointer transition-all duration-500 ease-out",
        "hover:shadow-2xl hover:-translate-y-2 transform-gpu"
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={handleCardClick}
    >
      {/* Background Image */}
      <div className="absolute inset-0">
        <Image
          src={user.image_url || `/images/profile${((parseInt(user.id || '0')) % 3) + 1}.jpg`}
          alt={user.display_name}
          fill
          className={cn(
            "object-cover transition-all duration-700 ease-out",
            isHovered ? "scale-105 brightness-110" : "scale-100",
            isImageLoaded ? "opacity-100" : "opacity-0"
          )}
          onLoad={() => setIsImageLoaded(true)}
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          priority
        />
        
        {/* Loading placeholder */}
        {!isImageLoaded && (
          <div className="absolute inset-0 bg-gradient-to-br from-vogue-cream to-vogue-silver animate-pulse" />
        )}
      </div>

      {/* Editorial overlay gradients */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-black/80 to-transparent" />

      {/* Top Label - User Type */}
      <div className="absolute top-4 left-4 z-20">
        <span className="editorial-caption text-white bg-black/50 backdrop-blur-sm px-3 py-1 rounded-sm">
          {user.user_type.toUpperCase()}
        </span>
      </div>

      {/* Bottom Information - Editorial Style */}
      <div className="absolute bottom-0 left-0 right-0 z-20 p-6">
        <div className="transform translate-y-4 group-hover:translate-y-0 transition-transform duration-500">
          {/* Name */}
          <h3 className="editorial-subtitle text-white mb-2 leading-tight">
            {user.display_name}
          </h3>
          
          {/* Location & Stats */}
          <div className="flex items-center justify-between mb-4">
            <p className="editorial-caption text-white/80">
              {cityCode}
            </p>
            
            {user.instagram_followers && (
              <div className="flex items-center gap-2 text-white/80">
                <Instagram className="w-4 h-4" />
                <span className="editorial-caption">
                  {user.instagram_followers}
                </span>
              </div>
            )}
          </div>

          {/* Stats Row - Only visible on hover */}
          <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-500 delay-200">
            <div className="flex justify-between items-center py-3 border-t border-white/20">
              <div className="text-center">
                <div className="font-body font-light text-lg text-white">
                  {user.projects_completed}
                </div>
                <div className="editorial-caption text-white/60">
                  PROJECTS
                </div>
              </div>
              <div className="text-center">
                <div className="font-body font-light text-lg text-white">
                  {user.clients_reached}
                </div>
                <div className="editorial-caption text-white/60">
                  CLIENTS
                </div>
              </div>
              <div className="text-center">
                <div className="font-body font-light text-lg text-white">
                  {user.is_available ? 'YES' : 'NO'}
                </div>
                <div className="editorial-caption text-white/60">
                  AVAILABLE
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Heart icon for favorites */}
      <div className="absolute top-4 right-4 z-20 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
        <button 
          onClick={(e) => {
            e.stopPropagation();
            // Handle favorite logic
          }}
          className="p-2 rounded-full bg-white/20 backdrop-blur-sm hover:bg-white/30 transition-colors duration-300"
        >
          <Heart className="w-4 h-4 text-white" />
        </button>
      </div>
    </div>
  );
}

// Vogue-style skeleton components
export function UserCardSkeleton({ layout = 'grid' }: { layout?: 'grid' | 'editorial' }) {
  if (layout === 'editorial') {
    return (
      <div className="relative w-full h-96 overflow-hidden bg-white border-b border-black/10">
        <div className="flex h-full">
          {/* Left side placeholder */}
          <div className="w-80 flex-shrink-0 px-8 py-12 flex flex-col justify-between">
            <div>
              <div className="h-8 bg-vogue-cream animate-pulse rounded-sm mb-4 w-3/4" />
              <div className="h-4 bg-vogue-cream animate-pulse rounded-sm mb-8 w-1/2" />
              
              <div className="space-y-6">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="flex justify-between items-center py-2">
                    <div className="h-3 bg-vogue-cream animate-pulse rounded-sm w-20" />
                    <div className="h-6 bg-vogue-cream animate-pulse rounded-sm w-12" />
                  </div>
                ))}
              </div>
            </div>
            <div className="h-10 bg-vogue-cream animate-pulse rounded-sm w-32" />
          </div>
          
          {/* Right side grid placeholder */}
          <div className="flex-1 grid grid-cols-2 gap-0">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="aspect-[4/5] bg-gradient-to-br from-vogue-cream to-vogue-silver animate-pulse" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full aspect-[3/4] overflow-hidden bg-white">
      {/* Image placeholder */}
      <div className="absolute inset-0 bg-gradient-to-br from-vogue-cream to-vogue-silver animate-pulse" />
      
      {/* Top label placeholder */}
      <div className="absolute top-4 left-4">
        <div className="h-6 bg-black/20 rounded-sm w-16 animate-pulse" />
      </div>
      
      {/* Bottom content placeholder */}
      <div className="absolute bottom-0 left-0 right-0 p-6">
        <div className="space-y-3">
          <div className="h-6 bg-white/30 rounded-sm w-3/4 animate-pulse" />
          <div className="flex justify-between">
            <div className="h-4 bg-white/20 rounded-sm w-12 animate-pulse" />
            <div className="h-4 bg-white/20 rounded-sm w-16 animate-pulse" />
          </div>
        </div>
      </div>
    </div>
  );
}