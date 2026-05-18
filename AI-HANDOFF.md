# 🤖 Panduan Handoff ke AI Developer Lain

## Cara Melanjutkan Pengembangan dengan AI Lain (Antigravity, Cursor, dll)

---

## 1. File yang WAJIB Diberikan ke AI

Berikan file-file ini sebagai konteks awal agar AI memahami seluruh aplikasi:

### Prioritas 1 (Wajib — berikan di awal percakapan):

| File | Fungsi |
|------|--------|
| `PRD.md` | Dokumen lengkap: arsitektur, fitur, data model, business logic |
| `FEATURES.md` | Daftar semua fitur & keunggulan |
| `src/types/index.ts` | Semua TypeScript interfaces (data model) |
| `package.json` | Dependencies & scripts |

### Prioritas 2 (Berikan jika AI perlu detail implementasi):

| File | Fungsi |
|------|--------|
| `src/lib/cloudSync.ts` | Cloud sync logic (Supabase integration) |
| `src/lib/offlineQueue.ts` | Offline queue & auto-retry |
| `src/store/*.ts` | State management (semua Zustand stores) |
| `vite.config.ts` | Build config + PWA setup |
| `supabase/schema.sql` | Database schema |

### Prioritas 3 (Berikan jika AI perlu ubah halaman tertentu):

| File | Fungsi |
|------|--------|
| `src/pages/POS.tsx` | Halaman kasir (paling kompleks) |
| `src/pages/Kitchen.tsx` | KDS dengan real-time |
| `src/pages/Reports.tsx` | Laporan dengan chart + PDF |
| `src/components/Layout.tsx` | Sidebar, shift modals, navigation |

---

## 2. Prompt Template untuk AI Baru

Copy-paste prompt ini saat memulai percakapan dengan AI baru:

```
Saya memiliki aplikasi POS (Point of Sale) bernama "Rempah Story POS" yang sudah production.

Tech Stack:
- React 18 + TypeScript + Vite 5
- TailwindCSS 3.4
- Zustand (state management + localStorage persist)
- Supabase (PostgreSQL + Real-time subscriptions)
- Chart.js, jsPDF, bcryptjs
- PWA (vite-plugin-pwa)
- Deployed di Vercel

Arsitektur:
- Local-first: data di localStorage, sync ke Supabase (background)
- Offline queue: operasi gagal di-queue, auto-retry saat online
- Real-time: Supabase subscriptions untuk KDS multi-device
- Code-splitting: React.lazy() per halaman

Saya akan berikan file PRD.md dan types/index.ts sebagai konteks.
Tolong pelajari dulu sebelum mulai coding.

[PASTE ISI PRD.md DI SINI]
[PASTE ISI src/types/index.ts DI SINI]
```

---

## 3. Cara Memberikan Knowledge Base

### Opsi A: Antigravity / Bolt.new
1. Buka project dari GitHub: `https://github.com/Lemillion-base/rempah-story-pos`
2. AI akan otomatis membaca seluruh codebase
3. Berikan instruksi: "Pelajari PRD.md dan FEATURES.md dulu sebelum mulai"

### Opsi B: Cursor AI
1. Buka folder project di Cursor
2. Cursor otomatis index seluruh file
3. Gunakan `@PRD.md` atau `@types/index.ts` untuk referensi
4. Cursor sudah punya konteks penuh dari codebase

### Opsi C: ChatGPT / Claude (tanpa akses file)
1. Copy-paste isi `PRD.md` sebagai pesan pertama
2. Copy-paste isi `src/types/index.ts` sebagai pesan kedua
3. Baru mulai berikan instruksi pengembangan

### Opsi D: GitHub Copilot Workspace
1. Buka repo di GitHub
2. Copilot otomatis memahami codebase
3. Buat issue → Copilot suggest implementation

---

## 4. Konteks Penting yang Harus AI Tahu

### Arsitektur Data Flow:
```
[User Action di Browser]
    ↓
[Zustand Store] → localStorage (instant)
    ↓ (async, background)
[cloudSync.ts] → smartUpsert/smartUpdate/smartDelete
    ↓
[offlineQueue.ts] → jika offline, queue operasi
    ↓ (saat online)
[Supabase PostgreSQL]
    ↓ (real-time subscription)
[Device lain] → fetchFromCloud → update local store
```

