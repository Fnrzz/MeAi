"use client";

import { useRef, useEffect } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useCurrentAccount } from "@mysten/dapp-kit";
import { Button } from "@/components/ui/button";
import { ArrowRight, Shield, Zap, Bot, FileText, Cpu, Wallet, ChevronDown } from "lucide-react";
import { HeroScene3D } from "@/components/animations/HeroScene3D";
import { ModelScene3D } from "@/components/animations/ModelScene3D";
import { WhySuiScene3D } from "@/components/animations/WhySuiScene3D";
import { CtaPhotoSlideshow } from "@/components/animations/CtaPhotoSlideshow";
import { FadeInUp } from "@/components/animations/Parallax";
import { Marquee, MarqueeItem } from "@/components/animations/Marquee";

gsap.registerPlugin(ScrollTrigger);

const features = [
  { icon: Shield, title: "Capability Objects", desc: "API keys are Sui objects — transferable, programmable, revocable. Not just strings." },
  { icon: Zap, title: "PTB Settlement", desc: "Batch settlement via Programmable Transaction Blocks. Atomic, efficient, cheap." },
  { icon: Bot, title: "Autonomous Agents", desc: "AI agents self-manage quota and API keys within SpendCaps. No human needed." },
  { icon: FileText, title: "Walrus Audit Trail", desc: "Every inference logged on Walrus. Immutable, verifiable, decentralized." },
  { icon: Cpu, title: "OpenAI Compatible", desc: "Drop-in replacement for OpenAI SDK. Just change base URL and add Sui headers." },
  { icon: Wallet, title: "Pay with SUI", desc: "Native SUI token payments. No credit cards, no sign-ups, no vendor lock-in." },
];

const models = [
  { name: "Claude Sonnet 4", provider: "Anthropic", input: "~0.8 SUI", output: "~4 SUI", tag: "Best overall" },
  { name: "GPT-4o", provider: "OpenAI", input: "~0.6 SUI", output: "~2.5 SUI", tag: "Multimodal" },
  { name: "Gemini 2.0 Flash", provider: "Google", input: "~0.05 SUI", output: "~0.2 SUI", tag: "Fastest" },
  { name: "Llama 3 70B", provider: "Atoma", input: "~0.1 SUI", output: "~0.1 SUI", tag: "Open source" },
  { name: "Mistral Large", provider: "Mistral", input: "~0.2 SUI", output: "~0.6 SUI", tag: "Reasoning" },
  { name: "GPT-4o Mini", provider: "OpenAI", input: "~0.15 SUI", output: "~0.6 SUI", tag: "Efficient" },
];

const marqueeItems = [
  "Capability Objects", "PTB Settlement", "Walrus Audit", "SpendCaps",
  "OpenAI Compatible", "Sui Native", "Agent Autonomy", "Verifiable Inference",
];

const steps = [
  { num: "01", icon: Wallet, title: "Connect Wallet", desc: "Connect any Sui wallet. Your address is your identity." },
  { num: "02", icon: Shield, title: "Deposit SUI", desc: "Deposit SUI tokens to the shared treasury. On-chain, transparent." },
  { num: "03", icon: Cpu, title: "Mint API Key", desc: "Your API key is a Capability Object — an NFT you own and control." },
  { num: "04", icon: Bot, title: "Call LLMs", desc: "OpenAI-compatible gateway. Sign requests with your wallet." },
];

const stats = [
  { value: "4", label: "Move Modules" },
  { value: "6", label: "LLM Models" },
  { value: "15", label: "Unit Tests" },
  { value: "60s", label: "Settlement" },
];

const whySui = [
  { title: "Capability Objects", desc: "API keys as ownable Sui objects, not static strings" },
  { title: "PTB Settlement", desc: "Atomic batch payment via Programmable Transaction Blocks" },
  { title: "Walrus Audit", desc: "Immutable inference logs on decentralized storage" },
  { title: "Object-Centric", desc: "Every entity is an object — composability by design" },
];

