import {
  collection, doc, serverTimestamp, type DocumentReference, type Firestore, type Transaction,
} from '@react-native-firebase/firestore';

type NotificationIntentType = 'SESI_DIBUKA' | 'JADWAL_BERUBAH' | 'IZIN_DISETUJUI' | 'IZIN_DITOLAK';

export function buatReferensiNotifikasi(db: Firestore) {
  return doc(collection(db, 'notificationIntents'));
}

export function catatNotifikasi(
  transaction: Transaction,
  ref: DocumentReference,
  entityId: string,
  type: NotificationIntentType,
) {
  transaction.set(ref, {
    entityId,
    type,
    createdAt: serverTimestamp(),
    nextAttemptAt: serverTimestamp(),
  });
  return { notificationEventId: ref.id };
}
