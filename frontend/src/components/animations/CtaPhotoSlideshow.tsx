"use client";

import { useEffect, useRef, useState } from "react";
import gsap from "gsap";

const photos = [
  "https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=1920&q=80",
  "https://images.unsplash.com/photo-1600880292089-90a7e086ee0c?w=1920&q=80",
  "https://images.unsplash.com/photo-1531482615791-6ef8107de631?w=1920&q=80",
  "https://images.unsplash.com/photo-1552664723-042e52535550?w=1920&q=80",
  "https://images.unsplash.com/photo-1573164713988-8665bb96ca27?w=1920&q=80",
  "https://images.unsplash.com/photo-1553877566-94a1e1c52661?w=1920&q=80",
  "https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=1920&q=80",
  "https://images.unsplash.com/photo-1504384308090-c894fdcc538c?w=1920&q=80",
  "https://images.unsplash.com/photo-1556761175-4b46a572b786?w=1920&q=80",
  "https://images.unsplash.com/photo-1497215728101-856f4ea42174?w=1920&q=80",
  "https://images.unsplash.com/photo-1521737711867-e3b97328f17d?w=1920&q=80",
  "https://images.unsplash.com/photo-1542744173-8e26b8452a5b?w=1920&q=80",
  "https://images.unsplash.com/photo-1515187049263-3a8d0a7e1e7c?w=1920&q=80",
  "https://images.unsplash.com/photo-1531403009284-440f080d1e12?w=1920&q=80",
  "https://images.unsplash.com/photo-1605810230434-77313c3fa1c8?w=1920&q=80",
];

export function CtaPhotoSlideshow() {
  const containerRef = useRef<HTMLDivElement>(null);
  const imgRefs = useRef<(HTMLDivElement | null)[]>([]);
  const currentRef = useRef(0);
  const [validPhotos, setValidPhotos] = useState<number[]>([0]);

  useEffect(() => {
    const valid: number[] = [];
    let checked = 0;

    photos.forEach((src, idx) => {
      const img = new Image();
      img.onload = () => {
        valid.push(idx);
        checked++;
        if (checked === photos.length) {
          valid.sort((a, b) => a - b);
          setValidPhotos(valid);
        }
      };
      img.onerror = () => {
        checked++;
        if (checked === photos.length) {
          valid.sort((a, b) => a - b);
          setValidPhotos(valid);
        }
      };
      img.src = src;
    });
  }, []);

  useEffect(() => {
    if (validPhotos.length === 0) return;

    imgRefs.current.forEach((el, idx) => {
      if (el) {
        gsap.set(el, { opacity: idx === 0 ? 1 : 0 });
      }
    });

    const interval = setInterval(() => {
      const prevIdx = currentRef.current;
      const nextIdx = (prevIdx + 1) % validPhotos.length;
      currentRef.current = nextIdx;

      const prevEl = imgRefs.current[prevIdx];
      const nextEl = imgRefs.current[nextIdx];

      if (nextEl) {
        gsap.fromTo(nextEl, { opacity: 0, scale: 1.05 }, { opacity: 1, scale: 1, duration: 1, ease: "power2.out" });
      }
      if (prevEl) {
        gsap.to(prevEl, { opacity: 0, scale: 1.02, duration: 0.8, ease: "power2.in" });
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [validPhotos]);

  return (
    <div ref={containerRef} className="absolute inset-0 overflow-hidden" style={{ zIndex: 0, background: "#020A18" }}>
      {validPhotos.map((photoIdx, idx) => (
        <div
          key={photoIdx}
          ref={(el) => { imgRefs.current[idx] = el; }}
          className="absolute inset-0"
        >
          <img
            src={photos[photoIdx]}
            alt=""
            className="absolute inset-0 w-full h-full object-cover"
            style={{ filter: "brightness(0.5) saturate(0.85)" }}
          />
        </div>
      ))}
      <div className="absolute inset-0" style={{
        background: "linear-gradient(to bottom, rgba(255,255,255,0.35) 0%, rgba(255,255,255,0.05) 50%, rgba(255,255,255,0.35) 100%)",
      }} />
    </div>
  );
}
