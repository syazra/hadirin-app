const assert = require('node:assert/strict');
const test = require('node:test');
const { hash } = require('../../lib/notifications/notification-contract');
const shared = require('../../lib/notifications/send-notification');
const { prosesNotifikasiSesiDibuka } = require('../../lib/notifications/on-session-opened');
const { prosesNotifikasiJadwalDiperbarui } = require('../../lib/notifications/on-schedule-updated');
function fixture() {
  const events = new Map();
  const f = { events, members: ['student', 'student', 'assistant'], reads: 0, writes: [] };
  f.db = { collection: name => {
    if (name === 'notificationEvents') return { doc: key => ({ get: async () => ({ exists: events.has(key) }) }) };
    if (name === 'kelas') return { doc: () => ({ get: async () => ({ exists: true,
      data: () => ({ asistenUid: 'assistant', diarsipkan: false }) }) }) };
    if (name === 'keanggotaan') {
      const query = { where: () => query, get: async () => {
        f.reads++; return { docs: f.members.map(uid => ({ data: () => ({ uid, status: 'AKTIF' }) })) };
      } }; return query;
    }
    throw new Error(`Unexpected collection ${name}`);
  } };
  return f;
}
test('session/schedule default adapters enqueue canonical safe payloads and freeze retries', async t => {
  const previous = shared.sendToUsers;
  t.after(() => { shared.sendToUsers = previous; });
  for (const kind of ['session', 'schedule']) {
    const f = fixture();
    shared.sendToUsers = async message => {
      f.writes.push(message); f.events.set(hash(message.eventId), message);
      return { status: 'QUEUED', eventKey: hash(message.eventId) };
    };
    const input = { eventId: 'source-1', sesiId: 's1',
      beforeData: { kelasId: 'k1', statusSesi: 'BELUM_DIBUKA', judul: 'OLD PRIVATE TITLE' },
      afterData: { kelasId: 'k1', statusSesi: 'DIBUKA', judul: 'NEW PRIVATE TITLE' } };
    const process = kind === 'session' ? prosesNotifikasiSesiDibuka : prosesNotifikasiJadwalDiperbarui;
    const first = await process(f.db, input);
    assert.equal(first.status, 'QUEUED'); assert.equal(first.dikirim, true);
    assert.equal(f.writes[0].type, kind === 'session' ? 'SESI_DIBUKA' : 'JADWAL_BERUBAH');
    assert.deepEqual(f.writes[0].recipientUids, ['student']);
    assert.equal(f.writes[0].routeKey, 'SESI'); assert.equal(f.writes[0].entityId, 's1');
    assert.ok(!JSON.stringify(f.writes[0]).includes('PRIVATE TITLE')); assert.equal(f.writes[0].data, undefined);
    f.members = ['different-student'];
    const duplicate = await process(f.db, input);
    assert.equal(duplicate.status, 'ALREADY_QUEUED'); assert.equal(duplicate.dikirim, false);
    assert.equal(f.reads, 1); assert.equal(f.writes.length, 1);
    // A later reopen/edit of the same entity is a distinct source event.
    await process(f.db, { ...input, eventId: 'source-2' }); assert.equal(f.writes.length, 2);
  }
});
