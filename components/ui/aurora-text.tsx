"use client";

import { cn } from "@/lib/utils";
import { useEffect, useRef } from "react";

interface AuroraTextProps {
  children: React.ReactNode;
  className?: string;
}

export function AuroraText({ children, className }: AuroraTextProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const gradientRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    const gradient = gradientRef.current;

    if (!container || !gradient) return;

    const handleMouseMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      gradient.style.setProperty("--x", `${x}px`);
      gradient.style.setProperty("--y", `${y}px`);
    };

    container.addEventListener("mousemove", handleMouseMove);

    return () => {
      container.removeEventListener("mousemove", handleMouseMove);
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className={cn("relative w-fit", className)}
    >
      <div
        ref={gradientRef}
        className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_var(--x,50%)_var(--y,50%),rgba(74,144,226,0.3)_0%,transparent_100%)] opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        style={{ "--x": "50%", "--y": "50%" } as React.CSSProperties}
      />
      {children}
    </div>
  );
}