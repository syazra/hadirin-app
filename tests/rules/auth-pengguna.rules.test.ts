import { resolve } from 'node:path';
import 'firebase/compat/firestore';
import { readFileSync } from 'node:fs';
import { after, before, beforeEach, test } from 'node:test';
import assert from 'node:assert/strict';

import {
    assertFails,
    assertSucceeds,
    initializeTestEnvironment,
    type RulesTestEnvironment,
} from '@firebase/rules-unit-testing';

import {
    collection,
    doc,
    getDoc,
    getDocs,
    orderBy,
    query,
    serverTimestamp,
    setDoc,
    Timestamp,
    updateDoc,
    where,
    writeBatch,
} from 'firebase/firestore';

const PROJECT_ID = 'demo-hadirin';

let testEnv: RulesTestEnvironment;

type OpsiRegistrasi = {
    uid: string;
    email?: string;
    nama?: string;
    nim?: string;
    peran?: string;
    profileUid?: string;
    kodeProfil?: string;
    kodeDokumen?: string;
    uidMapping?: string;
    fieldTambahan?: Record<string, unknown>;
};

before(async () => {
    testEnv = await initializeTestEnvironment({
        projectId: PROJECT_ID,
        firestore: {
            host: '127.0.0.1',
            port: 8080,
            rules: readFileSync(resolve(__dirname, '../../firestore.rules'),
                'utf8'),
        },
    });
});

beforeEach(async () => {
    await testEnv.clearFirestore();
});

after(async () => {
    await testEnv.cleanup();
});

async function kirimRegistrasi(opsi: OpsiRegistrasi) {
    const uid = opsi.uid;
    const email = opsi.email ?? `${uid}@example.com`;
    const nama = opsi.nama ?? 'Aqilla Test';
    const nim = opsi.nim ?? '1234567890';
    const peran = opsi.peran ?? 'PRAKTIKAN';

    const profileUid = opsi.profileUid ?? uid;
    const kodeProfil = opsi.kodeProfil ?? 'TEST1234';
    const kodeDokumen = opsi.kodeDokumen ?? kodeProfil;
    const uidMapping = opsi.uidMapping ?? uid;

    const db = testEnv.authenticatedContext(uid, { email }).firestore();
    const batch = writeBatch(db);

    batch.set(doc(db, 'pengguna', profileUid), {
        nama,
        nim,
        email,
        peran,
        kodePeserta: kodeProfil,
        dibuatPada: serverTimestamp(),
        ...opsi.fieldTambahan,
    });

    batch.set(doc(db, 'kodePeserta', kodeDokumen), {
        uid: uidMapping,
        nama,
        nim,
    });

    return batch.commit();
}

test('REG-RULE-01: registrasi normal diperbolehkan', async () => {
    await assertSucceeds(
        kirimRegistrasi({ uid: 'user-normal' }),
    );
});

test('REG-RULE-02: pengguna tanpa autentikasi ditolak', async () => {
    const db = testEnv.unauthenticatedContext().firestore();

    await assertFails(
        setDoc(doc(db, 'pengguna', 'user-anonim'), {
            nama: 'Pengguna Anonim',
            nim: '1234567890',
            email: 'anonim@example.com',
            peran: 'PRAKTIKAN',
            kodePeserta: 'ANON1234',
            dibuatPada: serverTimestamp(),
        }),
    );
});

test('REG-RULE-03: pengguna tidak boleh membuat profil UID orang lain', async () => {
    await assertFails(
        kirimRegistrasi({
            uid: 'user-penyerang',
            profileUid: 'user-korban',
        }),
    );
});

test('REG-RULE-04: role awal wajib PRAKTIKAN', async () => {
    await assertFails(
        kirimRegistrasi({
            uid: 'user-role',
            peran: 'ASISTEN',
        }),
    );
});

test('REG-RULE-05: field tambahan pada profil ditolak', async () => {
    await assertFails(
        kirimRegistrasi({
            uid: 'user-field',
            fieldTambahan: {
                admin: true,
            },
        }),
    );
});

test('REG-RULE-06: nama lebih dari 100 karakter ditolak', async () => {
    await assertFails(
        kirimRegistrasi({
            uid: 'user-nama-panjang',
            nama: 'A'.repeat(101),
        }),
    );
});

test('REG-RULE-07: NIM lebih dari 32 karakter ditolak', async () => {
    await assertFails(
        kirimRegistrasi({
            uid: 'user-nim-panjang',
            nim: '1'.repeat(33),
        }),
    );
});

