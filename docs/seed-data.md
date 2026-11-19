# Panduan Seeding Data Firestore (Hadir.in)

Script seeding ini terisolasi di dalam folder `scripts/seed/` menggunakan `firebase-admin` agar tidak masuk ke bundle aplikasi mobile Expo.

## 1. Instalasi Dependencies
Masuk ke direktori seeder dan pasang dependencies:
```powershell
cd scripts/seed
npm install