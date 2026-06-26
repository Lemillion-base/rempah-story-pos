# Product Requirements Document (PRD)

## Project Name: POS Rempah Story
## Product Version: 3.1 (Production)
## Document Status: Production Ready
## Last Updated: 25 Mei 2026
## Production URL: Deployed on Vercel
## Repository: https://github.com/Lemillion-base/rempah-story-pos

---

## 1. Product Overview

**Rempah Story POS** adalah aplikasi Point of Sale (Sistem Kasir) berbasis web yang dirancang khusus untuk bisnis F&B modern dengan konsep Open Kitchen (kafe jamu modern). Sistem ini menghubungkan pesanan dari Kasir langsung ke layar Acaraki (Dapur) secara real-time melalui shared state, menyediakan dashboard analitik komprehensif untuk Manager, serta fitur CRM pelanggan dan manajemen shift kasir.

### 1.1. Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | React 18 + TypeScript |
| Build Tool | Vite 5 |
| Styling | TailwindCSS 3.4 |
| State Management | Zustand 4.5 + persist middleware (localStorage) |
| Cloud Database | Supabase (PostgreSQL + Real-time) |
| Routing | React Router v6 |
| Charts | Chart.js 4 + react-chartjs-2 |
| PDF Export | jsPDF + jspdf-autotable |
| Password Hashing | bcryptjs |
| PWA | vite-plugin-pwa (Workbox) |
| Icons | Lucide React |
| ID Generation | uuid v9 |
| Hosting | Vercel (Production) |
| Repository | GitHub |
| ID Generation | uuid v9 |

### 1.2. Objektif

- Menyediakan antarmuka kasir yang cepat, intuitif, dan mobile-friendly.
- Menghilangkan miskomunikasi antara kasir dan dapur melalui Kitchen Display System (KDS).
- Mengotomatisasi perhitungan Harga Pokok Penjualan (HPP) berdasarkan komposisi bahan baku.
- Menyediakan laporan penjualan, inventaris, shift karyawan, dan kas kasir secara real-time.
- Mengelola data pelanggan (CRM) dengan fitur WhatsApp marketing.
- Menerapkan manajemen shift kasir dengan serah terima kas yang akuntabel.

---

## 2. User Personas & Roles (RBAC)

Sistem menggunakan Role-Based Access Control (RBAC) dengan 3 peran utama:

### 2.1. Manager (Admin)
- **Akses**: Seluruh sistem (Dashboard, POS, Dapur, Transaksi, Katalog, Inventaris, Laporan, Pelanggan, Settings)
- **Fokus**: Analisis dashboard, manajemen katalog & harga, laporan keuangan, otorisasi void transaksi, pengaturan toko & printer

### 2.2. Kasir (Frontdesk)
- **Akses**: POS, Transaksi, Pelanggan
- **Fokus**: Pembuatan pesanan, serah terima kas (shift management), melihat riwayat transaksi harian
- **Wajib**: Input modal kas awal saat buka shift, input kas aktual + print ringkasan saat tutup shift

### 2.3. Acaraki (Kitchen)
- **Akses**: Dapur (KDS) saja
- **Fokus**: Mengubah status antrean pesanan (Waiting → Processing → Done)
- **Wajib**: Print ringkasan pesanan selesai saat logout (opsional skip)

---

## 3. Functional Requirements (Fitur Lengkap)

### 3.1. Modul Autentikasi
- **Login**: Username + password
- **Routing otomatis**: Manager → Dashboard, Kasir → POS, Acaraki → Kitchen
- **Demo accounts** ditampilkan di halaman login:
  - Manager: `manager` / `manager123`
  - Kasir: `kasir` / `kasir123`
  - Acaraki: `acaraki` / `acaraki123`
- **Restriksi Multi-login Device**: Setiap user dibatasi hanya boleh memiliki satu session aktif di satu perangkat. Jika user login di perangkat/browser lain, session di perangkat lama otomatis ter-logout (kicked out) secara real-time via Supabase realtime subscription.

### 3.2. Modul Shift Management (Kasir)
- **Buka Shift (Wajib)**:
  - Modal muncul otomatis setelah login Kasir
  - Input modal kas awal (quick amount buttons: 100rb–1jt)
  - Tidak bisa mengakses POS sebelum shift dibuka
  - Indikator "Shift Aktif" di sidebar dengan info modal awal
- **Tutup Shift (Wajib)**:
  - Tombol "Tutup Shift" menggantikan "Keluar" di sidebar
  - Modal menampilkan ringkasan: modal awal, total penjualan, jumlah transaksi, expected cash
  - Input kas aktual di laci **WAJIB** (tidak bisa di-skip)
  - Kalkulasi selisih otomatis (warna hijau/merah)
  - **Wajib print** ringkasan transaksi hari ini sebelum logout
  - Data shift tersimpan untuk laporan Manager

