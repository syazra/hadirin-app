# Product Requirements Document (PRD) — Hadir.in

| Atribut | Keterangan |
| --- | --- |
| Nama Produk | Hadir.in – Sistem Informasi Praktikum (nama bebas menurut brief klien) |
| Versi Dokumen | v0.2 (revisi dari v0.1) |
| Status | Draft |
| Disusun oleh | Tim Pengembang: Azka (PM), Farhan (Programmer 1), Aqilla (Programmer 2), Binar (Programmer 3) |
| Tanggal | 22 Oktober 2026 |
| Dokumen Terkait | User Story Final Sprint 1; Tracker User Story (spreadsheet) |

## 1. Ringkasan Produk (Overview)

Kegiatan praktikum membutuhkan pencatatan kehadiran yang mempermudah asisten. Asisten perlu melihat jadwal, membuka sesi ketika praktikum dimulai, memantau kehadiran, dan menutup sesi setelah selesai. Praktikan perlu mengetahui jadwal dan detail sesi, melakukan presensi, serta melihat catatan kehadirannya.

Hadir.in adalah aplikasi mobile berbasis React Native yang mendemonstrasikan kegiatan tersebut dari dua sudut pandang pengguna, yaitu Praktikan dan Asisten. Modul utamanya meliputi pemilihan peran dan identitas, jadwal dan detail sesi, pengelolaan sesi (buka dan tutup), presensi dengan QR, serta rekap kehadiran. Pada Sprint 1 aplikasi berfokus pada antarmuka dan alur, memakai data dummy/lokal yang dikelola dengan state tanpa database.

## 2. Tujuan & Sasaran (Goals)

- Menyediakan pencatatan kehadiran praktikum yang mudah digunakan oleh asisten dan praktikan.
- Mempermudah asisten mengelola siklus sesi: melihat jadwal, membuka sesi, memantau kehadiran, hingga menutup sesi.
- Memberi praktikan kejelasan informasi jadwal, detail, dan status sesi.
- Memberikan transparansi kehadiran: praktikan melihat catatan kehadirannya sendiri, asisten melihat daftar hadir beserta waktunya.
- Menjamin kehadiran tercatat tertib: satu praktikan hanya dapat presensi satu kali pada setiap sesi.
- Mendemonstrasikan alur utama secara utuh: asisten buka sesi → praktikan presensi → asisten lihat rekap → asisten tutup sesi.

## 3. Pengguna & Peran (Users & Roles)

- **Praktikan**: peserta praktikum. Dapat melihat daftar jadwal dan detail sesi, melakukan presensi dengan memindai QR saat sesi berstatus “Dibuka”, dan melihat catatan kehadirannya sendiri. Praktikan tidak dapat melihat rekap seluruh peserta.
- **Asisten**: pengelola sesi praktikum. Dapat melihat jadwal dan detail sesi, membuka sesi (QR presensi muncul otomatis), memantau daftar praktikan yang sudah presensi beserta waktunya, dan menutup sesi.

Satu identitas hanya memiliki satu peran (asumsi A-9).

## 4. Ruang Lingkup (Scope)

### 4.1 Termasuk (MVP)

- Pemilihan peran dan identitas dummy lewat pilihan sederhana di dalam aplikasi, serta penggantian peran tanpa menutup aplikasi.
- Daftar jadwal dan detail sesi (nama praktikum, kelas/lab, waktu, status sesi) untuk kedua peran.
- Pengelolaan sesi oleh asisten (buka dan tutup) dengan konfirmasi; perubahan status terlihat di seluruh tampilan terkait.
- QR sesi: QR dibuat otomatis dan tampil di sisi asisten begitu sesi dibuka, dan disembunyikan saat sesi ditutup.
- Presensi oleh praktikan dengan memindai QR sesi (kamera) atau Simulasi scan pada demo satu perangkat, dengan pencatatan waktu, umpan balik “Presensi berhasil”, penolakan QR tidak valid, dan pencegahan presensi ganda pada sesi yang sama.
- Rekap kehadiran per sesi untuk asisten dan catatan kehadiran pribadi untuk praktikan.
- Penanganan kondisi tampilan: daftar kosong, sesi belum dibuka, sesi ditutup, presensi tercatat atau belum, QR tidak valid, izin kamera ditolak.
- Komponen interaksi: form/pilihan untuk input, modal/bottom sheet untuk konfirmasi dan informasi pendukung.

### 4.2 Di Luar Sprint 1

Database, login sungguhan, sinkronisasi data antar perangkat, QR dinamis yang berganti berkala, dan validasi QR di server. Data QR pada Sprint 1 bersifat dummy. Rencana setelah Sprint 1 belum dibahas dan dicatat di Bab 12.

## 5. Asumsi & Batasan (Assumptions & Constraints)

### 5.1 Batasan dari brief klien

- Aplikasi dibangun dengan React Native dan berfokus pada antarmuka (kode).
- Tanpa database dan tanpa login sungguhan; seluruh data (identitas pengguna, jadwal, sesi) bersifat dummy/lokal dan perubahan data dikelola dengan state.
- Layout memakai flexbox, perpindahan halaman memakai navigasi, dan tampilan merespons tindakan pengguna melalui state.
- Pengalaman pengguna (UX) mobile yang baik.
- Data presensi tidak disinkronkan antar perangkat. Keselarasan sisi praktikan dan asisten dijamin pada satu perangkat melalui state bersama (UIX-10).

### 5.2 Asumsi pengembang (belum disepakati dengan klien)

- **A-1** Memakai Expo dengan TypeScript (.tsx dan .ts) sebagai kerangka React Native, sesuai struktur proyek yang sudah ada.
- **A-2** Navigasi memakai Expo Router (routing berbasis file di src/app) dengan stack dan tab.
- **A-3** State dikelola dengan React Context dan useReducer sebagai satu state global bersama.
- **A-4** Waktu kehadiran diambil dari jam perangkat saat QR berhasil dipindai (atau saat Simulasi scan ditekan).
- **A-5** Data kembali ke kondisi awal setiap aplikasi dijalankan ulang.
- **A-6** Demo dilakukan pada satu perangkat dengan berpindah peran lewat fitur ganti peran; pemindaian QR didemokan lewat Simulasi scan (PRS-9).
- **A-7** Praktikum adalah atribut sesi (nama praktikum), bukan entitas terpisah.
- **A-8** Presensi dilakukan dengan memindai QR sesi (permintaan tim). Data QR bersifat dummy dan tidak divalidasi server.
- **A-9** Satu identitas satu peran; asisten tidak merangkap praktikan.
- **A-10** Brief menulis “tidak bisa presensi dua kali di waktu yang sama”; ditafsirkan sebagai “pada sesi yang sama”.
- **A-11** Status sesi memakai tiga nilai: “Belum dibuka”, “Dibuka”, “Ditutup”.
- **A-12** Payload QR berupa teks `hadirin:<id_sesi>:<kode_qr>`. Nilai kode\_qr berupa data dummy tetap per sesi di data dummy. QR dibuat (dirender dari payload) secara otomatis begitu status sesi menjadi “Dibuka”.
- **A-13** Validasi QR memakai state perangkat praktikan: payload berformat benar, id\_sesi dan kode\_qr cocok dengan data sesi, dan status sesi “Dibuka” di perangkat itu.
- **A-14** Karena tanpa database dan tanpa sinkronisasi antar perangkat, scan kamera ke layar perangkat lain hanya berhasil jika sesi juga berstatus “Dibuka” di perangkat praktikan, dan presensinya tidak muncul pada rekap di perangkat asisten. Alur demo utama memakai Simulasi scan pada satu perangkat; scan kamera adalah nilai tambah.
- **A-15** Pustaka usulan: expo-camera (CameraView, termasuk di Expo Go) untuk memindai QR, dan pustaka QR yang kompatibel dengan Expo (misalnya react-native-qrcode-svg) untuk menampilkan QR. Pemilihan dan pemasangan oleh Farhan; belum disepakati.

