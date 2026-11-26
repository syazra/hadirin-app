const assert = require('node:assert/strict');
const { randomUUID } = require('node:crypto');
const test = require('node:test');
const { deleteApp, initializeApp } = require('firebase-admin/app');
const { getFirestore, Timestamp } = require('firebase-admin/firestore');
const { hash, RETRY_MS } = require('../../lib/notifications/notification-contract');
const { createNotificationRuntime } = require('../../lib/notifications/runtime');
const { notificationJob } = require('../../lib/notifications/send-notification');
const { deliveryId } = require('../../lib/notifications/token-service');

const emulatorRequired = {
  skip: process.env.FIRESTORE_EMULATOR_HOST ? false : 'requires local Firestore Emulator',
};

function testFirestore(t) {
  const projectId = `demo-push-${randomUUID().slice(0, 8)}`;
  const app = initializeApp({ projectId }, projectId);
  t.after(() => deleteApp(app));
  return getFirestore(app);
}

function mockFcm(responseForToken = () => ({ success: true })) {
  const messages = [];
  return {
    messages,
    async sendEachForMulticast(message) {
      messages.push(message);
      const responses = message.tokens.map(responseForToken);
      const successCount = responses.filter(response => response.success).length;
      return { responses, successCount, failureCount: responses.length - successCount };
    },
  };
}

function addIntent(batch, db, eventId, type, entityId, createdAt) {
  batch.create(db.doc(`notificationIntents/${eventId}`), {
    type, entityId, createdAt, nextAttemptAt: createdAt,
  });
}

test('creation handlers fan out all four notification types before any recovery scan', emulatorRequired, async t => {
  const db = testFirestore(t);
  const now = Date.now();
  const createdAt = Timestamp.fromMillis(now - 1000);
  const fcm = mockFcm();
  const runtime = createNotificationRuntime(db, fcm, () => now);
  const batch = db.batch();
  batch.set(db.doc('notificationConfig/runtime'), { deliveryBackend: 'firebase' });
  batch.set(db.doc('kelas/class-1'), { asistenUid: 'owner', diarsipkan: false });
  batch.set(db.doc('sesi/session-1'), { kelasId: 'class-1', diarsipkan: false });
  batch.set(db.doc('izin/leave-1'), { uid: 'student-2' });
  batch.set(db.doc('izin/leave-2'), { uid: 'student-2' });
  batch.set(db.doc('pengguna/student-2'), { peran: 'PRAKTIKAN' });
  for (const uid of ['student-1', 'student-2', 'inactive', 'owner']) {
    const status = uid === 'inactive' ? 'KELUAR' : 'AKTIF';
    batch.set(db.doc(`keanggotaan/class-1_${uid}`), { kelasId: 'class-1', uid, status });
    batch.set(db.doc(`pengguna/${uid}/perangkat/phone`), { fcmToken: `synthetic-token-${uid}` });
  }

  const events = [
    ['OpenSessionEvent0001', 'SESI_DIBUKA', 'session-1'],
    ['EditScheduleEvent001', 'JADWAL_BERUBAH', 'session-1'],
    ['ApproveIzinEvent0001', 'IZIN_DISETUJUI', 'leave-1'],
    ['RejectIzinEvent00001', 'IZIN_DITOLAK', 'leave-2'],
  ];
  for (const [eventId, type, entityId] of events) {
    addIntent(batch, db, eventId, type, entityId, createdAt);
  }
  await batch.commit();

  const [openEventId] = events[0];
  await Promise.all([runtime.queueIntent(openEventId), runtime.queueIntent(openEventId)]);
  await db.doc('keanggotaan/class-1_student-1').update({ status: 'KELUAR' });
  for (const [eventId] of events.slice(1)) {
    await runtime.queueIntent(eventId);
  }

  const jobs = await db.collection('notificationEvents').get();
  assert.equal(jobs.size, 4);
  const openJobKey = hash(`intent:${openEventId}:0`);
  await Promise.all([runtime.deliverEvent(openJobKey), runtime.deliverEvent(openJobKey)]);
  for (const job of jobs.docs) {
    if (job.id !== openJobKey) await runtime.deliverEvent(job.id);
  }
  assert.deepEqual(fcm.messages.map(({ data }) => `${data.type}:${data.recipientUid}`).sort(), [
    'IZIN_DISETUJUI:student-2', 'IZIN_DITOLAK:student-2', 'JADWAL_BERUBAH:student-2',
    'SESI_DIBUKA:student-1', 'SESI_DIBUKA:student-2',
  ]);
  assert.equal((await db.doc(`notificationEvents/${openJobKey}`).get()).get('accepted'), 2);
  await runtime.recover();
  assert.equal(fcm.messages.length, 5);
});

