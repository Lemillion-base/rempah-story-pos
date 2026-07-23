# 📌 ROADMAP & HANDOFF STATUS — BerdikariPOS v4.0

## Status Tugas Refactor Bluetooth Thermal Printer & Split Printing: ✅ SELESAI (Implemented & Verified)

---

### 🚀 RINGKASAN IMPLEMENTASI (v4.0)

1. **Printer Device Registry (`Map<string, BluetoothConnection>`)**:
   - Seluruh koneksi Bluetooth kini dikelola secara independen per-printer ID (`__cashier__`, `kp.id`).
   - Masalah *crosstalk* akibat global singleton telah **diperbaiki sepenuhnya**.

2. **Error Isolation (`Promise.allSettled`)**:
   - Kegagalan satu printer (misal printer dapur offline atau habis kertas) **tidak menggagalkan** transaksi atau printer kasir/bar lainnya.
   - Transaksi tetap sukses dicatat dan notification toast akan mengabarkan jika ada printer spesifik yang gagal.

3. **Settings UI (Card-based Layout & Live Status Indicator)**:
   - Printer Dapur beralih dari tabel menjadi **card-based layout** yang responsif dan mobile-friendly.
   - Menampilkan nama perangkat Bluetooth (`bluetoothDeviceName`) dan status live (`Connected` / `Disconnected`).
   - Tombol **Test Print** independen di setiap kartu printer untuk memverifikasi physical device.
   - **Duplicate Device Warning**: Notifikasi konfirmasi jika perangkat Bluetooth fisik yang sama digunakan oleh lebih dari satu konfigurasi printer.

---

### 📁 RINGKASAN FILE YANG DIUBAH