### 3.3. Modul POS (Kasir)
- **Katalog Produk**: Grid card dengan gambar produk (atau inisial nama jika belum ada foto)
- **Filter**: Kategori (Semua, Best Seller, per kategori) + Search
- **Kustomisasi Pesanan (Modal)**:
  - Pilihan Suhu: Hangat / Dingin
  - Level Gula: Normal / Less / None
  - Add-ons opsional (multi-select)
  - Quantity selector
  - Preview total harga
- **Keranjang Belanja**:
  - Item list dengan quantity +/- controls
  - Detail kustomisasi per item
  - Hapus item
  - **Mobile: Minimize/Maximize**
    - Minimized: Floating bar di bawah layar (jumlah item + total). Tap untuk expand.
    - Maximized: Overlay slide-up dari bawah (max 85vh) dengan backdrop. Tap backdrop/chevron untuk minimize.
    - Product grid mendapat padding-bottom agar tidak tertutup floating bar.
    - Desktop: Tetap sidebar kanan (tidak berubah).
- **Pilih Pelanggan**: Dropdown dari daftar CRM (opsional)
- **Diskon Manual**: Input nominal Rupiah
- **Promo & Voucher di POS**:
  - Input kode voucher (monospace) + tombol OK → validasi otomatis
  - Dropdown pilih promo aktif yang sedang berjalan
  - Badge hijau saat promo diterapkan (nama + nominal + tombol hapus)
  - Loyalty discount otomatis jika pelanggan terpilih punya tier
  - Total diskon = manual + promo + loyalty (ditampilkan gabungan)
  - Promo usage count otomatis bertambah setelah transaksi
- **Checkout**:
  - 3 metode pembayaran: Cash, QRIS, Transfer Bank
  - Kalkulator kembalian otomatis (Cash)
  - Quick cash buttons (Rp 20rb, 50rb, 100rb)
  - Nomor antrean otomatis
  - Info pelanggan terpilih
- **Auto-deduct inventory**: Stok bahan baku otomatis berkurang sesuai komposisi
- **HPP tracking**: Setiap transaksi menyimpan total HPP
- **Cetak Struk Otomatis**: Setelah pembayaran selesai, jika printer diaktifkan di Settings, struk otomatis dicetak (format monospace, lebar sesuai pengaturan 58mm/80mm). Berisi: nama toko, alamat, nomor antrean, tanggal, kasir, pelanggan, daftar item + kustomisasi, subtotal, diskon, total, metode bayar, kembalian.
- **Validasi Stok**: Sebelum checkout, sistem mengecek ketersediaan bahan baku. Jika kurang, muncul modal peringatan (detail bahan + jumlah). Kasir bisa batal atau lanjutkan tetap.
- **Nomor Antrean Reset Harian**: Otomatis reset ke 1 setiap hari baru (menggunakan `lastQueueDate` tracking).
- **Menu Availability Filter**: Menu dengan `isAvailable: false` otomatis tersembunyi dari grid POS.
- **Keyboard Shortcuts**: F1 = Bayar, Escape = Tutup modal.
- **Toast Notifications**: Feedback visual saat tambah ke cart dan transaksi berhasil.
- **Clear Cart (FEAT-4)**: Tombol kosongkan keranjang di header cart (muncul jika item ≥ 2) dengan konfirmasi. Tersedia di mobile dan desktop.
- **Real-time Sync (GAP-3 fix)**: POS subscribe ke tabel menus, inventory, customers, dan settings. Perubahan dari device lain (Manager) langsung ter-reflect tanpa reload.

### 3.4. Modul KDS / Acaraki (Dapur)
- **Kanban Board 3 kolom**:
  1. Antrean Menunggu (Waiting) — border amber
  2. Sedang Diproses (Processing) — border blue
  3. Selesai (Done) — border green
- **Detail Tiket**: Nomor antrean (bold besar), nama produk, suhu, level gula, quantity, add-ons, waktu masuk, nama kasir
- **Aksi**: Tombol 1-klik untuk memindahkan status ke tahap berikutnya
- **Alert 5 Menit**:
  - Pesanan Waiting > 5 menit: card merah + animasi pulse + badge durasi
  - Tombol "Proses" animasi bounce untuk menarik perhatian
  - Banner global di atas: "X pesanan menunggu > 5 menit!"
- **Sound Alert**: Bunyi alarm custom (`/sounds/kds-alarm.wav`) otomatis saat pesanan baru masuk ke Waiting. File audio bisa diganti sesuai keinginan.
- **Reset KDS**: Setelah Acaraki print & logout, kolom "Done" di-reset (pesanan lama tidak tampil lagi)
- **Filter Hari Ini**: KDS hanya menampilkan transaksi hari ini. Transaksi dari hari sebelumnya tidak muncul.
- **Logout Acaraki**: Modal ringkasan pesanan selesai hari ini + opsi Print / Lewati

