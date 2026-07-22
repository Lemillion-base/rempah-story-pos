# 🏪 BerdikariPOS — Daftar Fitur & Keunggulan

## Aplikasi Point of Sale Modern untuk Berbagai Jenis Usaha

---

## 🎯 Ringkasan

BerdikariPOS adalah sistem kasir berbasis web multi-purpose yang dirancang untuk berbagai jenis usaha (F&B, retail, kelontong, jasa, salon, laundry, bakery, dll). Menghubungkan kasir, bagian dapur/pemenuhan, dan manajemen dalam satu platform terintegrasi dengan cloud sync real-time.

---

## ✨ Fitur Utama

### 1. 🛒 Point of Sale (Kasir)
- Tampilan grid produk dengan foto atau inisial
- Filter kategori + pencarian cepat
- Kustomisasi pesanan: suhu (hangat/dingin), level gula, add-ons
  - Suhu dan level gula dapat dinonaktifkan per produk (misal makanan tanpa pilihan suhu)
- Keranjang belanja dengan quantity controls
- **Kosongkan keranjang 1-klik** (muncul jika item ≥ 2, dengan konfirmasi)
- Diskon manual (nominal Rupiah)
- Input kode voucher atau pilih promo aktif
- Pilih pelanggan dari daftar CRM (dropdown)
- 3 metode pembayaran: Cash, QRIS, Transfer Bank
- Kalkulator kembalian otomatis + quick cash buttons
- Nomor antrean otomatis (reset harian)
- Cetak struk otomatis (browser print / Bluetooth thermal)
- Validasi stok sebelum checkout (warning jika bahan kurang)
- Keyboard shortcut: F1 = Bayar, Esc = Batal
- Mobile: keranjang minimize/maximize (floating bar)
- **Tipe pesanan**: Dine In / Take Away (pilihan di checkout)
- **Real-time sync**: perubahan menu/inventory/customer/settings dari device lain langsung ter-reflect

### 2. 🍳 Kitchen Display System (KDS)
- Kanban board 3 kolom: Menunggu → Proses → Selesai
- Detail pesanan: nomor antrean, item, suhu, gula, add-ons, quantity, **tipe pesanan (Dine In/Take Away)**
- Info waktu masuk + nama kasir per pesanan
- Alert visual + suara jika pesanan menunggu > 5 menit
- Tombol 1-klik untuk pindah status
- Sound alarm custom (file .wav bisa diganti)
- Real-time sync: pesanan dari kasir langsung muncul di KDS (multi-device)
- **Hanya menampilkan transaksi hari ini** (transaksi lama tidak tampil)
- Reset tampilan saat Acaraki logout + print ringkasan

### 3. 💰 Manajemen Shift & Kas
- Buka shift wajib: input modal kas awal sebelum mulai kerja (untuk Manager, ditunda dan hanya ditanyakan saat mengakses halaman POS)
- Tutup shift wajib: input kas aktual di laci (tidak bisa skip)
- Kalkulasi otomatis: expected cash vs aktual → selisih
- Print ringkasan transaksi saat tutup shift
- Riwayat shift lengkap untuk laporan Manager
- Indikator "Shift Aktif" di sidebar

### 4. 📊 Dashboard & Analitik (Manager)
- Pendapatan hari ini, jumlah transaksi, menu terlaris, laba kotor
- Grafik omset (harian/mingguan/bulanan/tahunan)
- Distribusi metode pembayaran (pie chart)
- Top 10 menu terlaris (scrollable)
- Alert stok rendah (scrollable)
- P&L sederhana: Revenue - HPP = Laba Kotor

### 5. 📋 Laporan Komprehensif
- **5 tab laporan**: Laba Rugi, Transaksi, Kas Kasir, Stok Bahan, Shift Karyawan
- Filter periode: Hari Ini, 7 Hari, Bulan, Custom (date range)
- **Distribusi Tipe Pesanan**: Doughnut chart Dine In vs Take Away
- Export ke **CSV** (Excel-compatible)
- Export ke **PDF** (profesional, siap share ke investor)
- Tabel scrollable dengan sticky header

### 6. 📦 Manajemen Katalog & Harga
- CRUD menu lengkap dengan foto produk
- Kategori dropdown (bisa tambah/hapus kategori)
- Kalkulasi HPP otomatis berdasarkan komposisi bahan ATAU input HPP Manual jika produk tidak menggunakan bahan baku (produk jadi)
- Add-ons per menu (nama + harga)
- Toggle ketersediaan menu (aktif/nonaktif tanpa hapus)
- Import/Export CSV untuk update massal
- Pagination + search + filter

### 7. 🏪 Inventaris Bahan Baku
- CRUD bahan baku (nama, stok, unit, harga/unit, min. stok)
- Auto-deduct stok saat transaksi (berdasarkan komposisi menu)
- Alert stok rendah (threshold bisa diatur per item atau global)
- Riwayat perubahan stok (stock log) — siapa, kapan, berapa
- Import/Export CSV
- Pagination (10/25/50/100 per halaman)
- Summary cards: total item, stok rendah, nilai inventaris

