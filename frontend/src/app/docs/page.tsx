"use client";

import { Code2, Key, Coins, Bot, FileText, Cpu, Shield, ArrowRight, Wallet, Globe } from "lucide-react";
import { PACKAGE_ID } from "@/lib/contract";
import { Button } from "@/components/ui/button";
import { FadeInUp } from "@/components/animations/Parallax";

const CODE_AUTH = [
  '// 1. Sign a message with your wallet',
  'const message = new TextEncoder().encode("meai-" + Math.floor(Date.now() / 1000));',
  'const { signature } = await signPersonalMessage({ message });',
  '',
  '// 2. Call the API',
  'const response = await fetch("https://api.meai.xyz/v1/chat/completions", {',
  '  method: "POST",',
  '  headers: {',
  '    "Content-Type": "application/json",',
  '    "X-Sui-Object-Id": "0xabc...",',
  '    "X-Sui-Signature": signature,',
  '    "X-Sui-Timestamp": Math.floor(Date.now() / 1000).toString(),',
  '  },',
  '  body: JSON.stringify({',
  '    model: "claude-sonnet-4",',
  '    messages: [{ role: "user", content: "Hello!" }],',
  '    stream: true,',
  '  }),',
  '});',
].join("\n");

const CODE_PAYMENT = [
  'import { Transaction } from "@mysten/sui/transactions";',
  '',
  '// Deposit SUI to your MeAi treasury',
  'const tx = new Transaction();',
  'const [coin] = tx.splitCoins(tx.gas, [tx.pure.u64(amount * 1_000_000_000)]);',
  'tx.moveCall({',
  '  target: PACKAGE_ID + "::payment_module::deposit",',
  '  arguments: [tx.object(TREASURY_ID), coin, tx.object("0x6")],',
  '});',
  'const { digest } = await signAndExecute({ transaction: tx });',
].join("\n");

const CODE_PYTHON = [
  'from openai import OpenAI',
  'import time',
  '',
  'client = OpenAI(',
  '    base_url="https://api.meai.xyz/v1",',
  '    api_key="dummy",  # not used for auth',
  '    default_headers={',
  '        "X-Sui-Object-Id": "0xabc...",',
  '        "X-Sui-Signature": signature,',
  '        "X-Sui-Timestamp": str(int(time.time())),',
  '    }',
  ')',
  '',
  'response = client.chat.completions.create(',
  '    model="claude-sonnet-4",',
  '    messages=[{"role": "user", "content": "Hello!"}],',
  '    stream=True,',
  ')',
  'for chunk in response:',
  '    print(chunk.choices[0].delta.content, end="")',
].join("\n");

const CODE_JS = [
  'import OpenAI from "openai";',
  '',
  'const client = new OpenAI({',
  '    baseURL: "https://api.meai.xyz/v1",',
  '    apiKey: "dummy",',
  '    defaultHeaders: {',
  '        "X-Sui-Object-Id": process.env.MEAI_CAP_ID!,',
  '        "X-Sui-Signature": signature,',
  '        "X-Sui-Timestamp": Date.now().toString(),',
  '    },',
  '});',
  '',
  'const stream = await client.chat.completions.create({',
  '    model: "claude-sonnet-4",',
  '    messages: [{ role: "user", content: "Tell me about Sui" }],',
  '    stream: true,',
  '});',
  'for await (const chunk of stream) {',
  '    process.stdout.write(chunk.choices[0]?.delta?.content || "");',
  '}',
].join("\n");

const CODE_A2A = [
  '// Autonomous agent flow in one PTB',
  'const tx = new Transaction();',
  '',
  '// 1. Top up quota (agent uses its own SUI)',
  'const [payment] = tx.splitCoins(tx.gas, [tx.pure.u64(amount)]);',
  'tx.moveCall({',
  '  target: PACKAGE_ID + "::quota_module::topup",',
  '  arguments: [tx.object(QUOTA_ID), payment, tx.pure.u64(RATE), tx.object("0x6")],',
  '});',
  '',
  '// 2. Call LLM via MeAi gateway (HTTP call, not PTB)',
  '// Agent sends signed request with its ApiCapObject',
  '',
  '// 3. Settlement is batched every 60s via PTB',
  '// All usage is automatically deducted',
].join("\n");

function CodeBlock({ code }: { code: string }) {
  return (
    <pre className="p-4 rounded-lg bg-gray-900 text-gray-100 text-sm overflow-x-auto">
      <code>{code}</code>
    </pre>
  );
}