test('recovery honors the rollout gate and resumes legacy work without resending accepted devices', emulatorRequired, async t => {
  const db = testFirestore(t);
  let now = Date.now();
  const old = Timestamp.fromMillis(now - 120_000);
  const fcm = mockFcm(token => token === 'synthetic-pending-token' && fcm.messages.length === 1
    ? { success: false, error: { code: 'messaging/server-unavailable' } }
    : { success: true });
  const runtime = createNotificationRuntime(db, fcm, () => now);
  const config = db.doc('notificationConfig/runtime');
  const intentId = 'RecoverIntentEvent01';
  const uid = 'legacy-student';
  const job = notificationJob({
    eventId: 'intent:LegacyIntentEvent001:0',
    entityId: 'session-1',
    type: 'SESI_DIBUKA',
    routeKey: 'SESI',
    title: 'Presensi dibuka',
    body: 'Buka Hadir.in untuk melihat sesi praktikum.',
    recipientUids: [uid],
  }, old);
  const jobRef = db.doc(`notificationEvents/${job.eventKey}`);
  const acceptedDevice = { uid, installationId: 'phone', token: 'synthetic-accepted-token' };
  const batch = db.batch();
  batch.set(config, { requireIntent: true });
  batch.set(jobRef, { ...job.data, state: 'PROCESSING', attempts: 1, owner: 'old-worker', leaseUntil: old });
  batch.set(jobRef.collection('deliveries').doc(deliveryId(acceptedDevice)), {
    uid, installationId: acceptedDevice.installationId, tokenHash: hash(acceptedDevice.token),
    state: 'ACCEPTED', attempts: 1, errorCode: '', updatedAt: old,
  });
  batch.set(db.doc(`pengguna/${uid}/perangkat/phone`), { fcmToken: acceptedDevice.token });
  batch.set(db.doc(`pengguna/${uid}/perangkat/tablet`), { fcmToken: 'synthetic-pending-token' });
  batch.set(db.doc('izin/leave-1'), { uid: 'applicant' });
  batch.set(db.doc('pengguna/applicant'), { peran: 'PRAKTIKAN' });
  batch.set(db.doc('pengguna/applicant/perangkat/phone'), { fcmToken: 'synthetic-applicant-token' });
  addIntent(batch, db, intentId, 'IZIN_DISETUJUI', 'leave-1', Timestamp.fromMillis(now - 1000));
  await batch.commit();

  await runtime.queueIntent(intentId);
  await runtime.deliverEvent(job.eventKey);
  await runtime.recover();
  assert.equal((await db.doc(`notificationIntents/${intentId}`).get()).get('state'), undefined);
  assert.equal((await jobRef.get()).get('owner'), 'old-worker');
  assert.equal(fcm.messages.length, 0);

  await config.update({ deliveryBackend: 'firebase' });
  await runtime.recover();
  assert.equal((await jobRef.get()).get('state'), 'RETRY');
  assert.equal((await db.doc(`notificationIntents/${intentId}`).get()).get('state'), 'QUEUED');
  assert.deepEqual(fcm.messages.map(message => message.tokens), [
    ['synthetic-pending-token'], ['synthetic-applicant-token'],
  ]);
  await runtime.recover();
  assert.equal(fcm.messages.length, 2);

  now += RETRY_MS;
  await runtime.recover();
  const completed = await jobRef.get();
  assert.equal(completed.get('state'), 'COMPLETE');
  assert.equal(completed.get('attempts'), 3);
  assert.equal(completed.get('accepted'), 2);
  assert.equal(completed.get('nextAttemptAt'), undefined);
  assert.deepEqual(fcm.messages[2].tokens, ['synthetic-pending-token']);
  await runtime.recover();
  assert.equal(fcm.messages.length, 3);
  assert.equal((await config.get()).get('requireIntent'), true);
});