### 7a. 📋 Stock Opname
- Rekonsiliasi stok fisik vs stok sistem secara berkala
- Input stok aktual per item, otomatis hitung selisih & kerugian
- Pencatatan alasan penyesuaian per item (Basi, Rusak, Salah Input)
- Verifikasi PIN Manager untuk selisih signifikan
- Riwayat opname tersimpan dan tercatat di stock log

### 8. 🎁 Promo, Voucher & Loyalty
- CRUD promo/voucher dengan masa berlaku
- Tipe diskon: persentase (%) atau nominal tetap (Rp)
- Scope: semua menu, kategori tertentu, atau pelanggan loyal
- Kode voucher (input manual di POS)
- Dropdown promo aktif di POS
- Batas penggunaan + tracking usage
- **Loyalty Member System**:
  - 3 tier: Bronze, Silver, Gold
  - Diskon otomatis berdasarkan jumlah kunjungan
  - Pengaturan min. kunjungan & persentase diskon per tier

### 9. 👥 CRM Pelanggan
- CRUD pelanggan (nama, HP, email, catatan)
- Tracking otomatis: total belanja, jumlah kunjungan
- Integrasi POS: pilih pelanggan saat transaksi
- **WhatsApp Marketing**: kirim pesan promosi langsung ke pelanggan
- Template pesan editable
- Format nomor otomatis (08xx → 62xx)

### 10. 🖨️ Printer Thermal
- **Browser Print**: window.print() dengan format thermal paper
- **Bluetooth ESC/POS**: Web Bluetooth API untuk cetak langsung
- **Lebar kertas**: 58mm atau 80mm
- **Auto-print saat checkout**: (toggle on/off)
- **Format struk**: nama toko, alamat, item, total, kembalian, footer
- **Split Printing (Printer Dapur & Bar)**: Otomatis mencetak pesanan makanan dan minuman ke printer dapur masing-masing secara terpisah berdasarkan kategori dapur yang di-set pada menu, sementara kasir mencetak struk utuh untuk pelanggan. Dukungan browser print dan bluetooth per printer.

### 11. 🛡️ Keamanan & Audit
- Password hashing (bcrypt, 10 salt rounds)
- PIN Manager untuk otorisasi void/hapus transaksi
- Super Admin PIN untuk akses Manajemen Data
- Role-Based Access Control (4 role: Manager, Kasir, Acaraki, Staf Gudang)
- Konfirmasi dialog untuk semua aksi destruktif
- Validasi username unik
- **Audit Log**: semua aksi user tercatat (login, CRUD, transaksi, shift)
- **Konfirmasi void/cancel**: Manager mendapat dialog konfirmasi sebelum void/cancel transaksi
- **Restriksi Multi-login Device**: membatasi masing-masing user agar hanya bisa login aktif di satu perangkat saja (login di perangkat baru otomatis mengeluarkan perangkat lama)
- Export audit log ke CSV
- **Customer visit revert**: visitCount & totalSpent otomatis dikurangi saat transaksi di-cancel

### 12. ⚙️ Settings & Konfigurasi
- **Tabbed Layout**: Halaman pengaturan diorganisasikan ke dalam 3 tab utama (*Umum & Tampilan*, *Printer & KDS*, *Pengguna & Sistem*) untuk tampilan yang rapi dan menghemat space di desktop maupun mobile.
- **Pengaturan Toko**: Nama, logo (base64), dan alamat toko.
- **Pengaturan Tema Warna UI**: Mengatur skema warna aplikasi secara dinamis dengan live preview instan. Bisa memilih preset (Jamu Original, Matcha Green, Telang Blue, Rosella Red, Charcoal Slate), generate gradasi otomatis dari warna dasar, atau mengubah per shade warna secara manual. Skema warna ini ter-sync di Supabase.
- **PIN Manager**: PIN 4-6 digit terenkripsi untuk otorisasi void/pembatalan transaksi oleh manager.
- **Integrasi Printer Thermal & Kitchen Printers (Split Print)**.
- **Manajemen User**: Tambah, ubah, dan hapus user beserta rolenya.
- **Manajemen Data** (dilindungi Super Admin PIN):
  - Mode Demo on/off
  - Bersihkan data transaksi (fresh start)
  - Reset ke default (demo)
  - Factory reset (hapus semua + cloud)

---

## 🏆 Keunggulan Kompetitif

### vs Aplikasi POS Lain

