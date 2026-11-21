import assert from 'node:assert/strict';
import test from 'node:test';

import {
    buatHandlerKlasifikasiIzin,
    KegagalanKlasifikasi,
    type DependensiKlasifikasiIzin,
    type FieldAiTersimpan,
} from '../api/klasifikasi-izin.js';

const IZIN = {
    sesiId: 'sesi-1',
    kelasId: 'kelas-1',
    alasan: 'Saya demam dan perlu istirahat.',
    statusAi: 'BELUM',
    kategoriAi: null,
};

function siapkan(overrides: Partial<DependensiKlasifikasiIzin> = {}) {
    const tersimpan: Array<{ idIzin: string; fields: FieldAiTersimpan }> = [];
    const alasanDikirimKeModel: string[] = [];
    let jumlahPanggilanModel = 0;

    const dependensi: DependensiKlasifikasiIzin = {
        model: 'gemini-model-uji',
        verifikasiToken: async () => ({ uid: 'asisten-1' }),
        ambilPeran: async () => 'ASISTEN',
        ambilIzin: async () => IZIN,
        ambilKelasIdSesi: async () => 'kelas-1',
        ambilPemilikKelas: async () => 'asisten-1',
        klasifikasikan: async (alasan) => {
            jumlahPanggilanModel += 1;
            alasanDikirimKeModel.push(alasan);
            return { teks: '{"kategori":"SAKIT"}', model: 'gemini-model-uji' };
        },
        simpanFieldAi: async (idIzin, fields) => {
            tersimpan.push({ idIzin, fields });
        },
        ...overrides,
    };

    return {
        handler: buatHandlerKlasifikasiIzin(dependensi),
        tersimpan,
        alasanDikirimKeModel,
        get jumlahPanggilanModel() { return jumlahPanggilanModel; },
    };
}

function request(body: unknown = { idIzin: 'izin-1' }, token = 'token-valid') {
    return new Request('https://proxy.example/api/klasifikasi-izin', {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } : {},
        body: JSON.stringify(body),
    });
}

async function json(response: Response): Promise<Record<string, unknown>> {
    return await response.json() as Record<string, unknown>;
}

test('mengklasifikasikan alasan, menyimpan hanya field AI, dan mengembalikan kategori', async () => {
    const fixture = siapkan();
    const response = await fixture.handler(request());

    assert.equal(response.status, 200);
    assert.deepEqual(await json(response), { ok: true, data: { kategori: 'SAKIT' } });
    assert.deepEqual(fixture.alasanDikirimKeModel, [IZIN.alasan]);
    assert.deepEqual(fixture.tersimpan, [{
        idIzin: 'izin-1',
        fields: { kategoriAi: 'SAKIT', statusAi: 'SUKSES', modelAi: 'gemini-model-uji' },
    }]);
    assert.equal('statusIzin' in fixture.tersimpan[0].fields, false);
});

test('menggunakan hasil sukses yang tersimpan tanpa memanggil model lagi', async () => {
    const fixture = siapkan({
        ambilIzin: async () => ({ ...IZIN, statusAi: 'SUKSES', kategoriAi: 'IZIN' }),
    });

    const response = await fixture.handler(request());

    assert.equal(response.status, 200);
    assert.deepEqual(await json(response), { ok: true, data: { kategori: 'IZIN' } });
    assert.equal(fixture.jumlahPanggilanModel, 0);
    assert.equal(fixture.tersimpan.length, 0);
});

test('menolak token yang tidak valid', async () => {
    const fixture = siapkan({
        verifikasiToken: async () => { throw new Error('invalid token'); },
    });

    const response = await fixture.handler(request());

    assert.equal(response.status, 401);
    assert.equal((await json(response)).alasan, 'AUTENTIKASI_GAGAL');
    assert.equal(fixture.jumlahPanggilanModel, 0);
});

test('menolak akun yang bukan asisten', async () => {
    const fixture = siapkan({ ambilPeran: async () => 'PRAKTIKAN' });

    const response = await fixture.handler(request());

    assert.equal(response.status, 403);
    assert.equal((await json(response)).alasan, 'TIDAK_BERWENANG');
    assert.equal(fixture.jumlahPanggilanModel, 0);
});

test('menolak asisten yang bukan pemilik kelas izin', async () => {
    const fixture = siapkan({ ambilPemilikKelas: async () => 'asisten-lain' });

    const response = await fixture.handler(request());

    assert.equal(response.status, 403);
    assert.equal((await json(response)).alasan, 'TIDAK_BERWENANG');
    assert.equal(fixture.jumlahPanggilanModel, 0);
});

test('menolak izin jika kelasnya tidak cocok dengan kelas sesi asal', async () => {
    const fixture = siapkan({ ambilKelasIdSesi: async () => 'kelas-lain' });

    const response = await fixture.handler(request());

    assert.equal(response.status, 403);
    assert.equal((await json(response)).alasan, 'TIDAK_BERWENANG');
    assert.equal(fixture.jumlahPanggilanModel, 0);
    assert.equal(fixture.tersimpan.length, 0);
});

