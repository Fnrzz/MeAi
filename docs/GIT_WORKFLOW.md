# Panduan Git Workflow (Menghindari Konflik di Branch Main)

Untuk menjaga agar _source code_ MeAi tetap stabil dan menghindari konflik (_merge conflicts_) yang sulit diselesaikan, sangat disarankan untuk **TIDAK** melakukan `commit` dan `push` langsung ke _branch_ `main`.

Gunakan alur kerja **Feature Branch Workflow** berikut ini.

---

## 🚀 1. Persiapan Awal (Pastikan Main Terkini)

Sebelum memulai pengerjaan fitur baru atau perbaikan _bug_, pastikan kode lokal kamu sudah sama dengan versi terbaru di Github.

```bash
# 1. Pindah ke branch main
git checkout main

# 2. Tarik kode terbaru dari server
git pull origin main
```

---

## 🌿 2. Membuat Branch Baru

Setiap kali ingin menambahkan fitur baru, mengubah UI, atau memperbaiki _bug_, buatlah _branch_ baru dari `main`.

Gunakan penamaan _branch_ yang jelas:

- `feature/nama-fitur` (untuk penambahan fitur)
- `bugfix/nama-bug` (untuk perbaikan _error_)
- `docs/nama-dokumen` (untuk perubahan dokumentasi)

```bash
# Membuat dan langsung pindah ke branch baru
git checkout -b feature/tambah-login
```

_Sekarang kamu berada di branch `feature/tambah-login` dan aman untuk bereksperimen tanpa merusak `main`._

---

## 💾 3. Menyimpan Perubahan (Commit)

Setelah kamu melakukan _coding_ dan merasa kodenya sudah siap atau mencapai _checkpoint_ tertentu:

```bash
# 1. Cek file apa saja yang berubah
git status

# 2. Tambahkan file yang ingin di-commit (gunakan . untuk semua)
git add .

# 3. Buat pesan commit yang jelas
git commit -m "feat: menambahkan tombol login di navbar"
```

---

## ☁️ 4. Mengunggah ke GitHub (Push)

Karena _branch_ baru ini belum ada di GitHub, kamu harus melakukan _push_ beserta pengaturan _upstream_.

```bash
# Push branch baru ke GitHub
git push -u origin feature/tambah-login
```

_(Untuk commit selanjutnya di branch yang sama, kamu cukup mengetik `git push` saja)_

---

## 🔄 5. Sinkronisasi Jika `main` Berubah (Opsional namun Penting!)

Jika teman satu tim kamu baru saja menggabungkan kodenya ke `main` dan kamu butuh kode terbarunya agar tidak _conflict_ nanti, lakukan hal berikut saat kamu **masih berada di dalam branch fiturmu**:

```bash
# 1. Ambil info terbaru dari server
git fetch origin

# 2. Gabungkan kode main terbaru ke dalam branch fiturmu
git merge origin/main
```

Jika terjadi konflik di langkah ini, selesaikan konfliknya di kodemu secara lokal terlebih dahulu (biasanya VSCode memberikan panduan UI untuk ini), lalu lakukan `git add .` dan `git commit -m "resolve conflicts"`.

---

## 🔀 6. Membuat Pull Request (PR)

Setelah _push_ selesai:

1. Buka halaman GitHub dari _repository_ ini.
2. Kamu akan melihat tombol hijau **"Compare & pull request"**. Klik tombol tersebut.
3. Beri judul dan deskripsi singkat tentang apa yang kamu kerjakan.
4. Pastikan target _base branch_-nya adalah `main` dan _compare branch_-nya adalah _branch_ milikmu.
5. Klik **"Create pull request"**.

---

## 🧹 7. Membersihkan Sisa Branch (Selesai)

Setelah kodemu digabungkan (_merged_) ke dalam `main` melalui GitHub, kamu bisa kembali ke `main` di komputermu, mengambil pembaruan terbaru, dan menghapus _branch_ fitur tadi.

```bash
# 1. Pindah kembali ke main
git checkout main

# 2. Tarik kode terbaru yang sudah berisi fiturmu
git pull origin main

# 3. Hapus branch fitur di lokal (opsional, agar rapi)
git branch -d feature/tambah-login
```

🎉 **Selesai!** Dengan cara ini, _branch_ `main` selalu bersih, berfungsi dengan baik, dan konflik dapat ditangani lebih awal.
