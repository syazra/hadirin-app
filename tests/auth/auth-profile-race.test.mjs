import assert from 'node:assert/strict';
import { test } from 'node:test';

import { AuthSessionController } from '../../src/context/auth-session-controller.ts';
import { tentukanTujuanNavigasiAuth } from '../../src/utils/tujuan-navigasi-auth.ts';

test('Auth event before profile save recovers practitioner session and routes to schedule', async (t) => {
    let kirimEventAuth;
    let uidAktif = null;
    let profilTersimpan = null;
    let pembacaanProfil = 0;
    let tandaiPembacaanAwal;
    const pembacaanAwalDimulai = new Promise((resolve) => {
        tandaiPembacaanAwal = resolve;
    });

    const profilPraktikan = {
        uid: 'uid-shafa-test',
        nama: 'Shafa Test',
        nim: '1234567890',
        email: 'shafa@example.com',
        peran: 'PRAKTIKAN',
        kodePeserta: 'SHAFA123',
        dibuatPada: null,
    };

    const authSession = new AuthSessionController({
        tersedia: true,
        berlanggananAuth: (listener) => {
            kirimEventAuth = listener;
            return () => undefined;
        },
        ambilUidAktif: () => uidAktif,
        ambilProfil: async (uid) => {
            assert.equal(uid, profilPraktikan.uid);
            pembacaanProfil += 1;

            if (pembacaanProfil === 1) {
                tandaiPembacaanAwal();
            }

            if (!profilTersimpan) {
                return {
                    ok: false,
                    alasan: 'PROFIL_BELUM_LENGKAP',
                    pesan: 'Profil belum terlihat setelah event Auth.',
                };
            }

            return { ok: true, data: profilTersimpan };
        },
    });

    const stop = authSession.start();
    t.after(stop);

    // Firebase Auth memancarkan event tepat setelah akun dibuat,
    // sebelum batch profil dan kode peserta tersimpan.
    uidAktif = profilPraktikan.uid;
    kirimEventAuth({ uid: uidAktif });
    await pembacaanAwalDimulai;
    await new Promise((resolve) => setImmediate(resolve));

    assert.equal(authSession.getSnapshot().pengguna, null);
    assert.equal(authSession.getSnapshot().profilBelumLengkap, true);

    // Simulasikan selesainya penyimpanan Firestore dan refresh yang dipanggil
    // alur registrasi setelah batch commit selesai.
    profilTersimpan = profilPraktikan;
    await authSession.muatUlangProfil();

    const stateAkhir = authSession.getSnapshot();
    assert.deepEqual(stateAkhir.pengguna, profilPraktikan);
    assert.equal(stateAkhir.profilBelumLengkap, false);
    assert.equal(stateAkhir.loading, false);
    assert.equal(
        tentukanTujuanNavigasiAuth(stateAkhir),
        '/(praktikan)/jadwal-praktikan',
    );
});
