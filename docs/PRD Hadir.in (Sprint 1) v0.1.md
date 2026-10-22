# PRODUCT REQUIREMENTS DOCUMENT (PRD)

## Hadir.in

**STATUS: DRAFT SEMENTARA**

| **Atribut** | **Keterangan** |
| --- | --- |
| **Nama Produk** | Hadir.in – Sistem Informasi Praktikum (nama usulan, belum final; lihat Bab 12) |
| **Versi Dokumen** | v0.1 (Draft Sementara) |
| **Disusun oleh** | Tim Pengembang: PM, Programmer 1, Programmer 2, Programmer 3 (nama anggota belum disebutkan; lihat Bab 12) |
| **Tanggal** | 21 Oktober 2026 |
| **Dokumen Terkait** | User Story Final Sprint 1 (hasil penggabungan tiga catatan kebutuhan klien) |

## 1. Ringkasan Produk (Overview)

Kegiatan praktikum sudah berjalan, tetapi pencatatan kehadirannya belum memiliki software pendukung. Asisten perlu melihat jadwal, membuka sesi ketika praktikum dimulai, memantau kehadiran, dan menutup sesi setelah selesai, sedangkan praktikan perlu mengetahui jadwal dan detail sesi, melakukan presensi, serta melihat catatan kehadirannya. Alat atau proses yang dipakai saat ini tidak disebutkan dalam diskusi (lihat Bab 12).

Hadir.in adalah aplikasi mobile berbasis React Native yang mendemonstrasikan kegiatan tersebut melalui dua sudut pandang pengguna, yaitu Praktikan dan Asisten. Modul utamanya meliputi pemilihan peran dan identitas, jadwal dan detail sesi, pengelolaan sesi (buka dan tutup), presensi, serta rekap kehadiran. Pada Sprint 1 aplikasi berfokus pada antarmuka dan alur, menggunakan data dummy/lokal yang dikelola dengan state tanpa database, dengan tampilan non-formal dan nyaman digunakan di mobile.

## 2. Tujuan & Sasaran (Goals)

- Menyediakan pencatatan kehadiran praktikum yang mudah digunakan oleh asisten dan praktikan.
- Mempermudah asisten mengelola siklus sesi praktikum, mulai dari melihat jadwal, membuka sesi, memantau kehadiran, hingga menutup sesi.
- Memberi praktikan kejelasan informasi jadwal, detail, dan status sesi.
- Memberikan transparansi kehadiran: praktikan dapat melihat catatan kehadirannya sendiri dan asisten dapat melihat daftar hadir beserta waktunya.
- Menjamin kehadiran tercatat secara tertib, yaitu satu praktikan hanya dapat presensi satu kali pada setiap sesi.
- Mendemonstrasikan alur utama secara utuh dan meyakinkan: asisten buka sesi, praktikan presensi, asisten melihat rekap, asisten tutup sesi.

## 3. Pengguna & Peran (Users & Roles)

**Praktikan:** peserta praktikum. Dapat melihat daftar jadwal dan detail sesi, melakukan presensi saat sesi berstatus “Dibuka”, dan melihat catatan kehadirannya sendiri.

**Asisten:** pengelola sesi praktikum. Dapat melihat jadwal dan detail sesi, membuka sesi saat praktikum dimulai, memantau daftar praktikan yang sudah presensi beserta waktunya, dan menutup sesi setelah praktikum selesai.

## 4. Ruang Lingkup (Scope)

### 4.1 Termasuk (MVP)

- Pemilihan peran dan identitas dummy melalui pilihan sederhana di dalam aplikasi, serta penggantian peran tanpa menutup aplikasi.
- Daftar jadwal dan detail sesi (nama praktikum, kelas/lab, waktu, status sesi) untuk kedua peran.
- Pengelolaan sesi oleh asisten (buka dan tutup) dengan konfirmasi, dan perubahan status terlihat di seluruh tampilan terkait.
- Presensi oleh praktikan dengan pencatatan waktu, umpan balik “Presensi berhasil”, dan pencegahan presensi ganda pada sesi yang sama.
- Rekap kehadiran per sesi untuk asisten dan catatan kehadiran pribadi untuk praktikan.
- Penanganan kondisi tampilan: daftar kosong, sesi belum dibuka, sesi ditutup, presensi tercatat atau belum.
- Komponen interaksi: form/pilihan untuk input, modal/bottom sheet untuk konfirmasi dan informasi pendukung.

### 4.2 Di Luar Lingkup Awal / Fase Lanjutan

Belum ada fitur yang ditunda pada tahap ini. Sebagai batasan Sprint 1, aplikasi tidak menggunakan database dan tidak menggunakan login sungguhan. Kelanjutan hal tersebut belum dibahas dan dicatat di Bab 12.

