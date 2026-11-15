
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
import { hasilErrorFirebase } from '@/utils/error-firebase';
import {
    normalisasiEmail,
    validasiEmail,
    validasiIdentitas,
    validasiPassword,
} from '@/utils/validasi-form';

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
        return hasilErrorFirebase<Pengguna>(error);
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
                return hasilErrorFirebase<Pengguna>(errorBaca);
            }
        }
    }

    return hasilErrorFirebase<Pengguna>(kesalahanTerakhir);
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

    const kesalahanIdentitas = validasiIdentitas(input);
    if (kesalahanIdentitas) {
        return gagal('INPUT_TIDAK_VALID', kesalahanIdentitas);
    }

    const kesalahanEmail = validasiEmail(input.email);
    if (kesalahanEmail) {
        return gagal('INPUT_TIDAK_VALID', kesalahanEmail);
    }

    const kesalahanPassword = validasiPassword(input.password);
    if (kesalahanPassword) {
        return gagal('INPUT_TIDAK_VALID', kesalahanPassword);
    }

    const email = normalisasiEmail(input.email);
    const password = input.password;
    const nama = input.nama.trim();
    const nim = input.nim.trim();

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
            nama,
            nim,
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
        return hasilErrorFirebase<Pengguna>(error);
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

    const kesalahanIdentitas = validasiIdentitas(input);
    if (kesalahanIdentitas) {
        return gagal('INPUT_TIDAK_VALID', kesalahanIdentitas);
    }

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
            nama: input.nama.trim(),
            nim: input.nim.trim(),
        });
    } catch (error) {
        return hasilErrorFirebase<Pengguna>(error);
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

    const kesalahanEmail = validasiEmail(email);
    if (kesalahanEmail) {
        return gagal('INPUT_TIDAK_VALID', kesalahanEmail);
    }
    if (!password) {
        return gagal('INPUT_TIDAK_VALID', 'Kata sandi wajib diisi.');
    }

    const emailNormal = normalisasiEmail(email);

    try {
        const { auth } = getFirebaseServices();

        const credential = await signInWithEmailAndPassword(
            auth,
            emailNormal,
            password,
        );

        return await bacaProfil(credential.user.uid);
    } catch (error) {
        return hasilErrorFirebase<Pengguna>(error);
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
        return hasilErrorFirebase(error);
    }
}
