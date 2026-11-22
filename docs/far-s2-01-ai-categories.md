# Kategori AI SAKIT, IZIN, dan ALPHA

Pembaruan aturan setelah FAR-S2-01 dua kategori:

| Kategori AI | Kriteria |
| --- | --- |
| SAKIT | Sakit atau kondisi kesehatan, misalnya demam/perawatan. |
| IZIN | Lomba sebagai delegasi/perwakilan UNDIP (Universitas Diponegoro) atau Departemen. |
| ALPHA | Alasan yang tidak memenuhi keduanya, termasuk keluarga, seminar/kegiatan akademik biasa, organisasi, liburan, dan lomba pribadi/tanpa keterangan delegasi. |

Prompt tidak menganggap peserta lomba otomatis delegasi. Keterangan lomba dan
perwakilan harus eksplisit; informasi yang tidak cukup masuk ALPHA. Alasan sakit
jelas diprioritaskan jika satu alasan memuat beberapa kondisi. Alasan kosong tetap
input invalid. Respons model malformed/tidak dikenal tetap kegagalan klasifikasi,
bukan otomatis ALPHA. Alasan diperlakukan sebagai data JSON, bukan instruksi.

## Otoritas Asisten dan rekap

AI hanya memberi kategori alasan; tidak menulis keputusan MENUNGGU/DISETUJUI/DITOLAK.

- Presensi berhasil tetap mengungguli semua izin: HADIR.
- Izin disetujui + AI SAKIT: SAKIT.
- Izin disetujui + AI IZIN **atau ALPHA**: IZIN. Asisten berwenang memberi pengecualian;
  ALPHA yang valid bukan AI gagal/belum tersedia.
- Izin disetujui tanpa AI valid/gagal: fallback IZIN dan indikator AI belum tersedia.
- Pending/ditolak tetap mengikuti aturan rekap yang sudah ada; kategori ALPHA tidak
  otomatis memutuskan izin atau mengubah status sesi.

Validasi autentikasi, peran Asisten, kepemilikan kelas, dan pencocokan sesi/kelas
pada proxy tetap berlaku. Timeout/kuota/jaringan hanya mengubah metadata AI.

## Data lama dan cache

Proxy menulis `versiKategoriAi: sakit-delegasi-lomba-alpha-v1` bersama kategori,
status/model/waktu AI. Cache SUKSES hanya digunakan jika kategori dan versi sama
dengan kebijakan terkini. Cache tanpa versi/versi lama diklasifikasikan ulang saat
Asisten meminta klasifikasi berikutnya, termasuk IZIN lama yang sebelumnya bisa
berarti acara keluarga. Tidak ada migrasi massal, auto-request Gemini, atau
perubahan keputusan manual lama.

Client menerima tiga kategori final persis. Label KESEHATAN tersimpan masih dibaca
sebagai SAKIT; KELUARGA/AKADEMIK/LAINNYA/TIDAK_JELAS tidak lagi dianggap IZIN yang
memenuhi kebijakan baru dan dibaca sebagai kategori belum tersedia. Kategori final
lama tetap dapat dilihat dengan penanda kebijakan lama pada badge jika versi belum
terkini. Pengajuan final tidak dibuka kembali; klasifikasi ulang melalui tombol
existing hanya tersedia pada pengajuan MENUNGGU.

Field versi bersifat opsional pada tipe app dan hanya ditulis backend Admin. Client
baru tidak menambahkannya pada create/update izin. Rules persetujuan yang existing
mempertahankan field metadata tanpa mengizinkan klien mengubahnya; tidak perlu
perubahan Rules.

## Deployment dan rollback

Perangkat uji perlu memakai client yang menerima ALPHA. Deploy proxy yang sudah
mendukung `versiKategoriAi` sebelum merilis client yang mengirim field tersebut.
Proxy tetap menerima permintaan dari client tiga kategori sebelumnya.

Periksa URL yang dipakai aplikasi melalui `GET /api/klasifikasi-izin`. Deployment
yang sesuai mengembalikan HTTP 200, `versiKategoriAi: sakit-delegasi-lomba-alpha-v1`,
dan kategori SAKIT, IZIN, serta ALPHA. Jika GET masih mengembalikan HTTP 405,
perbarui deployment pada domain yang ditetapkan di `EXPO_PUBLIC_GEMINI_PROXY_URL`.
Sesudah deploy, uji alasan acara keluarga dari akun Asisten dan periksa hasil ALPHA.

Untuk rollback kebijakan dua kategori, rollback proxy dan client secara terkoordinasi.
Proxy lama tidak memahami versi kebijakan dan bisa memakai cache IZIN dari kebijakan
baru; jika rollback dilakukan, perlakukan cache sebagai lintas kebijakan dan tinjau
kebutuhan invalidasinya sebelum mengaktifkan ulang. Jangan ubah keputusan izin
manual untuk membersihkan cache.

## Verifikasi

- Root: `npx expo lint`, `npx tsc --noEmit`.
- Root: `node --import tsx --test tests/rules/kategori-izin.test.ts tests/rules/tentukan-status-rekap.test.ts`.
- Proxy: `npm test`, `npm run typecheck`.
- Uji mock: sakit, lomba delegasi UNDIP/Departemen, alasan lain ALPHA, cache versi
  lama/baru, output invalid, timeout/kuota/network, akses tidak berwenang, dan
  persetujuan Asisten atas ALPHA tetap IZIN.
- Uji perangkat/Gemini live belum dijalankan. Fixture output model hanya memverifikasi
  kontrak dan penanganan, bukan akurasi semantik model. Pada staging, coba alasan
  yang sama lewat tombol klasifikasi; pastikan badge dan rekap mengikuti keputusan.
