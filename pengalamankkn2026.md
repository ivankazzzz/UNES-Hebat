# Pengalaman & Catatan Teknis Pelaksanaan KKN UNES 2026

Dokumen ini mencatat seluruh arsitektur teknis, keputusan metodologis, penanganan bug, dan solusi yang diimplementasikan pada sistem **Absensi Pembekalan & Pelepasan KKN UNES 2026** di aplikasi Absensi UNES-AAI.

---

## 1. Ringkasan Pelaksanaan KKN 2026

- **Instansi**: Universitas Ekasakti (UNES)
- **Pengguna**: ~820 Mahasiswa KKN, DPL KKN (`is_dpl_kkn = true`), dan Panitia KKN (`is_panitia_kkn = true`)
- **Lokasi Utama**: Gedung A / Auditorium Universitas Ekasakti (`-0.9387835, 100.3561079`)
- **Total Sesi**: 9 Sesi (Sabtu Sesi 1-3, Minggu Sesi 1-5, dan Pelepasan KKN Rabu 29 Juli 2026)

---

## 2. Arsitektur Database & RPC Supabase

### A. Tabel `public.kkn_sessions`
Menyimpan konfigurasi seluruh sesi pembekalan dan pelepasan KKN:
```sql
CREATE TABLE public.kkn_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_name VARCHAR NOT NULL,
  session_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  attendance_type VARCHAR DEFAULT 'masuk',
  created_at TIMESTAMPTZ DEFAULT now()
);
```

### B. Function RPC `submit_attendance_kkn`
Fungsi pintu utama pencatatan absensi KKN di PostgreSQL:
- **WIB Time Zone Enforcement**: Memakai `timezone('Asia/Jakarta', now())` untuk mengambil tanggal dan jam server real-time, menghindari manipulasi jam pada HP user.
- **Inklusif Menit Akhir**: Batas waktu selesai diset hingga detik `:59` (`v_time_wib <= (ks.end_time + interval '1 minute')`).
- **Bypass Trigger Hari Minggu**: Trigger `enforce_attendance_not_sunday_except_superadmin` disesuaikan agar mengizinkan absensi KKN pada hari Minggu.
- **Sequential Test Simulator (Akun `12345678`)**: Akun uji coba `12345678` dilengkapi fungsi sekuensial otomatis yang di-bypass date-check-nya agar dapat mensimulasikan absensi seluruh 9 sesi secara berurutan untuk testing kilat.

---

## 3. Geofencing & Penyesuaian Radius

- **Lokasi Acuan**: Gedung A Auditorium UNES (`-0.9387835, 100.3561079`).
- **Radius Khusus KKN**: **150 meter** (dikondisikan di `AttendanceKKN.tsx` melalui `KKN_TARGET_RADIUS = 150`).
- **Alasan**: Lebih melonggar dibanding radius reguler harian (50m) untuk mengakomodasi kepadatan ribuan peserta di area sekitar Auditorium tanpa terkendala variasi akurasi GPS HP.

---

## 4. Keandalan Pengiriman Foto & Evidence Telegram (Non-Blocking Architecture)

### A. Pola Non-Blocking Fallback
Pengiriman bukti foto absensi ke Telegram bot (`/api/telegram-evidence`) dibungkus dalam blok `try-catch` non-blocking:
```typescript
let photoUrl = `telegram:file:rate_limited_${Date.now()}`;
try {
  const telegramResult = await uploadToTelegram(...);
  if (telegramResult.result?.fileId) {
    photoUrl = `telegram:file:${telegramResult.result.fileId}`;
  }
} catch (tgErr) {
  console.error("Telegram evidence upload failed (rate limited/network):", tgErr);
  // Tetap biarkan berjalan dengan photoUrl fallback agar absen sukses disimpan ke DB
}
```
*Pelajaran*: Ketika ratusan/ribuan pengguna melakukan absensi serentak, Telegram API bisa saja mengalami rate limit (HTTP 429) atau timeout. Dengan pola ini, **pencatatan data kehadiran di Supabase DB TETAP BERHASIL 100%** meskipun Telegram lambat.

### B. Network Retry Helper (`supabaseRpcWithRetry`)
Client frontend dilengkapi fungsi panggil RPC dengan retry otomatis hingga 3x jika koneksi internet pengguna instabil saat menekan tombol absen.

---

## 5. Fitur Tampilan, Login, & Musik Latar

### A. Login Scoping (`Login.tsx`)
- Selama periode KKN, blokir login dibuka untuk role `mahasiswa` dan DPL KKN non-struktural (`isDplNonStruktural`).
- Pasca pembekalan/pelepasan, akses login dapat ditutup kembali dengan mudah (mengalihkan ke notification toast).

### B. Feature Toggle Banner KKN (`Index.tsx`)
- Banner "Absen Pembekalan KKN" dan "Informasi Kehadiran KKN" dikendalikan dengan conditional rendering `(currentUser?.role === 'mahasiswa' || currentUser?.is_dpl_kkn || currentUser?.is_panitia_kkn)`.
- Dapat disembunyikan sementara pada masa jeda dengan menyisipkan `false &&` jika diperlukan.

### C. Pemutar Musik Bertema (`SoundPlayer.tsx`)
- Pengguna KKN (Mahasiswa, DPL, Panitia) diputarkan lagu KKN (`/soundkkn.mp3` dengan tooltip *"KKN UNES - Rudiyansa P. S.Sos"*).
- Dosen & Tendik reguler tetap mendengarkan Mars UNES AAI (`/MARS-UNES-AAI.mp3`).

---

## 6. Rekapitulasi Laporan PDF KKN (`LaporanKehadiranKKN.tsx`)

- **Route**: `/admin/laporan-kehadiran-kkn`.
- **Kategori**: Filter berdasarkan `DPL KKN` (`is_dpl_kkn = true`) dan `Mahasiswa` (`role = 'mahasiswa'`).
- **Format PDF**: Legal Landscape, 3-4 peserta per halaman, menampilkan Nomor BP (NIM) untuk Mahasiswa, status 9 sesi KKN, serta lampiran bukti foto kehadiran via API proxy `/api/telegram-photo`.

---

## 7. Kesimpulan & Best Practices untuk KKN Berikutnya

1. **Jaga Non-Blocking Logic**: Jangan pernah membuat kegagalan service pihak ketiga (seperti Telegram) menggagalkan transaksi utama di database.
2. **End Time Inklusif**: Selalu gunakan `end_time + interval '1 minute'` pada kueri SQL agar menit terakhir absensi tetap dapat menerima data.
3. **Akun Uji Coba Sekuensial**: Memiliki akun khusus dengan simulator sekuensial sangat membantu validasi alur laporan PDF dan statistik tanpa perlu menunggu hari-H.
