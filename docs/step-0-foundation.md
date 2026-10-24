# Fondasi Step 0 Hadir.in

Branch `chore/foundation-state-routing` dibuat dari `origin/develop`.
Pemilik fondasi Farhan. README dan CODEOWNERS mengikuti tracker (Azka).

## Batas pekerjaan

Step 0 menyiapkan tipe, data dummy, provider state di root, kontrak hook, route,
konfigurasi kamera/QR, dan stub. UI identitas, aturan sesi/presensi, validasi QR,
rekap/riwayat, dan scanner lengkap tetap pada tahap berikutnya.

State hanya hidup selama AppProvider terpasang. Reload membuat state awal baru.
Ganti identitas/peran tidak mereset sesi atau presensi. Fast Refresh selama
development dapat mempertahankan state; gunakan reload untuk reset demo.

## Route dan kepemilikan

| File di src/app | URL | Pemilik |
| --- | --- | --- |
| index.tsx | / | Farhan |
| (asisten)/_layout.tsx | Layout tab Asisten | Farhan |
| (asisten)/jadwal-asisten.tsx | /jadwal-asisten | Aqilla |
| (asisten)/rekap.tsx | /rekap | Binar |
| (praktikan)/_layout.tsx | Layout tab Praktikan | Farhan |
| (praktikan)/jadwal-praktikan.tsx | /jadwal-praktikan | Aqilla |
| (praktikan)/riwayat.tsx | /riwayat | Binar |
| sesi/[id].tsx | /sesi/S001 | Aqilla |
| scan-qr.tsx | /scan-qr?idSesi=S001 | Binar |

Nama jadwal mengikuti branch Aqilla yang sudah ada, bukan dua jadwal.tsx pada
contoh PRD. Route group tidak masuk URL. URL jadwal dibedakan agar pembukaan dari
tautan langsung tidak ambigu. Label tab keduanya tetap Jadwal.

Scanner memakai parameter idSesi; detail memakai id. Pembatasan peran pada UI
menunggu fitur identitas dan panel aksi. Shell saat ini bukan autentikasi final.

## Kontrak state

Tipe inti di src/types/index.ts mengikuti A.4: Peran, StatusSesi, AlasanGagal,
Pengguna, Sesi, Presensi, HasilPresensi. Waktu sesi adalah label jadwal;
waktuHadir nantinya string ISO dari jam perangkat.

useApp() mengembalikan field langsung, bukan dibungkus properti state:

| Field atau aksi | Kontrak | Kondisi Step 0 |
| --- | --- | --- |
| pengguna | Pengguna[] | Data dummy |
| penggunaAktif | Pengguna atau null | Awalnya null |
| sesi | Sesi[] | Data dummy tiga status |
| presensi | Presensi[] | Awalnya kosong |
| pilihIdentitas(idPengguna) | void | ID valid dipilih; ID asing diabaikan |
| gantiPeran() | void | Menghapus identitas aktif saja |
| bukaSesi(idSesi) | void | Stub Tahap 1a |
| tutupSesi(idSesi) | void | Stub Tahap 1a |
| catatPresensi(idSesi, idPengguna) | HasilPresensi | Stub Tahap 1a |
| catatPresensiDariQr(payloadQr, idPengguna) | HasilPresensi | Stub Tahap 1a |
| getSesiById(id) | Sesi atau undefined | Selector tersedia |
| getPresensiBySesi(id) | Presensi[] | Selector tersedia |
| getRiwayatPengguna(idPengguna) | Presensi[] | Catatan yang sudah ada saja |
| sudahPresensi(idSesi, idPengguna) | boolean | Selector tersedia |

Empat aksi sesi/presensi stub melempar error eksplisit jika dipanggil. Jangan
hubungkan ke tombol sebelum Tahap 1a. Stub tidak memberi sukses palsu atau
mengubah presensi. bacaPayloadQr sementara selalu null; buatPayloadQr melempar
error sampai Tahap 1a. formatWaktu sementara passthrough.

useRekapSesi(idSesi) milik Binar mengembalikan RekapSesi:
{ daftarHadir: ItemRekapSesi[], jumlahHadir: number }.
ItemRekapSesi berisi { pengguna, presensi }.

