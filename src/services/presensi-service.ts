import { collection, doc, onSnapshot, query, runTransaction, serverTimestamp, where } from '@react-native-firebase/firestore';

import { getFirebaseServices } from '@/lib/firebase';
import { bacaPayloadQr } from '@/utils/qr-payload';
import type { Hasil, Presensi } from '@/types';

function pesanError(error: unknown): Hasil<Presensi> {
    const kode = (error as { code?: string })?.code ?? '';
    if (kode.includes('permission-denied')) return { ok: false, alasan: 'TIDAK_BERWENANG', pesan: 'Kamu tidak memiliki izin untuk melakukan presensi.' };
    if (kode.includes('unavailable') || kode.includes('network')) return { ok: false, alasan: 'JARINGAN', pesan: 'Koneksi bermasalah. Periksa internet lalu coba lagi.' };
    return { ok: false, alasan: 'TIDAK_DIKENAL', pesan: 'Presensi belum berhasil dicatat. Silakan coba lagi.' };
}

function ubahDataPresensi(id: string, data: Record<string, any>): Presensi {
    return { idPresensi: id, sesiId: data.sesiId, kelasId: data.kelasId, uid: data.uid, waktuHadir: data.waktuHadir?.toDate?.() ?? null };
}

export async function catatPresensiDariQr(payloadQr: string): Promise<Hasil<Presensi>> {
    const qr = bacaPayloadQr(payloadQr);
    if (!qr) return { ok: false, alasan: 'QR_TIDAK_VALID', pesan: 'Format QR tidak valid.' };

    try {
        const { auth, db } = getFirebaseServices();
        const akun = auth.currentUser;
        if (!akun) return { ok: false, alasan: 'AUTENTIKASI_GAGAL', pesan: 'Silakan masuk kembali ke akunmu.' };

        const uid = akun.uid;
        const idPresensi = `${qr.idSesi}_${uid}`;
        const sesiRef = doc(db, 'sesi', qr.idSesi);
        const profilRef = doc(db, 'pengguna', uid);

        return await runTransaction(db, async (transaksi) => {
            const sesiSnap = await transaksi.get(sesiRef);
            const profilSnap = await transaksi.get(profilRef);

            if (!sesiSnap.exists()) return { ok: false, alasan: 'DATA_TIDAK_DITEMUKAN', pesan: 'Sesi praktikum tidak ditemukan.' };
            if (!profilSnap.exists() || profilSnap.data()?.peran !== 'PRAKTIKAN') return { ok: false, alasan: 'TIDAK_BERWENANG', pesan: 'Akun ini bukan akun praktikan.' };

            const sesi = sesiSnap.data();
            if (!sesi) return { ok: false, alasan: 'DATA_TIDAK_DITEMUKAN', pesan: 'Data sesi tidak tersedia.' };

            const kelasRef = doc(db, 'kelas', sesi.kelasId);
            const anggotaRef = doc(db, 'keanggotaan', `${sesi.kelasId}_${uid}`);
            const presensiRef = doc(db, 'presensi', idPresensi);
            const izinRef = doc(db, 'izin', idPresensi);

            const kelasSnap = await transaksi.get(kelasRef);
            const anggotaSnap = await transaksi.get(anggotaRef);
            const presensiSnap = await transaksi.get(presensiRef);
            const izinSnap = await transaksi.get(izinRef);

            if (!kelasSnap.exists()) return { ok: false, alasan: 'DATA_TIDAK_DITEMUKAN', pesan: 'Kelas tidak ditemukan.' };
            if (sesi.diarsipkan || kelasSnap.data()?.diarsipkan) return { ok: false, alasan: 'DATA_DIARSIPKAN', pesan: 'Sesi atau kelas ini sudah diarsipkan.' };
            if (sesi.statusSesi === 'BELUM_DIBUKA') return { ok: false, alasan: 'BELUM_DIBUKA', pesan: 'Sesi belum dibuka oleh asisten.' };
            if (sesi.statusSesi !== 'DIBUKA') return { ok: false, alasan: 'SUDAH_DITUTUP', pesan: 'Sesi praktikum sudah ditutup.' };
            if (!anggotaSnap.exists() || anggotaSnap.data()?.status !== 'AKTIF') return { ok: false, alasan: 'BUKAN_ANGGOTA', pesan: 'Kamu bukan anggota aktif kelas ini.' };
            if (presensiSnap.exists()) return { ok: false, alasan: 'SUDAH_PRESENSI', pesan: 'Kehadiranmu sudah tercatat sebelumnya.' };
            if (izinSnap.exists() && izinSnap.data()?.statusIzin !== 'DITOLAK') return { ok: false, alasan: 'ADA_IZIN', pesan: 'Pengajuan izinmu masih berlaku untuk sesi ini.' };

            transaksi.set(presensiRef, { sesiId: qr.idSesi, kelasId: sesi.kelasId, uid, waktuHadir: serverTimestamp(), kodeQr: qr.kodeQr });

            return { ok: true, data: { idPresensi, sesiId: qr.idSesi, kelasId: sesi.kelasId, uid, waktuHadir: null } };
        });
    } catch (error) {
        return pesanError(error);
    }
}

export function listenPresensiSesi(sesiId: string, callback: (presensi: Presensi[]) => void, onError: (error: Error) => void): () => void {
    const { db } = getFirebaseServices();
    const daftar = query(collection(db, 'presensi'), where('sesiId', '==', sesiId));
    return onSnapshot(daftar, (snapshot) => callback(snapshot.docs.map((item) => ubahDataPresensi(item.id, item.data()))), onError);
}

export function listenPresensiPengguna(uid: string, callback: (presensi: Presensi[]) => void, onError: (error: Error) => void): () => void {
    const { db } = getFirebaseServices();
    const daftar = query(collection(db, 'presensi'), where('uid', '==', uid));
    return onSnapshot(daftar, (snapshot) => callback(snapshot.docs.map((item) => ubahDataPresensi(item.id, item.data()))), onError);
}