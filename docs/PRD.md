# MeAi Gateway (formerly SuiLLM Gateway)
## AI Agent Marketplace dengan Pembayaran Native SUI Token
### Product Requirements Document (PRD)

*Technical Brief & System Architecture*
*Sui Overflow 2026 — Agentic Web Track*
*Versi 1.0 | Mei 2026*

| | |
|---|---|
| **Track** | Agentic Web — Sui Overflow 2026 |
| **Kategori** | AI Infrastructure + DeFAI + Developer Tooling |
| **Stack Utama** | Move (Sui) · Node.js · Next.js 14 · Walrus |
| **Target User** | Developer & dApp yang ingin bayar LLM dengan SUI |
| **Prize Pool** | $500K+ total across core & sponsored tracks |

---

## 1. Executive Summary

MeAi (SuiLLM Gateway) adalah platform infrastruktur yang memungkinkan developer, dApp, dan AI agent lain untuk mengakses berbagai Large Language Model (LLM) — termasuk Claude, GPT-4o, Gemini, dan model open source — dengan membayar menggunakan token SUI secara native on-chain.

Platform ini menjawab problem statement utama track Agentic Web: bagaimana membangun agentic commerce di atas Sui dengan payment rails yang cepat, programmable, dan atomic. Alih-alih memaksakan Web2 API key ke ekosistem Web3, platform ini membangun ulang model akses dan billing menggunakan primitif native Sui: Capability Objects, Programmable Transaction Blocks (PTB), dan Walrus untuk audit trail terdesentralisasi.

| Aspek | Solusi MeAi |
|---|---|
| **Masalah pembayaran LLM** | Bayar dengan SUI/stablecoin, bukan kartu kredit |
| **Akses untuk agent otomatis** | NFT Capability Object — dapat dibeli, ditransfer, di-delegate |
| **Multi-agent coordination** | A2A Protocol + PTB atomic multi-purchase |
| **Audit & transparansi** | Usage log di Walrus, verifiable on-chain |
| **Developer experience** | OpenAI-compatible API — tinggal ganti base URL |

---

## 2. Latar Belakang & Relevansi Track

Mysten Labs mendefinisikan Agentic Web sebagai web generasi berikutnya di mana AI agent dapat bertindak, bertransaksi, dan berkoordinasi secara otonom. Tiga pilar utama yang menjadi focus track ini adalah:

- **Agentic Commerce** — agent dapat membayar layanan secara otonom dengan spending cap yang terkontrol
- **Content Monetization** — situs dan API dapat memonetisasi akses dari agent
- **Identity & Authentication** — identitas kriptografis untuk human, agent, dan agent-acting-on-behalf-of-human

Platform ini menjawab ketiga pilar ini sekaligus: platform adalah marketplace di mana LLM provider memonetisasi inference mereka kepada agent/developer, dengan identitas berbasis Sui object, dan pembayaran atomic menggunakan PTB — persis seperti demo A2A yang dipamerkan Mysten Labs dalam kolaborasinya dengan Google Cloud.

> *Kompetisi langsung di ekosistem Sui: Atoma (decentralized inference), Suithetic (synthetic data), dan RaidenX (DeFAI trading) sudah ada, tapi belum ada yang fokus ke 'LLM-as-a-payable-service dengan SUI' untuk developer umum dengan API yang compatible dengan standar OpenAI.*

---

## 3. Arsitektur Sistem

Sistem terdiri dari 5 layer utama yang berinteraksi satu sama lain. Setiap layer memiliki tanggung jawab yang terisolasi untuk kemudahan testing, scaling, dan maintenance.

| Layer | Nama | Teknologi | Fungsi Utama |
|---|---|---|---|
| L1 | User Interface | Next.js 14, @mysten/dapp-kit | Dashboard, wallet connect, API key management |
| L2 | Smart Contract | Move on Sui | Payment, access control, quota, registry |
| L3 | Gateway Backend | Node.js / Bun, Redis | Auth verify, LLM routing, usage metering, settlement |
| L4 | LLM Providers | Anthropic, OpenAI, Google, Atoma | Inference engine — dikonsumsi oleh gateway |
| L5 | Data Layer | Walrus, PostgreSQL, Redis | Audit log, metadata, cache quota |

*(Catatan: Seiring berjalannya proyek, Layer 3 digabungkan ke dalam Layer 1 menggunakan Next.js API Routes dan SumoPod untuk menyederhanakan arsitektur).*

