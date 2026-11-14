import {
    collection,
    doc,
    getDoc,
    onSnapshot,
    orderBy,
    query,
    runTransaction,
    Timestamp,
    where,
    writeBatch,
} from '@react-native-firebase/firestore';

import {
    getFirebaseServices,
    isFirebaseAvailable,
} from '@/lib/firebase';
import type {
    AlasanGagal,
    Hasil,
    Peran,
    Sesi,
    StatusSesi,
} from '@/types';

/**
 * Input untuk membuat sesi baru.
 */
export type InputBuatSesi = {
    kelasId: string;
    judul: string;
    lokasi: string;
    waktuMulai: Date;
    waktuSelesai: Date | null;
};

/**
 * Data yang boleh diubah melalui edit sesi.
 */
export type InputUbahSesi = Partial<
    Pick<
        Sesi,
        'judul' | 'lokasi' | 'waktuMulai' | 'waktuSelesai'
    >
>;

const PANJANG_MAKS_TEKS = 100;
const STATUS_SESI_VALID: readonly StatusSesi[] = [
    'BELUM_DIBUKA',
    'DIBUKA',
    'DITUTUP',
];

function gagal(alasan: AlasanGagal, pesan: string): Hasil<never> {
    return { ok: false, alasan, pesan };
}

function isErrorBerkode(
    error: unknown,
): error is { code: string; message?: string } {
    return (
        typeof error === 'object' &&
        error !== null &&
        'code' in error &&
        typeof (error as { code: unknown }).code === 'string'
    );
}

