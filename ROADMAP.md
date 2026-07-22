# 🗺️ ROADMAP & BACKLOG PENGEMBANGAN — BerdikariPOS v3.5

Dokumen ini berisi daftar fitur, perubahan logika, dan modul baru yang diprioritaskan untuk diimplementasikan oleh AI Developer pada iterasi berikutnya.

---

## 🚀 Fitur & Peningkatan Prioritas (Iterasi Berikutnya)

### 1. 🕒 Penundaan Buka Shift Kasir untuk Level Manager [SELESAI]
- **Deskripsi**: Saat ini, modal Buka Shift Kasir (`OpenShiftModal`) muncul secara otomatis setelah login untuk semua user (termasuk Manager). Pada level Manager, dialog Buka Shift ini harus ditunda.
- **Ketentuan**:
  - Jika user masuk sebagai **Manager**, jangan tampilkan `OpenShiftModal` secara otomatis setelah login.
  - Tampilkan dialog Buka Shift Kasir hanya ketika Manager secara eksplisit mengklik/mengakses menu **POS** dari sidebar.
  - Untuk peran **Kasir**, alur tetap sama (wajib buka shift langsung setelah login sebelum bisa mengakses fitur lain).

### 2. 📦 Role Baru: "Staf Gudang" (Warehouse Staff) [SELESAI]
- **Deskripsi**: Menambahkan peran (role) baru bernama **Staf Gudang** untuk mendukung pemisahan tugas operasional inventaris.
- **Ketentuan**:
  - Perbarui enum/type `Role` di `src/types/index.ts` untuk mendukung `'Staf Gudang'`.
  - Staf Gudang **hanya bisa mengakses halaman Inventaris** (modul bahan baku). Menu lain di sidebar harus disembunyikan/dibatasi.
  - Hak akses Staf Gudang dibatasi hanya untuk:
    1. Melihat daftar bahan baku.
    2. Menambahkan/mengubah bahan baku (CRUD basic).
    3. Melakukan modul **Stock Opname** (rekonsiliasi fisik).
  - Staf Gudang tidak memiliki akses ke Dashboard, POS, Laporan, CRM, Transaksi, Audit Log, Katalog, maupun Settings.

### 3. 🧹 Penghapusan Audit Log Manual Secara Keseluruhan [SELESAI]
- **Deskripsi**: Menambahkan opsi bagi Manager untuk menghapus seluruh riwayat Audit Log secara manual guna membersihkan penyimpanan lokal dan cloud.
- **Ketentuan**:
  - Tambahkan tombol **"Hapus Semua Log"** pada halaman Audit Log (`AuditLog.tsx`).
  - Fitur ini harus dilindungi dengan konfirmasi ganda (dialog konfirmasi/PIN Manager) untuk mencegah ketidaksengajaan.
  - Eksekusi aksi akan menghapus seluruh data pada state `auditLogStore` dan melakukan sinkronisasi penghapusan ke tabel `audit_logs` di Supabase.

### 4. 🍽️ Pengaturan Nomor Meja Konsumen [SELESAI]
- **Deskripsi**: Menyediakan fitur penomoran meja konsumen yang fleksibel untuk pesanan *Dine In*, yang dapat dikonfigurasi langsung dari Settings.
- **Ketentuan**:
  - **Menu Pengaturan (Settings)**:
    - Di dalam halaman Settings, tab **Printer & KDS**, tambahkan toggle **"Aktifkan Fitur Nomor Meja"** (On/Off).
    - Jika aktif, tampilkan input list untuk mengelola daftar Nomor Meja yang tersedia (misal: Meja 1, Meja 2, Area Outdoor 1, dll).
  - **Keranjang Belanja (POS Cart)**:
    - Jika fitur nomor meja di-On kan, tampilkan dropdown pilihan Nomor Meja pada keranjang belanja POS (terutama saat tipe transaksi di-set ke *Dine In*).
    - Kasir wajib/bisa memilih nomor meja sebelum menekan tombol Bayar/Checkout.
    - Nomor meja yang dipilih harus tersimpan di object `Transaction` dan tercetak pada struk thermal belanja serta muncul pada tiket KDS dapur.

---

## 🛠️ Panduan Teknis untuk AI
- **Modifikasi Database (`schema.sql`)**: 
  - Tambahkan field `table_number` di tabel `transactions` jika diperlukan.
  - Tambahkan konfigurasi `table_features` (JSON/Boolean) di tabel `settings`.
- **Modifikasi TypeScript (`types/index.ts`)**:
  - Update `Role` type definition.
  - Tambahkan field opsional `tableNumber` pada interface `Transaction` dan `CartItem`.
- **Integrasi Keamanan**: Pastikan validasi PIN Manager tetap digunakan untuk aksi destruktif seperti pembersihan Audit Log.
- **Instruksi Setelah Perubahan**:
  - Jika terdapat update untuk `schema.sql` atau database, berikan instruksi manual pada user untuk melakukan update
    karena update database hanya bisa dilakukan secara manual.
  - Biarkan user melakukan update ke git repository secara manual.

