# Alur Absensi Pembekalan KKN 2026
## Sabtu, 18 Juli 2026 — Auditorium Universitas Ekasakti

---

## 📱 TAHAP 0: Instalasi Aplikasi UNES Hebat
### (Dilakukan H-7 sampai H-1, jangan hari H!)

Sebelum hari pembekalan, semua peserta **wajib menginstal** aplikasi **UNES Hebat** dari Google Play Store.

#### Cara Install:

1. Buka **Google Play Store** di HP Android masing-masing
2. Cari: **"UNES Hebat"**
3. Download & Install (ukuran ~15MB)
4. Setelah terinstall, **coba login** dulu:
   - **Mahasiswa**: username `mhs1` / `mhs2`, password `12345678`
   - **DPL KKN**: username masing-masing (sudah dibagikan)
5. Pastikan **notifikasi diizinkan** (Allow)


#### ⚠️ Pesan Penting ke Peserta:
> *"Jangan nunggu di hari H baru install! Sinyal di Auditorium bisa lambat karena ribuan orang download barengan. Install dan login **malam sebelumnya**."*

---

## 🎯 Tujuan Pembekalan
- Memastikan semua peserta (Mahasiswa + DPL KKN) tercatat hadir **masuk** dan **pulang**
- Mengantisipasi kendala sinyal di lokasi yang padat

---

## 👥 Siapa Saja yang Absen?

| Peserta | Cara Login | Lokasi Absen |
|---|---|---|
| **Mahasiswa KKN** (saat ini 2 akun test, nanti ribuan) | Username adalah nama masing-masing  contoh Dewi Retno Sani menjadi dewi.retno.sani  | **Gedung A** (radius 75m) |
| **DPL KKN** (31 orang) | Username adalah nama masing-masing dengan titik contoh Dewi Retno Sani menjadi dewi.retno.sani , role **dosen** dengan `is_dpl_kkn = true` | Lokasi kerja masing-masing + **Gedung A** (secondary_location) |

> **Arahan ke mahasiswa:** *"Username dan password akan dibagikan oleh panitia fakultas masing-masing. Jika belum punya akun, segera hubungi DPL atau panitia KKN sebelum H-1."*

#### ✅ Status Database:

| Peserta | Status |
|---|---|
| **DPL KKN** (31 orang) | ✅ **Sudah diinput** di database, semua sudah punya akun dan `is_dpl_kkn = true`. DPL bisa langsung login setelah pengumuman kelulusan tes. |
| **Mahasiswa** | ⏳ **Data mahasiswa harap final H-4** agar punya cukup waktu untuk input massal ke database, pembuatan akun, dan testing sebelum hari H. |

---

## ⏰ Alur Kegiatan & Aksi di Aplikasi

### PAGI — Absen Masuk

| Kegiatan | Aksi di Aplikasi |
|---|---|
| Registrasi ulang + **Instal UNES Hebat** (bagi yg belum) | Buka Play Store → Install → Login |
| Absen Masuk **Gelombang 1** (Mahasiswa Fakultas A-D) | Buka **UNES Hebat** → **Absensi** → **Masuk** → Foto |
| **Gelombang 2** (Mahasiswa Fakultas E-J) | Sama |
| **Gelombang 3** (DPL KKN + sisanya) | Sama |
| Sesi 1 Pembekalan | — |

### SIANG — Absen Pulang

| Kegiatan | Aksi di Aplikasi |
|---|---|
| Istirahat / Ishoma | — |
| Absen **Masuk Sesi 2** (opsional) | Buka **UNES Hebat** → **Absensi** → **Masuk** |
| Sesi 2 Pembekalan | — |
| Penutupan + **Absen Pulang** | Buka **UNES Hebat** → **Absensi** → **Pulang** → Foto |

---

## 📱 Cara Absen di Aplikasi UNES Hebat

### Langkah-langkah:

