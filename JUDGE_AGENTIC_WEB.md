# MeAi — Sui Overflow 2026 Judge Evaluation (Agentic Web Track)

**Juri:** Professional Developer & Judge — Sui Overflow 2026
**Track:** Agentic Web (Core Track) — $30,000 1st Prize
**Target:** Juara 1

---

## ⚠️ Masalah Paling Kritis: Positioning Salah

MeAi saat ini adalah **infrastructure FOR AI agents** (payment layer, capability objects, audit trail).

Tapi **Agentic Web Track** mencari: *"Build autonomous AI agents that can act, transact, and coordinate using Sui's object model and composability."*

**Yang dinilai juri: AGENT otonom yang bisa ACTION. Bukan infrastrukturnya.**

MeAi harus di-repositioning sebagai:
> **"MeAi Agent — AI Agent otonom yang bisa manage API keys, bayar LLM sendiri, dan audit trail on-chain pakai Sui"**

Bukan lagi "infrastructure layer" tapi "autonomous AI agent" yang menggunakan Sui sebagai otak finansialnya.

---

## Scoring Saat Ini untuk Agentic Web Track

| Kriteria | Bobot | Skor | Sebelum | Catatan |
|----------|-------|------|---------|---------|
| **Real-World Application** | 40% | 30/40 | 15 | ✅ Agent punya on-chain identity, budget, bisa bayar LLM sendiri, hire agent lain via escrow |
| **Agent Autonomy** | 25% | 20/25 | 5 | ✅ Agent pilih model termurah otomatis, sign Sui txn, track budget, decision streaming di UI |
| **Technical Execution** | 15% | 13/15 | 10 | ✅ 6 Move modules, 15 tests, gateway + frontend typecheck clean, agent decision di SSE |
| **Creativity & Innovation** | 10% | 8/10 | 5 | ✅ Autonomous model selection + agent-to-agent hiring dengan escrow — unik di ekosistem Sui |
| **Demo & Presentation** | 10% | 4/10 | 3 | ⚠️ Frontend agent pages sudah jalan, tapi belum deployed ke Vercel, belum ada video |
| **TOTAL** | **100%** | **75/100** | **38** | **Naik 37 poin! Target 90+ masih butuh deployment + video demo** |

---

## Celah Kritis vs Agentic Web Track

### 1. Tidak Ada AI Agent (Critical)
```
Yang ADA sekarang:
User → Manual pilih model → Manual ketik prompt → Wallet sign → Gateway → LLM

Yang DICARI juri:
AI Agent → Terima task → Pilih model sendiri → Sign sendiri → Call LLM → Bayar sendiri → Audit sendiri
```

**Bukti:** Playground (`playground/page.tsx`) adalah chat UI manual. User harus milih model, milih API key, sign message sendiri. Ini **bukan** AI agent.

### 2. Tidak Ada "Act, Transact, Coordinate"
Track ini mencari agent yang:
- **ACT** — Autonomous action, bukan manual trigger
- **TRANSACT** — Agent punya wallet sendiri, bisa bayar
- **COORDINATE** — Agent bisa hire agent lain, negosiasi, kolaborasi

MeAi tidak punya satunya dari 3 hal ini.

### 3. Tidak Ada Agent Wallet / Agent Identity
Agent harus punya identity on-chain (bisa object `AgentIdentity`). MeAi cuma punya `ApiCapObject` untuk human users.

### 4. Tidak Ada Inter-Agent Communication
Tidak ada protokol A2A (Agent-to-Agent). Tidak ada mekanisme agent hire agent.

### 5. Tidak Ada Demo / Video / Deployment
Untuk track ini, demo sangat penting. Juri harus LIAT agent nya jalan.

---

## Roadmap Juara 1 (+52 Poin)

### 🔴 PRIORITAS 1: Create Actual AI Agent (wajib) — Estimated +20 poin

**Apa yang harus dibuat:**
1. **Agent Smart Contract** — `agent_module.move`
```move
public struct Agent has key, store {
    id: UID,
    name: String,
    owner: address,
    system_prompt: String,
    allowed_models: vector<String>,
    spend_cap: u64,
    total_spent: u64,
    is_active: bool,
}
```

2. **Agent Registry** — Semua agent terdaftar on-chain. Bisa query "agent mana yang available untuk hire?"

3. **Agent Wallet Integration** — Setiap agent punya `AgentWallet` object yang bisa:
   - Receive SUI dari owner
   - Pay untuk LLM calls secara autonomous
   - Emit event untuk setiap transaksi

4. **Agent Gateway Endpoint** — Satu endpoint baru di gateway:
```
POST /v1/agents/:id/chat
```
Di sini gateway jadi "otak" agent. Request masuk → agent pilih model sendiri → sign transaction sendiri → call LLM → bayar → audit.

