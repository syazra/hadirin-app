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
    doc,
    serverTimestamp,
    setDoc,
    updateDoc,
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
