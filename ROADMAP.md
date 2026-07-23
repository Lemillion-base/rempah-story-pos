# 🗺️ ROADMAP & BACKLOG PENGEMBANGAN — BerdikariPOS v3.7

Dokumen ini berisi daftar analisis bug, potensi masalah logika, serta rencana peningkatan modul yang diprioritaskan untuk diimplementasikan oleh AI Developer pada iterasi berikutnya.

---

## 🟢 Fitur & Bug Fix yang Telah Diselesaikan (Iterasi v3.6) [SELESAI]

### 1. 🔴 Cloud Hydration `StockOpnameStore` pada Bootup App [SELESAI]
- **Status**: ✅ **Selesai**. `useStockOpnameStore.getState().loadFromCloud()` telah ditambahkan pada startup app di `App.tsx`.

### 2. 🔴 Kerugian Stock Opname (Shrinkage Loss) dalam Laporan Laba Rugi (P&L) [SELESAI]
- **Status**: ✅ **Selesai**. Metrik kerugian disaring berdasarkan tanggal laporan dan diintegrasikan pada tabel P&L, kartu ringkasan, CSV, dan PDF export.

### 3. 🟠 Filter Tanggal, Search, & Pagination pada `Transactions.tsx` [SELESAI]
- **Status**: ✅ **Selesai**. Penambahan filter tanggal (Hari ini, 7 Hari, Bulan Ini, Semua, Kustom), pencarian multi-kolom, serta pagination pada `Transactions.tsx`.

### 4. 🟠 Deduksi & Revert Stok Bahan Baku berbasis Addons [SELESAI]
- **Status**: ✅ **Selesai**. Shared helper function `calculateItemDeductions` telah dibuat di `hpp.ts` dan diintegrasikan pada `POS.tsx`, `Transactions.tsx`, serta `stockCheck.ts`.

### 5. 🟡 Pembulatan Pecahan Desimal Float pada Checkout POS [SELESAI]
- **Status**: ✅ **Selesai**. `Math.round()` diterapkan secara konsisten pada kalkulasi total diskon, subtotal, net subtotal, pajak, dan total bayar.

### 6. 🟡 Realtime Subscription Data `stock_opnames` [SELESAI]
- **Status**: ✅ **Selesai**. Listener Supabase Realtime untuk tabel `stock_opnames` telah ditambahkan di `cloudSync.ts` dan `Inventory.tsx`.

---

## 🚀 Fitur & Peningkatan Prioritas (Iterasi v3.7)