test('REG-RULE-08: mapping kode harus cocok dengan profil', async () => {
    await assertFails(
        kirimRegistrasi({
            uid: 'user-mapping',
            kodeProfil: 'PROFIL01',
            kodeDokumen: 'MAPPING1',
        }),
    );
});

test('REG-RULE-09: UID pada mapping harus cocok dengan pemilik profil', async () => {
    await assertFails(
        kirimRegistrasi({
            uid: 'user-mapping-uid',
            uidMapping: 'user-lain',
        }),
    );
});

test('REG-RULE-10: profil dan mapping tidak boleh diubah', async () => {
    const uid = 'user-update';
    const kode = 'UPDATE01';

    await testEnv.withSecurityRulesDisabled(async (context) => {
        const db = context.firestore();

        await setDoc(doc(db, 'pengguna', uid), {
            nama: 'Aqilla Test',
            nim: '1234567890',
            email: `${uid}@example.com`,
            peran: 'PRAKTIKAN',
            kodePeserta: kode,
            dibuatPada: new Date(),
        });

        await setDoc(doc(db, 'kodePeserta', kode), {
            uid,
            nama: 'Aqilla Test',
            nim: '1234567890',
        });
    });

    const db = testEnv.authenticatedContext(uid, {
        email: `${uid}@example.com`,
    }).firestore();

    await assertFails(
        updateDoc(doc(db, 'pengguna', uid), {
            nama: 'Nama Diubah',
        }),
    );

    await assertFails(
        updateDoc(doc(db, 'kodePeserta', kode), {
            nama: 'Nama Diubah',
        }),
    );
});

const UID_ASISTEN_A = 'asisten-a';
const UID_ASISTEN_B = 'asisten-b';
const UID_PRAKTIKAN_A = 'praktikan-a';
const UID_PRAKTIKAN_B = 'praktikan-b';
const UID_PRAKTIKAN_BARU = 'praktikan-baru';
const KODE_QR = '0123456789abcdef0123456789abcdef';

function context(uid: string) {
    return testEnv.authenticatedContext(uid).firestore();
}

function dataKelas(asistenUid: string, diarsipkan = false) {
    return {
        namaPraktikum: 'Pemrograman',
        asistenUid,
        diarsipkan,
        dibuatPada: Timestamp.fromDate(new Date('2026-11-14T08:00:00.000Z')),
    };
}

function dataSesi(kelasId: string, opsi: { statusSesi?: string; diarsipkan?: boolean } = {}) {
    return {
        kelasId,
        judul: 'Pertemuan 1',
        lokasi: 'Lab A',
        waktuMulai: Timestamp.fromDate(new Date('2026-11-14T09:00:00.000Z')),
        waktuSelesai: null,
        statusSesi: opsi.statusSesi ?? 'DIBUKA',
        diarsipkan: opsi.diarsipkan ?? false,
    };
}

