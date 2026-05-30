# MeAi Frontend Architecture

Sistem Frontend MeAi dibangun menggunakan **Next.js 16 (App Router)**. Awalnya, proyek ini dipisahkan menjadi dua bagian (Frontend dan Gateway terpisah). Namun, untuk efisiensi arsitektur dan kemudahan *deployment*, seluruh sistem backend kini telah disatukan ke dalam **Next.js API Routes**.

Oleh karena itu, `frontend/` kini berperan sebagai aplikasi *full-stack* yang menangani UI, dompet Web3, sekaligus perutean LLM dan penyelesaian transaksi *on-chain*.

## 🛠️ Tech Stack

| Kategori | Teknologi | Fungsi |
|---|---|---|
| **Framework** | Next.js 16 (App Router) | React framework untuk SSR, routing, dan API |
| **UI Library** | React 19 | Library utama |
| **Styling** | Tailwind CSS v4, shadcn/ui | Desain sistem dan komponen UI modern |
| **Web3 Wallet** | `@mysten/dapp-kit`, `@mysten/sui` | Integrasi dompet Sui dan interaksi RPC |
| **3D & Animasi** | Three.js, GSAP | Visual *Hero Scene*, grafis 3D interaktif, dan animasi transisi |
| **LLM Gateway** | SumoPod (via OpenAI SDK) | *Single endpoint* untuk berbagai LLM (GPT-4o, Claude, DeepSeek, dll) |

---

## 📂 Struktur Direktori

```text
frontend/
├── src/
│   ├── app/
│   │   ├── (landing)/          # Halaman depan (marketing, 3D hero)
│   │   ├── (dashboard)/        # Halaman dengan otentikasi dompet (Sidebar/Nav)
│   │   │   ├── dashboard/      # Ringkasan saldo & kuota
│   │   │   ├── agents/         # Manajemen AI Agent & ruang obrolan (Chat)
│   │   │   ├── playground/     # Tempat testing prompt manual
│   │   │   ├── api-keys/       # Manajemen ApiCapObject (NFT API Key)
│   │   │   └── admin/          # Panel kontrol admin
│   │   ├── api/                # 🚀 Backend Gateway (Serverless API)
│   │   │   ├── _lib/           # Server-side utilities (Auth, Settlement, SumoPod, Walrus)
│   │   │   ├── v1/models/      # Daftar model dari smart contract
│   │   │   ├── v1/chat/        # Rute chat LLM biasa
│   │   │   └── v1/agents/      # Endpoint manajemen dan obrolan agen otonom
│   │   ├── globals.css         # Styling utama Tailwind
│   │   ├── layout.tsx          # Root layout
│   │   └── providers.tsx       # Pembungkus (Wrapper) untuk SuiClient, Wallet, dan QueryClient
│   │
│   ├── components/             # Komponen React Reusable
│   │   ├── animations/         # Komponen Three.js & GSAP (HeroScene3D, Parallax, dll)
│   │   ├── layouts/            # Navbar, Sidebar, Footer
│   │   └── ui/                 # Komponen shadcn/ui (Button, Toast, dll)
│   │
│   └── lib/                    # Client-side Utilities
│       ├── contract.ts         # Fungsi pembangun PTB (Programmable Tx Block) ke Move
│       ├── gateway.ts          # Klien untuk memanggil Next.js API (/api/v1/...)
│       └── walrus.ts           # Utilitas penyimpanan Walrus di sisi klien
```

---

## 🎨 Arsitektur Komponen Visual (Animasi & 3D)

Untuk memberikan pengalaman *Production UX* yang sangat premium dan kompetitif dalam *hackathon*, UI dibangun dengan animasi tinggi:

1. **`HeroScene3D.tsx` & `WhySuiScene3D.tsx`**: Menggunakan `Three.js` murni untuk membangun adegan interaktif (mis. jaringan *node* yang merespons pergerakan kursor).
2. **`gsap-hooks.ts` & `Parallax.tsx`**: Menggunakan pustaka GSAP (GreenSock) untuk transisi masuk, penghitung angka (*value counters*), dan efek gulir yang halus (*smooth scrolling*).
3. **Glassmorphism**: Desain banyak memanfaatkan properti `backdrop-filter: blur()` dari Tailwind untuk memberikan efek tembus pandang yang futuristik.

---

## 🔗 Interaksi Klien ↔ API (Alur Obrolan Agen)

Sistem obrolan (*chat*) adalah jantung dari proyek ini. Berikut cara kerjanya secara internal:

1. **Klien (UI)**:
   - Pengguna mengetik pesan di `(dashboard)/agents/[id]/page.tsx`.
   - UI menandatangani *payload* unik dengan kunci pribadi dompet menggunakan `@mysten/dapp-kit` (untuk membuktikan kepemilikan kuota tanpa memaparkan dompet).
   - Fungsi `chatCompletions()` di `src/lib/gateway.ts` memanggil rute `/api/v1/agents/[id]/chat` dengan meneruskan tanda tangan (signature) dan ID objek SUI.

2. **Next.js API (Server)**:
   - File `api/_lib/auth.ts` memverifikasi *signature* secara on-chain.
   - File `api/_lib/agents.ts` membaca `allowed_models` dari agen, memperkirakan jumlah token pesan, dan memilih LLM termurah secara otonom (mis. DeepSeek).
   - Memanggil API SumoPod secara *streaming*.
   - Saat aliran teks (*stream*) LLM masuk, server secara bersamaan melakukan:
     - Mengirim respons *Server-Sent Events (SSE)* ke UI agar pengguna bisa membaca pesan secara *real-time*.
     - Memicu `settleDeduction` di `api/_lib/settlement.ts` untuk memotong saldo agen langsung ke *smart contract* Sui.
     - Menyimpan catatan inferensi ke dalam Walrus melalui `api/_lib/walrus.ts`.

---

## 🔒 Manajemen State & Konteks Web3

Semua komponen klien yang membutuhkan dompet dibungkus di dalam `providers.tsx`:
- **`QueryClientProvider`**: Manajer status sisi klien dari *React Query* (untuk pengambilan saldo).
- **`SuiClientProvider`**: Koneksi Node RPC untuk Testnet/Mainnet.
- **`WalletProvider`**: Menyediakan *hooks* seperti `useCurrentAccount`, `useSignTransaction`, dan popup koneksi ke *Martian*, *Sui Wallet*, dll.

---

## 🏃 Cara Pengembangan

### Persyaratan Lingkungan
Buat file `.env.local` dan isi dengan konfigurasi SumoPod dan Sui:
```ini
SUMOPOD_API_KEY=sk-your-sumopod-key
SUMOPOD_BASE_URL=https://ai.sumopod.com/v1
SUI_RPC_URL=https://fullnode.testnet.sui.io:443
PACKAGE_ID=...
API_KEY_REGISTRY_ID=...
MODEL_REGISTRY_ID=...
ADMIN_PRIVATE_KEY=... # Opsional, untuk eksekusi settlement
```

### Menjalankan Server Dev
```bash
cd frontend
npm run dev
```

Aplikasi akan berjalan di `http://localhost:3000`. API dapat diakses melalui `http://localhost:3000/api/health`.