### 📅 1. Opsi Filter Tanggal "SEMUA" pada Menu Laporan (`Reports.tsx`)
- **Severity**: 🟢 Peningkatan UI/UX
- **File**: [Reports.tsx](file:///d:/Private%20File/Aba/VibeCoding/Aplikasi/rempah-story-pos/src/pages/Reports.tsx)
- **Deskripsi**: Tambahkan pilihan filter tanggal `'all'` ("Semua Tanggal") pada menu Laporan di samping opsi *Hari Ini*, *7 Hari*, *Bulan Ini*, dan *Tanggal (Kustom)*.
- **Tujuan**: Memungkinkan Manager/Owner untuk melihat total akumulasi seluruh transaksi dan laporan laba rugi tanpa batasan periode.

### 📱 2. Perbaikan Responsive Mobile Layout pada Menu Laporan (`Reports.tsx`)
- **Severity**: 🟠 UI/UX Mobile Fix
- **File**: [Reports.tsx](file:///d:/Private%20File/Aba/VibeCoding/Aplikasi/rempah-story-pos/src/pages/Reports.tsx)
- **Deskripsi**: Perbaiki tampilan menu Laporan saat diakses di perangkat HP/seluler (berdasarkan Screenshot 1). Tab navigasi dibuat scrollable horizontal (`overflow-x-auto whitespace-nowrap`), filter bar dibuat responsive, dan container tabel diberi horizontal scrollbar agar tidak terpotong atau berantakan.

### 🖨️ 3. Perbaikan Character Encoding / Simbol Aneh pada Struk Thermal (`printer.ts` / `thermalPrinter.ts`)
- **Severity**: 🔴 Bug Cetak Struk
- **File**: [printer.ts](file:///d:/Private%20File/Aba/VibeCoding/Aplikasi/rempah-story-pos/src/utils/printer.ts) / [thermalPrinter.ts](file:///d:/Private%20File/Aba/VibeCoding/Aplikasi/rempah-story-pos/src/utils/thermalPrinter.ts)
- **Deskripsi**: Pada cetakan struk konsumen dan tiket dapur (Screenshot 2), karakter separator garis dekoratif non-ASCII (`═`, `─`, `━`, `⭐`) tercetak sebagai simbol Mandarin/Kanji/anomali pada printer thermal.
- **Solusi**: Ganti seluruh karakter garis pemisah non-ASCII pada template cetak struk kasir dan tiket dapur menjadi karakter ASCII murni (`-`, `=`, `*`).

### 💵 4. Perbaikan Detail & Kalkulasi Struk Ringkasan Transaksi Shift Kasir
- **Severity**: 🟠 Kalkulasi & Format Struk
- **File**: [printer.ts](file:///d:/Private%20File/Aba/VibeCoding/Aplikasi/rempah-story-pos/src/utils/printer.ts), [Reports.tsx](file:///d:/Private%20File/Aba/VibeCoding/Aplikasi/rempah-story-pos/src/pages/Reports.tsx)
- **Deskripsi**: Pada struk Ringkasan Transaksi Shift Kasir (Screenshot 3):
  - **Expected Cash (Uang Kasir Seharusnya)** = Modal Awal + Total Penjualan Tunai (Cash).
  - **Kas Aktual**: Tampilkan hasil hitung fisik uang kasir jika shift sudah ditutup, atau beri label "(Shift Masih Buka)" jika shift belum ditutup.
  - Tampilkan rincian breakdown omset per metode pembayaran (**Total Cash**, **Total QRIS**, **Total Transfer**) pada struk agar memisahkan antara Total Omset Keseluruhan vs Omset Tunai.

### 🔄 5. Fitur Cetak Ulang Struk Transaksi dengan Pilihan Target Printer (`Transactions.tsx`)
- **Severity**: 🟢 Fitur Baru
- **File**: [Transactions.tsx](file:///d:/Private%20File/Aba/VibeCoding/Aplikasi/rempah-story-pos/src/pages/Transactions.tsx)
- **Deskripsi**: Tambahkan tombol "Cetak Ulang Struk" (Reprint) pada setiap item transaksi di halaman Riwayat Transaksi.
- **Fitur**: Menyediakan modal dialog pilihan target cetak ulang:
  1. **Cetak di Printer Kasir Saja** (Hanya cetak Struk Konsumen).
  2. **Cetak ke Semua Printer** (Cetak Struk Konsumen + Tiket Dapur Makanan & Minuman).

### ⚙️ 6. Pengaturan Struk pada Menu Settings — Printer & KDS (`SettingsPage.tsx`) [SELESAI]
- **Status**: ✅ **Selesai**. Form input `receiptHeader` dan `receiptFooter` telah ditambahkan di tab Printer & KDS halaman Settings.

### 🛒 7. Pilihan Tipe Pesanan & Nomor Meja pada Keranjang Mobile (`POS.tsx`) [SELESAI]
- **Severity**: 🔴 Critical Mobile Fix
- **File**: [POS.tsx](file:///d:/Private%20File/Aba/VibeCoding/Aplikasi/rempah-story-pos/src/pages/POS.tsx)
- **Status**: ✅ **Selesai**. Opsi Tipe Pesanan (Dine In / Take Away) dan dropdown Nomor Meja kini ditampilkan secara penuh pada bottom sheet modal Keranjang tampilan mobile (di bawah pilihan Pelanggan).

### 🏪 8. Posisi Center Nama Toko & Logo Toko pada Header Mobile (`Layout.tsx`) [SELESAI]
- **Severity**: 🟢 UI Mobile Enhancement
- **File**: [Layout.tsx](file:///d:/Private%20File/Aba/VibeCoding/Aplikasi/rempah-story-pos/src/components/Layout.tsx)
- **Status**: ✅ **Selesai**. Nama toko dan logo toko pada navbar header seluler (`lg:hidden`) kini secara presisi berada di posisi tengah (center), sementara ikon Hamburger Menu tetap di kiri dan ikon Mode Gelap/Terang di kanan.

---

## 🎨 Polishing Layout & UX Tampilan Mobile (Iterasi v3.8) [SELESAI]

### 🖨️ 1. Grid 2-Kolom Tombol Aksi Riwayat Transaksi (`Transactions.tsx`) [SELESAI]
- **Severity**: 🟠 UI/UX Mobile Polish (Gambar 1)
- **Status**: ✅ **Selesai**. Tombol `Cetak Ulang`, `Selesai`, `Cancel`, `Demo`, `Hapus` pada kartu transaksi mobile kini menggunakan layout **Grid 2-Kolom** simetris (`grid grid-cols-2 sm:flex`) tanpa *blank space*.

### 📍 2. Judul Halaman Centered pada Tampilan Mobile (Seluruh Halaman) [SELESAI]
- **Severity**: 🟢 UI Mobile Polish (Gambar 2 & 3)
- **Status**: ✅ **Selesai**. Seluruh judul halaman (`📦 Katalog Menu`, `🎁 Promo & Loyalty`, `📦 Inventaris`, `👥 Pelanggan`, `📊 Laporan`, `📋 Riwayat Transaksi`, `⚙️ Settings`, dll) kini berada di posisi **tengah (center)** pada tampilan mobile (`text-center sm:text-left`).

### 🎯 3. Header Action Buttons Responsif 2x2 & Full-Width (`Catalog.tsx`, `Promos.tsx`, `Inventory.tsx`, `AuditLog.tsx`) [SELESAI]
- **Severity**: 🟠 UI Mobile Polish (Gambar 2 & 3)
- **Status**: ✅ **Selesai**. Tombol `+ Tambah Menu`, `Kelola Kategori`, `Export CSV`, `Import CSV`, dan `+ Tambah Promo` kini mengadopsi layout Grid 2-Kolom / Full-Width yang proporsional di layar HP (`grid grid-cols-2 sm:flex` / `w-full sm:w-auto flex justify-center`).

---

## 🛠️ Panduan Teknis untuk AI Developer
- **Karakter Printer Thermal (`printer.ts`)**:
  - Selalu gunakan string ASCII murni (`-` dan `=`) untuk separator pada template struk thermal agar kompatibel dengan seluruh jenis ESC/POS printer.
- **Responsive Layout (`Reports.tsx`, `Layout.tsx`, `POS.tsx`, `Transactions.tsx`, `Catalog.tsx`, `Promos.tsx`, `Inventory.tsx`)**:
  - Untuk tombol-tombol aksi header/kartu pada tampilan seluler, gunakan `grid grid-cols-2 sm:flex gap-2 w-full sm:w-auto` dan `flex items-center justify-center` agar layout simetris 2-kolom tanpa *blank space*.
  - Untuk header navbar mobile, gunakan `absolute inset-0 flex items-center justify-center pointer-events-none` agar logo & nama toko centered dengan rapi tanpa menggeser tombol navigasi kiri/kanan.
  - Untuk judul halaman di layar HP, gunakan `text-center sm:text-left w-full sm:w-auto`.
- **Integrasi Modal Reprint (`Transactions.tsx`)**:
  - Panggil fungsi printer dengan opsi pemisahan target printer kasir saja vs semua printer (kasir + dapur).