## 6. Kebutuhan Fungsional (Functional Requirements)

Kolom PJ adalah penanggung jawab. Pembagian beban kerja dijelaskan di Lampiran A.

### 6.1 Pemilihan Peran dan Identitas

| ID | Kebutuhan Fungsional | Prioritas | PJ |
| --- | --- | --- | --- |
| AKN-1 | Pengguna dapat memilih peran (Praktikan atau Asisten) pada layar awal. | Wajib | Farhan |
| AKN-2 | Pengguna dapat memilih identitas dummy sesuai peran yang dipilih melalui form/pilihan sederhana. | Wajib | Farhan |
| AKN-3 | Sistem mengarahkan pengguna ke tampilan sesuai perannya setelah memilih peran dan identitas. | Wajib | Farhan |
| AKN-4 | Pengguna dapat mengganti peran atau identitas tanpa menutup aplikasi. | Wajib | Farhan |

### 6.2 Jadwal dan Detail Sesi (Praktikan & Asisten)

| ID | Kebutuhan Fungsional | Prioritas | PJ |
| --- | --- | --- | --- |
| JDW-1 | Sistem menampilkan daftar jadwal berisi nama praktikum, kelas/lab, waktu, dan status sesi. | Wajib | Aqilla |
| JDW-2 | Status sesi memiliki tiga nilai (“Belum dibuka”, “Dibuka”, “Ditutup”) yang ditampilkan jelas pada setiap item. | Wajib | Aqilla |
| JDW-3 | Pengguna dapat membuka halaman detail sesi dengan mengetuk item pada daftar jadwal. | Wajib | Aqilla |
| JDW-4 | Sistem menampilkan empty state yang jelas jika daftar jadwal kosong. | Wajib | Aqilla |
| JDW-5 | Perubahan status sesi langsung tercermin pada daftar jadwal dan halaman detail. | Wajib | Aqilla |

### 6.3 Pengelolaan Sesi (Asisten)

| ID | Kebutuhan Fungsional | Prioritas | PJ |
| --- | --- | --- | --- |
| SES-1 | Tombol “Buka Sesi” hanya muncul untuk sesi berstatus “Belum dibuka”. | Wajib | Aqilla |
| SES-2 | Asisten harus mengonfirmasi melalui modal/bottom sheet sebelum sesi dibuka. | Wajib | Aqilla |
| SES-3 | Setelah dibuka, status sesi menjadi “Dibuka” dan terlihat di jadwal, detail, serta sisi praktikan. | Wajib | Aqilla |
| SES-4 | Tombol “Tutup Sesi” hanya muncul untuk sesi berstatus “Dibuka”, disertai konfirmasi sebelum sesi ditutup. | Wajib | Aqilla |
| SES-5 | Setelah ditutup, status sesi menjadi “Ditutup” dan tombol Scan QR praktikan menjadi nonaktif. | Wajib | Aqilla |
| SES-6 | Setelah sesi dibuka, sistem otomatis membuat dan menampilkan QR sesi pada detail sesi sisi asisten, tanpa tindakan tambahan. | Wajib | Aqilla |
| SES-7 | Sebelum sesi dibuka, QR tidak tampil dan diganti pesan penjelas; setelah sesi ditutup, QR disembunyikan dan diganti pesan bahwa sesi sudah ditutup. | Wajib | Aqilla |
| SES-8 | Asisten dapat memperbesar QR (bottom sheet atau layar penuh) agar mudah dipindai. | Penting | Aqilla |

### 6.4 Presensi (Praktikan)

| ID | Kebutuhan Fungsional | Prioritas | PJ |
| --- | --- | --- | --- |
| PRS-1 | Tombol “Scan QR” aktif hanya ketika sesi berstatus “Dibuka”. | Wajib | Binar |
| PRS-2 | Jika sesi “Belum dibuka” atau “Ditutup”, sistem menampilkan pesan penjelas (bukan tampilan kosong atau error). | Wajib | Binar |
| PRS-3 | Sistem mencatat waktu kehadiran praktikan saat QR sesi yang valid berhasil dipindai. | Wajib | Binar |
| PRS-4 | Sistem memberikan umpan balik “Presensi berhasil” setelah presensi tercatat. | Wajib | Binar |
| PRS-5 | Praktikan yang sama tidak dapat presensi dua kali pada sesi yang sama; tombol berubah menjadi status “Sudah presensi” beserta waktunya, dan scan ulang ditolak dengan pesan jelas. | Wajib | Binar |
| PRS-6 | Layar scan memakai kamera perangkat untuk memindai QR sesi; izin kamera diminta saat layar scan dibuka. | Penting | Binar |
| PRS-7 | QR yang tidak valid (bukan QR Hadir.in, milik sesi lain, atau sesi sudah ditutup) ditolak dengan pesan jelas dan tidak mencatat presensi. | Wajib | Farhan (aturan validasi), Binar (pesan di layar scan) |
| PRS-8 | Jika izin kamera ditolak atau kamera tidak tersedia, layar scan menampilkan pesan penjelas dan tetap menyediakan Simulasi scan. | Penting | Binar |
| PRS-9 | Layar scan menyediakan tombol “Simulasi scan” yang memproses QR sesi yang sedang dibuka tanpa kamera, agar alur dapat didemokan pada satu perangkat. | Wajib | Binar |

### 6.5 Rekap Kehadiran

| ID | Kebutuhan Fungsional | Prioritas | PJ |
| --- | --- | --- | --- |
| RKP-1 | Asisten dapat melihat daftar praktikan yang sudah presensi beserta waktu kehadirannya per sesi. | Wajib | Binar |
| RKP-2 | Sistem menampilkan ringkasan jumlah praktikan yang hadir pada rekap sesi. | Wajib | Binar |
| RKP-3 | Sistem menampilkan empty state jika belum ada praktikan yang presensi. | Wajib | Binar |
| RKP-4 | Rekap tetap dapat dilihat setelah sesi ditutup. | Wajib | Binar |
| RKP-5 | Praktikan dapat melihat riwayat kehadirannya sendiri berupa daftar sesi dengan status “Hadir” (beserta waktu) atau “Belum presensi”. | Wajib | Binar |
| RKP-6 | Sistem menampilkan empty state jika praktikan belum memiliki catatan kehadiran. | Wajib | Binar |

