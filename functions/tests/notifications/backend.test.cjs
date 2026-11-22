const assert = require('node:assert/strict');
const test = require('node:test');
const { enqueueNotification } = require('../../lib/notifications/send-notification');
const { processNotification, NotificationRetry } = require('../../lib/notifications/process-notification');
const { hash, MAX_ATTEMPTS, normalizeNotification, notificationData } = require('../../lib/notifications/notification-contract');
const { getUserDevices } = require('../../lib/notifications/token-service');

function database() {
  const docs = new Map();
  let queue = Promise.resolve();
  const snap = ref => ({ id: ref.id, exists: docs.has(ref.path),
    get: key => docs.get(ref.path)?.[key], data: () => docs.get(ref.path) });
  const doc = path => ({ path, id: path.split('/').at(-1),
    collection: name => collection(`${path}/${name}`), get: async () => snap(doc(path)) });
  const collection = path => ({ doc: id => doc(`${path}/${id}`),
    get: async () => ({ docs: [...docs.keys()].filter(key => key.startsWith(path + '/')
      && !key.slice(path.length + 1).includes('/')).sort().map(key => snap(doc(key))) }) });
  const db = { docs, doc, collection,
    getAll: async (...refs) => refs.map(snap),
    runTransaction(callback) {
      const operation = queue.then(async () => {
        const writes = [];
        let wrote = false;
        const result = await callback({
          get: async ref => { assert.equal(wrote, false, 'transaction must read before writes'); return snap(ref); },
          set: (ref, data) => { wrote = true; writes.push(() => docs.set(ref.path, data)); },
          create: (ref, data) => { wrote = true; assert.ok(!docs.has(ref.path)); writes.push(() => docs.set(ref.path, data)); },
          update: (ref, data) => { wrote = true; writes.push(() => docs.set(ref.path, { ...docs.get(ref.path), ...data })); },
          delete: ref => { wrote = true; writes.push(() => docs.delete(ref.path)); },
        });
        writes.forEach(write => write());
        return result;
      });
      queue = operation.catch(() => {});
      return operation;
    },
  };
  return db;
}
const input = overrides => ({ eventId: 'source-event-1', type: 'SESI_DIBUKA', entityId: 'sesi-1',
  routeKey: 'SESI', recipientUids: ['student-1'], title: 'Sesi dibuka', body: 'Buka aplikasi untuk melihat sesi.', ...overrides });
const token = (db, uid, id, value = `synthetic-token-${id}`) => {
  db.docs.set(`pengguna/${uid}/perangkat/${id}`, { fcmToken: value, platform: 'android' });
};
const accepted = () => ({ success: true, messageId: 'synthetic-message-id' });
const rejected = code => ({ success: false, error: { code, message: 'PRIVATE TOKEN DETAILS' } });
function sender(callback = message => message.tokens.map(accepted)) {
  const messages = [];
  return { messages, async sendEachForMulticast(message) {
    messages.push(message);
    return { responses: await callback(message), successCount: 0, failureCount: 0 };
  } };
}
const event = (db, key) => db.docs.get(`notificationEvents/${key}`);
const deliveries = db => [...db.docs.entries()].filter(([path]) => path.includes('/deliveries/')).map(([, data]) => data);

test('enqueue is concurrent/idempotent, canonicalizes recipients and rejects reused event IDs', async () => {
  const db = database();
  const results = await Promise.all(Array.from({ length: 10 }, () => enqueueNotification(db, input({ recipientUids: ['student-2', 'student-1', 'student-1'] }))));
  assert.equal(results.filter(r => r.status === 'QUEUED').length, 1);
  assert.equal(results.filter(r => r.status === 'ALREADY_QUEUED').length, 9);
  assert.equal((await enqueueNotification(db, input({ recipientUids: ['student-1', 'student-2'] }))).status, 'ALREADY_QUEUED');
  await assert.rejects(enqueueNotification(db, input({ title: 'Different event content' })), /conflict/);
  assert.equal((await enqueueNotification(db, input({ eventId: 'empty', recipientUids: [] }))).status, 'NO_RECIPIENTS');
  assert.equal(db.docs.size, 1);
});

