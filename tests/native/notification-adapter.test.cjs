const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const crypto = require('node:crypto');
const test = require('node:test');
const ts = require('typescript');
function fixture({ platform = 'android', allowed = false, asked = false } = {}) {
  const store = new Map(asked ? [['push.permissionAsked.v1', 'true']] : []);
  const f = { settings: 0, prompts: 0, allowed, writes: [], uid: 'user-a', txRuns: 0, rotations: 0, autoInit: [] };
  const adapters = {
    'react-native': { Platform: { OS: platform, Version: 33 }, Linking: { openSettings: async () => { f.settings++; } },
      PermissionsAndroid: { PERMISSIONS: { POST_NOTIFICATIONS: 'android.permission.POST_NOTIFICATIONS' }, request: async () => { f.prompts++; return 'denied'; } } },
    'expo-secure-store': { getItemAsync: async key => store.get(key) ?? null, setItemAsync: async (key, value) => { store.set(key, value); } },
    'expo-crypto': { CryptoDigestAlgorithm: { SHA256: 'SHA256' }, digestStringAsync: async (_, data) => crypto.createHash('sha256').update(data).digest('hex') },
    '@react-native-firebase/installations': { getId: async () => 'fid-a' },
    '@react-native-firebase/messaging': { hasPermission: async () => f.allowed ? 1 : 0, deleteToken: async () => { f.rotations++; },
      getToken: async () => 'synthetic-token', setAutoInitEnabled: async (_, enabled) => { f.autoInit.push(enabled); } },
    '@react-native-firebase/firestore': { doc: (_, ...parts) => parts.join('/'), serverTimestamp: () => 'SERVER_TIMESTAMP',
      getDocFromServer: async () => ({ exists: () => false }), runTransaction: async (_, work) => {
        f.txRuns++; return work({ get: async () => ({ data: () => undefined }),
          set: (ref, value) => f.writes.push({ ref, value }), delete: ref => f.writes.push({ deleted: ref }) });
      } },
    '@/lib/firebase': { isFirebaseAvailable: platform === 'android', getFirebaseNativeServices: () => ({ messaging: {}, installations: {} }),
      getFirebaseServices: () => ({ db: {}, auth: { get currentUser() { return f.uid ? { uid: f.uid } : null; } } }) },
  };
  function load(file) {
    const source = fs.readFileSync(path.join(__dirname, '../../src/services', file), 'utf8');
    const { outputText } = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } });
    const module = { exports: {} };
    vm.runInNewContext(outputText, { module, exports: module.exports, setTimeout, clearTimeout,
      require: name => { assert.ok(name in adapters, `Unexpected import ${name}`); return adapters[name]; } });
    return module.exports;
  }
  adapters['./notification-registration'] = load('notification-registration.ts');
  f.service = load('notification-service.ts'); f.store = store;
  return f;
}
test('permission prompt occurs only after explicit action, once per installation; denial recovers through Settings', async () => {
  const f = fixture(); await f.service.notificationRegistration.connect('user-a');
  assert.equal(f.prompts, 0);
  await Promise.all([f.service.notificationPermissionAction(), f.service.notificationPermissionAction()]); assert.equal(f.prompts, 1);
  await f.service.notificationPermissionAction(); assert.equal(f.prompts, 1); assert.equal(f.settings, 1);
});
test('native adapter writes owner-only installation schema; logout cleans registry and invalidates token', async () => {
  const f = fixture({ allowed: true }); await f.service.notificationRegistration.connect('user-a');
  assert.equal(f.writes[0].ref, 'pengguna/user-a/perangkat/fid-a');
  assert.equal(f.writes[0].value.fcmToken, 'synthetic-token'); assert.equal(f.writes[0].value.platform, 'android');
  assert.equal(f.writes[0].value.diperbaruiPada, 'SERVER_TIMESTAMP');
  await f.service.unregisterNotificationsBeforeLogout(); assert.equal(f.rotations, 2);
  assert.deepEqual(f.autoInit, [false, true, false]);
  assert.equal(f.writes[1].deleted, 'pengguna/user-a/perangkat/fid-a');
});
test('durable presentation/navigation dedupe is serialized, account scoped, and bounded', async () => {
  const f = fixture(); const p = { recipientUid: 'a', eventId: 'event-1' };
  const result = await Promise.all([f.service.claimNotification(p, 'shown'), f.service.claimNotification(p, 'shown')]);
  assert.deepEqual(result, [true, false]);
  assert.equal(await f.service.claimNotification(p, 'opened'), true);
  assert.equal(await f.service.claimNotification({ ...p, recipientUid: 'b' }, 'shown'), true);
  for (let i = 0; i < 40; i++) await f.service.claimNotification({ ...p, eventId: `event-${i}` }, 'shown');
  assert.equal(JSON.parse(f.store.get('push.seen.v1')).length, 24);
  assert.ok(f.store.get('push.seen.v1').length < 2048);
  assert.ok(!f.store.get('push.seen.v1').includes('event-'));
});
for (const platform of ['ios', 'web']) test(`${platform}: no permission/native token/Settings operations`, async () => {
  const f = fixture({ platform, allowed: true }); await f.service.notificationRegistration.connect('user-a');
  await f.service.notificationPermissionAction(); await f.service.openNotificationSettings();
  await f.service.unregisterNotificationsBeforeLogout();
  assert.equal(f.service.notificationRegistration.getSnapshot(), 'UNSUPPORTED');
  assert.equal(f.prompts + f.settings + f.rotations + f.txRuns, 0);
});

test('background handler is registered before Router, validates data, and dedupes presentation without navigation', async () => {
  let background; const order = [], claimed = [];
  const adapters = {
    'react-native': { Platform: { OS: 'android' } },
    '@react-native-firebase/messaging': { setBackgroundMessageHandler: (_, handler) => { background = handler; order.push('background'); } },
    '@/lib/firebase': { getFirebaseNativeServices: () => ({ messaging: {} }) },
    '@/utils/notification-routing': { parsePushPayload: data => data?.valid ? data : null },
    '@/services/notification-service': { claimNotification: async (payload, phase) => claimed.push([payload.eventId, phase]) },
  };
  function run(relative) {
    const source = fs.readFileSync(path.join(__dirname, '../..', relative), 'utf8');
    const { outputText } = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } });
    vm.runInNewContext(outputText, { exports: {}, console,
      require: name => {
        if (name === './src/services/notification-background') return run('src/services/notification-background.ts');
        if (name === 'expo-router/entry') { order.push('router'); return {}; }
        assert.ok(name in adapters, name); return adapters[name];
      } });
  }
  run('index.js'); assert.deepEqual(order, ['background', 'router']);
  await background({ data: { eventId: 'invalid' } }); assert.equal(claimed.length, 0);
  await background({ data: { eventId: 'source-1', valid: true } }); assert.deepEqual(claimed, [['source-1', 'shown']]);
});
