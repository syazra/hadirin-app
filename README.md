# Hadir.in – Sistem Informasi Praktikum

Sistem pencatatan kehadiran praktikum berbasis mobile (React Native) yang memudahkan asisten dalam mengelola sesi praktikum dan membantu praktikan dalam melakukan presensi serta melihat riwayat kehadiran secara real-time menggunakan state lokal.

---

## Daftar Isi

1. [Konteks & Latar Belakang](#1-konteks--latar-belakang)
2. [Peran Pengguna](#2-peran-pengguna)
3. [Daftar SRS (Software Requirements Specification)](#3-daftar-srs-software-requirements-specification)
4. [Teknologi yang Digunakan](#4-teknologi-yang-digunakan)
5. [Menjalankan Proyek](#5-menjalankan-proyek)
6. [Struktur Folder](#6-struktur-folder)

---

## 1. Konteks & Latar Belakang

Kegiatan praktikum membutuhkan pencatatan kehadiran yang mudah digunakan. Asisten perlu melihat jadwal, membuka sesi ketika praktikum dimulai, memantau kehadiran, dan menutup sesi setelah selesai. Praktikan perlu mengetahui jadwal dan detail sesi, melakukan presensi, serta melihat catatan kehadirannya.

Aplikasi ini mendemonstrasikan kegiatan tersebut dari dua sudut pandang pengguna (Praktikan dan Asisten) dengan tampilan yang nyaman digunakan di perangkat mobile. Pada Sprint 1, aplikasi berfokus pada antarmuka dan alur, memakai data dummy/lokal yang dikelola dengan state, **tanpa database dan tanpa login sungguhan**.

Alur utama yang didemokan: **asisten membuka sesi → praktikan presensi → asisten melihat rekap → asisten menutup sesi.**

## 2. Peran Pengguna

- **Praktikan**: Peserta praktikum yang dapat melihat jadwal, melakukan presensi saat sesi dibuka, dan melihat riwayat kehadiran pribadi.
- **Asisten**: Pengelola sesi praktikum yang dapat membuka/menutup sesi dan memantau rekap kehadiran praktikan.

Satu identitas hanya memiliki satu peran. Status sesi memiliki tiga nilai: **Belum dibuka**, **Dibuka**, dan **Ditutup**.

## 3. Daftar SRS (Software Requirements Specification)

Berikut adalah daftar kebutuhan fungsional dan interaksi (SRS) yang diimplementasikan pada Sprint 1. Kode kebutuhan PRD yang terkait ditulis di akhir deskripsi.

| Kode | Deskripsi | Acceptance Criteria |
|---|---|---|
| SRS-01 | **Memilih peran dan identitas.** Pengguna memilih peran dan identitas dummy lewat pilihan sederhana tanpa login. *(AKN-1, AKN-2, AKN-3, UIX-1, UIX-5)* | 1. Layar awal menampilkan pilihan peran Praktikan dan Asisten.<br>2. Setelah memilih peran, daftar identitas dummy hanya berisi identitas sesuai peran tersebut.<br>3. Setelah memilih identitas, pengguna diarahkan ke tampilan sesuai perannya (Asisten: Jadwal dan Rekap; Praktikan: Jadwal dan Riwayat).<br>4. Tidak ada form login, kata sandi, atau autentikasi nyata.<br>5. Pengguna tidak dapat masuk sebelum memilih peran dan identitas. |
| SRS-02 | **Mengganti peran atau identitas.** Pengguna berganti peran atau identitas tanpa menutup aplikasi dan tanpa kehilangan data. *(AKN-4, UIX-10, NFR-1)* | 1. Tombol atau menu ganti peran dapat diakses dari tampilan utama kedua peran.<br>2. Setelah ganti peran atau identitas, pengguna kembali ke layar pilihan tanpa menutup atau me-reload aplikasi.<br>3. Status sesi dan data presensi tetap sama setelah pergantian.<br>4. Presensi Praktikan langsung terlihat pada rekap Asisten setelah berganti peran.<br>5. Layar detail sesi menampilkan panel sesuai identitas aktif, bukan peran sebelumnya.<br>6. Jika aplikasi di-reload, seluruh data kembali ke kondisi awal data dummy. |
| SRS-03 | **Validasi QR sebelum presensi.** Sistem memvalidasi payload QR, kode QR, ID sesi, status sesi, dan identitas sebelum presensi dicatat. *(PRS-7, NFR-5)* | 1. Payload berformat `hadirin:<idSesi>:<kodeQr>`; format lain ditolak dengan alasan `QR_TIDAK_VALID`.<br>2. Ditolak (`QR_TIDAK_VALID`) jika `idSesi` tidak ditemukan atau `kodeQr` tidak cocok dengan data sesi.<br>3. QR milik sesi lain ditolak dan tidak mencatat presensi.<br>4. Sesi Belum dibuka ditolak dengan alasan `BELUM_DIBUKA`; sesi Ditutup dengan alasan `SUDAH_DITUTUP`.<br>5. Presensi hanya dapat dicatat untuk identitas aktif berperan Praktikan.<br>6. Praktikan yang sudah presensi pada sesi yang sama ditolak dengan alasan `SUDAH_PRESENSI`.<br>7. Setiap penolakan menampilkan pesan jelas dan jumlah catatan presensi tidak bertambah. |
| SRS-04 | **Jadwal dan detail sesi.** Pengguna melihat daftar jadwal dan detail sesi. *(JDW-1 s.d. JDW-5)* | 1. Daftar jadwal tersedia untuk Praktikan dan Asisten; tiap item menampilkan nama praktikum, kelas/lab, waktu, dan status sesi.<br>2. Tiga status tampil dengan label dan warna berbeda (mengikuti token tema).<br>3. Mengetuk item membuka detail sesi; panel ditentukan oleh peran identitas aktif, bukan parameter route.<br>4. Perubahan status sesi langsung tercermin pada daftar dan detail tanpa reload.<br>5. Jika daftar jadwal kosong, tampil empty state.<br>6. Jika identitas aktif kosong atau sesi tidak ditemukan, tampil pesan atau pengguna diarahkan kembali. |
| SRS-05 | **Asisten membuka sesi.** Asisten membuka sesi lewat konfirmasi; QR dummy otomatis tersedia. *(SES-1, SES-2, SES-3, SES-6, SES-7, SES-8, UIX-2)* | 1. Tombol "Buka Sesi" hanya muncul untuk sesi Belum dibuka dan hanya pada panel Asisten.<br>2. Menekan tombol menampilkan modal/bottom sheet konfirmasi; pilihan batal tidak mengubah status.<br>3. Setelah dikonfirmasi, status menjadi Dibuka dan terlihat di jadwal, detail, serta sisi Praktikan.<br>4. QR sesi tampil otomatis pada detail sisi Asisten, dirender dari payload `hadirin:<idSesi>:<kodeQr>`.<br>5. Sebelum sesi dibuka, QR tidak tampil dan diganti pesan penjelas.<br>6. Asisten dapat memperbesar QR (bottom sheet atau layar penuh).<br>7. Aksi memberi umpan balik visual yang jelas. |
| SRS-06 | **Asisten menutup sesi.** Asisten menutup sesi lewat konfirmasi; presensi tidak dapat dilakukan lagi. *(SES-4, SES-5, SES-7, UIX-2)* | 1. Tombol "Tutup Sesi" hanya muncul untuk sesi Dibuka dan hanya pada panel Asisten.<br>2. Menekan tombol menampilkan modal/bottom sheet konfirmasi; pilihan batal tidak mengubah status.<br>3. Setelah dikonfirmasi, status menjadi Ditutup di semua tampilan terkait.<br>4. QR sesi disembunyikan dan diganti pesan bahwa sesi sudah ditutup.<br>5. Tombol Scan QR Praktikan pada sesi tersebut nonaktif dengan pesan penjelas.<br>6. QR atau Simulasi Scan pada sesi Ditutup ditolak (`SUDAH_DITUTUP`).<br>7. Rekap sesi tetap dapat dibuka setelah sesi ditutup. |
| SRS-07 | **Presensi lewat Simulasi Scan.** Praktikan melakukan presensi saat sesi Dibuka dan mendapat informasi jelas jika gagal atau sudah tercatat. *(PRS-1 s.d. PRS-5, PRS-9, NFR-4)* | 1. Tombol "Scan QR" aktif hanya ketika sesi Dibuka.<br>2. Pada sesi Belum dibuka atau Ditutup, tombol nonaktif dan tampil pesan penjelas sesuai status.<br>3. Layar scan menyediakan tombol "Simulasi Scan" yang memproses QR sesi yang sedang dibuka tanpa kamera.<br>4. Simulasi Scan yang valid mencatat presensi dengan waktu jam perangkat dan menampilkan "Presensi berhasil".<br>5. Setelah presensi, tombol di detail berubah menjadi "Sudah presensi" beserta waktu hadir (contoh `20 Okt 2026, 09.15`).<br>6. Presensi kedua pada sesi yang sama ditolak dengan pesan jelas dan catatan tidak bertambah. |
| SRS-08 | **Rekap kehadiran Asisten.** Asisten memantau praktikan yang sudah presensi per sesi. *(RKP-1 s.d. RKP-4)* | 1. Asisten dapat memilih sesi pada layar rekap.<br>2. Rekap menampilkan nama praktikan dan waktu hadir, diurutkan dari presensi terbaru di atas.<br>3. Rekap menampilkan ringkasan jumlah hadir memakai komponen bersama `RingkasanHadir`.<br>4. Jika belum ada yang presensi, tampil empty state.<br>5. Presensi baru dari sisi Praktikan langsung muncul di rekap setelah berganti peran, tanpa reload.<br>6. Rekap sesi yang sudah ditutup tetap dapat dilihat. |
| SRS-09 | **Riwayat kehadiran Praktikan.** Praktikan melihat sesi yang dia hadiri beserta waktunya; jika belum ada, tampil empty state. *(RKP-5 direvisi, RKP-6)* | 1. Riwayat hanya berisi sesi yang memiliki presensi milik identitas aktif.<br>2. Setiap item menampilkan nama praktikum, kelas/lab, status "Hadir", dan waktu presensi.<br>3. Item diurutkan dari presensi terbaru di atas.<br>4. Ringkasan berbunyi "Total hadir: N sesi".<br>5. Jika belum ada presensi, tampil empty state "Belum ada catatan kehadiran" dengan deskripsi "Presensi yang kamu lakukan akan muncul di sini." memakai komponen `EmptyState` bersama.<br>6. Setelah Simulasi Scan berhasil, riwayat bertambah satu item tanpa reload. |

## 4. Teknologi yang Digunakan

| Bagian | Teknologi |
|---|---|
| Framework | React Native dengan Expo |
| Bahasa | TypeScript (`.tsx` untuk JSX, `.ts` untuk non-JSX) |
| Navigasi | Expo Router (routing berbasis file di `src/app`, stack dan tab) |
| State | React Context dan `useReducer` (satu state global) |
| Tata letak dan gaya | Flexbox, StyleSheet, token tema di `src/constants/theme.ts` |
| Tampilan QR | Pustaka QR yang kompatibel Expo (usulan: `react-native-qrcode-svg`) |
| Pemindaian kamera | `expo-camera` (ditunda; presensi memakai Simulasi Scan) |
| Kualitas kode | ESLint dan pemeriksaan tipe TypeScript |
| Versi kontrol | Git dan GitHub (branch `main` dan `develop`) |

## 5. Menjalankan Proyek

Prasyarat: [Node.js](https://nodejs.org) (versi LTS), npm, Git, dan HP Android atau iOS (atau emulator) yang berada pada jaringan yang sama dengan komputer.

1. **Clone repository**

   ```bash
   git clone https://github.com/syazra/hadirin-app.git
   cd hadirin-app
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Install development build** di HP: [Demo](https://expo.dev/accounts/syafirazkas-team/projects/hadirin/builds/b15ec38f-696a-480c-8dc7-261ef6a5873e)

   Buka tautan dari HP, unduh, lalu pasang aplikasi **Hadir.in (development)**. Pada Android, izinkan pemasangan dari sumber tidak dikenal jika diminta.

   > Alternatif tanpa development build: pasang **Expo Go** dari Play Store atau App Store, lalu lanjut ke langkah 4.

4. **Jalankan server pengembangan**

   ```bash
   npx expo start
   ```

5. **Buka aplikasi di HP**

   Buka aplikasi **Hadir.in (development)** (atau Expo Go), lalu pindai QR yang muncul di terminal. Pada emulator, tekan `a` untuk Android atau `i` untuk iOS.

6. **Pilih peran dan identitas** pada layar awal, lalu ikuti alur: Asisten membuka sesi, Praktikan presensi lewat Simulasi Scan, Asisten melihat rekap, Asisten menutup sesi.

> Data bersifat dummy dan kembali ke kondisi awal setiap aplikasi dijalankan ulang. Presensi tidak disinkronkan antar perangkat, jadi demo dilakukan pada satu HP dengan fitur ganti peran.

## 6. Struktur Folder

```text
hadirin-app/
├── src/
│   ├── app/                # Expo Router (halaman & layout)
│   ├── components/         # Komponen UI, shared, asisten, praktikan
│   ├── constants/          # Tema & konfigurasi status
│   ├── context/            # State global (React Context & Reducer)
│   ├── data/               # Data dummy pengguna, sesi, & presensi
│   ├── hooks/              # Custom hooks
│   ├── types/              # Definisi TypeScript
│   └── utils/              # Fungsi helper & format waktu
├── app.json / package.json
└── README.md
```