## 5. Asumsi & Batasan (Assumptions & Constraints)

**Batasan yang disebutkan dalam diskusi:**

- Aplikasi dibangun dengan React Native dan berfokus pada antarmuka (kode).
- Tanpa database dan tanpa login sungguhan; seluruh data (identitas pengguna, jadwal, sesi) bersifat dummy/lokal dan perubahan data dikelola dengan state aplikasi.
- Layout disusun dengan flexbox, perpindahan halaman dengan navigasi, dan tampilan merespons tindakan pengguna melalui state.
- Tampilan non-formal dengan UX mobile yang baik.
- Data presensi antara sisi praktikan dan asisten tidak wajib selaras.

**Asumsi pengembang (belum disepakati dengan klien):**

- **\[Asumsi\]** Menggunakan Expo dengan TypeScript (file .tsx dan .ts) sebagai kerangka kerja React Native agar mudah didemokan, sesuai struktur proyek yang sudah ada.
- **\[Asumsi\]** Navigasi menggunakan Expo Router (routing berbasis file di folder src/app) dengan stack dan tab.
- **\[Asumsi\]** State dikelola dengan React Context dan useReducer sebagai satu state global bersama, sehingga alur “praktikan presensi lalu asisten melihat rekap” tampak nyata saat demo. Ini sejalan dengan saran pada user story, tetapi bukan kewajiban.
- **\[Asumsi\]** Waktu kehadiran diambil dari jam perangkat saat tombol presensi ditekan.
- **\[Asumsi\]** Data kembali ke kondisi awal setiap aplikasi dijalankan ulang karena tidak ada penyimpanan permanen.
- **\[Asumsi\]** Demo dilakukan pada satu perangkat dengan berpindah peran melalui fitur ganti peran.
- **\[Asumsi\]** Praktikum diperlakukan sebagai atribut sesi (nama praktikum), bukan entitas terpisah.

## 6. Kebutuhan Fungsional (Functional Requirements)

Seluruh isi user story (US-01 sampai US-07) dirangkum menjadi 13 kebutuhan. Rujukan user story ditulis di akhir tiap kebutuhan. Aturan umum non-fungsional (flexbox, navigasi, data dummy di state, UX mobile, bahasa non-formal) dicantumkan di Bab 5 dan Bab 9.

### 6.1 Pengguna – Pemilihan Peran dan Identitas

| **ID** | **Kebutuhan Fungsional** | **Prioritas** |
| --- | --- | --- |
| **AKN-1** | Pengguna memilih peran (Praktikan atau Asisten) dan identitas dummy melalui form/pilihan pada layar awal, lalu masuk ke tampilan sesuai perannya. (US-01) | **Wajib** |
| **AKN-2** | Pengguna dapat mengganti peran atau identitas tanpa menutup aplikasi. (US-01) | **Wajib** |

### 6.2 Praktikan & Asisten – Jadwal dan Detail Sesi

| **ID** | **Kebutuhan Fungsional** | **Prioritas** |
| --- | --- | --- |
| **JDW-1** | Sistem menampilkan daftar jadwal berisi nama praktikum, kelas/lab, waktu, dan status sesi (“Belum dibuka”, “Dibuka”, “Ditutup”). (US-02) | **Wajib** |
| **JDW-2** | Pengguna dapat membuka halaman detail sesi dengan mengetuk item jadwal. (US-02) | **Wajib** |

### 6.3 Asisten – Pengelolaan Sesi

| **ID** | **Kebutuhan Fungsional** | **Prioritas** |
| --- | --- | --- |
| **SES-1** | Asisten dapat membuka sesi berstatus “Belum dibuka” setelah konfirmasi melalui bottom sheet/modal; status berubah menjadi “Dibuka”. (US-03) | **Wajib** |
| **SES-2** | Asisten dapat menutup sesi berstatus “Dibuka” setelah konfirmasi; status berubah menjadi “Ditutup” dan presensi praktikan nonaktif. (US-04) | **Wajib** |

### 6.4 Praktikan – Presensi

| **ID** | **Kebutuhan Fungsional** | **Prioritas** |
| --- | --- | --- |
| **PRS-1** | Praktikan dapat presensi hanya ketika sesi berstatus “Dibuka”; jika “Belum dibuka” atau “Ditutup”, tombol nonaktif disertai pesan penjelas. (US-05) | **Wajib** |
| **PRS-2** | Saat presensi dilakukan, sistem mencatat waktu kehadiran dan menampilkan umpan balik “Presensi berhasil”. (US-05) | **Wajib** |
| **PRS-3** | Praktikan yang sama tidak dapat presensi dua kali pada sesi yang sama; tampilan berubah menjadi “Sudah presensi” beserta waktunya. (US-05) | **Wajib** |

