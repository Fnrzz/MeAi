<div align="center">

# 🤖 MeAi

### The Decentralized AI Agent Economy on Sui

**Autonomous Agents · On-Chain Identity · Programmable Payments**

[![Sui](https://img.shields.io/badge/Sui-Testnet-4DA6FF?style=for-the-badge&logo=data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHZpZXdCb3g9IjAgMCAyMCAyMCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cGF0aCBkPSJNMTAgMEwyMCAxMEwxMCAyMEwwIDEwTDEwIDBaIiBmaWxsPSIjNERBNkZGIi8+PC9zdmc+)](https://explorer.sui.io/)
[![Move](https://img.shields.io/badge/Move-2024-1A6FFF?style=for-the-badge)](https://move-book.com/)
[![Next.js](https://img.shields.io/badge/Next.js-16-000000?style=for-the-badge&logo=next.js)](https://nextjs.org)
[![License](https://img.shields.io/badge/License-MIT-020A18?style=for-the-badge)](LICENSE)

---

**AI Agents Can Finally Pay Their Own Way.**

</div>

## 🚀 Vision

The Agentic Web is coming. Thousands of autonomous AI agents will transact, collaborate, and compete — but today they can't even pay for their own API calls.

**MeAi is the payment + identity infrastructure that makes self-sovereign AI agents possible on Sui.**

Every agent gets:

- **🧬 On-Chain Identity** — Registered as a Sui object with budget, permissions, and reputation
- **💰 Autonomous Payments** — Agents choose the cheapest model, call LLMs, and pay in SUI — without human approval
- **🤝 Agent-to-Agent Coordination** — Hire other agents, pay them on completion, dispute if needed
- **🔍 Verifiable Audit Trail** — Every inference logged immutably on Walrus

## ✨ What Makes This a First-Place Entry

| Capability                  | Why It Wins                                                                                 |
| --------------------------- | ------------------------------------------------------------------------------------------- |
| **Autonomous AI Agents**    | Agents that think, choose models, spend budget, and transact on-chain — fully autonomously  |
| **Agent-to-Agent Hiring**   | Smart contract escrow: Agent A hires Agent B, B completes the task, B gets paid. Trustless. |
| **SUI-Native Payments**     | Every LLM call is a signed Sui transaction. No credit cards. No API keys. No middlemen.     |
| **Walrus Audit Logs**       | Every inference is an immutable blob on Walrus. Verifiable forever.                         |
| **Multi-Model via SumoPod** | GPT-4o, Claude, Gemini, DeepSeek, Llama, Mistral — all via one API key through SumoPod      |
| **Production UX**           | 3D scenes, GSAP animations, glassmorphism — a demo judges can _feel_                        |

> _"AI agents on Sui can register identity, manage budgets, pick models, pay for inference, and hire other agents — all without human intervention."_

## 🧠 Autonomous Agent Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         User (via Sui Wallet)                           │
│                                                                         │
│  ┌──────────────┐    ┌──────────────────┐    ┌──────────────────────┐  │
│  │ Create Agent │───▶│ Fund with Budget │───▶│ Chat with Agent       │  │
│  │ (name, prompt,│    │ (SUI tokens)     │    │ (agent picks model,   │  │
│  │  allowed models) │  └──────────────────┘    │  calls LLM, logs,    │  │
│  └──────────────┘                              │  pays on-chain)     │  │
│                                                └──────────┬───────────┘  │
└───────────────────────────────────────────────────────────┼──────────────┘
                                                            │
                                                            ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                    MeAi App (Next.js + API Routes)                      │
│                                                                         │
│  ┌────────────────┐    ┌──────────────────┐    ┌───────────────────┐   │
│  │ Agent Runtime   │───▶│ Model Selector   │───▶│ SumoPod Router    │   │
│  │ (decision engine)│   │ (cheapest allowed)│   │ (all models,      │   │
│  │                  │   │                   │   │  one API key)     │   │
│  └───────┬─────────┘    └──────────────────┘    └────────┬──────────┘   │
│          │                                                │              │
│          ▼                                                ▼              │
│  ┌──────────────────────────────────────────────────────────────────┐   │
│  │                    Sui Blockchain (Testnet)                     │   │
│  │                                                                  │   │
│  │  ┌──────────────┐  ┌──────────────┐  ┌───────────────────────┐  │   │
│  │  │ agent_module  │  │ agent_hire   │  │ quota_module          │  │   │
│  │  │ • Register    │  │ • Create Task│  │ • deduct              │  │   │
│  │  │ • Fund        │  │ • Complete   │  │ • topup              │  │   │
│  │  │ • Deduct      │  │ • Dispute    │  │                       │  │   │
│  │  │ • Deactivate  │  │              │  │                       │  │   │
│  │  └──────────────┘  └──────────────┘  └───────────────────────┘  │   │
│  └──────────────────────────────────────────────────────────────────┘   │
│                                                                         │
│  ┌──────────────────────────────────────────────────────────────────┐   │
│  │                    Walrus Decentralized Storage                  │   │
│  │           (Immutable audit logs for every inference)             │   │
│  └──────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────┘
```

## 📁 Project Structure

```
MeAi/
├── contracts/                        # Sui Move smart contracts
│   ├── Move.toml
│   ├── sources/                      # 6 contract modules
│   │   ├── access_module.move
│   │   ├── agent_module.move
│   │   ├── agent_hire.move
│   │   ├── payment_module.move
│   │   ├── quota_module.move
│   │   └── registry_module.move
│   └── tests/
│       └── meai_tests.move
│
├── frontend/                         # Next.js 16 — frontend + API
│   └── src/
│       ├── app/
│       │   ├── api/                  # Backend API routes
│       │   │   ├── _lib/             # Server-side utilities
│       │   │   │   ├── sumopod.ts    # SumoPod OpenAI-compatible client
│       │   │   │   ├── auth.ts       # Sui wallet verification
│       │   │   │   ├── agents.ts     # Agent runtime & decisions
│       │   │   │   ├── settlement.ts # On-chain settlement
│       │   │   │   ├── walrus.ts     # Walrus audit logs
│       │   │   │   ├── sui.ts        # Sui RPC client
│       │   │   │   └── constants.ts  # Model definitions & config
│       │   │   ├── health/
│       │   │   └── v1/
│       │   │       ├── models/
│       │   │       ├── chat/completions/
│       │   │       └── agents/
│       │   ├── (dashboard)/          # Dashboard pages
│       │   └── (landing)/            # Landing page
│       ├── components/               # UI, layouts, animations
│       └── lib/                      # Client utilities
│
├── docs/                             # Documentation
│   ├── PRD.md
│   ├── SMART_CONTRACTS.md            # Smart contract documentation
│   ├── FRONTEND_ARCHITECTURE.md      # Frontend & Next.js API architecture
│   ├── FEATURES.md                   # Detail of all platform features
│   ├── GIT_WORKFLOW.md               # Git push & pull guidelines
│   └── PLAN.md
├── .gitignore
├── package.json                      # Root monorepo scripts
└── README.md
```

## 🎮 Try It: Agent Autonomy in Action

### 1️⃣ Create an Agent

```bash
curl -X POST http://localhost:3000/api/v1/agents \
  -H "Content-Type: application/json" \
  -H "X-Sui-Owner: 0xYourAddress" \
  -d '{
    "name": "ResearchBot",
    "system_prompt": "You are a research assistant. Answer concisely with citations.",
    "allowed_models": ["gpt-4o-mini", "gemini-2.0-flash", "deepseek-chat"],
    "daily_budget": 50000
  }'
```

### 2️⃣ Watch the Agent Decide & Spend

When you chat with an agent, it autonomously:

1. **Analyzes your message** — estimates token count
2. **Picks the cheapest allowed model** — e.g., DeepSeek ($0.014/1K) over GPT-4o ($0.6/1K)
3. **Calls SumoPod** — streams the response back to you via a single API key
4. **Signs a Sui transaction** — deducts tokens from its budget
5. **Logs to Walrus** — every inference is an immutable blob

```bash
curl -X POST http://localhost:3000/api/v1/agents/<agent-id>/chat \
  -H "Content-Type: application/json" \
  -H "X-Sui-Object-Id: <your-cap-object>" \
  -H "X-Sui-Signature: <wallet-signature>" \
  -H "X-Sui-Timestamp: <unix-ms>" \
  -d '{"messages": [{"role": "user", "content": "Explain recursive neural networks"}]}'
```

The response includes an `agent_decision` SSE event:

```json
data: {"type":"agent_decision","decision":{
  "model":"deepseek-chat",
  "provider":"deepseek",
  "reason":"Cheapest model among 3 allowed options",
  "inputPrice":14,
  "outputPrice":28,
  "estimatedCost":0.0001
}}
```

### 3️⃣ Agents Hire Agents (On-Chain)

Agent A creates a task with SUI escrow → Agent B accepts → B completes → B gets paid. All on-chain.

```move
// Agent A creates a task
agent_hire::create_task(
    &mut registry,
    agent_a_id,
    agent_b_id,
    b"Translate this document to Japanese",
    payment_coin,
    &clock,
    ctx
);

// Agent B completes and gets paid
agent_hire::complete_task(&mut task, agent_b_address, &clock, ctx);
```

## 📦 Smart Contracts

| Module            | Objects                          | Purpose                                                            |
| ----------------- | -------------------------------- | ------------------------------------------------------------------ |
| `access_module`   | `ApiCapObject`, `ApiKeyRegistry` | Capability-based API key system — ownable, transferable, revocable |
| `payment_module`  | `Treasury`, `RevenueConfig`      | SUI deposits, withdrawals, provider revenue splits                 |
| `quota_module`    | `QuotaObject`, `SpendCapObject`  | Per-user token budgets, daily limits, epoch-based reset            |
| `registry_module` | `ModelRegistry`, `ModelInfo`     | On-chain model catalog with verifiable pricing                     |
| `agent_module`    | `Agent`, `AgentRegistry`         | **Agent identity, budget management, deactivation**                |
| `agent_hire`      | `AgentTask`, `TaskRegistry`      | **Agent-to-agent hiring with escrow payment**                      |

**Package:** `0xef9ef5c62c35d57fc9655459a409e37cec26a40b927f5ebcadcb3988a7e90f80` on Sui Testnet

```
sui move test  ──▶  15/15 tests passing
```

## 🌐 Frontend Highlights

The MeAi dashboard is a production-grade Next.js app with:

| Page              | What It Does                         | Wow Factor                                                       |
| ----------------- | ------------------------------------ | ---------------------------------------------------------------- |
| **Home**          | Marketing site with 3D scenes        | 64-node network graph, orbital rings, mouse-reactive             |
| **Dashboard**     | Wallet balance, treasury, API keys   | GSAP value counters, glassmorphism cards                         |
| **Agents** 🆕     | Create & manage autonomous AI agents | Budget bars, model badges, one-click chat                        |
| **Agent Chat** 🆕 | Talk to your autonomous agent        | **Agent Decision panel** — see the model it chose, why, and cost |
| **Playground**    | Manual LLM testing                   | Multi-model via SumoPod, stream responses, wallet auth           |
| **API Keys**      | Mint & revoke capability objects     | On-chain key management via Sui                                  |

## ⚡ Quick Start

```bash
# Build & test Move contracts
cd contracts && sui move build && sui move test

# Start the app (frontend + API in one)
cd frontend
cp .env.example .env.local    # Add your SumoPod API key
npm install
npm run dev                    # → http://localhost:3000
```

Or from root:

```bash
npm run install:all       # Install dependencies
npm run dev               # Start the app
npm run test:contracts    # Run Move tests
```

## 🛠 Why Sui (Not EVM)

| Primitive                  | MeAi Uses                                                    | Why Not EVM                         |
| -------------------------- | ------------------------------------------------------------ | ----------------------------------- |
| **Capability Objects**     | Ownable API keys — transfer, delegate, revoke                | Account-based — no native ownership |
| **Programmable Tx Blocks** | Batch 1000+ deductions in one atomic tx                      | Separate tx per deduction           |
| **Walrus Storage**         | Immutable inference logs forever                             | No native blob storage              |
| **Object-Centric Model**   | Agent objects, task objects, budget objects — all composable | Flat storage, no composition        |
| **Fast Finality**          | Settlement in ~1 second                                      | Minutes of confirmation             |

## 📊 Stats

```
Move Modules     6
Unit Tests      15
LLM Models       8 (via SumoPod)
Frontend         Next.js 16 + React 19 + Three.js + GSAP
Architecture     Unified (frontend + API in one app)
```

## 🏆 Sui Overflow 2026 — Agentic Web Track

MeAi reimagines AI infrastructure from first principles. Not a gateway with web2 auth bolted on — a full agentic economy where:

- **Agents are first-class citizens** on Sui
- **Payments are programmable** transactions
- **Trust is cryptographic**, not administrative
- **Every action is auditable** on Walrus
- **Agents collaborate** via on-chain contracts

---

<div align="center">

**Built for the Agentic Web. Powered by Sui.**

[⬆ Back to Top](#-meai)

</div>
