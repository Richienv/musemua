"use client";

import { cn } from "@/lib/utils";
import { DotPattern } from "@/components/magicui/dot-pattern";
import { motion } from "framer-motion";

export function CustomBackground() {
  return (
    <div className="relative flex h-full w-full items-center justify-center overflow-hidden bg-[#faf9f5]">
      {/* Dot pattern with glow effect */}
      <DotPattern
        width={20}
        height={20}
        cx={1}
        cy={1}
        cr={1}
        glow={true}
        className={cn("opacity-50")}
      />

      {/* Left spotlight for cards */}
      <motion.div
        animate={{
          y: [-20, 20, -20],
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          repeatType: "reverse",
          ease: "easeInOut",
        }}
        className="absolute left-[20%] top-[30%] w-[600px] h-[600px] opacity-60"
        style={{
          background: "radial-gradient(circle at center, rgba(74, 144, 226, 0.15) 0%, rgba(74, 144, 226, 0.05) 50%, transparent 70%)",
          filter: "blur(40px)",
          transform: "translateY(-50%) rotate(-15deg)",
        }}
      />

      {/* Right spotlight for cards */}
      <motion.div
        animate={{
          y: [20, -20, 20],
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          repeatType: "reverse",
          ease: "easeInOut",
        }}
        className="absolute right-[20%] top-[30%] w-[600px] h-[600px] opacity-60"
        style={{
          background: "radial-gradient(circle at center, rgba(74, 144, 226, 0.15) 0%, rgba(74, 144, 226, 0.05) 50%, transparent 70%)",
          filter: "blur(40px)",
          transform: "translateY(-50%) rotate(15deg)",
        }}
      />

      {/* Center spotlight for title */}
      <motion.div
        animate={{
          scale: [1, 1.1, 1],
          opacity: [0.4, 0.5, 0.4],
        }}
        transition={{
          duration: 10,
          repeat: Infinity,
          repeatType: "reverse",
          ease: "easeInOut",
        }}
        className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px]"
        style={{
          background: "radial-gradient(circle at center, rgba(74, 144, 226, 0.1) 0%, rgba(74, 144, 226, 0.05) 60%, transparent 80%)",
          filter: "blur(60px)",
        }}
      />
    </div>
  );
}