### 6.5 Asisten & Praktikan – Rekap Kehadiran

| **ID** | **Kebutuhan Fungsional** | **Prioritas** |
| --- | --- | --- |
| **RKP-1** | Asisten dapat melihat rekap per sesi berisi nama praktikan yang sudah presensi, waktu hadir, dan ringkasan jumlah hadir; rekap tetap dapat dilihat setelah sesi ditutup. (US-06) | **Wajib** |
| **RKP-2** | Praktikan dapat melihat riwayat kehadirannya sendiri berupa daftar sesi dengan status “Hadir” (beserta waktu) atau “Belum presensi”. (US-07) | **Wajib** |

### 6.6 Umum – Kondisi Tampilan dan Interaksi

| **ID** | **Kebutuhan Fungsional** | **Prioritas** |
| --- | --- | --- |
| **UIX-1** | Sistem menangani semua kondisi tampilan (daftar jadwal, rekap, atau riwayat kosong; sesi belum dibuka; presensi tercatat atau belum) dan perubahan status sesi langsung terlihat di semua tampilan terkait (jadwal, detail, sisi praktikan). (US-02 sampai US-07) | **Wajib** |
| **UIX-2** | Informasi pendukung ditampilkan melalui modal/bottom sheet. (US-02 sampai US-04) | **Penting** |

## 7. Alur Pengguna Utama (Key User Flows)

### 7.1 Asisten Membuka Sesi

1. Pengguna memilih peran “Asisten” dan identitas dummy pada layar awal.
2. Asisten melihat daftar jadwal beserta status setiap sesi.
3. Asisten mengetuk sesi berstatus “Belum dibuka” untuk melihat detail.
4. Asisten menekan tombol “Buka Sesi”.
5. Sistem menampilkan bottom sheet konfirmasi.
6. Asisten mengonfirmasi, lalu status sesi berubah menjadi “Dibuka” dan terlihat di jadwal, detail, serta sisi praktikan.

### 7.2 Praktikan Melakukan Presensi (Alur Utama)

1. Pengguna berganti ke peran “Praktikan” dan memilih identitas dummy.
2. Praktikan melihat sesi berstatus “Dibuka” pada daftar jadwal dan membuka detailnya.
3. Praktikan menekan tombol presensi.
4. Sistem mencatat waktu kehadiran dan menampilkan umpan balik “Presensi berhasil”.
5. Tombol berubah menjadi status “Sudah presensi” beserta waktu hadir.
6. Praktikan dapat membuka catatan kehadirannya dan melihat sesi tersebut berstatus “Hadir”.

### 7.3 Praktikan Mencoba Presensi Ganda (Pengecualian)

1. Praktikan yang sudah presensi membuka kembali detail sesi yang sama.
2. Sistem menampilkan status “Sudah presensi” beserta waktunya dan tidak menyediakan tombol presensi yang aktif.
3. Presensi kedua pada sesi yang sama ditolak; catatan kehadiran tidak bertambah.

### 7.4 Praktikan Presensi Saat Sesi Belum Dibuka atau Sudah Ditutup (Pengecualian)

1. Praktikan membuka detail sesi berstatus “Belum dibuka” atau “Ditutup”.
2. Tombol presensi nonaktif.
3. Sistem menampilkan pesan penjelas sesuai status sesi.

### 7.5 Asisten Memantau Rekap dan Menutup Sesi

1. Asisten kembali ke peran “Asisten” dan membuka rekap sesi yang berstatus “Dibuka”.
2. Sistem menampilkan daftar praktikan yang sudah presensi beserta waktu hadir dan ringkasan jumlah hadir (atau empty state jika belum ada).
3. Setelah praktikum selesai, asisten menekan tombol “Tutup Sesi”.
4. Sistem menampilkan bottom sheet konfirmasi.
5. Asisten mengonfirmasi, lalu status sesi berubah menjadi “Ditutup” di semua tampilan, tombol presensi praktikan nonaktif, dan rekap tetap dapat dilihat.

## 8. Model Data (High-Level)

Seluruh entitas disimpan sebagai data dummy di state aplikasi (tanpa database).

| **Entitas** | **Field Utama** | **Keterangan** |
| --- | --- | --- |
| **Pengguna** | id\_pengguna, nama, peran | Identitas dummy; peran bernilai Praktikan atau Asisten. |
| **Sesi** | id\_sesi, nama\_praktikum, kelas\_lab, waktu, status\_sesi | status\_sesi bernilai Belum dibuka, Dibuka, atau Ditutup. |
| **Presensi** | id\_presensi, id\_sesi, id\_pengguna, waktu\_hadir | Kombinasi id\_sesi dan id\_pengguna harus unik (satu presensi per praktikan per sesi). |

