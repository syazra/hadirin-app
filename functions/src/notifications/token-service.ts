import type { Firestore } from 'firebase-admin/firestore';
import { hash } from './notification-contract.js';

export interface NotificationDevice {
  uid: string;
  installationId: string;
  token: string;
}
export const deliveryId = (device: NotificationDevice) => hash(JSON.stringify([device.uid, device.installationId]));

export async function getUserDevices(db: Firestore, uid: string): Promise<NotificationDevice[]> {
  const snapshot = await db.collection('pengguna').doc(uid).collection('perangkat').get();
  return snapshot.docs.flatMap(doc => {
    const token = doc.get('fcmToken');
    return typeof token === 'string' && token.length >= 10 && token.length <= 4096
      ? [{ uid, installationId: doc.id, token }] : [];
  });
}

/** Only definitive token errors are pruned, never a generic invalid message payload. */
export function invalidToken(code: string): boolean {
  return code === 'messaging/registration-token-not-registered' || code === 'messaging/invalid-registration-token';
}
export function transientFailure(code: string): boolean {
  return ['messaging/internal-error', 'messaging/server-unavailable', 'messaging/unknown-error',
    'messaging/quota-exceeded', 'messaging/message-rate-exceeded',
    'messaging/device-message-rate-exceeded', 'app/network-error', 'app/network-timeout'].includes(code);
}
