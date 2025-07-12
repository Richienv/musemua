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
    if (params.id) {
      const userData = getUserById(Number(params.id));
      setUser(userData || null);
    }
  }, [params.id]);

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

        {/* Split Layout Container */}
        <div className="max-w-7xl mx-auto">
          <div className="flex min-h-[70vh]">
            {/* Left Side - Model Information */}
            <div className="w-1/2 p-12 flex flex-col justify-center">
              <h1 className="text-6xl font-bold mb-8 tracking-tight">
                {user.displayName.toUpperCase()}
              </h1>
              
              {user.characteristics ? (
                <div className="space-y-3 text-lg">
                  <div className="flex justify-between">
                    <span className="font-medium">HEIGHT</span>
                    <span>{user.characteristics.height}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">BUST</span>
                    <span>{user.characteristics.bust}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">WAIST</span>
                    <span>{user.characteristics.waist}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">HIPS</span>
                    <span>{user.characteristics.hips}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">SHOES</span>
                    <span>{user.characteristics.shoes}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">SUIT</span>
                    <span>{user.characteristics.suit}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">HAIR</span>
                    <span>{user.characteristics.hairColor}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">EYES</span>
                    <span>{user.characteristics.eyeColor}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">ETHNICITY</span>
                    <span>{user.characteristics.ethnicity}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">EYE TYPE</span>
                    <span>{user.characteristics.eyeType}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">NOSE TYPE</span>
                    <span>{user.characteristics.noseType}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">LIP TYPE</span>
                    <span>{user.characteristics.lipType}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">BROW TYPE</span>
                    <span>{user.characteristics.browType}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">EYELID TYPE</span>
                    <span>{user.characteristics.eyelidType}</span>
                  </div>
                </div>
              ) : (
                <div className="text-gray-500 text-lg">
                  <p>No characteristics data available</p>
                  <p className="text-sm">User ID: {user.id}</p>
                </div>
              )}
            </div>

            {/* Right Side - Model Portrait */}
            <div className="w-1/2 relative border-l border-gray-200">
              <div className="relative h-full">
                <Image
                  src={user.imageUrl}
                  alt={user.displayName}
                  fill
                  className="object-cover"
                  priority
                />
                
                {/* Navigation arrows */}
                <button className="absolute left-4 top-1/2 -translate-y-1/2 w-8 h-8 bg-black/20 hover:bg-black/40 text-white rounded-full flex items-center justify-center transition-colors">
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button className="absolute right-4 top-1/2 -translate-y-1/2 w-8 h-8 bg-black/20 hover:bg-black/40 text-white rounded-full flex items-center justify-center transition-colors">
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Action Buttons */}
        <div className="border-t border-gray-200 p-6">
          <div className="max-w-7xl mx-auto flex items-center justify-center gap-4">
            <Button variant="outline" className="px-6 py-2 text-sm font-medium border-black text-black hover:bg-black hover:text-white">
              MEASUREMENTS
            </Button>
            <Button variant="outline" className="px-6 py-2 text-sm font-medium border-black text-black hover:bg-black hover:text-white">
              SELECT
            </Button>
            <Button variant="outline" className="px-6 py-2 text-sm font-medium border-black text-black hover:bg-black hover:text-white">
              GENERATE YOUR PDF
            </Button>
            <Button variant="outline" className="px-6 py-2 text-sm font-medium border-black text-black hover:bg-black hover:text-white">
              PRINT BOOK
            </Button>
            <Button variant="outline" className="px-6 py-2 text-sm font-medium border-black text-black hover:bg-black hover:text-white">
              PRINT POLAROIDS
            </Button>
          </div>
        </div>

        {/* Portfolio Section */}
        <section className="py-20 bg-white">
          <div className="max-w-7xl mx-auto px-6">
            <h2 className="text-4xl font-bold text-center mb-16 tracking-tight">PORTFOLIO</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="group cursor-pointer">
                  <div className="relative aspect-[3/4] bg-gray-100 overflow-hidden">
                    <Image
                      src={`https://images.unsplash.com/photo-${1500000000000 + i}?w=600&h=800&fit=crop&crop=face`}
                      alt={`Portfolio ${i}`}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    {/* Brand overlay */}
                    <div className="absolute bottom-4 left-4 bg-white/90 px-3 py-1 text-sm font-medium">
                      {['CHANEL', 'DIOR', 'VERSACE', 'PRADA', 'GUCCI', 'ARMANI'][i - 1]}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Polaroid Section */}
        <section className="py-20 bg-gray-50">
          <div className="max-w-7xl mx-auto px-6">
            <h2 className="text-4xl font-bold text-center mb-16 tracking-tight">POLAROID</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((i) => (
                <div key={i} className="group cursor-pointer">
                  <div className="relative aspect-square bg-white p-3 shadow-md transform rotate-1 group-hover:rotate-0 transition-transform duration-300">
                    <div className="relative w-full h-full bg-gray-100">
                      <Image
                        src={`https://images.unsplash.com/photo-${1600000000000 + i}?w=300&h=300&fit=crop&crop=face`}
                        alt={`Polaroid ${i}`}
                        fill
                        className="object-cover"
                      />
                    </div>
                    <div className="text-center mt-2 text-xs text-gray-600 font-handwriting">
                      {user.displayName} #{i}
                    </div>
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
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((i) => (
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
            </div>
            
            <div className="text-center">
              <Button className="bg-gradient-to-r from-pink-500 to-purple-600 text-white hover:from-pink-600 hover:to-purple-700 px-8 py-3">
                <Instagram className="w-5 h-5 mr-2" />
                Visit Instagram
                <ExternalLink className="w-4 h-4 ml-2" />
              </Button>
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