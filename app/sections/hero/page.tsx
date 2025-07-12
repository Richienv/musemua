"use client";

import { Star, Play } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import Link from "next/link";

// Mock testimonial data
const testimonials = [
  {
    id: 1,
    name: "Sarah M.",
    avatar: "/images/profile1.jpg",
    text: "Amazing platform! Increased my sales by 300% with professional MUAs."
  },
  {
    id: 2, 
    name: "David L.",
    avatar: "/images/profile2.jpg",
    text: "The expertise and results speak for themselves. Highly recommended!"
  },
  {
    id: 3,
    name: "Maya K.",
    avatar: "/images/profile3.jpg", 
    text: "Professional service, incredible talent, outstanding results every time."
  }
];

export default function Hero() {
  const router = useRouter();

  return (
    <section className="relative min-h-screen bg-gradient-to-br from-gray-100 via-gray-50 to-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <header className="flex items-center justify-between py-6">
          {/* Left Navigation */}
          <div className="hidden md:flex items-center space-x-8 text-sm font-medium text-gray-700">
            <Link href="#" className="hover:text-gray-900 transition-colors">SHOP</Link>
            <Link href="#" className="hover:text-gray-900 transition-colors">MEN</Link>
            <Link href="#" className="hover:text-gray-900 transition-colors">WOMEN</Link>
            <Link href="#" className="hover:text-gray-900 transition-colors">TRENDING</Link>
          </div>

          {/* Center Logo */}
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 tracking-wider">MUSE</h1>
          </div>

          {/* Right Navigation */}
          <div className="hidden md:flex items-center space-x-6 text-sm font-medium text-gray-700">
            <Link href="#" className="hover:text-gray-900 transition-colors">SEASONAL</Link>
            <Link href="#" className="hover:text-gray-900 transition-colors">ACCESSORIES</Link>
            <Link href="/sign-in" className="bg-black text-white px-6 py-2 rounded-full hover:bg-gray-800 transition-colors">
              SIGN IN / UP
            </Link>
            <div className="w-8 h-8 rounded-full bg-gray-900 text-white flex items-center justify-center text-xs font-bold">
              0
            </div>
          </div>
        </header>

        {/* Main Content */}
        <div className="relative flex flex-col items-center justify-center min-h-[80vh] text-center">
          {/* Main Heading */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="mb-8"
          >
            <h2 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-gray-900 leading-tight mb-8">
              GEAR UP EVERY SEASON
              <br />
              EVERY WORK
            </h2>
            
            {/* Action Buttons */}
            <div className="flex items-center justify-center gap-4 mb-16">
              <Link 
                href="/sign-in"
                className="bg-black text-white px-8 py-3 rounded-full font-medium hover:bg-gray-800 transition-all duration-300"
              >
                SHOP NOW
              </Link>
              <Link 
                href="/protected"
                className="border border-gray-300 text-gray-700 px-8 py-3 rounded-full font-medium hover:border-gray-400 hover:bg-gray-50 transition-all duration-300"
              >
                EXPLORE ALL
              </Link>
            </div>
          </motion.div>

          {/* Main Hero Image - Centered and Large */}
          <div className="flex justify-center mt-8 mb-12">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 1, delay: 0.4 }}
              className="relative"
            >
              <div className="relative w-80 h-96 sm:w-96 sm:h-[500px] lg:w-[500px] lg:h-[600px]">
                <Image
                  src="/images/landingpage-main-headshot.png"
                  alt="Professional MUA Expert"
                  fill
                  className="object-cover rounded-2xl transition-transform duration-700 hover:scale-105"
                  priority
                  sizes="(max-width: 640px) 320px, (max-width: 1024px) 384px, 500px"
                />
              </div>
            </motion.div>
          </div>

          {/* Testimonials Section - Below Image */}
          <div className="flex justify-center">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.6 }}
              className="space-y-6 max-w-sm text-center"
            >
              {/* Profile Avatars */}
              <div className="flex -space-x-2 justify-center">
                {testimonials.slice(0, 3).map((testimonial, index) => (
                  <motion.div
                    key={testimonial.id}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.4, delay: 0.8 + index * 0.1 }}
                    className="relative"
                  >
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-gray-300 to-gray-400 border-2 border-white shadow-sm flex items-center justify-center text-gray-600 font-medium text-sm">
                      {testimonial.name.charAt(0)}
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Testimonial Text */}
              <div className="space-y-3">
                <p className="text-sm text-gray-600 leading-relaxed">
                  Stay cozy without compromising your range of motion. Our women's winter range is perfect for those chilly outdoor workouts.
                </p>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}