### 6.6 Interaksi dan Kondisi Tampilan (Umum)

| ID | Kebutuhan Fungsional | Prioritas | PJ |
| --- | --- | --- | --- |
| UIX-1 | Sistem menyediakan form/pilihan untuk menerima masukan atau pilihan pengguna (misalnya pemilihan peran dan identitas). | Wajib | Farhan |
| UIX-2 | Sistem memakai modal/bottom sheet untuk konfirmasi tindakan penting (buka dan tutup sesi). | Wajib | Aqilla |
| UIX-3 | Sistem memakai modal/bottom sheet untuk menampilkan informasi pendukung. | Penting | Aqilla |
| UIX-5 | Sistem menyediakan navigasi untuk perpindahan antar halaman. | Wajib | Farhan |
| UIX-7 | Sistem menangani kondisi tampilan: daftar kosong, sesi belum dibuka, sesi ditutup, presensi tercatat atau belum, QR tidak valid, serta izin kamera ditolak. | Wajib | Bersama (tiap programmer pada file miliknya; Azka memverifikasi saat uji akhir) |
| UIX-10 | Data presensi memakai state bersama sehingga presensi dari sisi praktikan langsung terlihat pada rekap asisten. | Wajib | Farhan |

Kode UIX-4, UIX-6, dan UIX-8 dipindah ke kebutuhan non-fungsional (Bab 7). UIX-9 (bahasa non-formal) dihapus. Pemetaan lengkap ada di Lampiran B.

## 7. Kebutuhan Non-Fungsional (Non-Functional Requirements)

| ID | Kebutuhan Non-Fungsional | Kategori | Kode lama | PJ |
| --- | --- | --- | --- | --- |
| NFR-1 | Identitas pengguna, jadwal, dan sesi memakai data dummy/lokal; perubahan data dikelola melalui state. | Data | UIX-4 | Farhan |
| NFR-2 | Tata letak disusun dengan flexbox dan nyaman di berbagai ukuran layar mobile. | Tampilan | UIX-6 | Binar (tema dasar); semua programmer menerapkannya pada file miliknya |
| NFR-3 | Antarmuka memenuhi kaidah UX mobile: area tap cukup besar dan hierarki visual rapi. | Usability | UIX-8 | Binar (tema dan tombol dasar); semua programmer menerapkannya |
| NFR-4 | Setiap tindakan penting (buka sesi, tutup sesi, presensi) memberi umpan balik visual yang jelas. | Usability | Bab 9 lama | Aqilla (buka/tutup), Binar (presensi) |
| NFR-5 | Minim error antarmuka; semua kondisi (kosong, belum dibuka, ditutup, presensi tercatat atau belum, QR tidak valid, izin kamera ditolak) punya tampilan yang ditangani. | Reliabilitas | UIX-8 dan Bab 9 lama | Bersama |
| NFR-6 | Tanpa database; data hanya hidup selama aplikasi berjalan. Data QR bersifat dummy. | Data | Bab 9 lama | Farhan |
| NFR-7 | Pemisahan hak berdasarkan peran pada level tampilan: hanya asisten yang dapat membuka atau menutup sesi dan melihat QR sesi, hanya praktikan yang dapat presensi. Tidak ada autentikasi nyata. | Keamanan | Bab 9 lama | Aqilla (panel asisten), Binar (panel praktikan) |
| NFR-8 | Dibangun dengan React Native (Expo, TypeScript), navigasi Expo Router, state React Context dan useReducer, pemindaian QR dengan expo-camera, dan tampilan QR dengan pustaka QR yang kompatibel Expo. | Teknis | Bab 5 lama | Farhan |
| NFR-9 | Kode dipelihara dengan aturan satu file satu pemilik, penamaan kebab-case, dan kontrak tipe yang dibekukan (Lampiran A). | Pemeliharaan | Lampiran A lama | Farhan (menyiapkan aturan dan CODEOWNERS); Azka mengawasi lewat review PR |
| NFR-10 | Izin kamera diminta hanya saat layar scan QR dibuka; jika ditolak atau kamera tidak tersedia, aplikasi tetap dapat dipakai lewat Simulasi scan. | Privasi dan reliabilitas | Baru | Binar |

## 8. Alur Pengguna Utama (Key User Flows)

### 8.1 Asisten Membuka Sesi

1. Pengguna memilih peran “Asisten” dan identitas dummy pada layar awal.
2. Asisten melihat daftar jadwal beserta status setiap sesi.
3. Asisten mengetuk sesi berstatus “Belum dibuka” untuk melihat detail.
4. Asisten menekan tombol “Buka Sesi”.
5. Sistem menampilkan bottom sheet konfirmasi.
6. Asisten mengonfirmasi, lalu status sesi berubah menjadi “Dibuka” dan terlihat di jadwal, detail, serta sisi praktikan.
7. QR sesi otomatis tampil pada detail sesi; asisten dapat memperbesarnya agar mudah dipindai.

### 8.2 Praktikan Presensi dengan Scan QR (Alur Utama)

1. Pengguna berganti ke peran “Praktikan” dan memilih identitas dummy.
2. Praktikan melihat sesi berstatus “Dibuka” pada daftar jadwal dan membuka detailnya.
3. Praktikan menekan tombol “Scan QR”; layar scan terbuka (kamera aktif jika izin diberikan).
4. Praktikan memindai QR sesi, atau menekan “Simulasi scan” saat demo pada satu perangkat.
5. Sistem memvalidasi QR, mencatat waktu kehadiran, dan menampilkan umpan balik “Presensi berhasil”.
6. Layar kembali ke detail sesi; tombol berubah menjadi status “Sudah presensi” beserta waktu hadir.
7. Praktikan membuka catatan kehadirannya dan melihat sesi tersebut berstatus “Hadir”.

### 8.3 Praktikan Mencoba Presensi Ganda (Pengecualian)

1. Praktikan yang sudah presensi membuka kembali detail sesi yang sama.
2. Sistem menampilkan status “Sudah presensi” beserta waktunya dan tidak menyediakan tombol Scan QR yang aktif.
3. Jika QR yang sama dipindai lagi (misalnya dari layar scan yang masih terbuka), sistem menolak dengan pesan jelas dan catatan kehadiran tidak bertambah.

### 8.4 Praktikan Presensi Saat Sesi Belum Dibuka, Sudah Ditutup, atau QR Tidak Valid (Pengecualian)

1. Praktikan membuka detail sesi berstatus “Belum dibuka” atau “Ditutup”.
2. Tombol Scan QR nonaktif dan sistem menampilkan pesan penjelas sesuai status sesi.
3. Jika praktikan memindai QR yang tidak valid (bukan QR Hadir.in, milik sesi lain, atau sesi sudah ditutup), sistem menampilkan pesan penolakan dan presensi tidak tercatat.
4. Jika izin kamera ditolak, layar scan menampilkan pesan penjelas dan tetap menyediakan Simulasi scan.

