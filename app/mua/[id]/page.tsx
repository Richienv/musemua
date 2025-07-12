"use client";

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import { ArrowLeft, ChevronLeft, ChevronRight, Instagram, ExternalLink } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from '@/lib/utils';
import { getUserById, MockUser } from '@/data/mock-users';
import { Navbar } from "@/components/ui/navbar";


export default function MUAPortfolioPage() {
  const params = useParams();
  const router = useRouter();
  const [user, setUser] = useState<MockUser | null>(null);

  useEffect(() => {
    if (params?.id) {
      const userData = getUserById(Number(params.id));
      setUser(userData || null);
    }
  }, [params?.id]);

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Model tidak ditemukan</h2>
          <p className="text-gray-600 mb-4">Model yang Anda cari tidak ada.</p>
          <Button onClick={() => router.back()}>Kembali</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-[100] bg-white border-b border-gray-100">
        <Navbar />
      </header>

      <div className="mt-[80px]">
        <div className="text-center py-4 text-sm font-medium text-gray-900 border-b border-gray-100">
          {user.displayName.toUpperCase()}
        </div>

        {/* Mobile-First Layout: Picture on Top, Details Below */}
        <div className="max-w-7xl mx-auto">
          {/* Picture Section - Full width on mobile, part of flex on desktop */}
          <div className="w-full md:flex md:min-h-[70vh]">
            {/* Model Portrait - Now on top for mobile */}
            <div className="w-full md:w-1/2 relative h-[60vh] md:h-auto md:order-2">
              <div className="relative h-full">
                <Image
                  src={user.imageUrl}
                  alt={user.displayName}
                  fill
                  className="object-cover"
                  priority
                />
                
                {/* Navigation arrows */}
                <button className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/80 hover:bg-white text-black rounded-full flex items-center justify-center transition-all duration-300 shadow-lg backdrop-blur-sm">
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/80 hover:bg-white text-black rounded-full flex items-center justify-center transition-all duration-300 shadow-lg backdrop-blur-sm">
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Model Information - Now below picture on mobile */}
            <div className="w-full md:w-1/2 p-6 md:p-12 flex flex-col justify-center bg-gray-50 md:order-1">
              <h1 className="text-4xl md:text-7xl font-light mb-8 md:mb-16 tracking-wider text-black leading-none text-center md:text-left">
                {user.displayName.toUpperCase()}
              </h1>
              
              {user.characteristics ? (
                <div className="space-y-6 md:space-y-8">
                  {/* Physical Measurements */}
                  <div className="border-l-2 border-black pl-4 md:pl-6">
                    <h3 className="text-xs font-bold tracking-widest text-gray-600 mb-4 md:mb-6 uppercase">Measurements</h3>
                    <div className="grid grid-cols-2 gap-x-4 md:gap-x-8 gap-y-3 md:gap-y-4">
                      <div className="flex flex-col">
                        <span className="text-xs font-medium tracking-wide text-gray-500 uppercase">Height</span>
                        <span className="text-base md:text-lg font-light">{user.characteristics.height}</span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-xs font-medium tracking-wide text-gray-500 uppercase">Bust</span>
                        <span className="text-base md:text-lg font-light">{user.characteristics.bust}</span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-xs font-medium tracking-wide text-gray-500 uppercase">Waist</span>
                        <span className="text-base md:text-lg font-light">{user.characteristics.waist}</span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-xs font-medium tracking-wide text-gray-500 uppercase">Hips</span>
                        <span className="text-base md:text-lg font-light">{user.characteristics.hips}</span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-xs font-medium tracking-wide text-gray-500 uppercase">Shoes</span>
                        <span className="text-base md:text-lg font-light">{user.characteristics.shoes}</span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-xs font-medium tracking-wide text-gray-500 uppercase">Suit</span>
                        <span className="text-base md:text-lg font-light">{user.characteristics.suit}</span>
                      </div>
                    </div>
                  </div>

                  {/* Features */}
                  <div className="border-l-2 border-black pl-4 md:pl-6">
                    <h3 className="text-xs font-bold tracking-widest text-gray-600 mb-4 md:mb-6 uppercase">Features</h3>
                    <div className="grid grid-cols-2 gap-x-4 md:gap-x-8 gap-y-3 md:gap-y-4">
                      <div className="flex flex-col">
                        <span className="text-xs font-medium tracking-wide text-gray-500 uppercase">Hair</span>
                        <span className="text-base md:text-lg font-light capitalize">{user.characteristics.hairColor}</span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-xs font-medium tracking-wide text-gray-500 uppercase">Eyes</span>
                        <span className="text-base md:text-lg font-light capitalize">{user.characteristics.eyeColor}</span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-xs font-medium tracking-wide text-gray-500 uppercase">Ethnicity</span>
                        <span className="text-base md:text-lg font-light capitalize">{user.characteristics.ethnicity}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-gray-500 text-base md:text-lg text-center md:text-left">
                  <p>No characteristics data available</p>
                  <p className="text-sm">User ID: {user.id}</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Removed unnecessary buttons as requested */}

        {/* Portfolio Section */}
        <section className="py-20 bg-white">
          <div className="max-w-7xl mx-auto px-6">
            <div className="flex items-center justify-between mb-16">
              <h2 className="text-4xl font-light tracking-wider text-black">PORTFOLIO</h2>
              <Button variant="outline" className="border-black text-black hover:bg-black hover:text-white px-8 py-3 rounded-none font-light tracking-wide">
                View More
              </Button>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="group cursor-pointer">
                  <div className="relative aspect-[3/4] bg-gray-100 overflow-hidden">
                    <Image
                      src={`https://images.unsplash.com/photo-${1500000000000 + i}?w=600&h=800&fit=crop&crop=face`}
                      alt={`Portfolio ${i}`}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                    />
                    {/* Brand overlay */}
                    <div className="absolute bottom-4 left-4 bg-white/95 backdrop-blur-sm px-4 py-2 text-xs font-light tracking-widest border border-white/30">
                      {['CHANEL', 'DIOR', 'VERSACE', 'PRADA', 'GUCCI', 'ARMANI'][i - 1]}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Behind The Scenes Section */}
        <section className="py-20 bg-gray-50">
          <div className="max-w-7xl mx-auto px-6">
            <h2 className="text-4xl font-light text-center mb-16 tracking-wider text-black">BEHIND THE SCENES</h2>
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((i) => (
                <div key={i} className="group cursor-pointer">
                  <div className="relative aspect-square bg-gray-100 overflow-hidden">
                    <Image
                      src={`https://images.unsplash.com/photo-${1600000000000 + i}?w=300&h=300&fit=crop&crop=face`}
                      alt={`Behind the scenes ${i}`}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Instagram Showcase Section */}
        <section className="py-20 bg-white">
          <div className="max-w-7xl mx-auto px-6">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold mb-4 tracking-tight">INSTAGRAM</h2>
              <p className="text-gray-600">@{user.displayName.toLowerCase().replace(' ', '_')}</p>
              <p className="text-lg font-medium text-gray-900">{user.instagramFollowers} followers</p>
            </div>
            
            <div className="grid grid-cols-3 md:grid-cols-6 gap-1 mb-8">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map((i) => (
                <div key={i} className="aspect-square bg-gray-100 relative group cursor-pointer">
                  <Image
                    src={`https://images.unsplash.com/photo-${1550000000000 + i}?w=300&h=300&fit=crop&crop=center`}
                    alt={`Instagram ${i}`}
                    fill
                    className="object-cover group-hover:opacity-80 transition-opacity"
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                    <Instagram className="w-6 h-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </div>
              ))}
              {/* More Button as Last Square */}
              <div className="aspect-square bg-white relative group cursor-pointer border border-gray-200 hover:border-black transition-colors">
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-2xl font-light tracking-widest text-black group-hover:text-gray-600 transition-colors">
                    MORE
                  </span>
                </div>
              </div>
            </div>
            
          </div>
        </section>

        {/* Footer */}
        <footer className="bg-black text-white py-20">
          <div className="max-w-4xl mx-auto px-6 text-center">
            <h3 className="text-3xl font-bold mb-4">STAY UPDATED</h3>
            <p className="text-gray-300 mb-8">Get the latest updates from our models and exclusive content</p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 max-w-md mx-auto">
              <Input
                type="email"
                placeholder="Enter your email address"
                className="bg-white text-black border-0 px-4 py-3 text-center sm:text-left flex-1"
              />
              <Button className="bg-white text-black hover:bg-gray-200 px-8 py-3 font-semibold">
                SUBSCRIBE
              </Button>
            </div>
            
            <div className="mt-12 pt-8 border-t border-gray-800">
              <p className="text-gray-400 text-sm">
                © 2024 MUSEMODELS. All rights reserved.
              </p>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}