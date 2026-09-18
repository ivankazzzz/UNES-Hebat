---
name: Nad Absensi UNES
description: Catatan kerja tunggal untuk aplikasi Absensi UNES-AAI. Semua ringkasan progress, alur tanggal, risiko, file penting, dan aturan verifikasi disatukan di sini.
---

# AGENTS.md - Absensi UNES-AAI

File ini adalah pusat catatan kerja untuk repo:

`C:\Users\Administrator\Documents\GitHub\absensiunesv2`

Setiap sesi baru wajib membaca file ini dulu. Tujuannya agar Nad tidak lupa apa yang sudah pernah dicek, apa yang pernah terjadi, bagian mana yang berisiko, dan cara kerja yang Ipan inginkan.

## 1. Cara Nad Bekerja Dengan Ipan

- Panggil pengguna dengan `pan` atau `ipan`.
- Boleh menyebut diri sebagai `Nad`.
- Pakai bahasa Indonesia yang hangat, sederhana, dan bertahap.
- Kalau Ipan minta "cek dulu", jangan langsung edit.
- Kalau Ipan minta "gunakan mcp dbabsensiunes", lakukan lewat MCP lalu verifikasi hasilnya.
- Jelaskan akar masalah dulu sebelum memberi solusi teknis.
- Untuk klaim status seperti "sudah aktif", "sudah aman", "sudah terhubung", "sudah masuk database", atau "sudah selesai", wajib cek bukti real dulu.
- Jangan mengandalkan riwayat chat saja. Cek file asli, build, database, log, atau MCP yang aktif.

## 2. Identitas Aplikasi

- Nama aplikasi: Absensi UNES-AAI.
- Instansi: Universitas Ekasakti.
- Fungsi: sistem informasi manajemen kehadiran.
- Pengguna utama: dosen struktural dan tenaga kependidikan.
- Platform: web, PWA/mobile web, dan Android melalui Capacitor.
- Hosting/deployment web: Cloudflare Pages.
- Backend utama: Supabase PostgreSQL, Storage, RPC, RLS, dan Edge Functions.

Fitur utama:

- absensi masuk dan pulang,
- validasi lokasi GPS/geofencing,
- bukti foto/selfie,
- timestamp dan koordinat,
- izin, cuti, dan dinas luar,
- manajemen user,
- hari libur,
- jam kerja custom,
- laporan PDF individu dan rekap,
- notifikasi Telegram.

## 3. Stack Teknis

Berdasarkan `package.json` dan dokumentasi lama:

- React 18.3.1
- Vite 6.3.4
- TypeScript
- Tailwind CSS
- shadcn/ui dan Radix UI
- Supabase JS 2.74.0
- TanStack React Query
- React Router
- Capacitor Android/iOS
- jsPDF dan jspdf-autotable
- lucide-react

Perintah penting:

```powershell
pnpm install
pnpm dev
pnpm build
pnpm lint
pnpm preview
```

Jika mengubah frontend, minimal usahakan `pnpm build` berhasil. Jika gagal, jelaskan error yang real.

## 4. Struktur Penting Repo

- `src/pages/Attendance.tsx`: alur utama absensi, geofencing, foto, waktu, dan submit absensi.
- `src/pages/Login.tsx`: halaman login.
- `src/lib/auth.ts`: custom auth, session localStorage, session version, bypass flags.
- `src/lib/supabase.ts`: client Supabase dan tipe dasar.
- `src/lib/supabase-helpers.ts`: helper lokasi/data Supabase.
- `api/telegram-evidence.ts`: notifikasi/foto evidence Telegram bila tersedia di repo.
- `functions/`: Edge Function terkait Supabase bila ada.
- `supabase/`: migrasi atau konfigurasi Supabase bila ada.
- `android/`: project Android Capacitor.
- `.env.example`: contoh env.
- `.env`: env lokal. Jangan tampilkan isinya di jawaban.
- `AGENTS.md`: file catatan tunggal ini.

Catatan penting: dokumentasi lama seperti `repowiki/*.md`, `januari.md`, `reportaccident1.md`, `perubahanrls6maret2026.md`, `dosenstruktural.md`, dan `src/redesign_summary.md` sudah diringkas ke file ini agar tidak tercecer.

## 5. Environment dan Rahasia

Variabel penting yang pernah didokumentasikan:

- `VITE_SUPABASE_URL`: URL project Supabase.
- `VITE_SUPABASE_ANON_KEY`: anon key untuk client.
- `SUPABASE_SERVICE_ROLE_KEY`: hanya untuk backend/admin. Jangan pernah taruh di frontend.
- `VITE_ATTENDANCE_TELEGRAM_CHAT_ID`: chat ID Telegram dari frontend.
- `TELEGRAM_BOT_TOKEN`: token bot untuk Edge Function/backend.
- `TELEGRAM_TARGET_CHAT_ID`: target chat Telegram bila dipakai.
- `VITE_ENABLE_TEACHING_ATTENDANCE`: feature flag.

Aturan:

- Jangan menulis token/key asli ke file ini.
- Jangan copy isi `.env` ke chat.
- Jika perlu cek env, cukup sebut apakah variabel ada atau tidak, jangan bocorkan nilainya.

## 6. Database dan Supabase

Project Supabase yang pernah dipakai:

- Project ref: `fxwtdohwjylsptcnoxhe`
- URL: `https://fxwtdohwjylsptcnoxhe.supabase.co`
- REST base: `https://fxwtdohwjylsptcnoxhe.supabase.co/rest/v1/`
- RPC base: `https://fxwtdohwjylsptcnoxhe.supabase.co/rest/v1/rpc/`
- Edge Functions base: `https://fxwtdohwjylsptcnoxhe.supabase.co/functions/v1/`
- Storage base: `https://fxwtdohwjylsptcnoxhe.supabase.co/storage/v1/`

MCP yang dipakai untuk pekerjaan database:

- `dbAbsensiUNES`
- Namespace tool biasanya: `mcp__dbAbsensiUNES__`
- Cek koneksi rendah risiko: `get_project_url`
- Cek schema: `list_tables`
- Cek migrasi: `list_migrations`
- Query read-only/write: `execute_sql`
- DDL: gunakan `apply_migration` jika tersedia
- Security/performance: `get_advisors`

Jangan klaim MCP aktif hanya karena catatan lama bilang aktif. Cek langsung di sesi sekarang.

## 7. Tabel Database Penting

Berdasarkan dokumentasi lama, tabel utama:

- `users`: data pengguna, role, unit kerja, lokasi utama/sekunder, bypass, blokir.
- `attendances`: data absensi masuk/pulang, foto, koordinat, status, catatan.
- `attendance_locations`: titik lokasi absensi dan radius.
- `leave_permits`: izin, cuti, dinas luar.
- `holidays`: hari libur.
- `campus_buildings`: gedung kampus.
- `user_passwords`: catatan password untuk distribusi, sensitif.
- `user_work_schedules`: jam kerja custom per user.
- `users_status_backup`: backup/status lama, belum tentu dipakai.

Data row count di dokumentasi lama bisa basi. Jika Ipan tanya jumlah data terbaru, wajib query live.

## 8. Auth dan Session

Sistem auth bukan Supabase Auth bawaan. Auth dibuat custom di atas PostgreSQL/Supabase.

Alur login:

1. User input username dan password di `src/pages/Login.tsx`.
2. Frontend validasi form.
3. Frontend memanggil RPC `verify_user_password`.
4. Database mengecek password/hash.
5. Frontend cek `is_blocked`. Jika `is_blocked = true`, tampilkan notifikasi penolakan akses: *"Maaf, sistem absensi online diperuntukkan untuk Dosen Struktural, Tenaga Kependidikan, Universitas Ekasakti."* (via `setShowAccessDenied(true)`). Jangan gunakan pesan "Akses terbatas hanya untuk pengguna yang terdaftar".
6. Session disimpan ke localStorage.
7. User masuk dashboard.

Session localStorage yang pernah didokumentasikan:

- `absensi_unes_auth`
- `absensi_unes_session_ts`
- `absensi_unes_session_version`

Catatan risiko:

- session di localStorage punya risiko XSS,
- session timeout banyak bergantung ke client,
- session version pernah hardcoded di `src/lib/auth.ts`.

## 9. Fitur Absensi

Alur umum absensi:

1. User buka halaman Absensi.
2. Sistem ambil lokasi GPS.
3. Sistem cek geofencing.
4. User pilih masuk/pulang.
5. User ambil foto.
6. Data dikirim ke server/Supabase.
7. Notifikasi Telegram dikirim bila aktif.

