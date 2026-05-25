"use client";

import { useRef, useEffect } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

interface ParallaxSectionProps {
  children: React.ReactNode;
  speed?: number;
  className?: string;
  offset?: number;
}

export function ParallaxSection({ children, speed = -30, className = "", offset = 0 }: ParallaxSectionProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ref.current) return;
    const ctx = gsap.context(() => {
      gsap.to(ref.current!, {
        y: speed,
        ease: "none",
        scrollTrigger: {
          trigger: ref.current!,
          start: `top bottom+=${offset}`,
          end: "bottom top",
          scrub: 1,
        },
      });
    });
    return () => ctx.revert();
  }, [speed, offset]);

  return (
    <div ref={ref} className={`will-change-transform ${className}`}>
      {children}
    </div>
  );
}

interface ScaleInProps {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  from?: number;
}

export function ScaleIn({ children, className = "", delay = 0, from = 0.8 }: ScaleInProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ref.current) return;
    const ctx = gsap.context(() => {
      gsap.from(ref.current!, {
        scale: from,
        opacity: 0,
        duration: 1,
        delay,
        ease: "power3.out",
        scrollTrigger: {
          trigger: ref.current!,
          start: "top 85%",
          once: true,
        },
      });
    });
    return () => ctx.revert();
  }, [delay, from]);

  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
}

interface FadeInUpProps {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  y?: number;
}

export function FadeInUp({ children, className = "", delay = 0, y = 40 }: FadeInUpProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ref.current) return;
    const ctx = gsap.context(() => {
      gsap.from(ref.current!, {
        y,
        opacity: 0,
        duration: 0.9,
        delay,
        ease: "power3.out",
        scrollTrigger: {
          trigger: ref.current!,
          start: "top 88%",
          once: true,
        },
      });
    });
    return () => ctx.revert();
  }, [delay, y]);

  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
}

interface HorizontalScrollProps {
  children: React.ReactNode;
  className?: string;
  speed?: number;
}

export function HorizontalScroll({ children, className = "", speed = 1 }: HorizontalScrollProps) {
  const ref = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ref.current || !trackRef.current) return;
    const ctx = gsap.context(() => {
      const track = trackRef.current!;
      const scrollWidth = track.scrollWidth - ref.current!.offsetWidth;

      gsap.to(track, {
        x: -scrollWidth,
        ease: "none",
        scrollTrigger: {
          trigger: ref.current!,
          start: "top bottom",
          end: () => `+=${scrollWidth * speed}`,
          scrub: 1,
        },
      });
    });
    return () => ctx.revert();
  }, [speed]);

  return (
    <div ref={ref} className={`overflow-hidden ${className}`}>
      <div ref={trackRef} className="flex will-change-transform">
        {children}
      </div>
    </div>
  );
}