### 3.5. Modul Riwayat Transaksi
- **Daftar Transaksi Harian**: Nomor antrean, waktu, metode pembayaran, total, status
- **Detail Akordeon**: Klik untuk lihat rincian item, kustomisasi, diskon
- **Ubah Status / Void**: Selesai, Cancel, Demo
- **Hapus Permanen**
- **Keamanan**: Non-manager wajib input PIN Manager (modal custom, bukan browser prompt)
- **Konfirmasi Void (FEAT-5)**: Manager mendapat ConfirmDialog sebelum void/cancel/delete transaksi (warna merah untuk delete/cancel, kuning untuk ubah status lain)
- **Real-time Sync**: Transaksi yang dihapus/diubah di device lain langsung ter-reflect

### 3.6. Modul Dashboard (Manager)
- **Stats Cards**: Pendapatan hari ini, jumlah transaksi, menu terlaris, laba kotor
- **Grafik Omset (Chart.js Bar)**: Filter Harian/Mingguan/Bulanan/Tahunan
- **Metode Pembayaran (Doughnut Chart)**: Cash, QRIS, Transfer
- **Top Menu**: Daftar menu terlaris (max-height scroll, hingga 10 item)
- **Stok Rendah Alert**: Daftar bahan di bawah minimum (max-height scroll)
- **P&L Sederhana**: Pendapatan, HPP, Laba Kotor, Expected Cash

### 3.7. Modul Katalog & Harga (Manager)
- **Tabel Katalog**: Pagination (10/halaman), Search, Filter Category
- **CRUD Menu**: Tambah/Edit/Hapus produk (dengan konfirmasi dialog sebelum hapus)
- **Menu Availability Toggle**: Tombol on/off per menu di tabel katalog. Menu nonaktif tidak tampil di POS tapi tetap ada di katalog. Badge "Nonaktif" ditampilkan.
- **Form Menu**:
  - Nama, Kategori (dropdown dari daftar), Harga Jual
  - Best Seller toggle
  - **Upload Foto Produk** (base64, maks 500KB)
  - Komposisi Bahan (pilih dari inventaris + jumlah) → HPP otomatis
  - **HPP Manual (Opsi)**: Input HPP manual jika produk tidak menggunakan Komposisi Bahan (produk jadi seperti minuman botol atau makanan ringan)
  - Add-ons (nama + harga)
  - Preview HPP estimasi real-time (atau input manual HPP)
- **Manajemen Kategori**: Modal terpisah untuk tambah/hapus kategori
- **Import/Export CSV**: Download & upload katalog menu lengkap

### 3.8. Modul Inventaris (Manager)
- **Summary Cards**: Total item, stok rendah, nilai inventaris total
- **Tabel Bahan Baku**: ID, nama, stok, unit, harga/unit, min. stok, nilai, status
- **Pagination**: 10/25/50/100 item per halaman
- **Filter**: Search + status (Semua / Stok Rendah)
- **CRUD Bahan**: Tambah/Edit/Hapus
- **Pengaturan Min. Stok Global**: Terapkan threshold ke semua item sekaligus
- **Import/Export CSV**: Download & upload data inventaris
- **Auto-deduct**: Stok otomatis berkurang saat transaksi POS

### 3.9. Modul Laporan (Manager)
- **Filter Tanggal**: Hari Ini, 7 Hari, Bulan (month picker), Custom (date range)
- **5 Tab Laporan**:

#### Tab 1: Laba Rugi (P&L)
- Cards: Total Pendapatan, HPP, Laba Kotor, Margin %
- Detail: Revenue, Diskon, HPP, Laba Kotor, Jumlah Tx, Rata-rata/Tx
- Distribusi Pembayaran (Doughnut Chart + breakdown)
- Penjualan per Kategori

#### Tab 2: Transaksi
- Cards: Total Transaksi, Total Pendapatan, Rata-rata/Transaksi
- Tabel riwayat transaksi (scrollable, max-height 500px, sticky header): No. antrean, tanggal, kasir, pelanggan, items, total, metode pembayaran, status
- Badge warna per metode pembayaran dan status

#### Tab 3: Kas Kasir
- Summary: Total shift, total selisih kas, shift bermasalah
- Tabel riwayat: Kasir, waktu buka/tutup, modal awal, expected, aktual, selisih, penjualan, jumlah Tx
- Highlight merah untuk shift dengan selisih negatif

#### Tab 4: Stok Bahan
- Summary: Total item, nilai inventaris, stok rendah
- Alert stok rendah (list)
- Tabel lengkap semua bahan (scrollable, max-height 384px, sticky header)

#### Tab 5: Shift Karyawan
- Per karyawan: avatar, nama, periode, jumlah Tx, total revenue, rata-rata/Tx

