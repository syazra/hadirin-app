
import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
} from '@react-native-firebase/auth';

import {
    doc,
    getDoc,
    serverTimestamp,
    writeBatch,
} from '@react-native-firebase/firestore';

import * as Crypto from 'expo-crypto';

import {
    getFirebaseServices,
    isFirebaseAvailable,
} from '@/lib/firebase';

import type {
    AlasanGagal,
    Hasil,
    Pengguna,
} from '@/types';

export type InputDaftar = {
    nama: string;
    nim: string;
    email: string;
    password: string;
};

export type InputLengkapiProfil = {
    nama: string;
    nim: string;
};

type IdentitasProfil = {
    nama: string;
    nim: string;
};

const KARAKTER_KODE = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
const MAKS_PERCOBAAN_KODE = 3;

function gagal<T = never>(
    alasan: AlasanGagal,
    pesan: string,
): Hasil<T> {
    return { ok: false, alasan, pesan };
}

function firebaseTidakTersedia<T = never>(): Hasil<T> {
    return gagal(
        'TIDAK_BERWENANG',
        'Firebase Hadir.in saat ini hanya tersedia di Android.',
    );
}

function kodeError(error: unknown): string | null {
    if (
        typeof error === 'object' &&
        error !== null &&
        'code' in error &&
        typeof error.code === 'string'
    ) {
        return error.code;
    }

    return null;
}

function hasilError<T = never>(error: unknown): Hasil<T> {
    const code = kodeError(error);

    if (
        code === 'auth/invalid-email' ||
        code === 'auth/weak-password' ||
        code === 'auth/missing-email' ||
        code === 'auth/missing-password'
    ) {
        return gagal(
            'INPUT_TIDAK_VALID',
            'Periksa kembali format email dan kata sandi.',
        );
    }

    if (code === 'auth/email-already-in-use') {
        return gagal(
            'AUTENTIKASI_GAGAL',
            'Email sudah terdaftar. Silakan masuk.',
        );
    }

    if (
        code === 'auth/invalid-credential' ||
        code === 'auth/user-not-found' ||
        code === 'auth/wrong-password' ||
        code === 'auth/user-disabled' ||
        code === 'auth/too-many-requests'
    ) {
        return gagal(
            'AUTENTIKASI_GAGAL',
            'Email atau kata sandi tidak sesuai, atau akun sementara dibatasi.',
        );
    }

    if (
        code === 'auth/network-request-failed' ||
        code === 'firestore/unavailable' ||
        code === 'firestore/network-request-failed'
    ) {
        return gagal(
            'JARINGAN',
            'Koneksi bermasalah. Periksa jaringan lalu coba lagi.',
        );
    }

    if (
        code === 'firestore/deadline-exceeded' ||
        code === 'firestore/cancelled'
    ) {
        return gagal(
            'TIMEOUT',
            'Permintaan terlalu lama. Silakan coba lagi.',
        );
    }

    if (
        code === 'firestore/permission-denied' ||
        code === 'auth/operation-not-allowed'
    ) {
        return gagal(
            'TIDAK_BERWENANG',
            'Akses ditolak. Periksa konfigurasi Firebase dan Security Rules.',
        );
    }

    return gagal(
        'TIDAK_DIKENAL',
        'Terjadi kesalahan yang tidak dikenali. Silakan coba lagi.',
    );
}

function validasiIdentitas(
    input: InputLengkapiProfil,
): Hasil<IdentitasProfil> {
    const nama = input.nama.trim();
    const nim = input.nim.trim();

    if (!nama || nama.length > 100) {
        return gagal(
            'INPUT_TIDAK_VALID',
            'Nama wajib diisi dan maksimal 100 karakter.',
        );
    }

    if (!nim || nim.length > 32) {
        return gagal(
            'INPUT_TIDAK_VALID',
            'NIM wajib diisi dan maksimal 32 karakter.',
        );
    }

    return {
        ok: true,
        data: { nama, nim },
    };
}

/**
 * Membuat kode peserta 8 karakter menggunakan random bytes.
 * Byte >= 252 ditolak supaya pemetaan modulo 36 tidak bias.
 */
async function buatKodePeserta(): Promise<string> {
    let kode = '';

    while (kode.length < 8) {
        const bytes = await Crypto.getRandomBytesAsync(16);

        for (const byte of bytes) {
            if (byte >= 252) continue;

            kode += KARAKTER_KODE[byte % KARAKTER_KODE.length];

            if (kode.length === 8) break;
        }
    }

    return kode;
}

function adalahObjek(
    nilai: unknown,
): nilai is Record<string, unknown> {
    return (
        typeof nilai === 'object' &&
        nilai !== null &&
        !Array.isArray(nilai)
    );
}