| Keunggulan | Detail |
|-----------|--------|
| **Gratis hosting** | Vercel (frontend) + Supabase (database) = Rp 0/bulan |
| **Multi-device real-time** | Kasir di tablet, KDS di TV, Manager di laptop — semua sync |
| **Offline-capable** | Tetap berfungsi 100% tanpa internet, auto-sync saat online |
| **PWA installable** | Install di homescreen seperti native app, tanpa app store |
| **Open Kitchen ready** | KDS dengan alert 5 menit + sound notification |
| **HPP otomatis** | Hitung cost of goods sold per menu berdasarkan komposisi |
| **Shift management** | Serah terima kas akuntabel, tidak bisa di-skip |
| **WhatsApp CRM** | Kirim promo langsung ke pelanggan |
| **Loyalty system** | Tier Bronze/Silver/Gold dengan auto-discount |
| **PDF reports** | Laporan profesional siap share ke investor |
| **Audit trail** | Semua aksi tercatat untuk akuntabilitas |
| **No vendor lock-in** | Open source, self-hosted, data milik Anda |

### Arsitektur Teknis

| Aspek | Implementasi |
|-------|-------------|
| **Local-first** | Data di localStorage, instant response, no loading |
| **Cloud sync** | Background sync ke Supabase (PostgreSQL) — 100% coverage |
| **Offline queue** | Operasi gagal di-queue, auto-retry saat online |
| **Real-time** | Supabase subscriptions di SEMUA halaman (POS, KDS, Transaksi, Katalog, Inventaris, Promo, CRM, Settings) |
| **fullSync** | Delete propagation antar device — cloud = sumber kebenaran |
| **Code-splitting** | React.lazy() per halaman, fast initial load |
| **Error boundary** | Crash tidak white-screen, ada recovery UI |
| **Offline queue indicator** | Badge real-time di sidebar menampilkan jumlah operasi pending sync |
| **Settings conflict notification** | Toast warning saat perubahan lokal ditimpa oleh cloud |
| **Type-safe** | Full TypeScript, 0 compile errors |
| **Modern UI** | TailwindCSS, responsive, dark-friendly colors |

---

## 📱 Kompatibilitas

| Platform | Status |
|----------|--------|
| Chrome (Desktop) | ✅ Full support |
| Chrome (Android) | ✅ Full support + PWA install |
| Safari (iOS) | ✅ Support (PWA limited) |
| Edge | ✅ Full support |
| Firefox | ✅ Support (no Bluetooth print) |
| Tablet Android | ✅ Optimal untuk kasir & KDS |
| Smart TV (browser) | ✅ Bisa untuk KDS display |

---

## 🔐 Role & Akses

| Menu | Manager | Kasir | Acaraki |
|------|---------|-------|---------|
| Dashboard | ✅ | ❌ | ❌ |
| POS | ✅ | ✅ | ❌ |
| Kitchen (KDS) | ✅ | ❌ | ✅ |
| Transaksi | ✅ | ✅ | ❌ |
| Katalog | ✅ | ❌ | ❌ |
| Inventaris | ✅ | ❌ | ❌ |
| Promo & Loyalty | ✅ | ❌ | ❌ |
| Laporan | ✅ | ❌ | ❌ |
| Pelanggan | ✅ | ✅ | ❌ |
| Audit Log | ✅ | ❌ | ❌ |
| Settings | ✅ | ❌ | ❌ |
| Stock Opname | ✅ | ❌ | ❌ |

---

## 💡 Use Case

Cocok untuk:
- ☕ Kafe & coffee shop
- 🍵 Kedai jamu modern
- 🧋 Bubble tea / minuman kekinian
- 🍜 Restoran kecil / warung makan
- 🍰 Bakery & pastry shop
- 🥤 Juice bar & smoothie bar
- 🍕 Fast food / quick service restaurant

---

## 📈 Roadmap (Coming Soon)

- [ ] Auto-Reconnect & Visibility State listener (Koneksi realtime anti-sleep)
- [ ] Supabase Row Level Security (RLS) policies (Keamanan basis data ketat)
- [ ] WhatsApp PDF receipt & daily shift summaries
- [ ] Multi-outlet support
- [ ] QR Code self-order (scan dari meja)
- [ ] Integrasi payment gateway (QRIS otomatis)
- [ ] Push notification (stok rendah, pesanan lama)
- [ ] Multi-language (English)
- [ ] AI menu recommendation

### ✅ Recently Completed (v3.2–v3.4)
- [x] Pengaturan suhu & gula per produk (sembunyikan untuk makanan)
- [x] Tipe pesanan Dine In / Take Away
- [x] Stock Opname module (rekonsiliasi stok fisik)
- [x] Error Boundary (crash recovery UI)
- [x] Offline queue indicator di sidebar
- [x] Order type analytics di laporan (Doughnut chart)
- [x] Settings merge conflict notification
- [x] Customer visit revert saat transaksi cancel
- [x] Discount preview capping (konsisten dengan checkout)
- [x] Offline queue dependency-ordered flush

---

*Dokumen ini menggambarkan fitur aplikasi BerdikariPOS v3.4 yang sudah live di production.*