### 8.5 Asisten Memantau Rekap dan Menutup Sesi

1. Asisten kembali ke peran “Asisten” dan membuka rekap sesi berstatus “Dibuka”.
2. Sistem menampilkan daftar praktikan yang sudah presensi beserta waktu hadir dan ringkasan jumlah hadir (atau empty state jika belum ada).
3. Setelah praktikum selesai, asisten menekan tombol “Tutup Sesi”.
4. Sistem menampilkan bottom sheet konfirmasi.
5. Asisten mengonfirmasi, lalu status sesi berubah menjadi “Ditutup” di semua tampilan, QR sesi disembunyikan, tombol Scan QR praktikan nonaktif, dan rekap tetap dapat dilihat.

## 9. Model Data (High-Level)

Seluruh entitas disimpan sebagai data dummy di state aplikasi (tanpa database).

| Entitas | Field Utama | Keterangan |
| --- | --- | --- |
| Pengguna | id\_pengguna, nama, peran | Identitas dummy; peran bernilai Praktikan atau Asisten. |
| Sesi | id\_sesi, nama\_praktikum, kelas\_lab, waktu, status\_sesi, kode\_qr | status\_sesi bernilai Belum dibuka, Dibuka, atau Ditutup. kode\_qr berupa data dummy tetap per sesi. |
| Presensi | id\_presensi, id\_sesi, id\_pengguna, waktu\_hadir | Kombinasi id\_sesi dan id\_pengguna harus unik (satu presensi per praktikan per sesi). |

Format field waktu (satu waktu atau rentang mulai–selesai) belum diputuskan (Bab 12). Payload QR berupa teks hadirin:\<id\_sesi>:\<kode\_qr>; QR dirender dari payload ini saat sesi dibuka dan tidak disimpan sebagai gambar.

## 10. Integrasi Pihak Ketiga

Sistem berdiri sendiri dan tidak menggunakan integrasi layanan pihak ketiga pada Sprint 1.

## 11. Fitur Usulan / Fase Lanjutan

Belum ada usulan fase lanjutan.

## 12. Pertanyaan Terbuka / TBD

- Konfirmasi asumsi A-8 dan A-12: apakah QR dummy dengan kode tetap per sesi cukup untuk Sprint 1, atau kode harus acak dan berganti setiap sesi dibuka?
- Apakah pemindaian kamera sungguhan wajib didemokan, atau Simulasi scan pada satu perangkat sudah cukup (terkait A-14)?
- Konfirmasi asumsi A-9: apakah asisten boleh sekaligus menjadi praktikan (misalnya asisten di satu praktikum dan praktikan di praktikum lain)?
- Konfirmasi asumsi A-10: maksud “tidak bisa presensi dua kali di waktu yang sama” apakah pada sesi yang sama?
- Jumlah dan isi data dummy (praktikum, kelas/lab, praktikan, asisten, sesi) yang diinginkan.
- Format waktu pada sesi: satu waktu mulai atau rentang mulai–selesai, dan apakah memuat tanggal.
- Isi informasi pendukung yang ditampilkan pada modal/bottom sheet (di luar konfirmasi), terkait UIX-3.
- Apakah sesi yang sudah ditutup boleh dibuka kembali (dan apakah QR lama tetap tidak berlaku).
- Apakah asisten hanya mengelola sesi miliknya atau semua sesi, dan apakah praktikan hanya melihat sesi kelasnya.
- Platform target (Android, iOS, atau keduanya) dan cara demo; pemindaian kamera paling praktis di perangkat fisik.
- Tenggat waktu Sprint 1 dan rincian kriteria penilaian.
- Rencana setelah Sprint 1: database, login sungguhan, sinkronisasi data antar perangkat, dan validasi QR di server.

## 13. Glosarium

- **Praktikum**: kegiatan pembelajaran praktik yang menjadi konteks aplikasi.
- **Praktikan**: peserta praktikum.
- **Asisten**: pengelola sesi praktikum.
- **Sesi**: satu pertemuan praktikum yang memiliki jadwal, kelas/lab, dan status.
- **Presensi**: pencatatan kehadiran praktikan pada suatu sesi beserta waktunya.
- **QR sesi**: kode QR yang dibuat otomatis saat sesi dibuka dan dipindai praktikan untuk presensi.
- **Simulasi scan**: tombol demo yang memproses QR sesi tanpa kamera, untuk demo pada satu perangkat.
- **Rekap**: daftar praktikan yang sudah presensi pada sebuah sesi (sisi asisten) atau riwayat kehadiran pribadi (sisi praktikan).
- **Empty State**: tampilan yang muncul ketika belum ada data untuk ditampilkan.
- **Bottom Sheet**: panel yang muncul dari bagian bawah layar untuk konfirmasi atau informasi pendukung.
- **State**: data aplikasi yang disimpan di memori dan memicu perubahan tampilan ketika berubah.
- **Flexbox**: sistem tata letak React Native untuk menyusun komponen.
- **PJ**: penanggung jawab.

## Lampiran A. Pembagian Tugas Tiga Programmer (React Native, Tanpa Database)

Pembagian ini adalah usulan teknis tim. Seluruh data memakai state (React Context dan useReducer) tanpa database. Prinsip utama: satu file hanya dimiliki satu orang, dan semua file yang saling bergantung dibuat lebih dulu sebagai kerangka (stub) sehingga anggota lain tidak perlu menyentuh file milik orang lain.

Azka sebagai PM tidak mengubah file apa pun di repo. Perannya: koordinasi, review dan merge Pull Request, pengaturan GitHub, pengujian akhir secara manual, dan tindak lanjut ke klien. Seluruh file kode dibagi antara Farhan, Aqilla, dan Binar.

### A.1 Struktur Folder dan Kepemilikan File

Struktur mengikuti proyek yang sudah ada (Expo, TypeScript, Expo Router, folder src/app, src/components/ui, src/constants, src/hooks, dan global.css). File yang memuat JSX memakai .tsx, file tanpa JSX memakai .ts. Penamaan file memakai kebab-case. Tanda \[Farhan\], \[Aqilla\], \[Binar\] menunjukkan pemilik file; (baru) menunjukkan file atau folder yang belum ada.

