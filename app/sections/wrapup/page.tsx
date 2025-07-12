"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useAnimationControls } from "framer-motion";
import { Star } from "lucide-react";

const testimonials = [
  {
    name: "Isabella Chen",
    occupation: "Creative Director, LUXE Magazine",
    rating: 5,
    testimonial: "MUSE connected us with an incredible makeup artist for our cover shoot. The level of artistry and professionalism was unmatched. Every detail was executed flawlessly.",
  },
  {
    name: "Alexandra Rodriguez",
    occupation: "Brand Director, Atelier Beauty", 
    rating: 5,
    testimonial: "Working with MUSE artists has elevated our campaign visuals to editorial-level excellence. The platform makes finding and collaborating with top-tier talent effortless and professional.",
  },
  {
    name: "Sophie Williams",
    occupation: "Fashion Photographer",
    rating: 5,
    testimonial: "The makeup artists on MUSE understand fashion photography at the highest level. Their expertise in camera-ready application and artistic vision consistently exceeds expectations.",
  },
  {
    name: "Marcus Thompson",
    occupation: "Music Video Director",
    rating: 5,
    testimonial: "MUSE artists bring concepts to life with incredible skill and creativity. The booking process is seamless, and the results are always stunning and professional.",
  }
];

// Double the testimonials array for smooth infinite scroll
const doubledTestimonials = [...testimonials, ...testimonials];

export default function Wrapup() {
  const controls = useAnimationControls();
  const containerRef = useRef<HTMLDivElement>(null);
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    const startAnimation = async () => {
      if (isHovered) return;
      
      await controls.start({
        x: [0, -100 * testimonials.length],
        transition: {
          duration: 20,
          ease: "linear",
          repeat: Infinity,
        },
      });
    };

    startAnimation();
  }, [controls, isHovered]);

  return (
    <section className="py-12 md:py-24 bg-white relative overflow-hidden">
      <div className="container mx-auto px-4 md:px-6">
        <div className="max-w-[1200px] mx-auto">
          {/* Section Header */}
          <div className="text-center mb-8 md:mb-16">
            <h2 className="text-[1.5rem] sm:text-[2rem] md:text-[3.25rem] leading-tight font-light mb-4 md:mb-6 text-black tracking-wider">
              TRUSTED BY CREATIVES
            </h2>
            <p className="text-sm md:text-lg text-gray-600 font-light">
              Exceptional artists. Exceptional results. Exceptional experiences.
            </p>
          </div>
        </div>

        {/* Full-width slider container */}
        <div className="relative">
          {/* Gradient Container */}
          <div className="absolute inset-0 pointer-events-none max-w-[1400px] mx-auto left-0 right-0">
            {/* Left Gradient */}
            <div className="absolute left-0 top-0 bottom-0 w-16 md:w-32 bg-gradient-to-r from-white to-transparent z-20" />
            {/* Right Gradient */}
            <div className="absolute right-0 top-0 bottom-0 w-16 md:w-32 bg-gradient-to-l from-white to-transparent z-20" />
          </div>

          {/* Testimonials Slider Container */}
          <div 
            className="relative overflow-hidden touch-none"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => {
              setIsHovered(false);
              controls.start({
                x: [0, -100 * testimonials.length],
                transition: {
                  duration: 20,
                  ease: "linear",
                  repeat: Infinity,
                },
              });
            }}
          >
            {/* Cards Container with max-width and center alignment */}
            <div className="max-w-[1400px] mx-auto">
              <div className="flex gap-4 md:gap-8 px-4 md:px-8" ref={containerRef}>
                <motion.div 
                  className="flex gap-4 md:gap-8"
                  animate={controls}
                >
                  {doubledTestimonials.map((testimonial, index) => (
                    <div
                      key={index}
                      className="flex-shrink-0 w-[260px] sm:w-[320px] md:w-[400px] bg-[#faf9f4] rounded-2xl md:rounded-3xl p-4 md:p-6 relative z-10"
                    >
                      {/* Rating */}
                      <div className="flex gap-1 mb-3 md:mb-4">
                        {[...Array(testimonial.rating)].map((_, i) => (
                          <Star key={i} className="w-3 h-3 md:w-4 md:h-4 fill-red-500 text-red-500" />
                        ))}
                      </div>

                      {/* Testimonial Text */}
                      <p className="text-gray-800 text-sm md:text-lg mb-4 md:mb-8">"{testimonial.testimonial}"</p>

                      {/* Profile */}
                      <div>
                        <h4 className="text-gray-900 font-medium text-xs md:text-base mb-1">{testimonial.name}</h4>
                        <p className="text-gray-500 text-[10px] md:text-sm">{testimonial.occupation}</p>
                      </div>
                    </div>
                  ))}
                </motion.div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Background Decorations */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 -left-8 md:-left-12 w-16 md:w-24 h-16 md:h-24 bg-gray-100 rounded-full blur-xl" />
        <div className="absolute bottom-1/4 -right-8 md:-right-12 w-16 md:w-24 h-16 md:h-24 bg-gray-100 rounded-full blur-xl" />
      </div>
    </section>
  );
}