test('menandai gagal jika respons model berisi kategori di luar kontrak', async () => {
    const fixture = siapkan({
        klasifikasikan: async () => ({ teks: '{"kategori":"DISETUJUI"}', model: 'gemini-model-uji' }),
    });

    const response = await fixture.handler(request());

    assert.equal(response.status, 502);
    assert.equal((await json(response)).alasan, 'RESPONS_TIDAK_VALID');
    assert.deepEqual(fixture.tersimpan, [{
        idIzin: 'izin-1',
        fields: { kategoriAi: null, statusAi: 'GAGAL', modelAi: 'gemini-model-uji' },
    }]);
    assert.equal('statusIzin' in fixture.tersimpan[0].fields, false);
});

test('memetakan timeout Gemini dan menyimpan status gagal', async () => {
    const fixture = siapkan({
        klasifikasikan: async () => { throw new KegagalanKlasifikasi('TIMEOUT', 'timeout'); },
    });

    const response = await fixture.handler(request());

    assert.equal(response.status, 504);
    assert.equal((await json(response)).alasan, 'TIMEOUT');
    assert.deepEqual(fixture.tersimpan[0].fields, {
        kategoriAi: null,
        statusAi: 'GAGAL',
        modelAi: 'gemini-model-uji',
    });
});

test('memetakan kuota Gemini yang habis', async () => {
    const fixture = siapkan({
        klasifikasikan: async () => { throw new KegagalanKlasifikasi('KUOTA_HABIS', 'quota'); },
    });

    const response = await fixture.handler(request());

    assert.equal(response.status, 429);
    assert.equal((await json(response)).alasan, 'KUOTA_HABIS');
    assert.equal(fixture.tersimpan[0].fields.statusAi, 'GAGAL');
});

test('menolak method dan payload yang tidak sesuai', async () => {
    const fixture = siapkan();
    const getResponse = await fixture.handler(new Request('https://proxy.example/api/klasifikasi-izin'));
    const badPayload = await fixture.handler(request({ idIzin: 'izin-1', alasan: 'jangan kirim alasan dari klien' }));

    assert.equal(getResponse.status, 405);
    assert.equal(badPayload.status, 400);
    assert.equal(fixture.jumlahPanggilanModel, 0);
});

for (const [alasan, kategori] of [
    ['Saya sakit demam.', 'SAKIT'],
    ['Menghadiri acara keluarga.', 'IZIN'],
    ['Mengikuti kegiatan akademik.', 'IZIN'],
] as const) {
    test(`menerima kategori ${kategori} untuk fixture alasan: ${alasan}`, async () => {
        const fixture = siapkan({
            ambilIzin: async () => ({ ...IZIN, alasan }),
            klasifikasikan: async (teks) => {
                assert.equal(teks, alasan);
                return { teks: JSON.stringify({ kategori }), model: 'model-uji' };
            },
        });
        assert.equal((await fixture.handler(request())).status, 200);
        assert.equal(fixture.tersimpan[0].fields.kategoriAi, kategori);
        assert.equal('statusIzin' in fixture.tersimpan[0].fields, false);
    });
}

for (const kategori of ['KESEHATAN', 'KELUARGA', 'AKADEMIK', 'LAINNYA', 'TIDAK_JELAS', 'ALPHA', 'sakit', null]) {
    test(`menolak output model lama/tidak valid: ${kategori}`, async () => {
        const fixture = siapkan({
            klasifikasikan: async () => ({ teks: JSON.stringify({ kategori }), model: 'model-uji' }),
        });
        const response = await fixture.handler(request());
        assert.equal(response.status, 502);
        assert.equal((await json(response)).alasan, 'RESPONS_TIDAK_VALID');
        assert.equal(fixture.tersimpan[0].fields.kategoriAi, null);
        assert.equal(fixture.tersimpan[0].fields.statusAi, 'GAGAL');
    });
}

for (const kategoriAi of ['KESEHATAN', 'KELUARGA', 'AKADEMIK', 'LAINNYA', 'TIDAK_JELAS', 'ALPHA']) {
    test(`cache kategori lama ${kategoriAi} diklasifikasikan ulang`, async () => {
        const fixture = siapkan({
            ambilIzin: async () => ({ ...IZIN, statusAi: 'SUKSES', kategoriAi }),
        });
        const response = await fixture.handler(request());
        assert.equal(response.status, 200);
        assert.equal(fixture.jumlahPanggilanModel, 1);
        assert.equal(fixture.tersimpan[0].fields.kategoriAi, 'SAKIT');
    });
}

test('network failure tidak mengubah keputusan manual', async () => {
    const fixture = siapkan({
        klasifikasikan: async () => { throw new KegagalanKlasifikasi('JARINGAN', 'offline'); },
    });
    const response = await fixture.handler(request());
    assert.equal(response.status, 502);
    assert.equal((await json(response)).alasan, 'JARINGAN');
    assert.equal(fixture.tersimpan[0].fields.statusAi, 'GAGAL');
    assert.equal('statusIzin' in fixture.tersimpan[0].fields, false);
});