- **Export Excel (CSV)**: Setiap tab bisa di-export (dengan BOM untuk kompatibilitas Excel)
- **Export PDF**: Setiap tab bisa di-export sebagai PDF (jsPDF + jspdf-autotable). Format profesional dengan header toko, judul, periode, tabel data berwarna. Siap di-share ke owner/investor.

### 3.10. Modul Pelanggan / CRM
- **CRUD Pelanggan**: Nama, No. HP (WhatsApp), Email, Catatan
- **Tracking otomatis**: Total belanja, jumlah kunjungan (auto-update saat transaksi)
- **Search**: Cari nama, telepon, email
- **Card view**: Grid responsif
- **Aksi WhatsApp**:
  - Tombol hijau di setiap card pelanggan yang punya nomor HP
  - Modal compose pesan dengan template promosi (editable)
  - Kirim via `wa.me` API (format otomatis 08xx → 62xx)
- **Integrasi POS**: Dropdown pilih pelanggan saat transaksi

### 3.11. Modul Promo & Loyalty (Manager)
- **CRUD Promo/Voucher**:
  - Nama, kode voucher (opsional, uppercase)
  - Tipe diskon: persentase (%) atau nominal tetap (Rp)
  - Scope: semua menu, kategori tertentu, atau pelanggan loyal
  - Tanggal mulai & berakhir (masa berlaku)
  - Min. belanja, maks. diskon, batas penggunaan
  - Toggle aktif/nonaktif per promo
  - Badge status: Aktif, Expired, Upcoming
  - Usage tracking (berapa kali sudah dipakai)
- **Loyalty Member System**:
  - Toggle enable/disable
  - 3 tier: 🥉 Bronze, 🥈 Silver, 🥇 Gold
  - Pengaturan per tier: minimum kunjungan + persentase diskon
  - Diskon otomatis diterapkan di POS berdasarkan visitCount pelanggan
- **Integrasi POS**: Input kode voucher, dropdown promo aktif, loyalty auto-discount

### 3.12. Modul Audit Log (Manager)
- **Tabel log**: Timestamp, user, role, aksi, detail
- **Aksi yang dicatat**: Login/logout, CRUD transaksi/menu/user/inventaris/promo/pelanggan, shift open/close, update settings
- **Filter**: Search (user/detail) + dropdown aksi
- **Pagination**: 25 per halaman
- **Export CSV**
- **Cleanup**: Hapus log > 90 hari
- **Max entries**: 10.000 (auto-trim)

### 3.13. Modul Settings (Manager)
- **Pengaturan Toko**:
  - Upload logo toko (base64, maks 500KB) — tampil di login, sidebar, header mobile
  - Nama toko (tampil di login, sidebar, header, struk)
  - Alamat toko
- **PIN Manager**: 4-6 digit untuk otorisasi tindakan krusial
- **Integrasi Printer Thermal**:
  - Toggle aktifkan printer
  - Toggle auto-print saat checkout
  - Metode cetak: Browser Print (window.print) / Bluetooth (Web Bluetooth API)
  - Lebar kertas: 58mm / 80mm
  - Info kontekstual per metode
  - **Printer Dapur & Bar (Split Printing)**:
    - Opsi untuk menambahkan beberapa printer dapur/bar tambahan.
    - Setiap printer dapur memiliki: Nama Printer, Target Kategori Dapur, Tipe (Browser / Bluetooth), Lebar Kertas (58mm / 80mm), dan status Aktif.
- **Manajemen User**: CRUD karyawan (nama, username, password, role)

---

## 4. Non-Functional Requirements

