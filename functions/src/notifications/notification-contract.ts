import { createHash } from 'node:crypto';

export type NotificationType = 'SESI_DIBUKA' | 'JADWAL_BERUBAH' | 'IZIN_DISETUJUI' | 'IZIN_DITOLAK';
export interface NotificationInput {
  eventId: string;
  type: NotificationType;
  entityId: string;
  routeKey: 'SESI' | 'IZIN';
  recipientUids: string[];
  title: string;
  body: string;
}
export const EVENT_COLLECTION = 'notificationEvents';
export const MAX_ATTEMPTS = 5;
export const LEASE_MS = 120_000;
export const hash = (value: string) => createHash('sha256').update(value).digest('hex');

function text(value: unknown, max: number): value is string {
  return typeof value === 'string' && value.trim().length > 0 && value.length <= max;
}
function identifier(value: unknown, max: number): value is string {
  return text(value, max) && value.trim() === value && !value.includes('/') && value !== '.' && value !== '..';
}
export function normalizeNotification(value: NotificationInput): NotificationInput {
  const types = ['SESI_DIBUKA', 'JADWAL_BERUBAH', 'IZIN_DISETUJUI', 'IZIN_DITOLAK'];
  if (!value || !text(value.eventId, 512) || !types.includes(value.type)
    || !identifier(value.entityId, 256)
    || value.routeKey !== (value.type.startsWith('IZIN_') ? 'IZIN' : 'SESI')
    || !text(value.title, 120) || !text(value.body, 500)
    || !Array.isArray(value.recipientUids) || value.recipientUids.length > 500
    || value.recipientUids.some(uid => !identifier(uid, 128))) {
    throw new Error('Invalid notification contract');
  }
  const input: NotificationInput = {
    eventId: value.eventId, type: value.type, entityId: value.entityId,
    routeKey: value.routeKey, title: value.title, body: value.body,
    recipientUids: [...new Set(value.recipientUids)].sort(),
  };
  if (Buffer.byteLength(JSON.stringify({ notification: { title: input.title, body: input.body },
    data: notificationData(input) }), 'utf8') > 3500) throw new Error('Notification payload too large');
  return input;
}

export function notificationData(input: NotificationInput): Record<string, string> {
  return { version: '1', eventId: input.eventId, type: input.type, entityId: input.entityId, routeKey: input.routeKey };
}
