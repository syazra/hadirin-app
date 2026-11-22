const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const test = require('node:test');
const ts = require('typescript');

// Run the actual service modules with native adapters replaced, without loading RN in Node.
function fixture({ platform = 'android', development = false, fail = false } = {}) {
  const calls = [];
  const warnings = [];
  const app = { name: '[DEFAULT]' };
  const instance = { app };
  const adapters = {
    'react-native': { Platform: { OS: platform } },
    '@react-native-firebase/app': { getApp: () => app },
    '@react-native-firebase/app-check': { initializeAppCheck: (receivedApp, options) => {
      assert.equal(receivedApp, app);
      calls.push(['appCheck', options]);
      if (fail) throw new Error('private token must never appear in logs');
      return instance;
    } },
  };
  for (const [pkg, accessor] of [
    ['auth', 'getAuth'], ['firestore', 'getFirestore'],
    ['messaging', 'getMessaging'], ['installations', 'getInstallations'],
  ]) {
    adapters[`@react-native-firebase/${pkg}`] = { [accessor]: receivedApp => {
      assert.equal(receivedApp, app);
      calls.push([pkg]);
      return { app };
    } };
  }
  function load(file) {
    const source = fs.readFileSync(path.join(__dirname, '../../src/lib', file), 'utf8');
    const { outputText } = ts.transpileModule(source, {
      compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
    });
    const module = { exports: {} };
    vm.runInNewContext(outputText, {
      module, exports: module.exports, __DEV__: development,
      require: name => {
        assert.ok(name in adapters, `Unexpected native import ${name}`);
        return adapters[name];
      },
      console: { warn: text => warnings.push(text) },
    });
    return module.exports;
  }
  adapters['@/lib/firebase-app-check'] = load('firebase-app-check.ts');
  return { services: load('firebase.ts'), calls, warnings, instance };
}

for (const development of [true, false]) {
  test(`App Check configures once before Auth/Firestore (development=${development})`, () => {
    const f = fixture({ development });
    assert.equal(f.services.getFirebaseServices().appCheck, f.instance);
    f.services.getFirebaseServices();
    assert.equal(f.calls.filter(([name]) => name === 'appCheck').length, 1);
    assert.equal(f.calls[0][0], 'appCheck');
    assert.equal(f.calls[0][1].provider.providerOptions.android.provider, development ? 'debug' : 'playIntegrity');
    assert.equal(f.calls[0][1].isTokenAutoRefreshEnabled, true);
  });
}

for (const platform of ['ios', 'web']) {
  test(`${platform} cannot initialize Android-only services`, () => {
    const f = fixture({ platform });
    assert.equal(f.services.isFirebaseAvailable, false);
    assert.throws(() => f.services.getFirebaseServices(), /Android/);
    assert.throws(() => f.services.getFirebaseNativeServices(), /Android/);
    assert.equal(f.calls.length, 0);
  });
}

test('synchronous App Check setup failure preserves ordinary login and logs no exception data', () => {
  const f = fixture({ fail: true });
  assert.equal(f.services.getFirebaseServices().appCheck, null);
  assert.ok(f.services.getFirebaseServices().auth);
  assert.equal(f.warnings.length, 1);
  assert.ok(!f.warnings[0].includes('private token'));
});

test('native accessors configure services without requesting tokens or permissions', () => {
  const f = fixture();
  assert.ok(f.services.getFirebaseNativeServices().installations);
  assert.ok(f.services.getFirebaseNativeServices().messaging);
  assert.ok(f.calls.some(([name]) => name === 'installations'));
  assert.ok(f.calls.some(([name]) => name === 'messaging'));
});