### 4.1. UI/UX & Responsiveness
- Desain modern: sudut membulat (rounded-2xl), whitespace memadai, shadow subtle
- 100% responsif: layout vertikal di mobile, berdampingan di desktop/tablet
- Sidebar collapsible (icon-only mode) di desktop
- Mobile: hamburger menu + header dengan logo & nama toko
- **Mobile POS Cart**: Floating bar (minimized) + slide-up overlay (maximized) agar tidak menutupi area menu
- Color scheme: warm earth tones (brand-600: #b85f21)
- Font: Inter (Google Fonts)
- Animasi: pulse untuk alert, bounce untuk CTA urgent, scale pada button press, slide-in-from-bottom untuk mobile cart

### 4.2. Keamanan
- Tindakan penghapusan/void oleh non-manager → validasi PIN Manager (modal custom)
- Kasir wajib serah terima kas (tidak bisa skip)
- Role-based route protection
- **Password hashing**: bcryptjs (10 salt rounds). Auto-migrasi dari plain text saat pertama load.
- **Audit log**: Semua aksi user tercatat (login, CRUD, transaksi, shift)
- **Konfirmasi dialog**: Semua aksi destruktif (hapus) memerlukan konfirmasi
- **Void confirmation**: Manager mendapat ConfirmDialog sebelum void/cancel transaksi
- **Username uniqueness**: Validasi duplikat saat tambah/edit user

### 4.3. Performa
- Pencarian produk menggunakan `useMemo` (no delay)
- Lazy filtering & pagination untuk tabel besar
- State persist ke localStorage (instant load)
- Auto-cleanup: stock log > 30 hari, audit log > 90 hari (on app load)
- Code-splitting: React.lazy() per halaman (bundle utama ~450KB)

### 4.5. PWA (Progressive Web App)
- **Installable**: Bisa di-install ke homescreen (tablet/HP) tanpa browser bar
- **Standalone display**: Tampil seperti native app
- **Offline-capable**: Assets di-cache oleh Workbox service worker
- **Auto-update**: Service worker otomatis update saat ada versi baru
- **Dynamic favicon**: Icon tab browser mengikuti logo toko yang diupload

### 4.6. Offline & Sync
- **Local-first architecture**: Semua data tersimpan di localStorage, app berfungsi 100% tanpa internet
- **Offline Queue**: Operasi cloud yang gagal (saat offline) disimpan di antrian lokal
- **Auto-retry**: Saat internet kembali, antrian otomatis di-flush ke Supabase
- **Max 5 retries**: Operasi yang gagal 5x dihapus dari antrian
- **Flush on app start**: Pending items dari sesi sebelumnya langsung di-retry
- **Real-time sync**: Supabase real-time subscriptions di SEMUA halaman
  - POS: menus, inventory, customers, settings
  - Kitchen: transactions
  - Transactions: transactions
  - Customers: customers
  - Catalog: menus
  - Inventory: inventory
  - Promos: promos
  - Settings: users
- **fullSync pattern**: Saat real-time event, `loadFromCloud(true)` menjadikan cloud sebagai sumber kebenaran. Item yang dihapus di cloud dihapus dari lokal (grace period 30 detik)
- **Cloud sync coverage**: 13 data types, 10 stores, 6 stores dengan fullSync, 100% halaman dengan real-time
- **Custom Categories Sync**: Disimpan di settings table (id=1) di kolom categories sebagai JSON, sync antar device

### 4.4. Print & Thermal Printer
- **Browser Print**: `window.open` + CSS `@page` optimized untuk thermal paper (58mm/80mm)
- **Bluetooth ESC/POS**: Web Bluetooth API untuk cetak langsung ke printer thermal
  - Scan & pair printer dari Settings
  - ESC/POS commands: initialize, bold, center, left align, feed, cut
  - Data dikirim dalam chunks 20 bytes (BLE MTU)
  - Status koneksi real-time (terhubung/tidak)
- **Split Printing (Printer Dapur & Bar)**:
  - Menu dapat dikonfigurasi target dapurnya (misal: "Minuman" untuk Bar, "Makanan" untuk Dapur).
  - Ketika pesanan checkout, selain mencetak struk penuh di printer kasir, sistem menyaring item pesanan berdasarkan target dapurnya.
  - Tiket dapur hanya mencetak informasi antrean, nama kasir/pelanggan, nama produk, add-on, dan kuantitas (tanpa harga/subtotal/total).
  - Setiap tiket dikirim secara terpisah ke printer dapur yang sesuai (baik lewat dialog Browser Print terpisah maupun Bluetooth).
- **Utility**: `src/utils/printer.ts` — `printReceipt()`, `connectBluetoothPrinter()`, `disconnectBluetoothPrinter()`, `printKitchenReceiptBrowser()`, `printKitchenReceiptBluetooth()`
- Format struk: nama toko, alamat, nomor antrean, tanggal, kasir, pelanggan, items + kustomisasi, subtotal, diskon, total, metode bayar, kembalian, footer

---

## 5. Data Model Architecture

### 5.1. Table: users
```typescript
{
  id: string (UUID)
  name: string
  username: string (unique)
  password: string (bcrypt hashed — auto-migrasi dari plain text)
  role: 'Manager' | 'Kasir' | 'Acaraki'
  activeSessionId?: string (untuk deteksi & batasi multi-device login)
  createdAt: string (ISO)
}
```

### 5.2. Table: inventory
```typescript
{
  id: string (slug, e.g. "kunyit")
  name: string
  stock: number (float)
  unit: string ("kg", "L", "pcs", "ml", "g")
  costPerUnit: number (Rp per unit — untuk hitung HPP)
  minStock?: number (threshold alert, default 3)
}
```

### 5.3. Table: menus
```typescript
{
  id: string (UUID)
  name: string
  category: string
  price: number (harga jual)
  image?: string (base64 data URL)
  isBestSeller?: boolean
  isAvailable?: boolean (default true — false hides from POS)
  ingredients: Record<string, number> // { inventory_id: amount }
  availableAddons: Array<{ name: string, price: number }>
  description?: string
}
```

### 5.4. Table: transactions
```typescript
{
  id: string (UUID)
  queueNumber: number (auto-reset daily)
  date: string (ISO timestamp)
  items: CartItem[] // detail pesanan
  subtotal: number
  discount: number
  totalAmount: number
  paymentMethod: 'Cash' | 'QRIS' | 'Transfer'
  cashReceived?: number
  change?: number
  kitchenStatus: 'Waiting' | 'Processing' | 'Done'
  txStatus: 'Selesai' | 'Cancel' | 'Demo'
  cashierId: string
  cashierName: string
  customerId?: string
  customerName?: string
  hpp: number (total cost of goods sold)
}
```

### 5.5. Table: CartItem (embedded in transaction)
```typescript
{
  lineId: string (UUID)
  menuId: string
  name: string
  basePrice: number
  quantity: number
  temperature: 'Hangat' | 'Dingin'
  sugar: 'Normal' | 'Less' | 'None'
  addons: Array<{ name: string, price: number }>
  subtotal: number
}
```

### 5.6. Table: customers
```typescript
{
  id: string (UUID)
  name: string
  phone?: string
  email?: string
  notes?: string
  totalSpent: number (auto-updated)
  visitCount: number (auto-updated)
  lastVisit?: string (ISO)
  createdAt: string (ISO)
}
```

### 5.7. Table: shifts (CashierShift)
```typescript
{
  id: string (UUID)
  userId: string
  userName: string
  openedAt: string (ISO)
  closedAt?: string (ISO)
  openingCash: number (modal awal)
  closingCash?: number (kas aktual di laci)
  expectedCash?: number (kalkulasi sistem)
  cashDifference?: number (closingCash - expectedCash)
  totalSales: number
  totalTransactions: number
  status: 'open' | 'closed'
}
```

### 5.8. Table: settings (AppSettings)
```typescript
{
  managerPin: string
  storeName: string
  storeLogo?: string (base64)
  address?: string
  taxPercent?: number
  categories: string[]
  printerEnabled: boolean
  printerType: 'browser' | 'bluetooth'
  printerWidth: '58mm' | '80mm'
  autoPrintOnCheckout: boolean
}
```

### 5.9. Table: stockLogs (StockLogEntry)
```typescript
{
  id: string (UUID)
  inventoryId: string
  inventoryName: string
  type: 'deduct' | 'add' | 'adjust' | 'import'
  amount: number (positive = added, negative = deducted)
  stockBefore: number
  stockAfter: number
  unit: string
  reason?: string (e.g. "Transaksi POS", "Adjustment manual")
  date: string (ISO)
}
```
Max 5000 entries retained. Auto-logged on every stock change.

---

## 6. Project Structure

```
rempah-story-pos/
├── index.html
├── package.json
├── vite.config.ts
├── tsconfig.json
├── tailwind.config.js
├── postcss.config.js
├── tunnel.mjs              # Ngrok tunnel script (public access)
├── PRD.md                  # This document
├── public/
│   ├── icons/
│   │   ├── icon-192.svg    # PWA icon 192x192
│   │   └── icon-512.svg    # PWA icon 512x512
│   └── sounds/
│       └── kds-alarm.wav   # Custom KDS notification sound
└── src/
    ├── main.tsx
    ├── App.tsx
    ├── index.css
    ├── types/
    │   └── index.ts          # All TypeScript interfaces & types
    ├── utils/
    │   ├── format.ts         # formatRupiah, formatDate, formatTime, isSameDay
    │   ├── hpp.ts            # calculateMenuHPP, calculateTransactionHPP
    │   ├── printer.ts        # Thermal printer (Browser Print + Bluetooth ESC/POS)
    │   ├── pdfExport.ts     # PDF report generation (jsPDF + autotable)
    │   ├── sound.ts         # Custom audio notification (KDS alarm)
    │   ├── stockCheck.ts    # Stock availability validation before checkout
    │   └── seed.ts          # Initial data (users, inventory, menus, settings)
    ├── store/
    │   ├── authStore.ts      # Users, login/logout, RBAC
    │   ├── menuStore.ts      # Menus CRUD, categories management
    │   ├── inventoryStore.ts # Inventory CRUD, deductStock + auto stock logging
    │   ├── transactionStore.ts # Transactions, kitchen status, KDS clear, daily queue reset
    │   ├── cartStore.ts      # Cart state (persisted to localStorage)
    │   ├── customerStore.ts  # CRM customers
    │   ├── shiftStore.ts     # Shift open/close, history
    │   ├── settingsStore.ts  # App settings, PIN verification
    │   ├── toastStore.ts     # Toast notification system
    │   ├── stockLogStore.ts  # Stock change history/audit log
    │   ├── promoStore.ts     # Promo/voucher CRUD + loyalty settings
    │   └── auditLogStore.ts  # Audit log (all user actions)
    ├── components/
    │   ├── Layout.tsx        # Sidebar, header, shift modals, Acaraki summary
    │   ├── Modal.tsx         # Reusable modal component
    │   ├── PinModal.tsx      # PIN verification modal
    │   ├── ConfirmDialog.tsx # Reusable confirmation dialog (delete actions)
    │   ├── ToastContainer.tsx # Toast notification renderer
    │   └── OpenShiftModal.tsx # Open shift modal for Kasir
    └── pages/
        ├── Login.tsx         # Login page with store branding
        ├── POS.tsx           # Point of Sale (order creation + promo/voucher)
        ├── Kitchen.tsx       # Kitchen Display System (KDS)
        ├── Transactions.tsx  # Transaction history
        ├── Dashboard.tsx     # Manager dashboard & analytics
        ├── Catalog.tsx       # Menu catalog management
        ├── Inventory.tsx     # Inventory management
        ├── Promos.tsx        # Promo/voucher & loyalty management
        ├── Reports.tsx       # Reports (P&L, Transactions, Cash, Stock, Shift) + PDF
        ├── Customers.tsx     # CRM & WhatsApp marketing
        ├── AuditLog.tsx      # Audit log viewer (Manager only)
        └── SettingsPage.tsx  # Store, PIN, Printer, User settings
```

---

## 7. State Persistence

Semua store menggunakan Zustand `persist` middleware dengan localStorage:

| Store | localStorage Key |
|-------|-----------------|
| authStore | `rempah-auth` |
| menuStore | `rempah-menus` |
| inventoryStore | `rempah-inventory` |
| transactionStore | `rempah-transactions` |
| cartStore | `rempah-cart` |
| customerStore | `rempah-customers` |
| shiftStore | `rempah-shifts` |
| settingsStore | `rempah-settings` |
| stockLogStore | `rempah-stock-logs` |
| promoStore | `rempah-promos` |
| auditLogStore | `rempah-audit-logs` |

**Catatan**: `toastStore` tidak di-persist (transient UI state).

---

## 8. Key Business Logic

### 8.1. HPP Calculation
```
HPP per menu = Σ (ingredient_amount × inventory_costPerUnit)
HPP per transaction = Σ (menu_HPP × quantity)
```

### 8.2. Expected Cash Calculation
```
Expected Cash = Opening Cash + Cash Sales - Cash Change Given
```

### 8.3. Inventory Auto-Deduction
Saat transaksi selesai, untuk setiap item di cart:
```
For each ingredient in menu.ingredients:
  inventory[ingredient_id].stock -= ingredient_amount × item.quantity
  → auto-logged to stockLogStore
```

### 8.4. Stock Validation (Pre-Checkout)
```
For each cart item → sum required ingredients
Compare required vs available stock
If any ingredient insufficient → show warning modal
Kasir can override (proceed anyway) or cancel
```

### 8.5. Queue Number Daily Reset
```
On getNextQueueNumber():
  if lastQueueDate !== today → reset to 1, update lastQueueDate
  else → return current nextQueueNumber
```

### 8.6. KDS Clear Logic
- `lastKdsClearTime` disimpan saat Acaraki print & logout
- Kitchen page filter: hide Done orders where `order.date < lastKdsClearTime`

### 8.7. WhatsApp Integration
```
Phone format: 08xx → 62xx (remove leading 0, prepend 62)
URL: https://wa.me/{phone}?text={encodedMessage}
```

### 8.8. Sound Notifications (KDS)
```
Custom audio file: /public/sounds/kds-alarm.wav
playNewOrderSound(): plays kds-alarm.wav at 70% volume when Waiting count increases
playAlertSound(): plays kds-alarm.wav at 100% volume for overdue orders
Uses HTMLAudioElement (not Web Audio API) for custom sound support
File served from public/ folder (no bundling/hashing by Vite)
```

### 8.9. Toast System
```
toastStore.addToast(message, type, duration)
Types: success | error | info | warning
Auto-dismiss after 3 seconds (configurable)
Rendered by ToastContainer (fixed top-right, z-200)
```

---

## 9. Future Roadmap

Fitur berikut sudah disiapkan arsitekturnya untuk fase pengembangan selanjutnya:

### Phase 1 — NEXT (Integrasi & Sekuritas Lanjutan)
1. **Auto-Reconnect & Visibility State Listener**: Otomatis memulihkan koneksi realtime Supabase saat perangkat menyala kembali dari mode sleep.
2. **Supabase Row Level Security (RLS) Policies**: Pengamanan ketat akses database dari eksploitasi pihak luar yang mengetahui `anon key`.

### Phase 2 (Komunikasi & Notifikasi)
3. **WhatsApp Receipt & Shift Summary**: Kirim struk PDF ke pelanggan dan ringkasan shift harian ke WA Manager.
4. **Multi-outlet Support**: Satu akun Manager mengelola beberapa cabang dengan database inventaris terpisah.
5. **QR Code Self-Order**: Pelanggan scan QR di meja → pilih menu → langsung masuk KDS.
6. **Integrasi Payment Gateway**: QRIS otomatis (Midtrans/Xendit) dengan auto-confirm pembayaran.

### Phase 3 (Analitik & Operasional)
7. **Laporan Perbandingan Periode**: Analitik komparatif performa penjualan.
8. **Restock/Purchase Order**: Pencatatan pembelian bahan baku dari supplier.
9. **Multi-language**: Dukungan multibahasa (English/Indonesia).
10. **AI Recommendation**: Rekomendasi menu cerdas berbasis histori dan cuaca.

### ~~Completed (moved from roadmap)~~
- ~~Printer Thermal Bluetooth~~ ✅ (Web Bluetooth API + Browser Print)
- ~~Shift Management~~ ✅ (Open/Close Cashier)
- ~~PWA~~ ✅ (Installable, offline-capable)
- ~~Loyalty Program~~ ✅ (Tier system + auto-discount)
- ~~Audit Log~~ ✅ (All user actions tracked)
- ~~Cloud Sync 100%~~ ✅ (Real-time subscriptions di semua halaman, fullSync, delete propagation)
- ~~Void Confirmation~~ ✅ (ConfirmDialog untuk Manager)
- ~~Clear Cart~~ ✅ (1-klik kosongkan keranjang)
- ~~KDS Today Filter~~ ✅ (Hanya transaksi hari ini)
- ~~Custom Categories Sync~~ ✅ (Cloud sync via settings table)
- ~~Dark Mode Overhaul & Login Contrast~~ ✅ (Dark mode premium & halaman login bebas kontras)
- ~~Multi-device Session Restriction~~ ✅ (Pembatasan satu session aktif per user via Supabase Realtime)

---

## 10. Seed Data (Default)

### Users
| Username | Password | Role |
|----------|----------|------|
| manager | manager123 | Manager |
| kasir | kasir123 | Kasir |
| acaraki | acaraki123 | Acaraki |

### Menu Categories
- Jamu Murni
- Wedang
- Signature
- Segar

### Sample Menu (8 items)
- Kunyit Asam Signature (Rp 18.000) ⭐
- Beras Kencur (Rp 16.000) ⭐
- Wedang Jahe (Rp 15.000)
- Temulawak Madu (Rp 20.000)
- Wedang Uwuh (Rp 17.000)
- Golden Milk (Rp 25.000) ⭐
- Jeruk Nipis Peras (Rp 14.000)
- Lemon Jahe (Rp 16.000)

### Inventory (15 items)
Kunyit, Jahe Emprit, Temulawak, Sereh, Kayu Manis, Gula Aren, Gula Pasir, Madu Murni, Lemon, Jeruk Nipis, Susu UHT, Cup 16oz, Cup 12oz, Sedotan, Air Galon

### Default Settings
- Store Name: "Rempah Story"
- Manager PIN: "1234"
- Printer: Disabled
- Tax: 0%

---

## 11. Running the Application

### Production (Live)
- **Hosting**: Vercel (auto-deploy on git push)
- **Database**: Supabase (PostgreSQL + Real-time subscriptions)
- **HTTPS**: Otomatis via Vercel
- **CI/CD**: Push ke GitHub → Vercel auto-build & deploy

### Development (Local)
```bash
# Install dependencies
npm install

# Development server (local)
npm run dev
# → http://localhost:5173

# Public access via Ngrok tunnel (requires authtoken setup)
# Terminal 1: npm run dev
# Terminal 2: npm run tunnel
# → https://xxxx.ngrok-free.app

# Production build (local test)
npm run build
npm run preview --host
```

### Ngrok Setup (sekali saja, untuk dev)
```bash
npx ngrok config add-authtoken YOUR_TOKEN_HERE
```

### Deploy ke Production
```bash
git add .
git commit -m "description of changes"
git push origin main
# Vercel auto-deploys within 1-2 minutes
```

---

## 12. Design Tokens & UI Guidelines

### Colors
- **Primary (Brand)**: `#b85f21` (warm brown/orange)
- **Success**: `#22c55e`
- **Danger**: `#ef4444`
- **Warning**: `#f59e0b`
- **Info**: `#3b82f6`

### Components
- **Cards**: `bg-white rounded-2xl shadow-sm border border-slate-100`
- **Buttons**: `rounded-xl px-4 py-2.5 font-semibold` with active:scale-95
- **Inputs**: `rounded-xl border border-slate-200` with focus ring
- **Badges**: `rounded-full px-2.5 py-1 text-xs font-semibold`
- **Modals**: Centered overlay with `rounded-2xl max-h-[90vh]`

### Responsive Breakpoints
- Mobile: < 1024px (sidebar hidden, hamburger menu)
- Desktop: ≥ 1024px (sidebar visible, collapsible)

---

*Document ini mencakup seluruh fitur yang sudah diimplementasi pada aplikasi POS Rempah Story v3.0. Gunakan sebagai referensi lengkap untuk pengembangan lebih lanjut.*
