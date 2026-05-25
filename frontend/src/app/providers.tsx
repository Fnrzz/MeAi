"use client";

import { SuiClientProvider, WalletProvider } from "@mysten/dapp-kit";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState, type ReactNode } from "react";
import "@mysten/dapp-kit/dist/index.css";
import { ToastProvider } from "@/components/ui/toast";

export function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <QueryClientProvider client={queryClient}>
      <SuiClientProvider
        defaultNetwork="testnet"
        networks={{
          testnet: { url: "https://fullnode.testnet.sui.io:443", network: "testnet" },
          mainnet: { url: "https://fullnode.mainnet.sui.io:443", network: "mainnet" },
        }}
      >
        <WalletProvider autoConnect>
          <ToastProvider>{children}</ToastProvider>
        </WalletProvider>
      </SuiClientProvider>
    </QueryClientProvider>
  );
}