**Catatan:** belum ada field milik fitur usulan/Fase Lanjutan. Format field waktu (satu waktu atau rentang mulai–selesai) belum diputuskan (Bab 12).

## 9. Kebutuhan Non-Fungsional (Non-Functional Requirements)

**Responsivitas/Mobile:** antarmuka dirancang untuk layar mobile dengan flexbox; area tap cukup besar dan hierarki visual rapi.

**Kejelasan Umpan Balik:** setiap tindakan penting (buka sesi, tutup sesi, presensi) memberi umpan balik visual yang jelas.

**Ketahanan Antarmuka:** minim error antarmuka; seluruh kondisi (kosong, sesi belum dibuka, sesi ditutup, presensi tercatat atau belum) memiliki tampilan yang ditangani.

**Gaya Bahasa:** non-formal dan ramah.

**Penyimpanan Data:** tanpa database; data hanya hidup selama aplikasi berjalan (state).

**Keamanan & Hak Akses:** pemisahan hak berdasarkan peran (hanya asisten yang dapat membuka atau menutup sesi; hanya praktikan yang dapat presensi) pada level tampilan. Tidak ada autentikasi nyata pada Sprint 1.

## 10. Integrasi Pihak Ketiga

Sistem berdiri sendiri dan tidak menggunakan integrasi layanan pihak ketiga pada Sprint 1.

## 11. Fitur Usulan / Fase Lanjutan

Belum ada usulan fase lanjutan.

## 12. Pertanyaan Terbuka / TBD

- Nama produk final: apakah “Hadir.in” disetujui atau ada nama lain?
- Nama lengkap PM dan para programmer yang tercantum pada dokumen.
- Proses atau alat pencatatan kehadiran yang dipakai saat ini (sebagai pembanding dan latar belakang masalah).
- Jumlah dan isi data dummy (praktikum, kelas/lab, praktikan, asisten, sesi) yang diinginkan.
- Format waktu pada sesi: satu waktu mulai atau rentang mulai–selesai, dan apakah memuat tanggal.
- Isi informasi pendukung yang ditampilkan pada modal/bottom sheet (di luar konfirmasi).
- Apakah sesi yang sudah ditutup boleh dibuka kembali.
- Apakah asisten hanya dapat mengelola sesi miliknya atau semua sesi, dan apakah praktikan hanya melihat sesi kelasnya.
- Platform target (Android, iOS, atau keduanya) dan cara demo (emulator atau perangkat fisik).
- Tenggat waktu Sprint 1 dan rincian kriteria penilaian.
- Rencana setelah Sprint 1: database, login sungguhan, dan sinkronisasi data antar perangkat.

## 13. Glosarium

**Praktikum:** kegiatan pembelajaran praktik yang menjadi konteks aplikasi.

**Praktikan:** peserta praktikum.

**Asisten:** pengelola sesi praktikum.

**Sesi:** satu pertemuan praktikum yang memiliki jadwal, kelas/lab, dan status.

**Presensi:** pencatatan kehadiran praktikan pada suatu sesi beserta waktunya.

**Rekap:** daftar praktikan yang sudah presensi pada sebuah sesi (sisi asisten) atau riwayat kehadiran pribadi (sisi praktikan).

**Empty State:** tampilan yang muncul ketika belum ada data untuk ditampilkan.

**Bottom Sheet:** panel yang muncul dari bagian bawah layar untuk konfirmasi atau informasi pendukung.

**State:** data aplikasi yang disimpan di memori dan memicu perubahan tampilan ketika berubah.

**Flexbox:** sistem tata letak React Native untuk menyusun komponen.

## Lampiran A. Pembagian Tugas Tiga Programmer (React Native, Tanpa Database)

Pembagian ini adalah usulan teknis tim pengembang. Seluruh data memakai state (React Context dan useReducer) tanpa database. Prinsip utama: **satu file hanya dimiliki satu programmer**, dan semua file yang saling bergantung dibuat lebih dulu sebagai kerangka (stub) sehingga programmer lain tidak perlu menyentuh file milik orang lain.

### A.1 Ringkasan Pembagian

Pembagian dibuat seimbang menurut jumlah file (9 sampai 10 file per orang) dan tingkat kesulitan. Programmer 1 memegang logika state yang paling sulit dengan layar paling sedikit; Programmer 2 dan 3 memegang lebih banyak layar dan komponen tampilan. Semua kebutuhan di Bab 6 tercakup.

