# Log Progres Absensi UNES-AAI

## 2026-07-05 - Mengubah Warna Welcome Screen (Selamat Datang)

- **Tujuan**: Mengubah warna welcome screen yang muncul setelah login berhasil dari biru menjadi merah-kuning (brand-aligned).
- **Kondisi Awal**: Warna background welcome screen di `src/pages/Login.tsx` masih menggunakan gradient biru (`#0a1f3d` ke `#1a4d8f`), serta glow sphere berwarna biru dan text "Selamat Datang" menggunakan class CSS biru (`text-blue-100/80`).
- **File yang Diubah**: [Login.tsx](file:///C:/Users/Administrator/Documents/GitHub/absensiunesv2/src/pages/Login.tsx)
- **Perubahan yang Dilakukan**:
  - Mengubah gradient background welcome screen menjadi `linear-gradient(135deg, #6b1516 0%, #8c1b1d 50%, #6b1516 100%)` (merah maroon khas UNES).
  - Mengubah glow sphere pertama (top-left) dari biru `rgba(59, 130, 246, 0.15)` menjadi kuning/emas `rgba(251, 191, 36, 0.15)`.
  - Mengubah glow sphere kedua (bottom-right) dari kuning redup `rgba(251, 191, 36, 0.15)` menjadi emas yang lebih terang `rgba(251, 191, 36, 0.15)`.
  - Mengubah teks "Selamat Datang" dari `text-blue-100/80` menjadi `text-amber-100/80` (kuning/emas lembut).
- **Langkah Selanjutnya**:
  - Menjalankan Vite dev server di localhost untuk diperlihatkan ke Ipan sebelum finalisasi.

## 2026-07-05 - Mengganti Ikon Check dengan Logo UNES & Animasi Zoom In Smooth

- **Tujuan**: Mengganti ikon centang (`CheckCircle`) di welcome screen dengan logo UNES, serta menambahkan efek transisi zoom-in smooth yang memenuhi layar sebelum masuk ke halaman berikutnya.
- **File yang Diubah**: [Login.tsx](file:///C:/Users/Administrator/Documents/GitHub/absensiunesv2/src/pages/Login.tsx)
- **Perubahan yang Dilakukan**:
  - Mengganti komponen `<CheckCircle ... />` dengan gambar logo UNES `src="/unes.png"`.
  - Mengubah glow pulse di belakang logo menjadi bertema emas/kuning (`rgba(251, 191, 36, 0.4)`).
  - Menerapkan transisi zoom-in smooth pada container logo saat phase beralih ke `fade` atau `exit`. Container akan membesar secara mulus hingga `scale-[18]` dan memudar (`opacity-0`) untuk menciptakan kesan portal transisi yang elegan.
  - Menyelaraskan teks deskripsi login dan indikator loading agar ikut memudar keluar (`opacity-0 scale-95`) secara serempak saat transisi zoom-in logo dimulai.
  - Memperbaiki peringatan compile Tailwind dengan memindahkan durasi transisi `900ms` ke properti inline `style` (`transitionDuration: "900ms"`).
- **Verifikasi**:
  - Menguji kompilasi produksi via `pnpm build` untuk menjamin tidak ada kendala build atau layar blank.

## 2026-07-05 - Redesign Total Halaman Profil ala Aplikasi Grab

- **Tujuan**: Mengubah total tampilan halaman profil agar memiliki layout bersih, rapi, dan modern menyerupai menu list profil di aplikasi Grab/Gojek, sehingga datanya sangat mudah dibaca.
- **Kondisi Awal**: Halaman profil menggunakan desain kartu-kartu gradasi dengan font yang kurang terlihat kontras di beberapa bagian.
- **File yang Diubah**: [Profile.tsx](file:///C:/Users/Administrator/Documents/GitHub/absensiunesv2/src/pages/Profile.tsx)
- **Perubahan yang Dilakukan**:
  - **Background**: Menggunakan warna background dasar abu-abu sangat muda/bersih khas aplikasi modern (`bg-[#F6F7F9]`).
  - **Sticky Header**: Membuat header sticky di atas dengan background putih solid, border bottom tipis, tombol kembali minimalis, dan logo UNES kecil di pojok kanan.
  - **Header Profile Card**: Layout baris horizontal berisi foto avatar ber-border, nama lengkap user (bold hitam), username (abu-abu), dan badge role merah maroon flat pill di bawahnya.
  - **Group List Informasi Kerja**: Menu list ber-background putih solid dengan garis pembatas tipis (`divide-y divide-slate-100`):
    - Row Username: Icon user, label "Username", nilai username hitam tebal.
    - Row Jadwal Kerja: Icon jam, label "Jadwal Kerja", rentang waktu (misal: "08:00 - 15:00 WIB") hitam tebal dengan label "Jadwal Kerja Aktif" kecil di bawahnya.
    - Row Lokasi Absensi Resmi: Icon pin lokasi, label "Lokasi Absensi Resmi", dan daftar gedung absensi resmi dengan badge **Utama** (merah) / **Sekunder** (hijau emerald) ber-border rapi. Tombol "Pilih Lokasi" untuk superadmin diposisikan secara kompak di pojok kanan atas sub-card.
  - **Group List Keamanan & Akun**: Menu list putih berisi:
    - Row Ganti Password: Icon kunci, label "Ganti Password", dan ikon panah kanan (`ChevronRight`) khas menu aplikasi Grab.
    - Row Keluar Akun: Icon logout merah, label "Keluar Akun" (merah), dan ikon panah kanan (`ChevronRight`).
  - **Responsive Layout (Fit-to-Screen)**: Menyelaraskan pembungkus layout halaman profil agar identik dengan halaman History (`src/pages/History.tsx`) dan Home (`src/pages/Index.tsx`). Dengan mengubah outer container menjadi `flex h-screen flex-col w-full bg-[#F6F7F9] overflow-x-hidden` serta menghapus pembatas `max-w-md mx-auto` yang mengunci ukuran halaman sebelumnya, halaman profil kini melebar penuh secara dinamis and 100% responsif mengikuti dimensi layar perangkat apa pun.
- **Verifikasi**:
  - Menjalankan compile check `pnpm build` untuk memastikan file TypeScript bersih dari kesalahan penulisan dan siap dieksekusi di localhost.

## 2026-07-05 - Penghapusan Tombol Presensi Ganda di Home

- **Tujuan**: Menghapus tombol menu "Presensi" pada grid "Layanan Untuk Anda" di halaman Home (`src/pages/Index.tsx`) agar tidak redundan karena sudah ada CTA utama "Absen Disini".
- **File yang Diubah**: [Index.tsx](file:///C:/Users/Administrator/Documents/GitHub/absensiunesv2/src/pages/Index.tsx)
- **Perubahan yang Dilakukan**:
  - Menghapus item grid menu "Presensi" (ikon check hijau) dari daftar grid "Layanan Untuk Anda". Hal ini mencegah kebingungan user dengan menyisakan satu pintu utama untuk melakukan absensi melalui tombol CTA lebar "Absen Disini".
- **Verifikasi**:
  - Menjalankan build produksi via `pnpm build` dan berhasil sukses 100% tanpa ada kendala error.

## 2026-07-05 - Redesign Detail Riwayat Absensi & List Item (Solid, Stroke Tegas, No Grey)

- **Tujuan**: Meredesign dialog modal detail kehadiran dan kartu list utama di halaman Riwayat (`src/pages/History.tsx`) dengan stroke border 2px yang tegas menggunakan warna merah maroon/kuning emas khas UNES, serta menghilangkan seluruh garis tepi berwarna abu-abu (grey).
- **File yang Diubah**: [History.tsx](file:///C:/Users/Administrator/Documents/GitHub/absensiunesv2/src/pages/History.tsx)
- **Perubahan yang Dilakukan**:
  - **Dialog Header & Tombol Close Ganda**: Menghapus tombol close (X) buatan sendiri dari header modal detail, menyisakan tombol silang built-in shadcn/ui untuk mencegah adanya tombol close ganda.
  - **Receipt Status Box (Solid Red/Gold)**: Mengubah Summary Receipt Block menjadi warna solid merah maroon khas UNES (`bg-[#8c1b1d]` / `bg-[#6b1516]`). Status badge "Berhasil Tercatat" menggunakan warna solid kuning/emas (`bg-[#fbbf24] text-[#8c1b1d]`) dengan border tegas.
  - **Dialog Info Body (Tegas, No Grey)**:
    - Details Card utama menggunakan border solid maroon tegas 2px (`border-2 border-[#8c1b1d]`) dengan pembatas baris custom warna maroon tipis (`divide-[#8c1b1d]/10`). Background kartu tetap putih bersih solid.
    - Catatan Jarak menggunakan border solid emas/kuning tegas 2px (`border-2 border-[#fbbf24]`) dan latar belakang emas lembut (`bg-amber-50/70`).
  - **Main History List Cards (Tegas, No Grey)**:
    - Mengubah border tipis abu-abu (`border-slate-200/80`) pada kartu list absensi menjadi border stroke tegas 2px (`border-2`) bermotif brand color:
      - Kartu Absen Masuk: Menggunakan border solid kuning emas (`border-[#fbbf24]`).
      - Kartu Absen Pulang: Menggunakan border solid merah maroon (`border-[#8c1b1d]`).
    - Hal ini membuat daftar riwayat absensi tampil semarak, tegas, kontras tinggi, dan bebas dari warna abu-abu monoton.
  - **Filter Card & Input Selectors (Tegas, No Grey)**:
    - Mengubah border filter area utama menjadi `border-2 border-[#8c1b1d]/20`.
    - Mengubah input select (Bulan & Tahun) menjadi border tegas `border-2 border-[#8c1b1d]/20` yang bertransisi ke border solid `focus:border-[#8c1b1d]`.
- **Verifikasi**:
  - Menjalankan build produksi via `pnpm build` dan berhasil sukses 100% tanpa ada kendala error.

## 2026-07-05 - Penerapan Stroke Tegas Non-Grey pada Halaman Profile & Home

- **Tujuan**: Menerapkan desain stroke/garis tepi 2px yang tegas menggunakan warna brand (merah/kuning) pada halaman Profile (`Profile.tsx`) dan halaman Home (`Index.tsx`), menghilangkan semua garis tepi berwarna abu-abu (grey).
- **File yang Diubah**:
  - [Profile.tsx](file:///C:/Users/Administrator/Documents/GitHub/absensiunesv2/src/pages/Profile.tsx)
  - [Index.tsx](file:///C:/Users/Administrator/Documents/GitHub/absensiunesv2/src/pages/Index.tsx)
- **Perubahan yang Dilakukan**:
  - **Halaman Profile**:
    - Mengubah border header profile card, Informasi Kerja card, dan Keamanan & Akun card menjadi border solid merah maroon 2px (`border-2 border-[#8c1b1d]`).
    - Mengubah border avatar menjadi border solid emas 2px (`border-2 border-[#fbbf24]`).
    - Mengubah border list lokasi absensi resmi menjadi border solid emas 2px (`border-2 border-[#fbbf24]`).
    - Mengubah border dialog modal (Ganti Password & Pilih Lokasi) menjadi `border-2 border-[#8c1b1d]`.
  - **Halaman Home (Beranda)**:
    - Mengubah border kartu "Layanan Untuk Anda" dan kartu "Informasi Kehadiran" menjadi border solid merah maroon 2px (`border-2 border-[#8c1b1d]`).
    - Mengubah border sub-card statistik bulanan menjadi border solid tebal berwarna status (`border-2`): emerald untuk Masuk, sky-blue untuk Pulang, rose untuk Alpha, dan amber/gold untuk Izin/Cuti.
    - Menyesuaikan label text ringkasan bulanan di halaman home: "Total Kehadiran" diganti menjadi "Total Masuk", dan "Total Kepulangan" diganti menjadi "Total Pulang".
- **Verifikasi**:
  - Menjalankan build produksi via `pnpm build` dan berhasil sukses 100% tanpa ada kendala error.

## 2026-07-05 - Redesign Informasi Kehadiran Home Menjadi Model Strip Horizontal Super Ringkas

- **Tujuan**: Meredesign total Informasi Kehadiran di halaman utama Home menjadi model baris horizontal tunggal (single row strip) yang sangat tipis, ringkas, dan hemat ruang vertikal.
- **File yang Diubah**: [Index.tsx](file:///C:/Users/Administrator/Documents/GitHub/absensiunesv2/src/pages/Index.tsx)
- **Perubahan yang Dilakukan**:
  - Menghapus total model grid/box statistics sebelumnya, dan menggantinya dengan model **strip horizontal baris tunggal** (`flex items-center justify-between rounded-2xl p-3 border-2 border-[#8c1b1d]/20`).
  - Menggunakan garis pembatas vertikal tebal (`divide-x-2 divide-[#8c1b1d]/20`) untuk memisahkan 4 kolom statistik: Masuk (emerald), Pulang (sky), Alpha (rose), dan Izin/Cuti (amber).
  - Di dalam setiap kolom, angka statistics besar (font tebal size-lg) diletakkan di bagian atas, dan label teks uppercase kecil diletakkan di bawahnya.
  - Mempertahankan kegunaan klik (tappable button) pada bagian Alpha dan Izin/Cuti untuk memicu modal list detil seperti desain sebelumnya.
- **Verifikasi**:
  - Menjalankan build produksi via `pnpm build` dan berhasil sukses 100% tanpa ada kendala error.

## 2026-07-05 - Warna Angka Hitam, Redesign Chip Badge Interaktif & Link Play Store Banner

- **Tujuan**: Menyempurnakan model strip statistik bulanan (angka hitam solid & chip badge penanda klik yang cantik) serta mengintegrasikan pengalihan Play Store otomatis pada klik banner gambar pertama.
- **File yang Diubah**: [Index.tsx](file:///C:/Users/Administrator/Documents/GitHub/absensiunesv2/src/pages/Index.tsx)
- **Perubahan yang Dilakukan**:
  - **Warna Angka Hitam**: Menghapus warna status pada teks angka statistik, semuanya disamakan menggunakan warna hitam solid/tegas (`text-slate-900 dark:text-slate-100`).
  - **Redesign Penanda Klik**: Menghapus karakter arrow `↗` yang tidak rapi. Sebagai gantinya, label **Alpha** dan **Izin/Cuti** dirancang menyerupai **Interactive Chip Badges (Pills)**:
    - Alpha: Menggunakan background rose soft, stroke outline border rose-200, dan teks merah rose (`bg-rose-50 border border-rose-200 text-rose-700 dark:bg-rose-950/40 dark:border-rose-900/50 dark:text-rose-450 px-1.5 py-0.5 rounded-md mt-1 shadow-sm`).
    - Izin/Cuti: Menggunakan background amber soft, stroke outline border amber-200, dan teks emas/amber (`bg-amber-50 border border-amber-200 text-amber-700 dark:bg-amber-950/40 dark:border-amber-900/50 dark:text-amber-450 px-1.5 py-0.5 rounded-md mt-1 shadow-sm`).
    - Desain chip ini secara visual memberi tahu pengguna dengan sangat anggun dan profesional bahwa area tersebut merupakan tombol interaktif.
  - **Link Play Store Banner**:
    - Membuat click handler `handleBannerClick`. Jika banner aktif berada pada index `0` (gambar1.png), link play store akan dipicu.
    - Jika dijalankan di perangkat Android (dideteksi lewat user-agent), ia akan membuka custom URI scheme `market://details?id=com.ivanad.ngabsen.unesv1` untuk langsung meluncurkan aplikasi Google Play Store bawaan HP, dengan fallback timeout 1 detik ke URL web Play Store jika gagal.
    - Jika dijalankan di non-Android (iOS/Desktop), maka langsung membuka halaman web Play Store di tab baru.
- **Verifikasi**:
  - Menjalankan build produksi via `pnpm build` dan berhasil sukses 100% tanpa ada kendala error.

## 2026-07-05 - Penyelarasan Warna Label Masuk dan Pulang Menjadi Hitam

- **Tujuan**: Menyelaraskan seluruh teks di dalam strip statistik agar bebas dari warna abu-abu (grey) demi kontras yang tinggi.
- **File yang Diubah**: [Index.tsx](file:///C:/Users/Administrator/Documents/GitHub/absensiunesv2/src/pages/Index.tsx)
- **Perubahan yang Dilakukan**:
  - Mengubah warna label teks **Masuk** dan **Pulang** dari `text-slate-500` (grey) menjadi hitam solid (`text-slate-900 dark:text-slate-100`).
  - Ini membuat visual tulisan label untuk kolom non-button (Masuk & Pulang) terlihat tajam dan konsisten dengan angka di atasnya.
- **Verifikasi**:
  - Menjalankan build produksi via `pnpm build` dan berhasil sukses 100% tanpa ada kendala error.

## 2026-07-06 - Konfigurasi Remote MCP Server DBAbsensiUNES

- **Tujuan**: Menambahkan konfigurasi remote MCP server `DBAbsensiUNES` sesuai dengan instruksi Ipan agar terhubung dengan database Supabase proyek `fxwtdohwjylsptcnoxhe`.
- **Kondisi Awal**: Konfigurasi MCP server `DBAbsensiUNES` belum terdaftar di file konfigurasi global `.gemini`.
- **File yang Diubah**:
  - [settings.json](file:///C:/Users/Administrator/.gemini/settings.json) (Menambahkan entri di dalam objek `"mcpServers"`)
  - [config/mcp_config.json](file:///C:/Users/Administrator/.gemini/config/mcp_config.json) (Menulis konfigurasi remote MCP)
  - [antigravity/mcp_config.json](file:///C:/Users/Administrator/.gemini/antigravity/mcp_config.json) (Menulis konfigurasi remote MCP)
  - [antigravity-ide/mcp_config.json](file:///C:/Users/Administrator/.gemini/antigravity-ide/mcp_config.json) (Menulis konfigurasi remote MCP)
  - [antigravity-cli/mcp_config.json](file:///C:/Users/Administrator/.gemini/antigravity-cli/mcp_config.json) (Menulis konfigurasi remote MCP)
- **Perubahan yang Dilakukan**:
  - Mendaftarkan remote MCP server `DBAbsensiUNES` dengan properti `type: "remote"`, URL `https://mcp.supabase.com/mcp?project_ref=fxwtdohwjylsptcnoxhe`, dan header otorisasi Bearer token yang aman.
  - Untuk keandalan penuh, konfigurasi ditulis ke semua lokasi deteksi konfigurasi MCP di lingkungan `.gemini` (settings.json, config, & sub-app profiles).
- **Langkah Selanjutnya**:
  - Menunggu instruksi berikutnya dari Ipan untuk interaksi atau pengujian dengan database Supabase via tools MCP.

## 2026-07-06 - Implementasi Alur Absensi Pembekalan KKN Terpisah (Opsi 1)

- **Tujuan**: Memisahkan alur absensi pembekalan KKN mahasiswa dan DPL KKN dari absensi harian kantor/dosen reguler agar tidak saling memblokir di akhir pekan (hari Minggu) dan mendukung multi-sesi absensi dalam satu hari.
- **Kondisi Awal**: Semua user menggunakan RPC reguler `submit_attendance_server_time` yang memblokir absensi di hari Minggu dan membatasi 1 absen masuk/pulang per hari.
- **File & Database yang Dicek**:
  - `src/pages/Attendance.tsx` (Melihat inisialisasi kamera stream & integrasi API Telegram)
  - `src/pages/Index.tsx` (Mencari navigasi & filter button absen)
  - `src/pages/LaporanKehadiranKKN.tsx` (Mengecek filter data kehadiran KKN untuk PDF)
- **Perubahan yang Dilakukan**:
  - **Database (Supabase)**:
    - Membuat tabel baru `public.kkn_sessions` untuk menampung data nama sesi, tanggal, jam start/end, dan tipe absensi.
    - Mengisi 6 jadwal sesi pembekalan & pelepasan KKN 2026 ke dalam tabel `kkn_sessions`.
    - Membuat fungsi RPC database baru `submit_attendance_kkn` yang memvalidasi sesi KKN aktif secara server-time dan mencatat kehadiran ke tabel `public.attendances` utama.
  - **Frontend**:
    - Membuat file baru [AttendanceKKN.tsx](file:///C:/Users/Administrator/Documents/GitHub/absensiunesv2/src/pages/AttendanceKKN.tsx) khusus untuk menangani absensi KKN dengan validasi terisolasi ke koordinat Gedung A (radius 75m).
    - Menghubungkan halaman baru ke route `/attendance-kkn` di [App.tsx](file:///C:/Users/Administrator/Documents/GitHub/absensiunesv2/src/App.tsx).
    - Menambahkan tombol menu "Absen Pembekalan KKN" kondisional di [Index.tsx](file:///C:/Users/Administrator/Documents/GitHub/absensiunesv2/src/pages/Index.tsx) untuk mahasiswa dan DPL KKN, serta menyembunyikan tombol absen reguler untuk role mahasiswa agar mencegah kebingungan user.
- **Verifikasi**:
  - Menjalankan perintah `pnpm build` untuk verifikasi build produksi dan berhasil sukses 100% tanpa kesalahan kompilasi.
- **Langkah Selanjutnya**:
  - Menunggu masukan data riil mahasiswa KKN untuk diimport massal (bulk insert) menjelang pembekalan.

## 2026-07-06 - Perbaikan Bug Visibilitas Tombol KKN & Setup Akun Uji Coba tesx

- **Tujuan**: Memperbaiki bug di mana tombol "Absen Pembekalan KKN" tiba-tiba hilang dari halaman utama setelah navigasi ke halaman profil/absen, serta mengatur akun uji coba `tesx` sebagai DPL KKN.
- **File & Database yang Dicek**:
  - `src/lib/auth.ts` (Mengecek query refresh data user)
  - Database Supabase (Tabel `users` untuk username `tesx`)
- **Perubahan yang Dilakukan**:
  - **Perbaikan Kode**:
    - Memperbaiki query `.select()` di dalam fungsi `refreshUserData` di [auth.ts](file:///C:/Users/Administrator/Documents/GitHub/absensiunesv2/src/lib/auth.ts) agar menyertakan kolom `is_dpl_kkn`. Sebelumnya kolom ini terlewatkan sehingga status DPL KKN ter-reset menjadi `false` setiap kali session user di-refresh di background.
  - **Database (Supabase)**:
    - Melakukan update status `is_dpl_kkn = true` untuk akun `tesx` agar Ipan bisa menguji coba alur absensi KKN menggunakan akun tersebut.
- **Verifikasi**:
  - Menjalankan `pnpm build` untuk memastikan kompilasi tetap 100% sukses tanpa ada issue TypeScript.
- **Langkah Selanjutnya**:
  - Menunggu hasil uji coba langsung dari Ipan dan menindaklanjuti masukan.

## 2026-07-06 - Penyelarasan Visual Halaman AttendanceKKN Identik dengan Halaman Reguler

- **Tujuan**: Menyelaraskan desain visual dan komponen layout halaman absensi KKN (`AttendanceKKN.tsx`) agar sama persis dengan halaman absensi reguler (`Attendance.tsx`) sesuai instruksi Ipan.
- **File yang Diubah**:
  - [AttendanceKKN.tsx](file:///C:/Users/Administrator/Documents/GitHub/absensiunesv2/src/pages/AttendanceKKN.tsx) (Redesign visual layout)
- **Perubahan yang Dilakukan**:
  - Mengubah layout header menjadi maroon solid dengan judul "ABSEN KKN" dan subjudul tanggal hari ini lengkap dengan logo UNES kecil di pojok kanan.
  - Memasukkan frame kotak camera scanning guide lengkap dengan garis sinar pemindai laser putih yang beranimasi turun-naik (`scan-line`).
  - Menambahkan overlay hijau "LOKASI SESUAI (SIAP)" dan merah "DI LUAR AREA ABSENSI" di atas video stream kamera.
  - Membuat grid status "MASUK KKN" dan "PULANG KKN" yang menampilkan jam tercatat dari Supabase secara langsung.
  - Menerapkan card status lokasi target "Gedung A (Auditorium)" yang menampilkan jarak meter dinamis dengan transisi hijau/emerald jika berada di dalam radius.
  - Menggunakan tombol utama 3D tebal `border-b-4 border-[#6b1516]` khas brand color.
  - Menerapkan modal dialog sukses/error penuh layar yang identik dengan gaya 3D reguler.
- **Verifikasi**:
  - Menjalankan `pnpm build` untuk memverifikasi kompilasi tetap sukses 100%.
- **Langkah Selanjutnya**:
  - Memantau uji coba Ipan dan bersiap untuk rilis final menu KKN.

## 2026-07-06 - Perbaikan Bug Runtime ReferenceError isBypassLocation di Halaman KKN

- **Tujuan**: Memperbaiki error runtime `ReferenceError: isBypassLocation is not defined` yang terjadi saat mencoba merender halaman `AttendanceKKN.tsx`.
- **File yang Diubah**:
  - [AttendanceKKN.tsx](file:///C:/Users/Administrator/Documents/GitHub/absensiunesv2/src/pages/AttendanceKKN.tsx) (Perbaikan scope variable)
- **Perubahan yang Dilakukan**:
  - Mendeklarasikan variabel `isBypassLocation` di level komponen utama (di atas return JSX). Sebelumnya variabel ini hanya dideklarasikan di dalam fungsi lokal `handleCapture` sehingga tidak bisa diakses oleh render JSX, memicu runtime error saat me-render elemen dengan evaluasi bypass lokasi.
- **Verifikasi**:
  - Menjalankan `pnpm build` untuk memverifikasi kompilasi tetap sukses 100%.
- **Langkah Selanjutnya**:
  - Menunggu hasil uji coba Ipan pada menu KKN dengan akun tesx.

## 2026-07-06 - Sinkronisasi Laporan Kehadiran KKN (Pelepasan KKN 30 Juli)

- **Tujuan**: Menyelaraskan menu laporan PDF pembekalan KKN agar mendeteksi dan menampilkan sesi pelepasan KKN DPL yang diadakan pada tanggal 30 Juli 2026.
- **File yang Diubah**:
  - [LaporanKehadiranKKN.tsx](file:///C:/Users/Administrator/Documents/GitHub/absensiunesv2/src/pages/LaporanKehadiranKKN.tsx) (Update filter date & sessions)
- **Perubahan yang Dilakukan**:
  - Mengubah rentang tanggal select query `loadData` dari `2026-07-18 s.d 2026-07-19` menjadi `2026-07-18 s.d 2026-07-30` agar data kehadiran tanggal 30 Juli ikut ditarik dari database.
  - Memasukkan sesi baru ke dalam konstanta `SESSIONS` untuk Kamis, 30 Juli 2026 (Pelepasan KKN DPL jam 08:00 - 10:00).
  - Menambahkan menu pilihan Rekap baru: "Rekap Kamis, 30 Juli 2026" dan "Rekap Kumulatif Semua Hari KKN" agar admin bisa menarik laporan rekap komprehensif.
- **Verifikasi**:
  - Menjalankan `pnpm build` untuk memverifikasi kompilasi tetap sukses 100% dan tidak ada kendala.
- **Langkah Selanjutnya**:
  - Menunggu masukan Ipan untuk pengerjaan lanjutan.

## 2026-07-06 - Desain Ulang PDF Rekap KKN Menjadi Kolom Per Sesi Individual

- **Tujuan**: Merestrukturisasi layout tabel PDF rekap KKN agar setiap sesi pembekalan mendapatkan kolom tersendiri, bukan digabung secara harian global (Masuk & Pulang) agar lebih teratur dan hemat halaman.
- **File yang Diubah**:
  - [LaporanKehadiranKKN.tsx](file:///C:/Users/Administrator/Documents/GitHub/absensiunesv2/src/pages/LaporanKehadiranKKN.tsx) (Restrukturisasi tabel PDF & preview UI)
- **Perubahan yang Dilakukan**:
  - **Restrukturisasi Kolom**: Mengubah struktur header tabel PDF rekap. Kolom tanggal harian reguler dihapus, digantikan dengan kolom sesi pembekalan KKN spesifik (Sabtu S1, Sabtu S2, Minggu S1, Minggu S2, Minggu S3, Kamis Pelepasan).
  - **Pencocokan Absen Presisi**: Membuat logika pencocokan jam absensi WIB dengan rentang jam masing-masing sesi pembekalan KKN untuk menentukan kehadiran user pada sesi terkait.
  - **Optimalisasi Ruang Vertikal (Hemat Kertas)**:
    - Karena setiap sel kolom mewakili 1 sesi pembekalan (yang hanya memiliki 1 data foto absen), tinggi baris (`minCellHeight`) dikurangi secara signifikan dari `210pt` menjadi hanya `115pt`.
    - Dengan tinggi baris `115pt`, jumlah peserta yang dimuat per halaman meningkat dari 2 orang menjadi **3-4 orang**. Ini sangat menghemat halaman PDF.
  - **Preview Layar Interaktif**: Halaman preview di UI web juga disinkronkan untuk menampilkan status kehadiran peserta per sesi individual/rekap secara real-time.
- **Verifikasi**:
  - Menjalankan `pnpm build` untuk memverifikasi kompilasi tetap sukses 100% dan tidak ada kendala.
- **Langkah Selanjutnya**:
  - Menyelesaikan seluruh rangkaian rilis fitur absensi dan laporan KKN Universitas Ekasakti.

## 2026-07-06 - Optimalisasi Pencocokan Sesi & Perbaikan Sintaks Laporan KKN

- **Tujuan**: Memperbaiki sistem pencocokan absensi KKN di tabel PDF rekap dan preview UI agar mencocokkan nama sesi secara aman berdasarkan kolom `note` database, serta memperbaiki typo sintaks JSX className.
- **File yang Diubah**:
  - [LaporanKehadiranKKN.tsx](file:///C:/Users/Administrator/Documents/GitHub/absensiunesv2/src/pages/LaporanKehadiranKKN.tsx) (Update matching logic & fix className typo)
- **Perubahan yang Dilakukan**:
  - **Pencocokan Multi-Sesi Presisi**:
    - Membuat helper `findMatchedSession()` yang mendeteksi kehadiran peserta berdasarkan stempel sesi di dalam note database (misal: "Sabtu Sesi 1", "Minggu Sesi 3", dll) yang di-insert oleh RPC `submit_attendance_kkn`.
    - Menambahkan fallback pencocokan tanggal dan jam WIB jika kolom note kosong/manual.
    - Menerapkan helper baru ini baik pada pembuat tabel PDF rekap maupun pada panel preview layar untuk menjamin sinkronisasi data 100%.
  - **Perbaikan Sintaks**: Memperbaiki typo backtick ekstra pada template string `className` div element preview rekap di baris 921 yang sempat memicu error kompilasi.
- **Verifikasi**:
  - Menjalankan `pnpm build` untuk memverifikasi kompilasi tetap sukses 100% dan tidak ada kendala.
- **Langkah Selanjutnya**:
  - Memantau pengujian penuh laporan KKN oleh Ipan.

## 2026-07-06 - Penghapusan Badge Aktif & Penanda Sesi Real-Time di Halaman KKN

- **Tujuan**: Menghapus badge statis "Menu KKN Aktif" di halaman beranda serta menambahkan indikator sesi aktif real-time di halaman absensi KKN (`AttendanceKKN.tsx`).
- **File yang Diubah**:
  - [Index.tsx](file:///C:/Users/Administrator/Documents/GitHub/absensiunesv2/src/pages/Index.tsx) (Hapus badge Menu KKN Aktif)
  - [AttendanceKKN.tsx](file:///C:/Users/Administrator/Documents/GitHub/absensiunesv2/src/pages/AttendanceKKN.tsx) (Indikator sesi aktif real-time)
- **Perubahan yang Dilakukan**:
  - **Halaman Beranda**: Menghapus elemen HTML div badge "Menu KKN Aktif" dari tombol Absen KKN agar visual tombol terlihat lebih bersih dan rapi.
  - **Indikator Sesi Real-Time**:
    - Membuat state `activeSessionLabel` dan fungsi query `fetchActiveSession()` di halaman `AttendanceKKN.tsx`. Fungsi ini mengambil data sesi pembekalan dari tabel `kkn_sessions` di Supabase berdasarkan waktu server WIB saat ini.
    - Menampilkan nama sesi yang sedang berjalan (contoh: "Sabtu Sesi 1", "Minggu Sesi 3") tepat di bawah overlay status lokasi camera.
    - Mengupdate tulisan pada tombol utama absensi KKN agar berubah dinamis (contoh: "ABSEN SABTU SESI 1") sesuai sesi yang sedang berjalan agar user tidak bingung.
- **Verifikasi**:
  - Menjalankan `pnpm build` untuk memverifikasi kompilasi tetap sukses 100% dan tidak ada kendala.
- **Langkah Selanjutnya**:
  - Membantu Ipan mengevaluasi seluruh perbaikan alur KKN ini.

## 2026-07-06 - Pembatasan Visibilitas Tombol Absen KKN Hanya untuk Akun tesx

- **Tujuan**: Menyembunyikan tombol "Absen Pembekalan KKN" di halaman beranda dari seluruh akun umum/DPL agar tidak memicu kebingungan menjelang hari-H (18 Juli 2026), namun membiarkannya tetap aktif khusus untuk akun uji coba `tesx`.
- **File yang Diubah**:
  - [Index.tsx](file:///C:/Users/Administrator/Documents/GitHub/absensiunesv2/src/pages/Index.tsx) (Update conditional rendering KKN button)
- **Perubahan yang Dilakukan**:
  - Mengubah logika conditional rendering banner KKN dari `(currentUser?.role === 'mahasiswa' || currentUser?.is_dpl_kkn)` menjadi `currentUser?.username === 'tesx'`.
  - Hal ini menjamin hanya Ipan (via akun `tesx`) yang dapat melihat dan mengetes halaman absensi KKN di dashboard utama sebelum peluncuran resmi.
- **Verifikasi**:
  - Menjalankan `pnpm build` untuk memverifikasi kompilasi tetap sukses 100% dan tidak ada kendala.
  - Menunggu instruksi akhir dari Ipan perihal deploy atau validasi final.

## 2026-07-06 - Impor Akun Mahasiswa KKN & Sinkronisasi Laporan No. BP

- **Tujuan**: Mengimpor 820 data akun mahasiswa KKN dari file Excel ke database Supabase, serta mensinkronkan No. BP (username) mahasiswa agar tampil di preview dan PDF laporan KKN.
- **File & Database yang Dicek**:
  - Database Supabase (Tabel `users` dan `user_passwords`)
  - [LaporanKehadiranKKN.tsx](file:///C:/Users/Administrator/Documents/GitHub/absensiunesv2/src/pages/LaporanKehadiranKKN.tsx) (Preview UI & PDF format)
- **Perubahan yang Dilakukan**:
  - **Database (Supabase)**:
    - Sukses mengimpor 820+ data akun mahasiswa KKN secara massal (bulk insert) terbagi ke dalam 8 SQL batch yang aman.
    - Setiap mahasiswa kini dapat login menggunakan `No. BP` sebagai username dan password default `12345678`.
    - Mengatur lokasi absensi utama (`primary_location`) seluruh **820 akun mahasiswa KKN** secara massal ke **"Gedung A Universitas Ekasakti"** agar tersinkronisasi dengan area geofencing pembekalan KKN (Auditorium Gedung A).
  - **Frontend**:
    - Memperbaiki missing import `AlertCircle` di `LaporanKehadiranKKN.tsx` untuk mencegah error kompilasi/runtime.
    - Menampilkan No. BP mahasiswa (`BP: {u.username}`) tepat di bawah nama lengkap pada tabel preview di layar.
    - Menyisipkan No. BP mahasiswa (`(BP: {u.username})`) pada kolom nama di tabel PDF laporan rekap KKN.
    - Menambahkan kolom **"Total Kehadiran"** di paling kanan baik pada tabel preview UI maupun PDF laporan ekspor rekap KKN. Kolom ini menghitung dan memformat jumlah **Hadir**, **Alpa** (tidak hadir), dan **Izin** secara otomatis per individu mahasiswa/peserta.
    - Memperbaiki bug visual badge label role di halaman Profil (`Profile.tsx`), di mana akun mahasiswa KKN sebelumnya keliru terpetakan sebagai **Tendik**. Sekarang role mahasiswa akan tampil dengan badge bertuliskan **Mahasiswa** secara tepat.
    - Menambahkan logic fallback pemuatan lokasi absensi resmi di Profil (`Profile.tsx`). Jika data pemetaan lokasi custom per-user-id kosong di database `attendance_locations`, program otomatis melakukan query data lokasi kampus berdasarkan stempel nama lokasi `users.primary_location`. Hal ini mensinkronkan visual lokasi absensi Gedung A bagi seluruh 820 mahasiswa KKN di halaman Profil mereka secara live.
- **Verifikasi**:
  - Melakukan kueri verifikasi live database dan mengonfirmasi terdapat total 820 mahasiswa KKN yang valid (setelah menghapus 2 akun dummy `mhs1` dan `mhs2` sesuai permintaan Ipan) dengan mapping user_passwords yang valid 100%.
  - Berhasil mem-build ulang proyek frontend dengan sukses 100% tanpa kendala compile.
- **Langkah Selanjutnya**:
  - Menunggu instruksi lanjutan dari Ipan untuk uji coba login mahasiswa atau penyesuaian visual lainnya.

## 2026-07-07 - Menampilkan Tombol Absensi Pembekalan KKN Hanya untuk Mahasiswa

- **Tujuan**: Menampilkan tombol "Absen Pembekalan KKN" di halaman beranda (Home) secara resmi hanya untuk user dengan role mahasiswa, dan menyembunyikan tombol absen reguler.
- **Kondisi Awal**: Tombol "Absen Pembekalan KKN" di halaman beranda dibatasi secara ketat hanya untuk akun uji coba dengan username `tesx`.
- **File yang Diubah**: [Index.tsx](file:///C:/Users/Administrator/Documents/GitHub/absensiunesv2/src/pages/Index.tsx)
- **Perubahan yang Dilakukan**:
  - Mengubah conditional rendering tombol KKN di halaman beranda dari `currentUser?.username === 'tesx'` menjadi `currentUser?.role === 'mahasiswa'`.
  - Hal ini memastikan seluruh mahasiswa KKN yang login (dengan No. BP) akan otomatis melihat tombol "Absen Pembekalan KKN" dan tombol absen reguler disembunyikan bagi mereka.
- **Verifikasi**:
  - Menjalankan build produksi via `pnpm build` untuk menjamin tidak ada kendala compile.
- **Langkah Selanjutnya**:
  - Melakukan deployment atau pengujian langsung dengan akun mahasiswa KKN riil.

## 2026-07-07 - Impor Tambahan Akun Mahasiswa KKN 2025-3

- **Tujuan**: Menambahkan 7 akun mahasiswa tambahan peserta KKN ke dalam database dari file Excel `PESERTA TAMBAHAN KKN 2025-3.xlsx`.
- **Kondisi Awal**: Terdapat 820 akun mahasiswa KKN yang sudah terdaftar di database, namun ada 7 mahasiswa tambahan yang belum terdaftar.
- **Database yang Diubah**: `public.users` dan `public.user_passwords`
- **Perubahan yang Dilakukan**:
  - Membaca file Excel `PESERTA TAMBAHAN KKN 2025-3.xlsx` dan memetakan 7 mahasiswa tambahan beserta BP (username) dan namanya.
  - Menganalisis kode BP untuk menentukan program studi (`unit_kerja`) secara presisi:
    - 4 mahasiswa Fakultas Hukum (`3600`): FAJRI ASYADIQ DARMA PUTRA, AFIZ RIDHO ZULFA, RIZKI ROVENDRI RAMADHAN, AGUNG UTAMA -> `Ilmu Hukum`.
    - 1 mahasiswa Teknik Sipil (`3433`): PANJI RAESMAN -> `Teknik Sipil`.
    - 1 mahasiswa Teknik Elektro (`3421`): RUSLI -> `Teknik Elektro`.
    - 1 mahasiswa Teknik Mesin (`3423`): TAUFIK HIDAYAT -> `Teknik Mesin`.
  - Melakukan bulk insert dalam sebuah database transaction untuk mendaftarkan 7 mahasiswa tersebut ke dalam tabel `users` (dengan default password `'12345678'` yang di-hash menggunakan `extensions.crypt` pgcrypto) dan `user_passwords` (untuk plain text password distribution).
  - Mengeset lokasi absensi utama (`primary_location`) ke `'Gedung A Universitas Ekasakti'` agar sinkron dengan area geofencing pembekalan KKN.
- **Verifikasi**:
  - Menjalankan kueri validasi live untuk memastikan data tersimpan dengan benar di tabel `users` dan `user_passwords`.
- **Langkah Selanjutnya**:
  - Menginfokan ke Ipan bahwa akun tambahan sudah aktif dan siap dicoba.

## 2026-07-08 - Pembuatan Akun Uji Coba KKN, Simulasi Sekuensial 6 Sesi, dan Fitur Pencarian Laporan KKN

- **Tujuan**: Membantu memfasilitasi pengujian beta KKN hari Sabtu dan Minggu dengan membuat akun uji coba `12345678`, mengkonfigurasi simulasi waktu & lokasi tetap untuk seluruh 6 sesi secara sekuensial, serta menambahkan fitur pencarian nama/BP di laporan KKN.
- **Kondisi Awal**: 
  - Belum ada akun uji coba mahasiswa `12345678`.
  - Absensi KKN terikat pada GPS/geofencing riil dan waktu server hari-H yang memblokir pengetesan offline hari ini.
  - Terdapat limitasi database yang menolak absensi selain role superadmin di hari Minggu.
  - Tampilan jam kehadiran di `AttendanceKKN.tsx` masih berformat "Masuk KKN" & "Pulang KKN" reguler.
- **File & Database yang Diubah**:
  - **Database (Supabase)**:
    - Menyisipkan user baru `12345678` di tabel `users` (dengan password hash bcrypt `'12345678'`) dan `user_passwords` (plain text).
    - Memodifikasi fungsi RPC `submit_attendance_kkn` agar khusus untuk username `12345678` melakukan bypass date-check dan secara sekuensial mencatat absensi simulasi untuk seluruh 6 sesi KKN: Sabtu Sesi 1 & 2 (18 Juli), Minggu Sesi 1, 2, & 3 (19 Juli), serta Kamis Pelepasan (30 Juli).
    - **Trigger Function**: Memperbarui trigger function `enforce_attendance_not_sunday_except_superadmin` untuk mendeteksi `note` berisi `Sesi:` atau `KKN` agar membypass pemblokiran hari Minggu khusus untuk absensi pembekalan KKN.
    - **Bugfix**: Menghapus (drop) overloading fungsi `submit_attendance_kkn` (lama vs baru dengan beda tipe argumen `varchar` dan `text`) untuk mengatasi error *Could not choose the best candidate function*. Fungsi tunggal dideklarasikan menggunakan tipe `text` sesuai parameter frontend.
  - **Frontend**:
    - [AttendanceKKN.tsx](file:///C:/Users/Administrator/Documents/GitHub/absensiunesv2/src/pages/AttendanceKKN.tsx):
      - Mengatur bypass geofencing dan mensimulasikan status koordinat tetap di Gedung A untuk akun `12345678`.
      - Memodifikasi `fetchActiveSession` and `checkKknAttendance` agar mendeteksi status sekuensial seluruh 6 sesi secara dinamis berdasarkan catatan absensi yang sudah dibuat.
      - **Grid Checklist Sesi KKN**: Mengubah UI info kehadiran dari 2 kolom masuk/pulang menjadi grid 3x2 kompak yang menampilkan checklist waktu kehadiran di 6 sesi KKN (Sabtu S1/S2, Minggu S1/S2/S3, dan Pelepasan) secara real-time.
      - **Pesan Sukses**: Menyesuaikan modal dialog sukses agar menampilkan pesan yang diminta: *"Absensi Pembekalan KKN anda untuk [Nama Sesi] telah berhasil dicatat terima kasih"*.
    - [LaporanKehadiranKKN.tsx](file:///C:/Users/Administrator/Documents/GitHub/absensiunesv2/src/pages/LaporanKehadiranKKN.tsx):
      - Menambahkan field input pencarian "Cari Nama / BP" di dalam Filter Controls Card.
      - Memfilter data preview dan hasil PDF secara responsif berdasarkan `searchQuery` yang dimasukkan.
      - Mengatur reset halaman paginasi ke `1` secara otomatis saat kueri pencarian berubah.
      - Memperbarui visual empty state agar menampilkan keterangan pencarian tidak ditemukan secara lebih ramah.
    - [LaporanPerPengguna.tsx](file:///C:/Users/Administrator/Documents/GitHub/absensiunesv2/src/pages/LaporanPerPengguna.tsx):
      - Menyaring/menyembunyikan pengguna dengan role `mahasiswa` dari dropdown pilihan pegawai di laporan individu harian.
      - Memodifikasi query pengambilan data absensi agar mengambil kolom `note`, lalu menyaring keluar (filter out) seluruh rekaman absensi bertanda KKN agar tidak mengotori laporan individu harian dosen/pegawai yang bersangkutan.
    - [LaporanKehadiran3.tsx](file:///C:/Users/Administrator/Documents/GitHub/absensiunesv2/src/pages/LaporanKehadiran3.tsx), [LaporanKehadiran4.tsx](file:///C:/Users/Administrator/Documents/GitHub/absensiunesv2/src/pages/LaporanKehadiran4.tsx), [LaporanAlpha.tsx](file:///C:/Users/Administrator/Documents/GitHub/absensiunesv2/src/pages/LaporanAlpha.tsx), [Rekap.tsx](file:///C:/Users/Administrator/Documents/GitHub/absensiunesv2/src/pages/Rekap.tsx):
      - Memastikan kolom `note` diseleksi pada query, kemudian memfilter keluar seluruh rekaman absensi bertanda KKN (note berisi `Sesi:` atau `KKN`) di tingkat pemrosesan data (load data/generator). Ini menjamin data absensi KKN milik DPL (yang notabene ber-role `dosen` kantor) sama sekali tidak akan masuk atau memengaruhi perhitungan persentase kehadiran, rekap mingguan/bulanan, maupun status alpa/hadir di laporan reguler.
    - [AttendanceKKN.tsx](file:///C:/Users/Administrator/Documents/GitHub/absensiunesv2/src/pages/AttendanceKKN.tsx):
      - Menambahkan penguncian tombol absen KKN berdasarkan `isValidActiveSession`. Tombol absen KKN sekarang dinonaktifkan (disabled) secara otomatis dan berwarna abu-abu jika tidak ada sesi yang aktif atau jika diakses di luar tanggal & jam sesi pembekalan yang ditentukan di database.
      - Menampilkan label status sesi langsung pada tombol (contoh: "Tidak Ada Sesi Hari Ini" atau "Tidak Ada Sesi Aktif") untuk mencegah kesalahan absensi.
      - Khusus untuk akun uji coba `12345678`, status sesi aktif disimulasikan sekuensial sehingga tombol tetap aktif untuk pengujian kapan saja.
- **Verifikasi**:
  - Melakukan kueri validasi live untuk memastikan data tersimpan dengan benar di tabel `users` dan `user_passwords`.
  - Menjalankan kompilasi produksi via `pnpm build` untuk menjamin tidak ada kendala compiler (sukses 100%).
- **Langkah Selanjutnya**:
  - Menginfokan ke Ipan bahwa tombol absensi KKN reguler sudah terkunci rapat sesuai tanggal/jam sesi aktif (dan aman dibypass oleh akun uji coba KKN).

## 2026-07-08 - Impor Tambahan Akun Mahasiswa KKN 2025-3 (Tahap 2)

- **Tujuan**: Mengimpor 7 data akun tambahan mahasiswa KKN dari file Excel `PESERTA TAMBAHAN KKN 2025- 8 juli.xlsx` (sheet `08 Juli 2026`) ke database Supabase, dan menyeragamkan unit kerja seluruh mahasiswa.
- **Kondisi Awal**: Terdapat 827 akun mahasiswa KKN (820 awal + 7 tambahan tanggal 7 Juli), dan ada 7 mahasiswa tambahan baru yang didaftarkan per tanggal 8 Juli 2026. Masing-masing mahasiswa sebelumnya dipetakan unit kerjanya berdasarkan nama program studi.
- **Database yang Diubah**: `public.users` dan `public.user_passwords`
- **Perubahan yang Dilakukan**:
  - Membaca data sheet `08 Juli 2026` dari file Excel `PESERTA TAMBAHAN KKN 2025- 8 juli.xlsx` yang terdiri dari 7 mahasiswa baru.
  - Melakukan insert transaksi SQL (database transaction) untuk mendaftarkan 7 mahasiswa tersebut ke dalam tabel `users` (dengan default password `'12345678'` yang di-hash dengan bcrypt `extensions.crypt`) dan `user_passwords` (untuk plain text password distribution).
  - Mengeset lokasi absensi utama (`primary_location`) ke `'Gedung A Universitas Ekasakti'` agar sinkron dengan area geofencing pembekalan KKN.
  - Melakukan update massal untuk mengeset seluruh akun mahasiswa (`role = 'mahasiswa'`) agar memiliki `unit_kerja` bernilai `'Gedung A (Auditorium)'` sesuai instruksi Ipan.
- **Verifikasi**:
  - Melakukan kueri validasi live database dan mengonfirmasi data berhasil masuk di kedua tabel (`users` dan `user_passwords`) dengan mapping yang valid 100%.
  - Memverifikasi bahwa total 835 akun mahasiswa saat ini (820 + 7 + 7 + 1 akun tes) sudah berhasil diseragamkan unit kerjanya menjadi `'Gedung A (Auditorium)'`.
- **Langkah Selanjutnya**:
  - Menginfokan ke Ipan bahwa akun tambahan baru sudah aktif dan unit kerja seluruh mahasiswa sudah diseragamkan ke Gedung A (Auditorium).

## 2026-07-09 - Impor Tambahan Akun Mahasiswa KKN 2025-9-juli

- **Tujuan**: Mengimpor 7 data akun tambahan mahasiswa KKN dari file Excel `PESERTA TAMBAHAN KKN 2025-9-juli.xlsx` ke database Supabase dengan role `mahasiswa` dan password default `'12345678'`.
- **Kondisi Awal**: Terdapat 835 akun mahasiswa KKN terdaftar di database, dan ada 7 mahasiswa tambahan baru yang didaftarkan per tanggal 9 Juli 2026.
- **Database yang Diubah**: `public.users` dan `public.user_passwords`
- **Perubahan yang Dilakukan**:
  - Membaca data dari file Excel `PESERTA TAMBAHAN KKN 2025-9-juli.xlsx` yang terdiri dari 7 mahasiswa baru: MANGIRING PARULIAN SIHOMBING, ZILFA SULAIMAN, FRANKY FEBRIANDI, RIKI ADRIANSYAH, HAZIZ ZULHAKIM, IRVAN ARNON SADAR NINGERAT WARUWU, dan KHAIRUNNISA SALSABILA P.
  - Melakukan insert transaksi SQL (atomic CTE query) untuk mendaftarkan 7 mahasiswa tersebut ke dalam tabel `users` (dengan `unit_kerja = 'Gedung A (Auditorium)'`, `primary_location = 'Gedung A Universitas Ekasakti'`, role `'mahasiswa'`, dan password default `'12345678'` yang di-hash dengan bcrypt `extensions.crypt`) serta tabel `user_passwords` (untuk plain text password distribution).
- **Verifikasi**:
  - Melakukan kueri validasi live database dan mengonfirmasi data berhasil masuk di kedua tabel (`users` dan `user_passwords`) dengan relasi UUID dan data yang valid 100%.
  - Total mahasiswa terdaftar saat ini menjadi 842 akun mahasiswa KKN (835 + 7 baru).
- **Langkah Selanjutnya**:
  - Menginfokan ke Ipan bahwa akun tambahan per 9 Juli 2026 sudah aktif dan siap digunakan untuk absensi pembekalan KKN.

## 2026-07-10 - Filter Mahasiswa KKN dari Halaman Kelola Izin/Cuti

- **Tujuan**: Menghilangkan nama-nama mahasiswa KKN dari daftar pilihan pengguna (dropdown Tendik) di halaman Kelola Izin/Cuti.
- **Kondisi Awal**: Halaman Kelola Izin/Cuti (`KelolaIzinCuti.tsx`) memuat seluruh akun pengguna dari tabel `users` tanpa memfilter role `mahasiswa`. Hal ini menyebabkan akun mahasiswa KKN juga muncul sebagai pilihan untuk pengajuan izin, cuti, atau dinas luar.
- **File yang Diubah**: [KelolaIzinCuti.tsx](file:///C:/Users/Administrator/Documents/GitHub/absensiunesv2/src/pages/KelolaIzinCuti.tsx)
- **Perubahan yang Dilakukan**:
  - Menambahkan filter `.neq("role", "mahasiswa")` pada kueri pemanggilan data pengguna di load data `users`.
  - Hal ini secara otomatis menyaring seluruh akun mahasiswa KKN agar tidak muncul baik pada dropdown pencarian filter maupun pada dropdown pilihan input di form pengajuan izin/cuti baru.
- **Verifikasi**:
  - Melakukan build produksi via `pnpm build` untuk menjamin tidak ada kesalahan kompilasi (compile check).
- **Langkah Selanjutnya**:
  - Memverifikasi hasil build dan melaporkan keberhasilan perubahan ini kepada Ipan.

## 2026-07-13 - Impor Tambahan Akun Mahasiswa KKN 2025-3 (Tahap 3)

- **Tujuan**: Mengimpor 6 data akun tambahan mahasiswa KKN ke database Supabase dengan role `mahasiswa` dan password default `'12345678'`.
- **Kondisi Awal**: Terdapat 842 akun mahasiswa KKN terdaftar di database, dan ada 6 mahasiswa tambahan baru yang perlu didaftarkan per tanggal 13 Juli 2026.
- **Database yang Diubah**: `public.users` and `public.user_passwords`
- **Perubahan yang Dilakukan**:
  - Mendaftarkan 6 mahasiswa tambahan baru: WIKO BAGUS PRATAMA, MUHAMMAD RILPY, ADRIANO ALHAMDI, MUHAMMAD YOGI ALFAJRI, M. RAGI GHAZAN, dan FAHRUR ROJI.
  - Melakukan insert transaksi SQL (atomic CTE query) untuk mendaftarkan 6 mahasiswa tersebut ke dalam tabel `users` (dengan `unit_kerja = 'Gedung A (Auditorium)'`, `primary_location = 'Gedung A Universitas Ekasakti'`, role `'mahasiswa'`, dan password default `'12345678'` yang di-hash dengan bcrypt `extensions.crypt`) serta tabel `user_passwords` (untuk plain text password distribution).
- **Verifikasi**:
  - Melakukan kueri validasi live database dan mengonfirmasi data berhasil masuk di kedua tabel (`users` dan `user_passwords`) dengan relasi UUID dan data yang valid 100%.
  - Total mahasiswa terdaftar saat ini menjadi 848 akun mahasiswa KKN (842 + 6 baru).
- **Langkah Selanjutnya**:
  - Menginfokan ke Ipan bahwa akun tambahan baru sudah aktif dan siap digunakan untuk absensi pembekalan KKN.

## 2026-07-14 - Impor Tambahan Akun Mahasiswa KKN 2025-3 (Tahap 4)

- **Tujuan**: Mengimpor 1 data akun tambahan mahasiswa KKN ke database Supabase dengan role `mahasiswa` dan password default `'12345678'`.
- **Kondisi Awal**: Terdapat 848 akun mahasiswa KKN terdaftar di database, dan ada 1 mahasiswa tambahan baru yang perlu didaftarkan per tanggal 14 Juli 2026.
- **Database yang Diubah**: `public.users` and `public.user_passwords`
- **Perubahan yang Dilakukan**:
  - Mendaftarkan 1 mahasiswa tambahan baru: YUDIMAN PRAYETNO (BP: `2310003302008`).
  - Melakukan insert transaksi SQL (atomic CTE query) untuk mendaftarkan mahasiswa tersebut ke dalam tabel `users` (dengan `unit_kerja = 'Gedung A (Auditorium)'`, `primary_location = 'Gedung A Universitas Ekasakti'`, role `'mahasiswa'`, dan password default `'12345678'` yang di-hash dengan bcrypt `extensions.crypt`) serta tabel `user_passwords` (untuk plain text password distribution).
- **Verifikasi**:
  - Melakukan kueri validasi live database dan mengonfirmasi data berhasil masuk di kedua tabel (`users` dan `user_passwords`) dengan relasi UUID dan data yang valid 100%.
  - Total mahasiswa terdaftar saat ini menjadi 849 akun mahasiswa KKN (848 + 1 baru).
- **Langkah Selanjutnya**:
  - Menginfokan ke Ipan bahwa akun tambahan baru sudah aktif dan siap digunakan untuk absensi pembekalan KKN.

## 2026-07-14 - Penghapusan Akun Mahasiswa KKN ARIA GABRIEL

- **Tujuan**: Menghapus 1 akun mahasiswa KKN (BP: `2310003530118` atas nama ARIA GABRIEL) dari database Supabase.
- **Kondisi Awal**: Terdapat 849 akun mahasiswa KKN terdaftar di database, dan ada permintaan penghapusan 1 mahasiswa. Tidak ditemukan data absensi, izin, jadwal kerja, atau lokasi kustom terkait mahasiswa ini di database.
- **Database yang Diubah**: `public.users` dan `public.user_passwords`
- **Perubahan yang Dilakukan**:
  - Melakukan penghapusan data secara berurutan dalam transaksi database: menghapus data dari `user_passwords` terlebih dahulu, dilanjutkan dengan tabel `users` untuk user ID `4f3ec974-9440-43fa-93e8-d7e4eb394f98`.
- **Verifikasi**:
  - Melakukan kueri validasi live database untuk memastikan akun sudah terhapus bersih dari kedua tabel.
  - Total mahasiswa terdaftar setelah penghapusan menjadi 848 akun mahasiswa KKN (849 - 1).
- **Langkah Selanjutnya**:
  - Menginfokan ke Ipan bahwa akun mahasiswa ARIA GABRIEL sudah berhasil dihapus.

## 2026-07-14 - Penyesuaian Status Alpha untuk Sesi KKN yang Belum Dimulai

- **Tujuan**: Menghindari kesalahan perhitungan Alpha pada laporan pembekalan KKN mahasiswa sebelum jadwal pembekalan KKN dimulai (dimulai 18 Juli 2026).
- **Kondisi Awal**: Pada halaman laporan kehadiran KKN, seluruh akun mahasiswa KKN secara otomatis langsung terhitung memiliki 6 Alpha karena sesi pembekalan yang dideklarasikan belum dimulai (hari ini masih 14 Juli 2026).
- **File yang Diubah**: [LaporanKehadiranKKN.tsx](file:///C:/Users/Administrator/Documents/GitHub/absensiunesv2/src/pages/LaporanKehadiranKKN.tsx)
- **Perubahan yang Dilakukan**:
  - Menambahkan helper `getCurrentWibDateTime` untuk mendapatkan tanggal & jam saat ini dalam Waktu Indonesia Barat (WIB / UTC+7).
  - Menambahkan helper `isSessionStarted` untuk membandingkan jadwal sesi pembekalan (tanggal dan waktu mulai) dengan waktu WIB saat ini.
  - Memodifikasi filter visual UI pada preview sesi tunggal dan rekap di mana jika sesi belum dimulai, status akan tampil netral sebagai `"Belum Dimulai"` atau `"Belum Mulai"` dengan warna abu-abu (slate).
  - Memperbarui fungsi hitung statistik (kehadiran & PDF) agar tidak menginkremen variabel `alpha` apabila suatu sesi terdeteksi belum dimulai.
  - Memperbarui visual rendering PDF cell agar menampilkan tanda `-` berwarna abu-abu apabila sesi tersebut belum dimulai.
- **Verifikasi**:
  - Melakukan build produksi via `pnpm build` untuk memverifikasi tidak ada kesalahan kompilasi.
- **Langkah Selanjutnya**:
  - Melaporkan kepada Ipan bahwa visualisasi status KKN di luar hari-H pembekalan sudah rapi dan tidak memunculkan Alpha prematur.

## 2026-07-14 - Kondisional Statistik Kehadiran KKN Mahasiswa di Halaman Utama (Home)

- **Tujuan**: Mengganti tampilan statistik bulanan reguler pada akun mahasiswa KKN di halaman utama (Home) agar hanya memuat informasi kehadiran pembekalan KKN (terdiri dari 6 sesi) dan tidak menghitung Alpha secara prematur sebelum pembekalan dimulai.
- **Kondisi Awal**: Pada dashboard utama mahasiswa KKN, halaman statistik bulanan masih menghitung kehadiran harian reguler dan menampilkan "Alpha 12" padahal mahasiswa KKN tidak memiliki kewajiban absensi kantor harian.
- **File yang Diubah**: [Index.tsx](file:///C:/Users/Administrator/Documents/GitHub/absensiunesv2/src/pages/Index.tsx)
- **Perubahan yang Dilakukan**:
  - Mendefinisikan konstanta jadwal 6 sesi pembekalan KKN (`KKN_INDIVIDUAL_SESSIONS`) serta helper waktu (`getCurrentWibDateTime`, `isSessionStarted`, `findMatchedSession`, `toWIBYMD`, `createdAtToLocalYMD`, `createdAtToWIBTime`) di file `Index.tsx`.
  - Menyesuaikan logika `loadStats` agar khusus pengguna ber-role `mahasiswa` menghitung kehadiran bulanan berdasarkan total kecocokan sesi pembekalan KKN yang sudah berjalan, serta mengeset total checkout ("Pulang") ke 0.
  - Memetakan daftar ketidakhadiran sesi pembekalan KKN ke dalam list `absentDates` (menyisipkan label nama sesi serta jam mulai-selesai).
  - Menyembunyikan tampilan kolom "Pulang" pada grid statistik untuk akun mahasiswa (hanya menampilkan Hadir KKN, Alpha, dan Izin/Cuti).
  - Mengubah label "Masuk" secara kondisional menjadi "Hadir KKN" untuk akun mahasiswa.
  - Memperbarui judul dan deskripsi modal detail ketidakhadiran ("Detail Ketidakhadiran KKN") agar relevan dengan sesi pembekalan KKN.
- **Verifikasi**:
  - Melakukan build produksi via `pnpm build` untuk memverifikasi tidak ada kesalahan kompilasi.
- **Langkah Selanjutnya**:
  - Menginfokan ke Ipan bahwa statistik di halaman Home untuk akun mahasiswa sudah diselaraskan khusus untuk KKN dengan aman.

## 2026-07-14 - Penambahan Informasi Kehadiran Pembekalan KKN Khusus DPL KKN di Halaman Utama (Home)

- **Tujuan**: Menambahkan kartu statistik KKN pembekalan terpisah tepat di bawah kartu statistik reguler untuk akun ber-role Dosen Pembimbing Lapangan KKN (`is_dpl_kkn = true`) agar mereka dapat melihat statistik harian reguler dan statistik sesi KKN pembekalan secara paralel tanpa saling menimpa.
- **Kondisi Awal**: Akun DPL KKN hanya menampilkan satu kartu statistik reguler (kantor harian), dan statistik KKN tidak terpantau di halaman Home mereka.
- **File yang Diubah**: [Index.tsx](file:///C:/Users/Administrator/Documents/GitHub/absensiunesv2/src/pages/Index.tsx)
- **Perubahan yang Dilakukan**:
  - Menambahkan state baru `kknStats` dan `kknAbsentDates` beserta trigger modal `showKknAbsentModal` dan `showKknLeaveModal` khusus untuk KKN di file `Index.tsx`.
  - Memodifikasi `loadStats` agar jika `currentUser.is_dpl_kkn === true`, perhitungan statistik reguler dan statistik KKN berjalan secara paralel dan mengisi masing-masing state dengan aman.
  - Merender kartu statistik kedua dengan judul *"Informasi Kehadiran pembekalan KKN"* menggunakan tata letak 3 kolom (Hadir KKN, Alpha, Izin/Cuti) di bawah kartu statistik utama.
  - Menambahkan modal dialog detail ketidakhadiran pembekalan KKN (`showKknAbsentModal`) dan izin/cuti KKN (`showKknLeaveModal`) terpisah di bagian paling bawah markup.
- **Verifikasi**:
  - Melakukan build produksi via `pnpm build` untuk memverifikasi tidak ada kesalahan kompilasi.
- **Langkah Selanjutnya**:
  - Menginfokan ke Ipan bahwa statistik KKN DPL sudah berhasil dipisahkan dan diposisikan secara paralel di bawah statistik reguler dengan aman.

## 2026-07-14 - Penghapusan Kolom Izin/Cuti KKN pada Tampilan Home

- **Tujuan**: Menghapus kolom "Izin/Cuti" pada kartu statistik KKN pembekalan (untuk akun mahasiswa KKN dan akun DPL KKN) di halaman Home, sehingga kartu statistik KKN hanya menampilkan 2 kolom: Hadir KKN dan Alpha.
- **File yang Diubah**: [Index.tsx](file:///C:/Users/Administrator/Documents/GitHub/absensiunesv2/src/pages/Index.tsx)
- **Perubahan yang Dilakukan**:
  - Membatasi tampilan tombol "Izin/Cuti" pada kartu statistik utama agar hanya dirender jika `currentUser.role !== 'mahasiswa'`.
  - Menghapus elemen tombol "Izin/Cuti" sepenuhnya pada kartu statistik pembekalan KKN khusus DPL KKN.
- **Verifikasi**:
  - Melakukan build produksi via `pnpm build` untuk memverifikasi tidak ada kesalahan kompilasi.
- **Langkah Selanjutnya**:
  - Melaporkan hasil penyesuaian visual kartu statistik KKN (hanya menampilkan Hadir KKN dan Alpha) ke Ipan.

## 2026-07-15 - Penyesuaian Jadwal 9 Sesi KKN di Database dan Frontend

- **Tujuan**: Menyesuaikan seluruh jadwal sesi absensi pembekalan KKN mahasiswa dan DPL KKN sesuai instruksi pimpinan KKN (menjadi 9 sesi baru yang lebih singkat, dan memindahkan Pelepasan KKN ke Rabu 22 Juli 2026).
- **Kondisi Awal**: Sistem KKN masih menggunakan 6 sesi jadwal pembekalan KKN lama dengan Pelepasan KKN dijadwalkan pada Kamis 30 Juli 2026.
- **File & Database yang Diubah**:
  - **Database (Supabase)**:
    - Mengupdate tabel `public.kkn_sessions` (menghapus data lama dan memasukkan 9 sesi pembekalan & pelepasan KKN baru lengkap dengan tanggal, jam start/end, dan tipe absensi masuk/pulang).
    - Memperbarui fungsi RPC `public.submit_attendance_kkn` agar sekuensial simulator untuk akun uji coba `12345678` mencakup seluruh 9 sesi baru secara urut dari Sabtu, Minggu, hingga Pelepasan KKN Rabu 22 Juli 2026.
  - **Frontend**:
    - [LaporanKehadiranKKN.tsx](file:///C:/Users/Administrator/Documents/GitHub/absensiunesv2/src/pages/LaporanKehadiranKKN.tsx):
      - Mengupdate konstanta `SESSIONS` and `KKN_INDIVIDUAL_SESSIONS` dengan data 9 sesi pembekalan & pelepasan KKN baru.
      - Menyesuaikan pembagian area rekap dan kumulatif semua hari KKN (Sabtu, Minggu, Rabu).
      - Mengubah scope loading date data KKN dari `2026-07-18 s.d 2026-07-30` menjadi `2026-07-18 s.d 2026-07-22` agar data terproses secara ringkas dan efisien.
      - Mengupdate logic preview UI sesi tunggal agar validasi mencakup 9 sesi (`selectedSessionIndex <= 9`).
    - [AttendanceKKN.tsx](file:///C:/Users/Administrator/Documents/GitHub/absensiunesv2/src/pages/AttendanceKKN.tsx):
      - Menyesuaikan `KKN_SESSIONS_DISPLAY`, `checkKknAttendance`, and `fetchActiveSession` simulator sekuensial agar mencakup 9 sesi baru.
      - Menyesuaikan tinggi visual camera section (`h-[42vh]` -> `h-[38vh]`) agar grid statistik 9 sesi baru (3 baris) tidak memicu elemen terpotong pada layar HP kecil.
    - [Index.tsx](file:///C:/Users/Administrator/Documents/GitHub/absensiunesv2/src/pages/Index.tsx):
      - Mengupdate konstanta `KKN_INDIVIDUAL_SESSIONS` dan logic pencocokan di `findMatchedSession` agar statistik kehadiran pembekalan KKN mahasiswa dan DPL KKN di halaman Home sinkron dengan 9 sesi baru.
- **Verifikasi**:
  - Menjalankan live queries via MCP `DBAbsensiUNES` untuk validasi kebenaran data tabel `kkn_sessions` and fungsi `submit_attendance_kkn`.
  - Menjalankan build produksi via `pnpm build` dan berhasil sukses 100% tanpa kesalahan kompilasi.
- **Langkah Selanjutnya**:
  - Melaporkan penyesuaian jadwal 9 sesi KKN kepada Ipan agar bisa segera diuji coba.

## 2026-07-15 - Impor Tambahan 12 Akun Mahasiswa KKN Baru

- **Tujuan**: Mendaftarkan 12 data akun tambahan mahasiswa KKN ke database Supabase dengan role `mahasiswa` dan password default `'12345678'`.
- **Kondisi Awal**: Data 12 mahasiswa baru tersebut belum terdaftar di database, dan perlu didistribusikan password default-nya.
- **Database yang Diubah**: `public.users` dan `public.user_passwords`
- **Perubahan yang Dilakukan**:
  - Mendaftarkan 12 mahasiswa tambahan baru: ADHA HARIES SYARIF, FAJRI FAUZAN, RIDHO BUDIMAN NASUTION, MUHAMMAD ERICK, RARA AMRILI, DANDY HERMAWAN, DIO PRATAMA PUTRA, NAUFAL RAMADHAN SUSANTO, AREVA, TONI SURIADI, DECKY MARSHEL, dan PEREN COPRA.
  - Melakukan insert transaksi SQL (atomic CTE query) untuk mendaftarkan 12 mahasiswa tersebut ke dalam tabel `users` (dengan `unit_kerja = 'Gedung A (Auditorium)'`, `primary_location = 'Gedung A Universitas Ekasakti'`, role `'mahasiswa'`, dan password default `'12345678'` yang di-hash dengan bcrypt `extensions.crypt` di kolom `password_hash`) serta tabel `user_passwords` (untuk plain text password distribution).
- **Verifikasi**:
  - Melakukan kueri validasi live database dan mengonfirmasi data berhasil masuk di kedua tabel (`users` dan `user_passwords`) dengan relasi UUID dan data yang valid 100%.
  - Total mahasiswa terdaftar setelah penambahan bertambah 12 akun.
- **Langkah Selanjutnya**:
  - Menginfokan ke Ipan bahwa 12 akun tambahan baru tersebut sudah aktif dan siap digunakan untuk absensi pembekalan KKN.

## 2026-07-15 - Penyesuaian Tanggal Pelepasan KKN ke Rabu 29 Juli 2026

- **Tujuan**: Mengupdate jadwal Pelepasan KKN dari yang sebelumnya direncanakan pada Rabu 22 Juli 2026 menjadi Rabu 29 Juli 2026 sesuai arahan terbaru.
- **Kondisi Awal**: Seluruh data database dan konfigurasi frontend menargetkan tanggal 22 Juli 2026 untuk Pelepasan KKN.
- **File & Database yang Diubah**:
  - **Database (Supabase)**:
    - Mengupdate `session_date` menjadi `'2026-07-29'` untuk sesi bernama `'Pelepasan KKN'` pada tabel `public.kkn_sessions`.
    - Memperbarui fungsi RPC `public.submit_attendance_kkn` agar waktu simulasi Pelepasan KKN untuk akun uji coba `12345678` diubah ke `'2026-07-29 09:00:00'`.
  - **Frontend**:
    - [LaporanKehadiranKKN.tsx](file:///C:/Users/Administrator/Documents/GitHub/absensiunesv2/src/pages/LaporanKehadiranKKN.tsx):
      - Mengubah stempel tanggal Pelepasan KKN (index 9) dan Rekap Pelepasan KKN (index 12) menjadi `2026-07-29`.
      - Mengupdate stempel tanggal pelepasan KKN di Rekap Kumulatif (index 14) menjadi `2026-07-29`.
      - Mengubah target date Pelepasan KKN di `KKN_INDIVIDUAL_SESSIONS` menjadi `'2026-07-29'`.
      - Mengubah batas pemrosesan loadData `endDate` dari `'2026-07-22'` menjadi `'2026-07-29'` agar data kehadiran tanggal 29 Juli ikut ditarik dengan aman.
    - [Index.tsx](file:///C:/Users/Administrator/Documents/GitHub/absensiunesv2/src/pages/Index.tsx):
      - Mengubah tanggal sesi Pelepasan KKN pada konstanta `KKN_INDIVIDUAL_SESSIONS` di halaman beranda (Home) menjadi `'2026-07-29'`.
- **Verifikasi**:
  - Menjalankan kueri validasi live database untuk memastikan tanggal sesi Pelepasan KKN di tabel `kkn_sessions` sudah berubah ke `2026-07-29`.
  - Menjalankan build produksi via `pnpm build` dan berhasil sukses 100% tanpa kesalahan kompilasi.
- **Langkah Selanjutnya**:
  - Melaporkan hasil penyesuaian tanggal Pelepasan KKN ini ke Ipan.

## 2026-07-15 - Penyembunyian Fitur Ganti Password untuk Mahasiswa di Halaman Profile

- **Tujuan**: Menghilangkan tombol "Ganti Password" dari halaman Profile khusus bagi akun yang memiliki role `mahasiswa` untuk membatasi kontrol akun selama KKN.
- **Kondisi Awal**: Seluruh jenis pengguna (termasuk mahasiswa KKN) dapat melihat dan menggunakan tombol "Ganti Password" di halaman Profile.
- **File yang Diubah**: [Profile.tsx](file:///C:/Users/Administrator/Documents/GitHub/absensiunesv2/src/pages/Profile.tsx)
- **Perubahan yang Dilakukan**:
  - Membungkus baris kode tombol "Ganti Password" di section "Keamanan & Akun" menggunakan conditional rendering: `currentUser?.role !== 'mahasiswa'`. Hal ini menyembunyikan opsi ubah password tersebut khusus untuk akun ber-role `mahasiswa`, namun membiarkannya tetap dapat diakses oleh admin, superadmin, dosen, dan pegawai reguler.
- **Verifikasi**:
  - Menjalankan build produksi via `pnpm build` dan berhasil sukses 100% tanpa kesalahan kompilasi.
- **Langkah Selanjutnya**:
  - Melaporkan perubahan penyembunyian menu ganti password KKN ke Ipan.

## 2026-07-16 - Impor Tambahan 5 Akun Mahasiswa KKN Baru

- **Tujuan**: Mendaftarkan 5 data akun tambahan mahasiswa KKN ke database Supabase dengan role `mahasiswa` dan password default `'12345678'`.
- **Kondisi Awal**: Terdapat 860 akun mahasiswa KKN terdaftar di database (termasuk impor 12 mahasiswa sebelumnya), dan ada 5 mahasiswa tambahan baru yang perlu didaftarkan per tanggal 16 Juli 2026.
- **Database yang Diubah**: `public.users` dan `public.user_passwords`
- **Perubahan yang Dilakukan**:
  - Mendaftarkan 5 mahasiswa tambahan baru: RAKHA RAGGAT AL FAIR, ZULFAHMI, GERI KURNIAWAN, MUHAMMAD ANUGRAH SETIAWAN, dan YOGA PRASETYO.
  - Melakukan insert transaksi SQL (atomic CTE query) untuk mendaftarkan 5 mahasiswa tersebut ke dalam tabel `users` (dengan `unit_kerja = 'Gedung A (Auditorium)'`, `primary_location = 'Gedung A Universitas Ekasakti'`, role `'mahasiswa'`, dan password default `'12345678'` yang di-hash dengan bcrypt `extensions.crypt` di kolom `password_hash`) serta tabel `user_passwords` (untuk plain text password distribution).
- **Verifikasi**:
  - Melakukan kueri validasi live database dan mengonfirmasi data berhasil masuk di kedua tabel (`users` dan `user_passwords`) dengan relasi UUID dan data yang valid 100%.
  - Total mahasiswa terdaftar setelah penambahan bertambah 5 akun.
- **Langkah Selanjutnya**:
  - Menginfokan ke Ipan bahwa 5 akun tambahan baru tersebut sudah aktif dan siap digunakan untuk absensi pembekalan KKN.

## 2026-07-16 - Implementasi Pemutar Musik Tema KKN Kondisional

- **Tujuan**: Menambahkan pemutar musik otomatis bertema KKN (`soundkkn.mp3`) di halaman Home, History, dan Profile untuk akun mahasiswa, DPL KKN, dan akun whitelist spesifik tanpa perulangan (no-loop / 1x play).
- **Kondisi Awal**: Belum ada fitur pemutar musik di aplikasi. File audio `soundkkn.mp3` berada di root direktori dan tidak dapat diakses client web secara publik.
- **File yang Diubah / Dibuat**:
  - `public/soundkkn.mp3` (Menyalin dari root proyek)
  - [KKNSoundPlayer.tsx](file:///C:/Users/Administrator/Documents/GitHub/absensiunesv2/src/components/KKNSoundPlayer.tsx) (Baru - Komponen pemutar audio kondisional)
  - [App.tsx](file:///C:/Users/Administrator/Documents/GitHub/absensiunesv2/src/App.tsx) (Mengimpor dan merender komponen KKNSoundPlayer di dalam BrowserRouter)
- **Perubahan yang Dilakukan**:
  - **Penyalinan Aset**: Menyalin file `soundkkn.mp3` ke folder `public/` agar dapat diakses web client.
  - **Komponen Suara KKN**:
    - Musik dimainkan 1 kali saja secara sekuensial (`loop = false`) dan jika sudah selesai (`ended`), musik tidak akan diputar lagi di sesi tersebut.
    - Musik hanya aktif di halaman Home (`/`), Riwayat (`/history`), dan Profil (`/profile`). Pindah ke rute lain akan menjeda (*pause*) musik.
    - Sasaran pengguna: Akun role `mahasiswa`, dosen `is_dpl_kkn = true`, serta akun khusus: `sufyarma.marsidin`, `h.agussalim` (Agus Salim), `dian.wahyuni.dewi.fitri` (Dian Wahyoni), `henny.puspita.sari` (Henny Puspita), `tesx`, `dewirman.prima.putra` (Dewirman Prima), `susi.delmiati` (Susi Delmiati), `jusmita.weriza` (Jusmita Weriza), `takdir.mattaliti` (Takdir Mattaliti), `andi.syahrum.makkurade` (Andi Syahrum), dan `suparman` (Suparman).
    - Menyiasati kebijakan autoplay browser dengan mendengarkan klik pertama di mana saja pada window untuk memicu play pertama kali.
    - Membuat widget melayang melingkar di pojok kanan bawah bertema maroon-emas UNES yang cantik dan interaktif dengan ikon piringan berputar smooth sebagai pengontrol mute/unmute.
- **Verifikasi**:
  - Menjalankan `pnpm build` untuk memverifikasi kesuksesan kompilasi program.

## 2026-07-16 - Impor Tambahan Akun Mahasiswa KKN BINTANG MAHA PUTRA

- **Tujuan**: Mendaftarkan 1 data akun tambahan mahasiswa KKN ke database Supabase dengan role `mahasiswa` and password default `'12345678'`.
- **Kondisi Awal**: Akun mahasiswa KKN atas nama BINTANG MAHA PUTRA belum terdaftar di database.
- **Database yang Diubah**: `public.users` dan `public.user_passwords`
- **Perubahan yang Dilakukan**:
  - Mendaftarkan mahasiswa baru: BINTANG MAHA PUTRA (BP: `2310003600359`).
  - Melakukan insert transaksi SQL (atomic CTE query) untuk mendaftarkan mahasiswa tersebut ke dalam tabel `users` (dengan `unit_kerja = 'Gedung A (Auditorium)'`, `primary_location = 'Gedung A Universitas Ekasakti'`, role `'mahasiswa'`, dan password default `'12345678'` yang di-hash dengan bcrypt `extensions.crypt` di kolom `password_hash`) serta tabel `user_passwords` (untuk plain text password distribution).
- **Verifikasi**:
  - Melakukan kueri validasi live database dan mengonfirmasi data berhasil masuk di kedua tabel (`users` dan `user_passwords`) dengan relasi UUID dan data yang valid 100%.
  - Total mahasiswa terdaftar setelah penambahan bertambah 1 akun.
- **Langkah Selanjutnya**:
  - Menginfokan ke Ipan bahwa akun BINTANG MAHA PUTRA sudah aktif dan siap digunakan untuk absensi pembekalan KKN.

## 2026-07-16 - Implementasi Musik Mars UNES Dinamis untuk Dosen & Tendik Reguler

- **Tujuan**: Memisahkan musik latar belakang di halaman Home, History, dan Profile berdasarkan kategori pengguna (Tema KKN untuk mahasiswa/DPL/whitelist, dan Mars UNES untuk dosen/tendik reguler) tanpa perulangan (no-loop / 1x play).
- **File yang Diubah / Dibuat**:
  - `public/MARS-UNES-AAI.mp3` (Menyalin dari root proyek)
  - [KKNSoundPlayer.tsx](file:///C:/Users/Administrator/Documents/GitHub/absensiunesv2/src/components/KKNSoundPlayer.tsx) (Update - Penambahan logika lagu dinamis & tooltip dinamis)
- **Perubahan yang Dilakukan**:
  - **Penyalinan Aset**: Menyalin file `MARS-UNES-AAI.mp3` ke folder `public/` agar dapat diakses web client.
  - **Pemisahan Audio Dinamis**:
    - User Mahasiswa, DPL KKN, dan whitelist khusus (tambahan 10 panitia KKN: Yenitaroza, Aulya Bayu, Dewi Retno Sani, Andi Fazzar, Pandu Aji, Delsi, Bakhtiar, Andi L, Rival Ramdani, dan Rudiyansa) tetap memutar `/soundkkn.mp3` dengan tooltip `"KKN UNES - Rudiyansa P. S.Sos"`.
    - User Dosen, Pegawai (Tendik), Admin, dan Superadmin reguler di luar kriteria KKN akan memutar `/MARS-UNES-AAI.mp3` dengan tooltip `"Mars UNES AAI"`.
    - Aturan pemutaran tetap sama: 1x play per sesi (no loop), hanya di halaman Home, History, dan Profile, serta menjeda otomatis jika berpindah halaman.
- **Verifikasi**:
  - Menjalankan `pnpm build` untuk memverifikasi kesuksesan kompilasi program.

## 2026-07-17 - Menampilkan Tombol Absensi Pembekalan KKN untuk DPL KKN

- **Tujuan**: Menampilkan tombol/banner absensi pembekalan KKN untuk akun ber-role Dosen Pembimbing Lapangan KKN (`is_dpl_kkn = true`) di halaman utama (Home) pada H-1 pelaksanaan KKN, sambil tetap mempertahankan tombol absensi reguler.
- **Kondisi Awal**: Tombol absensi pembekalan KKN hanya muncul untuk pengguna dengan role `mahasiswa`. Akun DPL KKN hanya melihat tombol absensi reguler.
- **File yang Diubah**: [Index.tsx](file:///C:/Users/Administrator/Documents/GitHub/absensiunesv2/src/pages/Index.tsx)
- **Perubahan yang Dilakukan**:
  - Mengubah kondisi rendering Banner Absen Pembekalan KKN (`/attendance-kkn`) dari `currentUser?.role === 'mahasiswa'` menjadi `(currentUser?.role === 'mahasiswa' || currentUser?.is_dpl_kkn)`.
  - Hal ini menyebabkan DPL KKN melihat dua banner absensi secara bersamaan: Banner KKN di bagian atas dan Banner Absen Reguler (karena dosen ber-role selain mahasiswa tetap merender Banner Absen Reguler di bawahnya).
- **Verifikasi**:
  - Menjalankan build produksi via `pnpm build` dan berhasil sukses 100% tanpa kesalahan kompilasi.
- **Langkah Selanjutnya**:
  - Melaporkan pembaruan ini kepada Ipan dengan nada yang menenangkan dan ramah untuk meredakan kecemasannya.

## 2026-07-17 - Impor Tambahan 3 Akun Mahasiswa KKN Baru

- **Tujuan**: Mendaftarkan 3 data akun tambahan mahasiswa KKN ke database Supabase dengan role `mahasiswa` dan password default `'12345678'`.
- **Kondisi Awal**: Terdapat 866 akun mahasiswa KKN terdaftar di database, dan ada 3 mahasiswa tambahan baru yang perlu didaftarkan per tanggal 17 Juli 2026.
- **Database yang Diubah**: `public.users` dan `public.user_passwords`
- **Perubahan yang Dilakukan**:
  - Mendaftarkan 3 mahasiswa tambahan baru: FARHAN MEIDIANDA PRATAMAN, MUHAMMAD AZIZI, dan RESTU AMANDA MATONDANG.
  - Melakukan insert transaksi SQL (atomic CTE query) untuk mendaftarkan 3 mahasiswa tersebut ke dalam tabel `users` (dengan `unit_kerja = 'Gedung A (Auditorium)'`, `primary_location = 'Gedung A Universitas Ekasakti'`, role `'mahasiswa'`, dan password default `'12345678'` yang di-hash dengan bcrypt `extensions.crypt` di kolom `password_hash`) serta tabel `user_passwords` (untuk plain text password distribution).
- **Verifikasi**:
  - Melakukan kueri validasi live database dan mengonfirmasi data berhasil masuk di kedua tabel (`users` dan `user_passwords`) dengan relasi UUID dan data yang valid 100%.
  - Total mahasiswa terdaftar setelah penambahan bertambah 3 akun.
- **Langkah Selanjutnya**:
  - Menginfokan ke Ipan bahwa 3 akun tambahan baru tersebut sudah aktif dan siap digunakan untuk absensi pembekalan KKN.

## 2026-07-18 - Penyesuaian Halaman Riwayat (History) untuk Absensi Pembekalan KKN

- **Tujuan**: Menampilkan riwayat absensi pembekalan KKN bermodel Sesi dan status Alpa secara kondisional untuk akun mahasiswa dan DPL KKN, serta memisahkan opsi dropdown bulan KKN dari absensi reguler.
- **Kondisi Awal**: Halaman Riwayat (History) hanya menampilkan absensi reguler (Masuk/Pulang) bulanan untuk semua jenis akun. Belum ada visualisasi sesi pembekalan KKN (9 sesi) dan status Alpa.
- **File yang Diubah**: [History.tsx](file:///C:/Users/Administrator/Documents/GitHub/absensiunesv2/src/pages/History.tsx)
- **Perubahan yang Dilakukan**:
  - Menambahkan konstanta `KKN_SESSIONS` berisi daftar 9 sesi pembekalan KKN lengkap dengan koordinasi tanggal (`dateYMD`), waktu buka (`startHms`), dan waktu tutup (`endHms`).
  - Memodifikasi inisialisasi state `selectedMonth` agar otomatis mengarah ke `'kkn_juli'` (Juli (Pembekalan KKN)) khusus untuk pengguna ber-role `mahasiswa`.
  - Mengubah dropdown bulan agar menampilkan opsi kustom `"Juli (Pembekalan KKN)"` secara kondisional (untuk mahasiswa dan dosen DPL KKN).
  - Menambahkan helper `checkSessionStatus` untuk membandingkan waktu WIB saat ini dengan jam buka/tutup sesi secara presisi.
  - Menyesuaikan `loadAttendanceHistory` agar memetakan data absensi secara dinamis: jika belum absen dan waktu sesi belum dimulai, diset status `belum_mulai`. Jika sedang berlangsung diset `sedang_berlangsung` (Belum Absen). Jika waktu sesi sudah berakhir diset `alpa`.
  - Mengubah filter absensi dari "Masuk / Pulang" menjadi "Semua / Hadir / Alpa" jika berada dalam mode KKN, di mana filter "Hadir" hanya memuat yang status `hadir` dan filter "Alpa" hanya memuat yang status `alpa`.
  - Menyesuaikan rendering item riwayat agar sesi `"Belum Mulai"` berwarna abu-abu lembut, sesi `"Belum Absen"` berwarna kuning berdenyut (pulse), sesi `"Alpa"` berwarna merah, dan sesi `"Hadir"` berlabel tag `"Hadir"` dengan warna hijau emerald.
  - Menyesuaikan isi modal rincian (Dialog) untuk menampilkan nama sesi KKN dan role Mahasiswa KKN.
- **Verifikasi**:
  - Menjalankan build produksi via `pnpm build` dan berhasil sukses 100% tanpa kesalahan kompilasi.
- **Langkah Selanjutnya**:
  - Memantau pembukaan absen Sabtu Sesi 1 pada pukul 07:25 WIB nanti pagi.

## 2026-07-18 - Penyesuaian Jadwal Mulai KKN Sabtu Sesi 1 (Buka Lebih Awal)

- **Tujuan**: Membuka sesi absensi pembekalan KKN Sabtu Sesi 1 lebih awal 5 menit (dari semula 07:30 WIB menjadi 07:25 WIB) agar dapat diantisipasi dan diuji coba dengan baik.
- **Kondisi Awal**: Waktu buka KKN Sabtu Sesi 1 tercatat pukul 07:30 WIB di database (`kkn_sessions`) dan di-hardcode dengan jam tersebut pada file-file konfigurasi frontend.
- **Database & File yang Diubah**:
  - Database: Baris `start_time` diubah menjadi `07:25:00` pada record `Sabtu Sesi 1` di tabel `kkn_sessions`.
  - Frontend:
    - [History.tsx](file:///C:/Users/Administrator/Documents/GitHub/absensiunesv2/src/pages/History.tsx) (array `KKN_SESSIONS`)
    - [Index.tsx](file:///C:/Users/Administrator/Documents/GitHub/absensiunesv2/src/pages/Index.tsx) (array `KKN_INDIVIDUAL_SESSIONS`)
    - [LaporanKehadiranKKN.tsx](file:///C:/Users/Administrator/Documents/GitHub/absensiunesv2/src/pages/LaporanKehadiranKKN.tsx) (array `SESSIONS` & `KKN_INDIVIDUAL_SESSIONS`)
- **Perubahan yang Dilakukan**:
  - Mengubah kueri update SQL di database Supabase untuk menyesuaikan jam mulai.
  - Memperbarui label waktu teks, parameter `startTime`, dan string data YMD/Hms agar sejalan dengan perubahan jam mulai menjadi pukul `07:25` WIB.
- **Verifikasi**:
  - Menjalankan build produksi via `pnpm build` dan berhasil sukses 100% tanpa kesalahan kompilasi.
- **Langkah Selanjutnya**:
  - Menginfokan ke Ipan bahwa tombol dan statistik harian reguler untuk dosen DPL non-struktural sudah berhasil disembunyikan.

## 2026-07-18 - Kondisional Tampilan Beranda Dosen DPL Non-Struktural & Mahasiswa

- **Tujuan**: Menyesuaikan tampilan beranda (Home) agar dosen non-struktural yang ditunjuk sebagai DPL KKN hanya melihat tombol dan statistik KKN (menyembunyikan tombol dan statistik kantor bulanan reguler). Dosen struktural yang menjadi DPL KKN tetap mempertahankan 2 tombol dan 2 statistik secara lengkap. Mahasiswa juga hanya menampilkan menu dan statistik KKN.
- **Kondisi Awal**: Seluruh dosen DPL KKN (struktural maupun non-struktural) melihat 2 tombol absensi dan 2 kotak statistik kehadiran secara berurutan. Mahasiswa melihat statistik KKN di riwayat namun belum memiliki visualisasi statistik pembekalan KKN di dashboard.
- **File yang Diubah**: [Index.tsx](file:///C:/Users/Administrator/Documents/GitHub/absensiunesv2/src/pages/Index.tsx)
- **Perubahan yang Dilakukan**:
  - Menambahkan konstanta `isNonStrukturalDplKkn` untuk mendeteksi akun DPL KKN yang tidak memiliki status jabatan struktural (`currentUser?.is_dpl_kkn && !currentUser?.is_struktural`).
  - Menyesuaikan perenderan banner absensi reguler (`Absen Disini`) agar disembunyikan untuk mahasiswa dan akun dosen yang memenuhi syarat `isNonStrukturalDplKkn`.
  - Membungkus kontainer `"Informasi Kehadiran"` reguler agar disembunyikan untuk mahasiswa dan dosen non-struktural DPL KKN.
  - Memperbarui logic kalkulasi statistik `kknStats` agar berjalan secara paralel untuk role `mahasiswa` maupun `is_dpl_kkn`.
  - Mengubah conditional rendering statistik pembekalan KKN agar muncul untuk role `mahasiswa` maupun `is_dpl_kkn`.
- **Verifikasi**:
  - Menjalankan build produksi via `pnpm build` dan berhasil sukses 100% tanpa kesalahan kompilasi.
- **Langkah Selanjutnya**:
  - Melaporkan hasil penyesuaian selectedMonth default di halaman History dan layout beranda ini ke Ipan.

## 2026-07-18 - Kondisional Tampilan Beranda Dosen DPL Non-Struktural & Mahasiswa serta Default Dropdown Bulan History

- **Tujuan**: Menyesuaikan tampilan beranda (Home) agar dosen non-struktural yang ditunjuk sebagai DPL KKN hanya melihat tombol dan statistik KKN (menyembunyikan tombol dan statistik kantor bulanan reguler). Dosen struktural yang menjadi DPL KKN tetap mempertahankan 2 tombol dan 2 statistik secara lengkap. Mahasiswa juga hanya menampilkan menu dan statistik KKN. Serta mengatur inisialisasi dropdown bulan pada halaman History agar otomatis mengarah ke Juli (Pembekalan KKN) untuk mahasiswa dan dosen DPL non-struktural, sedangkan dosen struktural tetap mengarah ke Juli reguler biasa.
- **Kondisi Awal**: Seluruh dosen DPL KKN (struktural maupun non-struktural) melihat 2 tombol absensi dan 2 kotak statistik kehadiran secara berurutan. Mahasiswa melihat statistik KKN di riwayat namun belum memiliki visualisasi statistik pembekalan KKN di dashboard. Pilihan default dropdown bulan di History sebelumnya hanya mengecek role mahasiswa.
- **File yang Diubah**:
  - [Index.tsx](file:///C:/Users/Administrator/Documents/GitHub/absensiunesv2/src/pages/Index.tsx) (Dashboard stats & button rendering)
  - [History.tsx](file:///C:/Users/Administrator/Documents/GitHub/absensiunesv2/src/pages/History.tsx) (selectedMonth state initialization)
- **Perubahan yang Dilakukan**:
  - Menambahkan konstanta `isNonStrukturalDplKkn` untuk mendeteksi akun DPL KKN yang tidak memiliki status jabatan struktural (`currentUser?.is_dpl_kkn && !currentUser?.is_struktural`).
  - Menyesuaikan perenderan banner absensi reguler (`Absen Disini`) agar disembunyikan untuk mahasiswa dan akun dosen yang memenuhi syarat `isNonStrukturalDplKkn`.
  - Membungkus kontainer `"Informasi Kehadiran"` reguler agar disembunyikan untuk mahasiswa dan dosen non-struktural DPL KKN.
  - Memperbarui logic kalkulasi statistik `kknStats` agar berjalan secara paralel untuk role `mahasiswa` maupun `is_dpl_kkn`.
  - Mengubah conditional rendering statistik pembekalan KKN agar muncul untuk role `mahasiswa` maupun `is_dpl_kkn`.
  - Mengubah inisialisasi state `selectedMonth` di `History.tsx` agar mengembalikan `'kkn_juli'` untuk mahasiswa dan dosen non-struktural DPL KKN, serta bulan saat ini (Juli reguler) untuk dosen struktural dan admin.
- **Verifikasi**:
  - Menjalankan build produksi via `pnpm build` dan berhasil sukses 100% tanpa kesalahan kompilasi.
- **Langkah Selanjutnya**:
  - Menginfokan ke Ipan bahwa 18 orang panitia KKN sudah diset flag-nya di database dan kategori Panitia KKN 2026 sudah aktif di halaman laporan.

## 2026-07-18 - Penambahan Kategori Peserta Panitia KKN 2026 pada Laporan Kehadiran KKN

- **Tujuan**: Menambahkan kategori peserta baru "Panitia KKN 2026" di dropdown halaman laporan kehadiran KKN, serta memetakan 18 orang panitia ke dalam status flag `is_panitia_kkn` di database.
- **Kondisi Awal**: Laporan KKN hanya membagi peserta menjadi 2 kategori, yaitu Dosen Pembimbing Lapangan (DPL KKN) dan Mahasiswa KKN. Database belum memiliki kolom untuk menandai panitia KKN.
- **Database & File yang Diubah**:
  - Database: Menambahkan kolom `is_panitia_kkn` bertipe `boolean` di tabel `users`.
  - Frontend: [LaporanKehadiranKKN.tsx](file:///C:/Users/Administrator/Documents/GitHub/absensiunesv2/src/pages/LaporanKehadiranKKN.tsx) (ReportCategory types, `isUserInCategory` filter, categoryLabel, dropdown render, dan export filename mapping)
- **Perubahan yang Dilakukan**:
  - Melakukan update DDL database `ALTER TABLE users ADD COLUMN is_panitia_kkn BOOLEAN DEFAULT false;`.
  - Melakukan update DML untuk menyalakan flag `is_panitia_kkn = true` pada 18 username panitia (Dr. Andi Syahrum Makkurade, Bakhtiar, Andi L, Prof. Dr. Sufyarma Marsidin, Yenitaroza, Rival Ramdani, Delsi, Rudiyansa, Henny Puspita, Dr. Susi Yuliastanty, Andi Fazzar, Drs. Suparman, Dewi Retno Sani, Pandu Aji Putra, Prof. Dr. Agussalim M, Irfan Ananda Ismail, Dian Wahyuni, dan Aulya Bayu).
  - Menambahkan value `"panitia_kkn"` ke tipe `ReportCategory` dan dropdown seleksi laporan.
  - Memperbarui fungsi filter `isUserInCategory` agar memetakan panitia berdasarkan flag `is_panitia_kkn`.
  - Menyesuaikan penamaan file ekspor PDF agar menyematkan nama `Panitia_KKN` ketika opsi tersebut diekspor.
- **Verifikasi**:
  - Menjalankan build produksi via `pnpm build` dan berhasil sukses 100% tanpa kesalahan kompilasi.
- **Langkah Selanjutnya**:
  - Menginfokan ke Ipan bahwa tombol absensi pembekalan KKN dan statistik KKN sudah aktif untuk akun Panitia KKN di halaman beranda.

## 2026-07-18 - Integrasi Tombol & Statistik Pembekalan KKN untuk Akun Panitia di Beranda serta Auto-Sync Session

- **Tujuan**: Memastikan tombol absensi pembekalan KKN dan statistik KKN muncul di halaman beranda (Home) bagi akun dengan flag `is_panitia_kkn = true`. Serta melakukan sinkronisasi profile otomatis saat load halaman agar flag panitia baru langsung berefek di session localStorage tanpa harus logout manual.
- **Kondisi Awal**: Akun panitia belum dideklarasikan untuk dapat melihat tombol absensi pembekalan KKN dan statistik pembekalan KKN di beranda. Perubahan flag di database juga membutuhkan logout-login ulang agar session ter-update.
- **File yang Diubah**:
  - [auth.ts](file:///C:/Users/Administrator/Documents/GitHub/absensiunesv2/src/lib/auth.ts) (Tipe data `AuthUser` dan return login mapping)
  - [Index.tsx](file:///C:/Users/Administrator/Documents/GitHub/absensiunesv2/src/pages/Index.tsx) (Live user sync, button, and stats rendering conditional checks)
- **Perubahan yang Dilakukan**:
  - Menambahkan field `is_panitia_kkn` ke tipe `AuthUser` di file `auth.ts`.
  - Mengubah `currentUser` di `Index.tsx` menjadi React state reaktif (`useState(getCurrentUser())`).
  - Menambahkan logic sinkronisasi profil di `loadStats` yang mengambil kolom `is_dpl_kkn`, `is_struktural`, dan `is_panitia_kkn` langsung dari database `users` secara live. Jika data berbeda, data localStorage langsung di-update dan state reaktif di-update otomatis.
  - Memperbarui pengecekan `isNonStrukturalKknParticipant` agar turut mencakup panitia non-struktural (`(currentUser?.is_dpl_kkn || currentUser?.is_panitia_kkn) && !currentUser?.is_struktural`).
  - Menambahkan filter `is_panitia_kkn` di tombol absensi pembekalan KKN dan kotak statistik KKN beranda.
- **Verifikasi**:
  - Menjalankan build produksi via `pnpm build` dan berhasil sukses 100% tanpa kesalahan kompilasi.
- **Langkah Selanjutnya**:
  - Menginfokan ke Ipan bahwa tombol absensi reguler dan statistik bulanan sudah ditampilkan kembali secara utuh untuk seluruh panitia KKN di beranda.

## 2026-07-18 - Koreksi Tampilan Tombol Absen Reguler & Default Month History untuk Panitia KKN

- **Tujuan**: Mengoreksi aturan visual sehingga akun dengan flag `is_panitia_kkn = true` (dosen maupun tendik) tetap menampilkan tombol absen reguler harian kantor ("Absen Disini") dan Statistik Bulanan reguler di beranda, di samping tombol KKN. Serta mengembalikan inisialisasi dropdown bulan History agar mengarah ke bulan reguler saat ini (bukan default KKN) untuk panitia KKN yang non-struktural.
- **Kondisi Awal**: Akun panitia non-struktural (seperti `yenitaroza`) menyembunyikan tombol absen reguler harian kantor dan statistik bulanan kantornya karena disamakan dengan aturan DPL KKN non-struktural murni.
- **File yang Diubah**:
  - [Index.tsx](file:///C:/Users/Administrator/Documents/GitHub/absensiunesv2/src/pages/Index.tsx) (Kondisi rendering `isNonStrukturalDplKknOnly`)
  - [History.tsx](file:///C:/Users/Administrator/Documents/GitHub/absensiunesv2/src/pages/History.tsx) (Kondisi default selectedMonth `isNonStrukturalDplKknOnly`)
- **Perubahan yang Dilakukan**:
  - Mengubah variabel deteksi filter dari `isNonStrukturalKknParticipant` menjadi `isNonStrukturalDplKknOnly` (`currentUser?.is_dpl_kkn && !currentUser?.is_struktural && !currentUser?.is_panitia_kkn`).
  - Menerapkan variabel `isNonStrukturalDplKknOnly` untuk membatasi penyembunyian absen reguler dan statistik reguler di beranda agar hanya menyembunyikan bagi DPL KKN murni yang non-struktural.
  - Memperbarui logic inisialisasi `selectedMonth` di `History.tsx` agar panitia KKN non-struktural tidak otomatis diarahkan ke `'kkn_juli'` melainkan tetap ke bulan reguler aktif saat ini.
- **Verifikasi**:
  - Menjalankan build produksi via `pnpm build` dan berhasil sukses 100% tanpa kesalahan kompilasi.
- **Langkah Selanjutnya**:
  - Menginfokan ke Ipan bahwa jam kerja reguler tidak mempengaruhi absensi KKN, serta melaporkan update RPC database untuk membolehkan panitia absen KKN.

## 2026-07-18 - Verifikasi Independensi Absensi KKN & Pembaruan RPC submit_attendance_kkn untuk Panitia

- **Tujuan**: Memastikan absensi pembekalan KKN berjalan terpisah dari pengaturan jam kerja reguler (tabel `user_work_schedules`) di profil, serta menyesuaikan RPC `submit_attendance_kkn` di database agar mengizinkan akun panitia KKN (`is_panitia_kkn = true`) untuk melakukan submit absensi.
- **Kondisi Awal**: Absensi KKN di frontend berjalan terpisah dari reguler, namun di database RPC `submit_attendance_kkn` sebelumnya membatasi hanya untuk `mahasiswa` atau `is_dpl_kkn = true`, yang dapat mengakibatkan penolakan submit absensi bagi panitia KKN murni.
- **Database & File yang Diubah**:
  - Database: Memperbarui fungsi RPC `public.submit_attendance_kkn` untuk menyertakan filter `coalesce(v_user.is_panitia_kkn, false) = false` dalam pengecekan validasi role.
- **Perubahan yang Dilakukan**:
  - Memverifikasi bahwa file `AttendanceKKN.tsx` di frontend sama sekali tidak memanggil atau terikat dengan `user_work_schedules`.
  - Merilis pembaruan DDL `CREATE OR REPLACE FUNCTION public.submit_attendance_kkn` agar mengizinkan mahasiswa, DPL KKN, dan Panitia KKN.
- **Verifikasi**:
  - Database function ter-compile sukses di Supabase.
- **Langkah Selanjutnya**:
  - Melaporkan hasil pembersihan duplicate signature fungsi database ke Ipan.

## 2026-07-18 - Penghapusan Duplicate Signature submit_attendance_kkn di Database

- **Tujuan**: Mengatasi error "could not choose the best candidate function" saat memanggil RPC `submit_attendance_kkn` dari client.
- **Kondisi Awal**: Terdapat dua fungsi `submit_attendance_kkn` yang terdaftar di database (satu menggunakan parameter coordinate bertipe `double precision` dan satu menggunakan `numeric`). Hal ini membingungkan parser tipe data PostgreSQL saat dipanggil dari JS client.
- **Database yang Diubah**:
  - Database: Melakukan DROP pada fungsi lama yang bertipe parameter `numeric` (`DROP FUNCTION public.submit_attendance_kkn(uuid, text, text, numeric, numeric, text);`).
- **Perubahan yang Dilakukan**:
  - Menghapus total sisa-sisa signature fungsi bertipe `numeric` sehingga hanya menyisakan satu signature yang valid dan bersih (`double precision`).
- **Verifikasi**:
  - Query verifikasi `pg_proc` memastikan hanya tersisa satu signature fungsi yang aktif.
- **Langkah Selanjutnya**:
  - Melaporkan hasil pembaruan radius KKN Gedung A ini ke Ipan.

## 2026-07-18 - Pembaruan Radius Absensi KKN Gedung A Menjadi 150 Meter

- **Tujuan**: Memperbesar radius jangkauan absensi Gedung A (Auditorium) untuk KKN menjadi 150 meter di database dan frontend guna mengantisipasi deviasi akurasi GPS pada perangkat pengguna.
- **Kondisi Awal**: Radius Gedung A terdaftar sebesar 50 meter di database `attendance_locations` dan 75 meter di konstanta `KKN_TARGET_RADIUS` file `AttendanceKKN.tsx`.
- **Database & File yang Diubah**:
  - Database: Tabel `attendance_locations` (update `radius_meters`)
  - Frontend: [AttendanceKKN.tsx](file:///C:/Users/Administrator/Documents/GitHub/absensiunesv2/src/pages/AttendanceKKN.tsx) (update `KKN_TARGET_RADIUS`)
- **Perubahan yang Dilakukan**:
  - Menjalankan kueri SQL `UPDATE attendance_locations SET radius_meters = 150 WHERE location_name = 'Gedung A Universitas Ekasakti';` untuk memperbesar toleransi absensi reguler Gedung A.
  - Mengubah nilai konstanta `KKN_TARGET_RADIUS` di file `AttendanceKKN.tsx` dari `75` meter menjadi `150` meter untuk menyelaraskan absensi pembekalan KKN.
- **Verifikasi**:
  - Menjalankan build produksi via `pnpm build` dan berhasil sukses 100% tanpa kesalahan kompilasi.
- **Langkah Selanjutnya**:
  - Melaporkan hasil penambahan opsi Juli (Pembekalan KKN) di riwayat Panitia KKN ke Ipan.

## 2026-07-18 - Penambahan Opsi Juli (Pembekalan KKN) di Riwayat untuk Panitia KKN

- **Tujuan**: Memastikan akun dengan flag `is_panitia_kkn = true` dapat melihat dan memilih opsi "Juli (Pembekalan KKN)" pada dropdown bulan di halaman Riwayat (History).
- **Kondisi Awal**: Halaman Riwayat sebelumnya hanya menampilkan opsi "Juli (Pembekalan KKN)" untuk akun Mahasiswa dan DPL KKN saja. Akun Panitia KKN murni tidak dapat melihat opsi tersebut.
- **File yang Diubah**:
  - [History.tsx](file:///C:/Users/Administrator/Documents/GitHub/absensiunesv2/src/pages/History.tsx) (getMonthOptions)
- **Perubahan yang Dilakukan**:
  - Memperbarui fungsi `getMonthOptions` di file `History.tsx` agar mengizinkan akun DPL KKN OR Panitia KKN (`currentUser?.is_dpl_kkn || currentUser?.is_panitia_kkn`) untuk melihat opsi dropdown `Juli (Pembekalan KKN)`.
- **Verifikasi**:
  - Menjalankan build produksi via `pnpm build` dan berhasil sukses 100% tanpa kesalahan kompilasi.
- **Langkah Selanjutnya**:
  - Melaporkan hasil penghapusan data absensi Helny Lalan ke Ipan.

## 2026-07-18 - Penghapusan Absensi KKN Helny Lalan (Sabtu Sesi 1)

- **Tujuan**: Menghapus data absensi KKN spesifik milik Helny Lalan pada Sabtu Sesi 1 atas permintaan user.
- **Kondisi Awal**: Terdapat record absensi KKN Sabtu Sesi 1 untuk Helny Lalan (`id: e9bc5df3-0b3a-4e87-9703-bb730fb593f2`) tertanggal 18 Juli 2026 jam 07:30:36 WIB.
- **Database yang Diubah**:
  - Database: Tabel `attendances` (DELETE record by ID)
- **Perubahan yang Dilakukan**:
  - Menjalankan kueri SQL `DELETE FROM attendances WHERE id = 'e9bc5df3-0b3a-4e87-9703-bb730fb593f2';` untuk menghapus data absensi terkait secara permanen dan aman.
- **Verifikasi**:
  - Melakukan SELECT by ID pasca-penghapusan dan memastikan datanya sudah kosong (`[]`).
- **Langkah Selanjutnya**:
  - Melaporkan hasil instalasi non-blocking Telegram handler ke Ipan.

## 2026-07-18 - Pengenalan Non-Blocking Telegram Handlers pada Absensi Reguler & KKN

- **Tujuan**: Mencegah kegagalan absensi (baik reguler maupun KKN) akibat limitasi rate limit Telegram (HTTP 429 Too Many Requests) ketika volume absensi serentak sedang sangat tinggi.
- **Kondisi Awal**: Kegagalan pengiriman data/foto bukti ke Telegram API (misal karena rate limit 429) akan melempar exception di frontend dan menggagalkan seluruh transaksi absensi di database, memaksa pengguna melihat pesan error "Upload Gagal".
- **File yang Diubah**:
  - [AttendanceKKN.tsx](file:///C:/Users/Administrator/Documents/GitHub/absensiunesv2/src/pages/AttendanceKKN.tsx) (handleCapture try-catch update)
  - [Attendance.tsx](file:///C:/Users/Administrator/Documents/GitHub/absensiunesv2/src/pages/Attendance.tsx) (handleCapture try-catch update)
- **Perubahan yang Dilakukan**:
  - Membungkus pemanggilan `uploadToTelegram` (di `AttendanceKKN.tsx`) dan `uploadAttendanceEvidenceToTelegram` (di `Attendance.tsx`) dengan try-catch block independen.
  - Jika Telegram API melempar error rate limit atau responsnya tidak valid, client akan mencatat warning di console dan secara otomatis menggunakan fallback `photoUrl` bertipe `"telegram:file:rate_limited_..."` agar **tetap dapat memproses insert database** Supabase.
  - Menghapus pemblokiran return error di frontend, sehingga kegagalan Telegram tidak lagi membatalkan absensi di database.
- **Verifikasi**:
  - Menjalankan build produksi via `pnpm build` dan berhasil sukses 100% tanpa kesalahan kompilasi.
- **Langkah Selanjutnya**:
  - Melaporkan hasil penanganan network error (Failed to fetch) dengan retry mechanism ke Ipan.

## 2026-07-18 - Implementasi Retry Mechanism (supabaseRpcWithRetry) untuk Mengatasi Failed to Fetch

- **Tujuan**: Mencegah kegagalan absensi akibat gangguan koneksi internet atau rate limiting Supabase (HTTP 429 yang dideteksi browser sebagai network error/cors error "Failed to fetch").
- **Kondisi Awal**: Jika koneksi ke API REST Supabase terganggu sesaat saat memanggil `supabase.rpc`, browser akan melempar exception "Failed to fetch" yang digagalkan langsung di frontend.
- **File yang Diubah**:
  - [AttendanceKKN.tsx](file:///C:/Users/Administrator/Documents/GitHub/absensiunesv2/src/pages/AttendanceKKN.tsx) (Penambahan `supabaseRpcWithRetry` helper & pemanggilan `submit_attendance_kkn`)
  - [Attendance.tsx](file:///C:/Users/Administrator/Documents/GitHub/absensiunesv2/src/pages/Attendance.tsx) (Penambahan `supabaseRpcWithRetry` helper & pemanggilan `submit_attendance_server_time`)
- **Perubahan yang Dilakukan**:
  - Membuat fungsi helper `supabaseRpcWithRetry` yang otomatis mengulang (retry) panggilan RPC database sebanyak 3 kali dengan jeda waktu 1,5 detik jika terjadi error yang mengandung kata "fetch", "network", atau "load failed".
  - Menerapkan helper tersebut di alur submit absensi KKN dan absensi reguler.
- **Verifikasi**:
  - Menjalankan build produksi via `pnpm build` dan berhasil sukses 100% tanpa kesalahan kompilasi.
- **Langkah Selanjutnya**:
  - Melaporkan hasil penambahan tombol Unduh Laporan Teks KKN ke Ipan.

## 2026-07-18 - Penambahan Tombol Unduh Laporan Teks pada Laporan Kehadiran KKN

- **Tujuan**: Menyediakan opsi ekspor laporan KKN versi PDF teks murni (tanpa memproses/mendownload gambar foto selfie) untuk mempercepat proses ekspor dan menghemat penggunaan kertas laporan.
- **File yang Diubah**:
  - [LaporanKehadiranKKN.tsx](file:///C:/Users/Administrator/Documents/GitHub/absensiunesv2/src/pages/LaporanKehadiranKKN.tsx)
- **Perubahan yang Dilakukan**:
  - Menambahkan parameter `isTextOnly` pada fungsi pembangun PDF `buildAllUsersPdfDoc`.
  - Jika `isTextOnly` bernilai `true`:
    - Mengabaikan (bypass) pengisian array `photoTasks` sepenuhnya (tidak memanggil API Telegram untuk mendownload gambar).
    - Mengubah tinggi baris tabel `rowH` dari `115` pt menjadi `30` pt, serta meningkatkan jumlah baris per halaman `usersPerPage` dari `3` menjadi `15` orang untuk efisiensi ruang kertas landscape.
    - Pada fungsi `didDrawCell`, alih-alih merender kotak gambar 2.5cm, sistem cukup mencetak teks status `"Hadir (Jam:menit WIB)"`, `"Alpha"`, atau `"Izin: [Jenis]"` di tengah sel.
  - Memperbarui fungsi `handleExport` untuk memisahkan state loading (`exportingText`), menambahkan parameter `isTextOnly`, dan menambahkan suffix `_Teks` pada file PDF hasil unduhan.
  - Menambahkan import `FileText` dari `lucide-react` dan memperbarui tampilan tombol ekspor menjadi format dua kolom flexbox berdampingan: "Unduh PDF Laporan" (Merah maroon/bawaan foto) dan "Unduh Laporan Teks" (Emas kuning/teks saja).
- **Verifikasi**:
  - Menjalankan build produksi via `pnpm build` dan berhasil sukses 100% tanpa kesalahan kompilasi.
- **Langkah Selanjutnya**:
  - Melaporkan hasil penyesuaian PDF laporan teks KKN sesuai contoh ke Ipan.

## 2026-07-18 - Penyesuaian PDF Laporan Teks KKN Mengikuti Format Bulanan (contohlaporanteks.pdf)

- **Tujuan**: Menyelaraskan struktur dan desain PDF laporan teks KKN agar memiliki layout grid bulanan Juli (tanggal 1 s.d 31), garis pembatas kop ganda, baris ganda Masuk/Pulang per user, serta tabel statistik keterangan di kolom kanan, persis sama dengan `contohlaporanteks.pdf`.
- **File yang Diubah**:
  - [LaporanKehadiranKKN.tsx](file:///C:/Users/Administrator/Documents/GitHub/absensiunesv2/src/pages/LaporanKehadiranKKN.tsx)
- **Perubahan yang Dilakukan**:
  - Mengubah penanganan `isTextOnly === true` pada `handleExport` untuk memanggil generator PDF `@/lib/pdf-generator` (`generateKondisiStatistikPDF`) secara langsung.
  - Memetakan daftar `usersInScope` ke format `KondisiStatistikUser` dengan property `is_struktural` dinamis.
  - Memfilter data `attendances` agar hanya meloloskan absensi KKN yang cocok dengan sesi KKN (`findMatchedSession(a.created_at, a.note) !== null`).
  - Mengirimkan setelan parameter `monthOptions` untuk bulan Juli 2026 (tanggal 1 s.d 31, holiday dates, dan leaveByUser dari `leaveDatesByUser`).
  - Mengembalikan isi fungsi `buildAllUsersPdfDoc` ke status default-nya (hanya untuk PDF foto landscape bawaan) untuk menjaga kebersihan kode.
- **Verifikasi**:
  - Menjalankan build produksi via `pnpm build` dan berhasil sukses 100% tanpa kesalahan kompilasi.
- **Langkah Selanjutnya**:
  - Melaporkan hasil kustomisasi kolom sesi KKN pada laporan PDF teks ke Ipan.

## 2026-07-18 - Kustomisasi Kolom Sesi KKN pada Laporan PDF Teks (buildAllUsersTextPdfDoc)

- **Tujuan**: Menyelaraskan PDF laporan teks KKN agar header kolomnya memuat Sesi KKN yang aktif (bukan tanggal 1-31 Juli) dengan baris ganda Masuk/Pulang per sesi, serta keterangan statistik di kanan memuat Total Sesi, Total Hadir, dan Total Alpa.
- **File yang Diubah**:
  - [LaporanKehadiranKKN.tsx](file:///C:/Users/Administrator/Documents/GitHub/absensiunesv2/src/pages/LaporanKehadiranKKN.tsx)
- **Perubahan yang Dilakukan**:
  - Membuat fungsi pembangun PDF teks KKN kustom bernama `buildAllUsersTextPdfDoc` untuk menghindari modifikasi file generator global (`pdf-generator.ts`) agar tidak terjadi regresi pada absensi reguler.
  - PDF dirancang landscape Legal dengan kop surat resmi Universitas Ekasakti lengkap dengan garis pembatas ganda dan logo UNES.
  - Mengatur header tabel `autoTable` menjadi dua baris:
    - Baris 1: `No`, `Nama`, `Unit Kerja / Jabatan`, `Sesi KKN` (colspan), `Keterangan`.
    - Baris 2: Sub-kolom berisi nama sesi, hari/tanggal, dan jam (misal: `Sesi 1\nSabtu 18/07/2026\n(07:25-08:00)`).
  - Setiap sel sesi diisi status baris atas (Masuk) dan baris bawah (Pulang) berupa `V\nX`, `X\nV`, `X\nX`, atau `I\nI` menggunakan pemisahan newline (`\n`).
  - Kolom Keterangan di kanan memuat statistik: `Total Sesi`, `Total Hadir`, dan `Total Alpa` (serta `Total Izin` jika ada).
  - Footer halaman memuat keterangan simbol absensi di kiri bawah dan tanggal cetak di kanan bawah.
  - Memperbarui fungsi `handleExport` untuk memanggil `buildAllUsersTextPdfDoc()` saat `isTextOnly === true`.
- **Verifikasi**:
  - Menjalankan build produksi via `pnpm build` dan berhasil sukses 100% tanpa kesalahan kompilasi.
- **Langkah Selanjutnya**:
  - Melaporkan ke Ipan bahwa PDF Laporan Teks KKN sudah menggunakan baris tunggal per pegawai dengan legenda V/X yang sederhana.

## 2026-07-18 - Penyederhanaan PDF Laporan Teks KKN (Baris Tunggal & Legenda V/X)

- **Tujuan**: Memenuhi keinginan pengguna untuk menyederhanakan laporan PDF teks KKN dengan menghilangkan pemecahan baris masuk/pulang (menjadi baris tunggal biasa per pegawai), mengisi tanda `V` jika hadir di sesi tersebut, mengisi `X` jika tidak hadir, dan hanya menyisakan legenda `V = Hadir, X = Tidak Hadir` di footer.
- **File yang Diubah**:
  - [LaporanKehadiranKKN.tsx](file:///C:/Users/Administrator/Documents/GitHub/absensiunesv2/src/pages/LaporanKehadiranKKN.tsx)
- **Perubahan yang Dilakukan**:
  - Mengubah row height tabel `rowH` dari `34` pt menjadi `24` pt (karena baris tunggal) dan menaikkan batas `usersPerPage` dari `9` menjadi `15` orang untuk hemat halaman.
  - Memodifikasi mapping data sel sesi agar hanya mengembalikan `"V"` jika ada absensi sesi, `"X"` jika alpa, dan `"-"` jika sesi belum dimulai.
  - Menghapus logika dan legenda terkait izin, cuti, dan dinas luar.
  - Memperbarui keterangan footer di kiri bawah menjadi `"Keterangan: V = Hadir, X = Tidak Hadir"`.
- **Verifikasi**:
  - Menjalankan build produksi via `pnpm build` dan berhasil sukses 100% tanpa kesalahan kompilasi.
- **Langkah Selanjutnya**:
  - Melaporkan ke Ipan bahwa PDF Laporan Teks KKN sudah dinamis tanpa kolom Unit Kerja dan menampilkan nama sesi dengan benar.

## 2026-07-18 - Penghapusan Kolom Unit Kerja & Perbaikan Nama Sesi KKN di PDF Laporan Teks

- **Tujuan**: Menghapus kolom "Unit Kerja / Jabatan" dari PDF laporan teks KKN sesuai permintaan pengguna, serta memperbaiki output label kolom sesi yang sebelumnya menampilkan "undefined" karena properti object yang tidak cocok.
- **File yang Diubah**:
  - [LaporanKehadiranKKN.tsx](file:///C:/Users/Administrator/Documents/GitHub/absensiunesv2/src/pages/LaporanKehadiranKKN.tsx)
- **Perubahan yang Dilakukan**:
  - Menghapus kolom "Unit Kerja / Jabatan" dari struktur tabel `head` dan data mapping `body` di fungsi `buildAllUsersTextPdfDoc`.
  - Menyesuaikan lebar kolom: kolom Nama diperlebar menjadi `220` pt agar nama lengkap mahasiswa/DPL tidak terpotong, sisa lebar didistribusikan secara proporsional ke kolom-kolom sesi.
  - Memperbaiki penulisan nama sesi dinamis dengan memetakan `s.index` (misal: `index 1-3` → `Sesi 1-3`, `index 4-8` → `Sesi 1-5` hari Minggu, dan `index 9` → `Pelepasan KKN`) agar tidak memunculkan kata `undefined` pada header kolom.
- **Verifikasi**:
  - Menjalankan build produksi via `pnpm build` dan berhasil sukses 100% tanpa kesalahan kompilasi.
- **Verifikasi**:
  - Menjalankan build produksi via `pnpm build` dan berhasil sukses 100% tanpa kesalahan kompilasi.
- **Langkah Selanjutnya**:
  - Melaporkan ke Ipan bahwa absensi reguler dan KKN sudah dipisah secara penuh sehingga tidak terjadi tabrakan status absen.

## 2026-07-18 - Pemisahan Penuh Absensi Reguler & Absensi KKN (Bug Fix Double Submit)

- **Tujuan**: Memperbaiki masalah di mana absensi KKN (seperti Sesi 3) dianggap oleh sistem absensi reguler kantor sebagai absensi reguler hari ini, sehingga mengunci tombol absen pulang reguler bagi akun panitia KKN / DPL.
- **File & Database yang Diubah**:
  - Database RPC: `public.submit_attendance_server_time`
  - Frontend: [Attendance.tsx](file:///C:/Users/Administrator/Documents/GitHub/absensiunesv2/src/pages/Attendance.tsx)
- **Perubahan yang Dilakukan**:
  - **Database (RPC)**: Memperbarui fungsi `submit_attendance_server_time` agar ketika mengecek data kehadiran hari ini, mengecualikan record absensi KKN (`and (a.note is null or a.note not like '%[Sesi:%')`).
  - **Frontend (Inisialisasi)**: Memperbarui `checkTodayAttendance` di [Attendance.tsx](file:///C:/Users/Administrator/Documents/GitHub/absensiunesv2/src/pages/Attendance.tsx) agar menyeleksi kolom `note` dan mem-filter keluar record yang memiliki note `[Sesi:`.
  - **Frontend (Pre-Submit Validation)**: Memperbarui pengecekan duplikat sebelum submit di [Attendance.tsx](file:///C:/Users/Administrator/Documents/GitHub/absensiunesv2/src/pages/Attendance.tsx) agar tidak memblokir submit absensi reguler jika record yang ditemukan adalah absensi KKN.
- **Verifikasi**:
  - SQL function dideploy dan diupdate sukses di server `DBAbsensiUNES`.
  - Menjalankan build produksi via `pnpm build` dan berhasil sukses 100% tanpa kesalahan kompilasi.
- **Verifikasi**:
  - SQL function dideploy dan diupdate sukses di server `DBAbsensiUNES`.
  - Menjalankan build produksi via `pnpm build` dan berhasil sukses 100% tanpa kesalahan kompilasi.
- **Langkah Selanjutnya**:
  - Melaporkan hasil perbaikan bug ke Ipan.

## 2026-07-18 - Pembuatan Akun Mahasiswa KKN Baru (Hadiman)

- **Tujuan**: Menambahkan akun mahasiswa baru KKN Universitas Ekasakti atas nama HADIMAN ke database absensi utama agar yang bersangkutan dapat melakukan presensi pembekalan.
- **Database yang Diubah**:
  - Tabel: `public.users` dan `public.user_passwords`
- **Perubahan yang Dilakukan**:
  - Memasukkan data user `HADIMAN` dengan program studi/unit kerja `Gedung A (Auditorium)` dan lokasi utama `Gedung A Universitas Ekasakti`.
  - Mengeset password default ke `'12345678'` yang di-hash dengan bcrypt (`extensions.crypt`).
  - Mencatat plaintext password `'12345678'` ke tabel `public.user_passwords` untuk kebutuhan distribusi/rekap admin.
- **Verifikasi**:
  - Melakukan verifikasi data live dan mengonfirmasi baris data baru Hadiman dengan BP `2210003301016` berhasil masuk wkwkwk.
- **Verifikasi**:
  - Melakukan verifikasi data live dan mengonfirmasi baris data baru Hadiman dengan BP `2210003301016` berhasil masuk wkwkwk.
- **Langkah Selanjutnya**:
  - Melaporkan hasil perubahan radius Gedung A ke Ipan.

## 2026-07-19 - Penyesuaian Radius Geofencing Gedung A KKN Menjadi 75 Meter

- **Tujuan**: Menurunkan radius batas geofencing KKN di Gedung A (Auditorium) dari yang sebelumnya 150 meter menjadi 75 meter sesuai instruksi terbaru.
- **Database yang Diubah**:
  - Tabel: `public.attendance_locations` dan `public.campus_buildings`
- **Perubahan yang Dilakukan**:
  - Mengupdate seluruh baris lokasi yang bernama `'Gedung A Universitas Ekasakti'` di tabel `attendance_locations` agar memiliki `radius_meters = 75`.
  - Mengupdate gedung rekapitulasi `'gedung-a'` di tabel `campus_buildings` agar memiliki `radius_meters = 75` untuk menyinkronkan status radius.
- **Verifikasi**:
  - Melakukan kueri live database dan memverifikasi seluruh record radius Gedung A sudah berubah ke `75` meter wkwkwk.
- **Verifikasi**:
  - Melakukan kueri live database dan memverifikasi seluruh record radius Gedung A sudah berubah ke `75` meter wkwkwk.
- **Langkah Selanjutnya**:
  - Mengembalikan radius Gedung A ke 150 meter atas permintaan Ipan.

## 2026-07-19 - Pengembalian Radius Geofencing Gedung A KKN Menjadi 150 Meter

- **Tujuan**: Mengembalikan radius batas geofencing KKN di Gedung A (Auditorium) ke 150 meter sesuai instruksi terbaru agar mahasiswa tidak kesulitan karena radius yang terlalu sempit.
- **Database yang Diubah**:
  - Tabel: `public.attendance_locations` dan `public.campus_buildings`
- **Perubahan yang Dilakukan**:
  - Mengupdate seluruh baris lokasi yang bernama `'Gedung A Universitas Ekasakti'` di tabel `attendance_locations` agar memiliki `radius_meters = 150`.
  - Mengupdate gedung rekapitulasi `'gedung-a'` di tabel `campus_buildings` agar memiliki `radius_meters = 150`.
- **Verifikasi**:
  - Melakukan kueri live database dan memverifikasi seluruh record radius Gedung A sudah kembali ke `150` meter secara merata wkwkwk.
- **Verifikasi**:
  - Melakukan kueri live database dan memverifikasi seluruh record radius Gedung A sudah kembali ke `150` meter secara merata wkwkwk.
- **Langkah Selanjutnya**:
  - Melaporkan hasil ke Ipan.

## 2026-07-19 - Normalisasi Radius Gedung A & Pemblokiran Login Akun Mahasiswa

- **Tujuan**: Mengembalikan radius geofencing Gedung A (Auditorium) ke standar 50 meter pasca pembekalan KKN selesai, serta menutup akses login bagi seluruh akun yang memiliki role `mahasiswa`.
- **File & Database yang Diubah**:
  - Database: Tabel `public.attendance_locations` dan `public.campus_buildings`
  - Frontend: [Login.tsx](file:///C:/Users/Administrator/Documents/GitHub/absensiunesv2/src/pages/Login.tsx)
- **Perubahan yang Dilakukan**:
  - **Database**: Mengupdate `radius_meters = 50` untuk seluruh entri master gedung `'gedung-a'` dan lokasi user `'Gedung A Universitas Ekasakti'`.
  - **Frontend**: Membuat component `MahasiswaBlockedNotificationToast` di [Login.tsx](file:///C:/Users/Administrator/Documents/GitHub/absensiunesv2/src/pages/Login.tsx).
  - **Frontend**: Menambahkan kondisi pada alur `handleSubmit` login agar mendeteksi jika `user.role === 'mahasiswa'`. Jika benar, login digagalkan dan menampilkan pesan: *"Maaf, absensi saat ini hanya untuk dosen struktural dan tenaga kependidikan UNES."*
- **Verifikasi**:
  - Database ter-update sukses ke 50m.
  - Menjalankan build produksi via `pnpm build` dan berhasil sukses 100% tanpa kesalahan kompilasi.
- **Verifikasi**:
  - Database ter-update sukses ke 50m.
  - Menjalankan build produksi via `pnpm build` dan berhasil sukses 100% tanpa kesalahan kompilasi.
- **Langkah Selanjutnya**:
  - Menyembunyikan menu/tombol absensi KKN di dashboard, menyembunyikan riwayat pembekalan KKN di filter History, serta menormalisasikan musik latar belakang seluruh akun ke Mars UNES.

## 2026-07-19 - Penyembunyian Menu KKN & Normalisasi Musik Latar Belakang Mars UNES

- **Tujuan**: Menyembunyikan seluruh tombol absensi KKN di menu utama, menyembunyikan riwayat pembekalan KKN di halaman History secara temporer sebelum pelepasan KKN (29 Juli), serta menormalisasikan musik audio latar belakang menjadi Mars UNES untuk seluruh akun.
- **File yang Diubah**:
  - [KKNSoundPlayer.tsx](file:///C:/Users/Administrator/Documents/GitHub/absensiunesv2/src/components/KKNSoundPlayer.tsx)
  - [Index.tsx](file:///C:/Users/Administrator/Documents/GitHub/absensiunesv2/src/pages/Index.tsx)
  - [History.tsx](file:///C:/Users/Administrator/Documents/GitHub/absensiunesv2/src/pages/History.tsx)
- **Perubahan yang Dilakukan**:
  - **Musik Latar Belakang**: Memodifikasi [KKNSoundPlayer.tsx](file:///C:/Users/Administrator/Documents/GitHub/absensiunesv2/src/components/KKNSoundPlayer.tsx) agar memutar file `/MARS-UNES-AAI.mp3` untuk seluruh akun (termasuk mahasiswa & DPL KKN) dan menonaktifkan musik KKN.
  - **Tombol Absensi KKN**: Menyisipkan flag `false &&` pada render banner/tombol "Absen Pembekalan KKN" di [Index.tsx](file:///C:/Users/Administrator/Documents/GitHub/absensiunesv2/src/pages/Index.tsx) agar tersembunyi dari seluruh akun.
  - **Riwayat History**: Menyisipkan flag `showKknJuli = false` pada filter inisialisasi default dan opsi drop-down bulan di [History.tsx](file:///C:/Users/Administrator/Documents/GitHub/absensiunesv2/src/pages/History.tsx) agar riwayat KKN Juli (Pembekalan) disembunyikan sementara.
- **Verifikasi**:
  - Menjalankan build produksi via `pnpm build` dan berhasil sukses 100% tanpa kesalahan kompilasi.
- **Verifikasi**:
  - Menjalankan build produksi via `pnpm build` dan berhasil sukses 100% tanpa kesalahan kompilasi.
- **Langkah Selanjutnya**:
  - Melakukan rename komponen KKNSoundPlayer menjadi SoundPlayer.

## 2026-07-19 - Perubahan Nama Komponen (Rename KKNSoundPlayer.tsx ke SoundPlayer.tsx)

- **Tujuan**: Merapikan struktur penamaan file komponen pemutar audio dari yang sebelumnya bernama `KKNSoundPlayer.tsx` menjadi `SoundPlayer.tsx` untuk kemudahan pemeliharaan jangka panjang.
- **File yang Diubah / Dihapus / Dibuat**:
  - Dibuat: [SoundPlayer.tsx](file:///C:/Users/Administrator/Documents/GitHub/absensiunesv2/src/components/SoundPlayer.tsx) (menyalin fungsionalitas dengan nama fungsi `SoundPlayer`).
  - Dihapus: `src/components/KKNSoundPlayer.tsx`
  - Diubah: [App.tsx](file:///C:/Users/Administrator/Documents/GitHub/absensiunesv2/src/App.tsx) (memperbarui import & deklarasi JSX).
- **Perubahan yang Dilakukan**:
  - Memindahkan seluruh isi fungsi pemutar musik ke [SoundPlayer.tsx](file:///C:/Users/Administrator/Documents/GitHub/absensiunesv2/src/components/SoundPlayer.tsx) dan mengganti nama default export-nya menjadi `SoundPlayer`.
  - Menghapus berkas fisik lama `KKNSoundPlayer.tsx` menggunakan PowerShell command.
  - Memperbarui import di [App.tsx](file:///C:/Users/Administrator/Documents/GitHub/absensiunesv2/src/App.tsx) agar mengarah secara presisi ke `./components/SoundPlayer` dan me-render `<SoundPlayer />`.
- **Verifikasi**:
  - Menjalankan build produksi via `pnpm build` dan berhasil sukses 100% tanpa kesalahan kompilasi.
- **Verifikasi**:
  - Menjalankan build produksi via `pnpm build` dan berhasil sukses 100% tanpa kesalahan kompilasi.
- **Langkah Selanjutnya**:
  - Menyembunyikan widget Informasi Kehadiran pembekalan KKN dan Statistik Bulanan KKN di dashboard.

## 2026-07-19 - Penyembunyian Widget Informasi Kehadiran Pembekalan KKN di Home

- **Tujuan**: Menyembunyikan box widget "Informasi Kehadiran pembekalan KKN" dan sub-label "Statistik Bulanan" KKN dari halaman utama/dashboard untuk seluruh pengguna agar tampilan steril kembali ke absensi reguler.
- **File yang Diubah**:
  - [Index.tsx](file:///C:/Users/Administrator/Documents/GitHub/absensiunesv2/src/pages/Index.tsx)
- **Perubahan yang Dilakukan**:
  - Menyisipkan flag `false &&` pada block element conditional rendering `"Informasi Kehadiran pembekalan KKN"` di baris 1131 [Index.tsx](file:///C:/Users/Administrator/Documents/GitHub/absensiunesv2/src/pages/Index.tsx) agar tersembunyi.
  - Penyesuaian ini bersifat sementara dan dapat dikembalikan dengan mudah (restore) menjelang pelepasan KKN (29 Juli) dengan merubah `false` menjadi `true`.
- **Verifikasi**:
  - Menjalankan build produksi via `pnpm build` dan berhasil sukses 100% tanpa kesalahan kompilasi.
- **Verifikasi**:
  - Menjalankan build produksi via `pnpm build` dan berhasil sukses 100% tanpa kesalahan kompilasi.
- **Langkah Selanjutnya**:
  - Memblokir login bagi dosen DPL KKN non-struktural di login page.

## 2026-07-19 - Pemblokiran Login Akun Dosen DPL KKN Non-Struktural

- **Tujuan**: Menutup akses login bagi seluruh akun dosen DPL KKN yang tidak memiliki status/jabatan struktural (`is_struktural = false` dan bukan pimpinan YPTP) menyusul selesainya agenda pembekalan.
- **File yang Diubah**:
  - [Login.tsx](file:///C:/Users/Administrator/Documents/GitHub/absensiunesv2/src/pages/Login.tsx)
- **Perubahan yang Dilakukan**:
  - Menghitung variable `isDplNonStruktural` di [Login.tsx](file:///C:/Users/Administrator/Documents/GitHub/absensiunesv2/src/pages/Login.tsx) untuk menyaring dosen DPL murni non-struktural.
  - Memasukkan `isDplNonStruktural` ke dalam logic pemblokiran bersama dengan role mahasiswa.
  - Dosen DPL KKN non-struktural yang diblokir akan dialihkan ke layar `MahasiswaBlockedNotificationToast` dengan pesan: *"Maaf, absensi saat ini hanya untuk dosen struktural dan tenaga kependidikan UNES."*
- **Verifikasi**:
  - Menjalankan build produksi via `pnpm build` dan berhasil sukses 100% tanpa kesalahan kompilasi.
- **Verifikasi**:
  - Menjalankan build produksi via `pnpm build` dan berhasil sukses 100% tanpa kesalahan kompilasi.
- **Langkah Selanjutnya**:
  - Memperbarui teks pesan pemblokiran login.

## 2026-07-19 - Penyesuaian Pesan Pemblokiran Login (UNES Hebat)

- **Tujuan**: Menyesuaikan teks notifikasi pemblokiran bagi mahasiswa dan dosen DPL KKN non-struktural agar memuat branding *"UNES Hebat"* secara presisi.
- **File yang Diubah**:
  - [Login.tsx](file:///C:/Users/Administrator/Documents/GitHub/absensiunesv2/src/pages/Login.tsx)
- **Perubahan yang Dilakukan**:
  - Memperbarui text di dalam modal `MahasiswaBlockedNotificationToast` menjadi: *"Mohon Maaf, UNES Hebat saat ini hanya untuk Dosen Struktural dan Tenaga Kependidikan UNES."*
- **Verifikasi**:
  - Menjalankan build produksi via `pnpm build` dan berhasil sukses 100% tanpa kesalahan kompilasi.
- **Langkah Selanjutnya**:
  - Melaporkan hasil penyesuaian ke Ipan.

## 2026-07-22 - Fitur Modal Pop-up Himbauan Instalasi UNES HEBAT (Berbekal Animasi Emoji & Scoped Users)

- **Tujuan**: Menampilkan himbauan berupa modal pop-up layar penuh terpusat (centered) bagi pengguna yang mengakses sistem via Browser Web agar segera membuka/menginstal aplikasi UNES HEBAT melalui Play Store.
- **File yang Diubah**:
  - [Index.tsx](file:///C:/Users/Administrator/Documents/GitHub/absensiunesv2/src/pages/Index.tsx)
  - [AGENTS.md](file:///C:/Users/Administrator/Documents/GitHub/absensiunesv2/AGENTS.md)
  - [progresirfan2.md](file:///C:/Users/Administrator/Documents/GitHub/absensiunesv2/progresirfan2.md)
- **Perubahan yang Dilakukan**:
  - **Pendeteksian Browser Web**: Membuat pendeteksian `isBrowserAccess` yang memeriksa apakah aplikasi dibuka di luar Capacitor native platform (`!window.Capacitor?.isNativePlatform()`) dan di luar mode PWA standalone (`!window.matchMedia('(display-mode: standalone)').matches`).
  - **Modal Centered Overlay**: Membuat komponen modal pop-up layar penuh dengan latar belakang gelap transparan (`backdrop-blur`), tombol close `[X]` di pojok kanan atas, serta tombol utama di tengah *"Unduh UNES HEBAT di Play Store"* (`market://details?id=com.ivanad.ngabsen.unesv1`).
  - **Ikon Emoji Animatif**: Menambahkan badge SVG emoji senyum ceria dengan animasi mata berkedip (*blushing smiling face with blinking animation*).
  - **Pesan Welcoming**: Menggunakan pesan himbauan yang ramah: *"Bapak/Ibu saat ini Absensi lebih mudah dengan adanya UNES Hebat, silahkan melakukan absensi melalui aplikasi UNES Hebat dengan menginstall melalui tombol berikut:"*.
  - **Visibilitas Ketat (Scoped Users)**: Notifikasi ini dibatasi hanya untuk akun tertentu yang ditentukan: `harry.setya.hadi` (Pak Harry Setya Hadi), `rudiyansa.putra` (Pak Rudiyansa Putra), `ramli.syafri` (Pak Ramli Syafri), serta `tesx`. Seluruh pengguna lainnya 100% bebas dari notifikasi ini.
- **Verifikasi**:
  - Menjalankan build produksi via `pnpm build` dan berhasil sukses 100% tanpa kesalahan kompilasi.

## 2026-07-22 - Pembuatan Prompt AI Pengumuman Aplikasi UNES Hebat (Play Store & iPhone Link)

- **Tujuan**: Menyiapkan panduan dan prompt AI generator gambar (DALL-E 3, Ideogram, Midjourney, FLUX, Canva) untuk flyer/poster pengumuman kehadiran aplikasi UNES Hebat di Play Store (Android) dan penggunaan Link Web untuk pengguna iPhone.
- **File yang Diubah / Dibuat**:
  - [promptpengumuman.md](file:///C:/Users/Administrator/Documents/GitHub/absensiunesv2/promptpengumuman.md)
- **Cakupan Isi**:
  - Pilihan prompt bahasa Inggris & Indonesia disesuaikan dengan skenario AI generator (Ideogram / DALL-E 3 yang mahir teks vs Midjourney / FLUX untuk visual 3D render tanpa teks).
  - Skema warna resmi UNES: Merah Maroon (`#8c1b1d`) & Aksen Emas (`#fbbf24`).
  - Rincian *copywriting* / tata letak teks resmi jika diedit secara manual via Canva / Photoshop.

## 2026-07-28 - Aktivasi Akses Login Mahasiswa & DPL KKN, Unhide Menu Absensi KKN, dan Restorasi Musik KKN

- **Tujuan**: Menjelang pelepasan KKN (29 Juli 2026), memulihkan akses login untuk akun role `mahasiswa` dan DPL KKN (`is_dpl_kkn = true`), memunculkan kembali menu banner dan statistik KKN di dashboard utama, serta memutar lagu KKN (`soundkkn.mp3`).
- **File yang Diubah**:
  - [Login.tsx](file:///C:/Users/Administrator/Documents/GitHub/absensiunesv2/src/pages/Login.tsx)
  - [Index.tsx](file:///C:/Users/Administrator/Documents/GitHub/absensiunesv2/src/pages/Index.tsx)
  - [SoundPlayer.tsx](file:///C:/Users/Administrator/Documents/GitHub/absensiunesv2/src/components/SoundPlayer.tsx)
  - [progresirfan2.md](file:///C:/Users/Administrator/Documents/GitHub/absensiunesv2/progresirfan2.md)
- **Perubahan yang Dilakukan**:
  - **Membuka Akses Login**: Menghapus blokir login untuk `mahasiswa` dan `isDplNonStruktural` di [Login.tsx](file:///C:/Users/Administrator/Documents/GitHub/absensiunesv2/src/pages/Login.tsx) agar akun Mahasiswa dan DPL KKN dapat login ke sistem.
  - **Unhide Widget KKN**: Menghapus `false &&` pada Banner Absen Pembekalan KKN dan Kartu Statistik KKN di [Index.tsx](file:///C:/Users/Administrator/Documents/GitHub/absensiunesv2/src/pages/Index.tsx) agar tombol absensi KKN kembali tampil secara otomatis saat Mahasiswa atau DPL KKN login.
  - **Restorasi Musik KKN**: Mengaktifkan kembali `isEligibleKkn` di [SoundPlayer.tsx](file:///C:/Users/Administrator/Documents/GitHub/absensiunesv2/src/components/SoundPlayer.tsx) untuk akun Mahasiswa, DPL KKN, Panitia KKN, dan akun whitelist agar memutar `/soundkkn.mp3` (*KKN UNES - Rudiyansa P. S.Sos*) dengan halus di latar belakang.
## 2026-07-29 - Pendokumentasian Catatan Teknis & Pengalaman KKN UNES 2026

- **Tujuan**: Membuat dokumen rujukan teknis lengkap mengenai seluruh implementasi, arsitektur database, geofencing, non-blocking Telegram evidence, dan penanganan bug KKN 2026 sebagai panduan untuk KKN berikutnya.
- **File yang Dibuat**:
  - [pengalamankkn2026.md](file:///C:/Users/Administrator/Documents/GitHub/absensiunesv2/pengalamankkn2026.md)
  - [progresirfan2.md](file:///C:/Users/Administrator/Documents/GitHub/absensiunesv2/progresirfan2.md)
- **Cakupan Isi**:
  - Arsitektur tabel `kkn_sessions` dan RPC `submit_attendance_kkn` dengan zona waktu WIB dan toleransi menit akhir.
  - Pengaturan geofencing khusus KKN (radius 150m di Gedung A Auditorium UNES).
  - Arsitektur non-blocking Telegram evidence dengan auto-retry RPC Supabase.
- **Verifikasi**:
  - Menjalankan build produksi via `pnpm build` dan berhasil sukses 100% tanpa kesalahan kompilasi.

## 2026-07-29 - Penutupan Akses Login Akun Mahasiswa KKN (Pasca Selesai KKN)

- **Tujuan**: Menutup kembali akses login bagi seluruh akun pengguna ber-role `mahasiswa` di halaman login menyusul selesainya seluruh rangkaian sesi pembekalan & pelepasan KKN 2026.
- **File yang Diubah**:
  - [Login.tsx](file:///C:/Users/Administrator/Documents/GitHub/absensiunesv2/src/pages/Login.tsx)
  - [progresirfan2.md](file:///C:/Users/Administrator/Documents/GitHub/absensiunesv2/progresirfan2.md)
- **Perubahan yang Dilakukan**:
  - Menyisipkan kembali pengondisian pemblokiran login untuk `user.role === "mahasiswa"` di [Login.tsx](file:///C:/Users/Administrator/Documents/GitHub/absensiunesv2/src/pages/Login.tsx).
  - Mahasiswa yang mencoba login akan ditampilkan modal pemberitahuan pemblokiran (*"Mohon Maaf, UNES Hebat saat ini hanya untuk Dosen Struktural dan Tenaga Kependidikan UNES."*).
## 2026-07-29 - Normalisasi Musik Mars UNES, Penyembunyian Widget KKN, & Penutupan Akses DPL KKN Non-Struktural

- **Tujuan**: Mengembalikan musik latar belakang aplikasi ke Mars UNES AAI untuk seluruh pengguna, mematikan lagu KKN (`soundkkn.mp3`), menyembunyikan kembali banner & widget absensi KKN di dashboard, serta menutup akses login bagi dosen DPL KKN non-struktural pasca selesainya seluruh sesi KKN.
- **File yang Diubah**:
  - [SoundPlayer.tsx](file:///C:/Users/Administrator/Documents/GitHub/absensiunesv2/src/components/SoundPlayer.tsx)
  - [Index.tsx](file:///C:/Users/Administrator/Documents/GitHub/absensiunesv2/src/pages/Index.tsx)
  - [Login.tsx](file:///C:/Users/Administrator/Documents/GitHub/absensiunesv2/src/pages/Login.tsx)
  - [progresirfan2.md](file:///C:/Users/Administrator/Documents/GitHub/absensiunesv2/progresirfan2.md)
- **Perubahan yang Dilakukan**:
  - **Normalisasi Musik**: Mengeset `isEligibleKkn = false` pada [SoundPlayer.tsx](file:///C:/Users/Administrator/Documents/GitHub/absensiunesv2/src/components/SoundPlayer.tsx) sehingga seluruh pengguna yang login mendengarkan **Mars UNES AAI** (`/MARS-UNES-AAI.mp3`).
  - **Penyembunyian Widget KKN**: Menambahkan `false &&` pada Banner Absen Pembekalan KKN dan Informasi Kehadiran KKN di [Index.tsx](file:///C:/Users/Administrator/Documents/GitHub/absensiunesv2/src/pages/Index.tsx) sehingga dashboard steril kembali ke absensi reguler.
  - **Penutupan Akses DPL KKN Non-Struktural**: Menambahkan kembali pengecekan `isDplNonStruktural` pada [Login.tsx](file:///C:/Users/Administrator/Documents/GitHub/absensiunesv2/src/pages/Login.tsx) agar dosen DPL KKN non-struktural tidak dapat login kembali.
- **Verifikasi**:
  - Menjalankan build produksi via `pnpm build` dan berhasil sukses 100% tanpa kesalahan kompilasi.

## 2026-08-06 - Perbaikan PDF Laporan Presensi Individu & Penyaringan Menu Panel Admin Role Admin

- **Tujuan**: Memperbaiki layout ekspor PDF Laporan Individu, memberikan hak akses Laporan Individu kepada seluruh pengguna ber-role Admin, serta menyaring tegas halaman Admin Dashboard agar modul khusus Superadmin tidak tampil pada pengguna role Admin.
- **File yang Diubah**:
  - [pdf-generator.ts](file:///C:/Users/Administrator/Documents/GitHub/absensiunesv2/src/lib/pdf-generator.ts)
  - [auth.ts](file:///C:/Users/Administrator/Documents/GitHub/absensiunesv2/src/lib/auth.ts)
  - [ProtectedRoute.tsx](file:///C:/Users/Administrator/Documents/GitHub/absensiunesv2/src/components/ProtectedRoute.tsx)
  - [App.tsx](file:///C:/Users/Administrator/Documents/GitHub/absensiunesv2/src/App.tsx)
  - [Admin.tsx](file:///C:/Users/Administrator/Documents/GitHub/absensiunesv2/src/pages/Admin.tsx)
  - [progresirfan2.md](file:///C:/Users/Administrator/Documents/GitHub/absensiunesv2/progresirfan2.md)
  - [AGENTS.md](file:///C:/Users/Administrator/Documents/GitHub/absensiunesv2/AGENTS.md)
- **Perubahan yang Dilakukan**:
  - **Profil Header 2-Kolom**: Merubah layout tabel profil pegawai menjadi 2-kolom full-width (lebar kolom nilai 140mm) agar nama panjang (`EDDWINA AIDILA FITRIA, S.TP, M.Si`) & unit kerja tampil 1 baris lurus tanpa terpotong.
  - **Maksimal 7 Baris Per Halaman (7 Rows Per Page Chunking)**: Memecah baris presensi bulanan secara eksplisit menjadi 7 baris per halaman untuk menjamin sisa ruang A4 sangat lega dan foto presensi 1.5x (18x20mm) + teks jam 100% aman di dalam batas kertas.
  - **Fallback Badge & ReferenceError Fix**: Memulihkan fungsi `fetchAttendancePhoto` dan menyertakan SVG fallback badge resmi untuk presensi tanpa foto Telegram.
  - **Akses Laporan Individu Role Admin**: Memperbarui `canAccessLaporanIndividu()` pada [auth.ts](file:///C:/Users/Administrator/Documents/GitHub/absensiunesv2/src/lib/auth.ts) dan `requireAdmin` di [App.tsx](file:///C:/Users/Administrator/Documents/GitHub/absensiunesv2/src/App.tsx) sehingga **seluruh akun dengan role `admin`** (termasuk Ibu Susi Delmiati dan Ibu Asmara Indah) & `superadmin` dapat membuka halaman Laporan Individu dan melihat kartu menu Laporan Individu di Panel Admin.
  - **Penyaringan Menu Panel Admin**: Menyaring array `menuItems` dan `filteredMenuItems` pada [Admin.tsx](file:///C:/Users/Administrator/Documents/GitHub/absensiunesv2/src/pages/Admin.tsx) dengan kondisi `!item.isSuperadminOnly || currentUser?.role === 'superadmin'`. Modul khusus superadmin seperti **Revoke Akses**, **Titik Absensi**, **Titik Absen V2**, **Manajemen Bangunan**, **Jadwal Jam Kerja**, dan **Rekapitulasi Kehadiran** kini **100% tersembunyi** untuk seluruh pengguna ber-role `admin`.
  - **Pengecualian Akun Tes (`tesx`)**: Menyaring dan mengecualikan akun `tesx` (serta `andi.syahrum.makkurade`) dari dropdown dan daftar pencarian nama pegawai pada modul Laporan Individu ([LaporanIndividu.tsx](file:///C:/Users/Administrator/Documents/GitHub/absensiunesv2/src/components/LaporanIndividu.tsx)).
- **Verifikasi**:
  - Kompilasi `pnpm build` berhasil 100% tanpa error.