Validasi yang perlu dicek:

- geofencing,
- waktu absensi,
- foto wajib,
- GPS aktif,
- mock location,
- duplicate attendance pada hari yang sama,
- hari libur,
- bypass geofencing,
- bypass time restrictions,
- lokasi primer dan sekunder.

Default lama yang pernah terdokumentasi:

- radius default 75 meter,
- masuk sekitar 07:30 sampai 08:30,
- pulang sekitar 17:00 sampai 18:00.

Jangan percaya jam default lama bila ada perubahan di database. Cek live jika sedang debugging absensi.

## 10. Server-Time Attendance Hardening

Catatan penting dari pekerjaan sebelumnya:

- Gate absensi utama ada di `src/pages/Attendance.tsx`.
- Risiko lama: validasi waktu pernah bergantung ke `new Date()` dari device/user.
- Ini berbahaya karena jam HP bisa dimanipulasi.
- Desain yang lebih kuat: validasi dan insert absensi dilakukan oleh Supabase RPC.
- RPC penting: `public.submit_attendance_server_time(...)`.
- Server time memakai `timezone('Asia/Jakarta', now())`.
- Perbaikan harus mencakup jadwal default dan `user_work_schedules`.
- End minute harus inklusif sampai detik `:59`.

Contoh batas:

- `08:30:59` masih termasuk window.
- `08:31:00` sudah di luar window.
- `17:00:59` masih termasuk bila end-nya 17:00.
- `17:01:00` sudah di luar.

Jika Ipan lapor "jam masih ketutup" atau "absen tidak bisa padahal masih menitnya", cek:

- `src/pages/Attendance.tsx`,
- RPC `submit_attendance_server_time`,
- `user_work_schedules`,
- `check_in_start`,
- `check_in_end`,
- `check_out_start`,
- `check_out_end`,
- zona waktu WIB/Asia Jakarta.

## 11. Geofencing dan Lokasi

Geofencing bekerja dengan:

- koordinat user dari GPS,
- koordinat titik absensi,
- perhitungan jarak Haversine,
- radius lokasi,
- lokasi primer dari `primary_location`,
- lokasi sekunder dari `secondary_location`,
- fallback ke `unit_kerja` bila ada pola lama.

Ada flag penting di `users`:

- `bypass_geofencing`
- `bypass_time_restrictions`
- `secondary_location`
- `primary_location`
- `is_blocked`

Jika bug lokasi muncul, cek parsing nama lokasi dan data `attendance_locations`.

## 12. Laporan dan PDF

Fitur laporan memakai:

- `jspdf`
- `jspdf-autotable`
- data absensi dari Supabase

Risiko yang pernah dicatat:

- potensi memory leak PDF jika rentang data terlalu besar,
- perlu pembatasan range,
- perlu handling data besar secara bertahap.

Jika laporan error, cek ukuran data, range tanggal, dan query yang dipakai.

## 13. Telegram Evidence

Fitur Telegram:

- mengirim bukti foto absensi,
- caption berisi data user, waktu, lokasi, dan jenis absensi,
- memakai Edge Function/backend agar token bot tidak bocor.

Risiko kritikal yang pernah didokumentasikan:

- token Telegram jangan berada di frontend.
- Bila ada `TELEGRAM_BOT_TOKEN` di bundle frontend, itu harus diperbaiki.

## 14. UI dan Redesign

### Official Color Palette

Warna resmi aplikasi Absensi UNES-AAI (sejak 2026-07):

| Role | Warna | Kode |
|---|---|---|
| **Primer** | Merah/Maroon | `#8c1b1d` |
| **Primer Variasi Gelap** | Dark Red | `#7a1819` |
| **Primer Variasi Paling Gelap** | Deepest Red | `#6b1516` |
| **Gradient Mid** | Medium Red | `#b52020` |
| **Gradient Light** | Light Red | `#c0392b` |
| **Aksen** | Gold/Yellow | `#fbbf24` |
| **Secondary Hover** | Hover Red | `#a02020` |

Gradient umum: `from-[#8c1b1d] to-[#7a1819]` (header solid), `from-[#8c1b1d] to-[#fbbf24]` (CTA/aksen emas), `from-[#8c1b1d] via-[#b52020] to-[#c0392b]` (gradient lebar).

Catatan redesign lama:

- Gaya Neo-Brutalism pernah dihapus.
- UI diarahkan ke tampilan modern, bersih, profesional.
- Font yang pernah dipakai: Inter dan Poppins.
- Halaman yang pernah disentuh: Dashboard, Attendance, History, Profile, Admin.
- Build pernah dicatat berhasil saat redesign dibuat, tetapi status terbaru harus tetap diuji ulang.

Jika mengubah UI:

- pertahankan gaya profesional,
- jangan kembali ke gaya brutalist,
- **patuhi Official Color Palette di atas** (merah primer `#8c1b1d`, gold aksen `#fbbf24`),
- gunakan lucide-react untuk ikon,
- cek mobile layout,
- jalankan build.

## 15. Known Bugs

Bug yang pernah dicatat:

- BUG-001: Session Version Hardcoded, severity medium, status open.
- BUG-002: Location Name Parsing Issues, severity low, status open.
- BUG-003: PDF Memory Leak Potential, severity medium, status open.
- BUG-004: Timezone Inconsistency, severity low, status open.
- BUG-005: Error Handling Inconsistent, severity low, status open.

Sebelum membuat bug baru, cek apakah sebenarnya masuk salah satu bug di atas.

## 16. Security Risks

Kerentanan yang pernah didokumentasikan:

- VULN-001: API keys exposed di client-side, high.
- VULN-002: session di localStorage, medium.
- VULN-003: RLS policies terlalu permissive, high.
- VULN-004: password history tidak enforced, low.
- VULN-005: mock location detection hanya Android, medium.
- VULN-006: session timeout client-side only, medium.
- VULN-007: no rate limiting, high.
- VULN-008: Telegram bot token di frontend, critical.
- VULN-009: delete cascade cause data loss, high.

Catatan:

- Beberapa status di atas berasal dari dokumentasi lama. Wajib cek live sebelum menyatakan masih open atau sudah selesai.
- Karena pernah ada insiden delete data, setiap perubahan RLS/grant/RPC harus sangat hati-hati.

## 17. Timeline Project

### 2025-01-15 - Risiko API key client-side dicatat

- Catatan lama menyebut Supabase URL dan anon key terlihat di client bundle.
- Ini normal sebagian untuk anon key, tetapi hanya aman bila RLS benar.
- Risiko menjadi tinggi bila RLS terlalu longgar.

### 2025-01-20 - Risiko session localStorage dicatat

- Session user disimpan di localStorage.
- Dampak utama: rentan bila ada XSS.
- Perlu penguatan sanitasi, CSP, session expiry, dan mekanisme logout.

### 2025-03 - Fitur bypass ditambahkan

- Ditambahkan bypass geofencing untuk user tertentu.
- Ditambahkan bypass time restrictions untuk user tertentu.
- Kolom penting: `users.bypass_geofencing`, `users.bypass_time_restrictions`.

### 2025-12-25 - Session version update

- Session version pernah dinaikkan ke `3`.
- Tujuan: force logout user.
- Ditambahkan support multiple secondary locations.
- Kolom penting: `users.secondary_location`.
- Dampak: user perlu login ulang.

### 2026-01 - Laporan absensi tendik Januari

- Laporan lama memuat absensi tendik periode 1 sampai 31 Januari 2026.
- Ada catatan libur nasional dan Minggu.
- File lama `januari.md` sudah digabung ringkas ke file ini.
- Jika butuh data detail, query database atau pulihkan dari git history bila file sudah dihapus.

### 2026-02-11 - Insiden kehilangan data database

- Data database pernah terkonfirmasi kosong di tabel operasional utama.
- Penyebab yang dicatat: request DELETE/RPC valid via API Supabase.
- IP yang dicatat: `182.4.71.166`.
- User-Agent yang dicatat: `PostmanRuntime/7.43.0`.
- Tabel terdampak menurut catatan lama: `users`, `attendances`, `leave_permits`, `holidays`, `campus_buildings`, dan tabel operasional lain.
- Kesimpulan lama: logical data deletion, bukan crash infrastruktur.
- Akar risiko lama: grant terlalu luas, RLS permisif, RPC SECURITY DEFINER terbuka untuk `anon/authenticated`.
- Tindak lanjut lama: restore backup, hardening RLS, revoke grant berbahaya, rotate API keys.

### 2026-03-06 - Perubahan RLS holidays dan leave_permits

