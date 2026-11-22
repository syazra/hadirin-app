import { Timestamp, type Firestore } from 'firebase-admin/firestore';
import { HttpsError } from 'firebase-functions/v2/https';

const WINDOW_MS = 60_000;
const CALLER_LIMIT = 5;
const GLOBAL_LIMIT = 60;

/** Atomic fixed-window quotas shared by all instances and both demo roles. */
export async function consumeDemoLoginQuota(db: Firestore, callerKey: string, now = Date.now()) {
  const windowStart = Math.floor(now / WINDOW_MS) * WINDOW_MS;
  const refs = [
    db.collection('_demoLoginLimits').doc('global'),
    db.collection('_demoLoginLimits').doc(callerKey),
  ];
  await db.runTransaction(async (transaction) => {
    const snapshots = await Promise.all(refs.map(ref => transaction.get(ref)));
    const counts = snapshots.map(snapshot => {
      const data = snapshot.data();
      if (data?.windowStart !== windowStart) return 0;
      // Corrupt quota data fails closed rather than resetting the counter.
      return Number.isSafeInteger(data.count) && data.count >= 0 ? data.count : GLOBAL_LIMIT;
    });
    if (counts[0] >= GLOBAL_LIMIT || counts[1] >= CALLER_LIMIT) {
      throw new HttpsError('resource-exhausted', 'Terlalu banyak percobaan demo. Coba lagi nanti.');
    }
    refs.forEach((ref, index) => transaction.set(ref, {
      windowStart,
      count: counts[index] + 1,
      expiresAt: Timestamp.fromMillis(windowStart + WINDOW_MS * 2),
    }));
  });
}