```
hadirin-app/
├─ .claude/ .expo/ .vscode/        tidak diubah (cek .gitignore oleh Farhan)
├─ assets/  scripts/               tidak diubah
├─ .github/CODEOWNERS              [Farhan] (baru)
├─ src/
│  ├─ app/                          Expo Router
│  │  ├─ _layout.tsx                [Farhan] root stack (termasuk layar scan-qr) + provider state
│  │  ├─ index.tsx                  [Farhan] pilih peran dan identitas
│  │  ├─ scan-qr.tsx                [Binar] layar scan QR, route tipis (baru)
│  │  ├─ sesi/[id].tsx              [Aqilla] detail sesi (baru)
│  │  ├─ (asisten)/                 (baru)
│  │  │  ├─ _layout.tsx             [Farhan] tab asisten
│  │  │  ├─ jadwal.tsx              [Aqilla]
│  │  │  └─ rekap.tsx               [Binar]
│  │  └─ (praktikan)/               (baru)
│  │     ├─ _layout.tsx             [Farhan] tab praktikan
│  │     ├─ jadwal.tsx              [Aqilla]
│  │     └─ riwayat.tsx             [Binar]
│  ├─ components/
│  │  ├─ ui/
│  │  │  ├─ app-button.tsx          [Binar]
│  │  │  ├─ app-card.tsx            [Aqilla]
│  │  │  ├─ status-badge.tsx        [Aqilla]
│  │  │  ├─ empty-state.tsx         [Aqilla]
│  │  │  ├─ confirm-sheet.tsx       [Aqilla]
│  │  │  ├─ info-sheet.tsx          [Aqilla]
│  │  │  └─ toast.tsx               [Farhan]
│  │  ├─ shared/                    (baru)
│  │  │  ├─ identitas-picker.tsx    [Farhan]
│  │  │  ├─ jadwal-list.tsx         [Aqilla]
│  │  │  ├─ sesi-card.tsx           [Aqilla]
│  │  │  └─ detail-sesi.tsx         [Aqilla]
│  │  ├─ asisten/                   (baru)
│  │  │  ├─ panel-aksi-asisten.tsx  [Aqilla]
│  │  │  ├─ qr-sesi-panel.tsx       [Aqilla] tampilan QR sesi (baru)
│  │  │  ├─ rekap-item.tsx          [Binar]
│  │  │  └─ ringkasan-hadir.tsx     [Farhan]
│  │  └─ praktikan/                 (baru)
│  │     ├─ panel-aksi-praktikan.tsx       [Binar]
│  │     ├─ scanner-qr.tsx                 [Binar] kamera dan Simulasi scan (baru)
│  │     ├─ presensi-berhasil-sheet.tsx    [Binar]
│  │     └─ riwayat-item.tsx               [Binar]
│  ├─ constants/
│  │  ├─ theme.ts                   [Binar] (sudah ada)
│  │  └─ status-sesi.ts             [Farhan] (baru)
│  ├─ context/app-context.tsx       [Farhan] (baru)
│  ├─ data/                         [Farhan] dummy-pengguna.ts, dummy-sesi.ts (baru)
│  ├─ hooks/
│  │  ├─ use-app.ts                 [Farhan]
│  │  ├─ use-rekap-sesi.ts          [Binar]
│  │  └─ use-riwayat-kehadiran.ts   [Binar]
│  ├─ types/index.ts                [Farhan] (baru)
│  ├─ utils/
│  │  ├─ format-waktu.ts            [Farhan] (baru)
│  │  └─ qr-payload.ts              [Farhan] (baru)
│  └─ global.css                    [Binar]
├─ app.json, eas.json, package.json, package-lock.json, tsconfig.json   [Farhan]
├─ .gitignore                       [Farhan]
├─ README.md                        [Azka]
└─ AGENTS.md, LICENSE               tidak diubah
```

File contoh bawaan template yang tidak dipakai dibersihkan pada branch scaffold (Tahap 0), dan hanya pada tahap itu.

### A.2 Ringkasan Pembagian Per Anggota

Beban diukur dengan **bobot**, bukan jumlah file. Skala bobot per file: 1 = mudah (konstanta, data, tampilan sederhana), 2 = sedang (layar atau komponen dengan beberapa kondisi), 3 = sulit (aturan bisnis atau interaksi bertahap). Azka tidak memegang file kode, sehingga tidak masuk perbandingan bobot di bawah.

| Anggota | Fokus | File | Total bobot |
| --- | --- | --- | --- |
| Farhan (Programmer 1) | State global, aturan presensi dan validasi QR, data dummy, routing/layout, pemilihan peran dan identitas, konstanta dan util, toast, ringkasan hadir | 15 + konfigurasi dan dokumen repo | 23 |
| Aqilla (Programmer 2) | Jadwal, detail, pengelolaan sesi, tampilan QR asisten, sheet konfirmasi dan info, badge status, empty state, kartu dasar | 13 | 23 |
| Binar (Programmer 3) | Presensi, layar dan komponen scan QR, rekap asisten, riwayat praktikan, tema dan tombol dasar | 13 | 23 |
| Azka (PM) | Koordinasi, review dan merge PR, pengaturan GitHub, pengujian akhir manual, naskah demo, tindak lanjut klien | 0 (tidak mengubah file) | tidak dihitung |

Beban ketiga programmer kini sama, masing-masing 23 poin. Fitur QR menambah 8 poin: Farhan 2 (payload dan validasi), Aqilla 2 (tampilan QR), Binar 4 (layar scan dan scanner). Dua file kecil dipindah agar total tetap sama: app-card ke Aqilla dan ringkasan-hadir ke Farhan. Jumlah kebutuhan yang dipegang tidak sama rata karena beban dihitung dari bobot file.

| Anggota | Kebutuhan yang dipegang | Branch |
| --- | --- | --- |
| Farhan | AKN-1 sampai AKN-4, UIX-1, UIX-5, UIX-10, PRS-7 (aturan validasi), NFR-1, NFR-6, NFR-8, NFR-9 | chore/foundation-state-routing, feature/shared-constants-feedback, feature/role-select-identity |
| Aqilla | JDW-1 sampai JDW-5, SES-1 sampai SES-8, UIX-2, UIX-3, NFR-4 (buka/tutup), NFR-7 (panel asisten) | feature/ui-sheets-feedback, feature/schedule-list-detail, feature/asisten-session-control, feature/asisten-qr-display |
| Binar | PRS-1 sampai PRS-6, PRS-7 (pesan di layar), PRS-8, PRS-9, RKP-1 sampai RKP-6, NFR-2, NFR-3, NFR-4 (presensi), NFR-7 (panel praktikan), NFR-10 | feature/ui-base-theme, feature/praktikan-attendance, feature/praktikan-scan-qr, feature/asisten-attendance-recap, feature/praktikan-attendance-history |
| Azka | Tidak memegang kebutuhan kode; mengawasi UIX-7, NFR-5, dan NFR-9 lewat review dan pengujian | Tidak membuat branch |

UIX-7 dan NFR-5 menjadi tanggung jawab bersama pada file milik masing-masing. NFR-2 dan NFR-3 diterapkan semua programmer memakai tema milik Binar.

### A.3 Daftar File Per Anggota

#### Farhan: State, Routing, Identitas, dan Konfigurasi