- RLS `holidays` diperkuat.
- RLS `leave_permits` diperkuat.
- Pola lama:
  - SELECT cenderung read-only lebih luas,
  - INSERT/UPDATE/DELETE harus dibatasi role dan pemilik data.
- File lama `perubahanrls6maret2026.md` sudah digabung ringkas ke file ini.
- Jika mengubah RLS lagi, cek policy live dengan MCP.

### 2026-04-29 - Supabase MCP dan server-time attendance

- MCP `dbAbsensiUNES` pernah disiapkan dan dipakai.
- Attendance flow pernah dianalisis.
- Risiko device clock manipulation ditemukan.
- Solusi yang dipilih: validasi server-time melalui Supabase RPC.
- RPC penting: `submit_attendance_server_time`.
- Wajib cek ulang live sebelum klaim masih aktif.

### 2026-05-04 - Jadwal kerja khusus user

- Pernah ada pekerjaan insert/update `public.user_work_schedules` untuk user tertentu.
- Jam kerja khusus harus ikut logika server-time.
- Jika Ipan memberi jam WIB exact, pertahankan jam itu apa adanya.

### 2026-05-13 - End minute absensi dibuat inklusif

- Masalah: absensi terasa tertutup saat masih di menit akhir.
- Prinsip perbaikan: end minute berlaku sampai detik `:59`.
- Berlaku untuk default schedule dan `user_work_schedules`.

### 2026-05-22 - Insert absensi manual Dora Tiara

- Pernah ada admin write langsung lewat `dbAbsensiUNES`.
- Data yang diberikan Ipan harus dipertahankan exact, seperti tanggal, jam WIB, username, dan nama foto.
- Setelah write, wajib verifikasi row hasil.

### 2026-05-25 - AGENTS.md dibuat dan semua catatan digabung

- Tujuan: menjadikan `AGENTS.md` sebagai catatan tunggal.
- Dokumen lama yang diringkas: `repowiki/*.md`, `januari.md`, `reportaccident1.md`, `perubahanrls6maret2026.md`, `dosenstruktural.md`, `src/redesign_summary.md`.
- Setelah penggabungan, file markdown aplikasi lama boleh dihapus agar tidak tercecer.

### 2026-05-25 - Rencana fitur laporan per pengguna

- Tujuan: menambahkan laporan bulanan resmi per pengguna dari halaman admin.
- Bentuk yang dipilih: PDF ringkas satu halaman seperti contoh, tetapi memakai data real aplikasi.
- Input: pilih nama pegawai/dosen, bulan, dan tahun.
- Identitas PDF: pakai field aplikasi yang tersedia, yaitu nama, username, role, unit kerja, lokasi utama/sekunder, dan status struktural.
- Rekap ketidakhadiran: sakit dari izin yang deskripsinya mengandung kata sakit, cuti dari permit_type cuti, alpa dari hari kerja tanpa absen dan tanpa izin/cuti/dinas/libur.
- Penandatangan: Wakil Rektor II, Dr. Susi Delmiati, S.H, M.H.

### 2026-05-25 - Hosting aplikasi

- Catatan deployment: aplikasi web Absensi UNES-AAI di-host melalui Cloudflare Pages.
- Jika ada pekerjaan deploy, cek konfigurasi Cloudflare Pages dan hasil build sebelum mengklaim versi live sudah berubah.

### 2026-05-25 - Revisi laporan per pengguna dengan lampiran foto

- Tujuan: menyederhanakan halaman laporan per pengguna dan melampirkan foto attendance pada PDF.
- Perubahan UI: input cari nama pegawai/dosen dihapus, pilihan pengguna cukup dari dropdown.
- Perubahan PDF: halaman pertama tetap rekap resmi, lalu halaman lampiran foto attendance selama periode bulan/tahun terpilih.
- Sumber foto: `attendances.photo_url`, terutama format `telegram:file:{fileId}` yang diambil melalui `/api/telegram-photo`.

### 2026-05-25 - Preview laporan per pengguna disamakan dengan PDF

- Tujuan: halaman `laporan-per-pengguna` menampilkan preview data yang sama seperti PDF sebelum tombol unduh dipakai.
- Perubahan UI: preview memuat identitas pegawai/dosen, `DATA ABSENSI`, dan lampiran per tanggal dengan kolom absen masuk dan absen pulang.
- Perilaku preview: jika foto tersedia maka tampil thumbnail; jika tidak ada absen maka tampil `Alpha` atau keterangan izin/cuti/dinas luar sesuai data periode.
- Perubahan teknis: tombol `Unduh PDF` memakai data preview yang sudah dimuat agar isi layar dan PDF konsisten.
- Verifikasi: `pnpm build` berhasil pada 2026-05-25.

### 2026-07-03 - Tambah menu Kalender Akademik di Layanan Untuk Anda

- Tujuan: menambahkan menu baru "Kalender Akademik" di halaman Index, grid Layanan Untuk Anda.
- File yang diubah: `src/pages/Index.tsx`.
- Perubahan:
  - Menambahkan konstanta `KALENDER_AKADEMIK_URL` dengan link OneDrive kalender akademik.
  - Menambahkan tombol menu dengan ikon `Calendar` (indigo) yang membuka link di tab baru (`window.open` with `noopener,noreferrer`).
  - Visibilitas: semua role (`superadmin`, `admin`, `dosen`, `pegawai`).
- Verifikasi: `pnpm build` berhasil tanpa error.

### 2026-07-03 - Tambah menu Perpustakaan di Layanan Untuk Anda

- Tujuan: menambahkan menu "Perpustakaan" di halaman Index, grid Layanan Untuk Anda.
- File yang diubah: `src/pages/Index.tsx`.
- Perubahan:
  - Menambahkan import `BookOpen` dari lucide-react.
  - Menambahkan konstanta `PERPUSTAKAAN_URL = "https://absenpustaka.irfanananda28.com/statistik"`.
  - Menambahkan tombol menu dengan ikon `BookOpen` (teal) yang membuka link di tab yang sama (`window.location.href`).
  - Visibilitas: semua role (`superadmin`, `admin`, `dosen`, `pegawai`).

### 2026-07-03 - Tambah halaman laporan-kehadiran-kkn

- Tujuan: membuat halaman laporan PDF khusus Pembekalan KKN untuk DPL KKN dan Mahasiswa.
- File dibuat: `src/pages/LaporanKehadiranKKN.tsx` (disalin dan disederhanakan dari `LaporanKehadiran3.tsx`).
- File diubah: `src/App.tsx` (route `/admin/laporan-kehadiran-kkn`), `src/pages/Admin.tsx` (menu item dengan ikon `GraduationCap`).
- Cakupan: `DPL KKN` (filter `is_dpl_kkn = true`) dan `Mahasiswa` (filter `role = 'mahasiswa'`).
- Tidak ada sorting unit kerja/jabatan kompleks — pakai alphabetical nama.
- Judul PDF: **LAPORAN KEHADIRAN PEMBEKALAN KKN DPL DAN MAHASISWA**.
- Sesi hardcoded (tidak pakai bulan/minggu dinamis):
  - 5 sesi individual (Sabtu 18 Juli: 2 sesi, Minggu 19 Juli: 3 sesi)
  - 3 opsi rekap: Rekap Sabtu, Rekap Minggu, Rekap Sabtu & Minggu (kumulatif tanpa filter jam)
- Filter attendance: sesi regular filter by date + WIB time window; rekap filter by date saja.
- PDF: legal landscape, 2 peserta/halaman, foto 2.5cm, Bukti Masuk + Bukti Pulang per sel.
- Sumber foto: Telegram via `/api/telegram-photo`.
- Tabel database: tetap pakai `attendances`, `users`, `leave_permits`, `holidays` — tidak ada tabel baru.
- Verifikasi: `pnpm build` berhasil (2026-07-03).
- Catatan: sesi masih hardcoded di frontend. Untuk KKN berikutnya perlu update `SESSIONS` constant. Validasi absensi (submit) untuk mahasiswa KKN belum diimplementasikan — baru laporan PDF saja.

### 2026-07-05 - Redesign Visual Profile, Welcome Screen, History & Home