| **Programmer** | **Fokus** | **File** | **Branch** | **Kebutuhan** |
| --- | --- | --- | --- | --- |
| **Programmer 1** | State global, aturan sesi dan presensi, data dummy, routing, pemilihan peran | 9 (+ konfigurasi) | `chore/foundation-state-routing`, `feature/role-select` | AKN-1, AKN-2, logika state untuk SES-1, SES-2, PRS-1 sampai PRS-3, UIX-1 |
| **Programmer 2** | Jadwal, detail sesi, buka/tutup sesi oleh asisten, sheet konfirmasi dan info | 10 | `feature/schedule-detail`, `feature/asisten-session-control` | JDW-1, JDW-2, SES-1, SES-2 (tampilan), UIX-2 |
| **Programmer 3** | Presensi praktikan, rekap asisten, riwayat praktikan, tema dan komponen dasar | 10 | `feature/ui-base-theme`, `feature/praktikan-attendance`, `feature/recap-history` | PRS-1 sampai PRS-3 (tampilan), RKP-1, RKP-2 |

Folder baru yang dibuat pada Tahap 0: `src/context`, `src/data`, `src/types`, `src/utils`, `src/components/shared`, `src/components/asisten`, `src/components/praktikan`, serta route `src/app/(asisten)`, `src/app/(praktikan)`, dan `src/app/sesi`. File contoh bawaan template yang tidak dipakai dibersihkan pada Tahap 0 saja. File `.tsx` untuk yang memuat JSX, `.ts` untuk sisanya, dengan penamaan kebab-case.

### A.2 Daftar File Per Programmer

**Programmer 1: State, Routing, dan Identitas**

| **File** | **Fungsi** |
| --- | --- |
| `src/types/index.ts` | Tipe Peran, StatusSesi, Pengguna, Sesi, Presensi, HasilPresensi |
| `src/data/dummy.ts` | Identitas dummy dan sesi dummy |
| `src/utils/format-waktu.ts` | Format waktu kehadiran |
| `src/context/app-context.tsx` | State global, aksi buka/tutup sesi, aturan presensi (termasuk penolakan presensi ganda), dan selector rekap/riwayat |
| `src/hooks/use-app.ts` | Hook akses state global |
| `src/app/_layout.tsx` | Root stack dan provider |
| `src/app/index.tsx` | Layar pilih peran dan identitas (form/pilihan) serta ganti peran |
| `src/app/(asisten)/_layout.tsx` | Tab asisten (Jadwal, Rekap) |
| `src/app/(praktikan)/_layout.tsx` | Tab praktikan (Jadwal, Riwayat) |
| `package.json`, `package-lock.json`, `app.json`, `tsconfig.json`, `.gitignore`, `README.md` | Konfigurasi proyek |

**Programmer 2: Jadwal, Detail, dan Pengelolaan Sesi**

| **File** | **Fungsi** |
| --- | --- |
| `src/app/(asisten)/jadwal.tsx` | Jadwal sisi asisten |
| `src/app/(praktikan)/jadwal.tsx` | Jadwal sisi praktikan |
| `src/app/sesi/[id].tsx` | Detail sesi; memasang panel aksi sesuai peran |
| `src/components/shared/jadwal-list.tsx` | Daftar jadwal bersama |
| `src/components/shared/sesi-card.tsx` | Item sesi pada daftar |
| `src/components/asisten/panel-aksi-asisten.tsx` | Tombol Buka Sesi dan Tutup Sesi dengan konfirmasi |
| `src/components/ui/status-badge.tsx` | Lencana status sesi |
| `src/components/ui/empty-state.tsx` | Tampilan kosong yang dapat dipakai ulang |
| `src/components/ui/confirm-sheet.tsx` | Bottom sheet/modal konfirmasi |
| `src/components/ui/info-sheet.tsx` | Bottom sheet/modal informasi pendukung |

**Programmer 3: Presensi, Rekap, Riwayat, dan Tema**

| **File** | **Fungsi** |
| --- | --- |
| `src/app/(asisten)/rekap.tsx` | Layar rekap per sesi (pemilih sesi, daftar hadir, ringkasan jumlah) |
| `src/app/(praktikan)/riwayat.tsx` | Layar riwayat kehadiran pribadi |
| `src/components/asisten/rekap-item.tsx` | Satu baris praktikan dan waktu hadir |
| `src/components/praktikan/panel-aksi-praktikan.tsx` | Tombol presensi, status Sudah presensi, dan pesan penjelas |
| `src/components/praktikan/riwayat-item.tsx` | Satu baris riwayat: Hadir (waktu) atau Belum presensi |
| `src/components/ui/toast.tsx` | Umpan balik Presensi berhasil |
| `src/components/ui/app-button.tsx` | Tombol dasar (area tap besar, kondisi nonaktif) |
| `src/components/ui/app-card.tsx` | Kartu dasar |
| `src/constants/theme.ts` | Warna dan ukuran dasar (file sudah ada) |
| `src/global.css` | Gaya dasar |

