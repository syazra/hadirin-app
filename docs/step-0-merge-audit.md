# Pemeriksaan merge Step 0

Fondasi disiapkan pada branch chore/foundation-state-routing dari develop.
Sesuai arahan Farhan, PR fondasi ditujukan ke develop dan masuk lebih dulu.
Empat PR fitur yang sudah terbuka juga menargetkan develop. Setelah fondasi
masuk develop, lanjutkan integrasi fitur; main tetap untuk hasil integrasi final.

## Head awal yang diperiksa

| PR | Branch | Commit awal |
| --- | --- | --- |
| 1 | feature/ui-sheets-feedback | 73492bdf3f67a9ff177800bdb80cb9eabb61e96b |
| 2 | feature/ui-base-theme | 51814de241457e4d8da94b303e32d7a4e84c0ef0 |
| 3 | feature/praktikan-attendance | 6f78559fe8bc16f0c2c7dddb924099d666d8509f |
| 4 | feature/schedule-list-detail | cc221b3c04b60624cdb40764e725b196d60a79e9 |

## Konflik sebelum sinkronisasi

- PR 1 berbenturan pada src/app/index.tsx: preview UI sementara versus shell
  navigasi yang akan menjadi pemilihan identitas milik Farhan.
- PR 4 berbenturan pada src/app/index.tsx dan src/app/_layout.tsx: preview/stack
  lama versus provider global dan route group fondasi.
- PR 2 dan PR 3 tidak berbenturan.
- Salinan komponen tim dipertahankan byte demi byte. Perbedaan newline pada
  detail-sesi.tsx yang ditemukan saat penyalinan awal sudah diperbaiki.

## Resolusi

Sinkronisasi PR 1 dan PR 4 menggabungkan fondasi ke branch fitur dengan merge
commit biasa. Riwayat commit fitur tetap dipertahankan, tanpa rebase/force-push.
Pada dua file yang berkonflik, gunakan shell root dan beranda milik Farhan.
Komponen UI, jadwal/detail, tema, tombol, serta komponen presensi tim tetap ada.
Konfigurasi EAS milik branch Aqilla tetap ikut branch PR, tanpa membuat atau
menautkan proyek cloud baru dari fondasi.

Semua 24 permutasi urutan merge PR 1 sampai PR 4 diperiksa setelah fondasi masuk
develop secara simulasi. Resolusi sinkronisasi harus menghasilkan nol konflik dan
satu tree akhir yang sama untuk semua urutan. Pemeriksaan berlaku pada head yang
dicatat; perubahan commit selanjutnya perlu diperiksa lagi.

## Melihat konflik awal dengan Git

Perintah berikut tidak mengubah working tree atau memulai merge sungguhan.
Gunakan commit fondasi yang sudah disimpan, bukan perubahan yang belum di-commit.

```powershell
git merge-tree --write-tree chore/foundation-state-routing 73492bdf3f67a9ff177800bdb80cb9eabb61e96b
git merge-tree --write-tree chore/foundation-state-routing cc221b3c04b60624cdb40764e725b196d60a79e9
```

Exit code 1 dan pesan CONFLICT adalah hasil yang diharapkan untuk head awal.
Baris pertama output adalah tree hasil simulasi. Untuk melihat marker konflik,
salin hash tree itu dan jalankan git show dengan path yang dilaporkan:

```powershell
git show <hash-tree>:src/app/_layout.tsx
git show <hash-tree>:src/app/index.tsx
```

Setelah branch fitur disinkronkan, pemeriksaan head terbaru dapat dilakukan:

```powershell
git fetch origin
git merge-tree --write-tree chore/foundation-state-routing origin/feature/ui-sheets-feedback
git merge-tree --write-tree chore/foundation-state-routing origin/feature/ui-base-theme
git merge-tree --write-tree chore/foundation-state-routing origin/feature/praktikan-attendance
git merge-tree --write-tree chore/foundation-state-routing origin/feature/schedule-list-detail
```

Hasil yang bersih berakhir dengan exit code 0 tanpa pesan CONFLICT. merge-tree
menguji kompatibilitas Git, bukan menjalankan tes aplikasi atau mengubah status PR.