useRiwayatKehadiran(idPengguna) milik Binar mengembalikan
ItemRiwayatKehadiran[], dengan item { sesi, presensi: Presensi | null }.
Nantinya semua sesi digabung dengan presensi pengguna agar sesi belum presensi
ikut tampil. Kedua hook saat ini stub kosong, bukan hasil rekap final.

## Kontrak komponen

Komponen yang sudah ada di branch tim disalin tanpa mengubah sumbernya.
Props yang sudah dipakai tim didahulukan dari contoh props PRD.

| Komponen | Props utama | Pemilik |
| --- | --- | --- |
| AppButton | title, onPress?, variant?, size?, loading?, disabled?, fullWidth?, style?, textStyle?, PressableProps | Binar |
| AppCard | children, style?, onPress?, disabled? | Aqilla |
| ConfirmSheet | visible, judul, pesan, onKonfirmasi, onBatal, labelKonfirmasi?, labelBatal?, loading? | Aqilla |
| InfoSheet | visible, judul, pesan, onTutup, labelTutup? | Aqilla |
| StatusBadge | status: StatusSesi | Aqilla |
| EmptyState | judul, pesan, emoji? | Aqilla |
| SesiCard | namaPraktikum, kelasLab, waktu, statusSesi, onPress | Aqilla |
| JadwalList | sesi: ItemJadwal[], onPilihSesi(idSesi) | Aqilla |
| DetailSesi | namaPraktikum, kelasLab, waktu, statusSesi | Aqilla |
| PanelAksiAsisten | sesi: Sesi | Aqilla, stub |
| QrSesiPanel | sesi: Sesi | Aqilla, stub |
| PanelAksiPraktikan | statusSesi, sudahPresensi?, waktuPresensi?, onPressPresensi | Binar |
| PresensiBerhasilSheet | visible, berhasil, judul, pesan, waktuPresensi?, onClose | Binar |
| ScannerQr | idSesi, onBerhasil(), onBatal() | Binar, stub |
| RekapItem | pengguna: Pengguna, presensi: Presensi | Binar, stub |
| RiwayatItem | sesi: Sesi, presensi: Presensi atau null | Binar, stub |
| IdentitasPicker | pengguna, penggunaAktif, onPilihIdentitas(idPengguna), onGantiPeran() | Farhan, stub |
| RingkasanHadir | jumlahHadir: number | Farhan, stub |
| Toast | visible, pesan, onTutup() | Farhan, stub |

LayarPersiapan adalah shell sementara milik Farhan untuk route yang belum
diimplementasikan. Tidak berisi logika presensi. Stub ditandai TODO beserta
pemiliknya. Koordinasikan perubahan tipe, props, atau API hook sebelum mengubahnya.

## Sumber kode tim

- feature/ui-base-theme: theme.ts, global.css, app-button.tsx.
- feature/ui-sheets-feedback: lima komponen UI Aqilla.
- feature/schedule-list-detail: tiga komponen shared dan tiga route Aqilla.
- feature/praktikan-attendance: panel-aksi-praktikan dan presensi-berhasil-sheet.

Route Aqilla tetap memakai data contoh di dalam file, sama dengan branch asal.
Pemindahan pembacaan jadwal ke useApp dan pemasangan panel aksi dilakukan saat
integrasi oleh pemilik file. Fondasi menyediakan data dengan ID/isi yang sama.

## Konfigurasi dan pemeriksaan

Repo memakai npm/package-lock.json. Paket baru dipasang lewat npx expo install.
Kamera hanya perlu scan QR, tanpa perekaman audio. Izin runtime diminta ketika
scanner diimplementasikan dan dibuka, bukan ketika aplikasi mulai.

eas.json menyediakan development, preview, production. Tidak ada build cloud
yang dijalankan atau penautan akun EAS baru. Identitas proyek EAS/native
diselesaikan dengan tim sebelum build cloud.

Pemeriksaan: npx expo lint, npx tsc --noEmit, npx expo install --check, export
bundle, dan simulasi merge terhadap empat PR yang masih terbuka.

NFR-6 dan konvensi NFR-9 adalah target Step 0. NFR-1, NFR-8, UIX-5 masih sebagian.
AKN-1 sampai AKN-4, UIX-1, UIX-10, PRS-7 belum selesai hanya karena ada stub.
