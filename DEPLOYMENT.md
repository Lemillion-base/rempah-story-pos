# 🚀 Panduan Deployment BerdikariPOS — Vercel + Supabase
> Panduan ini menjelaskan cara mengonlinekan aplikasi BerdikariPOS dari nol hingga bisa diakses lewat internet, **step by step**.

---

## Daftar Isi
1. [Prasyarat](#1-prasyarat)
2. [Setup Supabase (Database Cloud)](#2-setup-supabase-database-cloud)
3. [Setup Repository GitHub](#3-setup-repository-github)
4. [Setup Vercel (Hosting)](#4-setup-vercel-hosting)
5. [Konfigurasi Environment Variables](#5-konfigurasi-environment-variables)
6. [Jalankan Schema Database](#6-jalankan-schema-database)
7. [Verifikasi Aplikasi Online](#7-verifikasi-aplikasi-online)
8. [Custom Domain (Opsional)](#8-custom-domain-opsional)
9. [Deploy Update Kode](#9-deploy-update-kode)
10. [Setup Klien Baru](#10-setup-klien-baru)
11. [Troubleshooting](#11-troubleshooting)
12. [Checklist Final](#12-checklist-final)

---

## 1. Prasyarat

Sebelum mulai, pastikan sudah tersedia:

| Kebutuhan | Keterangan |
|---|---|
| Akun **GitHub** | Gratis — [github.com](https://github.com) |
| Akun **Supabase** | Gratis (free tier cukup) — [supabase.com](https://supabase.com) |
| Akun **Vercel** | Gratis — [vercel.com](https://vercel.com) |
| **Node.js** v18+ | Terinstal di komputer — [nodejs.org](https://nodejs.org) |
| **Git** | Terinstal di komputer — [git-scm.com](https://git-scm.com) |
| Kode aplikasi | Folder project `rempah-story-pos` sudah siap |

> [!NOTE]
> Seluruh layanan di atas memiliki paket **gratis** yang sudah cukup untuk operasional bisnis skala kecil hingga menengah.

---

## 2. Setup Supabase (Database Cloud)

Supabase adalah database PostgreSQL berbasis cloud yang digunakan sebagai backend aplikasi ini.

### Langkah 2.1 — Buat Akun Supabase

1. Buka [https://supabase.com](https://supabase.com)
2. Klik **"Start your project"**
3. Daftar menggunakan akun **GitHub** (lebih mudah) atau email
4. Verifikasi email jika diminta

### Langkah 2.2 — Buat Project Baru

1. Setelah login, klik tombol **"New project"**
2. Pilih **Organization** (buat baru jika belum ada)
3. Isi form berikut:

   | Field | Nilai |
   |---|---|
   | **Name** | `berdikaripos-[namatoko]` (contoh: `berdikaripos-rempahstory`) |
   | **Database Password** | Buat password kuat, **simpan di tempat aman!** |
   | **Region** | `Southeast Asia (Singapore)` — pilih ini agar latency rendah dari Indonesia |
   | **Pricing Plan** | `Free` |

4. Klik **"Create new project"**
5. **Tunggu 1–2 menit** sampai project selesai diinisialisasi (ada loading bar)

### Langkah 2.3 — Ambil Kredensial API

Setelah project siap:

1. Di sidebar kiri, klik **Project Settings** (ikon gear ⚙️)
2. Pilih menu **API**
3. Catat dua nilai berikut (akan dipakai di Langkah 5):

   ```
   Project URL   → https://xxxxxxxxxxxxxxxx.supabase.co
   anon (public) → eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.xxxx...
   ```

> [!CAUTION]
> Jangan pernah membagikan **service_role key** ke publik. Yang dibutuhkan hanya **anon key**.

---

## 3. Setup Repository GitHub

GitHub digunakan sebagai tempat penyimpanan kode yang akan terhubung ke Vercel untuk auto-deploy.

### Langkah 3.1 — Buat Repository di GitHub

1. Buka [https://github.com/new](https://github.com/new)
2. Isi form:

   | Field | Nilai |
   |---|---|
   | **Repository name** | `rempah-story-pos` (atau sesuai keinginan) |
   | **Visibility** | `Private` (direkomendasikan agar kode aman) |
   | **Initialize** | Jangan centang apapun |

3. Klik **"Create repository"**

### Langkah 3.2 — Push Kode ke GitHub

Buka **PowerShell** atau **Terminal**, arahkan ke folder project, lalu jalankan perintah berikut satu per satu:

```powershell
# Masuk ke folder project
cd "d:\Private File\Aba\VibeCoding\Aplikasi\rempah-story-pos"

# Inisialisasi git (jika belum pernah)
git init

# Tambahkan semua file
git add .

# Commit pertama
git commit -m "Initial commit: BerdikariPOS v4.4"

# Hubungkan ke GitHub (ganti URL sesuai repo Anda)
git remote add origin https://github.com/USERNAME/rempah-story-pos.git

# Push ke branch main
git branch -M main
git push -u origin main
```

> [!NOTE]
> Ganti `USERNAME` dengan username GitHub Anda yang sebenarnya.
> Jika diminta login, masukkan username dan **Personal Access Token** GitHub (bukan password biasa).
> Cara buat token: GitHub → Settings → Developer Settings → Personal Access Tokens → Generate new token (centang `repo`).

### Langkah 3.3 — Verifikasi .gitignore

Pastikan file `.gitignore` sudah berisi baris berikut agar file sensitif tidak terupload:

```
node_modules
dist
.env
*.local
```

File `.env` (berisi kredensial Supabase) **TIDAK BOLEH** diupload ke GitHub.

---

## 4. Setup Vercel (Hosting)

Vercel adalah platform hosting yang akan menjalankan dan menyajikan aplikasi ke internet secara gratis.

### Langkah 4.1 — Buat Akun Vercel

1. Buka [https://vercel.com](https://vercel.com)
2. Klik **"Sign Up"**
3. Pilih **"Continue with GitHub"** — ini penting agar Vercel bisa membaca repository Anda
4. Izinkan akses saat diminta

### Langkah 4.2 — Import Project dari GitHub

1. Setelah login ke Vercel, klik **"Add New..."** → **"Project"**
2. Di bagian **"Import Git Repository"**, cari dan pilih repository `rempah-story-pos`
3. Klik **"Import"**

### Langkah 4.3 — Konfigurasi Build Settings

Di halaman konfigurasi project, isi sebagai berikut:

| Setting | Nilai |
|---|---|
| **Framework Preset** | `Vite` (Vercel biasanya deteksi otomatis) |
| **Root Directory** | `.` (kosongkan / biarkan default) |
| **Build Command** | `npm run build` |
| **Output Directory** | `dist` |
| **Install Command** | `npm install` |

> [!IMPORTANT]
> Jangan klik **Deploy** dulu sebelum mengisi **Environment Variables** di langkah berikutnya!

---

## 5. Konfigurasi Environment Variables

Environment Variables adalah cara aman untuk menyimpan kredensial Supabase tanpa memasukkannya langsung ke dalam kode.

### Langkah 5.1 — Tambahkan di Vercel

Masih di halaman konfigurasi project Vercel (sebelum deploy pertama):

1. Scroll ke bawah ke bagian **"Environment Variables"**
2. Tambahkan dua variabel berikut (satu per satu):

   **Variabel 1:**
   ```
   Name  : VITE_SUPABASE_URL
   Value : https://xxxxxxxxxxxxxxxx.supabase.co
   ```
   (Nilai dari Langkah 2.3 — Project URL)

   **Variabel 2:**
   ```
   Name  : VITE_SUPABASE_ANON_KEY
   Value : eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.xxxx...
   ```
   (Nilai dari Langkah 2.3 — anon key)

3. Pastikan kedua variabel memiliki **Environment** = `Production`, `Preview`, `Development` (centang semua tiga)

### Langkah 5.2 — Deploy Pertama

1. Setelah mengisi environment variables, klik **"Deploy"**
2. Vercel akan mulai proses build (1–3 menit)
3. Setelah selesai, Anda akan mendapat URL seperti: `https://rempah-story-pos.vercel.app`

> [!TIP]
> Jika lupa mengisi environment variables sebelum deploy pertama:
> Pergi ke **Project Settings → Environment Variables**, tambahkan variabelnya, lalu klik **"Redeploy"** di tab **Deployments**.

### Langkah 5.3 — Buat File .env Lokal (Untuk Development)

Di komputer lokal, buat file `.env` di root folder project:

```env
VITE_SUPABASE_URL=https://xxxxxxxxxxxxxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.xxxx...
```

File ini digunakan saat development lokal (`npm run dev`). File `.env` sudah ada di `.gitignore` sehingga aman dan tidak akan terupload ke GitHub.

---

## 6. Jalankan Schema Database

Schema adalah struktur tabel yang harus dibuat di Supabase sebelum aplikasi bisa berjalan.

### Langkah 6.1 — Buka SQL Editor Supabase

1. Login ke [https://supabase.com](https://supabase.com)
2. Pilih project Anda
3. Di sidebar kiri, klik **"SQL Editor"**
4. Klik **"New query"**

### Langkah 6.2 — Copy & Paste Schema

1. Buka file `supabase/schema.sql` dari folder project
2. **Select All** (Ctrl+A) → **Copy** (Ctrl+C)
3. Paste ke SQL Editor Supabase
4. Klik tombol **"Run"** (atau tekan `Ctrl+Enter`)
5. Tunggu hingga muncul pesan: **"Success. No rows returned"**

> [!NOTE]
> Schema sudah menggunakan `CREATE TABLE IF NOT EXISTS` sehingga **aman dijalankan ulang** tanpa merusak data yang sudah ada.

### Langkah 6.3 — Aktifkan Realtime

Agar fitur sinkronisasi antar device berfungsi:

1. Di sidebar Supabase, klik **"Database"** → **"Replication"**
2. Pastikan semua tabel berikut sudah aktif sebagai **Source**:
   - `users`, `inventory`, `menus`, `transactions`, `transaction_items`
   - `cash_movements`, `stock_movements`, `stock_opnames`
   - `shifts`, `settings`, `categories`, `suppliers`
   - `customers`, `promotions`, `audit_logs`
3. Jika ada tabel yang belum aktif, klik toggle untuk mengaktifkannya

> [!TIP]
> Realtime sudah dikonfigurasi di schema.sql dengan `ALTER PUBLICATION supabase_realtime ADD TABLE ...`. Langkah ini hanya untuk verifikasi.

### Langkah 6.4 — Nonaktifkan Row Level Security (RLS)

Aplikasi ini menggunakan custom authentication (bukan Supabase Auth), sehingga RLS perlu dinonaktifkan:

1. Di sidebar Supabase, klik **"Authentication"** → **"Policies"**
2. Untuk setiap tabel, pastikan RLS dalam status **disabled**
3. Atau jalankan query berikut di SQL Editor untuk menonaktifkan semua sekaligus:

```sql
-- Nonaktifkan RLS untuk semua tabel aplikasi
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE inventory DISABLE ROW LEVEL SECURITY;
ALTER TABLE menus DISABLE ROW LEVEL SECURITY;
ALTER TABLE transactions DISABLE ROW LEVEL SECURITY;
ALTER TABLE transaction_items DISABLE ROW LEVEL SECURITY;
ALTER TABLE cash_movements DISABLE ROW LEVEL SECURITY;
ALTER TABLE stock_movements DISABLE ROW LEVEL SECURITY;
ALTER TABLE stock_opnames DISABLE ROW LEVEL SECURITY;
ALTER TABLE shifts DISABLE ROW LEVEL SECURITY;
ALTER TABLE settings DISABLE ROW LEVEL SECURITY;
ALTER TABLE categories DISABLE ROW LEVEL SECURITY;
ALTER TABLE suppliers DISABLE ROW LEVEL SECURITY;
ALTER TABLE customers DISABLE ROW LEVEL SECURITY;
ALTER TABLE promotions DISABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs DISABLE ROW LEVEL SECURITY;
```

---

## 7. Verifikasi Aplikasi Online

### Langkah 7.1 — Buka URL Aplikasi

1. Buka URL yang diberikan Vercel (contoh: `https://rempah-story-pos.vercel.app`)
2. Aplikasi seharusnya muncul dengan tampilan login

### Langkah 7.2 — Checklist Verifikasi Awal

- [ ] Halaman login muncul dengan benar (tidak ada layar putih)
- [ ] Login berhasil menggunakan akun Manager
- [ ] Data tersimpan dan muncul setelah refresh halaman
- [ ] Di dua browser berbeda, perubahan data muncul secara realtime (uji sync)
- [ ] Aplikasi bisa diinstall sebagai PWA (ada ikon install di address bar browser)

### Membuat User Manager Pertama

Saat pertama kali setup, buat akun Manager awal via SQL Editor Supabase:

```sql
-- Tambahkan user Manager pertama
-- Password default: admin123 (segera ganti setelah login!)
INSERT INTO users (id, name, username, password, role)
VALUES (
  gen_random_uuid(),
  'Admin Manager',
  'admin',
  '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lsXS',
  'Manager'
);
```

> [!IMPORTANT]
> Password di atas adalah hash bcrypt dari `admin123`.
> **Segera ganti password** setelah login pertama melalui menu **Pengaturan → Manajemen User**.

---

## 8. Custom Domain (Opsional)

Jika ingin menggunakan domain sendiri (contoh: `pos.rempahstory.com`):

### Langkah 8.1 — Beli Domain

Rekomendasi registrar domain:
- [Niagahoster](https://www.niagahoster.co.id) — Indonesia, support bahasa Indonesia
- [Namecheap](https://www.namecheap.com) — Internasional, harga kompetitif
- [Cloudflare Registrar](https://www.cloudflare.com/products/registrar/) — Tanpa markup, harga at-cost

### Langkah 8.2 — Tambahkan Domain di Vercel

1. Buka project di Vercel → **Settings** → **Domains**
2. Klik **"Add"**
3. Ketik domain Anda (contoh: `pos.rempahstory.com`)
4. Vercel akan menampilkan **DNS Record** yang perlu ditambahkan

### Langkah 8.3 — Konfigurasi DNS di Registrar

Di panel domain registrar Anda, tambahkan DNS record sesuai petunjuk Vercel:

**Jika menggunakan subdomain** (contoh: `pos.rempahstory.com`):
```
Type  : CNAME
Name  : pos
Value : cname.vercel-dns.com
TTL   : Auto / 3600
```

**Jika menggunakan root domain** (contoh: `rempahstory.com`):
```
Type  : A
Name  : @
Value : 76.76.21.21
TTL   : Auto / 3600
```

4. Tunggu propagasi DNS (5 menit hingga 48 jam, biasanya < 1 jam)
5. Setelah berhasil, Vercel otomatis mengaktifkan **SSL/HTTPS gratis** via Let's Encrypt

---

## 9. Deploy Update Kode

Setiap kali ada perubahan kode yang ingin dipublish ke production:

### Cara Deploy via Git Push (Otomatis)

```powershell
# Di folder project
cd "d:\Private File\Aba\VibeCoding\Aplikasi\rempah-story-pos"

# Tambahkan semua perubahan
git add .

# Commit dengan pesan deskriptif
git commit -m "feat: tambah fitur laporan bulanan"

# Push ke GitHub — Vercel otomatis rebuild & deploy
git push origin main
```

Vercel mendeteksi push secara otomatis dan **rebuild + deploy dalam 1–2 menit**. Tidak perlu login ke Vercel.

### Cek Status Deploy

1. Buka [https://vercel.com/dashboard](https://vercel.com/dashboard)
2. Pilih project → tab **"Deployments"**
3. Lihat status setiap deployment (building / ready / error)
4. Klik deployment untuk melihat **build logs** detail

### Jika Build Error di Vercel

| Pesan Error | Solusi |
|---|---|
| `Cannot find module 'X'` | Jalankan `npm install` lokal, push ulang `package-lock.json` |
| `Type error: ...` | Fix TypeScript error, test lokal dengan `npm run build` terlebih dahulu |
| `Environment variable not found` | Cek env vars di Vercel → Settings → Environment Variables |
| `Build exceeded memory limit` | Upgrade ke Vercel Pro, atau optimalkan bundle size |

> [!TIP]
> **Selalu test build lokal sebelum push ke production:**
> ```powershell
> npm run build
> ```
> Jika build lokal sukses, hampir pasti build di Vercel juga akan sukses.

---

## 10. Setup Klien Baru

Untuk setiap toko/klien baru yang menggunakan aplikasi ini:

### Opsi A: Supabase Terpisah per Klien ✅ Direkomendasikan

Setiap klien mendapat database Supabase sendiri. Data 100% terpisah dan aman.

**Langkah:**
1. Ulangi Langkah 2 (buat project Supabase baru)
2. Jalankan `supabase/schema.sql` di project baru
3. Nonaktifkan RLS semua tabel
4. Di Vercel, buat project baru yang terhubung ke repository yang sama
5. Set environment variables yang menunjuk ke Supabase klien tersebut

**Contoh multi-klien di Vercel:**
```
Project: berdikaripos-rempahstory   → VITE_SUPABASE_URL = https://aaa.supabase.co
Project: berdikaripos-warungbudi    → VITE_SUPABASE_URL = https://bbb.supabase.co
Project: berdikaripos-cafemario     → VITE_SUPABASE_URL = https://ccc.supabase.co
```

Setiap project Vercel punya URL sendiri: `berdikaripos-rempahstory.vercel.app`, `berdikaripos-warungbudi.vercel.app`, dst.

### Opsi B: Satu Supabase (Shared Database)

Gunakan satu project Supabase untuk semua klien dengan data terpisah lewat field `store_id`. Lebih hemat, tapi perlu modifikasi kode dan ada risiko kebocoran data jika tidak dikonfigurasi dengan benar.

### Checklist Setup Klien Baru

- [ ] Buat project Supabase baru di region Singapore
- [ ] Jalankan `supabase/schema.sql`
- [ ] Nonaktifkan RLS semua tabel
- [ ] Aktifkan Realtime semua tabel
- [ ] Buat project baru di Vercel, hubungkan ke repository
- [ ] Set `VITE_SUPABASE_URL` dan `VITE_SUPABASE_ANON_KEY` di Vercel
- [ ] Deploy berhasil (status Ready)
- [ ] Buat user Manager pertama via SQL
- [ ] Beri klien URL aplikasi dan kredensial login awal
- [ ] Minta klien ganti password saat pertama kali login

---

## 11. Troubleshooting

### ❌ "Failed to fetch" atau data tidak muncul

**Penyebab:** Environment variables Supabase salah atau belum diisi.

**Solusi:**
1. Buka Vercel → Project Settings → Environment Variables
2. Pastikan `VITE_SUPABASE_URL` dan `VITE_SUPABASE_ANON_KEY` sudah ada dan benar
3. Pastikan tidak ada spasi tersembunyi di awal/akhir nilai variabel
4. Klik **Redeploy** setelah mengubah env vars

---

### ❌ Halaman putih / blank screen

**Penyebab:** Error JavaScript saat load awal.

**Solusi:**
1. Buka DevTools browser (F12) → tab **Console**
2. Lihat pesan error merah
3. Jika ada error `VITE_SUPABASE_URL is not defined` → pastikan env vars benar di Vercel

---

### ❌ Real-time sync tidak berfungsi

**Penyebab:** Tabel belum ditambahkan ke Supabase Realtime.

**Solusi:**
1. Buka Supabase → Database → Replication
2. Aktifkan toggle untuk semua tabel yang diperlukan

---

### ❌ Error saat menjalankan schema.sql

**Penyebab:** Konflik nama tabel (jarang terjadi karena schema menggunakan `IF NOT EXISTS`).

**Solusi:** Jalankan ulang hanya bagian schema yang gagal. Lihat pesan error spesifik di SQL Editor untuk menentukan baris yang bermasalah.

---

### ❌ Build gagal di Vercel

**Solusi:**
```powershell
# Test build di lokal dulu
cd "d:\Private File\Aba\VibeCoding\Aplikasi\rempah-story-pos"
npm install
npm run build
```

Jika build lokal sukses tapi Vercel gagal, kemungkinan perbedaan versi Node.js. Set di Vercel:
- **Settings → General → Node.js Version** → pilih `18.x`

---

### ❌ PWA tidak ter-update setelah deploy baru

**Solusi (hard refresh):**
- Windows/Linux: `Ctrl + Shift + R`
- Mac: `Cmd + Shift + R`
- Atau: DevTools → Application → Service Workers → klik **"Update"** → **"Skip Waiting"**

---

### ❌ Login berhasil tapi data tidak sinkron antar device

**Kemungkinan penyebab:**
1. Realtime belum diaktifkan di Supabase
2. RLS masih aktif dan memblokir query

**Solusi:** Periksa Langkah 6.3 (Realtime) dan 6.4 (RLS) kembali.

---

## 12. Checklist Final

Gunakan checklist ini sebelum memberikan akses ke klien:

### ✅ Supabase
- [ ] Project dibuat di region Singapore
- [ ] `supabase/schema.sql` berhasil dijalankan tanpa error
- [ ] RLS dinonaktifkan untuk semua tabel
- [ ] Realtime diaktifkan untuk semua tabel
- [ ] Kredensial API (URL + anon key) sudah dicatat dan disimpan aman

### ✅ GitHub
- [ ] Repository dibuat (Private)
- [ ] Kode berhasil di-push
- [ ] `.env` tidak ikut terupload (ada di `.gitignore`)

### ✅ Vercel
- [ ] Project terhubung ke repository GitHub
- [ ] `VITE_SUPABASE_URL` sudah diisi
- [ ] `VITE_SUPABASE_ANON_KEY` sudah diisi
- [ ] Build status: **Ready** (hijau)
- [ ] URL aplikasi bisa diakses dari browser

### ✅ Aplikasi
- [ ] Halaman login muncul tanpa error
- [ ] Login berhasil dengan akun Manager
- [ ] Data bisa ditambahkan dan tersimpan di Supabase
- [ ] Realtime sync berfungsi (uji di 2 browser berbeda)
- [ ] PWA bisa diinstall di perangkat mobile/desktop
- [ ] Password Manager default (`admin123`) sudah diganti

### ✅ Serah Terima ke Klien
- [ ] URL aplikasi diberikan
- [ ] Username dan password awal diberikan
- [ ] Panduan singkat penggunaan disiapkan
- [ ] Nomor kontak support diberikan

---

## Arsitektur Production

```
┌─────────────────────────────────────────────────────────────┐
│                        INTERNET                              │
└────────────────────────┬────────────────────────────────────┘
                         │ HTTPS (SSL otomatis)
              ┌──────────▼──────────┐
              │      VERCEL         │  ← Auto-deploy dari GitHub
              │  React + Vite PWA   │
              │  rempah-story.      │
              │  vercel.app         │
              └──────────┬──────────┘
                         │ REST API + WebSocket Realtime
              ┌──────────▼──────────┐
              │     SUPABASE        │
              │  PostgreSQL +       │
              │  Realtime +         │
              │  Storage            │
              │  Region: Singapore  │
              └─────────────────────┘
```

**Alur CI/CD:**
```
git push → GitHub → (auto-trigger) → Vercel Build → Deploy → Live
                                      (±1–2 menit)
```

---

## Estimasi Biaya

| Layanan | Paket Gratis | Batas Gratis | Paket Berbayar |
|---|---|---|---|
| **Vercel** | Hobby | Unlimited deploy, 100GB bandwidth/bulan | Pro: $20/bulan |
| **Supabase** | Free Tier | 500MB DB, 1GB storage, 50.000 MAU | Pro: $25/bulan |
| **Domain** | — | — | Rp 100.000–200.000/tahun |

> [!TIP]
> Untuk 1–5 klien kecil, **paket gratis sudah sangat cukup**. Upgrade ke berbayar hanya diperlukan jika volume transaksi sangat tinggi atau butuh backup otomatis harian dari Supabase.

---

*Dokumen ini diperbarui untuk **BerdikariPOS v4.4** — mencakup Atomic Transaction Engine, Snapshot Recipe & HPP, Template CSV Import, dan Backup & Restore Module.*
