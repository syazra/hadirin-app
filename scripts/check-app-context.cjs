const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const ts = require('typescript');
const React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');

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

const { AppContext, AppProvider, appReducer, createInitialState } = loadTypeScript(path.join(root, 'src/context/app-context.tsx'));
const { bacaPayloadQr, buatPayloadQr } = loadTypeScript(path.join(root, 'src/utils/qr-payload.ts'));
const { formatWaktu } = loadTypeScript(path.join(root, 'src/utils/format-waktu.ts'));
const { dummyPresensi } = loadTypeScript(path.join(root, 'src/data/dummy-presensi.ts'));
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

test('demo identities and sessions have consistent seed attendance', () => {
  const state = createInitialState();
  assert.deepEqual(state.pengguna, [
    { idPengguna: 'A001', nama: 'Bima', peran: 'ASISTEN' },
    { idPengguna: 'A002', nama: 'Laras', peran: 'ASISTEN' },
    { idPengguna: 'P001', nama: 'Dewi', peran: 'PRAKTIKAN' },
    { idPengguna: 'P002', nama: 'Raka', peran: 'PRAKTIKAN' },
    { idPengguna: 'P003', nama: 'Salsa', peran: 'PRAKTIKAN' },
  ]);
  assert.equal(new Set(state.pengguna.map(item => item.idPengguna)).size, 5);
  assert.deepEqual(state.sesi.map(item => [item.idSesi, item.statusSesi]), [
    ['S001', 'DITUTUP'], ['S002', 'DIBUKA'], ['S003', 'BELUM_DIBUKA'],
  ]);
  assert.ok(state.sesi.every(item => item.kodeQr.length > 0));
  assert.equal(state.presensi.length, 1);
  const seed = state.presensi[0];
  assert.equal(seed.idSesi, 'S001');
  assert.equal(seed.idPengguna, 'P001');
  assert.equal(seed.idPresensi, 'presensi:S001:P001');
  assert.equal(new Date(seed.waktuHadir).toISOString(), seed.waktuHadir);
  assert.equal(new Date(seed.waktuHadir).toLocaleString('en-GB', {
    timeZone: 'Asia/Jakarta', weekday: 'long', hour: '2-digit', minute: '2-digit',
  }), 'Monday 09:15');
  assert.ok(Date.parse(seed.waktuHadir) < Date.parse('2026-10-25T00:00:00+07:00'));
});

test('initial state clones each fixture and reload restores only seed attendance', () => {
  const first = createInitialState();
  const second = createInitialState();
  assert.deepEqual(first, second);
  first.sesi[0].statusSesi = 'DIBUKA';
  first.pengguna[0].nama = 'Changed';
  first.presensi[0].waktuHadir = 'Changed';
  first.presensi.push({ ...dummyPresensi[0], idPengguna: 'P002' });
  assert.equal(second.sesi[0].statusSesi, 'DITUTUP');
  assert.equal(second.pengguna[0].nama, 'Bima');
  assert.equal(second.penggunaAktif, null);
  assert.deepEqual(second.presensi, dummyPresensi);
  assert.notEqual(second.presensi, dummyPresensi);
  assert.notEqual(second.presensi[0], dummyPresensi[0]);
  assert.deepEqual(createInitialState(), second);
});

test('provider selectors return only the requested user or session attendance', () => {
  let app;
  renderToStaticMarkup(React.createElement(AppProvider, null,
    React.createElement(AppContext.Consumer, null, value => {
      app = value;
      return null;
    }),
  ));
  assert.deepEqual(app.getRiwayatPengguna('P001'), dummyPresensi);
  for (const idPengguna of ['P002', 'P003', 'A001', 'A002', 'missing', '']) {
    assert.deepEqual(app.getRiwayatPengguna(idPengguna), []);
  }
  assert.deepEqual(app.getPresensiBySesi('S001'), dummyPresensi);
  for (const idSesi of ['S002', 'S003', 'missing']) {
    assert.deepEqual(app.getPresensiBySesi(idSesi), []);
  }
  assert.equal(app.sudahPresensi('S001', 'P001'), true);
  assert.equal(app.sudahPresensi('S002', 'P001'), false);
  assert.equal(app.sudahPresensi('S001', 'P002'), false);
});

test('assistant opens only the requested session without mutating input', () => {
  const initial = freeze(pilih(createInitialState(), 'A001'));
  const opened = buka(initial, 'S003');
  assert.equal(opened.sesi[2].statusSesi, 'DIBUKA');
  assert.equal(initial.sesi[2].statusSesi, 'BELUM_DIBUKA');
  assert.equal(opened.sesi[2].kodeQr, initial.sesi[2].kodeQr);
  assert.equal(opened.sesi[0], initial.sesi[0]);
  assert.equal(opened.sesi[1], initial.sesi[1]);
  assert.equal(opened.presensi, initial.presensi);
  assert.deepEqual(buka(initial, 'S003'), opened);
});

