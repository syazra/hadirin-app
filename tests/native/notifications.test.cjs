const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const test = require('node:test');
const ts = require('typescript');
function load(file, adapters = {}) {
  const source = fs.readFileSync(path.join(__dirname, '../../src', file), 'utf8');
  const { outputText } = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } });
  const module = { exports: {} };
  vm.runInNewContext(outputText, { module, exports: module.exports,
    require: name => { assert.ok(name in adapters, `Unexpected import ${name}`); return adapters[name]; } });
  return module.exports;
}
const { NotificationRegistration } = load('services/notification-registration.ts');
const routing = load('utils/notification-routing.ts');
const deferred = () => { let resolve; const promise = new Promise(r => { resolve = r; }); return { promise, resolve }; };
function registration(options = {}) {
  const f = { current: 'user-a', owner: null, allowed: true, token: 'synthetic-token-a', fid: 'install-1', writes: [], removes: [], rotations: 0, ...options };
  f.adapter = {
    supported: options.supported ?? true, currentUid: () => f.current, permission: async () => f.allowed,
    readOwner: async () => f.owner, saveOwner: async uid => { f.owner = uid; },
    rotateToken: async () => { f.rotations++; }, token: async () => f.token, installation: async () => f.fid,
    register: async (...args) => { f.writes.push(args); }, remove: async (...args) => { f.removes.push(args); },
  };
  f.controller = new NotificationRegistration(f.adapter);
  return f;
}
test('no permission: no token request, registry write, or automatic permission prompt', async () => {
  const f = registration({ allowed: false });
  await f.controller.connect('user-a');
  assert.equal(f.controller.getSnapshot(), 'DISABLED');
  assert.equal(f.writes.length, 0); assert.equal(f.rotations, 0);
});
test('registers by installation; refresh updates same record without rotating current account', async () => {
  const f = registration();
  await f.controller.connect('user-a');
  f.token = 'synthetic-refreshed'; await f.controller.sync();
  assert.equal(f.controller.getSnapshot(), 'READY'); assert.equal(f.rotations, 1);
  assert.deepEqual(f.writes, [['user-a', 'install-1', 'synthetic-token-a'], ['user-a', 'install-1', 'synthetic-refreshed']]);
});
test('permission revoked removes owned registry and invalidates token', async () => {
  const f = registration(); await f.controller.connect('user-a');
  f.allowed = false; await f.controller.sync();
  assert.equal(f.controller.getSnapshot(), 'DISABLED'); assert.equal(f.owner, '');
  assert.deepEqual(f.removes, [['user-a', 'install-1']]); assert.equal(f.rotations, 2);
});
test('account switching during token retrieval cannot register the stale account', async () => {
  const f = registration({ owner: 'user-a' }); const started = deferred(), token = deferred();
  f.adapter.token = async () => { started.resolve(); return token.promise; };
  const first = f.controller.connect('user-a'); await started.promise;
  f.current = 'user-b'; f.adapter.token = async () => 'synthetic-token-b';
  const second = f.controller.connect('user-b'); token.resolve('synthetic-token-a');
  await Promise.all([first, second]);
  assert.deepEqual(f.writes, [['user-b', 'install-1', 'synthetic-token-b']]); assert.equal(f.rotations, 1);
});
test('logout cancels pending registration and cannot be reactivated by a late refresh', async () => {
  const f = registration({ owner: 'user-a' }); const started = deferred(), token = deferred();
  f.adapter.token = async () => { started.resolve(); return token.promise; };
  const first = f.controller.connect('user-a'); await started.promise;
  const logout = f.controller.disconnect(); await f.controller.connect('user-a');
  token.resolve('synthetic-token-a'); await Promise.all([first, logout]);
  assert.equal(f.writes.length, 0); assert.equal(f.owner, ''); assert.equal(f.rotations, 1);
  f.current = null; await f.controller.connect(null);
  f.current = 'user-a'; await f.controller.connect('user-a'); assert.equal(f.writes.length, 1);
});
test('offline registration exposes recovery and succeeds when retried', async () => {
  const f = registration(); let offline = true;
  f.adapter.register = async () => { if (offline) throw new Error('private native error'); f.writes.push('registered'); };
  await f.controller.connect('user-a'); assert.equal(f.controller.getSnapshot(), 'ERROR');
  offline = false; await f.controller.sync(); assert.equal(f.controller.getSnapshot(), 'READY');
});
test('registry cleanup failure still invalidates token; next account must rotate again', async () => {
  const f = registration(); await f.controller.connect('user-a');
  f.adapter.remove = async () => { throw new Error('offline'); };
  await assert.rejects(f.controller.disconnect()); assert.equal(f.rotations, 2); assert.equal(f.owner, '');
  f.current = 'user-b'; await f.controller.connect('user-b'); assert.equal(f.rotations, 3);
});
test('external Auth sign-out invalidates previous token even when owner-only deletion is no longer available', async () => {
  const f = registration(); await f.controller.connect('user-a');
  f.current = null; await f.controller.connect(null);
  assert.equal(f.rotations, 2); assert.equal(f.removes.length, 0); assert.equal(f.owner, '');
  f.current = 'user-a'; await f.controller.connect('user-a'); assert.equal(f.writes.length, 2);
});
test('unsupported platforms and mismatched Auth cannot register', async () => {
  const unsupported = registration({ supported: false }); await unsupported.controller.connect('user-a');
  assert.equal(unsupported.controller.getSnapshot(), 'UNSUPPORTED'); assert.equal(unsupported.writes.length, 0);
  const wrong = registration({ current: 'user-b' }); await wrong.controller.connect('user-a'); assert.equal(wrong.writes.length, 0);
});
test('invalid/null token fails safely; separate devices keep independent installation keys', async () => {
  const f = registration({ token: null }); await f.controller.connect('user-a'); assert.equal(f.controller.getSnapshot(), 'ERROR');
  const a = registration(), b = registration({ fid: 'install-2' });
  await Promise.all([a.controller.connect('user-a'), b.controller.connect('user-a')]);
  assert.equal(a.writes[0][1], 'install-1'); assert.equal(b.writes[0][1], 'install-2');
});

