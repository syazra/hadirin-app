# Audit rencana integrasi Hadir.in

Audit tanggal 25 Oktober 2026 terhadap `origin/develop` pada commit
`8b6ab57`, setelah memperbarui remote refs. Sumber rencana adalah dokumen
"Rencana Perbaikan Hadir.in (develop), Versi Final". Implementasi pada branch
`fix/integration-data-utils` mencakup data awal dan utilitas bersama milik
Farhan. Perbaikan riwayat dan detail sesi tetap menjadi pekerjaan berikutnya.

## Kesimpulan audit

Rencana dapat diterapkan tanpa mengubah tipe inti, signature aksi, atau selector
context. `getRiwayatPengguna(idPengguna)` sudah memfilter presensi berdasarkan
pengguna. State sesi dan presensi juga sudah bertahan saat ganti identitas/peran.
Ada beberapa koreksi pada daftar file dan kontrak tampilan yang perlu dibawa ke
branch lanjutan sebelum menjalankan seluruh urutan demo.

| Prioritas | Temuan pada develop | Tindak lanjut |
| --- | --- | --- |
| P1 | `use-riwayat-kehadiran.ts` masih memetakan seluruh sesi dan menghasilkan `presensi: null`. Data awal saja tidak akan membuat riwayat Raka/Salsa kosong. | Binar: hanya gabungkan sesi dengan presensi milik pengguna, lalu urutkan timestamp menurun. Tampilan kosong dan ringkasan diperbaiki pada branch riwayat. |
| P1 | Detail sesi memilih panel dari query `peran`. Pengirim query sebenarnya ada di `src/app/(asisten)/jadwal-asisten.tsx` dan `src/app/(praktikan)/jadwal-praktikan.tsx`; `JadwalList` dan `SesiCard` hanya memanggil callback. | Aqilla: tambahkan kedua route jadwal tersebut ke cakupan branch detail, lalu gunakan `penggunaAktif?.peran` di detail. |
| P1 | PRD v0.2 dan README masih mendefinisikan RKP-5 sebagai semua sesi beserta "Belum presensi". PRD juga masih mewajibkan kebutuhan kamera yang ditunda oleh rencana. | Azka: selaraskan PRD, user story, README, dan tracker. Validasi brief klien sebelum mengubah perilaku riwayat; brief tersebut tidak tersedia untuk audit ini. |
| P2 | Contoh presensi 20 Okt 2026 adalah Selasa, sedangkan S001 dijadwalkan Senin. Sesi A/B/C juga belum dipetakan ke ID repo. | Diselesaikan di branch ini: A=S001 ditutup, B=S002 dibuka, C=S003 belum dibuka. Presensi Dewi memakai Senin 19 Okt 2026, 09.15 WIB. Jadwal dan kode QR dipertahankan. |
| P2 | Mengisi `status-sesi.ts` saja tidak mengubah badge karena `StatusBadge` memiliki konfigurasi dan warna sendiri. | Diselesaikan di branch ini: badge membaca konstanta lengkap dengan warna dari token tema yang sudah ada. Tidak perlu token baru. |
| P2 | `PresensiBerhasilSheet` menerima `waktuPresensi` yang sudah diformat oleh `scanner-qr.tsx`. Detail sesi juga memformat waktu sendiri. Memanggil formatter ISO di sheet terhadap teks jam saja akan menghasilkan fallback. | Binar: format timestamp presensi yang benar dari context di scanner, lalu teruskan hasilnya ke sheet. Aqilla: gunakan formatter yang sama di detail. Tetapkan satu tempat pemformatan untuk tiap alur. |
| P2 | Pengujian context lama mengasumsikan presensi awal kosong dan S001 belum dibuka. | Diselesaikan di branch ini: sesuaikan pengujian lifecycle ke S003 dan reload mengembalikan seed, bukan menghapus seluruh presensi. |
| P2 | Presensi Dewi di Sesi A tidak dapat dipakai untuk menguji alasan gagal `SUDAH_PRESENSI` karena sesi sudah ditutup; validasi status berjalan lebih dahulu. | Uji penolakan duplikat setelah berhasil Simulasi Scan di Sesi B yang masih dibuka. Presensi awal di Sesi A tetap menguji catatan hadir yang sudah ada. |

## Kontrak yang tersedia untuk integrasi berikutnya

| Data atau komponen | Kontrak |
| --- | --- |
| Pengguna | A001 Bima dan A002 Laras adalah asisten; P001 Dewi, P002 Raka, P003 Salsa adalah praktikan. ID lama tetap. |
| Presensi awal | Tepat satu record: `presensi:S001:P001`, Dewi di S001. Timestamp ISO UTC `2026-10-19T02:15:00.000Z` setara 19 Okt 2026, 09.15 WIB dan lebih lama dari tanggal audit/demo acuan. |
| Context | `createInitialState()` menyalin objek data awal. Memilih identitas tidak menambah/menghapus presensi. Reload mengembalikan satu record awal; tambahan dari simulasi hilang. Selector dan aksi tetap memakai kontrak sebelumnya. |
| `formatWaktu(waktu)` | Menerima string ISO, `null`, atau `undefined`. Format `20 Okt 2026, 09.15`, memakai zona waktu lokal perangkat. Input kosong atau tanggal yang tidak dapat diparse menghasilkan `-`. Label jadwal `Sesi.waktu` tidak diproses oleh utilitas ini. |
| `STATUS_SESI` | Ketiga status wajib tersedia. Properti `label`, `warna`, `warnaLatar`; warna memakai pasangan warning, success, danger dari `Colors.light`, sesuai tema layar yang ada. |
| `RingkasanHadir` | `jumlahHadir: number`, `label?: string` (default `Jumlah hadir`), `satuan?: string` (default `praktikan`). Label aksesibilitas mengikuti teks dan jumlah. Binar dapat langsung memakai `<RingkasanHadir jumlahHadir={rekap.jumlahHadir} />`. |
| `EmptyState` yang sudah ada | Props sebenarnya `judul`, `pesan`, `emoji?`. Teks umum sudah didukung; gunakan `pesan` untuk deskripsi riwayat. Tidak perlu komponen baru. |
| `InfoSheet` yang sudah ada | Props `visible`, `judul`, `pesan`, `onTutup`, `labelTutup?`. Langkah bantuan sebaiknya menyebut Simulasi Scan sesuai keputusan penundaan kamera. |
| Payload QR | `buatPayloadQr(sesi)` dan `bacaPayloadQr(payload)` sudah diimplementasikan. Pemakaian builder di scanner dan panel QR tetap perlu diintegrasikan oleh pemilik file. |
| Toast | Stub dipertahankan, dengan komentar `ditunda, tidak dipakai di Sprint 1`. |

## Batas verifikasi

Branch ini juga menghapus import tak terpakai pada scanner dan sesi-card agar
lint bersih; perilaku kedua komponen tidak diubah. Tidak ada dependency baru.
Pengujian context mencakup seed, isolasi data saat reload, selector per pengguna
dan sesi, lifecycle sesi, penolakan presensi ganda, pergantian identitas, serta
format waktu valid dan fallback.

Demo lengkap untuk empty state, urutan terbaru di atas, pemakaian RingkasanHadir
di rekap, dan panel detail berdasarkan identitas harus diulang setelah branch
Binar dan Aqilla diintegrasikan. Lulusnya pemeriksaan branch ini belum berarti
seluruh rencana sudah selesai. Tanggal demo sebenarnya dan kebutuhan pemilik
sesi per asisten tetap perlu dikonfirmasi oleh tim.
