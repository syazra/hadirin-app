# Pengujian Sprint 3 — Validasi Lokasi Presensi, Rules & Aktivitas Lab

Dokumen ini mencatat verifikasi akhir pada branch `feature/s3-location-attendance` sebelum digabungkan ke `develop`.

## 1. Pengujian Unit & Firebase Emulator (Rules & Cloud Functions)

### A. Cloud Functions (`functions/`)
- **Validator Geofence (`geofence-validator.test.ts`):**
  - Menghitung jarak Haversine antar koordinat dengan presisi meter.
  - Menerima lokasi di dalam radius laboratorium (`distance <= radiusPresensi`).
  - Menolak lokasi di luar radius (`OUT_OF_RANGE`) beserta jarak meter aktual.
  - Menolak akurasi GPS buruk (`LOW_ACCURACY`, akurasi > 100 m) dan koordinat tidak valid.
- **Callable `recordAttendance` (`record-attendance.test.ts`):**
  - Menolak request tanpa autentikasi (`unauthenticated`).
  - Memvalidasi format QR (`hadirin://presensi?sesi=...&qr=...`), status sesi `DIBUKA`, keanggotaan `AKTIF`, dan pencegahan duplikasi presensi maupun konflik izin.
  - Memvalidasi koordinat pengguna terhadap dokumen `laboratorium/{labId}` sebelum menulis dokumen `presensi/{sesiId}_{uid}` beserta `jarakMeter`.
- **Trigger Notifikasi `onSessionOpened` (`on-session-opened.test.ts`):**
  - Hanya berjalan pada transisi `BELUM_DIBUKA -> DIBUKA`.
  - Mengirim daftar praktikan `AKTIF` dengan `idempotencyKey` (`session-opened:{sesiId}`).

### B. Firestore Security Rules (`firestore.rules`)
- **Koleksi `presensi`:** Direct client `create`, `update`, dan `delete` diblokir (`permission-denied`); pembacaan tetap terbatas untuk praktikan pemilik riwayat dan asisten pemilik kelas.
- **Koleksi `laboratorium`:** Dapat dibaca (`get`/`list`) oleh pengguna yang sudah login; seluruh penulisan klien ditolak.
- **Proyeksi `kodePeserta`:** Asisten dapat melakukan `list` terbatas pada proyeksi `PRAKTIKAN` untuk *student picker*; praktikan tidak dapat melakukan `list`.
- **Subkoleksi `pengguna/{uid}/perangkat/{installationId}`:** Hanya pemilik `uid` yang dapat membaca, menambah, memperbarui, dan menghapus token FCM miliknya.

---

## 2. Checklist Pengujian Fisik (Android Development Build)

1. **Izin GPS Foreground:**
   - Buka layar Scan QR pada perangkat Android fisik (development build).
   - Dialog sistem izin lokasi muncul; saat ditolak permanen, banner menampilkan tombol **Buka Pengaturan**.
2. **Pre-check Radius & Akurasi:**
   - Saat berada di luar radius laboratorium, kartu `PresensiLocationStatus` menampilkan status di luar jangkauan dan menahan pengiriman QR.
   - Saat berada di dalam radius laboratorium dengan akurasi <= 100 m, pemindaian QR berhasil memanggil `recordAttendance` dan mencatat presensi.
3. **Informasi Aktivitas Laboratorium:**
   - Komponen `LaboratoryActivityList` menampilkan praktikum yang sedang berjalan (`Asia/Jakarta`) dan praktikum berikutnya secara real-time saat memilih marker laboratorium.