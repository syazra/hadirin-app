import assert from 'node:assert/strict';
import { createHash, createHmac, randomUUID } from 'node:crypto';
import test from 'node:test';
import { Receiver } from '@upstash/qstash';
import { deleteApp, initializeApp } from 'firebase-admin/app';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';
import type { MulticastMessage } from 'firebase-admin/messaging';
import { createNotificationHandler } from '../api/notifications/process';
import { processIntent } from '../notifications/process-intent';
import { runWorker } from '../notifications/run-worker';

test('QStash authenticates the raw body and canonical destination before running the worker', async () => {
  const url = 'https://example.com/api/notifications/process';
  const currentSigningKey = 'synthetic-current-key';
  const nextSigningKey = 'synthetic-next-key';
  const receiver = new Receiver({ currentSigningKey, nextSigningKey });
  let runs = 0;
  const handler = createNotificationHandler(
    (signature, body) => receiver.verify({ signature, body, url }).catch(() => false),
    async () => {
      runs++;
      return { intents: {}, deliveries: {}, queueAgeMs: 0, accepted: 0, failed: 0, noTokenUsers: 0 };
    },
  );

  function sign(body: string, sub = url, key = nextSigningKey) {
    const header = Buffer.from(JSON.stringify({ alg: 'HS256' })).toString('base64url');
    const payload = Buffer.from(JSON.stringify({
      sub, iss: 'Upstash', exp: Math.floor(Date.now() / 1000) + 60,
      body: createHash('sha256').update(body).digest('base64url'),
    })).toString('base64url');
    const signature = createHmac('sha256', key).update(`${header}.${payload}`).digest('base64url');
    return `${header}.${payload}.${signature}`;
  }
  const post = (signature: string, body = '{}') => new Request(url, {
    method: 'POST', body, headers: { 'Upstash-Signature': signature },
  });

  assert.equal((await handler(new Request(url))).status, 405);
  assert.equal((await handler(new Request(url, { method: 'POST' }))).status, 401);
  assert.equal((await handler(post(sign('{}', url, 'different-key')))).status, 401);
  assert.equal((await handler(post(sign('{}'), 'tampered'))).status, 401);
  assert.equal((await handler(post(sign('{}', 'https://another.example.com/api/notifications/process')))).status, 401);
  assert.equal(runs, 0);
  assert.equal((await handler(post(sign('{}')))).status, 204);
  assert.equal(runs, 1);
});

test('emulator queues each event once, freezes recipients, and dispatches all four types', {
  skip: process.env.FIRESTORE_EMULATOR_HOST ? false : 'requires local Firestore Emulator',
}, async () => {
  const projectId = `demo-push-${randomUUID().slice(0, 8)}`;
  const app = initializeApp({ projectId }, projectId);
  const db = getFirestore(app);
  const now = Date.now();
  const eventIds = ['OpenSessionEvent0001', 'EditScheduleEvent001', 'ApproveIzinEvent0001', 'RejectIzinEvent00001'];
  const createdAt = Timestamp.fromMillis(now - 1000);
  const batch = db.batch();
  batch.set(db.doc('kelas/class-1'), { asistenUid: 'owner', diarsipkan: false });
  batch.set(db.doc('sesi/session-1'), { kelasId: 'class-1', diarsipkan: false });
  batch.set(db.doc('izin/leave-1'), { uid: 'student-2' });
  batch.set(db.doc('izin/leave-2'), { uid: 'student-2' });
  batch.set(db.doc('pengguna/student-2'), { peran: 'PRAKTIKAN' });
  for (const uid of ['student-1', 'student-2', 'inactive', 'owner']) {
    batch.set(db.doc(`keanggotaan/class-1_${uid}`), { kelasId: 'class-1', uid, status: uid === 'inactive' ? 'KELUAR' : 'AKTIF' });
    batch.set(db.doc(`pengguna/${uid}/perangkat/phone`), { fcmToken: `synthetic-token-${uid}` });
  }
  const events = [
    ['SESI_DIBUKA', 'session-1'], ['JADWAL_BERUBAH', 'session-1'],
    ['IZIN_DISETUJUI', 'leave-1'], ['IZIN_DITOLAK', 'leave-2'],
  ];
  for (const [i, [type, entityId]] of events.entries()) {
    batch.set(db.doc(`notificationIntents/${eventIds[i]}`), { type, entityId, createdAt, nextAttemptAt: createdAt });
  }

  try {
    await batch.commit();
    const queued = await Promise.all([
      processIntent(db, eventIds[0], now), processIntent(db, eventIds[0], now),
    ]);
    assert.deepEqual(queued.sort(), ['QUEUED', 'SKIPPED']);
    await db.doc('keanggotaan/class-1_student-1').update({ status: 'KELUAR' });

    const sent: MulticastMessage[] = [];
    const sender = {
      async sendEachForMulticast(message: MulticastMessage) {
        sent.push(message);
        return { responses: [{ success: true }], successCount: 1, failureCount: 0 };
      },
    };
    const summary = await runWorker(db, sender);
    assert.equal(summary.accepted, 5);
    assert.equal(summary.deliveries.COMPLETE, 4);
    assert.equal((await db.collection('notificationEvents').get()).size, 4);
    assert.deepEqual(sent.map(({ data }) => `${data?.type}:${data?.recipientUid}`).sort(), [
      'IZIN_DISETUJUI:student-2', 'IZIN_DITOLAK:student-2', 'JADWAL_BERUBAH:student-2',
      'SESI_DIBUKA:student-1', 'SESI_DIBUKA:student-2',
    ]);
    assert.equal((await runWorker(db, sender)).accepted, 0);
    assert.equal(sent.length, 5);
  } finally {
    await deleteApp(app);
  }
});