### A.3 Kontrak Antar Bagian

Dibuat Programmer 1 pada Tahap 0 dan dibekukan. Programmer 2 dan 3 hanya memakainya dan tidak mengubah `app-context.tsx` maupun `types/index.ts`. Setiap komponen stub juga sudah memiliki props tetap sejak Tahap 0 (misalnya `AppButton` menerima `label`, `onPress`, `disabled`) sehingga pemakainya tidak perlu menunggu isinya selesai.

```ts
// src/types/index.ts
export type Peran = 'PRAKTIKAN' | 'ASISTEN';
export type StatusSesi = 'BELUM_DIBUKA' | 'DIBUKA' | 'DITUTUP';
export type AlasanGagal = 'BELUM_DIBUKA' | 'SUDAH_DITUTUP' | 'SUDAH_PRESENSI';

export interface Pengguna { idPengguna: string; nama: string; peran: Peran }
export interface Sesi { idSesi: string; namaPraktikum: string; kelasLab: string; waktu: string; statusSesi: StatusSesi }
export interface Presensi { idPresensi: string; idSesi: string; idPengguna: string; waktuHadir: string }
export interface HasilPresensi { ok: boolean; alasan: AlasanGagal | null }

// useApp() mengembalikan:
//   state:    pengguna, penggunaAktif, sesi, presensi
//   aksi:     pilihIdentitas(id), gantiPeran(), bukaSesi(idSesi), tutupSesi(idSesi),
//             catatPresensi(idSesi, idPengguna): HasilPresensi
//   selector: getSesiById(id), getPresensiBySesi(id), getRiwayatPengguna(id),
//             sudahPresensi(idSesi, idPengguna)
```

Pencegahan presensi ganda dijaga di dalam `catatPresensi` (satu sumber kebenaran); tampilan hanya membaca hasilnya. `src/app/sesi/[id].tsx` (Programmer 2) memasang `PanelAksiAsisten` (Programmer 2) untuk Asisten dan `PanelAksiPraktikan` (Programmer 3) untuk Praktikan.

### A.4 Urutan Kerja

1. **Tahap 0 (sekitar satu jam, Programmer 1):** branch `chore/foundation-state-routing` dari `develop` berisi pembersihan template, struktur route, tipe, data dummy, kerangka `app-context.tsx`, dan **stub kosong untuk semua file** milik semua programmer. Di-merge ke `develop` lebih dulu.
2. **Tahap 1 (paralel):** tiap programmer membuat branch dari `develop` terbaru dan hanya mengubah file miliknya. Programmer 3 mengerjakan `app-button`, `app-card`, dan tema lebih dulu karena dipakai semua.
3. **Tahap 2:** setiap branch di-merge ke `develop` lewat Pull Request; urutan bebas karena tidak ada file yang beririsan.
4. **Tahap 3 (uji bersama):** Programmer 1 menguji pemilihan dan pergantian peran; Programmer 2 menguji alur 7.1 dan langkah 3 sampai 5 pada 7.5; Programmer 3 menguji alur 7.2 sampai 7.4 serta rekap dan riwayat. Perbaikan lewat branch `fix/integration-<area>` pada file milik sendiri. Setelah lolos, `develop` di-merge ke `main`.

Branch utama: `main` (stabil, dilindungi) dan `develop` (integrasi).

### A.5 Saran Agar Tidak Terjadi Conflict GitHub

- **Satu file, satu pemilik.** Butuh perubahan di file orang lain? Buat Issue atau minta pemiliknya.
- **Route dibuat tipis.** File di `src/app` hanya merakit komponen; isi tampilan ada di `components` milik masing-masing.
- **Jangan mengganti nama atau memindahkan file** yang dibuat pada Tahap 0.
- **Hanya Programmer 1** yang mengubah file konfigurasi, `context`, `data`, dan `types`; library baru diajukan ke Programmer 1. **Hanya Programmer 3** yang mengubah `theme.ts` dan `global.css`.
- **Kontrak tipe dan props dibekukan;** perubahan dibicarakan dulu.
- **Branch pendek, Pull Request kecil,** dan jalankan `git pull --rebase origin develop` sebelum mulai dan sebelum push.
- **Jangan commit langsung ke `main` atau `develop`;** aktifkan branch protection dengan minimal satu review.
- **Jangan commit** `node_modules` dan `.expo`, dan jangan memformat ulang file orang lain.

## Lampiran B. Struktur Folder Proyek

