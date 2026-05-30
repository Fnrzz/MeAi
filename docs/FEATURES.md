# MeAi (SuiLLM Gateway) — Detail Fitur

Dokumen ini menjelaskan secara rinci fitur-fitur utama yang ada di dalam platform MeAi, yang menjadikannya sebuah infrastruktur *Agentic Web* yang mutakhir di atas jaringan blockchain Sui.

---

## 1. 🤖 AI Agent Otonom & Decision Engine

Ini adalah fitur inti dari MeAi. Platform ini tidak hanya berfungsi sebagai *gateway* biasa, tetapi sebagai mesin (*engine*) untuk AI Agent yang dapat bertindak dan berbelanja secara otonom.

- **Identitas On-Chain**: Setiap agen memiliki identitas terdaftar di blockchain SUI (objek `Agent`), lengkap dengan nama, instruksi sistem (*system prompt*), dan anggaran harian (*daily budget*).
- **Autonomous Model Selection**: Agen tidak dikunci ke satu model LLM. Saat agen menerima tugas, *decision engine* (`agents.ts`) akan memperkirakan jumlah token input, menganalisis daftar `allowed_models` dari agen, dan secara otomatis memilih model **termurah** (misalnya, memilih `deepseek-chat` daripada `gpt-4o`) tanpa campur tangan manusia.
- **Budgeting Otonom**: Agen dapat menolak request atau berhenti bekerja jika pengeluarannya hari ini (`spentToday`) telah melampaui `dailyBudget` yang ditetapkan pemiliknya.

## 2. ⚡ On-Chain Settlement dengan PTB

Biasanya, infrastruktur AI di Web3 bermasalah dengan mahalnya biaya transaksi karena harus memotong kuota setiap kali ada *request*. MeAi menyelesaikan ini dengan pendekatan **Programmable Transaction Blocks (PTB)**.

- **Atomic Deduction**: Setiap inferensi yang dilakukan agen akan dicatat secara *in-memory* oleh serverless Next.js, dan secara sinkron memicu pembuatan transaksi (PTB) untuk memotong saldo SUI (`deduct_agent` atau `deduct_quota`) di *smart contract*.
- **Tanpa Kepercayaan (Trustless)**: Tidak ada saldo yang ditahan di server terpusat. Seluruh saldo dipegang langsung di *smart contract* (`QuotaObject`), dan server hanya memerintahkan pemotongan berdasarkan pemakaian riil (harga SUI per token).

## 3. 🌐 Multi-Model via SumoPod

Alih-alih memaksa pengembang mengelola 5-6 API Key berbeda (OpenAI, Anthropic, Google, dll.), MeAi menggunakan arsitektur tersentralisasi di sisi perutean melalui **SumoPod**.

- **Satu API Key**: Serverless Next.js hanya membutuhkan 1 API Key (`SUMOPOD_API_KEY`) untuk mengakses berbagai model.
- **Dukungan Model**: Mendukung GPT-4o, Claude Sonnet 4, Gemini 2.0 Flash, DeepSeek Chat/Reasoner, Llama 3.3 70B, dan Mistral Large.
- **Kompatibilitas OpenAI**: Antarmuka API mengikuti standar OpenAI (`/v1/chat/completions`), sehingga pengembang dapat menggunakan *library* standar Python atau Node.js `openai` tanpa modifikasi besar.

## 4. 🤝 Koordinasi Antar Agen (Agent-to-Agent Hire)

Fitur canggih ini memungkinkan AI Agent menyewa AI Agent lain untuk menyelesaikan tugas, menggunakan sistem *Escrow* (rekening bersama) di smart contract (`agent_hire.move`).

- **Alur Kerja**: Agen A (Klien) membuat tugas (misalnya: "Terjemahkan teks ini") dan menyetorkan 1 SUI ke dalam *escrow*. Agen B (Pekerja) menerima tugas tersebut, memprosesnya melalui LLM, dan melaporkan ke kontrak bahwa tugas selesai (`complete_task`).
- **Pembayaran Otomatis**: Setelah status berubah menjadi *completed*, 1 SUI di dalam *escrow* otomatis ditransfer ke Agen B. Tidak ada pihak yang bisa menipu (trustless).

## 5. 🔍 Immutable Audit Logs (Walrus)

Transparansi adalah kunci dalam ekosistem agen. Jika agen otonom menghabiskan 5 SUI, pemiliknya harus tahu persis untuk apa uang itu dihabiskan.

- **Walrus Storage**: Setiap selesai inferensi, server (`walrus.ts`) mengambil data jumlah token, model yang digunakan, estimasi biaya, dan ID request, lalu mengunggahnya ke **Walrus Decentralized Storage**.
- **Log Permanen**: Data ini menjadi *blob* permanen yang hash-nya dapat diverifikasi secara *on-chain*, sehingga tidak ada pihak yang dapat memanipulasi jumlah pemakaian token.

## 6. 🔑 API Key sebagai NFT (ApiCapObject)

Di Web2, API Key adalah sebuah string di database (mis. `sk-12345`). Di MeAi, API Key adalah sebuah NFT (Non-Fungible Token) berjenis Capability Object di jaringan Sui (`access_module.move`).

- **Kepemilikan Penuh**: API Key berada di dalam *wallet* pengguna.
- **Transferable**: Pengguna dapat memberikan atau menjual API Key mereka ke dompet/agen lain secara on-chain.
- **Revocable**: Kunci dapat dicabut (revoke) kapan saja tanpa bergantung pada admin database pusat.

## 7. 💻 Dashboard Lengkap (Production UX)

Antarmuka frontend tidak hanya dibuat untuk demo, tapi dirancang layaknya produk komersial premium:
- **3D & Animasi**: Penggunaan visual interaktif (Three.js dan GSAP) di halaman utama untuk mengilustrasikan jaringan AI.
- **Playground**: Editor interaktif (*chat interface*) tempat pengguna bisa mengetes prompt secara manual, membandingkan LLM, dan melihat visualisasi pengeluaran token secara *real-time*.
- **Agent Manager**: Panel khusus bagi pengguna untuk membuat Agen Otonom, menentukan batas anggaran (budget) harian, dan melihat aktivitas agen tersebut.
- **Top Up Otomatis**: Integrasi penuh dengan dompet Sui via `@mysten/dapp-kit` untuk isi ulang saldo SUI dengan satu kali klik.
