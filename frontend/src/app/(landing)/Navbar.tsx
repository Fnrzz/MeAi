"use client";

import { ConnectButton } from "@mysten/dapp-kit";
import { useCurrentAccount } from "@mysten/dapp-kit";
import { useState, useEffect } from "react";
import { Menu, X, LayoutDashboard } from "lucide-react";

export default function Navbar() {
  const account = useCurrentAccount();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        scrolled
          ? "glass-strong border-b border-gray-200/50 shadow-sm"
          : "bg-white/80 backdrop-blur-lg border-b border-gray-200"
      }`}
    >
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        <a href="/" className="flex items-center gap-2.5 group">
          <img src="/logo.png" alt="MeAi" className="h-7 w-auto transition-transform duration-300 group-hover:scale-110" />
          <span className="text-lg font-bold text-gray-900">MeAi</span>
        </a>

        <div className="hidden md:flex items-center gap-8">
          <a href="/" className="relative text-sm text-gray-500 hover:text-blue-600 transition-colors font-medium after:absolute after:bottom-[-2px] after:left-0 after:w-0 after:h-[2px] after:bg-blue-500 after:transition-all after:duration-300 hover:after:w-full">
            Home
          </a>
          <a href="/#features" className="relative text-sm text-gray-500 hover:text-blue-600 transition-colors font-medium">
            Features
          </a>
          <a href="/#models" className="relative text-sm text-gray-500 hover:text-blue-600 transition-colors font-medium">
            Models
          </a>
          {account && (
            <a
              href="/dashboard"
              className="flex items-center gap-1.5 text-sm font-medium text-blue-600 bg-blue-50 px-4 py-1.5 rounded-full hover:bg-blue-100 transition-colors"
            >
              <LayoutDashboard className="w-3.5 h-3.5" />
              Dashboard
            </a>
          )}
        </div>

        <div className="flex items-center gap-3">
          <ConnectButton />
          <button className="md:hidden text-gray-600" onClick={() => setOpen(!open)}>
            {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {open && (
        <div className="md:hidden border-t border-gray-100 glass-strong px-6 py-4 space-y-3">
          <a href="/" className="block text-sm text-gray-700 font-medium" onClick={() => setOpen(false)}>Home</a>
          <a href="/#features" className="block text-sm text-gray-700 font-medium" onClick={() => setOpen(false)}>Features</a>
          <a href="/#models" className="block text-sm text-gray-700 font-medium" onClick={() => setOpen(false)}>Models</a>
          {account && (
            <a href="/dashboard" className="block text-sm text-blue-600 font-medium" onClick={() => setOpen(false)}>
              Dashboard →
            </a>
          )}
        </div>
      )}
    </nav>
  );
}