| File | Fungsi | Bobot |
| --- | --- | --- |
| src/types/index.ts | Tipe Peran, StatusSesi, Pengguna, Sesi (termasuk kodeQr), Presensi, HasilPresensi | 1 |
| src/data/dummy-pengguna.ts | Daftar identitas dummy praktikan dan asisten | 1 |
| src/data/dummy-sesi.ts | Daftar sesi dummy (nama praktikum, kelas/lab, waktu, status awal, kode QR dummy) | 1 |
| src/context/app-context.tsx | State global, reducer, aksi buka/tutup sesi, aturan presensi termasuk penolakan presensi ganda, dan validasi QR (catatPresensiDariQr) | 4 |
| src/hooks/use-app.ts | Hook akses state global | 1 |
| src/app/\_layout.tsx | Root stack (termasuk layar scan-qr) dan pembungkus provider | 1 |
| src/app/index.tsx | Layar pilih peran dan identitas (form/pilihan) | 2 |
| src/components/shared/identitas-picker.tsx | Pilihan identitas dummy dan tombol ganti peran | 2 |
| src/app/(asisten)/\_layout.tsx | Tab asisten (Jadwal, Rekap) | 1 |
| src/app/(praktikan)/\_layout.tsx | Tab praktikan (Jadwal, Riwayat) | 1 |
| src/constants/status-sesi.ts | Label dan warna status sesi | 1 |
| src/utils/format-waktu.ts | Format waktu kehadiran untuk tampilan | 1 |
| src/utils/qr-payload.ts | Membuat dan membaca payload QR (hadirin:id\_sesi:kode\_qr) | 1 |
| src/components/ui/toast.tsx | Umpan balik singkat | 1 |
| src/components/asisten/ringkasan-hadir.tsx | Ringkasan jumlah hadir | 1 |
| package.json, package-lock.json, app.json, eas.json, tsconfig.json | Konfigurasi proyek, termasuk expo-camera dan pustaka QR | 2 |
| README.md, .gitignore, .github/CODEOWNERS | Dokumentasi dan aturan repo | 1 |

#### Azka (PM): Tugas Non-Kode

| Tugas | Isi |
| --- | --- |
| Koordinasi dan tracker sprint | Memantau status tiap user story di spreadsheet dan memastikan tiap anggota tahu tugasnya. |
| Review Pull Request | Reviewer wajib untuk semua PR; memeriksa kesesuaian dengan PRD dan aturan satu file satu pemilik. |
| Merge Pull Request | Merge ke develop setelah review lolos, dan merge develop ke main setelah uji akhir. |
| Pengaturan GitHub | Branch protection, wajib review, dan mengaktifkan CODEOWNERS lewat pengaturan repo (tanpa mengubah file). |
| Pengujian akhir manual | Menjalankan alur 8.1 sampai 8.5 berurutan dan memeriksa semua kondisi tampilan; temuan dicatat lewat Issue untuk pemilik file, tidak diperbaiki sendiri. |
| Naskah demo | Menyusun urutan dan skrip demo alur utama. |
| Tindak lanjut klien | Menanyakan pertanyaan terbuka di Bab 12 dan mengabarkan jawabannya ke tim. |
| Pengelolaan dokumen | Merawat PRD dan tracker user story. |

#### Aqilla: Jadwal, Detail, Pengelolaan Sesi, dan Sheet

| File | Fungsi | Bobot |
| --- | --- | --- |
| src/app/(asisten)/jadwal.tsx | Daftar jadwal sisi asisten | 1 |
| src/app/(praktikan)/jadwal.tsx | Daftar jadwal sisi praktikan | 1 |
| src/app/sesi/\[id\].tsx | Detail sesi; memasang panel aksi sesuai peran | 2 |
| src/components/shared/jadwal-list.tsx | Daftar jadwal bersama, termasuk empty state | 2 |
| src/components/shared/sesi-card.tsx | Item sesi pada daftar | 2 |
| src/components/shared/detail-sesi.tsx | Isi detail sesi | 2 |
| src/components/asisten/panel-aksi-asisten.tsx | Tombol Buka Sesi dan Tutup Sesi dengan konfirmasi; memasang QrSesiPanel | 3 |
| src/components/asisten/qr-sesi-panel.tsx | QR sesi: pesan sebelum dibuka, QR otomatis saat Dibuka, pesan saat Ditutup, tombol perbesar | 2 |
| src/components/ui/confirm-sheet.tsx | Bottom sheet/modal konfirmasi | 3 |
| src/components/ui/info-sheet.tsx | Bottom sheet/modal informasi pendukung | 2 |
| src/components/ui/status-badge.tsx | Lencana status sesi | 1 |
| src/components/ui/empty-state.tsx | Tampilan kosong yang dapat dipakai ulang | 1 |
| src/components/ui/app-card.tsx | Kartu dasar | 1 |

#### Binar: Presensi, Rekap, Riwayat, dan Tema

| File | Fungsi | Bobot |
| --- | --- | --- |
| src/app/(asisten)/rekap.tsx | Layar rekap per sesi (pemilih sesi, daftar hadir, ringkasan) | 2 |
| src/app/(praktikan)/riwayat.tsx | Layar riwayat kehadiran pribadi | 2 |
| src/components/asisten/rekap-item.tsx | Satu baris praktikan dan waktu hadir | 1 |
| src/components/praktikan/panel-aksi-praktikan.tsx | Tombol Scan QR, status Sudah presensi, pesan penjelas sesi belum dibuka atau ditutup | 3 |
| src/app/scan-qr.tsx | Route layar scan (tipis, merakit ScannerQr) | 1 |
| src/components/praktikan/scanner-qr.tsx | Kamera dan izin kamera, membaca QR, tombol Simulasi scan, pesan QR tidak valid | 3 |
| src/components/praktikan/presensi-berhasil-sheet.tsx | Umpan balik Presensi berhasil | 2 |
| src/components/praktikan/riwayat-item.tsx | Satu baris riwayat: Hadir (waktu) atau Belum presensi | 1 |
| src/hooks/use-rekap-sesi.ts | Data turunan rekap per sesi dari state global | 2 |
| src/hooks/use-riwayat-kehadiran.ts | Data turunan riwayat dari state global | 2 |
| src/components/ui/app-button.tsx | Tombol dasar (area tap besar, kondisi nonaktif) | 2 |
| src/constants/theme.ts dan src/global.css | Warna, ukuran, dan gaya dasar aplikasi | 2 |

### A.4 Kontrak Antar Bagian

Tipe dan hook berikut dibuat Farhan pada Tahap 0 dan dibekukan. Aqilla dan Binar hanya memakainya dan tidak mengubah app-context.tsx maupun types/index.ts. Penamaan di kode memakai camelCase dan memetakan field pada Bab 9.