Struktur mengikuti proyek yang sudah ada (Expo, TypeScript, Expo Router). Tanda `[P1]`, `[P2]`, `[P3]` menunjukkan pemilik file. Folder dan file yang belum ada dibuat pada Tahap 0 oleh Programmer 1. File contoh bawaan template yang tidak dipakai dibersihkan pada tahap itu saja.

```
hadirin-app/
├─ .claude/ .expo/ .vscode/        tidak diubah
├─ assets/                          tidak diubah kecuali perlu ikon/gambar
├─ scripts/                         tidak diubah
├─ src/
│  ├─ app/                          Expo Router
│  │  ├─ _layout.tsx                [P1] root stack + provider state
│  │  ├─ index.tsx                  [P1] pilih peran dan identitas
│  │  ├─ sesi/[id].tsx              [P2] detail sesi
│  │  ├─ (asisten)/
│  │  │  ├─ _layout.tsx             [P1] tab asisten
│  │  │  ├─ jadwal.tsx              [P2]
│  │  │  └─ rekap.tsx               [P3]
│  │  └─ (praktikan)/
│  │     ├─ _layout.tsx             [P1] tab praktikan
│  │     ├─ jadwal.tsx              [P2]
│  │     └─ riwayat.tsx             [P3]
│  ├─ components/
│  │  ├─ ui/
│  │  │  ├─ app-button.tsx          [P3]
│  │  │  ├─ app-card.tsx            [P3]
│  │  │  ├─ toast.tsx               [P3]
│  │  │  ├─ status-badge.tsx        [P2]
│  │  │  ├─ empty-state.tsx         [P2]
│  │  │  ├─ confirm-sheet.tsx       [P2]
│  │  │  └─ info-sheet.tsx          [P2]
│  │  ├─ shared/
│  │  │  ├─ jadwal-list.tsx         [P2]
│  │  │  └─ sesi-card.tsx           [P2]
│  │  ├─ asisten/
│  │  │  ├─ panel-aksi-asisten.tsx  [P2]
│  │  │  └─ rekap-item.tsx          [P3]
│  │  └─ praktikan/
│  │     ├─ panel-aksi-praktikan.tsx  [P3]
│  │     └─ riwayat-item.tsx          [P3]
│  ├─ constants/theme.ts            [P3]
│  ├─ context/app-context.tsx       [P1]
│  ├─ data/dummy.ts                 [P1]
│  ├─ hooks/use-app.ts              [P1]
│  ├─ types/index.ts                [P1]
│  ├─ utils/format-waktu.ts         [P1]
│  └─ global.css                    [P3]
├─ app.json, eas.json, package.json, package-lock.json, tsconfig.json,
│  .gitignore, README.md            [P1]
├─ AGENTS.md                        [P1] isinya di Lampiran C
└─ LICENSE                          tidak diubah
```

Jumlah file: Programmer 1 sembilan file (+ konfigurasi dan `AGENTS.md`), Programmer 2 sepuluh file, Programmer 3 sepuluh file.

## Lampiran C. Isi AGENTS.md

Isi berikut disalin ke `AGENTS.md` di akar proyek agar AI coding (misalnya Claude Code) membaca konteks, aturan, dan kontrak yang sama pada setiap sesi. Sebelum bekerja, sebutkan kepada AI kamu Programmer 1, 2, atau 3.