- Tujuan: Melakukan pembaruan UI/UX secara komprehensif agar selaras dengan brand UNES (merah maroon/emas kuning), modern, tegas (no grey), dan hemat ruang.
- File yang diubah: `src/pages/Login.tsx`, `src/pages/Profile.tsx`, `src/pages/Index.tsx`, `src/pages/History.tsx`.
- Perubahan:
  - Welcome Screen: Warna gradient merah maroon khas UNES, logo UNES zoom-in smooth, & delay fade out terkontrol.
  - Profile: Layout flat minimalis ala Grab/Gojek, warna dasar bersih, border stroke tebal brand color, & fallback detail lokasi absensi.
  - History: Modal receipt solid, list card ber-border tegas maroon/kuning (no grey), dan header close button shadcn/ui.
  - Home: Desain strip horizontal statistics baris tunggal super ringkas & auto-open Play Store pada banner ke-1.
- Verifikasi: `pnpm build` berhasil sukses 100%.

### 2026-07-06 - Fitur Absensi Pembekalan KKN & Impor Akun Mahasiswa KKN

- Tujuan: Mengimplementasikan sistem absensi pembekalan KKN, mengimpor database mahasiswa, dan mensinkronisasikan nomor BP ke laporan.
- File & Database yang diubah: `kkn_sessions` & `submit_attendance_kkn` (DB), `src/pages/AttendanceKKN.tsx` (Baru), `src/App.tsx` (Route), `src/pages/Index.tsx`, `src/pages/LaporanKehadiranKKN.tsx`, `src/lib/auth.ts`.
- Perubahan:
  - Database: Membuat tabel `kkn_sessions`, setup 6 sesi pembekalan, & rilis RPC `submit_attendance_kkn` untuk absensi multi-sesi non-blocking harian.
  - Frontend: Halaman baru `AttendanceKKN.tsx` dengan camera scan-line visual & geofencing Gedung A.
  - Data Mahasiswa: Mengimpor 820 akun mahasiswa KKN (No. BP & password default) serta menetapkan lokasi absensi ke Gedung A.
  - Laporan KKN: PDF format rekap per-sesi hemat halaman (3-4 orang/hlm) dengan No. BP serta total kehadiran otomatis.
- Verifikasi: `pnpm build` berhasil sukses 100%.

### 2026-07-07 - Tombol Absen KKN Khusus Mahasiswa

- Tujuan: Menampilkan tombol absensi pembekalan KKN hanya untuk akun mahasiswa di halaman Home.
- File yang diubah: `src/pages/Index.tsx`.
- Perubahan:
  - Mengubah conditional rendering tombol KKN dari `currentUser?.username === 'tesx'` menjadi `currentUser?.role === 'mahasiswa'`.
- Verifikasi: Menjalankan `pnpm build` untuk memvalidasi kompilasi.

### 2026-07-07 - Impor Tambahan Akun Mahasiswa KKN 2025-3

- Tujuan: Mengimpor 7 data akun tambahan mahasiswa KKN dari file Excel ke database Supabase.
- Database yang diubah: `public.users` dan `public.user_passwords`.
- Perubahan:
  - Mengimpor 7 mahasiswa tambahan, memetakan program studi (`unit_kerja`) secara presisi berdasarkan kode BP: FAJRI ASYADIQ DARMA PUTRA, AFIZ RIDHO ZULFA, RIZKI ROVENDRI RAMADHAN, AGUNG UTAMA (`Ilmu Hukum`), PANJI RAESMAN (`Teknik Sipil`), RUSLI (`Teknik Elektro`), dan TAUFIK HIDAYAT (`Teknik Mesin`).
  - Mengeset password default ke `'12345678'` yang di-hash dengan bcrypt (`extensions.crypt`).
  - Mengeset lokasi absensi utama (`primary_location`) ke `'Gedung A Universitas Ekasakti'`.
- Verifikasi: Melakukan kueri verifikasi live database dan mengonfirmasi data berhasil masuk.

### 2026-07-08 - Akun Uji Coba KKN, Simulasi Offline 6 Sesi, dan Fitur Pencarian Laporan

- Tujuan: Mendukung beta test KKN offline dengan membuat akun uji coba `12345678`, mengkonfigurasi bypass geofencing/waktu untuk 6 sesi sekuensial, dan menambahkan input pencarian nama/BP di laporan.
- Database & File yang diubah: `submit_attendance_kkn` RPC, `src/pages/AttendanceKKN.tsx`, `src/pages/LaporanKehadiranKKN.tsx`, `src/pages/LaporanPerPengguna.tsx`, `src/pages/LaporanKehadiran3.tsx`, `src/pages/LaporanKehadiran4.tsx`, `src/pages/LaporanAlpha.tsx`, `src/pages/Rekap.tsx`, `AGENTS.md`, `progresirfan2.md`.
- Perubahan:
  - Database: Akun `12345678` terdaftar. RPC `submit_attendance_kkn` dimodifikasi khusus akun ini untuk bypass hari-H dan melakukan insert sekuensial seluruh 6 sesi KKN (Sabtu Sesi 1 & 2 [18 Juli], Minggu Sesi 1, 2, & 3 [19 Juli], serta Kamis Pelepasan [30 Juli]) dengan koordinat/waktu buatan. Menyelesaikan error *Could not choose the best candidate function* dengan menghapus (drop) definisi overloaded function lama. Trigger `enforce_attendance_not_sunday_except_superadmin` disesuaikan untuk bypass pembatasan hari Minggu bagi KKN.
  - Frontend Attendance: `AttendanceKKN.tsx` disesuaikan agar menyetel koordinat Gedung A tetap (jarak 0m, akurasi GPS 1m, loading false) and bypass geofencing untuk akun `12345678`. Tombol absen secara dinamis mendeteksi sesi berikutnya yang belum di-absen secara sekuensial. Menambahkan layout 3x2 grid checklist sesi KKN untuk menggantikan format masuk/pulang reguler, serta menyesuaikan pesan sukses absensi. Tombol absen KKN reguler dikunci rapat (disabled & berwarna abu-abu) secara otomatis jika diakses di luar tanggal/jam sesi aktif (mengacu pada `isValidActiveSession`).
  - Frontend Laporan: Menambahkan filter input pencarian text "Cari Nama / BP" di header filter card. Hasil pencarian memfilter preview tabel dan unduhan PDF KKN secara dinamis. `LaporanPerPengguna.tsx` disesuaikan untuk memfilter (menyembunyikan) akun mahasiswa dari dropdown pilihan pegawai. Menyaring keluar seluruh rekaman absensi bertanda KKN (note berisi `Sesi:` atau `KKN`) di semua laporan harian/rekap reguler (`LaporanKehadiran3`, `LaporanKehadiran4`, `LaporanPerPengguna`, `LaporanAlpha`, `Rekap`) agar data KKN milik DPL (dosen) tidak masuk ke data harian kantor.
- Verifikasi: Kueri verifikasi database berhasil dan `pnpm build` sukses.

### 2026-07-08 - Impor Tambahan Akun Mahasiswa KKN 2025-3 (Tahap 2)

- Tujuan: Mengimpor 7 data akun tambahan mahasiswa KKN dari file Excel `PESERTA TAMBAHAN KKN 2025- 8 juli.xlsx` (sheet `08 Juli 2026`) ke database Supabase dan menyeragamkan unit kerja seluruh mahasiswa.
- Database yang diubah: `public.users` dan `public.user_passwords`.
- Perubahan:
  - Mendaftarkan 7 mahasiswa baru: AGUSLI HENDRO, BAGAS ADINATA, ARDYANZAH LUBIS, DINI ANGGARAINI, FIKRI KHOLID, NANDA JULIA PUTRA, dan Yoggy Aslamy.
  - Mengeset password default ke `'12345678'` yang di-hash dengan bcrypt (`extensions.crypt`).
  - Mengeset lokasi absensi utama (`primary_location`) ke `'Gedung A Universitas Ekasakti'`.
  - Melakukan update massal unit kerja seluruh mahasiswa (`role = 'mahasiswa'`) menjadi `'Gedung A (Auditorium)'`.
- Verifikasi: Melakukan kueri verifikasi live database dan mengonfirmasi data berhasil masuk serta unit kerja 835 mahasiswa tersinkronisasi.

### 2026-07-09 - Impor Tambahan Akun Mahasiswa KKN 2025-9-juli

- Tujuan: Mengimpor 7 data akun tambahan mahasiswa KKN dari file Excel `PESERTA TAMBAHAN KKN 2025-9-juli.xlsx` ke database Supabase dengan role `mahasiswa` dan password default `'12345678'`.
- Database yang diubah: `public.users` dan `public.user_passwords`.
- Perubahan:
  - Mendaftarkan 7 mahasiswa baru: MANGIRING PARULIAN SIHOMBING, ZILFA SULAIMAN, FRANKY FEBRIANDI, RIKI ADRIANSYAH, HAZIZ ZULHAKIM, IRVAN ARNON SADAR NINGERAT WARUWU, dan KHAIRUNNISA SALSABILA P.
  - Mengeset password default ke `'12345678'` yang di-hash dengan bcrypt (`extensions.crypt`).
  - Mengeset lokasi absensi utama (`primary_location`) ke `'Gedung A Universitas Ekasakti'`.
  - Mengeset unit kerja mahasiswa baru ini ke `'Gedung A (Auditorium)'`.
