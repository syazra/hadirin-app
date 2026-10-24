const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const ts = require('typescript');

// Run with: node --test scripts/check-app-context.cjs
const root = path.resolve(__dirname, '..');
const modules = new Map();

function loadTypeScript(file) {
  if (modules.has(file)) return modules.get(file);
  const code = ts.transpileModule(fs.readFileSync(file, 'utf8'), {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      jsx: ts.JsxEmit.ReactJSX,
      target: ts.ScriptTarget.ES2022,
    },
  }).outputText;
  const module = { exports: {} };
  const localRequire = (id) => {
    if (!id.startsWith('@/')) return require(id);
    const base = path.join(root, 'src', id.slice(2));
    const target = [base + '.ts', base + '.tsx', path.join(base, 'index.ts')].find(fs.existsSync);
    if (!target) throw new Error(`Module not found: ${id}`);
    return loadTypeScript(target);
  };
  new Function('require', 'module', 'exports', code)(localRequire, module, module.exports);
  modules.set(file, module.exports);
  return module.exports;
}

const { appReducer, createInitialState } = loadTypeScript(path.join(root, 'src/context/app-context.tsx'));
const { bacaPayloadQr, buatPayloadQr } = loadTypeScript(path.join(root, 'src/utils/qr-payload.ts'));
const pilih = (state, idPengguna) => appReducer(state, { type: 'PILIH_IDENTITAS', idPengguna });
const buka = (state, idSesi) => appReducer(state, { type: 'BUKA_SESI', idSesi });
const tutup = (state, idSesi) => appReducer(state, { type: 'TUTUP_SESI', idSesi });
const catat = (state, idSesi, idPengguna, waktuHadir = '2026-10-24T12:00:00.000Z') => appReducer(state, {
  type: 'CATAT_PRESENSI',
  presensi: { idPresensi: `presensi:${idSesi}:${idPengguna}`, idSesi, idPengguna, waktuHadir },
});

function freeze(value) {
  for (const item of Object.values(value)) {
    if (item && typeof item === 'object') freeze(item);
  }
  return Object.freeze(value);
}

test('initial state is isolated and reload clears attendance', () => {
  const first = createInitialState();
  const second = createInitialState();
  assert.deepEqual(first, second);
  first.sesi[0].statusSesi = 'DITUTUP';
  first.pengguna[0].nama = 'Changed';
  assert.equal(second.sesi[0].statusSesi, 'BELUM_DIBUKA');
  assert.equal(second.pengguna[0].nama, 'Asisten Farhan');
  assert.equal(second.penggunaAktif, null);
  assert.deepEqual(second.presensi, []);
});

test('assistant opens only the requested session without mutating input', () => {
  const initial = freeze(pilih(createInitialState(), 'A001'));
  const opened = buka(initial, 'S001');
  assert.equal(opened.sesi[0].statusSesi, 'DIBUKA');
  assert.equal(initial.sesi[0].statusSesi, 'BELUM_DIBUKA');
  assert.equal(opened.sesi[0].kodeQr, initial.sesi[0].kodeQr);
  assert.equal(opened.sesi[1], initial.sesi[1]);
  assert.equal(opened.sesi[2], initial.sesi[2]);
  assert.equal(opened.presensi, initial.presensi);
  assert.deepEqual(buka(initial, 'S001'), opened);
});

test('session lifecycle allows unopened -> opened -> closed, with no reopening', () => {
  const initial = pilih(createInitialState(), 'A001');
  assert.equal(tutup(initial, 'S001'), initial);
  assert.equal(buka(initial, 'S002'), initial);
  assert.equal(buka(initial, 'S003'), initial);
  assert.equal(buka(initial, 'missing'), initial);
  assert.equal(tutup(initial, 'missing'), initial);
  const opened = buka(initial, 'S001');
  assert.equal(buka(opened, 'S001'), opened);
  const closed = tutup(opened, 'S001');
  assert.equal(closed.sesi[0].statusSesi, 'DITUTUP');
  assert.equal(buka(closed, 'S001'), closed);
  assert.equal(tutup(closed, 'S001'), closed);
});