test('contract only emits versioned string data and allowlisted routes', () => {
  for (const value of [input({ routeKey: 'https://evil.test' }), input({ type: 'UNKNOWN' }),
    input({ entityId: '../bad' }), input({ recipientUids: ['bad/uid'] }), input({ title: '' })]) {
    assert.throws(() => normalizeNotification(value));
  }
  assert.deepEqual(notificationData(input()), { version: '1', eventId: 'source-event-1', type: 'SESI_DIBUKA', entityId: 'sesi-1', routeKey: 'SESI' });
  for (const type of ['IZIN_DISETUJUI', 'IZIN_DITOLAK']) assert.doesNotThrow(() => normalizeNotification(input({ type, routeKey: 'IZIN' })));
});

test('multi-user/device fanout is targeted, records FCM acceptance, and suppresses event retries', async () => {
  const db = database();
  token(db, 'student-1', 'phone'); token(db, 'student-1', 'tablet'); token(db, 'unrelated', 'other');
  const { eventKey } = await enqueueNotification(db, input({ recipientUids: ['student-1', 'student-2'] }));
  const fcm = sender();
  assert.deepEqual(await processNotification(db, fcm, eventKey), { state: 'COMPLETE', accepted: 2 });
  assert.equal(event(db, eventKey).noTokenUsers, 1);
  assert.equal(fcm.messages[0].tokens.length, 2);
  assert.ok(!fcm.messages[0].tokens.includes('synthetic-token-other'));
  assert.equal(fcm.messages[0].android.notification.tag, eventKey);
  assert.ok(deliveries(db).every(d => d.state === 'ACCEPTED' && !('token' in d) && !('message' in d)));
  await processNotification(db, fcm, eventKey);
  assert.equal(fcm.messages.length, 1);
});

test('no registered devices completes without calling FCM', async () => {
  const db = database(); const fcm = sender();
  const { eventKey } = await enqueueNotification(db, input());
  assert.equal((await processNotification(db, fcm, eventKey)).accepted, 0);
  assert.equal(event(db, eventKey).noTokenUsers, 1);
  assert.equal(fcm.messages.length, 0);
});

test('partial transient failure retries only pending device and preserves accepted ledger', async () => {
  const db = database(); token(db, 'student-1', 'a'); token(db, 'student-1', 'b');
  const { eventKey } = await enqueueNotification(db, input());
  const fcm = sender(() => fcm.messages.length === 1 ? [accepted(), rejected('messaging/server-unavailable')] : [accepted()]);
  await assert.rejects(processNotification(db, fcm, eventKey), NotificationRetry);
  assert.equal(event(db, eventKey).state, 'RETRY');
  assert.equal((await processNotification(db, fcm, eventKey)).accepted, 2);
  assert.deepEqual(fcm.messages[1].tokens, ['synthetic-token-b']);
  assert.equal(event(db, eventKey).attempts, 2);
});

test('invalid token cleanup is conditional and never deletes a refreshed token', async () => {
  for (const refresh of [false, true]) {
    const db = database(); token(db, 'student-1', 'phone');
    const { eventKey } = await enqueueNotification(db, input());
    const fcm = sender(() => {
      if (refresh) token(db, 'student-1', 'phone', 'refreshed-valid-token');
      return [rejected('messaging/registration-token-not-registered')];
    });
    await processNotification(db, fcm, eventKey);
    const stored = db.docs.get('pengguna/student-1/perangkat/phone');
    assert.equal(Boolean(stored), refresh);
    if (refresh) assert.equal(stored.fcmToken, 'refreshed-valid-token');
    assert.ok(!JSON.stringify(deliveries(db)).includes('PRIVATE'));
  }
});

test('payload and batch-level errors do not establish invalid individual tokens', async () => {
  for (const batch of [false, true]) {
    const db = database(); token(db, 'student-1', 'phone');
    const { eventKey } = await enqueueNotification(db, input());
    const fcm = sender(() => {
      if (batch) throw { code: 'messaging/invalid-registration-token', message: 'PRIVATE' };
      return [rejected('messaging/invalid-argument')];
    });
    await processNotification(db, fcm, eventKey);
    assert.ok(db.docs.has('pengguna/student-1/perangkat/phone'));
    assert.equal(event(db, eventKey).failed, 1);
  }
});

