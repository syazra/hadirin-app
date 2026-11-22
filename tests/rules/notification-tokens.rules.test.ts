import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { before, after, beforeEach, test } from 'node:test';
import { assertFails, assertSucceeds, initializeTestEnvironment, type RulesTestEnvironment } from '@firebase/rules-unit-testing';
import { collection, deleteDoc, doc, getDoc, getDocs, serverTimestamp, setDoc, updateDoc } from 'firebase/firestore';

let env: RulesTestEnvironment;
before(async () => {
  env = await initializeTestEnvironment({ projectId: 'demo-hadirin', firestore: {
    host: '127.0.0.1', port: 8080, rules: readFileSync(resolve(__dirname, '../../firestore.rules'), 'utf8'),
  } });
});
beforeEach(async () => env.clearFirestore());
after(async () => env?.cleanup());

test('owner can register, refresh, list multiple devices, and remove only its device', async () => {
  const db = env.authenticatedContext('student-1').firestore();
  const phone = doc(db, 'pengguna/student-1/perangkat/phone');
  const tablet = doc(db, 'pengguna/student-1/perangkat/tablet');
  await assertSucceeds(setDoc(phone, { fcmToken: 'synthetic-phone-token', platform: 'android', diperbaruiPada: serverTimestamp() }));
  await assertSucceeds(setDoc(tablet, { fcmToken: 'synthetic-tablet-token' }));
  await assertSucceeds(updateDoc(phone, { fcmToken: 'synthetic-refreshed-token', diperbaruiPada: serverTimestamp() }));
  await assertSucceeds(getDoc(phone));
  await assertSucceeds(getDocs(collection(db, 'pengguna/student-1/perangkat')));
  await assertSucceeds(deleteDoc(phone));
  await assertSucceeds(getDoc(tablet));
});

test('unauthenticated and other users cannot read, list, write or delete tokens', async () => {
  await env.withSecurityRulesDisabled(async context => {
    await setDoc(doc(context.firestore(), 'pengguna/student-1/perangkat/phone'), { fcmToken: 'synthetic-private-token' });
  });
  for (const context of [env.unauthenticatedContext(), env.authenticatedContext('other')]) {
    const db = context.firestore();
    const ref = doc(db, 'pengguna/student-1/perangkat/phone');
    await assertFails(getDoc(ref));
    await assertFails(getDocs(collection(db, 'pengguna/student-1/perangkat')));
    await assertFails(setDoc(ref, { fcmToken: 'synthetic-forged-token' }));
    await assertFails(deleteDoc(ref));
  }
});

test('registry schema rejects malformed tokens and extra fields', async () => {
  const db = env.authenticatedContext('student-1').firestore();
  for (const data of [{}, { fcmToken: 42 }, { fcmToken: 'short' }, { fcmToken: 'x'.repeat(4097) },
    { fcmToken: 'synthetic-valid-token', uid: 'other' }, { fcmToken: 'synthetic-valid-token', platform: 42 }]) {
    await assertFails(setDoc(doc(db, 'pengguna/student-1/perangkat/phone'), data));
  }
});

test('notification outbox and delivery ledger are server-only', async () => {
  for (const context of [env.unauthenticatedContext(), env.authenticatedContext('student-1')]) {
    const db = context.firestore();
    for (const path of ['notificationEvents/event-1', 'notificationEvents/event-1/deliveries/device-1']) {
      const ref = doc(db, path);
      await assertFails(getDoc(ref));
      await assertFails(setDoc(ref, { state: 'QUEUED' }));
      await assertFails(deleteDoc(ref));
    }
  }
});
