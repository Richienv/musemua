"use client";

import Image from "next/image";
import { motion } from "framer-motion";

export default function Preview() {
  return (
    <section className="py-12 sm:py-16 md:py-24 bg-white">
      <div className="container mx-auto px-3 sm:px-4">
        <div className="max-w-[1200px] mx-auto">
          {/* Section Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12 sm:mb-16 md:mb-24"
          >
            <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-light mb-4 sm:mb-6 md:mb-8 tracking-wider text-black">
              MEET MUSE
            </h2>
            <div className="max-w-3xl mx-auto px-3 sm:px-4">
              <p className="text-sm sm:text-base md:text-lg text-gray-600 leading-relaxed sm:leading-relaxed md:leading-relaxed font-light">
                The premier platform connecting exceptional makeup artists with visionary creators. 
                Where artistry meets opportunity, and every collaboration sets new standards in beauty.
              </p>
              <p className="text-sm sm:text-base md:text-lg text-gray-600 leading-relaxed sm:leading-relaxed md:leading-relaxed font-light mt-3 sm:mt-4">
                Our curated network of elite MUAs transforms creative visions into stunning reality, 
                one project at a time.
              </p>
            </div>
          </motion.div>

          {/* Service Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
            {/* Card 1 - Secure Payments */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="group bg-[#faf9f4] rounded-xl sm:rounded-2xl border border-black/[0.08] overflow-hidden hover:shadow-lg transition-all duration-300"
            >
              <div className="aspect-[4/3] sm:aspect-square relative p-4 sm:p-6">
                <Image
                  src="https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=400&h=400&fit=crop&crop=center"
                  alt="Secure Payments"
                  fill
                  className="object-cover rounded-lg transform group-hover:scale-105 transition-transform duration-300"
                />
              </div>
              <div className="px-4 sm:px-6 pb-6 sm:pb-8 pt-3 sm:pt-4 text-center">
                <h3 className="text-base sm:text-lg md:text-xl font-light mb-2 sm:mb-3 tracking-wide">SECURE PAYMENTS</h3>
                <p className="text-[11px] sm:text-xs text-gray-600 leading-relaxed font-light">
                  Seamless, protected transactions with complete payment history and bank-level security. 
                  Focus on your art while we handle the business.
                </p>
              </div>
            </motion.div>

            {/* Card 2 - Elite Artists */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="group bg-[#faf9f4] rounded-xl sm:rounded-2xl border border-black/[0.08] overflow-hidden hover:shadow-lg transition-all duration-300"
            >
              <div className="aspect-[4/3] sm:aspect-square relative p-4 sm:p-6">
                <Image
                  src="https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=400&h=400&fit=crop&crop=center"
                  alt="Elite Artists"
                  fill
                  className="object-cover rounded-lg transform group-hover:scale-105 transition-transform duration-300"
                />
              </div>
              <div className="px-4 sm:px-6 pb-6 sm:pb-8 pt-3 sm:pt-4 text-center">
                <h3 className="text-base sm:text-lg md:text-xl font-light mb-2 sm:mb-3 tracking-wide">ELITE ARTISTS</h3>
                <p className="text-[11px] sm:text-xs text-gray-600 leading-relaxed font-light">
                  Handpicked professionals with proven editorial experience and exceptional portfolios. 
                  Every artist brings unique expertise to elevate your creative vision.
                </p>
              </div>
            </motion.div>

            {/* Card 3 - Concierge Support */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="group bg-[#faf9f4] rounded-xl sm:rounded-2xl border border-black/[0.08] overflow-hidden hover:shadow-lg transition-all duration-300"
            >
              <div className="aspect-[4/3] sm:aspect-square relative p-4 sm:p-6">
                <Image
                  src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&h=400&fit=crop&crop=center"
                  alt="Concierge Support"
                  fill
                  className="object-cover rounded-lg transform group-hover:scale-105 transition-transform duration-300"
                />
              </div>
              <div className="px-4 sm:px-6 pb-6 sm:pb-8 pt-3 sm:pt-4 text-center">
                <h3 className="text-base sm:text-lg md:text-xl font-light mb-2 sm:mb-3 tracking-wide">CONCIERGE SUPPORT</h3>
                <p className="text-[11px] sm:text-xs text-gray-600 leading-relaxed font-light">
                  Dedicated support throughout your collaboration journey. From initial consultation 
                  to project completion, we ensure every detail exceeds expectations.
                </p>
              </div>
            </motion.div>

            {/* Card 4 - Flexible Collaboration */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="group bg-[#faf9f4] rounded-xl sm:rounded-2xl border border-black/[0.08] overflow-hidden hover:shadow-lg transition-all duration-300"
            >
              <div className="aspect-[4/3] sm:aspect-square relative p-4 sm:p-6">
                <Image
                  src="https://images.unsplash.com/photo-1516975080664-ed2fc6a32937?w=400&h=400&fit=crop&crop=center"
                  alt="Flexible Collaboration"
                  fill
                  className="object-cover rounded-lg transform group-hover:scale-105 transition-transform duration-300"
                />
              </div>
              <div className="px-4 sm:px-6 pb-6 sm:pb-8 pt-3 sm:pt-4 text-center">
                <h3 className="text-base sm:text-lg md:text-xl font-light mb-2 sm:mb-3 tracking-wide">FLEXIBLE COLLABORATION</h3>
                <p className="text-[11px] sm:text-xs text-gray-600 leading-relaxed font-light">
                  Direct communication and seamless project coordination. From single sessions to ongoing partnerships, 
                  we adapt to your creative timeline and vision.
                </p>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
} 