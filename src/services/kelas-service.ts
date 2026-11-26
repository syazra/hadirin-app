import { getFirebaseServices, isFirebaseAvailable } from '@/lib/firebase';
import type { AlasanGagal, Hasil, Kelas } from '@/types';
import {
    Timestamp,
    addDoc,
    collection,
    doc,
    getDoc,
    onSnapshot,
    query,
    serverTimestamp,
    updateDoc,
    where,
} from '@react-native-firebase/firestore';

const PANJANG_MAKS_NAMA = 100;

export interface KonfigurasiDendaKelas {
    gracePeriodMenit?: number;
    nominalDenda?: number;
}

function gagal(alasan: AlasanGagal, pesan: string): Hasil {
    return { ok: false, alasan, pesan };
}

function keDate(nilai: unknown): Date | null {
    if (nilai instanceof Timestamp) {
        return nilai.toDate();
    }
    if (
        nilai !== null &&
        typeof nilai === 'object' &&
        'toDate' in nilai &&
        typeof (nilai as { toDate: unknown }).toDate === 'function'
    ) {
        return (nilai as { toDate: () => Date }).toDate();
    }
    return null;
}

function validasiAngkaNonNegatif(nilai: unknown, label: string): string | null {
    if (typeof nilai !== 'number' || !Number.isFinite(nilai) || nilai < 0) {
        return `${label} harus berupa angka 0 atau lebih.`;
    }
    return null;
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
                'Anda tidak memiliki izin untuk mengelola kelas ini.',
            );
        case 'unauthenticated':
            return gagal(
                'AUTENTIKASI_GAGAL',
                'Sesi login tidak valid. Silakan masuk kembali.',
            );
        case 'not-found':
            return gagal('DATA_TIDAK_DITEMUKAN', 'Data kelas tidak ditemukan.');
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
                'Terjadi kesalahan saat memproses data kelas.',
            );
    }
}

/**
 * Menambahkan kelas baru milik asisten yang sedang login.
 */
export async function tambahKelas(
    namaPraktikum: string,
    konfigurasi: KonfigurasiDendaKelas = {},
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
            'Anda harus login terlebih dahulu untuk menambah kelas.',
        );
    }

    const nama = namaPraktikum.trim();
    if (nama.length === 0) {
        return gagal('INPUT_TIDAK_VALID', 'Nama praktikum wajib diisi.');
    }
    if (nama.length > PANJANG_MAKS_NAMA) {
        return gagal(
            'INPUT_TIDAK_VALID',
            `Nama praktikum maksimal ${PANJANG_MAKS_NAMA} karakter.`,
        );
    }

    const gracePeriodMenit = konfigurasi.gracePeriodMenit ?? 0;
    const nominalDenda = konfigurasi.nominalDenda ?? 0;

    const errGrace = validasiAngkaNonNegatif(
        gracePeriodMenit,
        'Grace period (menit)',
    );
    if (errGrace) {
        return gagal('INPUT_TIDAK_VALID', errGrace);
    }

    const errDenda = validasiAngkaNonNegatif(nominalDenda, 'Nominal denda');
    if (errDenda) {
        return gagal('INPUT_TIDAK_VALID', errDenda);
    }

    try {
        await addDoc(collection(db, 'kelas'), {
            namaPraktikum: nama,
            asistenUid: user.uid,
            gracePeriodMenit: Math.floor(gracePeriodMenit),
            nominalDenda: Math.floor(nominalDenda),
            diarsipkan: false,
            dibuatPada: serverTimestamp(),
            diperbaruiPada: serverTimestamp(),
        });
        return { ok: true, data: undefined };
    } catch (error) {
        return petakanError(error);
    }
}

/**
 * Mengubah data kelas (namaPraktikum, konfigurasi denda, dan/atau arsip satu arah false -> true).
 */