**Implementasi konkret:**
- Tambah file `gateway/src/agents/agent.ts` — Agent runtime
- Agent punya `system_prompt` yang di-set owner. Semua chat dikirim dengan system prompt + riwayat.
- Agent bisa milih model berdasarkan `allowed_models` dan `budget` (pilih cheapest yang capable).
- ✅ **INI YANG AKAN JURI LIHAT**: Agent otonom yang manage pembayarannya sendiri.

### 🔴 PRIORITAS 2: Agent-to-Agent Coordination — Estimated +12 poin

**Apa yang harus dibuat:**
1. **Agent Hiring Contract**
```move
public fun hire_agent(
    hirer: &mut Agent,
    hired: &mut Agent,
    task: String,
    budget: u64,
    ctx: &mut TxContext,
)
```
Agent A bisa hire Agent B untuk task tertentu. Pembayaran otomatis dari A ke B.

2. **Task Marketplace** — Agent bisa post task, agent lain bisa apply.
3. **Escrow Payment** — Task budget di-escrow, release otomatis saat selesai.

**Implementasi konkret:**
- Tambah `agent_hire.move` — Smart contract untuk agent hiring
- Agent A: "I need a research report on Sui DeFi" → Agent B: "I can do that for 50 SUI" → Escrow → Agent B work → Release payment
- ✅ **INI YANG AKAN JURI LIHAT**: Dua agent berkoordinasi dan transaksi di Sui.

### 🔴 PRIORITAS 3: Agent Demo yang Bisa Dilihat Juri — Estimated +10 poin

**Apa yang harus dibuat:**
1. **Agent Dashboard Page** — Di frontend
   - Create agent (name, system prompt, budget)
   - Lihat daftar agent
   - Chat dengan agent (automatic, gateway handles signing)
   - Log transaksi tiap agent

2. **Agent Playground** — Beda dengan playground biasa:
   - "Create Agent" flow
   - Test agent dengan prompt
   - Lihat agent berpikir: "I chose GPT-4o Mini because it's cheapest for this task. Cost: 0.15 SUI. Remaining budget: 49.85 SUI"

3. **Demo Video 5 Menit** — Struktur:
   - 0:00-0:30: Problem — AI agents can't pay for themselves
   - 0:30-1:30: Create agent on MeAi dashboard
   - 1:30-3:00: Live demo — agent receives task, autonomously picks model, signs txn, pays, responds
   - 3:00-4:00: Agent coordination — Agent A hires Agent B via smart contract
   - 4:00-4:30: Audit trail — All transactions on Walrus + Sui Explorer
   - 4:30-5:00: Roadmap + Why Sui

### 🟡 PRIORITAS 4: Real-World Agent Use Case — Estimated + 8 poin

**Apa yang harus dibuat:**
1. **Pre-built Agent Templates** — 3 template agent:
   - "Research Agent" — summarize DeFi protocols
   - "Code Review Agent" — review Move code
   - "Trading Signal Agent" — monitor DeepBook and alert

2. **Agent-to-Human Handoff** — Agent bisa minta persetujuan manusia untuk transaksi > X SUI
3. **Agent Reputation System** — Rating + review on-chain

### 🟢 PRIORITAS 5: Polish — Estimated +6 poin

1. **Deploy ke Mainnet** — Agent identity di mainnet
2. **Deploy Frontend** → Vercel
3. **Agent Analytics** — Dashboard per-agent: total spent, tasks done, models used
4. **Agent Memory** — Riwayat percakapan + konteks berkelanjutan

---

## Target Skor Juara 1

| Kriteria | Sebelum | Sekarang | Target | Delta |
|----------|---------|----------|--------|-------|
| Real-World Application | 15/40 | 30/40 | 35/40 | +5 |
| Agent Autonomy | 5/25 | 20/25 | 23/25 | +3 |
| Technical Execution | 10/15 | 13/15 | 14/15 | +1 |
| Creativity & Innovation | 5/10 | 8/10 | 9/10 | +1 |
| Demo & Presentation | 3/10 | 4/10 | 9/10 | +5 |
| **TOTAL** | **38/100** | **75/100** | **90/100** 🏆 | **+15** |

---

## Executive Summary untuk Tim

> **"Juri Agentic Web Track tidak peduli infrastruktur lo sebagus apa. Mereka peduli: apakah lo bisa demo-in AI agent yang beneran otonom transaksi di Sui?"**

**Progress: Dari 38 → 75.** Agent identity, autonomous chat, agent-to-agent hiring sudah jadi. 🎉

**Yang masih kurang buat tembus 90+:**
1. **Deploy contracts ke testnet** — `sui client publish` biar judge bisa verify di explorer
2. **Deploy frontend ke Vercel** — Biar judge bisa akses tanpa setup lokal
3. **Demo video 5 menit** — Create agent → Chat (tunjukin agent decision panel) → Agent hire agent → Cek Walrus audit → Cek Sui txn
4. **Deploy ke mainnet** — Bonus credibility

**Yang paling penting:** Di demo day, jangan show "infrastructure." **Show the agent doing agent things autonomously.**