async function siapkanDataAkses() {
    await testEnv.withSecurityRulesDisabled(async (contextAdmin) => {
        const db = contextAdmin.firestore();
        const profil = async (uid: string, peran: string, nama: string) => setDoc(
            doc(db, 'pengguna', uid),
            {
                nama,
                nim: uid,
                email: `${uid}@example.com`,
                peran,
                kodePeserta: 'KODE1234',
                dibuatPada: new Date('2026-11-14T08:00:00.000Z'),
            },
        );

        await Promise.all([
            profil(UID_ASISTEN_A, 'ASISTEN', 'Asisten A'),
            profil(UID_ASISTEN_B, 'ASISTEN', 'Asisten B'),
            profil(UID_PRAKTIKAN_A, 'PRAKTIKAN', 'Praktikan A'),
            profil(UID_PRAKTIKAN_B, 'PRAKTIKAN', 'Praktikan B'),
            profil(UID_PRAKTIKAN_BARU, 'PRAKTIKAN', 'Praktikan Baru'),
        ]);

        await Promise.all([
            setDoc(doc(db, 'kelas', 'kelas-a'), dataKelas(UID_ASISTEN_A)),
            setDoc(doc(db, 'kelas', 'kelas-b'), dataKelas(UID_ASISTEN_B)),
            setDoc(doc(db, 'kelas', 'kelas-arsip'), dataKelas(UID_ASISTEN_A, true)),
            setDoc(doc(db, 'keanggotaan', `kelas-a_${UID_PRAKTIKAN_A}`), {
                kelasId: 'kelas-a', uid: UID_PRAKTIKAN_A,
                nama: 'Praktikan A', nim: UID_PRAKTIKAN_A, status: 'AKTIF',
            }),
            setDoc(doc(db, 'keanggotaan', `kelas-a_${UID_PRAKTIKAN_B}`), {
                kelasId: 'kelas-a', uid: UID_PRAKTIKAN_B,
                nama: 'Praktikan B', nim: UID_PRAKTIKAN_B, status: 'NONAKTIF',
            }),
            setDoc(doc(db, 'keanggotaan', `kelas-b_${UID_PRAKTIKAN_B}`), {
                kelasId: 'kelas-b', uid: UID_PRAKTIKAN_B,
                nama: 'Praktikan B', nim: UID_PRAKTIKAN_B, status: 'AKTIF',
            }),
            setDoc(doc(db, 'keanggotaan', `kelas-arsip_${UID_PRAKTIKAN_A}`), {
                kelasId: 'kelas-arsip', uid: UID_PRAKTIKAN_A,
                nama: 'Praktikan A', nim: UID_PRAKTIKAN_A, status: 'NONAKTIF',
            }),
        ]);

        await Promise.all([
            setDoc(doc(db, 'sesi', 'sesi-a'), dataSesi('kelas-a')),
            setDoc(doc(db, 'sesi', 'sesi-b'), dataSesi('kelas-b')),
            setDoc(doc(db, 'sesi', 'sesi-lama'), dataSesi('kelas-a', {
                statusSesi: 'DITUTUP', diarsipkan: true,
            })),
            setDoc(doc(db, 'sesi', 'sesi-izin'), dataSesi('kelas-a')),
            setDoc(doc(db, 'sesi', 'sesi-a', 'rahasia', 'qr'), { kodeQr: KODE_QR }),
            setDoc(doc(db, 'sesi', 'sesi-b', 'rahasia', 'qr'), { kodeQr: KODE_QR }),
            setDoc(doc(db, 'sesi', 'sesi-izin', 'rahasia', 'qr'), { kodeQr: KODE_QR }),
            setDoc(doc(db, 'presensi', `sesi-lama_${UID_PRAKTIKAN_A}`), {
                sesiId: 'sesi-lama', kelasId: 'kelas-a', uid: UID_PRAKTIKAN_A,
                waktuHadir: new Date('2026-11-14T10:00:00.000Z'),
            }),
            setDoc(doc(db, 'presensi', `sesi-b_${UID_PRAKTIKAN_B}`), {
                sesiId: 'sesi-b', kelasId: 'kelas-b', uid: UID_PRAKTIKAN_B,
                waktuHadir: new Date('2026-11-14T10:30:00.000Z'),
            }),
            setDoc(doc(db, 'izin', `sesi-izin_${UID_PRAKTIKAN_A}`), {
                sesiId: 'sesi-izin', kelasId: 'kelas-a', uid: UID_PRAKTIKAN_A,
                statusIzin: 'MENUNGGU',
            }),
        ]);
    });
}

test('ACC-RULE-01: asisten membaca kelas sendiri dan tidak membaca kelas asisten lain', async () => {
    await siapkanDataAkses();
    const db = context(UID_ASISTEN_A);

    await assertSucceeds(getDoc(doc(db, 'kelas', 'kelas-a')));
    await assertFails(getDoc(doc(db, 'kelas', 'kelas-b')));
    await assertSucceeds(getDocs(query(
        collection(db, 'kelas'),
        where('asistenUid', '==', UID_ASISTEN_A),
        where('diarsipkan', '==', false),
    )));
});

test('ACC-RULE-02: kelas hanya dapat dibuat asisten dengan field dan pemilik yang sah', async () => {
    await siapkanDataAkses();
    const dbAsisten = context(UID_ASISTEN_A);
    const dbPraktikan = context(UID_PRAKTIKAN_A);

    await assertSucceeds(setDoc(doc(dbAsisten, 'kelas', 'kelas-baru'), {
        ...dataKelas(UID_ASISTEN_A),
        dibuatPada: serverTimestamp(),
    }));
    await assertFails(setDoc(doc(dbAsisten, 'kelas', 'kelas-palsu'), {
        ...dataKelas(UID_ASISTEN_B),
        dibuatPada: serverTimestamp(),
    }));
    await assertFails(setDoc(doc(dbPraktikan, 'kelas', 'kelas-praktikan'), {
        ...dataKelas(UID_PRAKTIKAN_A),
        dibuatPada: serverTimestamp(),
    }));
});

test('ACC-RULE-03: kelas hanya dapat diarsipkan satu arah oleh pemilik', async () => {
    await siapkanDataAkses();
    const dbAsisten = context(UID_ASISTEN_A);

    await assertSucceeds(updateDoc(doc(dbAsisten, 'kelas', 'kelas-a'), { diarsipkan: true }));
    await assertFails(updateDoc(doc(dbAsisten, 'kelas', 'kelas-a'), { diarsipkan: false }));
    await assertFails(updateDoc(doc(context(UID_ASISTEN_A), 'kelas', 'kelas-b'), {
        namaPraktikum: 'Diubah pihak lain',
    }));
});