test('session lifecycle allows unopened -> opened -> closed, with no reopening', () => {
  const initial = pilih(createInitialState(), 'A001');
  assert.equal(tutup(initial, 'S003'), initial);
  assert.equal(buka(initial, 'S002'), initial);
  assert.equal(buka(initial, 'S001'), initial);
  assert.equal(buka(initial, 'missing'), initial);
  assert.equal(tutup(initial, 'missing'), initial);
  const opened = buka(initial, 'S003');
  assert.equal(buka(opened, 'S003'), opened);
  const closed = tutup(opened, 'S003');
  assert.equal(closed.sesi[2].statusSesi, 'DITUTUP');
  assert.equal(buka(closed, 'S003'), closed);
  assert.equal(tutup(closed, 'S003'), closed);
});

test('missing identity and practitioners cannot open or close sessions', () => {
  for (const state of [createInitialState(), pilih(createInitialState(), 'P001')]) {
    assert.equal(buka(state, 'S003'), state);
    assert.equal(tutup(state, 'S002'), state);
  }
});

test('attendance records the provided timestamp and reducer stays deterministic', () => {
  const initial = freeze(pilih(createInitialState(), 'P001'));
  const recorded = catat(initial, 'S002', 'P001');
  assert.equal(recorded.presensi.length, 2);
  assert.deepEqual(recorded.presensi[1], {
    idPresensi: 'presensi:S002:P001',
    idSesi: 'S002',
    idPengguna: 'P001',
    waktuHadir: '2026-10-24T12:00:00.000Z',
  });
  assert.deepEqual(catat(initial, 'S002', 'P001'), recorded);
  assert.deepEqual(initial.presensi, dummyPresensi);
  assert.equal(recorded.presensi[0], initial.presensi[0]);
  assert.equal(recorded.sesi, initial.sesi);
});

test('duplicate attendance never overwrites the original timestamp', () => {
  const recorded = catat(pilih(createInitialState(), 'P001'), 'S002', 'P001');
  assert.equal(catat(recorded, 'S002', 'P001', '2026-10-24T13:00:00.000Z'), recorded);
  assert.equal(recorded.presensi.length, 2);
  assert.equal(recorded.presensi[1].waktuHadir, '2026-10-24T12:00:00.000Z');
});

test('different practitioners and sessions can each receive attendance', () => {
  let state = buka(pilih(createInitialState(), 'A001'), 'S003');
  state = catat(pilih(state, 'P001'), 'S003', 'P001');
  state = catat(state, 'S002', 'P001');
  state = catat(pilih(state, 'P002'), 'S002', 'P002');
  assert.equal(state.presensi.length, 4);
  assert.equal(new Set(state.presensi.map(item => item.idPresensi)).size, 4);
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
  assert.deepEqual(createInitialState().presensi, dummyPresensi);
});

test('seed attendance cannot be overwritten and assistants share session state', () => {
  const initial = pilih(createInitialState(), 'P001');
  assert.equal(catat(initial, 'S001', 'P001'), initial);
  let state = catat(pilih(initial, 'P002'), 'S002', 'P002');
  state = catat(pilih(state, 'P001'), 'S002', 'P001', '2026-10-24T12:05:00.000Z');
  state = pilih(state, 'A002');
  assert.equal(state.presensi.filter(item => item.idSesi === 'S002').length, 2);
  assert.equal(state.presensi.filter(item => item.idPengguna === 'P001').length, 2);
  assert.equal(state.presensi.filter(item => item.idPengguna === 'P002').length, 1);
  assert.equal(state.presensi.filter(item => item.idPengguna === 'P003').length, 0);
  const closed = tutup(state, 'S002');
  assert.equal(closed.sesi[1].statusSesi, 'DITUTUP');
  assert.equal(closed.presensi, state.presensi);
  assert.deepEqual(closed.presensi[0], dummyPresensi[0]);
});

test('attendance time uses Indonesian dates and padded device-local hours and minutes', () => {
  assert.equal(formatWaktu(new Date(2026, 9, 20, 9, 15).toISOString()), '20 Okt 2026, 09.15');
  assert.equal(formatWaktu(new Date(2026, 0, 1, 0, 0).toISOString()), '1 Jan 2026, 00.00');
  assert.equal(formatWaktu(new Date(2026, 11, 31, 23, 59).toISOString()), '31 Des 2026, 23.59');
  assert.equal(formatWaktu(new Date(2028, 1, 29, 8, 5).toISOString()), '29 Feb 2028, 08.05');
});

test('empty and invalid attendance times have a safe fallback', () => {
  for (const waktu of ['', '   ', '\n', null, undefined, 'not-a-date', '2026-13-20T09:15:00Z']) {
    assert.equal(formatWaktu(waktu), '-');
  }
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
