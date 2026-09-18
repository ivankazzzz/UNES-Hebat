# Berkontribusi ke UNES-Hebat

Terima kasih mau ikut mengembangkan! Panduan singkat biar kolaborasi rapi.

## Cara mulai

1. Fork repo ini, lalu clone fork Anda.
2. Install dependensi: `pnpm install`, salin env: `cp .env.example .env`.
3. Buat branch dari `main`: `git checkout -b fitur/nama-fitur` atau `fix/nama-bug`.
4. Jalankan `pnpm dev` untuk mode pengembangan.

## Standar kode

- TypeScript + ESLint: pastikan `pnpm lint` bersih.
- **Sebelum submit PR, wajib `pnpm build` sukses.**
- Ikuti palet warna resmi (merah primer `#8c1b1d`, aksen emas `#fbbf24`), ikon via `lucide-react`.
- Jangan commit file rahasia: `.env`, token, key, atau foto/data pribadi.

## Aturan perubahan sensitif

Perubahan pada area ini wajib dijelaskan rinci di PR dan diuji ekstra hati-hati:

- RLS policies / grants / RPC Supabase (risiko hapus data & akses liar)
- Alur absensi (`src/pages/Attendance.tsx`) — validasi waktu & lokasi
- Auth/session (`src/lib/auth.ts`)

## Membuat Pull Request

1. Push branch ke fork Anda, buka PR ke `main` repo ini.
2. Gunakan template PR (otomatis muncul).
3. Jelaskan: masalah → solusi → cara menguji. Sertakan screenshot untuk perubahan UI.
4. Satu PR = satu topik. PR besar harap dipecah.

## Melapor bug / usul fitur

Gunakan template Issue yang tersedia:

- **Bug:** langkah reproduksi, hasil aktual vs ekspektasi, browser/HP + versi.
- **Fitur:** masalah yang diselesaikan + usulan perilaku.

## Kode etik

Bersikap sopan dan konstruktif. Tidak ada toleransi untuk pelecehan atau spam.
Pelanggaran dapat berujung blokir kontribusi.
