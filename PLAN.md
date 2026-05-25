# WalrusFlow — Project Plan

## 🏆 Target Hackathons

### 1. Sui Overflow 2026 (May–August 2026)
- **Track:** Walrus (Specialized Track) — $70,000 USD prize pool
- **Register:** https://overflow.sui.io/
- **Headline Partner:** Walrus

### 2. Tatum x Walrus Hackathon (May 23 – June 6, 2026)
- **Prize:** $2,000 USD total
- **Requirements:** Tatum API key + Walrus integration on Sui
- **Submit:** GitHub repo + 2–3 min demo video
- **Judging:** Walrus/Tatum integration (30%), Technical Quality (30%), Creativity (20%), Presentation (20%)

---

## 🧠 Project Concept: WalrusFlow

> **Decentralized Media Production & Asset Marketplace on Sui**

Sebuah platform yang menjembatani workflow produksi media Web2 (animasi, video, desain grafis) dengan teknologi Web3 di Sui, menggunakan **Walrus** untuk decentralized storage dan **Move smart contracts** untuk manajemen kepemilikan & royalti.

### Problem
- Tim produksi media (seperti MOVIO) menyimpan file besar di cloud storage terpusat (Google Drive, Dropbox) — rentan terhadap sensor, downtime, dan biaya membengkak.
- Lisensi & kepemilikan aset media tidak transparan.
- Pembagian royalti untuk kolaborator masih manual dan rawan sengketa.

### Solution
1. **Decentralized Media Storage** — Simpan file video, animasi, 3D, dan desain di Walrus.
2. **NFT-based Asset Licensing** — Setiap aset media direpresentasikan sebagai NFT dengan hak lisensi on-chain.
3. **Automated Royalty Splits** — Smart contract distribusi royalti otomatis ke seluruh kontributor.
4. **Production Collaboration** — On-chain attribution untuk setiap anggota tim produksi.
5. **Asset Marketplace** — Jual/beli/license aset media dengan transparansi penuh.

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Frontend (Next.js)                    │
│  React + Tailwind + Wallet Adapter (suiet)              │
│  Walrus SDK (blob upload/download)                      │
│  Tatum RPC (Sui interaction)                            │
└────────────┬───────────────────────────────┬────────────┘
             │                               │
    ┌────────▼────────┐            ┌─────────▼─────────┐
    │   Walrus Publish │            │  Tatum Sui RPC    │
    │   (blob store)   │            │  (read/write)     │
    └────────┬────────┘            └─────────┬─────────┘
             │                               │
    ┌────────▼───────────────────────────────▼─────────┐
    │              Sui Move Smart Contracts             │
    │                                                   │
    │  ┌─────────────────┐  ┌──────────────────────┐   │
    │  │ MediaRegistry    │  │ AssetLicense         │   │
    │  │ - register asset │  │ - mint license NFT   │   │
    │  │ - store blob ref │  │ - transfer rights    │   │
    │  └─────────────────┘  └──────────────────────┘   │
    │  ┌─────────────────┐  ┌──────────────────────┐   │
    │  │ RoyaltySplitter  │  │ ProductionCollab     │   │
    │  │ - set splits     │  │ - create project     │   │
    │  │ - distribute     │  │ - attribute team     │   │
    │  └─────────────────┘  └──────────────────────┘   │
    └───────────────────────────────────────────────────┘
