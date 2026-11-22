export type PushType = 'SESI_DIBUKA' | 'JADWAL_BERUBAH' | 'IZIN_DISETUJUI' | 'IZIN_DITOLAK';
export interface PushPayload {
    version: '1'; eventId: string; type: PushType;
    entityId: string; routeKey: 'SESI' | 'IZIN'; recipientUid: string;
}

export function parsePushPayload(data: unknown): PushPayload | null {
    if (!data || typeof data !== 'object') return null;
    const value = data as Record<string, unknown>;
    const types: string[] = ['SESI_DIBUKA', 'JADWAL_BERUBAH', 'IZIN_DISETUJUI', 'IZIN_DITOLAK'];
    const identifier = (v: unknown, max: number): v is string => typeof v === 'string'
        && v.length > 0 && v.length <= max && /^[A-Za-z0-9_-]+$/.test(v);
    if (value.version !== '1' || typeof value.type !== 'string' || !types.includes(value.type)
        || typeof value.eventId !== 'string' || !value.eventId.trim() || value.eventId.length > 512
        || !identifier(value.entityId, 256) || !identifier(value.recipientUid, 128)
        || value.routeKey !== (value.type.startsWith('IZIN_') ? 'IZIN' : 'SESI')) return null;
    // Never retain or navigate to a URL/route supplied by the message.
    return { version: '1', eventId: value.eventId, type: value.type as PushType,
        entityId: value.entityId, routeKey: value.routeKey as 'SESI' | 'IZIN', recipientUid: value.recipientUid };
}

export function pushTitle(type: PushType): string {
    return { SESI_DIBUKA: 'Presensi praktikum dibuka', JADWAL_BERUBAH: 'Jadwal praktikum berubah',
        IZIN_DISETUJUI: 'Pengajuan izin disetujui', IZIN_DITOLAK: 'Pengajuan izin ditolak' }[type];
}

export interface PushAccess {
    read(collection: 'sesi' | 'izin' | 'kelas' | 'keanggotaan', id: string): Promise<Record<string, unknown> | null>;
}

/** Firestore Rules remain authoritative; verify entity ownership again before navigation. */
export async function resolvePushDestination(payload: PushPayload, user: { uid: string; peran: string }, access: PushAccess) {
    if (payload.recipientUid !== user.uid || !['ASISTEN', 'PRAKTIKAN'].includes(user.peran)) return null;
    const entity = await access.read(payload.routeKey === 'IZIN' ? 'izin' : 'sesi', payload.entityId);
    if (!entity || typeof entity.kelasId !== 'string') return null;
    if (payload.routeKey === 'IZIN' && user.peran === 'PRAKTIKAN' && entity.uid === user.uid) {
        return { pathname: '/izin/[id]' as const, params: { id: payload.entityId } };
    }
    const kelas = await access.read('kelas', entity.kelasId);
    if (!kelas || kelas.diarsipkan === true) return null;
    if (user.peran === 'ASISTEN') {
        if (kelas.asistenUid !== user.uid) return null;
    } else {
        if (payload.routeKey === 'IZIN' || entity.diarsipkan === true) return null;
        const member = await access.read('keanggotaan', `${entity.kelasId}_${user.uid}`);
        if (!member || member.status !== 'AKTIF' || member.uid !== user.uid || member.kelasId !== entity.kelasId) return null;
    }
    return { pathname: payload.routeKey === 'IZIN' ? '/izin/[id]' as const : '/sesi/[id]' as const,
        params: { id: payload.entityId } };
}
