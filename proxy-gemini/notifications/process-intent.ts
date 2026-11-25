import { FieldValue, Timestamp, type Firestore, type Transaction } from 'firebase-admin/firestore';
import {
  EVENT_COLLECTION, INTENT_COLLECTION, MAX_ATTEMPTS, NOTIFICATION_TYPES, RETRY_MS,
  identifier, type NotificationType,
} from './notification-contract.js';
import { notificationJob } from './send-notification.js';

const RECIPIENTS_PER_JOB = 30;
const messages = {
  SESI_DIBUKA: ['Presensi dibuka', 'Buka Hadir.in untuk melihat sesi praktikum.'],
  JADWAL_BERUBAH: ['Jadwal praktikum diperbarui', 'Buka Hadir.in untuk melihat jadwal terbaru.'],
  IZIN_DISETUJUI: ['Pengajuan izin disetujui', 'Buka Hadir.in untuk melihat hasil pengajuan izin Anda.'],
  IZIN_DITOLAK: ['Pengajuan izin ditolak', 'Buka Hadir.in untuk melihat hasil pengajuan izin Anda.'],
} as const satisfies Record<NotificationType, readonly [string, string]>;

async function recipientsForEvent(tx: Transaction, db: Firestore, entityId: string, isIzin: boolean) {
  const source = await tx.get(db.collection(isIzin ? 'izin' : 'sesi').doc(entityId));
  if (!source.exists) return [];
  if (isIzin) {
    const uid: unknown = source.get('uid');
    if (!identifier(uid, 128)) return [];
    const profile = await tx.get(db.collection('pengguna').doc(uid));
    return profile.get('peran') === 'PRAKTIKAN' ? [uid] : [];
  }

  const classId: unknown = source.get('kelasId');
  if (!identifier(classId, 256) || source.get('diarsipkan') === true) return [];
  const kelas = await tx.get(db.collection('kelas').doc(classId));
  if (!kelas.exists || kelas.get('diarsipkan') === true) return [];
  const members = await tx.get(db.collection('keanggotaan')
    .where('kelasId', '==', classId).where('status', '==', 'AKTIF'));
  const uids = new Set<string>();
  for (const member of members.docs) {
    const uid: unknown = member.get('uid');
    if (identifier(uid, 128) && uid !== kelas.get('asistenUid')) uids.add(uid);
  }
  return [...uids].sort();
}

function isDue(value: unknown, now: number) {
  return value instanceof Timestamp && value.toMillis() <= now;
}

export async function processIntent(db: Firestore, eventId: string, now: number) {
  const ref = db.collection(INTENT_COLLECTION).doc(eventId);
  return db.runTransaction(async tx => {
    const intent = await tx.get(ref);
    if (!isDue(intent.get('nextAttemptAt'), now)) return 'SKIPPED';

    const type = intent.get('type') as NotificationType;
    const entityId: unknown = intent.get('entityId');
    const createdAt: unknown = intent.get('createdAt');
    const completed = { nextAttemptAt: FieldValue.delete(), updatedAt: Timestamp.fromMillis(now) };
    if (!/^[A-Za-z0-9]{20}$/.test(eventId) || !NOTIFICATION_TYPES.includes(type)
      || !identifier(entityId, 256) || !(createdAt instanceof Timestamp)) {
      tx.update(ref, { ...completed, state: 'INVALID' });
      return 'INVALID';
    }

    const isIzin = type.startsWith('IZIN_');
    const recipients = await recipientsForEvent(tx, db, entityId, isIzin);
    const [title, body] = messages[type];
    for (let offset = 0; offset < recipients.length; offset += RECIPIENTS_PER_JOB) {
      const job = notificationJob({
        eventId: `intent:${eventId}:${offset / RECIPIENTS_PER_JOB}`,
        entityId, type, title, body, routeKey: isIzin ? 'IZIN' : 'SESI',
        recipientUids: recipients.slice(offset, offset + RECIPIENTS_PER_JOB),
      }, createdAt);
      tx.create(db.collection(EVENT_COLLECTION).doc(job.eventKey), job.data);
    }
    const state = recipients.length ? 'QUEUED' : 'NO_RECIPIENTS';
    tx.update(ref, { ...completed, state, recipientCount: recipients.length });
    return state;
  });
}

export async function rescheduleIntent(db: Firestore, eventId: string, now: number) {
  const ref = db.collection(INTENT_COLLECTION).doc(eventId);
  return db.runTransaction(async tx => {
    const intent = await tx.get(ref);
    if (!isDue(intent.get('nextAttemptAt'), now)) return 'SKIPPED';
    const attempts = (intent.get('attempts') ?? 0) + 1;
    const state = attempts < MAX_ATTEMPTS ? 'RETRY' : 'EXHAUSTED';
    tx.update(ref, {
      state, attempts, updatedAt: Timestamp.fromMillis(now),
      nextAttemptAt: state === 'RETRY' ? Timestamp.fromMillis(now + RETRY_MS) : FieldValue.delete(),
    });
    return state;
  });
}
