export type PushStatus = 'UNSUPPORTED' | 'DISABLED' | 'REGISTERING' | 'READY' | 'ERROR';
export interface RegistrationAdapter {
    supported: boolean;
    currentUid(): string | null;
    permission(): Promise<boolean>;
    readOwner(): Promise<string | null>;
    saveOwner(uid: string): Promise<void>;
    rotateToken(): Promise<void>;
    token(): Promise<string>;
    installation(): Promise<string>;
    register(uid: string, installation: string, token: string): Promise<void>;
    remove(uid: string, installation: string): Promise<void>;
}

/** Serialize native/token writes, invalidate stale tasks, and rotate on account changes. */
export class NotificationRegistration {
    private uid: string | null = null;
    private epoch = 0;
    private suspendedUid: string | null = null;
    private queue: Promise<unknown> = Promise.resolve();
    private listeners = new Set<() => void>();
    private status: PushStatus;
    constructor(private adapter: RegistrationAdapter) {
        this.status = adapter.supported ? 'DISABLED' : 'UNSUPPORTED';
    }
    getSnapshot = () => this.status;
    subscribe = (listener: () => void) => { this.listeners.add(listener); return () => { this.listeners.delete(listener); }; };
    private publish(status: PushStatus) {
        this.status = status;
        this.listeners.forEach(listener => listener());
    }
    private serial<T>(work: () => Promise<T>): Promise<T> {
        const result = this.queue.then(work);
        this.queue = result.catch(() => undefined);
        return result;
    }
    connect(uid: string | null) {
        if (!uid && this.uid) {
            const cleanup = this.disconnect();
            this.suspendedUid = null;
            return cleanup.catch(() => undefined);
        }
        if (!uid || uid !== this.suspendedUid) this.suspendedUid = null;
        if (uid && uid === this.suspendedUid) return Promise.resolve();
        if (uid !== this.uid) { this.uid = uid; this.epoch++; }
        if (!uid) { this.publish(this.adapter.supported ? 'DISABLED' : 'UNSUPPORTED'); return Promise.resolve(); }
        return this.sync();
    }
    sync(): Promise<void> {
        const { uid, epoch } = this;
        const active = () => !!uid && this.uid === uid && this.epoch === epoch && this.adapter.currentUid() === uid;
        return this.serial(async () => {
            if (!this.adapter.supported || !active()) return;
            try {
                if (!await this.adapter.permission()) {
                    if (active() && await this.adapter.readOwner() === uid) {
                        await this.adapter.saveOwner('');
                        try { await this.adapter.remove(uid!, await this.adapter.installation()); }
                        finally { await this.adapter.rotateToken(); }
                    }
                    if (active()) this.publish('DISABLED');
                    return;
                }
                if (!active()) return;
                this.publish('REGISTERING');
                // Persist the owner only after native token invalidation succeeds.
                if (await this.adapter.readOwner() !== uid) {
                    await this.adapter.rotateToken();
                    if (!active()) return;
                    await this.adapter.saveOwner(uid!);
                }
                const installation = await this.adapter.installation();
                const token = await this.adapter.token();
                if (!active()) return;
                if (!token || token.length < 10 || token.length > 4096 || !installation || installation.length > 128) throw new Error('Invalid registration');
                await this.adapter.register(uid!, installation, token);
                if (active()) this.publish('READY');
            } catch {
                if (active()) this.publish('ERROR');
            }
        });
    }
    /** Called before Auth.signOut while owner-only Rules still permit deletion. */
    disconnect(): Promise<void> {
        const uid = this.uid ?? this.adapter.currentUid();
        this.suspendedUid = uid;
        this.uid = null;
        this.epoch++;
        this.publish(this.adapter.supported ? 'DISABLED' : 'UNSUPPORTED');
        return this.serial(async () => {
            if (!this.adapter.supported) return;
            // Rotate even if registry deletion fails (offline/revoked account).
            await this.adapter.saveOwner('');
            try {
                const installation = await this.adapter.installation();
                if (uid && this.adapter.currentUid() === uid) await this.adapter.remove(uid, installation);
            } finally {
                await this.adapter.rotateToken();
            }
        });
    }
}