export default function DocsPage() {
  return (
    <div className="max-w-4xl mx-auto px-6 py-12">
      <FadeInUp>
        <div className="mb-10">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Documentation</h1>
          <p className="text-gray-500 mb-6">
            MeAi is a decentralized AI agent payment infrastructure on Sui. Pay for LLM inference
            with SUI tokens — no credit cards, no sign-ups, no vendor lock-in.
          </p>
          <div className="flex items-center gap-3 flex-wrap">
            <a href="/playground">
              <Button className="bg-blue-600 hover:bg-blue-700 text-white gap-2">
                Try Playground <ArrowRight className="w-4 h-4" />
              </Button>
            </a>
            <a href="/api-keys">
              <Button variant="outline" className="border-gray-300 gap-2">
                <Key className="w-4 h-4" />
                Get API Key
              </Button>
            </a>
          </div>
        </div>

        {/* How it Works */}
        <div className="p-6 rounded-xl border border-blue-100 bg-blue-50 mb-10">
          <h2 className="font-semibold text-gray-900 mb-3">How It Works</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
            {[
              { step: "1", icon: Wallet, title: "Connect Wallet", desc: "Connect any Sui wallet (Suiet, Martian, etc.)" },
              { step: "2", icon: Coins, title: "Deposit SUI", desc: "Deposit SUI tokens to your MeAi treasury balance" },
              { step: "3", icon: Key, title: "Mint API Key", desc: "Mint a Capability Object — your API key is an NFT" },
              { step: "4", icon: Bot, title: "Call LLMs", desc: "Use OpenAI-compatible API with Sui auth headers" },
            ].map((item) => (
              <div key={item.step} className="text-center p-3">
                <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center mx-auto mb-2 font-bold text-sm">
                  {item.step}
                </div>
                <div className="w-8 h-0.5 bg-blue-200 mx-auto mb-2 hidden md:block" />
                <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center mx-auto mb-2">
                  <item.icon className="w-4 h-4 text-blue-600" />
                </div>
                <p className="font-medium text-gray-900 text-xs">{item.title}</p>
                <p className="text-gray-500 text-xs mt-0.5">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Why Sui */}
        <div className="p-6 rounded-xl border border-gray-200 bg-white mb-10">
          <div className="flex items-center gap-3 mb-3">
            <Shield className="w-5 h-5 text-blue-600" />
            <h2 className="font-semibold text-gray-900">Why Sui?</h2>
          </div>
          <p className="text-sm text-gray-600 leading-relaxed mb-4">
            MeAi is built on Sui because Sui&apos;s object-centric architecture enables API keys as
            <strong> Capability Objects</strong> — transferable, programmable, and ownable.
            Programmable Transaction Blocks (<strong>PTB</strong>) allow batch settlement with
            atomic execution. <strong>Walrus</strong> provides verifiable, immutable audit trails
            for every inference request.
          </p>
          <div className="grid grid-cols-3 gap-4 text-center text-xs">
            <div className="p-3 rounded-lg bg-gray-50">
              <p className="font-bold text-gray-900">Capability Objects</p>
              <p className="text-gray-500 mt-1">API keys as Sui objects</p>
            </div>
            <div className="p-3 rounded-lg bg-gray-50">
              <p className="font-bold text-gray-900">PTB Settlement</p>
              <p className="text-gray-500 mt-1">Batch, atomic, efficient</p>
            </div>
            <div className="p-3 rounded-lg bg-gray-50">
              <p className="font-bold text-gray-900">Walrus Audit</p>
              <p className="text-gray-500 mt-1">Immutable, verifiable logs</p>
            </div>
          </div>
        </div>

        {/* Auth */}
        <div className="p-6 rounded-xl border border-gray-200 bg-white mb-6">
          <div className="flex items-center gap-3 mb-3">
            <Key className="w-5 h-5 text-blue-600" />
            <h2 className="font-semibold text-gray-900">Authentication</h2>
          </div>
          <p className="text-sm text-gray-600 mb-4">
            Your <strong>API Key is a Sui Capability Object</strong> (ApiCapObject). No API key
            strings, no JWTs, no Web2 auth. You prove ownership by signing a timestamp with your
            Sui wallet.
          </p>
          <div className="mb-4 p-4 rounded-lg bg-amber-50 border border-amber-200 text-sm text-amber-700">
            <p className="font-medium mb-1">Required Headers</p>
            <code className="text-xs">
              X-Sui-Object-Id: &lt;your-api-cap-object-id&gt;<br />
              X-Sui-Signature: &lt;wallet-signature&gt;<br />
              X-Sui-Timestamp: &lt;unix-timestamp&gt;
            </code>
          </div>
          <CodeBlock code={CODE_AUTH} />
        </div>

        {/* Payment */}
        <div className="p-6 rounded-xl border border-gray-200 bg-white mb-6">
          <div className="flex items-center gap-3 mb-3">
            <Coins className="w-5 h-5 text-blue-600" />
            <h2 className="font-semibold text-gray-900">Payment</h2>
          </div>
          <p className="text-sm text-gray-600 mb-4">
            Deposit SUI to the MeAi treasury. Each inference call deducts from your quota.
            Settlement is batched via <strong>Programmable Transaction Blocks</strong> every 60
            seconds for optimal gas efficiency.
          </p>
          <CodeBlock code={CODE_PAYMENT} />
        </div>

        {/* Python SDK */}
        <div className="p-6 rounded-xl border border-gray-200 bg-white mb-6">
          <div className="flex items-center gap-3 mb-3">
            <Bot className="w-5 h-5 text-blue-600" />
            <h2 className="font-semibold text-gray-900">Python SDK</h2>
          </div>
          <p className="text-sm text-gray-600 mb-4">
            Drop-in replacement for OpenAI&apos;s Python SDK. Just change the base URL and add Sui auth
            headers.
          </p>
          <CodeBlock code={CODE_PYTHON} />
        </div>

        {/* JS SDK */}
        <div className="p-6 rounded-xl border border-gray-200 bg-white mb-6">
          <div className="flex items-center gap-3 mb-3">
            <Code2 className="w-5 h-5 text-blue-600" />
            <h2 className="font-semibold text-gray-900">JavaScript / TypeScript SDK</h2>
          </div>
          <p className="text-sm text-gray-600 mb-4">
            Full streaming support via Server-Sent Events. Works with the official OpenAI SDK.
          </p>
          <CodeBlock code={CODE_JS} />
        </div>

        {/* A2A Protocol */}
        <div className="p-6 rounded-xl border border-gray-200 bg-white mb-6">
          <div className="flex items-center gap-3 mb-3">
            <Cpu className="w-5 h-5 text-blue-600" />
            <h2 className="font-semibold text-gray-900">Agent A2A Protocol</h2>
          </div>
          <p className="text-sm text-gray-600 mb-4">
            AI agents can <strong>autonomously manage their own API keys and quota</strong> using
            <strong> SpendCapObjects</strong>. An agent can top-up quota, mint capability objects,
            and call LLMs — all within configurable daily spend limits.
          </p>
          <div className="mb-4 p-4 rounded-lg bg-blue-50 border border-blue-200 text-sm text-blue-700">
            <p className="font-medium mb-1">A2A Flow</p>
            <ol className="list-decimal ml-4 space-y-1 text-xs">
              <li>Agent receives a <strong>SpendCapObject</strong> from its owner</li>
              <li>Agent calls <code>quota_module::topup</code> to fund its quota</li>
              <li>Agent calls the MeAi gateway with its <strong>ApiCapObject</strong></li>
              <li>Gateway verifies the capability and routes to the LLM</li>
              <li>Usage is deducted from quota and logged to Walrus</li>
              <li>Owner can set daily limits, revoke keys at any time</li>
            </ol>
          </div>
          <CodeBlock code={CODE_A2A} />
        </div>

        {/* Endpoints */}
        <div className="p-6 rounded-xl border border-gray-200 bg-white mb-6">
          <div className="flex items-center gap-3 mb-3">
            <Globe className="w-5 h-5 text-blue-600" />
            <h2 className="font-semibold text-gray-900">Available Endpoints</h2>
          </div>
          <div className="space-y-3">
            {[
              { method: "POST", path: "/v1/chat/completions", desc: "Chat completions (streaming)" },
              { method: "POST", path: "/v1/embeddings", desc: "Text embeddings (coming soon)" },
              { method: "GET", path: "/v1/models", desc: "List available models" },
              { method: "GET", path: "/health", desc: "Gateway health check" },
            ].map((ep) => (
              <div key={ep.path} className="flex items-center gap-3 p-3 rounded-lg bg-gray-50">
                <span className={`px-2 py-0.5 rounded text-xs font-mono font-bold ${ep.method === "GET" ? "bg-blue-100 text-blue-700" : "bg-blue-100 text-blue-700"}`}>
                  {ep.method}
                </span>
                <code className="text-sm text-gray-700 flex-1">{ep.path}</code>
                <span className="text-xs text-gray-400">{ep.desc}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Contract Reference */}
        <div className="p-6 rounded-xl border border-gray-200 bg-white">
          <div className="flex items-center gap-3 mb-3">
            <FileText className="w-5 h-5 text-blue-600" />
            <h2 className="font-semibold text-gray-900">Contract Reference</h2>
          </div>
          <div className="text-sm text-gray-600 space-y-2">
            <p><strong>Package ID:</strong> <code className="text-xs bg-gray-100 px-1.5 py-0.5 rounded">{PACKAGE_ID}</code></p>
            <p className="text-xs text-gray-400">All modules are published under this package on Sui Testnet.</p>
          </div>
        </div>
      </FadeInUp>
    </div>
  );
}
