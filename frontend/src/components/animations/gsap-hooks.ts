"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

export function useGSAP() {
  const ctx = useRef<gsap.Context | null>(null);

  useEffect(() => {
    return () => {
      ctx.current?.revert();
    };
  }, []);

  return {
    context: (fn: () => void, scope?: React.RefObject<HTMLElement | null>) => {
      ctx.current = gsap.context(fn, scope?.current || undefined);
      return ctx.current;
    },
    gsap,
    ScrollTrigger,
  };
}

export function useTextReveal(ref: React.RefObject<HTMLElement | null>, delay = 0) {
  useEffect(() => {
    if (!ref.current) return;
    const ctx = gsap.context(() => {
      gsap.from(ref.current!, {
        y: 80,
        opacity: 0,
        duration: 1.2,
        delay,
        ease: "power4.out",
      });
    });
    return () => ctx.revert();
  }, [ref, delay]);
}

export function useStaggerReveal(ref: React.RefObject<HTMLElement | null>, selector: string, stagger = 0.1) {
  useEffect(() => {
    if (!ref.current) return;
    const ctx = gsap.context(() => {
      gsap.from(ref.current!.querySelectorAll(selector), {
        y: 60,
        opacity: 0,
        duration: 0.8,
        stagger,
        ease: "power3.out",
        scrollTrigger: {
          trigger: ref.current!,
          start: "top 80%",
          once: true,
        },
      });
    });
    return () => ctx.revert();
  }, [ref, selector, stagger]);
}

export function useParallax(ref: React.RefObject<HTMLElement | null>, speed = 50) {
  useEffect(() => {
    if (!ref.current) return;
    const ctx = gsap.context(() => {
      gsap.to(ref.current!, {
        yPercent: speed,
        ease: "none",
        scrollTrigger: {
          trigger: ref.current!,
          start: "top bottom",
          end: "bottom top",
          scrub: true,
        },
      });
    });
    return () => ctx.revert();
  }, [ref, speed]);
}

export function useCountUp(ref: React.RefObject<HTMLElement | null>, end: number, duration = 2) {
  useEffect(() => {
    if (!ref.current) return;
    const obj = { val: 0 };
    const ctx = gsap.context(() => {
      gsap.to(obj, {
        val: end,
        duration,
        ease: "power2.out",
        onUpdate: () => {
          if (ref.current) ref.current.textContent = obj.val.toFixed(end % 1 ? 4 : 0);
        },
        scrollTrigger: {
          trigger: ref.current!,
          start: "top 85%",
          once: true,
        },
      });
    });
    return () => ctx.revert();
  }, [ref, end, duration]);
}

export function useMagneticHover(ref: React.RefObject<HTMLElement | null>, strength = 0.3) {
  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const onMove = (e: MouseEvent) => {
      const rect = el.getBoundingClientRect();
      const x = (e.clientX - rect.left - rect.width / 2) * strength;
      const y = (e.clientY - rect.top - rect.height / 2) * strength;
      gsap.to(el, { x, y, duration: 0.4, ease: "power2.out" });
    };

    const onLeave = () => {
      gsap.to(el, { x: 0, y: 0, duration: 0.6, ease: "elastic.out(1, 0.5)" });
    };

    el.addEventListener("mousemove", onMove);
    el.addEventListener("mouseleave", onLeave);
    return () => {
      el.removeEventListener("mousemove", onMove);
      el.removeEventListener("mouseleave", onLeave);
    };
  }, [ref, strength]);
}
