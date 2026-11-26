import { randomUUID } from 'node:crypto';
import { FieldValue, Timestamp, type Firestore } from 'firebase-admin/firestore';
import type { BatchResponse, MulticastMessage, SendResponse } from 'firebase-admin/messaging';
import { EVENT_COLLECTION, hash, LEASE_MS, MAX_ATTEMPTS, normalizeNotification, notificationData, RETRY_MS } from './notification-contract.js';
import { deliveryId, getUserDevices, invalidToken, transientFailure, type NotificationDevice } from './token-service.js';

export interface NotificationSender {
  sendEachForMulticast(message: MulticastMessage): Promise<BatchResponse>;
}
export class NotificationRetry extends Error {
  constructor() { super('Notification processing requires retry'); }
}
const terminal = new Set(['COMPLETE', 'EXHAUSTED', 'INVALID']);

/** A leased, resumable worker. Ledger state means accepted by FCM, not read by a device. */
export async function processNotification(db: Firestore, sender: NotificationSender, eventKey: string,
  now: () => number = Date.now, deadline = now() + 45_000): Promise<{
    state: string; accepted?: number; failed?: number; noTokenUsers?: number;
  }> {
  const ref = db.collection(EVENT_COLLECTION).doc(eventKey);
  const owner = randomUUID();
  const record = await db.runTransaction(async tx => {
    const snapshot = await tx.get(ref);
    if (!snapshot.exists || terminal.has(snapshot.get('state'))) return { state: 'SKIPPED' } as const;
    if ((snapshot.get('leaseUntil')?.toMillis?.() ?? 0) > now()) throw new NotificationRetry();
    if ((snapshot.get('nextAttemptAt')?.toMillis?.() ?? Infinity) > now()) return { state: 'SKIPPED' } as const;
    if ((snapshot.get('attempts') ?? 0) >= MAX_ATTEMPTS) {
      tx.update(ref, { state: 'EXHAUSTED', leaseUntil: Timestamp.fromMillis(0),
        nextAttemptAt: FieldValue.delete(), updatedAt: Timestamp.fromMillis(now()) });
      return { state: 'EXHAUSTED' } as const;
    }
    const leaseUntil = Timestamp.fromMillis(now() + LEASE_MS);
    tx.update(ref, { state: 'PROCESSING', owner, attempts: (snapshot.get('attempts') ?? 0) + 1,
      leaseUntil, nextAttemptAt: leaseUntil });
    return { state: 'PROCESSING', input: snapshot.get('input') } as const;
  });
  if (record.state !== 'PROCESSING') return { state: record.state };

  const finish = async (state: string, summary: Record<string, number> = {}) => {
    await db.runTransaction(async tx => {
      const snap = await tx.get(ref);
      if (snap.get('owner') !== owner) throw new NotificationRetry();
      tx.update(ref, { state, ...summary, leaseUntil: Timestamp.fromMillis(0), updatedAt: Timestamp.fromMillis(now()),
        nextAttemptAt: state === 'RETRY' ? Timestamp.fromMillis(now() + RETRY_MS) : FieldValue.delete() });
    });
  };
  let input;
  try {
    input = normalizeNotification(record.input);
    if (hash(input.eventId) !== eventKey) throw new Error('Invalid event key');
  } catch {
    await finish('INVALID');
    return { state: 'INVALID' };
  }

  try {
    let retry = false;
    for (const uid of input.recipientUids) {
      // Yield with a committed ledger before the function's 60-second timeout.
      if (now() >= deadline) { retry = true; break; }
      const recipientRef = ref.collection('recipients').doc(hash(uid));
      if ((await recipientRef.get()).get('state') === 'COMPLETE') continue;
      const devices = await getUserDevices(db, uid);
      let recipientRetry = false;
      let recipientFinished = true;
      for (let offset = 0; offset < devices.length; offset += 100) {
        if (now() >= deadline) { retry = true; recipientFinished = false; break; }
        const chunk = devices.slice(offset, offset + 100);
        const pending: NotificationDevice[] = [];
        const ledgers = await db.getAll(...chunk.map(device => ref.collection('deliveries').doc(deliveryId(device))));
        for (let n = 0; n < chunk.length; n++) {
          const device = chunk[n];
          const ledger = ledgers[n];
          if (ledger.get('state') === 'ACCEPTED') continue;
          if (ledger.get('state') === 'FAILED' && ledger.get('tokenHash') === hash(device.token)) continue;
          pending.push(device);
        }
        if (!pending.length) continue;

        // Recheck the lease before handing messages to the external provider.
        const lease = await ref.get();
        if (lease.get('owner') !== owner || lease.get('leaseUntil').toMillis() <= now()) throw new NotificationRetry();
        let responses: SendResponse[];
        try {
          responses = (await sender.sendEachForMulticast({
            tokens: pending.map(d => d.token),
            notification: { title: input.title, body: input.body },
            data: { ...notificationData(input), recipientUid: uid },
            android: { priority: 'high', notification: { tag: eventKey, icon: 'notification_icon' } },
          })).responses;
          if (responses.length !== pending.length) throw new Error('Incomplete FCM response');
        } catch (error) {
          const batchCode = errorCode(error);
          const code = invalidToken(batchCode) ? 'messaging/invalid-argument' : batchCode;
          // A batch-level error does not establish that any individual token is invalid.
          responses = pending.map(() => ({ success: false, error: { code } } as SendResponse));
        }

        for (let group = 0; group < pending.length; group += 10) {
          await Promise.all(pending.slice(group, group + 10).map(async (device, index) => {
            const response = responses[group + index];
            const code = response.success ? '' : errorCode(response.error);
            const state = response.success ? 'ACCEPTED' : transientFailure(code) ? 'RETRY' : 'FAILED';
            if (state === 'RETRY') { retry = true; recipientRetry = true; }
            const ledgerRef = ref.collection('deliveries').doc(deliveryId(device));
            const tokenRef = db.collection('pengguna').doc(device.uid).collection('perangkat').doc(device.installationId);
            await db.runTransaction(async tx => {
              const [event, previous, token] = await Promise.all([tx.get(ref), tx.get(ledgerRef), tx.get(tokenRef)]);
              if (event.get('owner') !== owner) throw new NotificationRetry();
              // Do not delete a token that refreshed during an FCM request.
              if (invalidToken(code) && token.get('fcmToken') === device.token) tx.delete(tokenRef);
              tx.set(ledgerRef, { uid: device.uid, installationId: device.installationId,
                tokenHash: hash(device.token), state, attempts: (previous.get('attempts') ?? 0) + 1,
                errorCode: code, updatedAt: Timestamp.fromMillis(now()) });
            });
          }));
        }
      }
      if (recipientFinished && !recipientRetry) {
        await db.runTransaction(async tx => {
          const snapshot = await tx.get(ref);
          if (snapshot.get('owner') !== owner) throw new NotificationRetry();
          tx.set(recipientRef, { uid, state: 'COMPLETE', noTokens: devices.length === 0 });
        });
      }
    }
    const recipients = await ref.collection('recipients').get();
    const noTokenUsers = recipients.docs.filter(doc => doc.get('noTokens') === true).length;
    const deliveries = await ref.collection('deliveries').get();
    const accepted = deliveries.docs.filter(d => d.get('state') === 'ACCEPTED').length;
    const failed = deliveries.docs.filter(d => d.get('state') === 'FAILED').length;
    await finish(retry ? 'RETRY' : 'COMPLETE', { accepted, failed, noTokenUsers });
    if (retry) throw new NotificationRetry();
    return { state: 'COMPLETE', accepted, failed, noTokenUsers };
  } catch (error) {
    if (!(error instanceof NotificationRetry)) await finish('RETRY');
    // Never propagate raw Firebase/FCM errors containing tokens/payloads to platform logs.
    throw new NotificationRetry();
  }
}

function errorCode(error: unknown): string {
  const code = error && typeof error === 'object' && 'code' in error ? error.code : null;
  // Only known, safe codes are persisted. Unknown errors retry within the event budget.
  return typeof code === 'string' && (transientFailure(code) || invalidToken(code)
    || ['messaging/invalid-argument', 'messaging/invalid-payload', 'messaging/invalid-options',
      'messaging/payload-size-limit-exceeded', 'messaging/invalid-data-payload-key',
      'messaging/authentication-error', 'messaging/mismatched-credential',
      'messaging/third-party-auth-error', 'messaging/invalid-package-name', 'app/invalid-credential'].includes(code))
    ? code : 'messaging/unknown-error';
}