1. **Buka aplikasi UNES Hebat** → Login dengan username & password
2. Di halaman utama (dashboard), tap menu **"Absensi"**
3. Kamera terbuka otomatis:
   - Arahkan ke wajah
   - Foto akan terambil
4. Sistem cek:
   - ✅ **Lokasi** — apakah dalam radius yang diizinkan (Gedung A radius 75m)
   - ✅ **Waktu** — validasi jam
5. Jika valid → muncul notifikasi **"Absen Masuk Berhasil"** atau **"Absen Pulang Berhasil"**
6. Jika tidak valid (di luar lokasi/salah jam) → ditolak dengan pesan

### Untuk Mahasiswa:
- Lokasi: **Gedung A** (koordinat: `-0.9387835, 100.3561079`, radius 75m)
- Harus benar-benar berada di area Auditorium / Gedung A

### Untuk DPL KKN:
- Lokasi: lokasi kerja utama **+ Gedung A** (secondary_location)
- Bisa absen dari Gedung A tanpa harus mengubah lokasi utama

---

## 📶 Kendala Sinyal & Antisipasi

### Masalah yang Diprediksi

| Masalah | Penyebab | Dampak |
|---|---|---|
| **Sinyal padat / lambat** | Ribuan mahasiswa + DPL absen bersamaan di satu titik | Foto gagal upload, timeout, aplikasi loading lama |
| **Network congestion** | BTS kewalahan karena semua user terkonsentrasi di Auditorium | Koneksi terputus, error "Network Error" |
| **GPS tidak akurat** | Di dalam gedung, sinyal GPS melemah | Lokasi terdeteksi di luar radius m → absen ditolak |
| **Baterai HP habis** | Layar nyala terus, kamera, GPS aktif | Tidak bisa absen |

### Solusi & Antisipasi

#### 1. ✅ Instal & Login Sejak Malam Sebelumnya
Ini yang paling krusial. Jika semua orang install/login **hari H** di Auditorium:
- Bisa macet karena ribuan orang download barengan
- Koneksi lemot, gagal download
- Waktu terbuang


## 📋 Ringkasan Flow Keseluruhan

```
┌─────────────────────────────────────────────────┐
│  H-7 sampai H-1                                 │
│  📱 INSTAL & LOGIN UNES HEBAT                   │
│  • Buka Play Store → Cari "UNES Hebat"          │
│  • Install → Login dengan akun masing-masing    │
│  • Pastikan bisa masuk dashboard                │
│  • Kalau error, hubungi panitia                 │
└─────────────────────┬───────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────┐
│  📱 ABSEN MASUK (Bertahap per Fakultas)         │
│  • Buka UNES Hebat                              │
│  • Tap menu "Absensi"                           │
│  • Ambil foto                                   │
│  • ✅ "Absen Masuk Berhasil"                    │
└─────────────────────┬───────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────┐
│  🎤 Sesi 1 Pembekalan                           │
└─────────────────────┬───────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────┐
│  🍽️ Istirahat / Ishoma                          │
└─────────────────────┬───────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────┐
│  📱 Absen Masuk Sesi 2 (opsional)               │
└─────────────────────┬───────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────┐
│  🎤 Sesi 2 Pembekalan                           │
└─────────────────────┬───────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────┐
│  📱 ABSEN PULANG (Bertahap)                     │
│  • Buka UNES Hebat                              │
│  • Tap menu "Absensi"                           │
│  • Pilih "Pulang"                               │
│  • Ambil foto                                   │
│  • ✅ "Absen Pulang Berhasil"                   │
└─────────────────────────────────────────────────┘
```

---

## 🔧 Checklist Persiapan Sebelum H-1

- [ ] **H-4**: Data mahasiswa final & diserahkan ke tim teknis untuk input database
- [ ] **H-3 s.d H-2**: Input massal akun mahasiswa ke database + uji coba login
- [ ] Tutorial/cara install UNES Hebat diumumkan ke mahasiswa via grup WA
- [ ] Akun mahasiswa sudah dibuat semua di database

