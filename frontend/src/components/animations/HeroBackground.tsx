"use client";

import { useEffect, useRef, useCallback } from "react";
import gsap from "gsap";

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  opacity: number;
  pulse: number;
  pulseSpeed: number;
  layer: number;
}

export function HeroBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouseRef = useRef({ x: -1000, y: -1000 });
  const particlesRef = useRef<Particle[]>([]);
  const frameRef = useRef(0);
  const rafRef = useRef<number>(0);

  const init = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;

    const ctx = canvas.getContext("2d")!;
    ctx.scale(dpr, dpr);

    const w = rect.width;
    const h = rect.height;
    const count = Math.min(Math.floor((w * h) / 8000), 200);

    const particles: Particle[] = [];
    for (let i = 0; i < count; i++) {
      const layer = Math.random() < 0.3 ? 0 : Math.random() < 0.6 ? 1 : 2;
      particles.push({
        x: Math.random() * w,
        y: Math.random() * h,
        vx: (Math.random() - 0.5) * 0.3 * (layer === 0 ? 0.5 : layer === 1 ? 1 : 1.5),
        vy: (Math.random() - 0.5) * 0.3 * (layer === 0 ? 0.5 : layer === 1 ? 1 : 1.5),
        radius: layer === 0 ? 1.5 : layer === 1 ? 2 : 2.5,
        opacity: layer === 0 ? 0.2 : layer === 1 ? 0.4 : 0.6,
        pulse: Math.random() * Math.PI * 2,
        pulseSpeed: 0.01 + Math.random() * 0.02,
        layer,
      });
    }
    particlesRef.current = particles;
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;

    init();

    const onResize = () => init();
    window.addEventListener("resize", onResize);

    const onMouse = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouseRef.current = { x: e.clientX - rect.left, y: e.clientY - rect.top };
    };
    const onLeave = () => { mouseRef.current = { x: -1000, y: -1000 }; };

    canvas.addEventListener("mousemove", onMouse);
    canvas.addEventListener("mouseleave", onLeave);

    const connectionDist = 150;
    const mouseDist = 200;

    function draw() {
      if (!canvas) return;
      const w = canvas.getBoundingClientRect().width;
      const h = canvas.getBoundingClientRect().height;
      const particles = particlesRef.current;
      const mouse = mouseRef.current;
      frameRef.current++;

      ctx.clearRect(0, 0, w, h);

      // Aurora waves
      const time = frameRef.current * 0.003;
      for (let i = 0; i < 3; i++) {
        ctx.beginPath();
        const yBase = h * (0.3 + i * 0.15);
        const amp = 40 + i * 20;
        const freq = 0.003 + i * 0.001;
        const speed = time * (1 + i * 0.3);

        ctx.moveTo(0, yBase + Math.sin(speed) * amp);
        for (let x = 0; x <= w; x += 4) {
          const y = yBase + Math.sin(x * freq + speed) * amp + Math.sin(x * freq * 2.3 + speed * 1.5) * amp * 0.4;
          ctx.lineTo(x, y);
        }
        ctx.lineTo(w, h);
        ctx.lineTo(0, h);
        ctx.closePath();

        const grad = ctx.createLinearGradient(0, yBase - amp, 0, yBase + amp + 100);
        if (i === 0) {
          grad.addColorStop(0, `rgba(37, 99, 235, ${0.04 + Math.sin(time) * 0.01})`);
          grad.addColorStop(0.5, `rgba(59, 130, 246, ${0.02})`);
          grad.addColorStop(1, "rgba(37, 99, 235, 0)");
        } else if (i === 1) {
          grad.addColorStop(0, `rgba(99, 102, 241, ${0.03 + Math.sin(time * 0.7) * 0.01})`);
          grad.addColorStop(0.5, `rgba(129, 140, 248, ${0.015})`);
          grad.addColorStop(1, "rgba(99, 102, 241, 0)");
        } else {
          grad.addColorStop(0, `rgba(6, 182, 212, ${0.025 + Math.sin(time * 1.3) * 0.01})`);
          grad.addColorStop(0.5, `rgba(34, 211, 238, ${0.01})`);
          grad.addColorStop(1, "rgba(6, 182, 212, 0)");
        }
        ctx.fillStyle = grad;
        ctx.fill();
      }

      // Update & draw particles
      for (const p of particles) {
        p.pulse += p.pulseSpeed;
        const pulseFactor = 1 + Math.sin(p.pulse) * 0.3;

        // Mouse repulsion
        const dx = p.x - mouse.x;
        const dy = p.y - mouse.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < mouseDist && dist > 0) {
          const force = (1 - dist / mouseDist) * 2;
          p.vx += (dx / dist) * force * 0.02;
          p.vy += (dy / dist) * force * 0.02;
        }

        // Damping
        p.vx *= 0.99;
        p.vy *= 0.99;

        p.x += p.vx;
        p.y += p.vy;

        // Wrap
        if (p.x < -10) p.x = w + 10;
        if (p.x > w + 10) p.x = -10;
        if (p.y < -10) p.y = h + 10;
        if (p.y > h + 10) p.y = -10;

        // Draw particle
        const r = p.radius * pulseFactor;
        const alpha = p.opacity * (0.7 + Math.sin(p.pulse) * 0.3);

        ctx.beginPath();
        ctx.arc(p.x, p.y, r, 0, Math.PI * 2);

        // Glow
        if (p.layer === 2) {
          const glow = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, r * 4);
          glow.addColorStop(0, `rgba(59, 130, 246, ${alpha * 0.4})`);
          glow.addColorStop(0.5, `rgba(59, 130, 246, ${alpha * 0.1})`);
          glow.addColorStop(1, "rgba(59, 130, 246, 0)");
          ctx.fillStyle = glow;
          ctx.fill();

          ctx.beginPath();
          ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
        }

        ctx.fillStyle = p.layer === 0
          ? `rgba(147, 197, 253, ${alpha})`
          : p.layer === 1
          ? `rgba(96, 165, 250, ${alpha})`
          : `rgba(59, 130, 246, ${alpha})`;
        ctx.fill();
      }

      // Draw connections
      ctx.lineWidth = 1;
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const a = particles[i];
          const b = particles[j];
          if (a.layer === 0 && b.layer === 0) continue;

          const dx = a.x - b.x;
          const dy = a.y - b.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < connectionDist) {
            const alpha = (1 - dist / connectionDist) * 0.15 * Math.min(a.opacity, b.opacity);

            // Brighter near mouse
            const mx = (a.x + b.x) / 2;
            const my = (a.y + b.y) / 2;
            const mDist = Math.sqrt((mx - mouse.x) ** 2 + (my - mouse.y) ** 2);
            const mouseBoost = mDist < mouseDist ? (1 - mDist / mouseDist) * 0.3 : 0;

            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.strokeStyle = `rgba(59, 130, 246, ${alpha + mouseBoost})`;
            ctx.stroke();
          }
        }
      }

      // Mouse glow
      if (mouse.x > 0 && mouse.y > 0) {
        const grad = ctx.createRadialGradient(mouse.x, mouse.y, 0, mouse.x, mouse.y, 180);
        grad.addColorStop(0, "rgba(37, 99, 235, 0.06)");
        grad.addColorStop(0.3, "rgba(59, 130, 246, 0.03)");
        grad.addColorStop(1, "rgba(37, 99, 235, 0)");
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(mouse.x, mouse.y, 180, 0, Math.PI * 2);
        ctx.fill();
      }

      rafRef.current = requestAnimationFrame(draw);
    }

    rafRef.current = requestAnimationFrame(draw);

    return () => {
      window.removeEventListener("resize", onResize);
      canvas.removeEventListener("mousemove", onMouse);
      canvas.removeEventListener("mouseleave", onLeave);
      cancelAnimationFrame(rafRef.current);
    };
  }, [init]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-auto"
      style={{ zIndex: 1 }}
    />
  );
}

