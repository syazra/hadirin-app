const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const test = require('node:test');
const ts = require('typescript');

function fixture(options = {}) {
  const calls = [];
  const auth = { currentUser: options.currentUser ?? null };
  const profile = { uid: 'demo-asisten', peran: 'ASISTEN', nama: 'Demo' };
  const f = {
    auth, calls, profile,
    response: { data: { customToken: 'synthetic-test-token' } },
    callable: async () => f.response,
    readProfile: async () => ({ ok: true, data: profile }),
    signIn: async () => {
      auth.currentUser = { uid: profile.uid };
      return { user: auth.currentUser };
    },
  };
  const adapters = {
    '@react-native-firebase/auth': {
      signInWithCustomToken: async (receivedAuth, token) => {
        assert.equal(receivedAuth, auth);
        calls.push(['signIn', token]);
        return f.signIn();
      },
      signOut: async receivedAuth => {
        assert.equal(receivedAuth, auth); calls.push(['signOut']); auth.currentUser = null;
      },
    },
    '@react-native-firebase/functions': {
      getFunctions: (app, region) => { calls.push(['region', region]); return { app }; },
      httpsCallable: (_, name, opts) => {
        calls.push(['callable', name, opts.limitedUseAppCheckTokens]);
        return async data => { calls.push(['request', data.peran, Object.keys(data).join(',')]); return f.callable(); };
      },
    },
    '@/lib/firebase': {
      isFirebaseAvailable: options.available ?? true,
      getFirebaseServices: () => ({
        app: { options: { projectId: options.projectId ?? 'hadirin-staging' } },
        appCheck: options.appCheck === null ? null : {}, auth,
      }),
    },
    '@/services/auth-service': { ambilProfil: async () => f.readProfile() },
    '@/utils/error-firebase': { hasilErrorFirebase: () => ({ ok: false, alasan: 'TIDAK_DIKENAL', pesan: 'Generic error' }) },
  };
  const source = fs.readFileSync(path.join(__dirname, '../../src/services/demo-login-service.ts'), 'utf8');
  const { outputText } = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } });
  const module = { exports: {} };
  vm.runInNewContext(outputText, {
    module, exports: module.exports,
    process: { env: {
      EXPO_PUBLIC_DEMO_LOGIN_ENABLED: 'true', EXPO_PUBLIC_DEMO_LOGIN_ENVIRONMENT: 'staging',
      EXPO_PUBLIC_DEMO_LOGIN_PROJECT_ID: 'hadirin-staging', ...options.env,
    } },
    require: name => { assert.ok(name in adapters, name); return adapters[name]; },
  });
  f.service = module.exports;
  return f;
}

for (const peran of ['ASISTEN', 'PRAKTIKAN']) {
  test(`demo ${peran} uses attested callable and returns profile, never token`, async () => {
    const f = fixture();
    f.profile.peran = peran;
    const result = await f.service.masukDemo(peran);
    assert.equal(result.ok, true);
    assert.equal(result.data, f.profile);
    assert.equal('customToken' in result.data, false);
    assert.deepEqual(f.calls, [
      ['region', 'asia-southeast2'], ['callable', 'demoLogin', true],
      ['request', peran, 'peran'], ['signIn', 'synthetic-test-token'],
    ]);
  });
}

for (const options of [
  { available: false }, { env: { EXPO_PUBLIC_DEMO_LOGIN_ENABLED: undefined } },
  { env: { EXPO_PUBLIC_DEMO_LOGIN_ENVIRONMENT: 'production' } },
  { env: { EXPO_PUBLIC_DEMO_LOGIN_PROJECT_ID: '' } },
  { projectId: 'hadirin-production' }, { appCheck: null }, { currentUser: { uid: 'manual' } },
]) {
  test(`disabled or unsafe client config cannot call demo ${JSON.stringify(options)}`, async () => {
    const f = fixture(options);
    assert.equal((await f.service.masukDemo('ASISTEN')).ok, false);
    assert.equal(f.calls.length, 0);
  });
}

test('invalid role and malformed token response cannot sign in', async () => {
  const f = fixture();
  assert.equal((await f.service.masukDemo('ADMIN')).alasan, 'INPUT_TIDAK_VALID');
  assert.equal(f.calls.length, 0);
  for (const data of [null, {}, { customToken: '' }, { customToken: 42 }, { customToken: 'x'.repeat(8193) }]) {
    f.response = { data };
    assert.equal((await f.service.masukDemo('ASISTEN')).alasan, 'RESPONS_TIDAK_VALID');
  }
  assert.ok(!f.calls.some(([name]) => name === 'signIn'));
});

test('concurrent demo requests and a manual login during a pending call are protected', async () => {
  const f = fixture();
  let resolve;
  f.callable = () => new Promise(done => { resolve = done; });
  const pending = f.service.masukDemo('ASISTEN');
  assert.equal((await f.service.masukDemo('PRAKTIKAN')).alasan, 'INPUT_TIDAK_VALID');
  f.auth.currentUser = { uid: 'manual' };
  resolve(f.response);
  assert.equal((await pending).alasan, 'TIDAK_BERWENANG');
  assert.equal(f.auth.currentUser.uid, 'manual');
  assert.ok(!f.calls.some(([name]) => name === 'signIn'));
});

for (const mode of ['missing', 'wrong-role', 'throws', 'account-changed']) {
  test(`profile validation ${mode} safely handles the signed-in session`, async () => {
    const f = fixture();
    f.readProfile = async () => {
      if (mode === 'throws') throw new Error('private server details');
      if (mode === 'missing') return { ok: false };
      if (mode === 'wrong-role') return { ok: true, data: { ...f.profile, peran: 'PRAKTIKAN' } };
      f.auth.currentUser = { uid: 'new-user' };
      return { ok: true, data: f.profile };
    };
    assert.equal((await f.service.masukDemo('ASISTEN')).ok, false);
    if (mode === 'account-changed') {
      assert.equal(f.auth.currentUser.uid, 'new-user');
      assert.ok(!f.calls.some(([name]) => name === 'signOut'));
    } else {
      assert.equal(f.auth.currentUser, null);
      assert.ok(f.calls.some(([name]) => name === 'signOut'));
    }
  });
}

for (const [code, alasan] of [
  ['functions/resource-exhausted', 'KUOTA_HABIS'], ['functions/unavailable', 'JARINGAN'],
  ['functions/deadline-exceeded', 'TIMEOUT'], ['functions/unauthenticated', 'TIDAK_BERWENANG'],
  ['functions/failed-precondition', 'TIDAK_BERWENANG'], ['appCheck/token-error', 'TIDAK_BERWENANG'],
  ['auth/invalid-custom-token', 'TIDAK_DIKENAL'],
]) {
  test(`error ${code} is redacted and releases the in-flight lock`, async () => {
    const f = fixture();
    f.callable = async () => { throw { code, message: 'PRIVATE' }; };
    const result = await f.service.masukDemo('ASISTEN');
    assert.equal(result.alasan, alasan);
    assert.ok(!result.pesan.includes('PRIVATE'));
    f.callable = async () => f.response;
    assert.equal((await f.service.masukDemo('ASISTEN')).ok, true);
  });
}