### Konvensi Kode:
- **Store pattern**: Zustand + persist + cloud sync di setiap mutasi
- **Naming**: camelCase di TypeScript, snake_case di database
- **Components**: functional components + hooks
- **Styling**: TailwindCSS utility classes, custom `.btn-primary`, `.card`, `.input` di index.css
- **Icons**: Lucide React (import per icon)
- **Modals**: komponen `Modal.tsx` reusable
- **Konfirmasi**: komponen `ConfirmDialog.tsx` untuk aksi destruktif
- **Toast**: `useToastStore().addToast(message, type)` untuk feedback

### Environment Variables:
```
VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
```

### Deploy Flow:
```
git push origin main → Vercel auto-deploy (1-2 menit)
```

### Database:
- Schema di `supabase/schema.sql`
- Semua tabel di schema `public`
- RLS enabled dengan policy "allow all" (MVP)
- Real-time enabled untuk tabel `transactions`

---

## 5. Hal yang Perlu Diperhatikan

### ⚠️ Jangan Lakukan:
- Jangan ubah struktur localStorage keys (akan break data existing user)
- Jangan hapus `persist` dari store (data user hilang)
- Jangan ubah Supabase table/column names tanpa migrasi
- Jangan expose Server Key / Secret Key di frontend
- Jangan ubah `.env` format (VITE_ prefix wajib untuk Vite)

### ✅ Boleh Dilakukan:
- Tambah field baru ke interface (backward compatible)
- Tambah store baru
- Tambah halaman baru (dengan React.lazy di App.tsx)
- Tambah kolom baru ke Supabase (ALTER TABLE ADD COLUMN)
- Ubah UI/styling sesuka hati

### 🔄 Jika Ubah Data Model:
1. Update `src/types/index.ts`
2. Update store yang terkait
3. Update `cloudSync.ts` (mapping camelCase ↔ snake_case)
4. Jalankan ALTER TABLE di Supabase SQL Editor
5. Test di dev → push → auto-deploy

---

## 6. Fitur yang Belum Diimplementasi (Roadmap)

Jika ingin melanjutkan development, berikut prioritas:

| # | Fitur | Kompleksitas | Detail |
|---|-------|-------------|--------|
| 1 | Multi-outlet | High | Tambah `store_id` di semua tabel, filter per outlet |
| 2 | Payment Gateway (QRIS) | High | Perlu Supabase Edge Function + Midtrans API |
| 3 | QR Self-Order | Medium | Generate QR per meja, halaman order publik |
| 4 | Push Notification | Medium | Web Push API + service worker |
| 5 | Dark Mode | Low | Tambah `dark:` classes di TailwindCSS |
| 6 | Multi-language | Medium | i18n library (react-i18next) |
| 7 | Stock log viewer UI | Low | Halaman baru untuk lihat riwayat stok |
| 8 | Loyalty tier badge di CRM | Low | Tampilkan Bronze/Silver/Gold di card pelanggan |

---

## 7. Testing Checklist

Setelah AI membuat perubahan, pastikan:

```bash
# 1. Type check (harus 0 errors)
npx tsc --noEmit

# 2. Build (harus success)
npx vite build

# 3. Test manual:
# - Login semua role (manager, kasir, acaraki)
# - Buat pesanan → cek masuk KDS
# - Tutup shift → cek print
# - Cek di device berbeda (multi-device sync)

# 4. Deploy
git add . && git commit -m "description" && git push origin main
```

---

## 8. Kontak & Resources

- **Repository**: https://github.com/Lemillion-base/rempah-story-pos
- **Hosting**: Vercel (auto-deploy on push)
- **Database**: Supabase (ppffuacvktsgfhacilte.supabase.co)
- **PRD lengkap**: `PRD.md` di root project
- **Fitur lengkap**: `FEATURES.md` di root project
- **Deploy guide**: `DEPLOYMENT.md` di root project

---

*Dokumen ini dibuat agar AI developer manapun bisa melanjutkan pengembangan tanpa kehilangan konteks.*
