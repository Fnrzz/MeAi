"use client";

import { useRef, useEffect } from "react";
import gsap from "gsap";

interface MarqueeProps {
  children: React.ReactNode;
  speed?: number;
  direction?: "left" | "right";
  pauseOnHover?: boolean;
  className?: string;
}

export function Marquee({
  children,
  speed = 30,
  direction = "left",
  pauseOnHover = true,
  className = "",
}: MarqueeProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const tweenRef = useRef<gsap.core.Tween | null>(null);

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;

    const items = track.children;
    if (items.length === 0) return;

    const clone = track.innerHTML;
    track.innerHTML += clone;

    const totalWidth = track.scrollWidth / 2;
    const xPercent = direction === "left" ? 0 : -50;

    tweenRef.current = gsap.fromTo(
      track,
      { xPercent },
      {
        xPercent: direction === "left" ? -50 : 0,
        duration: totalWidth / speed,
        ease: "none",
        repeat: -1,
      },
    );

    if (pauseOnHover) {
      track.addEventListener("mouseenter", () => tweenRef.current?.pause());
      track.addEventListener("mouseleave", () => tweenRef.current?.resume());
    }

    return () => {
      tweenRef.current?.kill();
    };
  }, [speed, direction, pauseOnHover]);

  return (
    <div className={`overflow-hidden ${className}`}>
      <div ref={trackRef} className="flex whitespace-nowrap will-change-transform">
        {children}
      </div>
    </div>
  );
}

export function MarqueeItem({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`flex-shrink-0 px-4 ${className}`}>
      {children}
    </div>
  );
}
