# Setup Aplikasi Absensi untuk KKN 2026

> Tanggal: 2026-05-25  
> Aplikasi: Absensi UNES-AAI  
> Tujuan: Menambahkan role Mahasiswa dan DPL KKN ke sistem absensi harian

---

## 1. Role Baru

### Mahasiswa
- Ditambahkan ke constraint role database: `mahasiswa`
- Bisa login ke aplikasi (gate login sudah inklusif)
- Menu dashboard: publik saja (Absensi, Kalender Akademik, Perpustakaan, Logout)
- Tidak bisa akses Izin/Cuti

### DPL KKN — `is_dpl_kkn` (boolean)
- DPL KKN tetap menggunakan role `dosen`, bukan role terpisah
- Kolom baru: `users.is_dpl_kkn` (boolean, default false)
- Alasan: DPL KKN tetap perlu absen harian biasa sebagai dosen

---

## 2. 31 DPL KKN

### Yang struktural (6 — layanan utuh, Izin/Cuti tetap muncul)
1. Budiman, ST.,MT
2. Edwina Aidila, S.TP.,M.Si
3. Dr Rice Haryati, SE.,MSi
4. Yumi Ariyanti, S Sos.,M.Ikom
5. Dr.Susi Yuliastanty, S.Pd, M.M
6. Dr. Yuli Ardiany, S.E., M.Si, C.Atr

### Yang non-struktural (25 — Izin/Cuti disembunyikan)
1. Tuti Kelana Sembiring, SE.,SH.,MH
2. Suwardi, SPdl.,MPdl
3. Devirianti Efendi, SH.,MH
4. Wira Okta Viana, SH.,MH
5. Naldi Gantika, SH.,MH
6. Yenni Fitria, SH.,MH
7. Baso Iping, S.E., M.Hum
8. Susanti Sembiring, SE.,SH.,MH
9. Dr B Patmawanti, SH.,MH
10. Syaiful ardi, S.Sos. M.Hum
11. Sayid Anshar, Shi.,MH
12. Dr Ir Teti Candrayanti, MBA
13. Meri Dwi Anggraini, SE.,MSi
14. Rina Asmeri, SE.,Msi
15. Andre Bustari, SE.,MM
16. Riswanto, S.AP.,M.AP
17. Rinawati, S.IP.,M.Si
18. Elviyanti, ST.,MT
19. Helny Lalan, ST.,MT
20. Dr Azmil Azman, ST.,MPdT
21. Dr Zelmi Sriyolja, SPd.,MT
22. Rozza Linda, ST.,MT
23. AmeliaYuli A, S.Hum.,M.Hum
24. Henny Puspitasari, SP.,MP
25. Alin Deri Utama,SP.,M.Si

### Lokasi absensi tambahan
Semua 31 DPL KKN ditambahkan `Gedung A Universitas Ekasakti` ke `secondary_location` — selain lokasi kerja utama masing-masing.

---

## 3. Akun Mahasiswa (Test)

| Username | Password | Role | Lokasi | Radius |
|---|---|---|---|---|
| `mhs1` | `12345678` | mahasiswa | Gedung A | 75m |
| `mhs2` | `12345678` | mahasiswa | Bebas | ∞ |

---

## 4. Notifikasi Login (Login.tsx)

Sebelum:
> Maaf, Anda tidak memiliki akses ke sistem absensi online. Silakan hubungi administrator jika Anda memerlukan akses.

Sesudah:
> Maaf, sistem absensi online diperuntukkan untuk Dosen Struktural, Tenaga Kependidikan, DPL KKN dan Mahasiswa KKN Universitas Ekasakti.

Tombol: "Oke, Saya Mengerti" → "Baik"

---

## 5. File yang Diubah

| File | Perubahan |
|---|---|
| `src/pages/Login.tsx` | Teks notifikasi + tombol |
| `src/pages/Index.tsx` | Izin/Cuti disembunyikan untuk dosen non-struktural + DPL KKN |
| `src/lib/auth.ts` | AuthUser + cast |
| `src/pages/Profile.tsx` | Tambah mahasiswa di tipe role |
| `src/components/UserManagement.tsx` | Tambah mahasiswa di dropdown + field is_dpl_kkn |
| `src/hooks/use-user-management.tsx` | Tambah mahasiswa di form |
| `src/lib/supabase.ts` | Update komentar role |

---

## 6. Database (Supabase — Project DBAbsensiUNES)

### Migrasi
1. Add kolom `is_dpl_kkn` (boolean) ke `users`
2. Update role Susanti Sembiring → `dosen`, `is_dpl_kkn = true`
3. Hapus role `dpl_kkn` dari constraint (pindah ke boolean)
4. Fix RPC `verify_user_password` — drop duplikat, buat ulang 1 function

### Bug Fixed
- Error `PGRST203: function "verify_user_password"(text, text) is not unique`
- Penyebab: 2 function dengan nama sama (varchar,varchar) + (text,text)
- Solusi: drop semua, buat ulang satu function

---

## 7. Catatan untuk Tambahan Nanti

- Mahasiswa baru: insert ke `users` + `user_passwords` + `attendance_locations`
- DPL KKN baru: set `is_dpl_kkn=true` + tambah `Gedung A` ke `secondary_location`
- Lokasi pembekalan KKN: Gedung A (koordinat: -0.9387835, 100.3561079)
