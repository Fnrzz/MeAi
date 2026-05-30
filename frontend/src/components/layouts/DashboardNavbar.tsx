"use client";

import { ConnectButton } from "@mysten/dapp-kit";
import { useCurrentAccount } from "@mysten/dapp-kit";
import { useState, useEffect } from "react";
import { Menu, X, Home, Key, Play, FileText, ShieldCheck, Bot } from "lucide-react";
import { usePathname } from "next/navigation";

const links = [
  { href: "/dashboard", label: "Dashboard", icon: Home },
  { href: "/agents", label: "Agents", icon: Bot },
  { href: "/api-keys", label: "API Keys", icon: Key },
  { href: "/playground", label: "Playground", icon: Play },
  { href: "/docs", label: "Docs", icon: FileText },
  { href: "/admin", label: "Admin", icon: ShieldCheck },
];

export default function DashboardNavbar() {
  const account = useCurrentAccount();
  const pathname = usePathname();
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

        <div className="hidden md:flex items-center gap-1">
          {links.map((l) => {
            const Icon = l.icon;
            const isActive = pathname === l.href || pathname.startsWith(l.href + "/");
            return (
              <a
                key={l.href}
                href={l.href}
                className={`flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-full transition-colors ${
                  isActive
                    ? "bg-blue-50 text-blue-600"
                    : "text-gray-500 hover:text-blue-600 hover:bg-gray-50"
                }`}
              >
                <Icon className="w-4 h-4" />
                {l.label}
              </a>
            );
          })}
        </div>

        <div className="flex items-center gap-3">
          {account && (
            <span className="hidden sm:block text-xs text-gray-400 font-mono truncate max-w-[120px]">
              {account.address.slice(0, 6)}...{account.address.slice(-4)}
            </span>
          )}
          <ConnectButton />
          <button className="md:hidden text-gray-600" onClick={() => setOpen(!open)}>
            {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {open && (
        <div className="md:hidden border-t border-gray-100 glass-strong px-6 py-4 space-y-3">
          {links.map((l) => {
            const Icon = l.icon;
            return (
              <a key={l.href} href={l.href} className="flex items-center gap-2 text-sm text-gray-700 font-medium" onClick={() => setOpen(false)}>
                <Icon className="w-4 h-4" />
                {l.label}
              </a>
            );
          })}
        </div>
      )}
    </nav>
  );
}
