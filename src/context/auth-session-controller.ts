import type { Hasil, Pengguna } from '@/types';

export interface AuthSessionState {
    pengguna: Pengguna | null;
    loading: boolean;
    profilBelumLengkap: boolean;
    error: string | null;
}

export interface AuthAccount {
    uid: string;
}

export type AuthSessionListener = (akun: AuthAccount | null) => void;
export type AuthSessionErrorListener = (error: unknown) => void;

export interface AuthSessionDependencies {
    tersedia: boolean;
    berlanggananAuth: (
        listener: AuthSessionListener,
        onError: AuthSessionErrorListener,
    ) => () => void;
    ambilUidAktif: () => string | null;
    ambilProfil: (uid: string) => Promise<Hasil<Pengguna>>;
}

type StateListener = (state: AuthSessionState) => void;

export class AuthSessionController {
    private state: AuthSessionState;
    private readonly stateListeners = new Set<StateListener>();
    private unsubscribeAuth: (() => void) | null = null;
    private requestNumber = 0;
    private active = false;

    constructor(private readonly dependencies: AuthSessionDependencies) {
        this.state = {
            pengguna: null,
            loading: dependencies.tersedia,
            profilBelumLengkap: false,
            error: null,
        };
    }

    getSnapshot = (): AuthSessionState => this.state;

    subscribe = (listener: StateListener): (() => void) => {
        this.stateListeners.add(listener);
        return () => this.stateListeners.delete(listener);
    };

    start(): () => void {
        if (!this.dependencies.tersedia) return () => undefined;

        this.active = true;
        this.unsubscribeAuth = this.dependencies.berlanggananAuth(
            (akun) => void this.handleAuthChange(akun),
            (error) => this.handleAuthError(error),
        );

        return () => this.stop();
    }

    stop(): void {
        this.active = false;
        this.requestNumber += 1;
        this.unsubscribeAuth?.();
        this.unsubscribeAuth = null;
    }

    muatUlangProfil = async (): Promise<void> => {
        if (!this.dependencies.tersedia) {
            this.update({ loading: false });
            return;
        }
        if (!this.active) return;

        const requestNumber = ++this.requestNumber;
        this.update({ loading: true, error: null });

        try {
            const uid = this.dependencies.ambilUidAktif();

            if (!uid) {
                this.update({ pengguna: null, profilBelumLengkap: false });
                return;
            }

            const result = await this.dependencies.ambilProfil(uid);
            if (!this.isCurrentRequest(requestNumber)) return;
            this.applyProfileResult(result);
        } catch (error) {
            if (!this.isCurrentRequest(requestNumber)) return;
            this.update({
                pengguna: null,
                profilBelumLengkap: false,
                error: this.errorMessage(error, 'Status akun belum dapat diperiksa.'),
            });
        } finally {
            if (this.isCurrentRequest(requestNumber)) {
                this.update({ loading: false });
            }
        }
    };

    private async handleAuthChange(akun: AuthAccount | null): Promise<void> {
        const requestNumber = ++this.requestNumber;

        if (!akun) {
            this.update({
                pengguna: null,
                profilBelumLengkap: false,
                error: null,
                loading: false,
            });
            return;
        }

        this.update({
            pengguna: null,
            profilBelumLengkap: false,
            error: null,
            loading: true,
        });

        try {
            const result = await this.dependencies.ambilProfil(akun.uid);
            if (!this.isCurrentRequest(requestNumber)) return;
            this.applyProfileResult(result);
        } catch (error) {
            if (!this.isCurrentRequest(requestNumber)) return;
            this.update({
                pengguna: null,
                profilBelumLengkap: false,
                error: this.errorMessage(error, 'Status akun belum dapat diperiksa.'),
            });
        } finally {
            if (this.isCurrentRequest(requestNumber)) {
                this.update({ loading: false });
            }
        }
    }

    private handleAuthError(error: unknown): void {
        this.requestNumber += 1;
        this.update({
            pengguna: null,
            profilBelumLengkap: false,
            error: this.errorMessage(error, 'Status akun belum dapat diperiksa.'),
            loading: false,
        });
    }

    private applyProfileResult(result: Hasil<Pengguna>): void {
        if (result.ok) {
            this.update({
                pengguna: result.data,
                profilBelumLengkap: false,
                error: null,
            });
            return;
        }

        this.update({
            pengguna: null,
            profilBelumLengkap: result.alasan === 'PROFIL_BELUM_LENGKAP',
            error: result.pesan,
        });
    }

    private isCurrentRequest(requestNumber: number): boolean {
        return this.active && requestNumber === this.requestNumber;
    }

    private errorMessage(error: unknown, fallback: string): string {
        return error instanceof Error ? error.message : fallback;
    }

    private update(changes: Partial<AuthSessionState>): void {
        this.state = { ...this.state, ...changes };
        this.stateListeners.forEach((listener) => listener(this.state));
    }
}
