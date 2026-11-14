import { getFirebaseServices, isFirebaseAvailable } from '@/lib/firebase';
import type {
    AlasanGagal,
    Hasil,
    Keanggotaan,
    StatusKeanggotaan,
} from '@/types';
import {
    collection,
    doc,
    getDoc,
    onSnapshot,
    query,
    setDoc,
    updateDoc,
    where,
} from '@react-native-firebase/firestore';

const KODE_PESERTA_REGEX = /^[A-Z0-9]{8}$/;

function gagal(alasan: AlasanGagal, pesan: string): Hasil {
    return { ok: false, alasan, pesan };
}

/**
 * Memetakan error Firebase/jaringan ke tipe Hasil sesuai Kontrak Data v1.1.
 */
function petakanError(error: unknown): Hasil {
    const rawKode =
        error !== null && typeof error === 'object' && 'code' in error
            ? String((error as { code: unknown }).code)
            : '';
    const kode = rawKode.replace(/^firestore\//, '');

    switch (kode) {
        case 'permission-denied':
            return gagal(
                'TIDAK_BERWENANG',
                'Anda tidak memiliki izin untuk mengelola peserta kelas ini.',
            );
        case 'unauthenticated':
            return gagal(
                'AUTENTIKASI_GAGAL',
                'Sesi login tidak valid. Silakan masuk kembali.',
            );
        case 'not-found':
            return gagal('DATA_TIDAK_DITEMUKAN', 'Data peserta tidak ditemukan.');
        case 'unavailable':
        case 'network-request-failed':
            return gagal(
                'JARINGAN',
                'Koneksi bermasalah. Periksa internet Anda lalu coba lagi.',
            );
        case 'deadline-exceeded':
            return gagal(
                'TIMEOUT',
                'Permintaan melebihi batas waktu. Silakan coba lagi.',
            );
        default:
            return gagal(
                'TIDAK_DIKENAL',
                'Terjadi kesalahan saat memproses data peserta.',
            );
    }
}

/**
 * Menambahkan praktikan ke kelas menggunakan 8 karakter kode peserta.
 * - ID dokumen deterministik: {kelasId}_{uid}
 * - Jika sudah ada dan NONAKTIF -> diaktifkan kembali (snapshot tetap dipertahankan)
 * - Jika sudah ada dan AKTIF -> ditolak dengan PESERTA_SUDAH_AKTIF
 */
export async function tambahPesertaByKode(
    idKelas: string,
    kode: string,
): Promise<Hasil> {
    if (!isFirebaseAvailable) {
        return gagal(
            'TIDAK_DIKENAL',
            'Firebase Hadir.in saat ini hanya tersedia di Android.',
        );
    }

    const { auth, db } = getFirebaseServices();
    const user = auth.currentUser;
    if (!user) {
        return gagal(
            'AUTENTIKASI_GAGAL',
            'Anda harus login terlebih dahulu untuk menambahkan peserta.',
        );
    }

    const idKelasBersih = idKelas.trim();
    if (!idKelasBersih) {
        return gagal('INPUT_TIDAK_VALID', 'ID kelas tidak valid.');
    }

    const kodeBersih = kode.trim().toUpperCase();
    if (!KODE_PESERTA_REGEX.test(kodeBersih)) {
        return gagal(
            'INPUT_TIDAK_VALID',
            'Kode peserta harus 8 karakter huruf kapital atau angka.',
        );
    }

    try {
        const kelasSnap = await getDoc(doc(db, 'kelas', idKelasBersih));
        if (!kelasSnap.exists()) {
            return gagal('DATA_TIDAK_DITEMUKAN', 'Kelas tidak ditemukan.');
        }

        const kelasData = kelasSnap.data();
        if (!kelasData || kelasData.asistenUid !== user.uid) {
            return gagal(
                'TIDAK_BERWENANG',
                'Anda tidak berwenang menambahkan peserta ke kelas ini.',
            );
        }
        if (kelasData.diarsipkan === true) {
            return gagal(
                'DATA_DIARSIPKAN',
                'Kelas sudah diarsipkan dan tidak dapat menerima peserta baru.',
            );
        }

        const kodeSnap = await getDoc(doc(db, 'kodePeserta', kodeBersih));
        if (!kodeSnap.exists()) {
            return gagal(
                'DATA_TIDAK_DITEMUKAN',
                'Kode peserta tidak ditemukan. Periksa kembali kode dari profil praktikan.',
            );
        }

        const kodeData = kodeSnap.data();
        const targetUid = String(kodeData?.uid ?? '').trim();
        const nama = String(kodeData?.nama ?? '').trim();
        const nim = String(kodeData?.nim ?? '').trim();

        if (!targetUid || !nama || !nim) {
            return gagal(
                'DATA_TIDAK_DITEMUKAN',
                'Data profil untuk kode peserta ini belum lengkap.',
            );
        }

        const idKeanggotaan = `${idKelasBersih}_${targetUid}`;
        const keanggotaanRef = doc(db, 'keanggotaan', idKeanggotaan);
        const keanggotaanSnap = await getDoc(keanggotaanRef);

        if (keanggotaanSnap.exists()) {
            const statusSaatIni = keanggotaanSnap.data()?.status;
            if (statusSaatIni === 'AKTIF') {
                return gagal(
                    'PESERTA_SUDAH_AKTIF',
                    'Peserta sudah terdaftar aktif di kelas ini.',
                );
            }

            await updateDoc(keanggotaanRef, { status: 'AKTIF' });
            return { ok: true, data: undefined };
        }

        await setDoc(keanggotaanRef, {
            kelasId: idKelasBersih,
            uid: targetUid,
            nama,
            nim,
            status: 'AKTIF',
        });

        return { ok: true, data: undefined };
    } catch (error) {
        return petakanError(error);
    }
}

/**
 * Mengubah status keanggotaan peserta ('AKTIF' | 'NONAKTIF').
 * Hanya diizinkan jika kelas belum diarsipkan dan dimiliki oleh asisten aktif.
 */
export async function ubahStatusPeserta(
    idKeanggotaan: string,
    status: StatusKeanggotaan,
): Promise<Hasil> {
    if (!isFirebaseAvailable) {
        return gagal(
            'TIDAK_DIKENAL',
            'Firebase Hadir.in saat ini hanya tersedia di Android.',
        );
    }

    const { auth, db } = getFirebaseServices();
    const user = auth.currentUser;
    if (!user) {
        return gagal(
            'AUTENTIKASI_GAGAL',
            'Anda harus login terlebih dahulu untuk mengubah status peserta.',
        );
    }

    const idBersih = idKeanggotaan.trim();
    if (!idBersih) {
        return gagal('INPUT_TIDAK_VALID', 'ID keanggotaan tidak valid.');
    }

    if (status !== 'AKTIF' && status !== 'NONAKTIF') {
        return gagal('INPUT_TIDAK_VALID', 'Status keanggotaan tidak valid.');
    }

    try {
        const keanggotaanRef = doc(db, 'keanggotaan', idBersih);
        const keanggotaanSnap = await getDoc(keanggotaanRef);

        if (!keanggotaanSnap.exists()) {
            return gagal(
                'DATA_TIDAK_DITEMUKAN',
                'Data keanggotaan peserta tidak ditemukan.',
            );
        }

        const keanggotaanData = keanggotaanSnap.data();
        const kelasId = String(keanggotaanData?.kelasId ?? '').trim();
        if (!kelasId) {
            return gagal('DATA_TIDAK_DITEMUKAN', 'Data kelas peserta tidak valid.');
        }

        const kelasSnap = await getDoc(doc(db, 'kelas', kelasId));
        if (!kelasSnap.exists()) {
            return gagal('DATA_TIDAK_DITEMUKAN', 'Kelas tidak ditemukan.');
        }

        const kelasData = kelasSnap.data();
        if (!kelasData || kelasData.asistenUid !== user.uid) {
            return gagal(
                'TIDAK_BERWENANG',
                'Anda tidak berwenang mengubah status peserta di kelas ini.',
            );
        }
        if (kelasData.diarsipkan === true) {
            return gagal(
                'DATA_DIARSIPKAN',
                'Kelas sudah diarsipkan sehingga status peserta tidak dapat diubah.',
            );
        }

        if (keanggotaanData?.status === status) {
            return { ok: true, data: undefined };
        }

        await updateDoc(keanggotaanRef, { status });
        return { ok: true, data: undefined };
    } catch (error) {
        return petakanError(error);
    }
}

/**
 * Menonaktifkan peserta (mengubah status menjadi NONAKTIF, snapshot & riwayat tetap disimpan).
 */
export async function nonaktifkanPeserta(
    idKeanggotaan: string,
): Promise<Hasil> {
    return ubahStatusPeserta(idKeanggotaan, 'NONAKTIF');
}

/**
 * Mendengarkan seluruh daftar keanggotaan dalam suatu kelas (AKTIF & NONAKTIF) secara realtime.
 */
export function listenPesertaKelas(
    idKelas: string,
    callback: (peserta: Keanggotaan[]) => void,
    onError: (error: Error) => void,
): () => void {
    const idKelasBersih = idKelas.trim();
    if (!idKelasBersih) {
        callback([]);
        return () => {};
    }

    if (!isFirebaseAvailable) {
        onError(
            new Error('Firebase Hadir.in saat ini hanya tersedia di Android.'),
        );
        return () => {};
    }

    const { db } = getFirebaseServices();
    const q = query(
        collection(db, 'keanggotaan'),
        where('kelasId', '==', idKelasBersih),
    );

    return onSnapshot(
        q,
        (snapshot) => {
            const daftarPeserta: Keanggotaan[] = snapshot.docs.map((docSnap) => {
                const d = docSnap.data();
                return {
                    idKeanggotaan: docSnap.id,
                    kelasId: String(d.kelasId ?? ''),
                    uid: String(d.uid ?? ''),
                    nama: String(d.nama ?? ''),
                    nim: String(d.nim ?? ''),
                    status: d.status === 'NONAKTIF' ? 'NONAKTIF' : 'AKTIF',
                };
            });

            daftarPeserta.sort((a, b) => {
                if (a.status !== b.status) {
                    return a.status === 'AKTIF' ? -1 : 1;
                }
                return a.nama.localeCompare(b.nama, 'id');
            });

            callback(daftarPeserta);
        },
        (error) => {
            onError(error);
        },
    );
}