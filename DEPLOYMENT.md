# 🚀 Panduan Deployment & Komersialisasi — Rempah Story POS

## Daftar Isi
1. [Apakah Harus Produksi Dulu?](#1-apakah-harus-produksi-dulu)
2. [Cara Deploy ke Produksi](#2-cara-deploy-ke-produksi)
3. [Setup untuk Setiap Klien Baru](#3-setup-untuk-setiap-klien-baru)
4. [Model Bisnis & Pricing](#4-model-bisnis--pricing)
5. [Panduan Pemakaian untuk Klien](#5-panduan-pemakaian-untuk-klien)
6. [Checklist Sebelum Jual](#6-checklist-sebelum-jual)

---

## 1. Apakah Harus Produksi Dulu?

**Ya, wajib.** Saat ini Anda menjalankan di `npm run dev` (development mode). Untuk dijual ke klien, Anda perlu:

| Dev Mode | Production Mode |
|----------|----------------|
| Jalan di komputer Anda | Jalan di server cloud (online 24/7) |
| Akses via IP lokal | Akses via domain (misal: pos.rempahstory.com) |
| Mati kalau komputer mati | Selalu online |
| Tidak aman (HTTP) | Aman (HTTPS) |
| Gratis | Biaya hosting ~Rp 0-100rb/bulan |

### Apa yang perlu di-deploy:
1. **Frontend (React app)** → hosting statis (Vercel/Netlify/Cloudflare Pages) — **GRATIS**
2. **Database (Supabase)** → sudah online, tidak perlu deploy lagi — **GRATIS** (tier free)

---

## 2. Cara Deploy ke Produksi

### Opsi A: Vercel (Rekomendasi — Gratis & Mudah)

**Langkah:**

1. **Buat akun GitHub** (jika belum): https://github.com
2. **Push kode ke GitHub:**
   ```bash
   cd "d:\Private File\Aba\VibeCoding\Aplikasi\Jamu POS\rempah-story-pos"
   git init
   git add .
   git commit -m "Initial commit - Rempah Story POS v2.3"
   git remote add origin https://github.com/USERNAME/rempah-story-pos.git
   git push -u origin main
   ```
3. **Buat akun Vercel**: https://vercel.com (login pakai GitHub)
4. **Import project**: Klik "New Project" → pilih repo `rempah-story-pos`
5. **Set Environment Variables** di Vercel:
   - `VITE_SUPABASE_URL` = `https://ppffuacvktsgfhacilte.supabase.co`
   - `VITE_SUPABASE_ANON_KEY` = `(anon key Anda)`
6. **Deploy** — Vercel otomatis build dan deploy
7. **Dapat URL**: `https://rempah-story-pos.vercel.app` (atau custom domain)

### Opsi B: Netlify (Alternatif Gratis)
Sama seperti Vercel, tinggal connect GitHub repo.

### Opsi C: VPS (Untuk kontrol penuh)
Jika ingin hosting sendiri (misal di DigitalOcean/AWS):
```bash
npm run build
# Upload folder dist/ ke server
# Serve dengan Nginx/Apache
```

### Custom Domain
Setelah deploy, Anda bisa pasang domain sendiri:
- Beli domain (misal: `pos.rempahstory.com`) di Niagahoster/Namecheap
- Arahkan DNS ke Vercel/Netlify
- HTTPS otomatis aktif

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
2. Jalankan `schema.sql` di SQL Editor
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

### ✅ Teknis
- [ ] Deploy ke Vercel/Netlify (production URL)
- [ ] Custom domain (opsional tapi profesional)
- [ ] HTTPS aktif (otomatis di Vercel)
- [ ] Test di device klien (tablet, HP, laptop)
- [ ] Test printer thermal klien
- [ ] Backup strategy (Supabase auto-backup di paid plan)

### ✅ Bisnis
- [ ] Tentukan pricing model
- [ ] Buat kontrak/agreement template
- [ ] Buat invoice template
- [ ] Siapkan WA Business untuk support
- [ ] Buat landing page/portfolio (opsional)

### ✅ Onboarding Klien
- [ ] Setup Supabase project untuk klien
- [ ] Jalankan schema.sql
- [ ] Deploy dengan env variables klien
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

1. **Buat akun GitHub** → push kode
2. **Buat akun Vercel** → deploy (5 menit)
3. **Test production URL** di HP/tablet
4. **Siapkan 1 klien pertama** (bisa toko Anda sendiri sebagai showcase)
5. **Buat WA Business** untuk support
6. **Mulai tawarkan** ke toko F&B di sekitar Anda

---

## FAQ

**Q: Apakah data klien aman?**
A: Ya. Setiap klien punya database terpisah di Supabase. Password di-hash dengan bcrypt. Koneksi HTTPS.

**Q: Bagaimana jika klien mau fitur tambahan?**
A: Charge sebagai custom development (Rp 500rb-2jt per fitur tergantung kompleksitas).

**Q: Bagaimana jika Supabase free tier habis?**
A: Upgrade ke Pro ($25/bulan) per klien, atau masukkan ke biaya langganan klien.

**Q: Bisa offline?**
A: Ya, PWA + localStorage. Data tetap tersimpan lokal. Sync ke cloud saat online kembali.

**Q: Support apa yang harus saya berikan?**
A: Bug fix, bantuan setup, training. Bukan custom development (itu charge terpisah).
