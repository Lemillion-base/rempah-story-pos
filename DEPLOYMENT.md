# 🚀 Panduan Deployment & Komersialisasi — BerdikariPOS

## Status: ✅ PRODUCTION LIVE
- **Hosting**: Vercel (auto-deploy)
- **Database**: Supabase (PostgreSQL + Real-time)
- **Repository**: https://github.com/Lemillion-base/rempah-story-pos
- **CI/CD**: Push ke GitHub → Vercel auto-build & deploy (1-2 menit)

## Daftar Isi
1. [Apakah Harus Produksi Dulu?](#1-apakah-harus-produksi-dulu)
2. [Cara Deploy ke Produksi](#2-cara-deploy-ke-produksi)
3. [Setup untuk Setiap Klien Baru](#3-setup-untuk-setiap-klien-baru)
4. [Model Bisnis & Pricing](#4-model-bisnis--pricing)
5. [Panduan Pemakaian untuk Klien](#5-panduan-pemakaian-untuk-klien)
6. [Checklist Sebelum Jual](#6-checklist-sebelum-jual)

---

## 1. Apakah Harus Produksi Dulu?

**✅ SUDAH PRODUCTION.** Aplikasi sudah live di Vercel dengan:
- HTTPS otomatis
- Cloud database (Supabase) aktif
- Real-time sync antar device berfungsi (100% coverage — semua tabel)
- PWA installable
- Full cloud sync: delete propagation, fullSync mode, 13 data types

### Arsitektur Production:
```
[Vercel] ← auto-deploy ← [GitHub repo]
    ↕ HTTPS
[Browser/PWA di device manapun]
    ↕ Real-time
[Supabase PostgreSQL + Real-time subscriptions]
```

---

## 2. Cara Deploy Update

Setiap kali ada perubahan kode, cukup push ke GitHub:

```bash
cd "d:\Private File\Aba\VibeCoding\Aplikasi\Jamu POS\rempah-story-pos"
git add .
git commit -m "deskripsi perubahan"
git push origin main
```

Vercel otomatis detect push dan re-deploy dalam 1-2 menit. Tidak perlu setup ulang.

### Jika Perlu Tambah/Ubah Environment Variables:
1. Buka https://vercel.com → pilih project
2. Settings → Environment Variables
3. Edit/tambah variabel
4. Klik "Redeploy" di tab Deployments

---

## 3. Setup untuk Setiap Klien Baru

Setiap klien (toko) yang beli aplikasi Anda perlu:

### Opsi A: Shared Database (Mudah, tapi data campur)
- Semua klien pakai 1 Supabase project
- Tambahkan field `store_id` di setiap tabel untuk pisahkan data
- **Pro**: Mudah manage, 1 deployment
- **Con**: Perlu modifikasi kode, risiko data bocor

### Opsi B: Separate Database per Klien (Rekomendasi)
- Setiap klien punya Supabase project sendiri
- Anda deploy 1 frontend, tapi env variables berbeda per klien
- **Pro**: Data 100% terpisah, aman
- **Con**: Perlu manage banyak project

### Opsi C: Multi-tenant (Skala besar)
- 1 database, tapi dengan Row Level Security per tenant
- Perlu Supabase Auth + custom claims
- **Pro**: Scalable
- **Con**: Kompleks, perlu development lanjutan

### Setup Cepat untuk 1 Klien Baru:
1. Buat Supabase project baru (gratis)
2. Jalankan `schema.sql` di SQL Editor.
   > [!NOTE]
   > Jika meng-upgrade database klien lama ke versi 3.1, jalankan perintah berikut di SQL Editor Supabase untuk mendukung fitur pembatasan login device, split printing dapur, tema warna dinamis, dan fleksibilitas opsi level gula menu:
   > ```sql
   > ALTER TABLE users ADD COLUMN IF NOT EXISTS active_session_id TEXT;
   > ALTER TABLE menus ADD COLUMN IF NOT EXISTS kitchen_target TEXT DEFAULT NULL;
   > ALTER TABLE settings ADD COLUMN IF NOT EXISTS kitchen_printers JSONB DEFAULT '[]';
   > ALTER TABLE settings ADD COLUMN IF NOT EXISTS theme_color TEXT;
   > ALTER TABLE settings ADD COLUMN IF NOT EXISTS theme_shades JSONB;
   > ALTER TABLE menus ADD COLUMN IF NOT EXISTS show_sugar_level BOOLEAN DEFAULT TRUE;
   > ```
3. Deploy frontend ke Vercel dengan env variables klien tersebut
4. Berikan URL + akun login ke klien
5. Klien bisa langsung pakai

---

## 4. Model Bisnis & Pricing

### Model SaaS (Langganan Bulanan) — Rekomendasi

| Paket | Harga/bulan | Fitur |
|-------|-------------|-------|
| **Starter** | Rp 99.000 | 1 outlet, 2 user, basic reports |
| **Business** | Rp 199.000 | 1 outlet, unlimited user, full reports + PDF |
| **Pro** | Rp 399.000 | Multi-outlet, priority support, custom branding |

### Model Lisensi (Bayar Sekali)

| Paket | Harga | Fitur |
|-------|-------|-------|
| **Basic** | Rp 1.500.000 | Aplikasi + setup + 1 bulan support |
| **Premium** | Rp 3.000.000 | + training + 6 bulan support + custom menu |
| **Enterprise** | Rp 5.000.000+ | + custom fitur + unlimited support |

### Biaya Operasional Anda:
- Vercel hosting: **Gratis** (tier hobby)
- Supabase per klien: **Gratis** (tier free, 500MB database)
- Domain: **Rp 100-150rb/tahun** per klien (opsional)
- **Total biaya per klien: Rp 0 - 15rb/bulan**

### Revenue Projection:
- 10 klien × Rp 199.000/bulan = **Rp 1.990.000/bulan**
- 50 klien × Rp 199.000/bulan = **Rp 9.950.000/bulan**
- Biaya Anda: hampir Rp 0 (semua tier gratis)

---

## 5. Panduan Pemakaian untuk Klien

### Dokumen yang Perlu Anda Siapkan:

#### A. Quick Start Guide (1 halaman)
```
PANDUAN CEPAT — [Nama Toko] POS

1. Buka [URL] di browser Chrome
2. Login:
   - Manager: [username] / [password]
   - Kasir: [username] / [password]  
   - Acaraki: [username] / [password]

3. Kasir: Buka shift → Buat pesanan → Bayar → Tutup shift
4. Acaraki: Lihat pesanan → Proses → Selesai
5. Manager: Lihat laporan, kelola menu, atur promo

Butuh bantuan? Hubungi: [WA Anda]
```

#### B. User Manual (per role)

**Untuk Kasir:**
- Cara buka/tutup shift
- Cara buat pesanan (pilih menu, kustomisasi, bayar)
- Cara pakai voucher/promo
- Cara pilih pelanggan

**Untuk Acaraki:**
- Cara baca KDS
- Cara proses pesanan (Waiting → Processing → Done)
- Arti alert merah (> 5 menit)

**Untuk Manager:**
- Cara baca dashboard
- Cara kelola menu & harga
- Cara buat promo/voucher
- Cara export laporan (PDF/CSV)
- Cara tambah user baru

#### C. Kontrak/Agreement
- Scope layanan
- SLA (uptime guarantee)
- Harga & pembayaran
- Support terms

---

## 6. Checklist Sebelum Jual

### ✅ Teknis (DONE)
- [x] Deploy ke Vercel (production URL aktif)
- [x] HTTPS aktif (otomatis di Vercel)
- [x] Cloud sync berfungsi (Supabase real-time — 100% coverage)
- [x] Real-time subscriptions di semua halaman (POS, KDS, Transaksi, Katalog, dll)
- [x] Delete propagation antar device (fullSync pattern)
- [x] PWA installable
- [x] Password hashing (bcrypt)
- [x] Error boundary (crash handling)
- [x] Code-splitting (fast load)
- [x] Custom categories cloud sync
- [x] Konfirmasi void/cancel transaksi (Manager)
- [x] Clear cart button (2+ items)
- [x] Restriksi Multi-login Device (satu session aktif per user)

### ✅ Bisnis
- [ ] Tentukan pricing model
- [ ] Buat kontrak/agreement template
- [ ] Buat invoice template
- [ ] Siapkan WA Business untuk support
- [ ] Buat landing page/portfolio (opsional)

### ✅ Onboarding Klien Baru
- [ ] Buat Supabase project baru untuk klien
- [ ] Jalankan schema.sql di SQL Editor
- [ ] Deploy frontend baru di Vercel dengan env variables klien
- [ ] Input menu & harga klien
- [ ] Input bahan baku & stok awal
- [ ] Buat akun user (manager, kasir, acaraki)
- [ ] Training 1-2 jam (bisa via video call)
- [ ] Berikan Quick Start Guide

### ✅ Branding per Klien
- [ ] Ganti nama toko di Settings
- [ ] Upload logo toko
- [ ] Input alamat
- [ ] Sesuaikan kategori menu

---

## Langkah Pertama Anda Sekarang

1. ~~Buat akun GitHub → push kode~~ ✅ DONE
2. ~~Buat akun Vercel → deploy~~ ✅ DONE
3. ~~Test production URL~~ ✅ DONE
4. **Siapkan 1 klien pertama** (bisa toko Anda sendiri sebagai showcase)
5. **Buat WA Business** untuk support
6. **Mulai tawarkan** ke toko F&B di sekitar Anda
7. **Pasang custom domain** (opsional, Rp 100-150rb/tahun)

---

## FAQ

**Q: Apakah data klien aman?**
A: Ya. Setiap klien punya database terpisah di Supabase. Password di-hash dengan bcrypt. Koneksi HTTPS. Namun, pastikan mengaktifkan Row Level Security (RLS) di Supabase production untuk pengamanan optimal.

**Q: Bagaimana jika koneksi real-time terputus saat perangkat sleep?**
A: Sistem POS dilengkapi dengan auto-reconnect. Namun jika koneksi tersendat, kasir cukup melakukan swipe-refresh/reload halaman, dan offline queue akan otomatis mengunggah perubahan tertunda saat online.

**Q: Bagaimana jika klien mau fitur tambahan?**
A: Charge sebagai custom development (Rp 500rb-2jt per fitur tergantung kompleksitas).

**Q: Bagaimana jika Supabase free tier habis?**
A: Upgrade ke Pro ($25/bulan) per klien, atau masukkan ke biaya langganan klien.

**Q: Bisa offline?**
A: Ya, PWA + localStorage. Data tetap tersimpan lokal. Sync ke cloud saat online kembali.

**Q: Support apa yang harus saya berikan?**
A: Bug fix, bantuan setup, training. Bukan custom development (itu charge terpisah).
