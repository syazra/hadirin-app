import { cert, getApps, initializeApp } from 'firebase-admin/app';

export function requireEnv(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`Environment ${name} belum dikonfigurasi.`);
  return value;
}

export function firebaseAdminApp(name: string) {
  const projectId = requireEnv('FIREBASE_PROJECT_ID');
  const clientEmail = requireEnv('FIREBASE_CLIENT_EMAIL');
  const privateKey = requireEnv('FIREBASE_PRIVATE_KEY').replace(/\\n/g, '\n');
  return getApps().find(app => app.name === name)
    ?? initializeApp({ projectId, credential: cert({ projectId, clientEmail, privateKey }) }, name);
}