test('ACC-RULE-04: praktikan membaca kelasnya melalui keanggotaan, bukan kelas lain', async () => {
    await siapkanDataAkses();
    const db = context(UID_PRAKTIKAN_A);

    await assertSucceeds(getDoc(doc(db, 'kelas', 'kelas-a')));
    await assertFails(getDoc(doc(db, 'kelas', 'kelas-b')));
});

test('ACC-RULE-05: roster kelas dibatasi pada pemilik dan praktikan hanya membaca keanggotaan aktifnya', async () => {
    await siapkanDataAkses();
    const dbAsisten = context(UID_ASISTEN_A);
    const dbPraktikan = context(UID_PRAKTIKAN_A);

    const roster = await getDocs(query(
        collection(dbAsisten, 'keanggotaan'),
        where('kelasId', '==', 'kelas-a'),
    ));
    assert.equal(roster.size, 2);
    await assertFails(getDocs(query(
        collection(context(UID_ASISTEN_B), 'keanggotaan'),
        where('kelasId', '==', 'kelas-a'),
    )));
    const anggotaAktif = await getDocs(query(
        collection(dbPraktikan, 'keanggotaan'),
        where('uid', '==', UID_PRAKTIKAN_A),
        where('status', '==', 'AKTIF'),
    ));
    assert.equal(anggotaAktif.size, 1);
    await assertFails(getDocs(query(
        collection(dbPraktikan, 'keanggotaan'),
        where('uid', '==', UID_PRAKTIKAN_A),
    )));
});

test('ACC-RULE-06: keanggotaan hanya dibuat asisten pemilik dari profil praktikan dan snapshot yang cocok', async () => {
    await siapkanDataAkses();
    const db = context(UID_ASISTEN_A);

    await assertSucceeds(setDoc(doc(db, 'keanggotaan', `kelas-a_${UID_PRAKTIKAN_BARU}`), {
        kelasId: 'kelas-a', uid: UID_PRAKTIKAN_BARU,
        nama: 'Praktikan Baru', nim: UID_PRAKTIKAN_BARU, status: 'AKTIF',
    }));
    await assertFails(setDoc(doc(db, 'keanggotaan', `kelas-b_${UID_PRAKTIKAN_BARU}`), {
        kelasId: 'kelas-b', uid: UID_PRAKTIKAN_BARU,
        nama: 'Praktikan Baru', nim: UID_PRAKTIKAN_BARU, status: 'AKTIF',
    }));
    await assertFails(setDoc(doc(db, 'keanggotaan', `kelas-a_${UID_PRAKTIKAN_BARU}`), {
        kelasId: 'kelas-a', uid: UID_PRAKTIKAN_BARU,
        nama: 'Nama Palsu', nim: UID_PRAKTIKAN_BARU, status: 'AKTIF',
    }));
});

test('ACC-RULE-07: status peserta dapat diaktifkan/nonaktifkan tanpa mengubah snapshot', async () => {
    await siapkanDataAkses();
    const db = context(UID_ASISTEN_A);

    await assertSucceeds(updateDoc(doc(db, 'keanggotaan', `kelas-a_${UID_PRAKTIKAN_B}`), {
        status: 'AKTIF',
    }));
    await assertFails(updateDoc(doc(db, 'keanggotaan', `kelas-a_${UID_PRAKTIKAN_B}`), {
        status: 'AKTIF', nama: 'Nama diubah',
    }));
    await assertFails(updateDoc(doc(context(UID_ASISTEN_B), 'keanggotaan', `kelas-a_${UID_PRAKTIKAN_B}`), {
        status: 'NONAKTIF',
    }));
});

test('ACC-RULE-08: jadwal hanya menampilkan sesi kelas milik asisten atau kelas aktif praktikan', async () => {
    await siapkanDataAkses();
    const dbAsisten = context(UID_ASISTEN_A);
    const dbPraktikan = context(UID_PRAKTIKAN_A);

    const sesiAsisten = await getDocs(query(
        collection(dbAsisten, 'sesi'),
        where('kelasId', '==', 'kelas-a'),
        where('diarsipkan', '==', false),
        orderBy('waktuMulai', 'asc'),
    ));
    assert.ok(sesiAsisten.size >= 1);
    const sesiPraktikan = await getDocs(query(
        collection(dbPraktikan, 'sesi'),
        where('kelasId', '==', 'kelas-a'),
        where('diarsipkan', '==', false),
        orderBy('waktuMulai', 'asc'),
    ));
    assert.ok(sesiPraktikan.size >= 1);
    await assertFails(getDocs(query(
        collection(dbPraktikan, 'sesi'),
        where('kelasId', '==', 'kelas-b'),
        where('diarsipkan', '==', false),
    )));
});

