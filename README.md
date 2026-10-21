# Hadir.in – Sistem Informasi Praktikum

Sistem pencatatan kehadiran praktikum berbasis mobile (React Native) yang memudahkan asisten dalam mengelola sesi praktikum dan membantu praktikan dalam melakukan presensi serta melihat riwayat kehadiran secara real-time menggunakan state lokal.

## Konteks & Latar Belakang
Kegiatan praktikum sudah berjalan, tetapi pencatatan kehadirannya belum memiliki software pendukung. Aplikasi ini membantu asisten mengelola sesi dan praktikan mencatat kehadiran dengan tampilan non-formal dan nyaman digunakan di perangkat mobile.

## Peran Pengguna
- **Praktikan**: Peserta praktikum yang dapat melihat jadwal, melakukan presensi saat sesi dibuka, dan melihat riwayat kehadiran pribadi.
- **Asisten**: Pengelola sesi praktikum yang dapat membuka/menutup sesi dan memantau rekap kehadiran praktikan.

## User Story Final (Epic: Pencatatan Kehadiran Praktikum)

1. **US-01: Pilih peran dan identitas**
   - *Sebagai pengguna*, aku ingin memilih peran (Praktikan/Asisten) dan identitas lewat pilihan sederhana di dalam app, supaya aku bisa mendemokan dua sudut pandang tanpa login sungguhan.
2. **US-02: Lihat jadwal dan detail sesi (Praktikan dan Asisten)**
   - *Sebagai praktikan atau asisten*, aku ingin melihat daftar jadwal dan detail sesi, supaya aku tahu kapan dan di mana praktikum berlangsung.
3. **US-03: Buka sesi (Asisten)**
   - *Sebagai asisten*, aku ingin membuka sesi saat praktikum dimulai, supaya praktikan bisa mulai presensi.
4. **US-04: Tutup sesi (Asisten)**
   - *Sebagai asisten*, aku ingin menutup sesi setelah praktikum selesai, supaya presensi tidak bisa lagi dilakukan.
5. **US-05: Presensi (Praktikan)**
   - *Sebagai praktikan*, aku ingin melakukan presensi saat sesi dibuka, supaya kehadiranku tercatat.
6. **US-06: Pantau kehadiran / rekap sesi (Asisten)**
   - *Sebagai asisten*, aku ingin melihat daftar praktikan yang sudah presensi beserta waktunya, supaya aku bisa memantau kehadiran.
7. **US-07: Lihat catatan kehadiran sendiri (Praktikan)**
   - *Sebagai praktikan*, aku ingin melihat riwayat kehadiranku, supaya tahu sesi mana yang sudah kuhadiri.

## Daftar SRS (Software Requirements Specification)

Berikut adalah daftar kebutuhan fungsional dan interaksi (SRS) yang diimplementasikan pada Sprint 1:

| Kode | Deskripsi Kebutuhan | Prioritas |
| :--- | :--- | :--- |
| **AKN-1** | Pengguna dapat memilih peran (Praktikan atau Asisten) pada layar awal. | Wajib |
| **AKN-2** | Pengguna dapat memilih identitas dummy sesuai peran yang dipilih melalui form/pilihan sederhana. | Wajib |
| **AKN-3** | Sistem mengarahkan pengguna ke tampilan sesuai perannya setelah memilih peran dan identitas. | Wajib |
| **AKN-4** | Pengguna dapat mengganti peran atau identitas tanpa menutup aplikasi. | Wajib |
| **JDW-1** | Sistem menampilkan daftar jadwal berisi nama praktikum, kelas/lab, waktu, dan status sesi. | Wajib |
| **JDW-2** | Status sesi memiliki tiga nilai: “Belum dibuka”, “Dibuka”, dan “Ditutup”, ditampilkan secara jelas pada setiap item. | Wajib |
| **JDW-3** | Pengguna dapat membuka halaman detail sesi dengan mengetuk item pada daftar jadwal. | Wajib |
| **JDW-4** | Sistem menampilkan tampilan kosong (*empty state*) yang jelas jika daftar jadwal kosong. | Wajib |
| **JDW-5** | Perubahan status sesi langsung tercermin pada daftar jadwal dan halaman detail. | Wajib |
| **SES-1** | Tombol “Buka Sesi” hanya muncul untuk sesi yang berstatus “Belum dibuka”. | Wajib |
| **SES-2** | Asisten harus mengonfirmasi melalui modal/bottom sheet sebelum sesi dibuka. | Wajib |
| **SES-3** | Setelah dibuka, status sesi menjadi “Dibuka” dan terlihat di jadwal, detail, serta sisi praktikan. | Wajib |
| **SES-4** | Tombol “Tutup Sesi” hanya muncul untuk sesi yang berstatus “Dibuka”, disertai konfirmasi sebelum sesi ditutup. | Wajib |
| **SES-5** | Setelah ditutup, status sesi menjadi “Ditutup” dan tombol presensi praktikan menjadi nonaktif. | Wajib |
| **PRS-1** | Tombol presensi aktif hanya ketika sesi berstatus “Dibuka”. | Wajib |
| **PRS-2** | Jika sesi “Belum dibuka” atau “Ditutup”, sistem menampilkan pesan penjelas (bukan tampilan kosong atau error). | Wajib |
| **PRS-3** | Sistem mencatat waktu kehadiran praktikan saat presensi dilakukan. | Wajib |
| **PRS-4** | Sistem memberikan umpan balik “Presensi berhasil” setelah presensi tercatat. | Wajib |
| **PRS-5** | Praktikan yang sama tidak dapat presensi dua kali pada sesi yang sama; tombol berubah menjadi status “Sudah presensi” beserta waktunya. | Wajib |
| **RKP-1** | Asisten dapat melihat daftar praktikan yang sudah presensi beserta waktu kehadirannya per sesi. | Wajib |
| **RKP-2** | Sistem menampilkan ringkasan jumlah praktikan yang hadir pada rekap sesi. | Wajib |
| **RKP-3** | Sistem menampilkan empty state jika belum ada praktikan yang presensi. | Wajib |
| **RKP-4** | Rekap tetap dapat dilihat setelah sesi ditutup. | Wajib |
| **RKP-5** | Praktikan dapat melihat riwayat kehadirannya sendiri berupa daftar sesi dengan status “Hadir” (beserta waktu) atau “Belum presensi”. | Wajib |
| **RKP-6** | Sistem menampilkan empty state jika praktikan belum memiliki catatan kehadiran. | Wajib |
| **UIX-1** | Sistem menyediakan form/pilihan untuk menerima masukan atau pilihan pengguna. | Wajib |
| **UIX-2** | Sistem menggunakan modal/bottom sheet untuk konfirmasi tindakan penting (buka dan tutup sesi). | Wajib |
| **UIX-3** | Sistem menggunakan modal/bottom sheet untuk menampilkan informasi pendukung. | Penting |
| **UIX-4** | Sistem menggunakan data dummy/lokal untuk identitas pengguna, jadwal, dan sesi, dengan perubahan data dikelola melalui state. | Wajib |
| **UIX-5** | Sistem menyediakan navigasi untuk perpindahan antar halaman. | Wajib |
| **UIX-6** | Tata letak disusun menggunakan flexbox. | Wajib |
| **UIX-7** | Sistem menangani kondisi tampilan: daftar kosong, sesi belum dibuka, serta presensi tercatat atau belum. | Wajib |
| **UIX-8** | Antarmuka memenuhi kaidah UX mobile: area tap cukup besar, umpan balik jelas, hierarki rapi, dan minim error. | Wajib |
| **UIX-9** | Data presensi disarankan memakai state bersama agar perubahan dari sisi praktikan terlihat pada sisi asisten. | Penting |

## Menjalankan Proyek
Pastikan Node.js dan Expo CLI sudah terinstal di komputer Anda.

```bash
# 1. Clone repository
git clone https://github.com/syazra/hadirin-app.git
cd hadirin-app

# 2. Install dependencies
npm install

# 3. Jalankan aplikasi via Expo
npx expo start
```

## Struktur Folder

```text
hadirin-app/
├── src/
│   ├── app/                # Expo Router (halaman & layout)
│   ├── components/         # Komponen UI, shared, asisten, praktikan
│   ├── constants/          # Tema & konfigurasi status
│   ├── context/            # State global (React Context & Reducer)
│   ├── data/               # Data dummy pengguna & sesi
│   ├── hooks/              # Custom hooks
│   ├── types/              # Definisi TypeScript
│   └── utils/              # Fungsi helper & format waktu
├── App.json / package.json
└── README.md
```