function konversiTanggal(nilai: unknown): Date | null {
    if (nilai instanceof Date) {
        return nilai;
    }

    if (
        adalahObjek(nilai) &&
        typeof nilai.toDate === 'function'
    ) {
        const tanggal = (nilai.toDate as () => unknown)();

        return tanggal instanceof Date ? tanggal : null;
    }

    return null;
}

function konversiPengguna(
    data: unknown,
    uid: string,
): Pengguna | null {
    if (!adalahObjek(data)) return null;

    const {
        nama,
        nim,
        email,
        peran,
        kodePeserta,
        dibuatPada,
    } = data;

    if (
        typeof nama !== 'string' ||
        typeof nim !== 'string' ||
        typeof email !== 'string' ||
        (peran !== 'PRAKTIKAN' && peran !== 'ASISTEN') ||
        typeof kodePeserta !== 'string' ||
        !/^[A-Z0-9]{8}$/.test(kodePeserta)
    ) {
        return null;
    }

    return {
        uid,
        nama,
        nim,
        email,
        peran,
        kodePeserta,
        dibuatPada: konversiTanggal(dibuatPada),
    };
}

async function bacaProfil(
    uid: string,
): Promise<Hasil<Pengguna>> {
    const { db } = getFirebaseServices();

    const referensiProfil = doc(db, 'pengguna', uid);
    const snapshot = await getDoc(referensiProfil);

    if (!snapshot.exists()) {
        return gagal(
            'PROFIL_BELUM_LENGKAP',
            'Profil akun belum tersedia. Silakan lengkapi profil.',
        );
    }

    const pengguna = konversiPengguna(snapshot.data(), uid);

    if (!pengguna) {
        return gagal(
            'PROFIL_BELUM_LENGKAP',
            'Data profil belum lengkap atau tidak valid.',
        );
    }

    return { ok: true, data: pengguna };
}

/**
 * Mengambil profil pengguna berdasarkan UID Firebase Auth.
 */
export async function ambilProfil(
    uid: string,
): Promise<Hasil<Pengguna>> {
    if (!isFirebaseAvailable) {
        return firebaseTidakTersedia();
    }

    try {
        return await bacaProfil(uid);
    } catch (error) {
        return hasilError<Pengguna>(error);
    }
}

/**
 * Menyimpan profil dan mapping kode peserta dalam satu batch.
 *
 * Jika batch gagal:
 * 1. Baca ulang profil UID sendiri.
 * 2. Jika profil sudah lengkap, gunakan profil tersebut.
 * 3. Jika belum ada, coba kode baru maksimal 3 kali.
 *
 * Security Rules wajib menolak update pada dokumen kodePeserta
 * yang sudah ada agar mapping kode tidak dapat ditimpa.
 */
async function simpanProfilDanKode(input: {
    uid: string;
    email: string;
    nama: string;
    nim: string;
}): Promise<Hasil<Pengguna>> {
    const { db } = getFirebaseServices();

    const referensiProfil = doc(db, 'pengguna', input.uid);

    // Periksa profil sendiri sebelum mencoba membuat profil baru.
    const profilAwal = await getDoc(referensiProfil);

    if (profilAwal.exists()) {
        const pengguna = konversiPengguna(
            profilAwal.data(),
            input.uid,
        );

        if (pengguna) {
            return { ok: true, data: pengguna };
        }

        return gagal(
            'PROFIL_BELUM_LENGKAP',
            'Profil sudah ada tetapi datanya belum lengkap atau tidak valid.',
        );
    }

    let kesalahanTerakhir: unknown = null;

    for (
        let percobaan = 0;
        percobaan < MAKS_PERCOBAAN_KODE;
        percobaan += 1
    ) {
        const kodePeserta = await buatKodePeserta();
        const referensiKode = doc(db, 'kodePeserta', kodePeserta);

        const batch = writeBatch(db);

        batch.set(referensiProfil, {
            nama: input.nama,
            nim: input.nim,
            email: input.email,
            peran: 'PRAKTIKAN',
            kodePeserta,
            dibuatPada: serverTimestamp(),
        });

        batch.set(referensiKode, {
            uid: input.uid,
            nama: input.nama,
            nim: input.nim,
        });

        try {
            await batch.commit();

            // Commit berhasil dikonfirmasi server.
            // Timestamp server belum dibaca ulang, jadi sementara null.
            return {
                ok: true,
                data: {
                    uid: input.uid,
                    nama: input.nama,
                    nim: input.nim,
                    email: input.email,
                    peran: 'PRAKTIKAN',
                    kodePeserta,
                    dibuatPada: null,
                },
            };
        } catch (error) {
            kesalahanTerakhir = error;

            // Batch gagal. Periksa apakah profil sebenarnya sudah
            // berhasil tersimpan, misalnya dari percobaan sebelumnya.
            try {
                const profilSetelahGagal = await getDoc(referensiProfil);

                if (profilSetelahGagal.exists()) {
                    const pengguna = konversiPengguna(
                        profilSetelahGagal.data(),
                        input.uid,
                    );

                    if (pengguna) {
                        return { ok: true, data: pengguna };
                    }

                    return gagal(
                        'PROFIL_BELUM_LENGKAP',
                        'Profil ditemukan tetapi datanya belum lengkap atau tidak valid.',
                    );
                }
            } catch (errorBaca) {
                // Tidak bisa memastikan kondisi profil, misalnya karena
                // koneksi terputus atau akses Firestore ditolak.
                return hasilError<Pengguna>(errorBaca);
            }
        }
    }

    return hasilError<Pengguna>(kesalahanTerakhir);
}

