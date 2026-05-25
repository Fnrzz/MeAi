<div align="center">

# MeAi

**Payment & Identity Infrastructure for Autonomous AI Agents on Sui**

[![Sui](https://img.shields.io/badge/Sui-Testnet-4DA6FF?style=for-the-badge&logo=data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHZpZXdCb3g9IjAgMCAyMCAyMCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cGF0aCBkPSJNMTAgMEwyMCAxMEwxMCAyMEwwIDEwTDEwIDBaIiBmaWxsPSIjNERBNkZGIi8+PC9zdmc+)](https://explorer.sui.io/)
[![Move](https://img.shields.io/badge/Move-2024_Edition-1A6FFF?style=for-the-badge)](https://move-book.com/)
[![License](https://img.shields.io/badge/License-MIT-020A18?style=for-the-badge)](LICENSE)

[🌐 Live Demo](#) · [📖 Documentation](#) · [🎬 Demo Video](#) · [💬 Discord](#)

---

</div>

## The Problem

AI agents can't pay for anything on their own.

Today, accessing LLM APIs requires:
- **Credit cards** and Web2 identity — impossible for autonomous agents
- **Static API key strings** — leakable, stealable, non-programmable
- **Centralized billing** — no transparency, no auditability
- **Vendor lock-in** — no portability between providers

The Agentic Web needs payment infrastructure that is **native, autonomous, and verifiable**.

## The Solution

**MeAi is the decentralized payment layer for AI inference on Sui.**

| Primitive | What It Does |
|-----------|-------------|
| **Capability Objects** | API keys as ownable Sui objects — transfer, delegate, revoke on-chain |
| **PTB Settlement** | Batch payment via Programmable Transaction Blocks — atomic, cheap, verifiable |
| **Walrus Audit Trail** | Every inference logged immutably on Walrus decentralized storage |
| **SpendCaps** | Delegate daily spending limits to AI agents with on-chain guardrails |
| **OpenAI-Compatible** | Drop-in replacement for OpenAI SDK — just change `base_url` |

```
No credit cards. No API strings. No gatekeepers.
Pay per token with SUI. Verify every inference on-chain.
```

---

## Architecture

```
┌──────────────────────────────────────────────────────────────────┐
│                        Frontend (Next.js)                        │
│   Dashboard · API Keys · Playground · Docs · Admin              │
│   @mysten/dapp-kit · GSAP · Three.js · Tailwind                 │
└──────────┬───────────────────────────────────┬───────────────────┘
           │                                   │
    ┌──────▼──────┐                    ┌────────▼────────┐
    │   Gateway    │                    │   Sui RPC      │
    │   (Hono)     │                    │   (Testnet)    │
    │              │                    │                 │
    │ • Auth       │                    │ • Read objects │
    │ • LLM Route  │◄──────────────────┤ • PTB submit   │
    │ • Settle     │                    │ • Events       │
    │ • Walrus Log │                    └────────────────┘
    └──────┬──────┘
           │                ┌─────────────────────────────┐
    ┌──────▼──────┐        │    Sui Move Contracts        │
    │   Walrus     │        │                              │
    │   (Storage)  │        │  ┌───────────────────────┐  │
    │              │        │  │ access_module          │  │
    │ • Inference  │        │  │  → ApiCapObject       │  │
    │   logs      │        │  │  → ApiKeyRegistry     │  │
    │ • Immutable  │        │  ├───────────────────────┤  │
    │ • Verifiable │        │  │ payment_module        │  │
    └──────────────┘        │  │  → Treasury           │  │
                            │  │  → RevenueConfig      │  │
                            │  ├───────────────────────┤  │
                            │  │ quota_module           │  │
                            │  │  → QuotaObject        │  │
                            │  │  → SpendCapObject     │  │
                            │  ├───────────────────────┤  │
                            │  │ registry_module        │  │
                            │  │  → ModelRegistry      │  │
                            │  │  → ModelInfo          │  │
                            │  └───────────────────────┘  │
                            └─────────────────────────────┘
```

---

## Smart Contracts

**Package ID:** `0xef9ef5c62c35d57fc9655459a409e37cec26a40b927f5ebcadcb3988a7e90f80` (Sui Testnet)

### `access_module` — Capability-Based Access Control

```move
public struct ApiCapObject has key, store {
    id: UID,
    owner: address,
    tier: u8,
    allowed_models: VecMap<String, bool>,
    active: bool,
}
```
- API keys are **Sui objects** — ownable, transferable, revocable
- Each key scopes which models the holder can access
- Owner or admin can deactivate at any time

### `payment_module` — Treasury & Revenue Splits

```move
public struct Treasury has key {
    id: UID,
    balance: Balance<SUI>,
}
```
- Shared treasury object holds deposited SUI
- `RevenueConfig` defines provider fee splits
- All deposits and withdrawals are on-chain events

### `quota_module` — Usage Tracking & Agent SpendCaps

```move
public struct SpendCapObject has key, store {
    id: UID,
    owner: address,
    agent: address,
    spend_cap_per_day: u64,
    spent_today: u64,
    current_epoch: u64,
}
```
- `QuotaObject` tracks per-user token usage with daily limits
- `SpendCapObject` lets owners delegate budget to AI agents
- Epoch-based daily reset — agents self-manage within bounds

### `registry_module` — On-Chain Model Catalog

```move
public struct ModelInfo has copy, drop, store {
    provider: String,
    model_id: String,
    input_price_per_1k: u64,
    output_price_per_1k: u64,
    active: bool,
}
```
- Pricing is on-chain and verifiable
- Admin can add/update models with on-chain events
- Gateway reads registry dynamically via RPC

### Tests

```
15 unit tests covering all modules + full integration flow test
```

---

## Gateway Server

Built with **Hono** framework. OpenAI-compatible API.

```bash
# Call any LLM — just change base_url
curl -X POST https://gateway.meai.io/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "X-Sui-Object-Id: <your-api-cap-object-id>" \
  -H "X-Sui-Signature: <wallet-signature>" \
  -H "X-Sui-Timestamp: <unix-ms>" \
  -d '{
    "model": "claude-sonnet-4",
    "messages": [{"role": "user", "content": "Hello"}],
    "stream": true
  }'
```

**Key features:**
- **Sui wallet authentication** via object ID + signature + timestamp
- **Multi-provider LLM routing** — Claude 4, GPT-4o, Gemini Flash, Llama 3, Mistral
- **Streaming support** (SSE) for chat completions
- **Batch PTB settlement** — aggregates usage every 60 seconds into a single atomic transaction
- **Walrus audit logging** — every inference request stored as immutable blob

---

## Frontend

Production-grade Next.js app with immersive 3D visuals and GSAP animations.

| Page | Purpose |
|------|---------|
| **Home** | Hero with 3D network scene, feature cards with perspective animations, model marketplace with orbital rings 3D, how-it-works timeline, Why Sui section |
| **Dashboard** | Wallet balance, treasury deposits, API key overview |
| **API Keys** | Mint, view, and revoke `ApiCapObject` capability objects |
| **Playground** | Interactive LLM chat — select model, sign with wallet, stream responses |
| **Docs** | Integration guides for Python, TypeScript, and Agent A2A protocol |
| **Admin** | Register models on-chain (admin-only) |

### Visual Highlights

- **HeroScene3D** — 64-node network graph with edges, particles, and mouse-reactive rotation
- **ModelScene3D** — Wireframe icosahedron core with 3 orbital rings, 48 orbiting spheres, 600 particle field, 6 light beams
- **WhySuiScene3D** — Wireframe dodecahedron with 64 floating hexagonal tiles, 800 orbital stream particles, 8 silk curves
- **GSAP Animations** — 3D perspective card entrance, icon spin-in, shine sweep on hover, sequenced timeline for process steps
- **Glassmorphism Cards** — Ultra-transparent glass-effect cards over 3D backgrounds
- **CTA Photo Slideshow** — 15 high-res team/coding photos with crossfade transitions

---

## Supported Models

| Model | Provider | Input (per 1K) | Output (per 1K) | Tag |
|-------|----------|----------------|------------------|-----|
| Claude Sonnet 4 | Anthropic | ~0.8 SUI | ~4 SUI | Best overall |
| GPT-4o | OpenAI | ~0.6 SUI | ~2.5 SUI | Multimodal |
| GPT-4o Mini | OpenAI | ~0.15 SUI | ~0.6 SUI | Efficient |
| Gemini 2.0 Flash | Google | ~0.05 SUI | ~0.2 SUI | Fastest |
| Llama 3 70B | Atoma | ~0.1 SUI | ~0.1 SUI | Open source |
| Mistral Large | Mistral | ~0.2 SUI | ~0.6 SUI | Reasoning |

---

## Quick Start

### Prerequisites
- [Sui CLI](https://docs.sui.io/guides/developer/getting-started) installed
- Node.js 20+
- A Sui wallet (Suiet, Ethos, or Slush)

### Deploy Contracts

```bash
# Build
sui move build

# Test
sui move test

# Publish to testnet
sui client publish --gas-budget 100000000
```

### Run Gateway

```bash
cd gateway
cp .env.example .env
# Edit .env with your keys
npm install
npm run dev
```

### Run Frontend

```bash
cd frontend
npm install
npm run dev
```

Open `http://localhost:3000` and connect your Sui wallet.

---

## Quick Integration

### Python (OpenAI SDK)

```python
from openai import OpenAI

client = OpenAI(
    base_url="https://gateway.meai.io/v1",
    api_key="unused",  # Auth via Sui wallet headers
    default_headers={
        "X-Sui-Object-Id": "0xYourApiCapObjectId",
        "X-Sui-Signature": "base64-encoded-signature",
        "X-Sui-Timestamp": "1717000000000",
    }
)

response = client.chat.completions.create(
    model="claude-sonnet-4",
    messages=[{"role": "user", "content": "Explain Move modules"}],
    stream=True,
)

for chunk in response:
    print(chunk.choices[0].delta.content or "", end="")
```

### TypeScript (OpenAI SDK)

```typescript
import OpenAI from "openai";

const client = new OpenAI({
  baseURL: "https://gateway.meai.io/v1",
  apiKey: "unused",
  defaultHeaders: {
    "X-Sui-Object-Id": "0xYourApiCapObjectId",
    "X-Sui-Signature": "base64-encoded-signature",
    "X-Sui-Timestamp": "1717000000000",
  },
});

const stream = await client.chat.completions.create({
  model: "gpt-4o",
  messages: [{ role: "user", content: "Write a Move module" }],
  stream: true,
});

for await (const chunk of stream) {
  process.stdout.write(chunk.choices[0]?.delta?.content || "");
}
```

---

## Project Structure

```
meai/
├── sources/                          # Sui Move smart contracts
│   ├── access_module.move            # API key capability objects
│   ├── payment_module.move           # Treasury & revenue splits
│   ├── quota_module.move             # Usage tracking & SpendCaps
│   ├── registry_module.move          # On-chain model catalog
│   └── meai_tests.move               # 15 unit + integration tests
├── gateway/                          # Hono API gateway
│   └── src/
│       ├── index.ts                  # Server & routes
│       ├── auth.ts                   # Sui wallet authentication
│       ├── llm/router.ts             # Multi-provider LLM routing
│       ├── settlement.ts             # PTB batch settlement loop
│       ├── walrus.ts                 # Walrus audit logging
│       └── sui.ts                   # Sui RPC interactions
├── frontend/                         # Next.js app
│   └── src/
│       ├── app/                      # Pages (home, dashboard, docs, etc.)
│       ├── components/
│       │   ├── animations/           # 3D scenes, GSAP effects, slideshow
│       │   ├── layouts/             # Navbar, Footer
│       │   └── ui/                  # Button, Toast
│       └── lib/                      # Contract, gateway, Walrus helpers
├── Move.toml                         # Package manifest
├── Published.toml                    # Deployed package metadata
└── PLAN.md                           # Hackathon strategy
```

---

## Why Sui?

MeAi is **only possible on Sui**. Here's why:

| Sui Primitive | MeAi Usage | Why EVM Can't |
|--------------|-----------|---------------|
| **Capability Objects** | API keys as ownable objects — transfer, delegate, revoke on-chain | EVM is account-based — no native object ownership |
| **Programmable Transaction Blocks** | Batch 1000+ `deduct` calls in a single atomic transaction | EVM requires separate transactions or complex batching contracts |
| **Walrus Storage** | Immutable inference logs — every request verifiable forever | No native decentralized blob storage on EVM chains |
| **Object-Centric Model** | Every entity (treasury, key, quota, spend cap) is a composable object | EVM uses flat storage — no object composition |
| **Fast Finality** | Settlement in seconds, not minutes | EVM chains have slower confirmation times |

---

## Hackathon Tracks

### Sui Overflow 2026 — Walrus Track ($70K)
- Deep Walrus integration for audit logging
- PTB settlement demonstrating Sui's unique capabilities
- Object-centric architecture leveraging Sui's native primitives

### Tatum x Walrus Hackathon ($2K)
- Walrus storage for immutable inference audit trail
- Full Sui integration with capability-based access control

---

## Stats

| Metric | Value |
|--------|-------|
| Move Modules | 4 |
| Unit Tests | 15 |
| LLM Models | 6 |
| PTB Settlement | 60s |
| Contract Package | [Testnet](https://suiexplorer.com/object/0xef9ef5c62c35d57fc9655459a409e37cec26a40b927f5ebcadcb3988a7e90f80?network=testnet) |

---

## License

MIT

---

<div align="center">

**Built for the Agentic Web. Powered by Sui.**

[⬆ Back to Top](#meai)

</div>