```markdown
# Hadir.in – Panduan untuk AI Coding

## Konteks
Aplikasi mobile Sistem Informasi Praktikum dengan dua peran: Praktikan dan Asisten.
Stack: Expo, TypeScript, Expo Router, dijalankan di Expo Go.
Tanpa database dan tanpa login sungguhan: semua data dummy di state (React Context).
Fokus Sprint 1: antarmuka dan alur. Bahasa antarmuka non-formal dan ramah.

## Aturan Wajib
- Tanyakan dulu kamu bekerja sebagai Programmer 1, 2, atau 3. Hanya ubah file milikmu (lihat Pemilik File).
- Jangan pasang library baru dan jangan ubah package.json, app.json, tsconfig.json.
- Jangan ubah types/index.ts dan kontrak useApp(); perubahan dibicarakan dulu.
- File dengan JSX memakai .tsx, selain itu .ts. Nama file kebab-case.
- Tata letak dengan flexbox. Area tap minimal 44 px. Setiap aksi penting memberi umpan balik.
- Tangani semua kondisi: daftar kosong, sesi belum dibuka, sesi ditutup, presensi tercatat atau belum.
- Route di src/app dibuat tipis: hanya merakit komponen.
- Setelah selesai tiap tugas: jalankan npx tsc --noEmit, lalu cek di Expo Go.

## Kebutuhan Fungsional (Wajib kecuali tertulis lain)
- AKN-1: pilih peran dan identitas dummy lewat form/pilihan, lalu masuk ke tampilan sesuai peran.
- AKN-2: ganti peran atau identitas tanpa menutup app.
- JDW-1: daftar jadwal berisi nama praktikum, kelas/lab, waktu, status sesi.
- JDW-2: tap item membuka detail sesi.
- SES-1: asisten buka sesi “Belum dibuka” dengan konfirmasi bottom sheet; status jadi “Dibuka”.
- SES-2: asisten tutup sesi “Dibuka” dengan konfirmasi; status jadi “Ditutup”, presensi nonaktif.
- PRS-1: presensi hanya saat “Dibuka”; selain itu tombol nonaktif dengan pesan penjelas.
- PRS-2: presensi mencatat waktu dan menampilkan “Presensi berhasil”.
- PRS-3: presensi kedua di sesi yang sama ditolak; tampil “Sudah presensi” + waktunya.
- RKP-1: asisten melihat rekap per sesi (nama, waktu hadir, jumlah hadir); tetap bisa dilihat setelah ditutup.
- RKP-2: praktikan melihat riwayat sendiri: “Hadir” (waktu) atau “Belum presensi”.
- UIX-1: semua kondisi tampilan ditangani; perubahan status sesi terlihat di semua tampilan terkait.
- UIX-2 (Penting): informasi pendukung lewat modal/bottom sheet.

## Aturan Bisnis
- Status sesi hanya BELUM_DIBUKA, DIBUKA, DITUTUP. Alurnya satu arah: BELUM_DIBUKA ke DIBUKA ke DITUTUP.
- Buka sesi hanya dari BELUM_DIBUKA; tutup sesi hanya dari DIBUKA.
- Satu praktikan hanya bisa presensi satu kali per sesi. Penolakan dijaga di catatPresensi, bukan di tampilan.
- Waktu hadir diambil dari jam perangkat saat presensi.
- Data kembali ke kondisi awal saat app dijalankan ulang.

## Tipe dan Kontrak (src/types/index.ts dan useApp)
- Peran = 'PRAKTIKAN' | 'ASISTEN'
- StatusSesi = 'BELUM_DIBUKA' | 'DIBUKA' | 'DITUTUP'
- AlasanGagal = 'BELUM_DIBUKA' | 'SUDAH_DITUTUP' | 'SUDAH_PRESENSI'
- Pengguna = { idPengguna, nama, peran }
- Sesi = { idSesi, namaPraktikum, kelasLab, waktu, statusSesi }
- Presensi = { idPresensi, idSesi, idPengguna, waktuHadir }
- HasilPresensi = { ok: boolean, alasan: AlasanGagal | null }
- useApp() mengembalikan state (pengguna, penggunaAktif, sesi, presensi),
  aksi (pilihIdentitas, gantiPeran, bukaSesi, tutupSesi, catatPresensi),
  dan selector (getSesiById, getPresensiBySesi, getRiwayatPengguna, sudahPresensi).

## Pemilik File
- P1: types/index.ts, data/dummy.ts, utils/format-waktu.ts, context/app-context.tsx, hooks/use-app.ts,
  app/_layout.tsx, app/index.tsx, app/(asisten)/_layout.tsx, app/(praktikan)/_layout.tsx, file konfigurasi, AGENTS.md.
- P2: app/(asisten)/jadwal.tsx, app/(praktikan)/jadwal.tsx, app/sesi/[id].tsx,
  components/shared/jadwal-list.tsx, components/shared/sesi-card.tsx, components/asisten/panel-aksi-asisten.tsx,
  components/ui/status-badge.tsx, empty-state.tsx, confirm-sheet.tsx, info-sheet.tsx.
- P3: app/(asisten)/rekap.tsx, app/(praktikan)/riwayat.tsx, components/asisten/rekap-item.tsx,
  components/praktikan/panel-aksi-praktikan.tsx, components/praktikan/riwayat-item.tsx,
  components/ui/toast.tsx, app-button.tsx, app-card.tsx, constants/theme.ts, global.css.

## Alur Demo (kriteria selesai)
1. Asisten pilih peran, lihat jadwal, buka sesi (dengan konfirmasi).
2. Ganti ke Praktikan, lihat sesi “Dibuka”, presensi, muncul “Presensi berhasil”.
3. Coba presensi lagi: ditolak (sudah presensi).
4. Kembali ke Asisten, lihat rekap (nama dan waktu hadir).
5. Asisten tutup sesi: status berubah di semua tampilan.
```

*Dokumen ini merupakan draft sementara dan dapat berubah seiring pembahasan lebih lanjut dengan klien.*