/**
 * Registrasi Firebase Auth, kemudian membuat profil dan
 * mapping kode peserta secara atomik di Firestore.
 */
export async function daftar(
    input: InputDaftar,
): Promise<Hasil<Pengguna>> {
    if (!isFirebaseAvailable) {
        return firebaseTidakTersedia<Pengguna>();
    }

    const identitas = validasiIdentitas(input);

    if (!identitas.ok) return identitas;

    const email = input.email.trim().toLowerCase();
    const password = input.password;

    if (!email || !password) {
        return gagal(
            'INPUT_TIDAK_VALID',
            'Email dan kata sandi wajib diisi.',
        );
    }

    try {
        const { auth } = getFirebaseServices();

        const credential = await createUserWithEmailAndPassword(
            auth,
            email,
            password,
        );

        const penggunaAuth = credential.user;

        if (!penggunaAuth.email) {
            return gagal(
                'AUTENTIKASI_GAGAL',
                'Akun berhasil dibuat, tetapi email akun tidak tersedia. Jangan daftar ulang.',
            );
        }

        const hasilSimpan = await simpanProfilDanKode({
            uid: penggunaAuth.uid,
            email: penggunaAuth.email,
            nama: identitas.data.nama,
            nim: identitas.data.nim,
        });

        if (!hasilSimpan.ok) {
            return {
                ok: false,
                alasan: hasilSimpan.alasan,
                pesan:
                    `Akun autentikasi sudah berhasil dibuat, tetapi profil belum berhasil disimpan. ` +
                    `Jangan daftar ulang. Gunakan fitur pemulihan profil. Detail: ${hasilSimpan.pesan}`,
            };
        }

        return hasilSimpan;
    } catch (error) {
        return hasilError<Pengguna>(error);
    }
}

/**
 * Memulihkan profil untuk akun Auth yang sudah aktif,
 * tetapi profil Firestore belum berhasil dibuat.
 */
export async function lengkapiProfil(
    input: InputLengkapiProfil,
): Promise<Hasil<Pengguna>> {
    if (!isFirebaseAvailable) {
        return firebaseTidakTersedia<Pengguna>();
    }

    const identitas = validasiIdentitas(input);

    if (!identitas.ok) return identitas;

    try {
        const { auth } = getFirebaseServices();
        const penggunaAuth = auth.currentUser;

        if (!penggunaAuth || !penggunaAuth.email) {
            return gagal(
                'AUTENTIKASI_GAGAL',
                'Tidak ada akun aktif. Silakan masuk kembali.',
            );
        }

        return await simpanProfilDanKode({
            uid: penggunaAuth.uid,
            email: penggunaAuth.email,
            nama: identitas.data.nama,
            nim: identitas.data.nim,
        });
    } catch (error) {
        return hasilError<Pengguna>(error);
    }
}

/**
 * Masuk dengan Firebase Authentication dan mengambil profil
 * berdasarkan UID akun Auth yang berhasil masuk.
 */
export async function masuk(
    email: string,
    password: string,
): Promise<Hasil<Pengguna>> {
    if (!isFirebaseAvailable) {
        return firebaseTidakTersedia<Pengguna>();
    }

    const emailNormal = email.trim().toLowerCase();

    if (!emailNormal || !password) {
        return gagal(
            'INPUT_TIDAK_VALID',
            'Email dan kata sandi wajib diisi.',
        );
    }

    try {
        const { auth } = getFirebaseServices();

        const credential = await signInWithEmailAndPassword(
            auth,
            emailNormal,
            password,
        );

        return await bacaProfil(credential.user.uid);
    } catch (error) {
        return hasilError<Pengguna>(error);
    }
}

/**
 * Keluar dari akun Firebase Authentication.
 */
export async function keluar(): Promise<Hasil> {
    if (!isFirebaseAvailable) {
        return firebaseTidakTersedia();
    }

    try {
        const { auth } = getFirebaseServices();

        await signOut(auth);

        return {
            ok: true,
            data: undefined,
        };
    } catch (error) {
        return hasilError(error);
    }
}
