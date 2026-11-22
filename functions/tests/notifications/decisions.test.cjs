const assert = require('node:assert/strict');
const test = require('node:test');
const { decisionNotification, processIzinDecision } = require('../../lib/notifications/on-izin-decision');
const { hash } = require('../../lib/notifications/notification-contract');
const input = (status = 'DISETUJUI') => ({ eventId: 'firestore-event-1', izinId: 's1_student',
  beforeData: { uid: 'student', sesiId: 's1', kelasId: 'k1', statusIzin: 'MENUNGGU', alasan: 'PRIVATE REASON' },
  afterData: { uid: 'student', sesiId: 's1', kelasId: 'k1', statusIzin: status, alasan: 'PRIVATE REASON' } });
test('both final decisions target applicant only and do not expose reason on lock screen', () => {
  for (const [status, type] of [['DISETUJUI', 'IZIN_DISETUJUI'], ['DITOLAK', 'IZIN_DITOLAK']]) {
    const message = decisionNotification(input(status));
    assert.equal(message.type, type); assert.deepEqual(message.recipientUids, ['student']);
    assert.equal(message.entityId, 's1_student'); assert.ok(!JSON.stringify(message).includes('PRIVATE REASON'));
  }
});
test('reason-only, AI-only, repeated-final and unrelated updates cannot enqueue', () => {
  for (const change of [
    { afterData: { ...input().afterData, statusIzin: 'MENUNGGU', alasan: 'new reason' } },
    { afterData: { ...input().afterData, statusIzin: 'MENUNGGU', kategoriAi: 'SAKIT' } },
    { beforeData: { ...input().beforeData, statusIzin: 'DISETUJUI' } },
    { afterData: { ...input().afterData, uid: 'attacker' } }, { afterData: undefined },
    { beforeData: { ...input().beforeData, uid: 'bad/uid' }, afterData: { ...input().afterData, uid: 'bad/uid' } },
  ]) assert.equal(decisionNotification({ ...input(), ...change }), null);
});
test('durable duplicate short-circuit preserves queued audience; missing/non-practitioner profiles skip', async () => {
  let queued = false, sends = 0, profileReads = 0;
  const db = { collection: name => ({ doc: () => ({ get: async () => {
    if (name === 'notificationEvents') return { exists: queued };
    profileReads++; return { exists: true, get: () => 'PRAKTIKAN' };
  } }) }) };
  const sender = async message => { sends++; queued = true; return { status: 'QUEUED', eventKey: hash(message.eventId) }; };
  assert.equal((await processIzinDecision(db, input(), sender)).status, 'QUEUED');
  assert.equal((await processIzinDecision(db, input(), sender)).status, 'ALREADY_QUEUED');
  assert.equal(sends, 1); assert.equal(profileReads, 1);
  const missing = { collection: () => ({ doc: () => ({ get: async () => ({ exists: false, get: () => 'ASISTEN' }) }) }) };
  assert.equal(await processIzinDecision(missing, input(), sender), null);
});
test('Functions exports all four producers/worker and existing callable handlers', () => {
  const handlers = require('../../lib/index');
  for (const name of ['recordAttendance', 'demoLogin', 'dispatchNotification', 'onSessionOpened', 'onScheduleUpdated', 'onIzinDecision']) {
    assert.equal(typeof handlers[name], 'function', name);
  }
});