test('transient and unknown failures stop at the durable event attempt budget', async () => {
  const db = database(); token(db, 'student-1', 'phone');
  const { eventKey } = await enqueueNotification(db, input());
  const fcm = sender(() => { throw new Error('PRIVATE TOKEN DETAILS'); });
  for (let n = 0; n < MAX_ATTEMPTS; n++) await assert.rejects(processNotification(db, fcm, eventKey), NotificationRetry);
  await processNotification(db, fcm, eventKey);
  assert.equal(event(db, eventKey).state, 'EXHAUSTED');
  assert.equal(fcm.messages.length, MAX_ATTEMPTS);
  assert.equal(event(db, eventKey).attempts, MAX_ATTEMPTS);
});

test('concurrent workers respect the lease; expired leases resume safely', async () => {
  const db = database(); token(db, 'student-1', 'phone');
  const { eventKey } = await enqueueNotification(db, input());
  let release;
  const fcm = sender(() => new Promise(resolve => { release = () => resolve([accepted()]); }));
  const first = processNotification(db, fcm, eventKey);
  while (!release) await new Promise(resolve => setTimeout(resolve, 0));
  await assert.rejects(processNotification(db, fcm, eventKey), NotificationRetry);
  release(); await first;
  assert.equal(fcm.messages.length, 1);
  const next = await enqueueNotification(db, input({ eventId: 'source-event-2' }));
  Object.assign(event(db, next.eventKey), { state: 'PROCESSING', leaseUntil: { toMillis: () => 1 }, owner: 'crashed-worker' });
  assert.equal((await processNotification(db, sender(), next.eventKey)).accepted, 1);
});

test('malformed server events are terminal, malformed registry records are ignored', async () => {
  const db = database(); token(db, 'student-1', 'good');
  db.docs.set('pengguna/student-1/perangkat/bad', { fcmToken: 42 });
  assert.equal((await getUserDevices(db, 'student-1')).length, 1);
  const { eventKey } = await enqueueNotification(db, input());
  event(db, eventKey).input.routeKey = 'https://evil.test';
  const fcm = sender();
  assert.equal((await processNotification(db, fcm, eventKey)).state, 'INVALID');
  assert.equal(fcm.messages.length, 0);
});

test('fanout chunks device batches and resumes without resending completed recipients', async () => {
  const db = database();
  for (let n = 0; n < 205; n++) token(db, 'student-1', `device-${n}`);
  token(db, 'student-2', 'phone');
  const { eventKey } = await enqueueNotification(db, input({ recipientUids: ['student-1', 'student-2', 'student-3'] }));
  const fcm = sender(message => message.tokens.map(value => value === 'synthetic-token-phone' ? rejected('messaging/server-unavailable') : accepted()));
  await assert.rejects(processNotification(db, fcm, eventKey), NotificationRetry);
  assert.equal(fcm.messages.length, 4);
  assert.ok(fcm.messages.every(message => message.tokens.length <= 100));
  const initialCount = fcm.messages.length;
  const retrySender = sender();
  assert.equal((await processNotification(db, retrySender, eventKey)).accepted, 206);
  assert.equal(retrySender.messages.length, 1);
  assert.equal(fcm.messages.length, initialCount);
  assert.equal(event(db, eventKey).noTokenUsers, 1);
});

test('permanent failures are retried after token refresh only while the event is still retryable', async () => {
  const db = database(); token(db, 'student-1', 'a'); token(db, 'student-1', 'b');
  const { eventKey } = await enqueueNotification(db, input());
  await assert.rejects(processNotification(db, sender(() => [rejected('messaging/mismatched-credential'), rejected('messaging/server-unavailable')]), eventKey), NotificationRetry);
  token(db, 'student-1', 'a', 'refreshed-valid-token');
  const fcm = sender();
  assert.equal((await processNotification(db, fcm, eventKey)).accepted, 2);
  assert.equal(fcm.messages[0].tokens.length, 2);
});

test('unknown error codes are redacted and payload validation uses bytes, not just characters', async () => {
  assert.throws(() => normalizeNotification(input({ eventId: '漢'.repeat(512), entityId: '漢'.repeat(256), title: '漢'.repeat(120), body: '漢'.repeat(500) })), /large/);
  const db = database(); token(db, 'student-1', 'phone');
  const { eventKey } = await enqueueNotification(db, input());
  await assert.rejects(processNotification(db, sender(() => [rejected('messaging/private-token-marker')]), eventKey), NotificationRetry);
  assert.equal(deliveries(db)[0].errorCode, 'messaging/unknown-error');
  assert.ok(!JSON.stringify(deliveries(db)).includes('private-token-marker'));
});