```

---

## 📦 Tech Stack

| Layer | Technology |
|-------|-----------|
| **Blockchain** | Sui (Mainnet) |
| **Storage** | Walrus (decentralized blob) |
| **Smart Contracts** | Move language on Sui |
| **RPC / Node** | Tatum Sui RPC endpoints |
| **Frontend** | Next.js 14 + React + TypeScript |
| **Styling** | Tailwind CSS + Shadcn UI |
| **Wallet** | Suiet Wallet Kit |
| **SDK** | Walrus SDK + @mysten/sui.js |
| **API Layer** | Tatum JS SDK |

---

## 🗺️ Timeline

### Phase 1: Foundation (Days 1–3)
- [x] Project plan & strategy
- [ ] Initialize Sui Move project
- [ ] Set up frontend scaffold (Next.js)
- [ ] Create Walrus developer account
- [ ] Create Tatum API key

### Phase 2: Smart Contracts (Days 4–8)
- [ ] MediaRegistry contract
- [ ] AssetLicense contract (NFT)
- [ ] RoyaltySplitter contract
- [ ] ProductionCollab contract
- [ ] Unit tests for all contracts

### Phase 3: Frontend + Integration (Days 9–14)
- [ ] Wallet connection
- [ ] Walrus blob upload/download
- [ ] Media asset listing & management
- [ ] NFT minting & licensing UI
- [ ] Marketplace UI
- [ ] Tatum RPC integration

### Phase 4: Polish & Submit (Days 15–18)
- [ ] End-to-end testing
- [ ] UI/UX polish
- [ ] Deploy contracts to Sui Testnet
- [ ] Deploy frontend (Vercel)
- [ ] Create demo video (2–3 min)
- [ ] Submit to Tatum x Walrus (June 6 deadline)
- [ ] Submit to Sui Overflow

---

## 📁 Project Structure

```
walrusflow/
├── contracts/                  # Sui Move smart contracts
│   ├── sources/
│   │   ├── media_registry.move
│   │   ├── asset_license.move
│   │   ├── royalty_splitter.move
│   │   └── production_collab.move
│   ├── tests/
│   │   └── walrusflow_tests.move
│   └── Move.toml
├── frontend/                   # Next.js app
│   ├── src/
│   │   ├── app/
│   │   ├── components/
│   │   ├── lib/
│   │   │   ├── walrus.ts      # Walrus SDK helper
│   │   │   ├── tatum.ts       # Tatum RPC helper
│   │   │   └── contract.ts    # Contract interaction
│   │   └── hooks/
│   ├── public/
│   └── package.json
├── PLAN.md
└── README.md
```

---

## 🎯 Winning Strategy

### Why WalrusFlow will win:

1. **Real-world utility** — Dibangun di atas expertise tim MOVIO yang sudah 10+ tahun di industri produksi media. Bukan proyek hipotetis.

2. **Perfect Walrus fit** — Walrus dirancang untuk blob storage besar. Media file (video, animasi, 3D) adalah use case sempurna. Bukan sekadar menyimpan metadata.

3. **Complete product** — Bukan sekadar smart contract. Ada frontend production-ready, integrasi Tatum RPC, dan demo yang bisa dijalankan.

4. **Dual hackathon** — Satu proyek bisa di-submit ke Sui Overflow (Walrus track) DAN Tatum x Walrus hackathon.

5. **Strong narrative** — Tim produksi media Web2 yang bertransisi ke Web3. Cerita yang kuat untuk presentasi dan voting.

### Points to emphasize in submissions:
- Deep Walrus integration (store-retrieve-blobs)
- Tatum RPC usage for Sui interaction
- Clean, production-quality code
- Working demo with real media files
- Presentation: show MOVIO's production workflow → WalrusFlow solution

---

## 👥 Team Roles

| Role | Person |
|------|--------|
| **Move Smart Contract Dev** | — |
| **Frontend Developer** | — |
| **UI/UX Designer** | — (leverage MOVIO design expertise) |
| **Project Manager / Presenter** | — |

---

## 📝 Tatum x Walrus Submission Checklist
- [ ] Sign up at https://dashboard.tatum.io/
- [ ] Get API key
- [ ] Join Tatum Discord #hackathon
- [ ] Use Tatum Sui RPC endpoints
- [ ] Integrate Walrus storage meaningfully
- [ ] Deploy to Sui Mainnet (preferred) or Testnet
- [ ] (Optional) MCP server integration
- [ ] Submit GitHub repo + 2–3 min demo video by June 6, 17:00 UTC

---

## 📝 Sui Overflow Submission Checklist
- [ ] Register at https://www.deepsurge.xyz/hackathons/b587dc0c-4cb8-4e63-ada5-519df38103bf
- [ ] Join Sui Overflow Discord
- [ ] Build period: May–August 2026
- [ ] Select "Walrus" track
- [ ] Deploy on Sui Mainnet
- [ ] Prepare project presentation
- [ ] Submit before deadline
