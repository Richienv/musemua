"use client";

import { Star, Play } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import Link from "next/link";

// Mock testimonial data for MUA collaboration platform
const testimonials = [
  {
    id: 1,
    name: "Bella R.",
    avatar: "/images/profile1.jpg",
    text: "This platform literally changed my whole brand game! 🔥"
  },
  {
    id: 2, 
    name: "Zara K.",
    avatar: "/images/profile2.jpg",
    text: "Finally found my MUA soulmate through MUSE! No cap 💯"
  },
  {
    id: 3,
    name: "Alex T.",
    avatar: "/images/profile3.jpg", 
    text: "The glow up is REAL! Every collab hits different here ✨"
  }
];

export default function Hero() {
  const router = useRouter();

  return (
    <section className="relative min-h-screen bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Main Content */}
        <div className="relative flex flex-col items-center justify-center min-h-screen text-center pt-32">
          {/* Main Heading */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="mb-6"
          >
            <h2 className="text-5xl sm:text-6xl lg:text-8xl font-light text-black leading-tight tracking-wider">
              ELEVATE YOUR
              <br />
              <span className="font-bold">
                ARTISTRY
              </span>
            </h2>
          </motion.div>

          {/* Main Hero Image - Clean and Elegant */}
          <div className="flex justify-center mt-4 mb-8">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 1, delay: 0.4 }}
              className="relative"
            >
              <div className="relative w-80 h-96 sm:w-96 sm:h-[500px] lg:w-[500px] lg:h-[600px]">
                <Image
                  src="/images/landingpage-main-headshot.png"
                  alt="Professional MUA Expert"
                  fill
                  className="object-contain"
                  priority
                  sizes="(max-width: 640px) 320px, (max-width: 1024px) 384px, 500px"
                />
              </div>
            </motion.div>
          </div>

          {/* Description and CTA Section */}
          <div className="flex justify-center">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.6 }}
              className="space-y-12 max-w-3xl text-center"
            >
              {/* Main Description */}
              <div className="space-y-6">
                <p className="text-xl sm:text-2xl text-black leading-relaxed font-light tracking-wide">
                  Where visionary creators meet exceptional makeup artists.
                </p>
                <p className="text-base text-gray-600 leading-relaxed font-light max-w-2xl mx-auto">
                  Curated collaborations for editorial campaigns, luxury brand partnerships, 
                  and artistic projects that define the future of beauty.
                </p>
              </div>

              {/* Single Action Button */}
              <div className="pt-8">
                <Link 
                  href="/protected"
                  className="inline-block bg-black text-white px-12 py-4 text-sm font-medium tracking-widest uppercase hover:bg-gray-800 transition-all duration-300"
                >
                  DISCOVER TALENT
                </Link>
              </div>

              {/* Elegant Stats */}
              <div className="flex items-center justify-center gap-16 pt-16 border-t border-gray-100">
                <div className="text-center">
                  <div className="text-3xl font-light text-black mb-2">500+</div>
                  <div className="text-xs font-medium tracking-widest text-gray-500 uppercase">Curated Artists</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-light text-black mb-2">1K+</div>
                  <div className="text-xs font-medium tracking-widest text-gray-500 uppercase">Projects Completed</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-light text-black mb-2">48H</div>
                  <div className="text-xs font-medium tracking-widest text-gray-500 uppercase">Response Time</div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}