test('ACC-RULE-09: sesi dibuat bersama QR oleh pemilik, lalu status hanya bergerak maju', async () => {
    await siapkanDataAkses();
    const db = context(UID_ASISTEN_A);
    const batch = writeBatch(db);
    batch.set(doc(db, 'sesi', 'sesi-baru'), dataSesi('kelas-a', {
        statusSesi: 'BELUM_DIBUKA',
    }));
    batch.set(doc(db, 'sesi', 'sesi-baru', 'rahasia', 'qr'), { kodeQr: KODE_QR });
    await assertSucceeds(batch.commit());

    await assertSucceeds(updateDoc(doc(db, 'sesi', 'sesi-baru'), {
        statusSesi: 'DIBUKA',
    }));
    await assertSucceeds(updateDoc(doc(db, 'sesi', 'sesi-baru'), {
        statusSesi: 'DITUTUP',
    }));
    await assertFails(updateDoc(doc(db, 'sesi', 'sesi-baru'), {
        statusSesi: 'DIBUKA',
    }));
});

test('ACC-RULE-10: praktikan tidak dapat membaca QR rahasia sesi', async () => {
    await siapkanDataAkses();

    await assertSucceeds(getDoc(doc(context(UID_ASISTEN_A), 'sesi', 'sesi-a', 'rahasia', 'qr')));
    await assertFails(getDoc(doc(context(UID_PRAKTIKAN_A), 'sesi', 'sesi-a', 'rahasia', 'qr')));
});

test('ACC-RULE-11: riwayat presensi hanya dapat dibaca pemilik atau asisten kelas asal', async () => {
    await siapkanDataAkses();
    const dbPraktikan = context(UID_PRAKTIKAN_A);
    const dbAsisten = context(UID_ASISTEN_A);

    const riwayat = await getDocs(query(
        collection(dbPraktikan, 'presensi'),
        where('uid', '==', UID_PRAKTIKAN_A),
    ));
    assert.equal(riwayat.size, 1);
    await assertFails(getDocs(query(
        collection(dbPraktikan, 'presensi'),
        where('uid', '==', UID_PRAKTIKAN_B),
    )));
    await assertSucceeds(getDoc(doc(dbAsisten, 'presensi', `sesi-lama_${UID_PRAKTIKAN_A}`)));
    await assertSucceeds(getDocs(query(
        collection(dbAsisten, 'presensi'),
        where('sesiId', '==', 'sesi-lama'),
    )));
    await assertFails(getDocs(query(
        collection(context(UID_ASISTEN_A), 'presensi'),
        where('sesiId', '==', 'sesi-b'),
    )));
    await assertSucceeds(getDoc(doc(dbPraktikan, 'sesi', 'sesi-lama')));
});

test('ACC-RULE-12: presensi harus memakai QR yang valid dan tidak bisa diubah atau dihapus', async () => {
    await siapkanDataAkses();
    const db = context(UID_PRAKTIKAN_A);
    const presensiRef = doc(db, 'presensi', `sesi-a_${UID_PRAKTIKAN_A}`);

    await assertFails(setDoc(presensiRef, {
        sesiId: 'sesi-a', kelasId: 'kelas-a', uid: UID_PRAKTIKAN_A,
        waktuHadir: serverTimestamp(), kodeQr: 'kode-salah',
    }));
    await assertSucceeds(setDoc(presensiRef, {
        sesiId: 'sesi-a', kelasId: 'kelas-a', uid: UID_PRAKTIKAN_A,
        waktuHadir: serverTimestamp(), kodeQr: KODE_QR,
    }));
    await assertFails(updateDoc(presensiRef, { uid: UID_PRAKTIKAN_B }));
});

test('ACC-RULE-13: sesi lama dapat dibaca dari riwayat walau arsip atau keanggotaan nonaktif', async () => {
    await siapkanDataAkses();
    const db = context(UID_PRAKTIKAN_A);

    await assertSucceeds(getDoc(doc(db, 'sesi', 'sesi-lama')));
    await assertFails(getDoc(doc(db, 'sesi', 'sesi-b')));
    await assertFails(getDocs(query(
        collection(db, 'sesi'),
        where('kelasId', '==', 'kelas-arsip'),
        where('diarsipkan', '==', false),
    )));
});