```ts
// src/types/index.ts
export type Peran = 'PRAKTIKAN' | 'ASISTEN';
export type StatusSesi = 'BELUM_DIBUKA' | 'DIBUKA' | 'DITUTUP';
export type AlasanGagal = 'BELUM_DIBUKA' | 'SUDAH_DITUTUP' | 'SUDAH_PRESENSI' | 'QR_TIDAK_VALID';

export interface Pengguna { idPengguna: string; nama: string; peran: Peran }
export interface Sesi { idSesi: string; namaPraktikum: string; kelasLab: string; waktu: string; statusSesi: StatusSesi; kodeQr: string }
export interface Presensi { idPresensi: string; idSesi: string; idPengguna: string; waktuHadir: string }
export interface HasilPresensi { ok: boolean; alasan: AlasanGagal | null }

// src/utils/qr-payload.ts
//   buatPayloadQr(sesi: Sesi): string   -> 'hadirin:<idSesi>:<kodeQr>'
//   bacaPayloadQr(teks: string): { idSesi: string; kodeQr: string } | null

// src/hooks/use-app.ts  -> useApp() mengembalikan:
//   state:    pengguna, penggunaAktif, sesi, presensi
//   aksi:     pilihIdentitas(idPengguna), gantiPeran(),
//             bukaSesi(idSesi), tutupSesi(idSesi),
//             catatPresensi(idSesi, idPengguna): HasilPresensi,
//             catatPresensiDariQr(payloadQr, idPengguna): HasilPresensi
//   selector: getSesiById(id), getPresensiBySesi(id),
//             getRiwayatPengguna(idPengguna), sudahPresensi(idSesi, idPengguna)
```

Pencegahan presensi ganda dan validasi QR dijaga di dalam aksi catatPresensi dan catatPresensiDariQr (satu sumber kebenaran, milik Farhan). catatPresensiDariQr membaca payload lewat bacaPayloadQr, memeriksa idSesi, kodeQr, dan status sesi, lalu memanggil catatPresensi; kegagalan memakai alasan QR\_TIDAK\_VALID, BELUM\_DIBUKA, SUDAH\_DITUTUP, atau SUDAH\_PRESENSI. Tampilan Binar hanya membaca hasilnya. src/app/sesi/\[id\].tsx (Aqilla) memasang PanelAksiAsisten (Aqilla, yang memasang QrSesiPanel) untuk peran Asisten dan PanelAksiPraktikan (Binar) untuk peran Praktikan. ScannerQr (Binar) mengirim hasil pindai ke catatPresensiDariQr.

Setiap komponen stub memiliki props yang sudah ditentukan sejak Tahap 0 (misalnya AppButton menerima label, onPress, disabled; ConfirmSheet menerima visible, judul, pesan, onKonfirmasi, onBatal), sehingga pemakai tidak perlu menunggu isinya selesai.

### A.5 Urutan Kerja dan Merge

1. **Tahap 0 (awal)**: Azka mengatur repo di GitHub: branch main (dilindungi) dan develop, branch protection, serta wajib review, tanpa mengubah file. Setelah itu Farhan membuat scaffold (sekitar satu jam) di branch chore/foundation-state-routing dari develop: pembersihan file contoh template, pemasangan expo-camera dan pustaka QR, struktur route, tipe (termasuk kodeQr), data dummy, kerangka app-context.tsx dan use-app.ts, .gitignore, README.md, .github/CODEOWNERS, serta stub kosong untuk semua file milik semua programmer dengan props sesuai A.4. Di-merge ke develop lebih dulu. Isi komponen milik Aqilla dan Binar bukan tanggung jawab Farhan.
2. **Tahap 1a (paralel, singkat)**: komponen dasar yang dipakai semua orang dikerjakan lebih dulu. Binar feature/ui-base-theme (tema, global.css, app-button); Aqilla feature/ui-sheets-feedback (confirm-sheet, info-sheet, status-badge, empty-state, app-card); Farhan feature/shared-constants-feedback (status-sesi, format-waktu, qr-payload, toast) dan melengkapi aksi di app-context.tsx, termasuk catatPresensiDariQr. Selama belum selesai, yang lain tetap bisa jalan memakai stub.
3. **Tahap 1b (paralel)**: Farhan feature/role-select-identity; Aqilla feature/schedule-list-detail, feature/asisten-session-control, lalu feature/asisten-qr-display; Binar feature/praktikan-attendance, feature/praktikan-scan-qr, feature/asisten-attendance-recap, dan feature/praktikan-attendance-history. Semua branch dibuat dari develop terbaru dan hanya mengubah file milik sendiri.
4. **Tahap 2**: setiap branch di-merge ke develop lewat Pull Request. Azka mereview dan me-merge; urutan bebas karena tidak ada file yang beririsan. Programmer boleh saling memberi komentar teknis pada PR.
5. **Tahap 3 (uji bersama)**: tiap programmer menguji bagiannya pada Bab 8 dan memperbaikinya lewat branch fix/integration-\<area> pada file miliknya. Farhan menguji pemilihan dan pergantian peran, konsistensi state, dan validasi QR (QR salah, QR sesi lain, QR sesi ditutup, scan ulang); Aqilla menguji alur 8.1 (termasuk QR otomatis tampil dan hilang saat sesi ditutup) dan langkah 3 sampai 5 pada 8.5; Binar menguji alur 8.2 sampai 8.4 (scan kamera, Simulasi scan, izin kamera ditolak) serta langkah 1 dan 2 pada 8.5, termasuk rekap dan riwayat. Azka menguji seluruh alur 8.1 sampai 8.5 berurutan dan semua kondisi tampilan secara manual, mencatat temuan lewat Issue, lalu me-merge develop ke main setelah semuanya lolos.

Branch utama: main (stabil, dilindungi) dan develop (integrasi).

### A.6 Saran Agar Tidak Terjadi Conflict GitHub

- **Satu file, satu pemilik.** Jangan mengubah file milik orang lain; jika butuh perubahan, buat Issue atau minta pemiliknya.
- **Route dibuat tipis.** File di src/app hanya merakit komponen; logika dan tampilan berada di components dan hooks milik masing-masing.
- **Jangan mengganti nama atau memindahkan file** yang dibuat pada Tahap 0, karena route dan impor bergantung pada namanya.
- **Hanya Farhan** yang mengubah package.json, package-lock.json, app.json, eas.json, tsconfig.json, .gitignore, README.md, .github/CODEOWNERS, src/context, src/data, src/types, src/constants/status-sesi.ts, src/utils/format-waktu.ts, dan src/utils/qr-payload.ts. Kebutuhan library baru diajukan ke Farhan.
- **Hanya Binar** yang mengubah src/constants/theme.ts dan src/global.css. Permintaan warna atau gaya baru diajukan ke Binar.
- **Azka tidak mengubah file apa pun di repo.** Ia bekerja lewat GitHub: review, merge, Issue, dan pengaturan repo. Jika menemukan masalah di kode, ia membuat Issue untuk pemilik file.
- **Kontrak tipe dan props dibekukan.** Perubahan pada types/index.ts, aksi useApp(), atau props stub dibicarakan dulu agar tidak merusak kode orang lain.
- **Branch pendek dan fokus**, satu branch per fitur dengan Pull Request kecil dan sering.
- **Sinkron rutin**: jalankan git pull --rebase origin develop sebelum mulai kerja dan sebelum push.
- **Jangan commit langsung ke main atau develop.** Aktifkan branch protection dan wajibkan minimal satu review.
- **Satu konfigurasi format kode bersama** (Prettier/ESLint) agar tidak ada perubahan format massal; jangan memformat ulang file orang lain.
- **Jangan commit node\_modules dan .expo**; periksa .gitignore. Tentukan di awal apakah .vscode dan .claude ikut dibagikan.
- **Pesan commit seragam**, misalnya feat:, fix:, chore:, docs:.
- **Gunakan CODEOWNERS** untuk memetakan folder dan file ke pemiliknya (nama pengguna GitHub diisi tim) agar review otomatis ke orang yang tepat.
- **Jika terjadi konflik**: selesaikan di branch sendiri dengan rebase, jalankan aplikasi untuk memastikan alur demo masih berjalan, lalu push ulang.