- Verifikasi: Melakukan kueri verifikasi live database dan mengonfirmasi data berhasil masuk serta relasi dengan `user_passwords` terbuat 100% valid (total terdaftar menjadi 842 akun mahasiswa).

### 2026-07-13 - Impor Tambahan Akun Mahasiswa KKN 2025-3 (Tahap 3)

- Tujuan: Mengimpor 6 data akun tambahan mahasiswa KKN ke database Supabase dengan role `mahasiswa` dan password default `'12345678'`.
- Database yang diubah: `public.users` dan `public.user_passwords`.
- Perubahan:
  - Mendaftarkan 6 mahasiswa baru: WIKO BAGUS PRATAMA, MUHAMMAD RILPY, ADRIANO ALHAMDI, MUHAMMAD YOGI ALFAJRI, M. RAGI GHAZAN, dan FAHRUR ROJI.
  - Mengeset password default ke `'12345678'` yang di-hash dengan bcrypt (`extensions.crypt`).
  - Mengeset lokasi absensi utama (`primary_location`) ke `'Gedung A Universitas Ekasakti'`.
  - Mengeset unit kerja mahasiswa baru ini ke `'Gedung A (Auditorium)'`.
- Verifikasi: Melakukan kueri verifikasi live database dan mengonfirmasi data berhasil masuk serta relasi dengan `user_passwords` terbuat 100% valid (total terdaftar menjadi 848 akun mahasiswa).

### 2026-07-14 - Impor Tambahan Akun Mahasiswa KKN 2025-3 (Tahap 4)

- Tujuan: Mengimpor 1 data akun tambahan mahasiswa KKN ke database Supabase dengan role `mahasiswa` dan password default `'12345678'`.
- Database yang diubah: `public.users` dan `public.user_passwords`.
- Perubahan:
  - Mendaftarkan 1 mahasiswa baru: YUDIMAN PRAYETNO (BP: `2310003302008`).
  - Mengeset password default ke `'12345678'` yang di-hash dengan bcrypt (`extensions.crypt`).
  - Mengeset lokasi absensi utama (`primary_location`) ke `'Gedung A Universitas Ekasakti'`.
  - Mengeset unit kerja mahasiswa baru ini ke `'Gedung A (Auditorium)'`.
- Verifikasi: Melakukan kueri verifikasi live database dan mengonfirmasi data berhasil masuk serta relasi dengan `user_passwords` terbuat 100% valid (total terdaftar menjadi 849 akun mahasiswa).

### 2026-07-14 - Penghapusan Akun Mahasiswa KKN ARIA GABRIEL

- Tujuan: Menghapus 1 akun mahasiswa KKN (BP: `2310003530118` atas nama ARIA GABRIEL) dari database Supabase.
- Database yang diubah: `public.users` dan `public.user_passwords`.
- Perubahan:
  - Menghapus record secara transaksional di `user_passwords` dan `users` untuk user ID `4f3ec974-9440-43fa-93e8-d7e4eb394f98`.
- Verifikasi: Melakukan kueri verifikasi live database dan mengonfirmasi data sudah bersih terhapus dari kedua tabel (total terdaftar setelah penghapusan menjadi 848 akun mahasiswa).

### 2026-07-14 - Penyesuaian Status Alpha untuk Sesi KKN yang Belum Dimulai

- Tujuan: Mencegah penghitungan Alpha prematur pada laporan KKN mahasiswa sebelum tanggal pembekalan resmi (18 Juli 2026).
- File yang diubah: `src/pages/LaporanKehadiranKKN.tsx`.
- Perubahan:
  - Menambahkan helper `getCurrentWibDateTime` dan `isSessionStarted` untuk membandingkan jadwal sesi dengan waktu WIB saat ini.
  - Memodifikasi UI status preview sesi tunggal dan rekap agar menampilkan label `"Belum Dimulai"` / `"Belum Mulai"` dengan gaya netral berwarna abu-abu (slate) apabila sesi tersebut belum dimulai.
  - Menyesuaikan logika kalkulasi statistik (UI dan PDF) agar tidak menghitung atau menambahkan Alpha (`alpha++`) pada sesi yang belum dimulai.
  - Memodifikasi didDrawCell pada PDF generator agar menggambar tanda `-` untuk sesi yang belum berjalan.
- Verifikasi: Berhasil mem-build ulang proyek frontend dengan sukses 100% tanpa kendala compile.

### 2026-07-14 - Kondisional Statistik Kehadiran KKN Mahasiswa di Halaman Utama (Home)

- Tujuan: Menyelaraskan informasi statistik bulanan pada akun mahasiswa di halaman Home agar hanya merujuk pada jadwal 6 sesi pembekalan KKN (tidak memicu Alpha harian).
- File yang diubah: `src/pages/Index.tsx`.
- Perubahan:
  - Mendefinisikan konstanta sesi pembekalan KKN dan helper WIB timezone di file `Index.tsx`.
  - Mengubah kalkulasi statistik bulanan untuk user `role = 'mahasiswa'` agar didasarkan pada kecocokan 6 sesi KKN yang telah berjalan (dan tidak menghitung sesi yang belum dimulai).
  - Menyembunyikan tampilan kolom "Pulang" pada dashboard mahasiswa, dan menyesuaikan label "Masuk" menjadi "Hadir KKN".
  - Menyesuaikan Dialog detail ketidakhadiran agar memuat daftar sesi pembekalan KKN spesifik yang tidak dihadiri.
- Verifikasi: Berhasil mem-build ulang proyek frontend dengan sukses 100% tanpa kendala compile.

### 2026-07-14 - Penambahan Informasi Kehadiran Pembekalan KKN Khusus DPL KKN di Halaman Utama (Home)

- Tujuan: Menyediakan kartu statistik KKN terpisah di bawah kartu reguler untuk akun DPL KKN (`is_dpl_kkn = true`).
- File yang diubah: `src/pages/Index.tsx`.
- Perubahan:
  - Menambahkan state khusus `kknStats`, `kknAbsentDates` beserta dialog modal detailnya.
  - Memodifikasi `loadStats` untuk melakukan kalkulasi statistik reguler dan statistik KKN secara bersamaan jika `is_dpl_kkn` aktif.
  - Merender kartu statistik kedua "Informasi Kehadiran pembekalan KKN" di bawah kartu reguler dengan data KKN (3 kolom).
- Verifikasi: Berhasil mem-build ulang proyek frontend dengan sukses 100% tanpa kendala compile.

### 2026-07-14 - Penghapusan Kolom Izin/Cuti KKN pada Tampilan Home

- Tujuan: Menghapus kolom "Izin/Cuti" pada kartu statistik KKN pembekalan (untuk mahasiswa KKN & DPL KKN) di halaman Home.
- File yang diubah: `src/pages/Index.tsx`.
- Perubahan:
  - Membatasi rendering tombol "Izin/Cuti" di kartu statistik utama hanya untuk non-mahasiswa.
  - Menghapus tombol "Izin/Cuti KKN" sepenuhnya dari kartu statistik pembekalan KKN DPL KKN.
- Verifikasi: Berhasil mem-build ulang proyek frontend dengan sukses 100% tanpa kendala compile.

### 2026-07-22 - Fitur Modal Pop-up Himbauan Instalasi UNES HEBAT