test('missing identity and practitioners cannot open or close sessions', () => {
  for (const state of [createInitialState(), pilih(createInitialState(), 'P001')]) {
    assert.equal(buka(state, 'S001'), state);
    assert.equal(tutup(state, 'S002'), state);
  }
});

test('attendance records the provided timestamp and reducer stays deterministic', () => {
  const initial = freeze(pilih(createInitialState(), 'P001'));
  const recorded = catat(initial, 'S002', 'P001');
  assert.equal(recorded.presensi.length, 1);
  assert.deepEqual(recorded.presensi[0], {
    idPresensi: 'presensi:S002:P001',
    idSesi: 'S002',
    idPengguna: 'P001',
    waktuHadir: '2026-10-24T12:00:00.000Z',
  });
  assert.deepEqual(catat(initial, 'S002', 'P001'), recorded);
  assert.deepEqual(initial.presensi, []);
  assert.equal(recorded.sesi, initial.sesi);
});

test('duplicate attendance never overwrites the original timestamp', () => {
  const recorded = catat(pilih(createInitialState(), 'P001'), 'S002', 'P001');
  assert.equal(catat(recorded, 'S002', 'P001', '2026-10-24T13:00:00.000Z'), recorded);
  assert.equal(recorded.presensi.length, 1);
  assert.equal(recorded.presensi[0].waktuHadir, '2026-10-24T12:00:00.000Z');
});

test('different practitioners and sessions can each receive attendance', () => {
  let state = buka(pilih(createInitialState(), 'A001'), 'S001');
  state = catat(pilih(state, 'P001'), 'S001', 'P001');
  state = catat(state, 'S002', 'P001');
  state = catat(pilih(state, 'P002'), 'S002', 'P002');
  assert.equal(state.presensi.length, 3);
  assert.equal(new Set(state.presensi.map(item => item.idPresensi)).size, 3);
});

test('invalid user, spoofed identity, unknown session, and unavailable sessions are rejected', () => {
  const practitioner = pilih(createInitialState(), 'P001');
  for (const [idSesi, idPengguna] of [
    ['S001', 'P001'], ['S003', 'P001'], ['missing', 'P001'],
    ['S002', 'missing'], ['S002', 'A001'], ['S002', 'P002'],
  ]) {
    assert.equal(catat(practitioner, idSesi, idPengguna), practitioner);
  }
  for (const state of [createInitialState(), pilih(createInitialState(), 'A001')]) {
    assert.equal(catat(state, 'S002', 'P001'), state);
  }
});

test('switching identity and closing sessions preserve attendance', () => {
  const recorded = catat(pilih(createInitialState(), 'P001'), 'S002', 'P001');
  const loggedOut = appReducer(recorded, { type: 'GANTI_PERAN' });
  assert.equal(loggedOut.penggunaAktif, null);
  assert.equal(loggedOut.sesi, recorded.sesi);
  assert.equal(loggedOut.presensi, recorded.presensi);
  const closed = tutup(pilih(loggedOut, 'A002'), 'S002');
  assert.equal(closed.sesi[1].statusSesi, 'DITUTUP');
  assert.equal(closed.presensi, recorded.presensi);
  const practitioner = pilih(closed, 'P002');
  assert.equal(catat(practitioner, 'S002', 'P002'), practitioner);
  assert.deepEqual(createInitialState().presensi, []);
});

test('QR payload round-trips every dummy session', () => {
  for (const sesi of createInitialState().sesi) {
    assert.deepEqual(bacaPayloadQr(buatPayloadQr(sesi)), { idSesi: sesi.idSesi, kodeQr: sesi.kodeQr });
  }
});

test('QR parser rejects malformed, empty, foreign and whitespace-padded payloads', () => {
  for (const payload of [
    null, undefined, 42, {}, '', 'https://example.com', '{"idSesi":"S002"}',
    'HADIRIN:S002:code', 'other:S002:code', 'hadirin:S002', 'hadirin::code',
    'hadirin:S002:', 'hadirin:S002:code:extra', ' hadirin:S002:code',
    'hadirin:S002:code ', 'hadirin:S002:code\n', 'hadirin:S 002:code',
  ]) {
    assert.equal(bacaPayloadQr(payload), null);
  }
});