export async function ubahKelas(
    idKelas: string,
    data: Partial<
        Pick<
            Kelas,
            'namaPraktikum' | 'gracePeriodMenit' | 'nominalDenda' | 'diarsipkan'
        >
    >,
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
            'Anda harus login terlebih dahulu untuk mengubah kelas.',
        );
    }

    const id = idKelas.trim();
    if (!id) {
        return gagal('INPUT_TIDAK_VALID', 'ID kelas tidak valid.');
    }

    const payload: Record<string, unknown> = {};

    if (data.namaPraktikum !== undefined) {
        const nama = data.namaPraktikum.trim();
        if (nama.length === 0) {
            return gagal('INPUT_TIDAK_VALID', 'Nama praktikum wajib diisi.');
        }
        if (nama.length > PANJANG_MAKS_NAMA) {
            return gagal(
                'INPUT_TIDAK_VALID',
                `Nama praktikum maksimal ${PANJANG_MAKS_NAMA} karakter.`,
            );
        }
        payload.namaPraktikum = nama;
    }

    if (data.gracePeriodMenit !== undefined) {
        const errGrace = validasiAngkaNonNegatif(
            data.gracePeriodMenit,
            'Grace period (menit)',
        );
        if (errGrace) {
            return gagal('INPUT_TIDAK_VALID', errGrace);
        }
        payload.gracePeriodMenit = Math.floor(data.gracePeriodMenit);
    }

    if (data.nominalDenda !== undefined) {
        const errDenda = validasiAngkaNonNegatif(
            data.nominalDenda,
            'Nominal denda',
        );
        if (errDenda) {
            return gagal('INPUT_TIDAK_VALID', errDenda);
        }
        payload.nominalDenda = Math.floor(data.nominalDenda);
    }

    if (data.diarsipkan !== undefined) {
        if (!data.diarsipkan) {
            return gagal(
                'INPUT_TIDAK_VALID',
                'Kelas yang sudah diarsipkan tidak dapat diaktifkan kembali.',
            );
        }
        payload.diarsipkan = true;
    }

    if (Object.keys(payload).length === 0) {
        return gagal('INPUT_TIDAK_VALID', 'Tidak ada perubahan data kelas.');
    }

    payload.diperbaruiPada = serverTimestamp();

    try {
        const kelasRef = doc(db, 'kelas', id);
        const snap = await getDoc(kelasRef);

        if (!snap.exists()) {
            return gagal('DATA_TIDAK_DITEMUKAN', 'Kelas tidak ditemukan.');
        }

        const kelasSaatIni = snap.data();
        if (!kelasSaatIni || kelasSaatIni.asistenUid !== user.uid) {
            return gagal(
                'TIDAK_BERWENANG',
                'Anda tidak berwenang mengubah kelas ini.',
            );
        }

        if (kelasSaatIni.diarsipkan === true) {
            return gagal(
                'DATA_DIARSIPKAN',
                'Kelas yang sudah diarsipkan tidak dapat diubah.',
            );
        }

        await updateDoc(kelasRef, payload);
        return { ok: true, data: undefined };
    } catch (error) {
        return petakanError(error);
    }
}

/**
 * Mengarsipkan kelas (satu arah: false -> true).
 */
export async function arsipkanKelas(idKelas: string): Promise<Hasil> {
    return ubahKelas(idKelas, { diarsipkan: true });
}

/**
 * Mendengarkan daftar kelas aktif milik asisten secara realtime.
 */
export function listenKelasAsisten(
    uid: string,
    callback: (kelas: Kelas[]) => void,
    onError: (error: Error) => void,
    sertakanArsip = false,
): () => void {
    const uidBersih = uid.trim();
    if (!uidBersih) {
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
    const q = sertakanArsip
        ? query(
              collection(db, 'kelas'),
              where('asistenUid', '==', uidBersih),
          )
        : query(
              collection(db, 'kelas'),
              where('asistenUid', '==', uidBersih),
              where('diarsipkan', '==', false),
          );

    return onSnapshot(
        q,
        (snapshot) => {
            const daftarKelas: Kelas[] = snapshot.docs.map((docSnap) => {
                const d = docSnap.data();
                return {
                    idKelas: docSnap.id,
                    namaPraktikum: String(d.namaPraktikum ?? ''),
                    asistenUid: String(d.asistenUid ?? ''),
                    gracePeriodMenit:
                        typeof d.gracePeriodMenit === 'number'
                            ? d.gracePeriodMenit
                            : 0,
                    nominalDenda:
                        typeof d.nominalDenda === 'number' ? d.nominalDenda : 0,
                    diarsipkan: Boolean(d.diarsipkan),
                    dibuatPada: keDate(d.dibuatPada),
                    diperbaruiPada: keDate(d.diperbaruiPada),
                };
            });

            daftarKelas.sort((a, b) => {
                const waktuA = a.dibuatPada?.getTime() ?? Number.MAX_SAFE_INTEGER;
                const waktuB = b.dibuatPada?.getTime() ?? Number.MAX_SAFE_INTEGER;
                return waktuB - waktuA;
            });

            callback(daftarKelas);
        },
        (error) => {
            onError(error);
        },
    );
}