### 3.1 Smart Contract Architecture (Move on Sui)

Smart contract adalah inti dari keseluruhan sistem. Dirancang sebagai 4 module yang terpisah namun saling berinteraksi dalam satu package:

#### Module 1: payment_module
Mengelola seluruh aliran keuangan platform.
- Escrow SUI token dari user ke platform treasury
- Support stablecoin (USDC on Sui) untuk harga yang stabil
- Per-token billing: 1 SUI = N inference tokens (konfigurasi via governance)
- PTB atomic multi-payment: satu tx bisa bayar beberapa agent sekaligus
- Revenue split otomatis ke LLM provider, platform fee, dan staking reward

#### Module 2: access_module
API key direpresentasikan sebagai Sui Capability Object (NFT), bukan string di database. Ini adalah perbedaan fundamental dari sistem Web2 biasa:
- **ApiCapObject**: Sui object yang dimiliki user, berisi allowlist model dan tier akses
- Bisa ditransfer ke wallet lain (jual, delegate ke agent)
- Bisa di-burn untuk refund sisa quota
- Verifikasi: gateway query Sui RPC — tidak perlu trust database off-chain

#### Module 3: quota_module
- **QuotaObject**: menyimpan saldo token inference yang tersisa
- **SpendCapObject**: batas maksimal pengeluaran per periode (keamanan agent otonom)
- Top-up kapan saja tanpa membuat object baru
- Auto-refund jika request gagal di sisi LLM provider

#### Module 4: registry_module
- Daftar model yang tersedia beserta harga per 1K token (input & output)
- Agent capability: model dapat didaftarkan sebagai 'agent' dengan kemampuan tertentu
- Revenue split config per provider (persentase ke provider, platform, staking)
- Governance: parameter dapat diubah via multisig atau DAO vote

---

## 4. Workflow User — Step by Step

### 4.1 Onboarding: Daftar & Top-Up Pertama

| Step | Aksi User | Yang Terjadi di Sistem |
|---|---|---|
| 1 | Kunjungi web app, klik 'Connect Wallet' | dapp-kit membuka Sui wallet popup |
| 2 | Approve koneksi di wallet | Alamat wallet disimpan di session, dashboard terbuka |
| 3 | Klik 'Top-Up Quota', masukkan jumlah SUI | Frontend build transaction: transfer SUI ke contract + mint QuotaObject |
| 4 | Approve tx di wallet | Contract: terima SUI, buat QuotaObject |
| 5 | Dashboard refresh | Balance quota muncul |
| 6 | Klik 'Generate API Key' | Contract mint ApiCapObject (NFT), dikirim ke wallet user |
| 7 | Copy API key identifier (object ID) | Siap digunakan untuk call gateway API |

---

## 5. Keamanan Sistem

| Vektor Ancaman | Mitigasi |
|---|---|
| Replay attack (reuse signature) | Timestamp dalam signature; signature expired setelah waktu tertentu |
| Stolen API key (object ID bocor) | Butuh signature dari private key wallet — object ID alone tidak cukup |
| Man-in-the-middle | Semua komunikasi TLS. Gateway hanya expose HTTPS endpoint |
| Over-spending oleh agent | SpendCapObject on-chain — batas tidak bisa di-bypass meski gateway dikompromis |
| LLM provider data leak | Gateway tidak log prompt/response. Hanya token count yang dicatat di Walrus |
| Smart contract exploit | Formal verification dengan Move Prover. Audit eksternal sebelum mainnet |
| Sybil attack (banyak wallet palsu) | Tidak masalah — setiap wallet harus top-up SUI nyata. Tidak ada free tier |

---

## 6. Differentiators & Kriteria Penjurian

| Kriteria Juri | Implementasi | Skor Potensi |
|---|---|---|
| **Inovasi teknis** | API key sebagai Sui Object, PTB batch settlement, SpendCap native on-chain | Sangat tinggi |
| **Relevansi track Agentic Web** | Langsung menjawab 3 pilar: commerce, monetization, identity | Sangat tinggi |
| **Penggunaan fitur unik Sui** | PTB, Object model, Move safety, Walrus | Sangat tinggi |
| **Developer experience** | OpenAI-compatible — zero learning curve untuk developer existing | Tinggi |
| **Kelayakan bisnis** | Model monetisasi jelas: margin platform fee dari setiap inference | Tinggi |
| **Kualitas demo** | Live demo: agent otonom beli quota + call LLM + lihat on Sui Explorer | Tinggi |
