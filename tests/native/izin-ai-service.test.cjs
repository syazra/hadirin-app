const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');
const ts = require('typescript');

function transpile(relativePath) {
  const source = fs.readFileSync(path.join(__dirname, '../../src', relativePath), 'utf8');
  return ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;
}

const kategori = {};
vm.runInNewContext(transpile('utils/kategori-izin.ts'), { exports: kategori });
const { VERSI_KATEGORI_AI } = kategori;
const serviceSource = transpile('services/izin-ai-service.ts');

function siapkanLayanan(respond) {
  const exports = {};
  const imports = {
    '@react-native-firebase/auth': { getIdToken: async () => 'token-uji' },
    '@/lib/firebase': { getFirebaseServices: () => ({ auth: { currentUser: { uid: 'asisten-1' } } }) },
    '@/utils/kategori-izin': kategori,
    '@/utils/error-firebase': { hasilErrorFirebase: error => { throw error; } },
  };
  vm.runInNewContext(serviceSource, {
    exports,
    process: { env: { EXPO_PUBLIC_GEMINI_PROXY_URL: 'https://proxy.example/' } },
    fetch: respond,
    require: name => imports[name],
  });
  return exports.klasifikasikanIzin;
}

test('klasifikasi mengirim versi kebijakan dan menerima ALPHA dari proxy terkini', async () => {
  const klasifikasikanIzin = siapkanLayanan(async (url, options) => {
    assert.equal(url, 'https://proxy.example/api/klasifikasi-izin');
    assert.equal(options.method, 'POST');
    assert.equal(options.headers.Authorization, 'Bearer token-uji');
    assert.deepEqual(JSON.parse(options.body), { idIzin: 'izin-1', versiKategoriAi: VERSI_KATEGORI_AI });
    return Response.json({ ok: true, data: { kategori: 'ALPHA' }, versiKategoriAi: VERSI_KATEGORI_AI });
  });
  const hasil = await klasifikasikanIzin('izin-1');
  assert.equal(hasil.ok, true);
  assert.equal(hasil.data.kategori, 'ALPHA');
});

test('HTTP 400 dari proxy tanpa penanda versi memberi pesan pembaruan proxy', async () => {
  const klasifikasikanIzin = siapkanLayanan(async () => Response.json({
    ok: false, alasan: 'INPUT_TIDAK_VALID', pesan: 'idIzin wajib diisi dan harus valid.',
  }, { status: 400 }));
  const hasil = await klasifikasikanIzin('izin-1');
  assert.equal(hasil.ok, false);
  assert.equal(hasil.alasan, 'RESPONS_TIDAK_VALID');
  assert.match(hasil.pesan, /memperbarui proxy AI/);
});

for (const kategoriLama of ['KELUARGA', 'IZIN']) {
  test(`hasil lama ${kategoriLama} tanpa versi kebijakan ditolak`, async () => {
    const klasifikasikanIzin = siapkanLayanan(async () => Response.json({ ok: true, data: { kategori: kategoriLama } }));
    const hasil = await klasifikasikanIzin('izin-1');
    assert.equal(hasil.ok, false);
    assert.equal(hasil.alasan, 'RESPONS_TIDAK_VALID');
    assert.match(hasil.pesan, /memperbarui proxy AI/);
  });
}

test('validasi idIzin dari proxy terkini diteruskan ke aplikasi', async () => {
  const klasifikasikanIzin = siapkanLayanan(async () => Response.json({
    ok: false,
    alasan: 'INPUT_TIDAK_VALID',
    pesan: 'idIzin wajib diisi dan harus valid.',
    versiKategoriAi: VERSI_KATEGORI_AI,
  }, { status: 400 }));
  const hasil = await klasifikasikanIzin('');
  assert.equal(hasil.ok, false);
  assert.equal(hasil.alasan, 'INPUT_TIDAK_VALID');
  assert.equal(hasil.pesan, 'idIzin wajib diisi dan harus valid.');
});
