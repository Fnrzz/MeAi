"use client";

"use client";

import { useCurrentAccount, ConnectButton } from "@mysten/dapp-kit";
import DashboardNavbar from "@/components/layouts/DashboardNavbar";
import Footer from "@/components/layouts/Footer";
import { Wallet } from "lucide-react";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const account = useCurrentAccount();

  if (!account) {
    return (
      <>
        <DashboardNavbar />
        <main className="min-h-screen pt-16">
          <div className="max-w-lg mx-auto px-6 py-24 text-center">
            <div className="p-8 rounded-2xl border border-gray-200 bg-white shadow-sm">
              <Wallet className="w-14 h-14 mx-auto text-gray-200 mb-4" />
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Connect Your Wallet</h2>
              <p className="text-sm text-gray-500 mb-6">
                Connect your Sui wallet to access your dashboard, API keys, and playground.
              </p>
              <div className="flex justify-center">
                <ConnectButton />
              </div>
            </div>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  return (
    <>
      <DashboardNavbar />
      <main className="min-h-screen pt-16">{children}</main>
      <Footer />
    </>
  );
}
