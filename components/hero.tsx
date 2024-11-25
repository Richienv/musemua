"use client";

import { Button } from "@/components/ui/button";
import Link from "next/link";

export function Hero() {
  const cards = [
    {
      title: "Welcome to Lilo",
      description: "Your one-stop livestream platform"
    },
    {
      title: "Mock-up Landing",
      description: "Experience the future of streaming"
    },
    {
      title: "Get Started Today",
      description: "Join our growing community"
    }
  ];

  return (
    <div className="relative h-[60vh] flex items-center justify-center overflow-hidden bg-gradient-to-b from-custom-light-navy to-white px-4 sm:px-6 lg:px-8">
      {/* Background effects */}
      <div className="absolute inset-0 bg-grid-black/[0.02] bg-[size:20px_20px]" />
      <div 
        className="absolute inset-0 opacity-30"
        style={{
          backgroundImage: 'radial-gradient(circle at 50% 50%, rgba(0, 0, 128, 0.3), rgba(0, 0, 0, 0.2))',
        }}
      />
      
      <div className="relative flex flex-col items-center justify-center text-center max-w-6xl mx-auto w-full gap-8">
        {/* Title Section */}
        <div className="mb-8">
          <h1 
            className="text-4xl md:text-6xl font-bold tracking-tight mb-4"
            style={{
              background: 'linear-gradient(135deg, #000080 0%, #2563eb 50%, #000080 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundSize: '200% 200%',
              animation: 'gradient 8s ease infinite'
            }}
          >
            SELAMAT DATANG DI LILO YAA!
          </h1>
          <p className="text-lg md:text-xl text-custom-navy/80 font-medium">
            KITA SENANG KAMU DISINI! LIAT-LIAT DULU AJAA
          </p>
        </div>

        {/* Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full">
          {cards.map((card, index) => (
            <div key={index} className="relative group">
              {/* Shadow gradient */}
              <div className="absolute -inset-1 bg-gradient-to-r from-custom-navy via-blue-600 to-black rounded-xl blur-lg opacity-30 group-hover:opacity-40 transition duration-500"></div>
              
              {/* Card */}
              <div 
                className="relative p-6 rounded-xl overflow-hidden bg-gradient-to-b from-gray-50 via-white to-gray-50 border border-white/20 shadow-2xl h-full"
                style={{
                  backgroundImage: `
                    linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0.05) 100%),
                    linear-gradient(to bottom, rgba(255, 255, 255, 0.8), rgba(255, 255, 255, 0.3))
                  `,
                  backdropFilter: 'blur(10px)',
                }}
              >
                <h3 className="text-xl font-bold text-custom-navy mb-2">{card.title}</h3>
                <p className="text-gray-600">{card.description}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Sign In Button */}
        <div className="mt-8">
          <Link href="/sign-in">
            <Button 
              size="lg" 
              className="bg-gradient-to-r from-custom-navy to-blue-600 hover:from-blue-800 hover:to-custom-navy text-white font-semibold px-12 py-6 rounded-full transform hover:scale-105 transition-all duration-300 shadow-lg text-lg"
            >
              Sign In
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
