const assert = require('node:assert/strict');
const test = require('node:test');
const { HttpsError } = require('firebase-functions/v2/https');
const { createDemoLoginHandler } = require('../../lib/auth/demo-login-handler');
const { consumeDemoLoginQuota } = require('../../lib/auth/demo-login-rate-limit');

function fixture(overrides = {}) {
  const calls = [];
  const config = {
    enabled: true, environment: 'staging', projectId: 'hadirin-staging',
    allowedProjectId: 'hadirin-staging', appId: 'android-app-id',
    asistenUid: 'demo-asisten', praktikanUid: 'demo-praktikan', rateLimitSalt: 'x'.repeat(32),
    ...overrides,
  };
  const deps = {
    config: () => config,
    consumeQuota: async key => calls.push(['quota', key]),
    getAccount: async uid => ({
      uid, disabled: false, email: 'demo@example.test',
      profile: { uid, peran: uid === 'demo-asisten' ? 'ASISTEN' : 'PRAKTIKAN',
        nama: 'Demo', nim: '123', email: 'demo@example.test', kodePeserta: 'DEMO0001' },
    }),
    createCustomToken: async uid => { calls.push(['sign', uid]); return 'test-custom-token'; },
  };
  return { deps, calls, config, run: request => createDemoLoginHandler(deps)(request) };
}
const request = peran => ({ data: { peran }, app: { appId: 'android-app-id', alreadyConsumed: false }, rawRequest: { ip: '192.0.2.1' } });

for (const [role, uid] of [['ASISTEN', 'demo-asisten'], ['PRAKTIKAN', 'demo-praktikan']]) {
  test(`signed-out attested ${role} gets only its configured UID`, async () => {
    const f = fixture();
    assert.deepEqual(await f.run(request(role)), { customToken: 'test-custom-token' });
    assert.deepEqual(f.calls[1], ['sign', uid]);
    assert.match(f.calls[0][1], /^[a-f0-9]{64}$/);
    assert.ok(!f.calls[0][1].includes('192.0.2.1'));
  });
}
for (const config of [
  { enabled: false }, { environment: 'production' }, { allowedProjectId: '' },
  { projectId: 'hadirin-production' }, { asistenUid: '' }, { praktikanUid: 'demo-asisten' },
  { rateLimitSalt: '' }, { appId: '' },
]) {
  test(`fails closed for invalid/disabled config ${JSON.stringify(config)}`, async () => {
    const f = fixture(config);
    await assert.rejects(f.run(request('ASISTEN')), HttpsError);
    assert.equal(f.calls.length, 0);
  });
}
for (const app of [undefined, { appId: 'wrong-app', alreadyConsumed: false },
  { appId: 'android-app-id', alreadyConsumed: true }, { appId: 'android-app-id' }]) {
  test(`rejects missing/wrong/replayed attestation ${JSON.stringify(app)}`, async () => {
    const f = fixture();
    await assert.rejects(f.run({ ...request('ASISTEN'), app }), { code: 'unauthenticated' });
    assert.equal(f.calls.length, 0);
  });
}
for (const data of [null, [], {}, { peran: 'ADMIN' }, { peran: 'asisten' },
  { peran: 'ASISTEN', uid: 'arbitrary' }, { peran: 'PRAKTIKAN', extra: true }]) {
  test(`rejects invalid request ${JSON.stringify(data)}`, async () => {
    const f = fixture();
    await assert.rejects(f.run({ ...request('ASISTEN'), data }), { code: 'invalid-argument' });
    assert.equal(f.calls.length, 0);
  });
}
for (const patch of [{ disabled: true }, { uid: 'someone-else' }, { profile: null },
  { profile: { peran: 'PRAKTIKAN' } }, { email: 'wrong@example.test' }]) {
  test(`does not sign an invalid demo account ${JSON.stringify(patch)}`, async () => {
    const f = fixture();
    const read = f.deps.getAccount;
    f.deps.getAccount = async uid => ({ ...await read(uid), ...patch });
    await assert.rejects(f.run(request('ASISTEN')), { code: 'failed-precondition' });
    assert.equal(f.calls.filter(([name]) => name === 'sign').length, 0);
  });
}

test('quota/backend/signing failures never issue a token or expose private errors', async () => {
  for (const step of ['consumeQuota', 'getAccount', 'createCustomToken']) {
    const f = fixture();
    f.deps[step] = async () => { throw new Error('PRIVATE SERVICE ACCOUNT DETAILS'); };
    await assert.rejects(f.run(request('ASISTEN')), error => error.code === 'internal' && !error.message.includes('PRIVATE'));
  }
  const f = fixture();
  f.deps.consumeQuota = async () => { throw new HttpsError('resource-exhausted', 'limit'); };
  await assert.rejects(f.run(request('ASISTEN')), { code: 'resource-exhausted' });
});

test('unknown IP fails closed before any account lookup or signing', async () => {
  const f = fixture();
  await assert.rejects(f.run({ ...request('ASISTEN'), rawRequest: {} }), { code: 'unauthenticated' });
  assert.equal(f.calls.length, 0);
});

function database() {
  const docs = new Map();
  let queue = Promise.resolve();
  return {
    docs,
    collection: name => ({ doc: id => `${name}/${id}` }),
    runTransaction(callback) {
      const operation = queue.then(async () => {
        const writes = [];
        let wrote = false;
        const result = await callback({
          get: async ref => { assert.equal(wrote, false); return { data: () => docs.get(ref) }; },
          set: (ref, data) => { wrote = true; writes.push([ref, data]); },
        });
        for (const [ref, data] of writes) docs.set(ref, data);
        return result;
      });
      queue = operation.catch(() => {});
      return operation;
    },
  };
}

test('per-caller quota handles concurrent attempts, resets next minute, and stores no raw IP', async () => {
  const db = database();
  const results = await Promise.allSettled(Array.from({ length: 12 }, () => consumeDemoLoginQuota(db, 'hashed-caller', 1000)));
  assert.equal(results.filter(r => r.status === 'fulfilled').length, 5);
  assert.equal(db.docs.get('_demoLoginLimits/global').count, 5);
  assert.equal(db.docs.get('_demoLoginLimits/hashed-caller').count, 5);
  assert.equal(db.docs.get('_demoLoginLimits/hashed-caller').expiresAt.toMillis(), 120000);
  await consumeDemoLoginQuota(db, 'hashed-caller', 61000);
  assert.equal(db.docs.get('_demoLoginLimits/global').count, 1);
});

test('global quota bounds new callers; corrupt counters fail closed; failed writes propagate', async () => {
  const db = database();
  for (let n = 0; n < 60; n++) await consumeDemoLoginQuota(db, `caller-${n}`, 1000);
  await assert.rejects(consumeDemoLoginQuota(db, 'caller-61', 1000), { code: 'resource-exhausted' });
  assert.equal(db.docs.has('_demoLoginLimits/caller-61'), false);
  db.docs.set('_demoLoginLimits/global', { windowStart: 60000, count: 'invalid' });
  await assert.rejects(consumeDemoLoginQuota(db, 'caller-1', 61000), { code: 'resource-exhausted' });
  await assert.rejects(consumeDemoLoginQuota({ runTransaction: async () => { throw new Error('offline'); }, collection: db.collection }, 'caller', 61000), /offline/);
});
