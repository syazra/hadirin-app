# FAR-S2-01 — Kategori AI SAKIT dan IZIN

Respons baru dan field AI yang ditulis proxy hanya menggunakan SAKIT atau IZIN.
Sakit/demam/kesehatan masuk SAKIT; keluarga/akademik/alasan lainnya masuk IZIN.
Keputusan MENUNGGU/DISETUJUI/DITOLAK tetap milik Asisten. ALPHA tetap status
rekap, bukan kategori AI. Timeout, kuota, jaringan, dan output invalid hanya
mengubah field AI; validasi token, role, dan kepemilikan kelas tetap berlaku.

## Kompatibilitas dan deployment

Deploy proxy terlebih dahulu, lalu aplikasi. Client lama sudah menerima SAKIT/IZIN.
Client baru menolak respons kategori lama sebagai RESPONS_TIDAK_VALID.
Tidak ada migrasi massal atau perubahan keputusan izin.

Saat membaca Firestore, KESEHATAN ditampilkan sebagai SAKIT, sedangkan
KELUARGA/AKADEMIK/LAINNYA sebagai IZIN. ALPHA/TIDAK_JELAS/label tidak dikenal
menjadi kategori kosong. Badge tidak menyebut klasifikasi berhasil jika kategori
kosong. Izin disetujui tanpa klasifikasi valid tetap memakai fallback IZIN dan
indikator AI belum tersedia dari helper rekap yang sudah ada.

Proxy tidak menggunakan cache berlabel lama; permintaan klasifikasi berikutnya
menghitung ulang dan menulis kategori final. Data lama tidak ditulis ulang hanya
karena dibaca. Jika rollback proxy diperlukan, rollback aplikasi bersamaan agar
client tidak menolak label lama. Hasil baru SAKIT/IZIN tetap dapat dibaca client lama.

## Verifikasi

- Root: `npx expo lint`, `npx tsc --noEmit`.
- Root: `node --import tsx --test tests/rules/kategori-izin.test.ts tests/rules/tentukan-status-rekap.test.ts`.
- Proxy: `npm test`, `npm run typecheck`.
- Fixture test menggunakan model tiruan; tidak menguji kualitas model Gemini live.
- Uji perangkat/manual: klasifikasikan sakit, keluarga, dan akademik; buka detail
  dan rekap; pastikan persetujuan/penolakan tidak berubah. Periksa izin historis
  ALPHA/TIDAK_JELAS: kategori belum tersedia, approved tetap IZIN. Memerlukan
  backend/akun uji; tidak dijalankan oleh unit test.