const payload = (overrides = {}) => ({ version: '1', eventId: 'source:123', type: 'SESI_DIBUKA', entityId: 'session-1', routeKey: 'SESI', recipientUid: 'user-a', ...overrides });
test('parser rejects malformed versions/types/routes/IDs/recipients; never retains arbitrary URLs', () => {
  for (const value of [null, {}, payload({ version: '2' }), payload({ type: 'OTHER' }), payload({ routeKey: '/admin' }),
    payload({ entityId: '../admin' }), payload({ recipientUid: '' }), payload({ eventId: '' })]) assert.equal(routing.parsePushPayload(value), null);
  assert.equal(routing.parsePushPayload(payload({ route: '/admin' })).route, undefined);
});
function access(overrides = {}) {
  const documents = { 'sesi/session-1': { kelasId: 'class-1', diarsipkan: false },
    'kelas/class-1': { asistenUid: 'assistant', diarsipkan: false },
    'keanggotaan/class-1_user-a': { kelasId: 'class-1', uid: 'user-a', status: 'AKTIF' },
    'izin/leave-1': { kelasId: 'class-1', uid: 'user-a' }, ...overrides };
  return { read: async (collection, id) => documents[`${collection}/${id}`] ?? null };
}
const user = { uid: 'user-a', peran: 'PRAKTIKAN' };
test('session routing requires active membership, matching account, and existing entities', async () => {
  assert.equal((await routing.resolvePushDestination(payload(), user, access())).pathname, '/sesi/[id]');
  assert.equal(await routing.resolvePushDestination(payload(), { ...user, uid: 'user-b' }, access()), null);
  assert.equal(await routing.resolvePushDestination(payload(), user, access({ 'sesi/session-1': null })), null);
  assert.equal(await routing.resolvePushDestination(payload(), user, access({ 'keanggotaan/class-1_user-a': { status: 'NONAKTIF' } })), null);
  assert.equal(await routing.resolvePushDestination(payload(), user, access({ 'kelas/class-1': { diarsipkan: true } })), null);
});
test('leave decisions open only the applicant or owning assistant; role cannot bypass ownership', async () => {
  const p = payload({ entityId: 'leave-1', routeKey: 'IZIN', type: 'IZIN_DISETUJUI' });
  assert.equal((await routing.resolvePushDestination(p, user, access())).pathname, '/izin/[id]');
  assert.equal(await routing.resolvePushDestination(p, user, access({ 'izin/leave-1': { kelasId: 'class-1', uid: 'other' } })), null);
  const assistant = { uid: 'assistant', peran: 'ASISTEN' };
  assert.ok(await routing.resolvePushDestination({ ...p, recipientUid: 'assistant' }, assistant, access()));
  assert.equal(await routing.resolvePushDestination({ ...p, recipientUid: 'other' }, { uid: 'other', peran: 'ASISTEN' }, access()), null);
});