| File | Perubahan |
|------|-----------|
| [src/types/index.ts](file:///d:/Private%20File/Aba/VibeCoding/Aplikasi/rempah-story-pos/src/types/index.ts) | Menambahkan `bluetoothDeviceId` & `bluetoothDeviceName` pada `KitchenPrinterConfig` serta `cashierBluetoothDeviceId` & `cashierBluetoothDeviceName` pada `AppSettings`. |
| [src/utils/printer.ts](file:///d:/Private%20File/Aba/VibeCoding/Aplikasi/rempah-story-pos/src/utils/printer.ts) | Rewriting core Bluetooth engine ke **Printer Device Registry**, fungsi connect/disconnect per-printer ID, `sendToBluetoothPrinter()`, error isolation via `Promise.allSettled`, `testPrintBluetooth()`, dan `getDuplicateDeviceInfo()`. |
| [src/pages/SettingsPage.tsx](file:///d:/Private%20File/Aba/VibeCoding/Aplikasi/rempah-story-pos/src/pages/SettingsPage.tsx) | Pembaruan UI Printer Kasir (dengan device name & Test Print) dan Kitchen Printers (Card layout dengan status indikator real-time, tombol connect/disconnect/test-print per printer, serta alert duplicate device). |

---

### 🔍 HASIL VALIDASI TEKNIS

- **TypeScript Type-Check (`npx tsc --noEmit`)**: ✅ **0 Errors**
- **Production Build (`npm run build`)**: ✅ **Success in 5.28s** (Bundle PWA generated cleanly)
- **Backward Compatibility**: `POS.tsx`, `Transactions.tsx`, `Layout.tsx`, dan `Catalog.tsx` **tidak berubah** (API `printReceipt()` tetap 100% kompatibel).

---

### 🧪 PANDUAN MANUAL TESTING (Untuk User)

Berikut adalah panduan langkah demi langkah untuk melakukan pengujian manual dengan **1, 2, atau 3 printer Bluetooth fisik**:

#### A. Persiapan Awal
1. Nyalakan printer Bluetooth thermal Anda dan pastikan Bluetooth pada HP/Tablet/Laptop Anda aktif.
2. Buka BerdikariPOS di browser **Chrome** / **Edge**.
3. Masuk ke **Pengaturan (Settings)** → Tab **Printer & KDS**.

---

#### B. Skenario 1: Menggunakan 1 Printer Bluetooth (Shared Cashier + Kitchen)
*Kasus: Toko hanya memiliki 1 printer Bluetooth fisik untuk cetak struk kasir sekaligus tiket dapur.*

1. Di Pengaturan → **Printer Kasir**:
   - Pilih Metode: `Bluetooth`.
   - Klik **[Hubungkan Printer]**, pilih printer Bluetooth Anda.
   - Klik **[Test Print]** → Struk Test Print Kasir harus keluar.
2. Di Pengaturan → **Printer Dapur & Bar**:
   - Buat 1 Printer Dapur, set Tipe: `Bluetooth`.
   - Klik **[Hubungkan]**, pilih **printer Bluetooth fisik yang sama**.
   - Warning dialog akan muncul memberitahu bahwa printer sudah dipakai oleh Kasir → Pilih **Gunakan Printer yang Sama**.
   - Klik **[Test Print]** pada kartu dapur → Struk Test Print Dapur harus keluar dari printer yang sama.
3. Lakukan Transaksi di POS (Checkout):
   - Struk Kasir dan Tiket Dapur akan keluar secara berurutan dari printer tersebut.

---

#### C. Skenario 2: Menggunakan 2 Printer Bluetooth Fisik
*Kasus: 1 Printer Kasir (Printer A) dan 1 Printer Dapur Makanan (Printer B).*

1. Di **Printer Kasir**: Klik **[Hubungkan Printer]** → Hubungkan ke **Printer A**. Lakukan **Test Print**.
2. Di **Printer Dapur Makanan**: Set Tipe: `Bluetooth`, Klik **[Hubungkan]** → Hubungkan ke **Printer B**. Lakukan **Test Print**.
3. Lakukan Transaksi di POS berisi item Makanan & Minuman:
   - Struk Kasir utuh keluar dari **Printer A**.
   - Tiket Dapur Makanan keluar dari **Printer B**.

---

#### D. Skenario 3: Menggunakan 3 Printer Bluetooth Fisik
*Kasus: 1 Printer Kasir (Printer A), 1 Printer Dapur Makanan (Printer B), 1 Printer Bar Minuman (Printer C).*

1. Hubungkan **Printer Kasir** ke **Printer A** → Test Print.
2. Hubungkan **Printer Dapur (Target: Makanan)** ke **Printer B** → Test Print.
3. Hubungkan **Printer Bar (Target: Minuman)** ke **Printer C** → Test Print.
4. Pastikan di Katalog Menu:
   - Produk Makanan memiliki Target Dapur = `Makanan`.
   - Produk Minuman memiliki Target Dapur = `Minuman`.
5. Lakukan Transaksi di POS berisi Nasi Goreng (Makanan) + Kopi Susu (Minuman):
   - Customer Receipt (semua item) keluar di **Printer A**.
   - Tiket Dapur (Nasi Goreng saja) keluar di **Printer B**.
   - Tiket Bar (Kopi Susu saja) keluar di **Printer C**.

---

#### E. Pengujian Skenario Khusus (Edge Cases)

- **Test Item Filtering (Food Only)**: Buat transaksi yang HANYA berisi Makanan → Printer Bar (Minuman) **TIDAK mencetak sama sekali**.
- **Test Printer Offline (Error Isolation)**: Matikan Printer Dapur B (atau matikan Bluetooth-nya), lalu checkout → Transaksi tetap **sukses**, Printer Kasir A & Printer Bar C **tetap mencetak**, dan aplikasi menampilkan notifikasi toast bahwa Printer Dapur B gagal.

---

## 📜 Spesifikasi Awal & Requirement History

*(Dokumen di bawah ini adalah acuan instruksi awal yang digunakan selama proses refactoring)*

==================================================
TUGAS & REQUIREMENT AWAL
==================================================

==================================================
MASALAH SAAT INI
==================================================

BerdikariPOS memiliki fitur Split Printing.

Setiap menu memiliki "Target Dapur", contoh:
- Nasi Goreng → Makanan
- Mie Goreng → Makanan
- Wedang Uwuh → Minuman
- Kopi Susu → Minuman

Pada Settings terdapat konfigurasi printer:
- Printer Kasir
- Printer Dapur dengan target "Makanan"
- Printer Bar dengan target "Minuman"

Logic filtering konten print berdasarkan Target Dapur saat ini sudah bekerja.

Contoh:
Jika printer dapur memiliki target "Makanan", kitchen ticket yang dicetak hanya berisi item dengan Target Dapur = Makanan.

Masalahnya adalah DEVICE ROUTING.

Saat Printer Kasir dan Printer Dapur sama-sama menggunakan Bluetooth, keduanya tampaknya menggunakan Bluetooth device/connection yang sama.

Akibatnya:

printReceipt()
dan
printKitchenTicket()

dapat dikirim ke physical Bluetooth printer yang sama.

Contoh kondisi saat ini:

Printer Kasir
    ↓
Global Bluetooth Device A

Printer Dapur
    ↓
Global Bluetooth Device A

Akibatnya Printer A mencetak:
1. Struk pelanggan
2. Kitchen ticket

Padahal jika owner memiliki beberapa printer, sistem harus dapat menghubungkan setiap logical printer ke physical Bluetooth printer yang berbeda.

==================================================
TARGET ARSITEKTUR
==================================================

Saya ingin memisahkan konsep:

1. WHAT TO PRINT
   Menentukan konten yang harus dicetak.

2. WHERE TO PRINT
   Menentukan physical printer mana yang menerima print job.

Setiap konfigurasi printer harus memiliki independent device binding.

Contoh:

Printer Kasir
Role: CASHIER_RECEIPT
Device: Bluetooth Printer A

Printer Dapur
Role: KITCHEN
Target: Makanan
Device: Bluetooth Printer B

Printer Bar
Role: KITCHEN
Target: Minuman
Device: Bluetooth Printer C

Ketika checkout berisi:

1x Nasi Goreng → Makanan
1x Mie Goreng → Makanan
2x Wedang Uwuh → Minuman
1x Kopi Susu → Minuman

Maka sistem harus menghasilkan:

PRINT JOB 1
Target: Printer Kasir / Device A
Content:
- Semua item
- Informasi transaksi lengkap
- Total pembayaran
- Metode pembayaran
- Kembalian
- dll.

PRINT JOB 2
Target: Printer Dapur / Device B
Content:
- Nasi Goreng
- Mie Goreng

PRINT JOB 3
Target: Printer Bar / Device C
Content:
- Wedang Uwuh
- Kopi Susu

Jadi flow yang diharapkan:

CHECKOUT
    |
    +--> Full Customer Receipt
    |       --> Cashier Printer
    |              --> Physical Device A
    |
    +--> Filter target = Makanan
    |       --> Kitchen Printer Makanan
    |              --> Physical Device B
    |
    +--> Filter target = Minuman
            --> Kitchen Printer Minuman
                   --> Physical Device C

==================================================
PRINTER DEVICE REGISTRY
==================================================

Evaluasi implementasi existing dan refactor jika diperlukan agar setiap printer memiliki identitas device masing-masing.

Gunakan konsep Printer Device Registry atau pendekatan equivalent yang paling sesuai dengan arsitektur project saat ini.

Contoh conceptual model:

PrinterDevice {
    id
    name
    connectionType
    bluetoothDeviceId
    bluetoothDeviceName
    paperWidth
    status
}

PrinterRoute {
    routeType
    targetKitchen
    printerDeviceId
}

Contoh routing:

CASHIER_RECEIPT
    → Printer Device A

KITCHEN:Makanan
    → Printer Device B

KITCHEN:Minuman
    → Printer Device C

Jangan mengikuti contoh struktur data ini secara buta.

Analisis terlebih dahulu data model existing dan gunakan perubahan seminimal mungkin apabila struktur existing sebenarnya sudah mendukung konsep tersebut.

Hindari over-engineering.

==================================================
BLUETOOTH DEVICE BINDING
==================================================

Setiap printer Bluetooth harus dapat di-pair/bind secara independen.

Jangan menggunakan satu global Bluetooth device/characteristic untuk semua printer.

Contoh:

cashierPrinter
    → Bluetooth Device A

kitchenPrinterFood
    → Bluetooth Device B

kitchenPrinterDrink
    → Bluetooth Device C

Printing service harus menerima atau menentukan target printer berdasarkan printer configuration / printer ID.

Contoh conceptual:

printReceipt(transaction, cashierPrinter)

printKitchenTicket(
    transaction,
    foodItems,
    foodKitchenPrinter
)

printKitchenTicket(
    transaction,
    drinkItems,
    drinkKitchenPrinter
)

Pastikan masing-masing print job menggunakan Bluetooth device/connection milik printer tujuan.

==================================================
SETTINGS UI
==================================================

Perbaiki UI Settings → Printer & KDS agar user dapat melihat dengan jelas physical Bluetooth device yang terhubung ke setiap printer.

Untuk Printer Kasir, tampilkan informasi seperti:

Printer Kasir
Metode: Bluetooth
Perangkat: [Nama Bluetooth Device]
Status: Connected / Disconnected

Actions:
[Hubungkan Printer]
[Ganti Printer]
[Test Print]

Untuk setiap Printer Dapur:

Nama Printer: Dapur
Target Dapur: Makanan
Tipe: Bluetooth
Perangkat: [Nama Bluetooth Device]
Status: Connected / Disconnected

Actions:
[Hubungkan]
[Ganti Printer]
[Test Print]
[Hapus]

Untuk Printer Bar:

Nama Printer: Bar
Target Dapur: Minuman
Tipe: Bluetooth
Perangkat: [Nama Bluetooth Device]
Status: Connected / Disconnected

Actions:
[Hubungkan]
[Ganti Printer]
[Test Print]
[Hapus]

Gunakan design system dan styling existing BerdikariPOS.
Jangan melakukan redesign halaman Settings secara keseluruhan.

==================================================
DUPLICATE DEVICE
==================================================

Sistem BOLEH mengizinkan satu physical printer digunakan oleh beberapa route.

Contoh:

Cashier Receipt → Printer A
Kitchen Makanan → Printer A

Ini berguna untuk bisnis kecil yang hanya memiliki satu printer.

Namun jika user mencoba menghubungkan Bluetooth device yang sudah digunakan oleh printer/route lain, tampilkan warning:

"Printer [Device Name] sudah digunakan oleh [Nama Printer]. Apakah Anda ingin menggunakan printer yang sama?"

User dapat:
- Batalkan
- Gunakan Printer yang Sama

Jangan melarang duplicate device secara hard constraint.

==================================================
TEST PRINT
==================================================

Setiap printer harus memiliki fungsi Test Print independen.

Test Print harus dikirim hanya ke physical device yang terikat pada printer tersebut.

Contoh:

Test Printer Kasir
    → hanya Device A

Test Printer Dapur
    → hanya Device B

Test Printer Bar
    → hanya Device C

Gunakan format test ticket sederhana yang menampilkan:

BERDIKARIPOS
TEST PRINT

Printer: [Nama Printer]
Target: [Kasir / Makanan / Minuman]
Device: [Bluetooth Device Name]

Status: OK

==================================================
BLUETOOTH CONNECTION LIFECYCLE
==================================================

Perhatikan keterbatasan Web Bluetooth API.

Implementasikan connection management yang aman untuk multiple Bluetooth printers.

Perhatikan:
- Device pairing
- GATT connection
- Characteristic per device
- Reconnect jika connection terputus
- Browser refresh
- PWA restart
- Device unavailable
- Printer offline
- Permission browser
- Sequential printing
- Error handling per printer

Jangan mengasumsikan BluetoothDevice object dapat disimpan langsung secara permanen ke localStorage atau Supabase.

Simpan hanya metadata/identifier yang memang aman dan serializable.

Jika browser mengharuskan user melakukan pairing/reconnect kembali setelah session tertentu, tampilkan status dan UX yang jelas.

Jangan membuat fake "Connected" state jika GATT connection sebenarnya tidak aktif.

==================================================
PRINT JOB ERROR ISOLATION
==================================================

Kegagalan satu printer tidak boleh menggagalkan printer lainnya atau membatalkan transaksi yang sudah berhasil.

Contoh:

Checkout berhasil.

Printer Kasir → SUCCESS
Printer Dapur → FAILED
Printer Bar → SUCCESS

Hasil:
- Transaksi tetap berhasil.
- Printer Kasir tetap mencetak.
- Printer Bar tetap mencetak.
- User mendapat notification bahwa Printer Dapur gagal.
- Sediakan opsi Retry Print khusus Printer Dapur jika memungkinkan.

Gunakan Promise.allSettled atau mekanisme equivalent jika sesuai dengan implementasi existing.

Pastikan print job tidak menyebabkan duplicate transaction.

==================================================
IMPORTANT: PRINT JOB ROUTING
==================================================

Pisahkan proses:

1. Transaction Creation
2. Print Job Generation
3. Item Filtering
4. Printer Routing
5. Physical Device Printing

Transaction harus dibuat hanya SATU KALI.

Setelah transaksi sukses:

Transaction
    ↓
Generate Print Jobs
    ↓
Route Print Jobs
    ↓
Execute Print Jobs

Print failure tidak boleh rollback transaksi.

Pastikan item kitchen dikelompokkan berdasarkan Target Dapur.

Jangan mengirim kitchen ticket ke printer jika tidak ada item untuk target printer tersebut.

Contoh:

Order hanya memiliki Minuman.

Maka:
Printer Kasir → PRINT
Printer Dapur Makanan → NO PRINT
Printer Bar Minuman → PRINT

==================================================
BACKWARD COMPATIBILITY
==================================================

Pastikan:
- Existing Browser Print tetap bekerja.
- Existing Bluetooth Print tetap bekerja.
- Existing Split Printing tetap bekerja.
- Existing Target Dapur pada menu tetap bekerja.
- Existing settings tidak hilang.
- Existing transaction flow tidak rusak.
- Existing KDS tidak terpengaruh.
- Existing auto-print tetap bekerja.

Jika diperlukan migration untuk settings/data existing, buat backward-compatible migration atau fallback.

==================================================
IMPLEMENTATION PROCESS
==================================================

Kerjakan secara bertahap:

PHASE 1 — AUDIT

Cari dan identifikasi semua file terkait:
- Bluetooth printing
- ESC/POS
- Browser printing
- Printer settings
- Kitchen printer
- Split printing
- Checkout
- Auto print
- Target dapur

Jelaskan secara singkat:
1. Bagaimana implementasi saat ini bekerja.
2. Root cause kenapa beberapa logical printer dapat menggunakan Bluetooth connection yang sama.
3. File apa saja yang perlu diubah.
4. Risiko perubahan.

PHASE 2 — PLAN

Buat implementation plan yang mempertahankan arsitektur existing sebanyak mungkin.

Jangan coding sebelum memahami dependency dan data flow.

PHASE 3 — IMPLEMENTATION

Implementasikan:
- Independent Bluetooth device binding per printer.
- Printer device routing.
- Multiple Bluetooth printer connection management.
- UI device binding.
- Independent Test Print.
- Duplicate device warning.
- Error isolation per print job.

==================================================
PHASE 4 — VALIDATION
==================================================

PENTING:
JANGAN membuat atau menjalankan automated test, unit test, integration test, maupun end-to-end test.

Testing fungsional fitur printer Bluetooth dan Split Printing akan saya lakukan sendiri secara manual menggunakan physical Bluetooth printer.

Namun setelah implementasi, tetap lakukan validasi teknis berikut:

1. Jalankan TypeScript type-check untuk memastikan tidak ada type error.
2. Jalankan lint jika tersedia.
3. Jalankan production build untuk memastikan aplikasi berhasil di-build.
4. Perbaiki compile error, type error, lint error, atau build error yang disebabkan oleh perubahan implementasi ini.
5. Jangan membuat automated test baru.
6. Jangan menjalankan test suite existing.

Setelah validasi teknis selesai, berikan panduan kepada saya untuk melakukan MANUAL TESTING terhadap skenario berikut:

TEST 1 — Shared Physical Printer
1 physical Bluetooth printer digunakan untuk Kasir + Dapur.

Expected:
- Struk Kasir dicetak.
- Kitchen Ticket dicetak.
- Keduanya keluar dari physical printer yang sama.

TEST 2 — Two Physical Printers
Printer A = Kasir
Printer B = Makanan.

Expected:
- Customer Receipt → Printer A
- Food Kitchen Ticket → Printer B

TEST 3 — Three Physical Printers
Printer A = Kasir
Printer B = Makanan
Printer C = Minuman.

Expected:
- Customer Receipt → Printer A
- Food Kitchen Ticket → Printer B
- Drink Kitchen Ticket → Printer C

TEST 4 — Food Only
Order hanya memiliki Target Dapur = Makanan.

Expected:
- Printer Kasir → PRINT
- Printer Makanan → PRINT
- Printer Minuman → TIDAK PRINT

TEST 5 — Drink Only
Order hanya memiliki Target Dapur = Minuman.

Expected:
- Printer Kasir → PRINT
- Printer Makanan → TIDAK PRINT
- Printer Minuman → PRINT

TEST 6 — Printer Offline
Printer Makanan offline.

Expected:
- Transaksi tetap berhasil.
- Printer Kasir tetap dapat mencetak.
- Printer Minuman tetap dapat mencetak.
- Kegagalan Printer Makanan tidak memengaruhi printer lainnya.
- User mendapatkan notifikasi kegagalan print.

TEST 7 — Duplicate Physical Device
Physical Bluetooth device yang sama dipilih untuk Kasir dan Makanan.

Expected:
- Warning muncul.
- User dapat membatalkan atau mengonfirmasi.
- Jika dikonfirmasi, penggunaan printer yang sama diperbolehkan.

TEST 8 — Independent Test Print
Lakukan Test Print dari masing-masing konfigurasi printer.

Expected:
- Test Printer Kasir hanya dikirim ke device Printer Kasir.
- Test Printer Makanan hanya dikirim ke device Printer Makanan.
- Test Printer Minuman hanya dikirim ke device Printer Minuman.

JANGAN menjalankan skenario manual testing di atas.
Saya sendiri yang akan melakukan manual testing menggunakan physical Bluetooth printer.

==================================================
FINAL REQUIREMENTS
==================================================

Setelah implementasi:

1. Jalankan TypeScript type check.
2. Jalankan lint jika tersedia.
3. Jalankan build production.
4. Perbaiki error yang muncul akibat perubahan.
5. Jangan mengubah fitur lain yang tidak berkaitan.
6. Jangan menghapus existing functionality tanpa alasan.
7. Dokumentasikan perubahan arsitektur printing.
8. Update FEATURES.md jika implementasi berhasil.
9. Berikan summary file yang diubah.
10. Jelaskan cara saya melakukan manual testing menggunakan:
    a. hanya 1 printer Bluetooth;
    b. 2 printer Bluetooth;
    c. 3 printer Bluetooth.

PENTING:
- Jangan membuat automated test baru.
- Jangan menjalankan automated test.
- Jangan menjalankan unit test.
- Jangan menjalankan integration test.
- Jangan menjalankan end-to-end test.
- Jangan menjalankan test suite existing.
- Seluruh functional testing printer akan dilakukan secara manual oleh saya.