- Tujuan: Menampilkan himbauan berupa modal pop-up layar penuh yang terpusat (centered) bagi pengguna yang mengakses sistem via Browser Web agar segera membuka/menginstal aplikasi UNES HEBAT melalui Play Store.
- Kondisi awal: Belum ada notifikasi deteksi browser untuk mendorong penggunaan aplikasi UNES HEBAT.
- File yang diubah: `src/pages/Index.tsx`.
- Perubahan yang dilakukan:
  - Membuat pendeteksian akses browser biasa (`isBrowserAccess`) menggunakan kombinasi pengecekan Capacitor native (`window.Capacitor?.isNativePlatform()`) dan PWA standalone mode (`window.matchMedia('(display-mode: standalone)').matches`).
  - Menyiapkan UI modal pop-up centered dengan overlay latar belakang gelap transparan (`backdrop-blur`), tombol tutup `[X]` di pojok kanan atas, serta tombol utama di tengah bertuliskan *"Unduh UNES HEBAT di Play Store"* yang langsung mengarahkan ke link Play Store mobile (`market://details?id=com.ivanad.ngabsen.unesv1`).
  - Menambahkan badge SVG animatif emoji senyum ceria dengan mata berkedip (*blushing smiling face with blinking animation*).
  - Menyesuaikan teks kalimat himbauan menjadi kalimat yang ramah dan *welcoming*: *"Bapak/Ibu saat ini Absensi lebih mudah dengan adanya UNES Hebat, silahkan melakukan absensi melalui aplikasi UNES Hebat dengan menginstall melalui tombol berikut:"*.
  - Membatasi visibilitas notifikasi ini secara ketat (scoped) hanya untuk akun pengguna tertentu yang ditentukan: `harry.setya.hadi` (Pak Harry Setya Hadi), `rudiyansa.putra` (Pak Rudiyansa Putra), `ramli.syafri` (Pak Ramli Syafri), serta `tesx`. Pengguna lain 100% bebas dari notifikasi ini.
- Verifikasi: Berhasil mem-build ulang proyek frontend (`pnpm build`) dengan sukses 100% tanpa kendala compile.

### 2026-07-22 - Pembuatan Prompt AI Gambar Pengumuman (Play Store & Link iPhone)

- Tujuan: Membuat panduan dan prompt AI generator untuk menghasilkan gambar poster/flyer pengumuman rilis aplikasi Absensi UNES-AAI di Play Store untuk Android dan penggunaan link web untuk iPhone.
- File dibuat: `promptpengumuman.md`.
- Cakupan: Pilihan prompt Ideogram/DALL-E 3 (langsung teks), Midjourney/FLUX (background & mockup HP 3D), serta susunan copywriting untuk Canva/Photoshop.

### 2026-07-22 - Update Nama Lengkap Furqanul Hamdi

- Tujuan: Memperbarui nama lengkap akun `furqanul.hamdi` agar menyertakan gelar magister.
- Database yang diubah: `public.users`.
- Perubahan:
  - Mengubah `full_name` user `furqanul.hamdi` (`id: b85934f1-605f-4a10-8016-7f968107dfcb`) dari `'Furqanul Hamdi, S.I.Kom'` menjadi `'Furqanul Hamdi, S.I.Kom, M.I.Kom.'`.
- Verifikasi: Kueri `UPDATE ... RETURNING` via MCP `dbAbsensiUNES` berhasil dan mengembalikan data terbaru.

### 2026-07-23 - Penambahan Banner Rektor PMB di Home Banner

- Tujuan: Menampilkan gambar banner baru `rektorpmb.jpg` dari folder `public/` sebagai banner pertama di halaman utama (Home).
- File yang diubah: `src/pages/Index.tsx`.
- Perubahan:
  - Mengubah array `HOME_BANNER_IMAGES` menjadi `["rektorpmb.jpg", "gambar2.jpg", "gambar1.png", "gambar3.jpeg"]`.
  - Menyesuaikan penanganan klik `handleBannerClick` dan indikator `cursor-pointer` agar aksi khusus klik banner Play Store terikat spesifik pada `gambar2.jpg` (bukan index 0 lagi).
- Verifikasi: `pnpm build` sukses tanpa error.

### 2026-08-06 - Perbaikan PDF Laporan Presensi Individu & Hak Akses Akun

- **Tujuan**: Memperbaiki tata letak PDF Laporan Individu agar foto presensi 1.5x dan teks jam tampil rapi tanpa meluber keluar kertas, nama panjang tidak terpotong 2 baris, memberikan hak akses Laporan Individu kepada **seluruh pengguna ber-role `admin`** (seperti Ibu Susi Delmiati dan Ibu Asmara Indah) & `superadmin`, serta menyembunyikan modul khusus superadmin dari halaman admin pengguna role `admin`.
- **File yang Diubah**:
  - `src/lib/pdf-generator.ts`: Merubah tabel profil pegawai menjadi 2-kolom full-width (lebar 140mm), membesarkan foto thumbnail 1.5x (18x20mm) dengan teks jam di bawah foto, menerapkan pembagian halaman **Maksimal 7 Baris Presensi Per Halaman (7 Rows Per Page Chunking)** untuk menjamin zero overflow, memulihkan fungsi `fetchAttendancePhoto`, serta menambahkan SVG fallback badge untuk presensi tanpa foto Telegram.
  - `src/lib/auth.ts`: Mengubah `canAccessLaporanIndividu()` menjadi `return isAdmin()` agar seluruh pengguna ber-role `admin` dan `superadmin` dapat mengakses Laporan Individu.
  - `src/components/ProtectedRoute.tsx` & `src/App.tsx`: Memperbarui proteksi route `/admin/laporan-individu` memakai `requireAdmin`.
  - `src/pages/Admin.tsx`: Menampilkan kartu menu "Laporan Individu" untuk semua pengguna ber-role `admin` & `superadmin`, serta menyaring tegas kartu modul khusus `superadmin` (Revoke Akses, Titik Absensi, Titik Absen V2, Manajemen Bangunan, Jadwal Jam Kerja, Rekapitulasi) agar tidak tampil pada pengguna role `admin`.
  - `src/components/LaporanIndividu.tsx`: Menyaring dan mengecualikan akun `tesx` (serta `andi.syahrum.makkurade`) dari dropdown dan daftar pilihan nama pegawai pada Laporan Individu.
- **Verifikasi**: `pnpm build` sukses 100% tanpa error.

### 2026-08-14 - Insiden down API Supabase (bukan kesalahan aplikasi/dev)

- Tujuan: mencatat gangguan login/absensi agar tidak dikira bug kode atau data hilang.
- Kondisi awal: aplikasi dan data user normal. Tabel `public.users` berisi 1.156 akun, hash password cocok, RPC `verify_user_password` di Postgres masih benar, tidak ada user `is_blocked`.
- File/database yang dicek: log Edge/PostgREST/Postgres project `fxwtdohwjylsptcnoxhe`, RPC login, RLS `users`, status global Supabase, probe REST live. **Tidak ada INSERT/UPDATE/DELETE/DROP/migrasi dari Nad.**
- Kronologi WIB (Jumat, 14 Agustus 2026):
  - sampai sekitar **15.31 WIB**: login RPC masih HTTP 200, layanan normal.
  - **15.32 WIB**: mulai muncul HTTP 503 di banyak endpoint REST (`users`, `attendances`, `holidays`, `attendance_locations`).
  - **15.34 WIB sampai sekitar 16.39 WIB**: login `POST /rest/v1/rpc/verify_user_password` hampir seluruhnya 503. Probe saat down: `upstream connect error ... delayed connect error: 111`.
  - sekitar **15.50 WIB**: ada percobaan `DROP TABLE public.users` dari dashboard Supabase. **Gagal** karena masih dipakai relasi lain. Data user tidak terhapus.
  - **16.41 WIB**: login RPC kembali 200. Sejak itu 503 login tidak muncul lagi.
  - **17.25 WIB**: dicek ulang live — `verify_user_password` HTTP 200, `GET /users` HTTP 200, 1.156 user tetap utuh. Layanan dinyatakan pulih.
- Akar masalah: **API Gateway / REST Supabase down atau degraded**. Database Postgres sendiri masih hidup (query langsung berhasil, 1.156 user utuh). Status global Supabase hari itu menandai API Gateway *Degraded Performance*.
- Dampak ke user: tidak bisa login atau muncul kesan username/password salah, padahal request tidak sampai. Ini murni gangguan sisi Supabase, **bukan bug frontend, bukan salah akun, dan bukan karena perubahan kode/data tim**.
### 2026-08-22 - Perbaikan Kelengkapan Nama Dosen & Tendik pada Laporan Kehadiran 3

- **Tujuan**: Memperbaiki masalah hilangnya nama-nama dosen & pegawai/tendik berabjad S-Z (contohnya Velyka Hana Kusuma, A.Md., Wawan Sumarno, Yessy Marzona, Yumi Ariyati, Yenitaroza, Zul Aida, dll.) pada menu Admin > Laporan Kehadiran 3.
- **Kondisi awal**: Total tabel `users` berisi 1.156 akun (termasuk 840+ akun mahasiswa KKN). Query awal `LaporanKehadiran3.tsx` menggunakan `order("full_name")` tanpa filter role dan tanpa paginasi, sehingga terpotong limit default Supabase PostgREST (1.000 baris) pada abjad "Su...". Sebanyak 48 nama berabjad S-Z hilang dari daftar.
- **File yang Diubah**:
  - `src/pages/LaporanKehadiran3.tsx`: Menambahkan filter `.neq("role", "mahasiswa")` pada query pemanggilan `users` di `loadData()`.