export function HeroGrid() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none" style={{ zIndex: 0 }}>
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(37,99,235,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(37,99,235,0.3) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
          maskImage: "radial-gradient(ellipse 70% 60% at 50% 40%, black 30%, transparent 70%)",
          WebkitMaskImage: "radial-gradient(ellipse 70% 60% at 50% 40%, black 30%, transparent 70%)",
        }}
      />
    </div>
  );
}

export function HeroBlobs() {
  const blob1Ref = useRef<HTMLDivElement>(null);
  const blob2Ref = useRef<HTMLDivElement>(null);
  const blob3Ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const blobs = [blob1Ref, blob2Ref, blob3Ref];

    blobs.forEach((ref, i) => {
      if (!ref.current) return;
      const duration = 12 + i * 4;
      gsap.to(ref.current, {
        x: `+=${30 + i * 20}`,
        y: `+=${20 + i * 15}`,
        duration,
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut",
        delay: i * 2,
      });
      gsap.to(ref.current, {
        scale: 1.1 + i * 0.05,
        rotation: i * 30,
        duration: duration * 0.8,
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut",
        delay: i * 1.5,
      });
    });

    return () => {
      blobs.forEach((ref) => {
        if (ref.current) gsap.killTweensOf(ref.current);
      });
    };
  }, []);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none" style={{ zIndex: 0 }}>
      <div
        ref={blob1Ref}
        className="absolute -top-32 -left-32 w-[500px] h-[500px] rounded-full will-change-transform"
        style={{
          background: "radial-gradient(circle, rgba(37,99,235,0.12) 0%, rgba(37,99,235,0.04) 40%, transparent 70%)",
          filter: "blur(40px)",
        }}
      />
      <div
        ref={blob2Ref}
        className="absolute top-1/3 -right-24 w-[400px] h-[400px] rounded-full will-change-transform"
        style={{
          background: "radial-gradient(circle, rgba(99,102,241,0.1) 0%, rgba(99,102,241,0.03) 40%, transparent 70%)",
          filter: "blur(50px)",
        }}
      />
      <div
        ref={blob3Ref}
        className="absolute -bottom-24 left-1/3 w-[450px] h-[450px] rounded-full will-change-transform"
        style={{
          background: "radial-gradient(circle, rgba(6,182,212,0.08) 0%, rgba(6,182,212,0.02) 40%, transparent 70%)",
          filter: "blur(45px)",
        }}
      />
    </div>
  );
}

export function HeroVignette() {
  return (
    <div
      className="absolute inset-0 pointer-events-none"
      style={{
        zIndex: 2,
        background: [
          "radial-gradient(ellipse 80% 60% at 50% 45%, transparent 40%, rgba(255,255,255,0.5) 100%)",
          "linear-gradient(to bottom, transparent 60%, white 100%)",
        ].join(", "),
      }}
    />
  );
}
