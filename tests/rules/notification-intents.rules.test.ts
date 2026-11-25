import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { after, before, beforeEach, test } from 'node:test';
import {
  assertFails, assertSucceeds, initializeTestEnvironment, type RulesTestEnvironment,
} from '@firebase/rules-unit-testing';
import {
  deleteDoc, doc, getDoc, serverTimestamp, setDoc, updateDoc, writeBatch,
} from 'firebase/firestore';

const OPEN_EVENT = 'OpenSessionEvent0001';
const EDIT_EVENT = 'EditScheduleEvent001';
const APPROVE_EVENT = 'ApproveIzinEvent0001';
const REJECT_EVENT = 'RejectIzinEvent00001';
let env: RulesTestEnvironment;

before(async () => {
  env = await initializeTestEnvironment({
    projectId: 'demo-hadirin-notification-intents',
    firestore: {
      host: '127.0.0.1', port: 8080,
      rules: readFileSync(resolve(__dirname, '../../firestore.rules'), 'utf8'),
    },
  });
});
after(async () => env?.cleanup());
beforeEach(async () => {
  await env.clearFirestore();
  await env.withSecurityRulesDisabled(async context => {
    const db = context.firestore();
    const batch = writeBatch(db);
    batch.set(doc(db, 'pengguna/owner'), { peran: 'ASISTEN' });
    batch.set(doc(db, 'pengguna/stranger'), { peran: 'ASISTEN' });
    batch.set(doc(db, 'pengguna/student'), { peran: 'PRAKTIKAN' });
    batch.set(doc(db, 'kelas/class-1'), { asistenUid: 'owner', diarsipkan: false });
    batch.set(doc(db, 'sesi/session-1'), {
      kelasId: 'class-1', judul: 'Praktikum', lokasi: 'Lab 1', waktuMulai: new Date(1000),
      waktuSelesai: null, statusSesi: 'BELUM_DIBUKA', diarsipkan: false,
    });
    for (const id of ['leave-1', 'leave-2']) {
      batch.set(doc(db, 'izin', id), {
        sesiId: 'session-1', kelasId: 'class-1', uid: 'student',
        statusIzin: 'MENUNGGU', diperiksaOleh: null, waktuPeriksa: null,
      });
    }
    await batch.commit();
  });
});

function asUser(uid = 'owner') {
  return env.authenticatedContext(uid).firestore();
}

async function enableEnforcement() {
  await env.withSecurityRulesDisabled(async context => {
    await setDoc(doc(context.firestore(), 'notificationConfig/runtime'), { requireIntent: true });
  });
}

function intent(entityId: string, type: string, overrides = {}) {
  return { entityId, type, createdAt: serverTimestamp(), nextAttemptAt: serverTimestamp(), ...overrides };
}

function commit(db: ReturnType<typeof asUser>, source: string, eventId: string,
  patch: Record<string, unknown>, event: ReturnType<typeof intent>) {
  const batch = writeBatch(db);
  batch.update(doc(db, source), { ...patch, notificationEventId: eventId });
  batch.set(doc(db, 'notificationIntents', eventId), event);
  return batch.commit();
}

test('compatibility permits old writes, strict rollout requires all four linked intents', async () => {
  const db = asUser();
  const sesi = doc(db, 'sesi/session-1');
  await assertSucceeds(updateDoc(sesi, { judul: 'Legacy schedule update' }));
  await enableEnforcement();
  await assertFails(updateDoc(sesi, { statusSesi: 'DIBUKA' }));
  await assertFails(updateDoc(sesi, { judul: 'Unlinked edit' }));
  await assertFails(updateDoc(doc(db, 'izin/leave-1'), {
    statusIzin: 'DISETUJUI', diperiksaOleh: 'owner', waktuPeriksa: serverTimestamp(),
  }));

  await assertSucceeds(commit(db, 'sesi/session-1', OPEN_EVENT,
    { statusSesi: 'DIBUKA' }, intent('session-1', 'SESI_DIBUKA')));
  // A retained pointer cannot authorize a later legacy update.
  await assertFails(updateDoc(sesi, { judul: 'Pointer reuse' }));
  await assertSucceeds(commit(db, 'sesi/session-1', EDIT_EVENT,
    { judul: 'Updated' }, intent('session-1', 'JADWAL_BERUBAH')));
  for (const [id, eventId, status] of [
    ['leave-1', APPROVE_EVENT, 'DISETUJUI'], ['leave-2', REJECT_EVENT, 'DITOLAK'],
  ]) {
    await assertSucceeds(commit(db, `izin/${id}`, eventId, {
      statusIzin: status, diperiksaOleh: 'owner', waktuPeriksa: serverTimestamp(),
    }, intent(id, `IZIN_${status}`)));
  }
  await assertSucceeds(updateDoc(sesi, { statusSesi: 'DITUTUP' }));
  await assertSucceeds(updateDoc(sesi, { diarsipkan: true }));
  await env.withSecurityRulesDisabled(async context => {
    const stored = await getDoc(doc(context.firestore(), 'notificationIntents', OPEN_EVENT));
    assert.ok(stored.get('createdAt').isEqual(stored.get('nextAttemptAt')));
  });
});

test('forged events and unauthorized actors are rejected on both sides of the write', async () => {
  const db = asUser();
  const sesi = 'sesi/session-1';
  const event = intent('session-1', 'SESI_DIBUKA');
  const eventRef = doc(db, 'notificationIntents', OPEN_EVENT);
  const open = { statusSesi: 'DIBUKA' };
  await assertFails(setDoc(eventRef, event));
  await assertFails(updateDoc(doc(db, sesi), { ...open, notificationEventId: OPEN_EVENT }));
  for (const forged of [
    intent('another-session', 'SESI_DIBUKA'), intent('session-1', 'JADWAL_BERUBAH'),
    intent('session-1', 'SESI_DIBUKA', { nextAttemptAt: new Date() }),
    intent('session-1', 'SESI_DIBUKA', { recipientUids: ['student'] }),
    intent('session-1', 'SESI_DIBUKA', { state: 'QUEUED' }),
  ]) {
    await assertFails(commit(db, sesi, OPEN_EVENT, open, forged));
  }
  await assertFails(commit(db, sesi, EDIT_EVENT, { judul: 'Praktikum' },
    intent('session-1', 'JADWAL_BERUBAH')));
  await assertFails(commit(db, 'izin/leave-1', APPROVE_EVENT,
    { statusIzin: 'DISETUJUI', diperiksaOleh: 'owner', waktuPeriksa: serverTimestamp() },
    intent('leave-1', 'IZIN_DITOLAK')));
  await assertFails(commit(asUser('stranger'), sesi, OPEN_EVENT, open, event));
  await assertFails(commit(asUser('student'), sesi, OPEN_EVENT, open, event));
  await assertSucceeds(commit(db, sesi, OPEN_EVENT, open, event));
  await assertFails(commit(db, sesi, OPEN_EVENT, { judul: 'Replay' }, intent('session-1', 'JADWAL_BERUBAH')));
  await assertFails(getDoc(eventRef));
  await assertFails(updateDoc(eventRef, { state: 'COMPLETE' }));
  await assertFails(deleteDoc(eventRef));
  await assertFails(setDoc(doc(db, 'notificationConfig/runtime'), { requireIntent: false }));
});
