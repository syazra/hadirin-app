import { createHmac } from 'node:crypto';
import { isIP } from 'node:net';
import { HttpsError } from 'firebase-functions/v2/https';

export type DemoRole = 'ASISTEN' | 'PRAKTIKAN';

export interface DemoLoginConfig {
  enabled: boolean;
  environment: string;
  projectId: string;
  allowedProjectId: string;
  appId: string;
  asistenUid: string;
  praktikanUid: string;
  rateLimitSalt: string;
}

export interface DemoLoginRequest {
  data: unknown;
  app?: { appId: string; alreadyConsumed?: boolean };
  rawRequest: { ip?: string };
}

export interface DemoLoginDependencies {
  config: () => DemoLoginConfig;
  consumeQuota: (callerKey: string) => Promise<void>;
  getAccount: (uid: string) => Promise<{
    uid: string; disabled: boolean; email?: string;
    profile: Record<string, unknown> | null;
  }>;
  createCustomToken: (uid: string) => Promise<string>;
}

function validUid(uid: string): boolean {
  return uid.length > 0 && uid.length <= 128 && uid.trim() === uid && !uid.includes('/');
}

export function createDemoLoginHandler(deps: DemoLoginDependencies) {
  return async (request: DemoLoginRequest): Promise<{ customToken: string }> => {
    try {
      const config = deps.config();
      if (!config.enabled || !['demo', 'staging'].includes(config.environment)
        || !config.projectId || config.projectId !== config.allowedProjectId) {
        throw new HttpsError('failed-precondition', 'Demo login tidak diaktifkan untuk project ini.');
      }
      if (!config.appId || !request.app || request.app.appId !== config.appId
        || request.app.alreadyConsumed !== false) {
        throw new HttpsError('unauthenticated', 'Attestation aplikasi baru yang valid diperlukan.');
      }
      const data = request.data;
      if (!data || typeof data !== 'object' || Array.isArray(data)
        || Object.keys(data).length !== 1 || !('peran' in data)
        || (data.peran !== 'ASISTEN' && data.peran !== 'PRAKTIKAN')) {
        throw new HttpsError('invalid-argument', 'Pilih peran demo ASISTEN atau PRAKTIKAN.');
      }
      if (!validUid(config.asistenUid) || !validUid(config.praktikanUid)
        || config.asistenUid === config.praktikanUid || config.rateLimitSalt.length < 32) {
        throw new HttpsError('failed-precondition', 'Konfigurasi akun demo belum lengkap.');
      }
      const ip = request.rawRequest.ip;
      if (!ip || !isIP(ip)) {
        throw new HttpsError('unauthenticated', 'Identitas permintaan tidak dapat diverifikasi.');
      }
      // Only the trusted request IP is used; never a client-supplied ID or forwarded header.
      const callerKey = createHmac('sha256', config.rateLimitSalt)
        .update(`${config.appId}|${ip}`).digest('hex');
      await deps.consumeQuota(callerKey);

      const uid = data.peran === 'ASISTEN' ? config.asistenUid : config.praktikanUid;
      const account = await deps.getAccount(uid);
      const profile = account.profile;
      if (account.uid !== uid || account.disabled || !profile
        || profile.peran !== data.peran || (profile.uid !== undefined && profile.uid !== uid)
        || typeof profile.nama !== 'string' || typeof profile.nim !== 'string'
        || typeof profile.email !== 'string' || !account.email
        || profile.email.toLowerCase() !== account.email.toLowerCase()
        || typeof profile.kodePeserta !== 'string' || !/^[A-Z0-9]{8}$/.test(profile.kodePeserta)) {
        throw new HttpsError('failed-precondition', 'Akun demo belum siap digunakan.');
      }
      // No role claims or client-selected UID are passed to the signer.
      const customToken = await deps.createCustomToken(uid);
      return { customToken };
    } catch (error) {
      if (error instanceof HttpsError) throw error;
      // Never expose Admin/IAM/account errors or credentials to the caller or logs.
      throw new HttpsError('internal', 'Demo login belum dapat diproses. Coba lagi nanti.');
    }
  };
}
