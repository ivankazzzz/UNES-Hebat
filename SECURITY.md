# Kebijakan Keamanan UNES-Hebat

## Melapor celah keamanan

**Jangan buka issue publik** untuk kerentanan. Hubungi pemilik repo langsung
(mis. via email yang tercantum di profil GitHub) dengan deskripsi, dampak,
dan langkah reproduksi. Kami akan menindaklanjuti dan memberi kredit bila diinginkan.

## Aturan untuk kontributor

- Jangan pernah commit: `.env`, service-role key Supabase, token bot Telegram,
  password/hash, atau data pribadi (nama + foto absensi asli).
- Token bot & service-role key hanya dipakai di backend/Edge Function —
  tidak boleh masuk bundle frontend.
- Perubahan RLS/RPC/grants wajib direview karena berdampak ke seluruh data.
- Jika menemukan secret yang tidak sengaja ter-commit, segera kabari pemilik repo
  agar secret di-rotate — menghapus commit saja tidak cukup.