## Lampiran B. Ringkasan Perubahan dari v0.1 ke v0.3

### B.1 Perubahan isi

| No | Perubahan | Alasan |
| --- | --- | --- |
| 1 | Nama anggota diisi: Azka (PM), Farhan (P1), Aqilla (P2), Binar (P3). | Nama sebelumnya belum ada. |
| 2 | Kebutuhan bahasa non-formal (UIX-9) dihapus, termasuk poin Gaya Bahasa di Bab 9 lama dan kata “non-formal” di Bab 1 dan Bab 5. | Permintaan tim; brief tidak mewajibkannya. |
| 3 | Kebutuhan dipisah: fungsional di Bab 6, non-fungsional di Bab 7 (NFR-1 sampai NFR-10). | Permintaan tim; sebelumnya UIX-4, UIX-6, dan UIX-8 bercampur dengan kebutuhan fungsional. |
| 4 | UIX-7 memuat kondisi “sesi ditutup”, “QR tidak valid”, dan “izin kamera ditolak”. | Disamakan dengan Bab 4.1 dan alur 8.4. |
| 5 | UIX-10 dinaikkan dari Penting menjadi Wajib; batasan “data presensi tidak wajib selaras” diganti. | Alur demo di brief mengharuskan presensi praktikan muncul di rekap asisten. |
| 6 | Kalimat latar “kegiatan sudah berjalan” dan “belum memiliki software” di Bab 1 dihapus. | Tidak ada di brief. |
| 7 | Ditambahkan asumsi A-8 sampai A-15 (presensi dengan scan QR, satu identitas satu peran, tafsir “sesi yang sama”, tiga status sesi, payload dan validasi QR, batas demo tanpa sinkronisasi, pustaka usulan). | Brief tidak menyebutnya secara eksplisit. |
| 8 | Bab 12: pertanyaan nama produk, nama anggota, dan proses pencatatan saat ini dihapus; pertanyaan konfirmasi QR, scan kamera, peran ganda, dan tafsir “sesi yang sama” ditambahkan. | Nama app bebas menurut brief, nama anggota sudah ada, dan asumsi perlu dikonfirmasi. |
| 9 | Bab 4.2 diisi: database, login sungguhan, sinkronisasi antar perangkat, QR dinamis, dan validasi QR di server. | Sebelumnya kosong. |
| 10 | Kolom PJ ditambahkan pada tabel kebutuhan. | Memudahkan pelacakan tanggung jawab. |
| 11 | Seluruh file kode dibagi ke tiga programmer dengan bobot; PM (Azka) tidak mengubah kode. Setelah fitur QR, beban tetap seimbang: 23, 23, 23. | Permintaan agar PM tidak menyentuh kode dan pembagian tetap adil. |
| 12 | Penomoran bab bergeser: non-fungsional menjadi Bab 7, alur Bab 8, model data Bab 9. Bab 10 sampai 13 tetap. | Akibat pemisahan kebutuhan. |
| 13 | Ditambahkan Lampiran C: referensi belajar (React, flexbox, useState, modal, StyleSheet, navigasi, expo-camera). | Permintaan tim. |
| 14 | Presensi diubah dari tombol menjadi scan QR: QR tampil otomatis di sisi asisten saat sesi dibuka, praktikan memindai QR atau memakai Simulasi scan. | Permintaan tim; data QR dummy karena tanpa database dan tanpa sinkronisasi. |
| 15 | Kebutuhan baru: SES-6 sampai SES-8, PRS-6 sampai PRS-9, NFR-10; field kode\_qr pada Sesi; alasan gagal QR\_TIDAK\_VALID; file baru qr-payload.ts, qr-sesi-panel.tsx, scanner-qr.tsx, scan-qr.tsx. | Akibat fitur QR. |

### B.2 Pemetaan kode kebutuhan

| Kode lama | Kode baru |
| --- | --- |
| AKN, JDW, SES, PRS, RKP | Tidak berubah |
| UIX-1, UIX-2, UIX-3, UIX-5, UIX-7, UIX-10 | Tidak berubah kode (UIX-7 dan UIX-10 isinya direvisi) |
| UIX-4 | NFR-1 |
| UIX-6 | NFR-2 |
| UIX-8 | NFR-3 dan NFR-5 |
| UIX-9 | Dihapus |
| Bab 9 lama (umpan balik, ketahanan, penyimpanan, hak akses) | NFR-4 sampai NFR-7 |

## Lampiran C. Referensi Belajar

Tautan berikut adalah bahan belajar dasar sebelum mengerjakan. Kolom terakhir menunjukkan siapa yang paling memakainya sesuai pembagian di Lampiran A.

| Topik | Tautan | Dipakai pada | Paling relevan untuk |
| --- | --- | --- | --- |
| React fundamental | [reactnative.dev: intro React](https://reactnative.dev/docs/intro-react?language=typescript&guide=android) | Seluruh komponen di src/components | Farhan, Aqilla, Binar |
| Flexbox | [reactnative.dev: flexbox](https://reactnative.dev/docs/flexbox?language=javascript) | NFR-2, tata letak semua layar | Aqilla dan Binar (layar), Farhan (layout tab) |
| useState | [reactnative.dev: handling text input](https://reactnative.dev/docs/handling-text-input) | UIX-1, AKN-2, state lokal komponen | Farhan (form identitas), Aqilla (tampil/sembunyi sheet), Binar (pemilih sesi di rekap) |
| Modal | [reactnative.dev: modal](https://reactnative.dev/docs/modal) | UIX-2, UIX-3, PRS-4 | Aqilla (confirm-sheet, info-sheet), Binar (presensi-berhasil-sheet) |
| StyleSheet | [reactnative.dev: style](https://reactnative.dev/docs/style) | NFR-3, theme.ts, semua komponen | Binar (tema), semua programmer |
| Navigasi | [docs.expo.dev: add navigation](https://docs.expo.dev/tutorial/add-navigation/) | UIX-5, AKN-3 | Farhan (route dan layout), Aqilla (sesi/\[id\]) |

Halaman “handling text input” dipakai sebagai acuan useState sesuai tautan yang diberikan tim.

Tambahan untuk fitur QR: [dokumentasi expo-camera](https://docs.expo.dev/versions/latest/sdk/camera-next/) menjelaskan CameraView dengan barcodeScannerSettings (jenis qr) dan callback onBarcodeScanned, serta menyebut expo-camera sudah termasuk di Expo Go. Dipakai Binar untuk PRS-6. Pustaka untuk menampilkan QR (A-15) dipilih Farhan dan dipakai Aqilla di qr-sesi-panel.tsx. Pastikan versi dokumentasi sesuai SDK Expo di proyek.
