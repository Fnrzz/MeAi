"use client";

import { useRef, useEffect } from "react";
import gsap from "gsap";

interface SplitTextProps {
  text: string;
  className?: string;
  delay?: number;
  tag?: "h1" | "h2" | "h3" | "p" | "span";
}

export function SplitText({ text, className = "", delay = 0, tag: Tag = "span" }: SplitTextProps) {
  const containerRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    const chars = containerRef.current.querySelectorAll(".split-char");
    const ctx = gsap.context(() => {
      gsap.from(chars, {
        y: 40,
        opacity: 0,
        rotateX: -90,
        duration: 0.6,
        stagger: 0.02,
        delay,
        ease: "back.out(1.7)",
      });
    });
    return () => ctx.revert();
  }, [delay]);

  return (
    <Tag ref={containerRef as any} className={`${className}`} style={{ perspective: "1000px" }}>
      {text.split("").map((char, i) => (
        <span
          key={i}
          className="split-char inline-block will-change-transform"
          style={{ display: char === " " ? "inline" : "inline-block" }}
        >
          {char === " " ? "\u00A0" : char}
        </span>
      ))}
    </Tag>
  );
}

interface RevealLineProps {
  text: string;
  className?: string;
  delay?: number;
}

export function RevealLine({ text, className = "", delay = 0 }: RevealLineProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ref.current) return;
    const ctx = gsap.context(() => {
      gsap.from(ref.current!, {
        y: 60,
        opacity: 0,
        duration: 1,
        delay,
        ease: "power4.out",
      });
    });
    return () => ctx.revert();
  }, [delay]);

  return (
    <div ref={ref} className={`overflow-hidden ${className}`}>
      {text}
    </div>
  );
}
