# Hadir.in — Sistem Informasi Praktikum

Hadir.in adalah aplikasi mobile untuk mendukung pengelolaan kegiatan praktikum di lingkungan kampus. Aplikasi menyediakan fitur bagi **Asisten** untuk mengelola kelas, jadwal, sesi, presensi, perizinan, dan rekap kehadiran, serta bagi **Praktikan** untuk melihat jadwal, melakukan presensi, mengajukan izin, dan memantau riwayat kehadiran.

Aplikasi dikembangkan menggunakan React Native dan Expo, dengan Firebase sebagai layanan autentikasi dan penyimpanan data. Beberapa fitur pendukung menggunakan Google Maps, Firebase Cloud Messaging (FCM), serta layanan klasifikasi izin berbasis Gemini melalui server-side proxy.

---

## Daftar Isi

1. [Fitur Utama](#1-fitur-utama)
2. [Peran Pengguna](#2-peran-pengguna)
3. [Teknologi](#3-teknologi)
4. [Persiapan Proyek](#4-persiapan-proyek)
5. [Konfigurasi Environment](#5-konfigurasi-environment)
6. [Menjalankan Aplikasi](#6-menjalankan-aplikasi)
7. [Gemini Proxy untuk Klasifikasi Izin](#7-gemini-proxy-untuk-klasifikasi-izin)
8. [Firebase dan Backend](#8-firebase-dan-backend)
9. [Pengujian](#9-pengujian)
10. [Struktur Folder](#10-struktur-folder)

---

## 1. Fitur Utama

- **Autentikasi dan role pengguna** — login dan registrasi menggunakan Firebase Authentication, dengan profil serta role pengguna yang tersimpan di Firestore.
- **Remember Me** — menyimpan preferensi sesi login pengguna.
- **Pengelolaan kelas dan jadwal** — Asisten dapat mengelola kelas dan sesi praktikum; Asisten dan Praktikan dapat melihat jadwal beserta nama praktikum, waktu, lokasi, dan status sesi.
- **Presensi berbasis QR dan lokasi** — Praktikan melakukan presensi melalui pemindaian QR dengan pemeriksaan lokasi sesuai ketentuan sesi.
- **Perizinan praktikum** — Praktikan dapat mengajukan izin, sedangkan Asisten dapat memeriksa dan memberikan keputusan.
- **Klasifikasi izin berbasis AI** — Gemini membantu mengelompokkan alasan izin. Hasil AI merupakan rekomendasi klasifikasi, bukan keputusan akhir persetujuan izin.
- **Rekap dan riwayat kehadiran** — Asisten dapat memantau rekap per sesi, sedangkan Praktikan dapat melihat riwayat kehadirannya.
- **Laboratorium dan peta** — menampilkan informasi laboratorium dan mendukung tampilan lokasi melalui Google Maps.
- **Push notification** — integrasi Firebase Cloud Messaging untuk mendukung pemberitahuan terkait aktivitas praktikum.
- **Demo Login** — menyediakan tombol masuk sebagai Asisten atau Praktikan menggunakan akun khusus pengujian.

## 2. Peran Pengguna

### Asisten

Asisten dapat mengelola kelas dan sesi praktikum, melihat jadwal, membuka atau menutup sesi, menampilkan QR presensi, memantau rekap kehadiran, mengelola pengajuan izin, serta melihat informasi laboratorium.

### Praktikan

Praktikan dapat melihat jadwal dan detail sesi, melakukan presensi sesuai status sesi dan ketentuan lokasi, mengajukan izin, serta melihat riwayat kehadiran dan informasi laboratorium.

Status sesi yang digunakan adalah `BELUM_DIBUKA`, `DIBUKA`, dan `DITUTUP`. Status kehadiran dan perizinan dikelola sesuai alur pada aplikasi dan aturan Firestore.

## 3. Teknologi

| Bagian | Teknologi |
|---|---|
| Mobile framework | React Native, Expo |
| Bahasa | TypeScript |
| Navigasi | Expo Router |
| UI | React Native StyleSheet, komponen bersama, dan token tema |
| Autentikasi | Firebase Authentication (React Native Firebase) |
| Database | Cloud Firestore |
| App attestation | Firebase App Check |
| Push notification | Firebase Cloud Messaging (FCM) |
| Peta dan lokasi | Google Maps, layanan lokasi perangkat |
| AI klasifikasi izin | Gemini melalui proxy server di `proxy-gemini/` |
| Backend tambahan | Firebase Cloud Functions (source tersedia di `functions/`) |
| Build aplikasi | EAS Build |
| Quality check | TypeScript, ESLint, dan automated tests |

## 4. Persiapan Proyek

### Prasyarat

- Node.js dan npm sesuai konfigurasi proyek.
- Git.
- Android Studio atau perangkat Android.
- Development build Hadir.in untuk menjalankan modul native Firebase, App Check, Maps, dan notifikasi.
- Akses ke Firebase project yang digunakan tim.

> Integrasi Firebase native pada konfigurasi aplikasi saat ini diaktifkan untuk Android. Pengujian fitur yang memakai Firebase perlu dilakukan pada development build Android.

> **Catatan:** Expo Go tidak digunakan sebagai pengganti development build untuk konfigurasi aplikasi ini karena proyek menggunakan modul native React Native Firebase dan layanan Android terkait.

### Clone dan install dependencies

```bash
git clone https://github.com/syazra/hadirin-app.git
cd hadirin-app
npm ci
```

Siapkan file konfigurasi Firebase Android (`google-services.json`) dari Firebase Console sesuai konfigurasi `app.json`/`app.config.ts`. File konfigurasi lokal ini tidak perlu dimasukkan ke repository.

## 5. Konfigurasi Environment

Buat file `.env.local` di root proyek. Contoh variabel yang dapat digunakan:

```env
# Gemini proxy
EXPO_PUBLIC_GEMINI_PROXY_URL=

# Demo Login untuk pengujian
EXPO_PUBLIC_DEMO_LOGIN_ENABLED=false
EXPO_PUBLIC_DEMO_LOGIN_ENVIRONMENT=production
EXPO_PUBLIC_DEMO_LOGIN_PROJECT_ID=
EXPO_PUBLIC_DEMO_ASISTEN_EMAIL=
EXPO_PUBLIC_DEMO_ASISTEN_PASSWORD=
EXPO_PUBLIC_DEMO_PRAKTIKAN_EMAIL=
EXPO_PUBLIC_DEMO_PRAKTIKAN_PASSWORD=

# Google Maps (dibaca oleh app.config.ts)
GOOGLE_MAPS_API_KEY=
```

Isi nilai sesuai environment dan akun pengujian tim. Variabel yang tidak digunakan dapat dibiarkan kosong atau tidak ditambahkan.

**Penting terkait keamanan:**

- `.env.local` diabaikan oleh Git melalui `.gitignore`; jangan commit file tersebut.
- Nilai dengan prefix `EXPO_PUBLIC_` akan dimasukkan ke bundle aplikasi dan dapat diekstrak dari APK. Karena itu, kredensial Demo Login hanya boleh menggunakan akun dummy khusus pengujian, bukan akun pribadi atau akun produksi.
- Jangan menyimpan Gemini API key, Firebase Admin private key, service account key, atau secret backend di environment Expo. Simpan nilai rahasia hanya di lingkungan server.
- Batasi Google Maps API key melalui pengaturan Google Cloud sesuai aplikasi Android yang digunakan.

Untuk EAS Build, atur `GOOGLE_MAPS_API_KEY` pada environment EAS yang sesuai dengan profile build. `app.config.ts` membaca nilai tersebut untuk membentuk konfigurasi Google Maps Android.

## 6. Menjalankan Aplikasi

1. Pastikan development build Hadir.in sudah terpasang di perangkat Android.
2. Pastikan file konfigurasi Firebase dan `.env.local` sudah disiapkan.
3. Jalankan Metro bundler:

   ```bash
   npx expo start --dev-client
   ```

4. Buka aplikasi **Hadir.in (development)** pada perangkat, lalu hubungkan ke development server melalui QR code atau pilihan koneksi yang ditampilkan Expo.

Untuk membuat development build Android melalui EAS, gunakan profile yang tersedia pada `eas.json`:

```bash
npx eas-cli build --profile development --platform android
```

Setelah ada perubahan pada kode JavaScript/TypeScript, umumnya development build yang sudah terpasang dapat digunakan kembali. Perubahan native dependency atau konfigurasi native tertentu dapat memerlukan build ulang.

## 7. Gemini Proxy untuk Klasifikasi Izin

Klasifikasi alasan izin dijalankan melalui server-side proxy di direktori `proxy-gemini/`. Aplikasi mengirim identitas pengajuan dan Firebase ID token. Proxy memvalidasi autentikasi, role, serta hak akses sebelum meneruskan alasan izin ke Gemini.

Proxy mengelompokkan alasan menjadi:

- `SAKIT` — alasan terkait sakit atau kesehatan.
- `IZIN` — izin mengikuti lomba sebagai delegasi UNDIP/Departemen.
- `ALPHA` — alasan yang tidak memenuhi kategori tersebut.

Hasil klasifikasi AI tidak mengambil keputusan akhir. Keputusan persetujuan atau penolakan tetap dilakukan oleh Asisten.

### Environment server

Deploy `proxy-gemini/` sebagai root proyek Vercel. Siapkan environment variables berikut pada Vercel dan lingkungan lokal server:

| Variable | Keterangan |
|---|---|
| `FIREBASE_PROJECT_ID` | ID Firebase project |
| `FIREBASE_CLIENT_EMAIL` | Email service account Firebase Admin |
| `FIREBASE_PRIVATE_KEY` | Private key service account |
| `GEMINI_API_KEY` | API key Gemini khusus server |
| `GEMINI_MODEL` | Model Gemini yang digunakan |

Gunakan `proxy-gemini/.env.example` sebagai referensi nama variabel. Jangan menaruh nilai rahasia tersebut pada `.env.local` aplikasi Expo atau repository.

### Environment aplikasi

Atur `EXPO_PUBLIC_GEMINI_PROXY_URL` pada `.env.local` ke URL publik deployment proxy, misalnya:

```env
EXPO_PUBLIC_GEMINI_PROXY_URL=https://<deployment>.vercel.app
```

Endpoint klasifikasi yang digunakan aplikasi adalah `POST /api/klasifikasi-izin`.

### Pemeriksaan proxy

Jalankan dari direktori `proxy-gemini/`:

```bash
npm install
npm run typecheck
npm test
```

Panduan kebijakan klasifikasi tersedia di [`docs/far-s2-01-ai-categories.md`](docs/far-s2-01-ai-categories.md).

## 8. Firebase dan Backend

Aplikasi menggunakan Firebase Authentication dan Cloud Firestore untuk autentikasi serta data aplikasi. Firestore Security Rules dan indexes berada di root repository pada `firestore.rules` dan `firestore.indexes.json`.

Source Firebase Cloud Functions untuk presensi dan Demo Login berbasis Custom Token tersedia di direktori `functions/`. Notifikasi Sprint 3 diproses melalui Vercel dan FCM dengan jadwal QStash. Ikuti [panduan deployment notifikasi](docs/notification-backend.md) untuk mengaktifkannya pada Firebase Spark.

Demo Login pada versi aplikasi yang dijelaskan di README ini menggunakan Firebase Authentication secara langsung dengan akun dummy yang dikonfigurasi secara lokal. Alur tersebut tidak memerlukan deployment Cloud Functions. Kredensial demo hanya ditujukan untuk pengujian dan tidak boleh menggunakan akun pribadi atau akun produksi.

Pengiriman otomatis berjalan setelah Firestore Rules, worker Vercel, dan jadwal QStash aktif pada lingkungan Firebase yang sama.

Firebase App Check dikonfigurasi melalui `src/lib/firebase-app-check.ts`. Development menggunakan debug provider, sedangkan build release menggunakan Play Integrity. Debug token harus dikelola melalui Firebase Console dan tidak boleh dimasukkan ke repository.

Pengaturan Firebase Emulator untuk Authentication dan Firestore tersedia pada `firebase.json`.

## 9. Pengujian

Pemeriksaan tipe aplikasi:

```bash
npx tsc --noEmit
```

Pengujian Demo Login pada source Cloud Functions:

```bash
npm --prefix functions run test:demo-auth
```

Pengujian backend notifikasi pada source Cloud Functions:

```bash
npm --prefix proxy-gemini test
```

Pengujian proxy Gemini dijalankan dari `proxy-gemini/` menggunakan perintah pada bagian [Gemini Proxy](#7-gemini-proxy-untuk-klasifikasi-izin).

Automated tests tidak menggantikan pengujian langsung pada development build Android. Sebelum release, uji alur login, jadwal, presensi dan validasi lokasi, perizinan, Maps, serta notifikasi pada perangkat.

## 10. Struktur Folder

```text
hadirin-app/
├── assets/                 # Logo, ikon, dan aset aplikasi
├── docs/                   # Dokumentasi teknis dan pengujian sprint
├── functions/              # Source Firebase Cloud Functions dan tests
├── plugins/                 # Konfigurasi plugin native Expo
├── proxy-gemini/            # Server-side proxy klasifikasi izin
├── scripts/seed/            # Seeder data pengujian Firestore
├── src/
│   ├── app/                 # Halaman dan layout Expo Router
│   ├── components/          # Komponen UI shared, Asisten, Praktikan, Maps
│   ├── constants/           # Konstanta dan token tema
│   ├── context/             # React Context
│   ├── data/                # Data pendukung aplikasi
│   ├── hooks/               # Custom hooks dan listener data
│   ├── lib/                 # Inisialisasi Firebase dan layanan dasar
│   ├── services/             # Integrasi Auth, Firestore, lokasi, notifikasi, AI
│   ├── types/                # Definisi tipe TypeScript
│   └── utils/                # Fungsi helper dan utilitas
├── tests/                    # Automated tests aplikasi dan Firestore Rules
├── app.config.ts             # Konfigurasi Expo dinamis
├── app.json                  # Konfigurasi Expo
├── eas.json                  # Konfigurasi EAS Build
├── firebase.json             # Konfigurasi Firebase
├── firestore.rules           # Firestore Security Rules
└── README.md
```

---

## Dokumentasi Tambahan

- [Dokumentasi Android Native Services](docs/android-native-services.md)
- [Dokumentasi backend notifikasi](docs/notification-backend.md)
- [Panduan pengujian notifikasi Sprint 3](docs/sprint-3-notifications.md)
- [Panduan pengujian presensi Sprint 3](docs/sprint-3-attendance-test.md)
- [Panduan klasifikasi izin AI](docs/far-s2-01-ai-categories.md)
- [Panduan data seed Firestore](docs/seed-data.md)
