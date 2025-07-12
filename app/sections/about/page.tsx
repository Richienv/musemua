"use client";

import { motion } from "framer-motion";
import Image from "next/image";

interface TutorialSlide {
  image: string;
  title: string;
  description: string;
}

const tutorialSlides: TutorialSlide[] = [
  {
    image: "https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=800&h=600&fit=crop&crop=center",
    title: "DISCOVER TALENT",
    description: "Browse our curated selection of elite makeup artists. Each profile showcases their unique style, portfolio, and artistic expertise."
  },
  {
    image: "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=800&h=600&fit=crop&crop=center", 
    title: "VIEW PORTFOLIOS",
    description: "Explore detailed portfolios featuring editorial work, brand campaigns, and artistic collaborations to find your perfect match."
  },
  {
    image: "https://images.unsplash.com/photo-1559163499-413811fb2344?w=800&h=600&fit=crop&crop=center",
    title: "REQUEST COLLABORATION",
    description: "Submit a detailed collaboration request outlining your vision, timeline, and project requirements directly through our platform."
  },
  {
    image: "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=800&h=600&fit=crop&crop=center",
    title: "REVIEW PROPOSALS",
    description: "Receive personalized proposals from interested artists with detailed concepts, pricing, and availability for your project."
  },
  {
    image: "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=800&h=600&fit=crop&crop=center",
    title: "SECURE BOOKING", 
    description: "Finalize your collaboration with secure payment processing and comprehensive project agreements to protect both parties."
  },
  {
    image: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=800&h=600&fit=crop&crop=center",
    title: "PROJECT COORDINATION",
    description: "Coordinate logistics, schedules, and creative details through our integrated communication system and project management tools."
  },
  {
    image: "https://images.unsplash.com/photo-1516975080664-ed2fc6a32937?w=800&h=600&fit=crop&crop=center",
    title: "CREATIVE EXECUTION",
    description: "Watch your vision come to life as the makeup artist delivers exceptional results that exceed your artistic expectations."
  },
  {
    image: "https://images.unsplash.com/photo-1494790108755-2616b612b272?w=800&h=600&fit=crop&crop=center",
    title: "SHARE SUCCESS",
    description: "Showcase your completed collaboration and build lasting relationships for future projects within our creative community."
  }
];

export default function About() {
  return (
    <section className="relative bg-[#faf9f4] overflow-hidden">
      {/* Header Section */}
      <div className="sticky top-0 z-30 bg-[#faf9f4]/80 backdrop-blur-sm pt-16 sm:pt-24 pb-8 sm:pb-12">
        <div className="container mx-auto px-3 sm:px-4">
          <div className="text-center">
            <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-light mb-4 sm:mb-6 tracking-wider text-black">
              HOW IT WORKS
            </h2>
            <p className="text-xs sm:text-sm md:text-base text-gray-600 leading-relaxed md:leading-relaxed font-light max-w-3xl mx-auto px-2">
              From discovery to collaboration, every step is designed to create exceptional 
              partnerships between visionary creators and world-class makeup artists.
            </p>
          </div>
        </div>
      </div>

      {/* Steps Section */}
      <div className="container mx-auto px-3 sm:px-4 pb-16 sm:pb-24">
        <div className="max-w-[1200px] mx-auto">
          <div className="space-y-24 sm:space-y-32 md:space-y-40">
            {tutorialSlides.map((slide, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-10%" }}
                transition={{ 
                  duration: 0.8,
                  ease: [0.21, 0.47, 0.32, 0.98]
                }}
                className="relative"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8 md:gap-12 items-center">
                  {/* Image Section */}
                  <div className={`order-1 ${index % 2 === 0 ? 'md:order-1' : 'md:order-2'}`}>
                    <div className="relative aspect-[16/10] rounded-xl sm:rounded-2xl overflow-hidden bg-white shadow-[0_8px_30px_rgb(0,0,0,0.12)]">
                      <Image
                        src={slide.image}
                        alt={slide.title}
                        fill
                        className="object-cover"
                        priority={index < 2}
                      />
                    </div>
                  </div>

                  {/* Content Section */}
                  <div className={`order-2 ${index % 2 === 0 ? 'md:order-2' : 'md:order-1'}`}>
                    <div className="relative">
                      <div className="space-y-3 sm:space-y-4">
                        <div className="flex items-center gap-3">
                          <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-black/[0.03] flex items-center justify-center">
                            <span className="text-xs sm:text-sm font-medium text-gray-600">
                              {index + 1}
                            </span>
                          </div>
                          <h3 className="text-lg sm:text-xl md:text-2xl font-medium text-gray-900">
                            {slide.title}
                          </h3>
                        </div>
                        <p className="text-sm sm:text-base text-gray-600 leading-relaxed font-light">
                          {slide.description}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Background Decorations */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 -left-12 w-24 h-24 bg-gradient-to-r from-[#1e40af] to-[#6b21a8] rounded-full opacity-[0.03] blur-2xl" />
        <div className="absolute bottom-1/4 -right-12 w-24 h-24 bg-gradient-to-r from-[#6b21a8] to-[#1e40af] rounded-full opacity-[0.03] blur-2xl" />
      </div>
    </section>
  );
} 