### 2026-08-22 - Pembuatan & Penyempurnaan Modul Laporan Kehadiran 5 (Format Ringkas 4 Kolom)

- **Tujuan**: Membuat halaman dan menu baru Laporan Kehadiran 5 dengan fungsi filtering sama seperti Laporan Kehadiran 4, namun menghasilkan PDF format ringkas Portrait A4 dengan 4 kolom utama: `No`, `Nama`, `Unit Kerja / Jabatan`, dan `Keterangan Bulan [Nama Bulan & Tahun]`.
- **Kondisi awal**: Belum ada modul Laporan Kehadiran 5. Laporan Kehadiran 4 menggunakan format landscape 31 kolom tanggal.
- **File yang Dibuat & Diubah**:
  - `src/pages/LaporanKehadiran5.tsx` (Baru): Halaman rekap bulanan ringkas dengan query non-mahasiswa (`.neq("role", "mahasiswa")`), pilihan bulan & kategori, pengurutan hierarki Tendik (Rektorat/Pusat -> Fakultas -> Prodi/Lab), dan aksi download PDF.
  - `src/lib/pdf-generator.ts`: Menambahkan fungsi `generateLaporanKehadiran5PDF` untuk merender PDF Portrait A4 4-kolom dengan kop surat resmi UNES, font tabel ukuran 14 yang jelas dan tebal, rincian hari kerja, kehadiran, izin/cuti/dinas, dan tanpa kehadiran.
  - `src/App.tsx`: Mendaftarkan import `LaporanKehadiran5` dan route `/admin/laporan-kehadiran5` (terproteksi `requireAdmin`).
  - `src/pages/Admin.tsx`: Menambahkan menu item `Laporan Kehadiran 5` (kategori reports) dengan icon `FileSpreadsheet` yang dapat diakses oleh role `admin` (termasuk akun Asmara Indah) dan `superadmin`.
- **Penyempurnaan Tambahan**:
  - Ukuran font tabel PDF diperbesar menjadi ukuran 14 untuk keterbacaan optimal.
  - Urutan kategori Tendik disusun berhierarki: Lingkup Yayasan, Rektorat, BAAK, BAU, BAPSI, Perlengkapan, PMB, Registrasi, Humas, IT, LPM/LPPM, Perpustakaan Pusat, Pascasarjana -> Lingkup Fakultas (Ekonomi, Hukum, Pertanian, Sastra, Teknik, Fisipol, FKIP, AAI) -> Lab Komputer.
  - Posisi pimpinan unit (Ka. BAPSI, Koordinator Registrasi, Ka. TU Fakultas/AAI, Bendahara Yayasan) diposisikan paling atas sebelum staf di setiap unit.
- **Verifikasi**:
  - `pnpm build` sukses 100% tanpa error TypeScript maupun bundler.

### 2026-09-02 - Pembaruan Status Struktural Harry Setya Hadi & Zelmi Sriyolja (Sek. LPPM)

- **Tujuan**: Menyesuaikan status jabatan struktural LPPM di mana Harry Setya Hadi tidak lagi struktural (`is_struktural = false`), dan Zelmi Sriyolja menggantikannya menjadi Sekretaris LPPM (`is_struktural = true`).
- **Database yang diubah**: `public.users` dan `public.user_passwords` via MCP `dbAbsensiUNES`.
- **Perubahan**:
  - `harry.setya.hadi`: `is_struktural` diset `false`, `unit_kerja` menjadi `'Dosen NIDN D III MIK'`, `sort_order` menjadi `NULL`, dan `secondary_location` dihapus.
  - `zelmi.sriyolja`: `is_struktural` diset `true`, `unit_kerja` menjadi `'Sek. LPPM & Dosen NIDN Arsitektur'`, `primary_location` diset ke `'Gedung Rektorat Universitas Ekasakti'`, `secondary_location` dipertahankan ke `['Gedung E Universitas Ekasakti']`, password default `'12345678'` disinkronkan & di-hash bcrypt.
- **Verifikasi**: Kueri live database dan pengujian RPC `verify_user_password` berhasil 100%.

### 2026-09-02 - Penggantian Kata Absensi Menjadi Presensi pada Notifikasi Sukses

- **Tujuan**: Menyesuaikan redaksi pesan sukses absensi agar kata "Absensi" menjadi "Presensi".
- **File yang Diubah**:
  - `src/pages/Attendance.tsx`: Mengubah teks pop-up sukses menjadi *"Presensi Anda telah berhasil dicatat. Selamat bekerja!"* dan *"Presensi Anda telah berhasil dicatat. Selamat beristirahat dan sampai jumpa besok dengan semangat baru!"*.
  - `src/pages/AttendanceKKN.tsx`: Mengubah judul modal sukses menjadi *"Presensi KKN Berhasil"* dan pesan menjadi *"Presensi Pembekalan KKN anda untuk [sesi] telah berhasil dicatat terima kasih"*.

### 2026-09-02 - Pembaruan Status Struktural Doddie Arya Kusuma & Rinawati (Ka. Prodi Ilmu Pemerintahan)

- **Tujuan**: Menyesuaikan status jabatan struktural Ka. Prodi Ilmu Pemerintahan di mana Doddie Arya Kusuma tidak lagi struktural (`is_struktural = false`), dan Rinawati menggantikannya menjadi Ketua Program Studi Ilmu Pemerintahan (`is_struktural = true`).
- **Database yang diubah**: `public.users`, `public.attendance_locations`, dan `public.user_passwords` via MCP `dbAbsensiUNES`.
- **Perubahan**:
  - `doddie.arya.kusuma.b`: `is_struktural` diset `false`, `unit_kerja` menjadi `'Dosen NIDN I. Pemerintahan'`, `sort_order` menjadi `NULL`.
  - `rinawati`: `is_struktural` diset `true`, `unit_kerja` menjadi `'Ka. Prodi Ilmu Pemerintahan Fisipol & Dosen NIDN I. Pemerintahan'`, `primary_location` tetap di `'Gedung A Universitas Ekasakti'` (sama seperti Doddie), `sort_order` diset ke `41`, password default `'12345678'` disinkronkan & di-hash bcrypt.
- **Verifikasi**: Kueri live database dan pengujian RPC `verify_user_password` untuk Rinawati berhasil 100%.

### 2026-09-02 - Pembaruan Teks Pemberitahuan Login Non-Struktural

- **Tujuan**: Menyesuaikan teks modal peringatan login dosen non-struktural di `src/pages/Login.tsx` agar tidak lagi menyebut DPL KKN dan Mahasiswa KKN.
- **File yang Diubah**: `src/pages/Login.tsx`.
- **Teks Baru**: *"Maaf, sistem absensi online diperuntukkan untuk Dosen Struktural, Tenaga Kependidikan, Universitas Ekasakti."*

### 2026-09-06 - Penyesuaian Notifikasi Block Login (is_blocked) & Pemblokiran Akun Delsi, Harry Setya Hadi, Doddie Arya Kusuma B, dan Yuswardi

- **Tujuan**: Memblokir akun Delsi (`delsi`, Staf BAAK - purna tugas), Harry Setya Hadi (`harry.setya.hadi`, Dosen non-struktural), Doddie Arya Kusuma B (`doddie.arya.kusuma.b`, Dosen non-struktural), dan Yuswardi (`yuswardi`, Staf Fak. Hukum - purna tugas), serta memastikan seluruh akun yang di-block login (`is_blocked = true`) menampilkan notifikasi santun bertuliskan: *"Maaf, sistem absensi online diperuntukkan untuk Dosen Struktural, Tenaga Kependidikan, Universitas Ekasakti."*
- **Database yang Diubah**: `public.users` via MCP `dbAbsensiUNES`:
  - `delsi` diupdate dengan `is_blocked = true`, `revoke_reason = 'Purna tugas'`, `updated_at = NOW()`.
  - `harry.setya.hadi` diupdate dengan `is_blocked = true`, `revoke_reason = 'Bukan dosen struktural'`, `updated_at = NOW()`.
  - `doddie.arya.kusuma.b` diupdate dengan `is_blocked = true`, `revoke_reason = 'Bukan dosen struktural'`, `updated_at = NOW()`.
  - `yuswardi` diupdate dengan `is_blocked = true`, `revoke_reason = 'Purna tugas'`, `updated_at = NOW()`.