function petakanErrorFirestore(error: unknown, pesanDefault: string): Hasil<never> {
    if (isErrorBerkode(error)) {
        const kode = error.code.replace(/^firestore\//, '');
        switch (kode) {
            case 'permission-denied':
                return gagal(
                    'TIDAK_BERWENANG',
                    'Anda tidak memiliki izin untuk mengakses atau mengubah sesi ini.',
                );
            case 'not-found':
                return gagal(
                    'DATA_TIDAK_DITEMUKAN',
                    'Data sesi atau kelas tidak ditemukan.',
                );
            case 'unauthenticated':
                return gagal(
                    'AUTENTIKASI_GAGAL',
                    'Sesi login Anda telah berakhir. Silakan masuk kembali.',
                );
            case 'unavailable':
            case 'network-request-failed':
                return gagal(
                    'JARINGAN',
                    'Koneksi ke server terganggu. Periksa jaringan Anda lalu coba lagi.',
                );
            case 'deadline-exceeded':
                return gagal(
                    'TIMEOUT',
                    'Permintaan ke server melebihi batas waktu. Silakan coba lagi.',
                );
            case 'resource-exhausted':
                return gagal(
                    'KUOTA_HABIS',
                    'Kuota layanan sedang penuh. Silakan coba beberapa saat lagi.',
                );
            default:
                return gagal('TIDAK_DIKENAL', pesanDefault);
        }
    }

    if (error instanceof Error && error.message.trim().length > 0) {
        return gagal('TIDAK_DIKENAL', error.message);
    }

    return gagal('TIDAK_DIKENAL', pesanDefault);
}

function buatKodeQrAcak(): string {
    const cryptoApi = globalThis.crypto;
    if (!cryptoApi || typeof cryptoApi.getRandomValues !== 'function') {
        throw new Error(
            'Generator acak kriptografis tidak tersedia di perangkat ini.',
        );
    }

    // 16 byte = 128 bit entropi; hex lowercase bebas titik dua dan spasi.
    const bytes = new Uint8Array(16);
    cryptoApi.getRandomValues(bytes);

    return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
}

function validasiTeksWajib(
    nilai: unknown,
    namaField: string,
): { ok: true; nilai: string } | { ok: false; hasil: Hasil<never> } {
    if (typeof nilai !== 'string') {
        return {
            ok: false,
            hasil: gagal('INPUT_TIDAK_VALID', `${namaField} wajib diisi.`),
        };
    }

    const rapi = nilai.trim();
    if (rapi.length === 0) {
        return {
            ok: false,
            hasil: gagal(
                'INPUT_TIDAK_VALID',
                `${namaField} tidak boleh kosong atau hanya berisi spasi.`,
            ),
        };
    }

    if (rapi.length > PANJANG_MAKS_TEKS) {
        return {
            ok: false,
            hasil: gagal(
                'INPUT_TIDAK_VALID',
                `${namaField} maksimal ${PANJANG_MAKS_TEKS} karakter.`,
            ),
        };
    }

    return { ok: true, nilai: rapi };
}

function isDateValid(nilai: unknown): nilai is Date {
    return nilai instanceof Date && !Number.isNaN(nilai.getTime());
}

function validasiRentangWaktu(
    waktuMulai: Date,
    waktuSelesai: Date | null,
): Hasil<never> | null {
    if (!isDateValid(waktuMulai)) {
        return gagal('INPUT_TIDAK_VALID', 'Waktu mulai sesi tidak valid.');
    }

    if (waktuSelesai !== null) {
        if (!isDateValid(waktuSelesai)) {
            return gagal('INPUT_TIDAK_VALID', 'Waktu selesai sesi tidak valid.');
        }

        if (waktuSelesai.getTime() <= waktuMulai.getTime()) {
            return gagal(
                'INPUT_TIDAK_VALID',
                'Waktu selesai harus lebih besar dari waktu mulai.',
            );
        }
    }

    return null;
}

function konversiKeDate(nilai: unknown): Date | null {
    if (nilai === null || nilai === undefined) {
        return null;
    }

    if (nilai instanceof Timestamp) {
        return nilai.toDate();
    }

    if (nilai instanceof Date) {
        return Number.isNaN(nilai.getTime()) ? null : nilai;
    }

    if (
        typeof nilai === 'object' &&
        'toDate' in nilai &&
        typeof (nilai as { toDate: unknown }).toDate === 'function'
    ) {
        const hasil = (nilai as { toDate: () => Date }).toDate();
        return hasil instanceof Date && !Number.isNaN(hasil.getTime())
            ? hasil
            : null;
    }

    return null;
}

function bacaStatusSesi(nilai: unknown): StatusSesi {
    if (
        typeof nilai === 'string' &&
        (STATUS_SESI_VALID as readonly string[]).includes(nilai)
    ) {
        return nilai as StatusSesi;
    }
    return 'BELUM_DIBUKA';
}

type DokumenSnapshotMinimal = {
    id: string;
    data: () => Record<string, unknown> | undefined;
};

function petakanDokumenSesi(
    snap: DokumenSnapshotMinimal,
): Sesi | null {
    const data = snap.data();
    if (!data) {
        return null;
    }

    const waktuMulai = konversiKeDate(data.waktuMulai);
    if (!waktuMulai) {
        return null;
    }

    return {
        idSesi: snap.id,
        kelasId: typeof data.kelasId === 'string' ? data.kelasId : '',
        judul: typeof data.judul === 'string' ? data.judul : '',
        lokasi: typeof data.lokasi === 'string' ? data.lokasi : '',
        waktuMulai,
        waktuSelesai: konversiKeDate(data.waktuSelesai),
        statusSesi: bacaStatusSesi(data.statusSesi),
        diarsipkan: Boolean(data.diarsipkan),
    };
}

async function verifikasiAsistenAktif(): Promise<
    | { ok: true; uid: string; db: ReturnType<typeof getFirebaseServices>['db'] }
    | { ok: false; hasil: Hasil<never> }
> {
    if (!isFirebaseAvailable) {
        return {
            ok: false,
            hasil: gagal(
                'TIDAK_DIKENAL',
                'Firebase Hadir.in saat ini hanya tersedia di Android.',
            ),
        };
    }

    const { auth, db } = getFirebaseServices();
    const user = auth.currentUser;
    if (!user) {
        return {
            ok: false,
            hasil: gagal(
                'AUTENTIKASI_GAGAL',
                'Anda harus login terlebih dahulu.',
            ),
        };
    }

    const penggunaSnap = await getDoc(doc(db, 'pengguna', user.uid));
    const penggunaData = penggunaSnap.data();
    if (!penggunaData) {
        return {
            ok: false,
            hasil: gagal(
                'PROFIL_BELUM_LENGKAP',
                'Profil pengguna belum lengkap.',
            ),
        };
    }

    const peran = penggunaData.peran as Peran | undefined;
    if (peran !== 'ASISTEN') {
        return {
            ok: false,
            hasil: gagal(
                'TIDAK_BERWENANG',
                'Hanya asisten yang dapat mengelola sesi.',
            ),
        };
    }

    return { ok: true, uid: user.uid, db };
}

/**
 * Membuat sesi baru beserta dokumen kode QR rahasia secara atomik dalam satu batch.
 */
export async function buatSesi(
    input: InputBuatSesi,
): Promise<Hasil> {
    const idKelasRapi =
        typeof input.kelasId === 'string' ? input.kelasId.trim() : '';
    if (idKelasRapi.length === 0) {
        return gagal('INPUT_TIDAK_VALID', 'ID kelas wajib diisi.');
    }

    const cekJudul = validasiTeksWajib(input.judul, 'Judul sesi');
    if (!cekJudul.ok) {
        return cekJudul.hasil;
    }

    const cekLokasi = validasiTeksWajib(input.lokasi, 'Lokasi sesi');
    if (!cekLokasi.ok) {
        return cekLokasi.hasil;
    }

    const errorWaktu = validasiRentangWaktu(
        input.waktuMulai,
        input.waktuSelesai,
    );
    if (errorWaktu) {
        return errorWaktu;
    }

    try {
        const cekAsisten = await verifikasiAsistenAktif();
        if (!cekAsisten.ok) {
            return cekAsisten.hasil;
        }

        const { uid, db } = cekAsisten;
        const kelasSnap = await getDoc(doc(db, 'kelas', idKelasRapi));
        const kelasData = kelasSnap.data();
        if (!kelasData) {
            return gagal('DATA_TIDAK_DITEMUKAN', 'Kelas tidak ditemukan.');
        }

        if (kelasData.asistenUid !== uid) {
            return gagal(
                'TIDAK_BERWENANG',
                'Anda bukan asisten pemilik kelas ini.',
            );
        }

        if (kelasData.diarsipkan === true) {
            return gagal(
                'DATA_DIARSIPKAN',
                'Kelas sudah diarsipkan dan tidak dapat ditambah sesi baru.',
            );
        }

        const kodeQr = buatKodeQrAcak();
        const sesiRef = doc(collection(db, 'sesi'));
        const qrRef = doc(db, 'sesi', sesiRef.id, 'rahasia', 'qr');

        const batch = writeBatch(db);
        batch.set(sesiRef, {
            kelasId: idKelasRapi,
            judul: cekJudul.nilai,
            lokasi: cekLokasi.nilai,
            waktuMulai: Timestamp.fromDate(input.waktuMulai),
            waktuSelesai:
                input.waktuSelesai !== null
                    ? Timestamp.fromDate(input.waktuSelesai)
                    : null,
            statusSesi: 'BELUM_DIBUKA' satisfies StatusSesi,
            diarsipkan: false,
        });
        batch.set(qrRef, {
            kodeQr,
        });

        await batch.commit();
        return { ok: true, data: undefined };
    } catch (error) {
        return petakanErrorFirestore(error, 'Gagal membuat sesi baru.');
    }
}

/**
 * Mengubah jadwal atau informasi sesi.
 */
export async function ubahSesi(
    idSesi: string,
    data: InputUbahSesi,
): Promise<Hasil> {
    const idSesiRapi = typeof idSesi === 'string' ? idSesi.trim() : '';
    if (idSesiRapi.length === 0) {
        return gagal('INPUT_TIDAK_VALID', 'ID sesi wajib diisi.');
    }

    const adaPerubahan =
        data.judul !== undefined ||
        data.lokasi !== undefined ||
        data.waktuMulai !== undefined ||
        data.waktuSelesai !== undefined;

    if (!adaPerubahan) {
        return gagal(
            'INPUT_TIDAK_VALID',
            'Tidak ada perubahan data sesi yang dikirim.',
        );
    }

    let judulBaru: string | undefined;
    if (data.judul !== undefined) {
        const cekJudul = validasiTeksWajib(data.judul, 'Judul sesi');
        if (!cekJudul.ok) {
            return cekJudul.hasil;
        }
        judulBaru = cekJudul.nilai;
    }

    let lokasiBaru: string | undefined;
    if (data.lokasi !== undefined) {
        const cekLokasi = validasiTeksWajib(data.lokasi, 'Lokasi sesi');
        if (!cekLokasi.ok) {
            return cekLokasi.hasil;
        }
        lokasiBaru = cekLokasi.nilai;
    }

    if (data.waktuMulai !== undefined && !isDateValid(data.waktuMulai)) {
        return gagal('INPUT_TIDAK_VALID', 'Waktu mulai sesi tidak valid.');
    }

    if (
        data.waktuSelesai !== undefined &&
        data.waktuSelesai !== null &&
        !isDateValid(data.waktuSelesai)
    ) {
        return gagal('INPUT_TIDAK_VALID', 'Waktu selesai sesi tidak valid.');
    }

    try {
        const cekAsisten = await verifikasiAsistenAktif();
        if (!cekAsisten.ok) {
            return cekAsisten.hasil;
        }

        const { uid, db } = cekAsisten;
        const sesiRef = doc(db, 'sesi', idSesiRapi);

        const hasilTransaksi = await runTransaction(db, async (tx) => {
            const sesiSnap = await tx.get(sesiRef);
            const sesiData = sesiSnap.data();
            if (!sesiData) {
                return gagal('DATA_TIDAK_DITEMUKAN', 'Sesi tidak ditemukan.');
            }

            const kelasId =
                typeof sesiData.kelasId === 'string' ? sesiData.kelasId : '';
            if (kelasId.length === 0) {
                return gagal('DATA_TIDAK_DITEMUKAN', 'Kelas sesi tidak valid.');
            }

            const kelasSnap = await tx.get(doc(db, 'kelas', kelasId));
            const kelasData = kelasSnap.data();
            if (!kelasData) {
                return gagal('DATA_TIDAK_DITEMUKAN', 'Kelas tidak ditemukan.');
            }

            if (kelasData.asistenUid !== uid) {
                return gagal(
                    'TIDAK_BERWENANG',
                    'Anda bukan asisten pemilik kelas ini.',
                );
            }

            if (kelasData.diarsipkan === true) {
                return gagal(
                    'DATA_DIARSIPKAN',
                    'Kelas sudah diarsipkan sehingga jadwal sesi tidak dapat diubah.',
                );
            }

            if (sesiData.diarsipkan === true) {
                return gagal(
                    'DATA_DIARSIPKAN',
                    'Sesi sudah diarsipkan dan tidak dapat diubah.',
                );
            }

            const waktuMulaiLama = konversiKeDate(sesiData.waktuMulai);
            const waktuSelesaiLama = konversiKeDate(sesiData.waktuSelesai);

            const waktuMulaiAkhir =
                data.waktuMulai !== undefined ? data.waktuMulai : waktuMulaiLama;
            const waktuSelesaiAkhir =
                data.waktuSelesai !== undefined
                    ? data.waktuSelesai
                    : waktuSelesaiLama;

            if (!waktuMulaiAkhir) {
                return gagal(
                    'INPUT_TIDAK_VALID',
                    'Waktu mulai sesi tidak valid.',
                );
            }

            const errorWaktu = validasiRentangWaktu(
                waktuMulaiAkhir,
                waktuSelesaiAkhir,
            );
            if (errorWaktu) {
                return errorWaktu;
            }

            const payloadUpdate: Record<string, unknown> = {};
            if (judulBaru !== undefined) {
                payloadUpdate.judul = judulBaru;
            }
            if (lokasiBaru !== undefined) {
                payloadUpdate.lokasi = lokasiBaru;
            }
            if (data.waktuMulai !== undefined) {
                payloadUpdate.waktuMulai = Timestamp.fromDate(data.waktuMulai);
            }
            if (data.waktuSelesai !== undefined) {
                payloadUpdate.waktuSelesai =
                    data.waktuSelesai !== null
                        ? Timestamp.fromDate(data.waktuSelesai)
                        : null;
            }

            tx.update(sesiRef, payloadUpdate);
            return { ok: true, data: undefined } satisfies Hasil;
        });

        return hasilTransaksi;
    } catch (error) {
        return petakanErrorFirestore(error, 'Gagal memperbarui sesi.');
    }
}

/**
 * Mengarsipkan sesi (satu arah: false -> true).
 * Sesi yang masih DIBUKA harus ditutup terlebih dahulu.
 */
export async function arsipkanSesi(
    idSesi: string,
): Promise<Hasil> {
    const idSesiRapi = typeof idSesi === 'string' ? idSesi.trim() : '';
    if (idSesiRapi.length === 0) {
        return gagal('INPUT_TIDAK_VALID', 'ID sesi wajib diisi.');
    }

    try {
        const cekAsisten = await verifikasiAsistenAktif();
        if (!cekAsisten.ok) {
            return cekAsisten.hasil;
        }

        const { uid, db } = cekAsisten;
        const sesiRef = doc(db, 'sesi', idSesiRapi);

        const hasilTransaksi = await runTransaction(db, async (tx) => {
            const sesiSnap = await tx.get(sesiRef);
            const sesiData = sesiSnap.data();
            if (!sesiData) {
                return gagal('DATA_TIDAK_DITEMUKAN', 'Sesi tidak ditemukan.');
            }

            const kelasId =
                typeof sesiData.kelasId === 'string' ? sesiData.kelasId : '';
            const kelasSnap = await tx.get(doc(db, 'kelas', kelasId));
            const kelasData = kelasSnap.data();
            if (!kelasData) {
                return gagal('DATA_TIDAK_DITEMUKAN', 'Kelas tidak ditemukan.');
            }

            if (kelasData.asistenUid !== uid) {
                return gagal(
                    'TIDAK_BERWENANG',
                    'Anda bukan asisten pemilik kelas ini.',
                );
            }

            if (sesiData.diarsipkan === true) {
                return gagal(
                    'DATA_DIARSIPKAN',
                    'Sesi sudah diarsipkan.',
                );
            }

            const statusSekarang = bacaStatusSesi(sesiData.statusSesi);
            if (statusSekarang === 'DIBUKA') {
                return gagal(
                    'INPUT_TIDAK_VALID',
                    'Tutup sesi terlebih dahulu sebelum mengarsipkan.',
                );
            }

            tx.update(sesiRef, { diarsipkan: true });
            return { ok: true, data: undefined } satisfies Hasil;
        });

        return hasilTransaksi;
    } catch (error) {
        return petakanErrorFirestore(error, 'Gagal mengarsipkan sesi.');
    }
}

/**
 * Membuka sesi presensi (BELUM_DIBUKA -> DIBUKA).
 */
export async function bukaSesi(
    idSesi: string,
): Promise<Hasil> {
    const idSesiRapi = typeof idSesi === 'string' ? idSesi.trim() : '';
    if (idSesiRapi.length === 0) {
        return gagal('INPUT_TIDAK_VALID', 'ID sesi wajib diisi.');
    }

    try {
        const cekAsisten = await verifikasiAsistenAktif();
        if (!cekAsisten.ok) {
            return cekAsisten.hasil;
        }

        const { uid, db } = cekAsisten;
        const sesiRef = doc(db, 'sesi', idSesiRapi);

        const hasilTransaksi = await runTransaction(db, async (tx) => {
            const sesiSnap = await tx.get(sesiRef);
            const sesiData = sesiSnap.data();
            if (!sesiData) {
                return gagal('DATA_TIDAK_DITEMUKAN', 'Sesi tidak ditemukan.');
            }

            const kelasId =
                typeof sesiData.kelasId === 'string' ? sesiData.kelasId : '';
            const kelasSnap = await tx.get(doc(db, 'kelas', kelasId));
            const kelasData = kelasSnap.data();
            if (!kelasData) {
                return gagal('DATA_TIDAK_DITEMUKAN', 'Kelas tidak ditemukan.');
            }

            if (kelasData.asistenUid !== uid) {
                return gagal(
                    'TIDAK_BERWENANG',
                    'Anda bukan asisten pemilik kelas ini.',
                );
            }

            if (kelasData.diarsipkan === true || sesiData.diarsipkan === true) {
                return gagal(
                    'DATA_DIARSIPKAN',
                    'Data sudah diarsipkan sehingga sesi tidak dapat dibuka.',
                );
            }

            const statusSekarang = bacaStatusSesi(sesiData.statusSesi);
            if (statusSekarang === 'DITUTUP') {
                return gagal(
                    'SUDAH_DITUTUP',
                    'Sesi yang sudah ditutup tidak dapat dibuka kembali.',
                );
            }

            if (statusSekarang === 'DIBUKA') {
                return gagal(
                    'INPUT_TIDAK_VALID',
                    'Sesi sudah dalam status dibuka.',
                );
            }

            tx.update(sesiRef, { statusSesi: 'DIBUKA' satisfies StatusSesi });
            return { ok: true, data: undefined } satisfies Hasil;
        });

        return hasilTransaksi;
    } catch (error) {
        return petakanErrorFirestore(error, 'Gagal membuka sesi.');
    }
}

/**
 * Menutup sesi presensi (DIBUKA -> DITUTUP).
 */
export async function tutupSesi(
    idSesi: string,
): Promise<Hasil> {
    const idSesiRapi = typeof idSesi === 'string' ? idSesi.trim() : '';
    if (idSesiRapi.length === 0) {
        return gagal('INPUT_TIDAK_VALID', 'ID sesi wajib diisi.');
    }

    try {
        const cekAsisten = await verifikasiAsistenAktif();
        if (!cekAsisten.ok) {
            return cekAsisten.hasil;
        }

        const { uid, db } = cekAsisten;
        const sesiRef = doc(db, 'sesi', idSesiRapi);

        const hasilTransaksi = await runTransaction(db, async (tx) => {
            const sesiSnap = await tx.get(sesiRef);
            const sesiData = sesiSnap.data();
            if (!sesiData) {
                return gagal('DATA_TIDAK_DITEMUKAN', 'Sesi tidak ditemukan.');
            }

            const kelasId =
                typeof sesiData.kelasId === 'string' ? sesiData.kelasId : '';
            const kelasSnap = await tx.get(doc(db, 'kelas', kelasId));
            const kelasData = kelasSnap.data();
            if (!kelasData) {
                return gagal('DATA_TIDAK_DITEMUKAN', 'Kelas tidak ditemukan.');
            }

            if (kelasData.asistenUid !== uid) {
                return gagal(
                    'TIDAK_BERWENANG',
                    'Anda bukan asisten pemilik kelas ini.',
                );
            }

            if (sesiData.diarsipkan === true) {
                return gagal(
                    'DATA_DIARSIPKAN',
                    'Sesi sudah diarsipkan.',
                );
            }

            const statusSekarang = bacaStatusSesi(sesiData.statusSesi);
            if (statusSekarang === 'BELUM_DIBUKA') {
                return gagal(
                    'BELUM_DIBUKA',
                    'Sesi belum dibuka sehingga belum dapat ditutup.',
                );
            }

            if (statusSekarang === 'DITUTUP') {
                return gagal(
                    'SUDAH_DITUTUP',
                    'Sesi sudah ditutup sebelumnya.',
                );
            }

            tx.update(sesiRef, { statusSesi: 'DITUTUP' satisfies StatusSesi });
            return { ok: true, data: undefined } satisfies Hasil;
        });

        return hasilTransaksi;
    } catch (error) {
        return petakanErrorFirestore(error, 'Gagal menutup sesi.');
    }
}

/**
 * Mendengarkan daftar sesi aktif (tidak diarsipkan) berdasarkan kelas,
 * diurutkan berdasarkan waktuMulai menaik.
 */
export function listenSesiKelas(
    idKelas: string,
    callback: (sesi: Sesi[]) => void,
    onError: (error: Error) => void,
): () => void {
    const idKelasRapi = typeof idKelas === 'string' ? idKelas.trim() : '';
    if (idKelasRapi.length === 0) {
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
        collection(db, 'sesi'),
        where('kelasId', '==', idKelasRapi),
        where('diarsipkan', '==', false),
        orderBy('waktuMulai', 'asc'),
    );

    return onSnapshot(
        q,
        (snapshot) => {
            const daftarSesi: Sesi[] = [];
            for (const docSnap of snapshot.docs) {
                const sesi = petakanDokumenSesi(docSnap);
                if (sesi) {
                    daftarSesi.push(sesi);
                }
            }
            callback(daftarSesi);
        },
        (error) => {
            onError(error);
        },
    );
}

/**
 * Mendengarkan detail sesi berdasarkan ID.
 * Digunakan untuk detail sesi aktif maupun akses riwayat pribadi.
 */
export function listenSesiById(
    idSesi: string,
    callback: (sesi: Sesi | null) => void,
    onError: (error: Error) => void,
): () => void {
    const idSesiRapi = typeof idSesi === 'string' ? idSesi.trim() : '';
    if (idSesiRapi.length === 0) {
        callback(null);
        return () => {};
    }

    if (!isFirebaseAvailable) {
        onError(
            new Error('Firebase Hadir.in saat ini hanya tersedia di Android.'),
        );
        return () => {};
    }

    const { db } = getFirebaseServices();
    const sesiRef = doc(db, 'sesi', idSesiRapi);

    return onSnapshot(
        sesiRef,
        (docSnap) => {
            callback(petakanDokumenSesi(docSnap));
        },
        (error) => {
            onError(error);
        },
    );
}

/**
 * Mengambil kode QR rahasia milik sesi dari subkoleksi sesi/{idSesi}/rahasia/qr.
 * Hanya asisten pemilik kelas yang berhak mengakses.
 */
export async function ambilKodeQr(
    idSesi: string,
): Promise<Hasil<string>> {
    const idSesiRapi = typeof idSesi === 'string' ? idSesi.trim() : '';
    if (idSesiRapi.length === 0) {
        return gagal('INPUT_TIDAK_VALID', 'ID sesi wajib diisi.');
    }

    try {
        const cekAsisten = await verifikasiAsistenAktif();
        if (!cekAsisten.ok) {
            return cekAsisten.hasil;
        }

        const { uid, db } = cekAsisten;
        const sesiSnap = await getDoc(doc(db, 'sesi', idSesiRapi));
        const sesiData = sesiSnap.data();
        if (!sesiData) {
            return gagal('DATA_TIDAK_DITEMUKAN', 'Sesi tidak ditemukan.');
        }

        const kelasId =
            typeof sesiData.kelasId === 'string' ? sesiData.kelasId : '';
        const kelasSnap = await getDoc(doc(db, 'kelas', kelasId));
        const kelasData = kelasSnap.data();
        if (!kelasData) {
            return gagal('DATA_TIDAK_DITEMUKAN', 'Kelas tidak ditemukan.');
        }

        if (kelasData.asistenUid !== uid) {
            return gagal(
                'TIDAK_BERWENANG',
                'Hanya asisten pemilik kelas yang dapat mengakses kode QR sesi ini.',
            );
        }

        const qrSnap = await getDoc(
            doc(db, 'sesi', idSesiRapi, 'rahasia', 'qr'),
        );
        const qrData = qrSnap.data();
        if (!qrData) {
            return gagal(
                'DATA_TIDAK_DITEMUKAN',
                'Kode QR sesi tidak ditemukan.',
            );
        }

        const kodeQr = qrData.kodeQr;
        if (typeof kodeQr !== 'string' || kodeQr.trim().length === 0) {
            return gagal(
                'RESPONS_TIDAK_VALID',
                'Format kode QR sesi tidak valid.',
            );
        }

        return { ok: true, data: kodeQr };
    } catch (error) {
        return petakanErrorFirestore(error, 'Gagal mengambil kode QR sesi.');
    }
}