export default function HomePage() {
  const account = useCurrentAccount();
  const featuresRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from(".hero-fade", {
        y: 40, opacity: 0, duration: 1, ease: "power3.out", stagger: 0.12, delay: 0.6,
      });

      gsap.from(".feature-card", {
        rotateX: 25,
        rotateY: -15,
        y: 80,
        opacity: 0,
        scale: 0.85,
        duration: 1,
        stagger: { each: 0.1, from: "random" },
        ease: "expo.out",
        scrollTrigger: { trigger: ".features-grid", start: "top 85%", once: true },
      });

      gsap.from(".feature-icon", {
        scale: 0,
        rotation: -180,
        duration: 0.8,
        stagger: { each: 0.1, from: "random" },
        ease: "back.out(2)",
        scrollTrigger: { trigger: ".features-grid", start: "top 80%", once: true },
      });

      gsap.from(".feature-title", {
        x: -30,
        opacity: 0,
        duration: 0.7,
        stagger: 0.08,
        ease: "power3.out",
        scrollTrigger: { trigger: ".features-grid", start: "top 80%", once: true },
      });

      gsap.from(".feature-desc", {
        x: 30,
        opacity: 0,
        duration: 0.7,
        stagger: 0.08,
        ease: "power3.out",
        scrollTrigger: { trigger: ".features-grid", start: "top 80%", once: true },
      });

      gsap.to(".feature-card", {
        y: -8,
        duration: 3,
        ease: "sine.inOut",
        stagger: { each: 0.4, repeat: -1, yoyo: true },
      });

      const featureCards = document.querySelectorAll(".feature-card");
      featureCards.forEach((card) => {
        card.addEventListener("mouseenter", () => {
          const shine = card.querySelector(".feature-shine") as HTMLElement;
          if (!shine) return;
          gsap.fromTo(shine, { backgroundPosition: "200% 0" }, { backgroundPosition: "-200% 0", duration: 0.8, ease: "power2.out" });
          gsap.to(card, { rotateY: 5, rotateX: -3, duration: 0.4, ease: "power2.out" });
        });
        card.addEventListener("mouseleave", () => {
          gsap.to(card, { rotateY: 0, rotateX: 0, duration: 0.6, ease: "power2.out" });
        });
      });

      gsap.from(".model-card", {
        scale: 0.9, opacity: 0, duration: 0.6, stagger: 0.08, ease: "back.out(1.4)",
        scrollTrigger: { trigger: ".model-card", start: "top 88%", once: true },
      });

      gsap.from(".why-sui-item", {
        y: 40, opacity: 0, duration: 0.6, stagger: 0.12, ease: "power3.out",
        scrollTrigger: { trigger: ".why-sui-grid", start: "top 85%", once: true },
      });

      const timeline = gsap.timeline({
        scrollTrigger: { trigger: ".steps-section", start: "top 75%", once: true },
      });

      timeline
        .from(".step-line", { scaleY: 0, transformOrigin: "top center", duration: 1.2, ease: "power2.inOut" }, 0)
        .from(".step-node", { scale: 0, opacity: 0, duration: 0.6, stagger: 0.25, ease: "back.out(2.5)" }, 0.3)
        .from(".step-card-inner", {
          x: (i: number) => (i % 2 === 0 ? -60 : 60),
          opacity: 0,
          scale: 0.9,
          duration: 0.8,
          stagger: 0.3,
          ease: "expo.out",
        }, 0.5)
        .from(".step-icon-box", { scale: 0, rotation: -90, duration: 0.6, stagger: 0.25, ease: "back.out(3)" }, 0.6)
        .from(".step-num-label", { y: 15, opacity: 0, duration: 0.4, stagger: 0.25, ease: "power3.out" }, 0.7)
        .from(".step-title-text", { y: 20, opacity: 0, duration: 0.5, stagger: 0.25, ease: "power3.out" }, 0.8)
        .from(".step-desc-text", { y: 15, opacity: 0, duration: 0.5, stagger: 0.25, ease: "power3.out" }, 0.9);

      gsap.to(".step-node", {
        boxShadow: "0 0 30px rgba(26,111,255,0.6), 0 0 60px rgba(26,111,255,0.2)",
        duration: 2,
        stagger: { each: 0.5, repeat: -1, yoyo: true },
        ease: "sine.inOut",
      });

      const stepCards = document.querySelectorAll(".step-card-inner");
      stepCards.forEach((card) => {
        card.addEventListener("mouseenter", () => {
          gsap.to(card, { scale: 1.03, y: -4, boxShadow: "0 20px 40px rgba(26,111,255,0.12)", duration: 0.4, ease: "power2.out" });
          const icon = card.querySelector(".step-icon-box");
          if (icon) gsap.to(icon, { rotation: 360, duration: 0.8, ease: "power2.out" });
        });
        card.addEventListener("mouseleave", () => {
          gsap.to(card, { scale: 1, y: 0, boxShadow: "0 0 0 rgba(26,111,255,0)", duration: 0.5, ease: "power2.out" });
        });
      });

      gsap.to(".scroll-chevron", {
        y: 6, duration: 1.2, repeat: -1, yoyo: true, ease: "sine.inOut",
      });
    });

    return () => ctx.revert();
  }, []);

  return (
    <div>
      {/* ═══ HERO ═══ */}
      <section className="relative h-screen min-h-[700px] overflow-hidden flex items-center justify-center" style={{ background: "#020A18" }}>
        <HeroScene3D />

        {/* Dark overlay for text readability */}
        <div className="absolute inset-0 pointer-events-none" style={{
          zIndex: 2,
          background: "radial-gradient(ellipse 70% 50% at 50% 45%, transparent 20%, rgba(2,10,24,0.5) 100%)",
        }} />

        {/* Bottom fade to next section */}
        <div className="absolute bottom-0 left-0 right-0 h-32 pointer-events-none" style={{
          zIndex: 2,
          background: "linear-gradient(to bottom, transparent, #020A18)",
        }} />

        {/* Content */}
        <div className="relative z-10 max-w-5xl mx-auto px-6 text-center w-full">
          {/* Eyebrow */}
          <div className="hero-fade inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-mono mb-8"
            style={{ background: "rgba(26,111,255,0.08)", border: "1px solid rgba(26,111,255,0.25)", color: "#7AB4FF" }}>
            <span className="w-1.5 h-1.5 rounded-full" style={{ background: "#1A6FFF" }} />
            On-Chain AI Payment Infrastructure
          </div>

          {/* Headline */}
          <h1 className="hero-fade text-4xl md:text-6xl lg:text-7xl font-black tracking-tight mb-6" style={{ fontFamily: "var(--font-syne, Syne, system-ui)" }}>
            <span className="block text-white">AI Agents</span>
            <span className="block" style={{
              background: "linear-gradient(135deg, #FFFFFF 0%, #1A6FFF 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}>Pay On-Chain</span>
          </h1>

          {/* Subheadline */}
          <p className="hero-fade text-lg md:text-xl max-w-2xl mx-auto mb-10 leading-relaxed" style={{ color: "rgba(200,222,255,0.7)" }}>
            The decentralized payment layer for AI inference on Sui. Capability Objects for access, PTB for settlement, Walrus for audit. No credit cards, no API strings, no gatekeepers.
          </p>

          {/* CTAs */}
          <div className="hero-fade flex items-center justify-center gap-4 flex-wrap">
            <a href={account ? "/dashboard" : "/docs"}>
              <Button size="lg" className="gap-2 text-white font-semibold text-base px-8 h-12 hover-lift"
                style={{
                  background: "#1A6FFF",
                  boxShadow: "0 0 30px rgba(26,111,255,0.4), 0 0 60px rgba(26,111,255,0.15)",
                }}>
                {account ? "Go to Dashboard" : "Start Building"}
                <ArrowRight className="w-4 h-4" />
              </Button>
            </a>
            <a href="/docs">
              <Button variant="outline" size="lg" className="gap-2 font-mono text-sm px-6 h-12"
                style={{ borderColor: "rgba(26,111,255,0.4)", color: "#7AB4FF", background: "transparent" }}>
                View Docs
              </Button>
            </a>
          </div>

          {/* Stats */}
          <div className="hero-fade flex items-center justify-center gap-8 md:gap-12 mt-14">
            {stats.map((s) => (
              <div key={s.label} className="text-center">
                <p className="text-2xl md:text-3xl font-bold" style={{ color: "#1A6FFF" }}>{s.value}</p>
                <p className="text-xs mt-1" style={{ color: "rgba(200,222,255,0.4)" }}>{s.label}</p>
              </div>
            ))}
          </div>

          </div>

          {/* Scroll indicator */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center gap-1">
          <span className="text-xs font-mono" style={{ color: "rgba(200,222,255,0.3)" }}>scroll</span>
          <ChevronDown className="w-4 h-4 scroll-chevron" style={{ color: "rgba(26,111,255,0.5)" }} />
        </div>
      </section>

      {/* ═══ MARQUEE ═══ */}
      <section className="py-6 border-y" style={{ background: "#020A18", borderColor: "rgba(26,111,255,0.1)" }}>
        <Marquee speed={70} className="opacity-100">
          {marqueeItems.map((item) => (
            <MarqueeItem key={item} className="text-lg md:text-xl font-semibold text-[#5EA2FF]">
              <span className="mx-3 opacity-40">◆</span> {item}
            </MarqueeItem>
          ))}
        </Marquee>
      </section>

      {/* ═══ FEATURES ═══ */}
      <section ref={featuresRef} className="py-24 bg-white">
        <div className="max-w-6xl mx-auto px-6">
          <FadeInUp className="text-center mb-16">
            <p className="text-sm font-semibold uppercase tracking-widest mb-3" style={{ color: "#1A6FFF" }}>Infrastructure</p>
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4 text-balance">Why MeAi?</h2>
            <p className="text-gray-500 max-w-xl mx-auto text-lg">Built on Sui primitives — Capability Objects, PTB, and Walrus — for the Agentic Web.</p>
          </FadeInUp>

          <div className="features-grid grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" style={{ perspective: "1200px" }}>
            {features.map((f) => (
              <div key={f.title} className="feature-card group p-8 rounded-2xl border border-gray-100 bg-white hover:border-blue-200 hover-lift transition-all relative overflow-hidden" style={{ transformStyle: "preserve-3d" }}>
                <div className="absolute inset-0 bg-gradient-to-br from-blue-50/0 to-blue-50/0 group-hover:from-blue-50/50 group-hover:to-transparent transition-all duration-500" />
                <div className="feature-shine absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700" style={{ background: "linear-gradient(105deg, transparent 40%, rgba(26,111,255,0.06) 45%, rgba(26,111,255,0.12) 50%, rgba(26,111,255,0.06) 55%, transparent 60%)", backgroundSize: "200% 100%", animation: "none" }} />
                <div className="relative z-10">
                  <div className="feature-icon w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center mb-5 group-hover:bg-blue-100 transition-colors">
                    <f.icon className="w-6 h-6" style={{ color: "#1A6FFF" }} />
                  </div>
                  <h3 className="feature-title font-semibold text-gray-900 mb-2 text-lg">{f.title}</h3>
                  <p className="feature-desc text-sm text-gray-500 leading-relaxed">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ MODELS ═══ */}
      <section className="py-28 relative overflow-hidden" style={{ background: "#020A18" }}>
        <ModelScene3D />

        <div className="absolute inset-0 pointer-events-none" style={{
          zIndex: 2,
          background: "radial-gradient(ellipse 80% 60% at 50% 50%, transparent 30%, rgba(2,10,24,0.6) 100%)",
        }} />

        <div className="relative z-10 max-w-6xl mx-auto px-6">
          <FadeInUp className="text-center mb-16">
            <p className="text-sm font-semibold uppercase tracking-widest mb-3" style={{ color: "#1A6FFF" }}>Model Marketplace</p>
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-4 text-balance">Pay-per-token with SUI</h2>
            <p className="max-w-xl mx-auto text-lg" style={{ color: "rgba(200,222,255,0.6)" }}>Access top LLMs through one gateway. On-chain pricing, verifiable settlement.</p>
          </FadeInUp>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {models.map((m) => (
              <div key={m.name} className="model-card p-6 rounded-2xl border hover:border-white/30 hover-lift transition-all" style={{ background: "rgba(255,255,255,0.03)", borderColor: "rgba(255,255,255,0.08)", backdropFilter: "blur(8px)", boxShadow: "inset 0 1px 0 rgba(255,255,255,0.06)" }}>
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="font-semibold text-white text-lg">{m.name}</h3>
                    <p className="text-xs mt-0.5" style={{ color: "rgba(200,222,255,0.45)" }}>{m.provider}</p>
                  </div>
                  <span className="px-2.5 py-1 text-xs font-semibold rounded-full" style={{ background: "rgba(0,212,255,0.12)", color: "#00d4ff" }}>{m.tag}</span>
                </div>
                <div className="flex gap-6 text-sm pt-3 border-t" style={{ color: "rgba(200,222,255,0.5)", borderColor: "rgba(255,255,255,0.08)" }}>
                  <span>In: <strong className="text-white">{m.input}</strong></span>
                  <span>Out: <strong className="text-white">{m.output}</strong></span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ HOW IT WORKS ═══ */}
      <section className="py-28 bg-white relative overflow-hidden steps-section">
        <div className="max-w-5xl mx-auto px-6">
          <FadeInUp className="text-center mb-20">
            <p className="text-sm font-semibold uppercase tracking-widest mb-3" style={{ color: "#1A6FFF" }}>Architecture</p>
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4 text-balance">How It Works</h2>
          </FadeInUp>

          <div className="relative">
            <div className="step-line absolute left-1/2 top-0 bottom-0 w-0.5 -translate-x-1/2 hidden lg:block"
              style={{ background: "linear-gradient(to bottom, transparent, #1A6FFF 15%, #1A6FFF 85%, transparent)" }} />
            <div className="space-y-16">
              {steps.map((s, i) => (
                <div key={s.num} className={`step-card flex items-center gap-8 ${i % 2 === 1 ? "lg:flex-row-reverse" : ""}`}>
                  <div className="flex-1">
                    <div className="step-card-inner p-8 rounded-2xl border border-gray-100 bg-white cursor-default" style={{ transition: "border-color 0.3s" }}
                      onMouseEnter={(e) => (e.currentTarget.style.borderColor = "rgba(26,111,255,0.3)")}
                      onMouseLeave={(e) => (e.currentTarget.style.borderColor = "rgba(0,0,0,0.04)")}>
                      <div className="flex items-center gap-4 mb-4">
                        <div className="step-icon-box w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center">
                          <s.icon className="w-6 h-6" style={{ color: "#1A6FFF" }} />
                        </div>
                        <div>
                          <p className="step-num-label text-xs font-bold uppercase tracking-wider" style={{ color: "#1A6FFF" }}>Step {s.num}</p>
                          <h3 className="step-title-text text-xl font-bold text-gray-900">{s.title}</h3>
                        </div>
                      </div>
                      <p className="step-desc-text text-gray-500 leading-relaxed">{s.desc}</p>
                    </div>
                  </div>
                  <div className="step-node hidden lg:flex w-14 h-14 rounded-full items-center justify-center font-bold text-sm shrink-0 z-10"
                    style={{ background: "#1A6FFF", color: "#fff", boxShadow: "0 0 20px rgba(26,111,255,0.3)" }}>
                    {s.num}
                  </div>
                  <div className="flex-1 hidden lg:block" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ═══ WHY SUI ═══ */}
      <section className="py-24 relative overflow-hidden" style={{ background: "#020A18" }}>
        <WhySuiScene3D />

        <div className="absolute inset-0 pointer-events-none" style={{
          zIndex: 2,
          background: "radial-gradient(ellipse 70% 55% at 50% 50%, transparent 25%, rgba(2,10,24,0.5) 100%)",
        }} />

        <div className="relative z-10 max-w-5xl mx-auto px-6">
          <FadeInUp className="text-center mb-16">
            <p className="text-sm font-semibold uppercase tracking-widest mb-3" style={{ color: "#1A6FFF" }}>Why Sui?</p>
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-4 text-balance">Built for the Agentic Web</h2>
            <p className="max-w-xl mx-auto text-lg" style={{ color: "rgba(200,222,255,0.5)" }}>Sui&apos;s object-centric architecture makes MeAi possible. No other chain comes close.</p>
          </FadeInUp>

          <div className="why-sui-grid grid grid-cols-1 md:grid-cols-2 gap-6">
            {whySui.map((w) => (
              <div key={w.title} className="why-sui-item p-8 rounded-2xl border transition-all hover-lift"
                style={{ background: "rgba(255,255,255,0.015)", borderColor: "rgba(255,255,255,0.05)", backdropFilter: "blur(4px)", boxShadow: "inset 0 1px 0 rgba(255,255,255,0.03)" }}>
                <h3 className="text-xl font-bold text-white mb-2">{w.title}</h3>
                <p style={{ color: "rgba(200,222,255,0.5)" }}>{w.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ CTA ═══ */}
      <section className="py-32 relative overflow-hidden">
        <CtaPhotoSlideshow />
        <div className="relative z-10 max-w-3xl mx-auto px-6 text-center">
          <FadeInUp className="cta-section">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4 text-balance">Ready to build on MeAi?</h2>
            <p className="mb-8 max-w-lg mx-auto text-lg font-medium" style={{ color: "#1a3a6a", textShadow: "0 1px 8px rgba(255,255,255,0.6)" }}>Connect your Sui wallet, top up quota, and start calling LLMs with SUI in minutes.</p>
            <a href={account ? "/dashboard" : "/docs"}>
              <Button size="lg" className="text-white font-semibold text-base px-8 h-12 gap-2 hover-lift"
                style={{ background: "#1A6FFF", boxShadow: "0 0 30px rgba(26,111,255,0.3)" }}>
                {account ? "Go to Dashboard" : "Read the Docs"}
                <ArrowRight className="w-4 h-4" />
              </Button>
            </a>
          </FadeInUp>
        </div>
      </section>
    </div>
  );
}