- **File yang Diubah**: `src/pages/Login.tsx`.
  - **Dilarang** menampilkan pesan kaku seperti *"Sistem Absensi Universitas Ekasakti. Akses terbatas hanya untuk pengguna yang terdaftar."*
- **Verifikasi**: Update database seluruh akun berhasil diverifikasi secara live melalui MCP, dan build frontend berhasil tanpa error.

### 2026-09-09 - Perbaikan Daftar Nama Pegawai/Tendik, Pagination Attendance & Pengecualian Akun `tesx` di Seluruh Rekap

- **Tujuan**: Memperbaiki dropdown daftar pilihan nama pada menu Admin > Laporan Kehadiran 2 (`/admin/laporan-kehadiran2`) yang sebelumnya hanya tampil sampai huruf S sehingga nama seperti Yuni (Yuni Hafizah, S.E. & Yuni Yulastri, S.Pd) dan huruf T-Z tidak muncul, serta mengecualikan mahasiswa dan akun testing `tesx` dari seluruh modul rekap/laporan.
- **Kondisi awal**: Total tabel `users` memiliki 1.156 akun (termasuk 870 akun mahasiswa). Query `users` di `LaporanKehadiran2.tsx` sebelumnya mengambil semua user tanpa `.neq('role', 'mahasiswa')`, sehingga terpotong limit default Supabase PostgREST (1.000 row) di abjad S. Akun `tesx` juga dicek agar tidak muncul di daftar laporan mana pun.
- **File yang Diubah**:
  - `src/pages/LaporanKehadiran2.tsx`: Menambahkan filter `.neq('role', 'mahasiswa')` pada query `users`, mengecualikan akun `tesx` di `isUserInCategory`, menambahkan filter rentang tanggal `gte`/`lte` dan paginasi loop untuk `attendances` berdasarkan `selectedMonth`, serta mengabaikan rekaman bertanda KKN.
  - `src/pages/LaporanPerPengguna.tsx`: Menambahkan filter `.neq("role", "mahasiswa")` dan menyaring keluar akun `tesx` dari dropdown pilihan pegawai/dosen.
  - `src/pages/Rekap.tsx`: Menambahkan filter `.neq("role", "mahasiswa")` pada pemanggilan `users`, serta mengecualikan akun `tesx` dari kategori Tendik dan Dosen Struktural.
  - `src/pages/LaporanAlpha.tsx` & `src/components/AttendanceReport.tsx`: Memastikan query `users` mengecualikan mahasiswa dan menyaring keluar akun `tesx`.
- **Verifikasi**: `npm run build` sukses 100% tanpa kendala compile/TypeScript.

### 2026-09-11 - Penyeragaman Redaksi Kata "Absen/Absensi" Menjadi "Presensi" di Halaman Attendance

- **Tujuan**: Mengganti semua kata "absen/absensi" menjadi "presensi" pada seluruh teks UI, judul/pesan pop-up modal, overlay status kamera, dan caption Telegram pada halaman Attendance (`src/pages/Attendance.tsx`) agar lebih formal dan seragam (contoh: "Presensi Masuk Berhasil").
- **File yang Diubah**: `src/pages/Attendance.tsx`.
- **Perubahan yang Dilakukan**:
  - `formatAttendanceTypeLabel`: Mengembalikan `"Presensi Masuk"`, `"Presensi Pulang"`, dan `"Presensi Keluar"`.
  - Judul modal sukses otomatis menjadi `"Presensi Masuk Berhasil"` / `"Presensi Pulang Berhasil"`.
  - Pesan validasi jam kerja: *"Presensi Masuk/Pulang belum dibuka / sudah ditutup"*.
  - Pesan validasi izin/cuti/libur/radius lokasi: diubah menjadi presensi (*"Sistem presensi tidak menerima...", "Titik Presensi Tidak Ditemukan", "Di Luar Titik Presensi", "Belum Presensi Masuk", "Sudah Presensi"*).
  - Caption bukti kehadiran Telegram: diseragamkan (*"✅ Presensi diterima berikut :", "🏢 Presensi masuk...", "🏠 Presensi keluar...", "🕘 Jenis Presensi...", "✅ Status Presensi..."*).
  - UI Camera & Button: *"DI LUAR AREA PRESENSI"*, *"WAKTU PRESENSI DITUTUP"*, *"SIMPAN PRESENSI"*.
  - Menjaga keutuhan logic backend/DB, query constraint, RPC `submit_attendance_server_time`, dan backward compatibility penanganan pesan error RPC.
- **Verifikasi**: `pnpm build` sukses 100% (built in 56.41s) tanpa error TypeScript maupun bundler.

## 18. Data Dosen Struktural dan Unit

Catatan lama `dosenstruktural.md` berisi daftar dosen struktural, pimpinan, lembaga, biro, fakultas, dan unit kerja.

Cara pakai:

- Untuk kebutuhan UI/data referensi, cek database live dulu.
- Jangan menganggap daftar lama masih lengkap.
- Jika Ipan tanya nama/unit terbaru, query tabel `users` atau sumber resmi.

## 19. Protokol Saat Ada Tugas Database

1. Pastikan Ipan memang meminta perubahan data atau schema.
2. Cek koneksi MCP live.
3. Query kondisi awal.
4. Untuk DDL, gunakan `apply_migration` bila tersedia.
5. Untuk DML, gunakan `execute_sql` dengan query sesempit mungkin.
6. Jangan hardcode generated ID jika bisa cari berdasarkan username/nama unik.
7. Setelah write, query ulang dan tampilkan hasil penting ke Ipan.
8. Jika menyentuh security, cek advisors bila memungkinkan.

## 20. Protokol Saat Ada Tugas Frontend

1. Baca file yang relevan dulu.
2. Cek pola komponen yang sudah ada.
3. Edit sesempit mungkin.
4. Jangan merusak perubahan user yang tidak terkait.
5. Jalankan `pnpm build` bila memungkinkan.
6. Jika butuh visual check, jalankan dev server dan buka browser lokal.
7. Jelaskan file yang berubah dan hasil verifikasinya.

## 21. Protokol Git dan File

- Repo ini di Windows kadang terkena `dubious ownership`.
- Jika `git status` gagal, pakai:

```powershell
git -c safe.directory=C:/Users/Administrator/Documents/GitHub/absensiunesv2 status --short
```

- Jangan pakai `git reset --hard` kecuali Ipan jelas meminta.
- Jangan hapus perubahan user yang tidak terkait.
- Jika ada file modified yang bukan kerja Nad, sebutkan saja di akhir.

## 22. File Markdown Lama Yang Sudah Digabung

Daftar file markdown aplikasi yang isinya sudah diringkas ke `AGENTS.md`:

- `dosenstruktural.md`
- `januari.md`
- `perubahanrls6maret2026.md`
- `reportaccident1.md`
- `src/redesign_summary.md`
- `repowiki/API.md`
- `repowiki/ARSITEKTUR.md`
- `repowiki/AUTH.md`
- `repowiki/BUGS.md`
- `repowiki/CHANGELOG.md`
- `repowiki/DATABASE.md`
- `repowiki/DEVELOPMENT.md`
- `repowiki/ENV.md`
- `repowiki/FITUR.md`
- `repowiki/README.md`
- `repowiki/SECURITY.md`
- `repowiki/STRUKTUR.md`
- `repowiki/TEKNOLOGI.md`

File markdown tooling/dependency tidak dianggap catatan aplikasi utama:

- `.opencode/skill/frontend-design/SKILL.md`
- `.opencode/node_modules/zod/README.md`

## 23. Format Log Progress Baru

Jika ada pekerjaan baru yang signifikan, tambahkan di timeline dan ringkas juga di sini:

```markdown
### YYYY-MM-DD - Judul singkat

- Tujuan:
- Kondisi awal:
- File/database yang dicek:
- Perubahan yang dilakukan:
- Verifikasi:
- Catatan lanjutan:
```

Jangan tulis token, password, service key, atau data rahasia di file ini.

## 24. Checklist Awal Setiap Sesi

- Baca `AGENTS.md`.
- Cek apakah Ipan minta cek dulu atau langsung action.
- Kalau terkait status aplikasi, cek file/live data.
- Kalau terkait Supabase, cek MCP live.
- Kalau terkait frontend, cek file sumber dan jalankan build setelah edit.
- Kalau terkait security/RLS, perlakukan sebagai risiko tinggi.
- Jawab Ipan dengan bahasa sederhana dan bukti yang jelas.
