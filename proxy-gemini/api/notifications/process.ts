import { Receiver } from '@upstash/qstash';
import { getFirestore } from 'firebase-admin/firestore';
import { getMessaging } from 'firebase-admin/messaging';
import { firebaseAdminApp, requireEnv } from '../../firebase-admin-app';
import { runWorker } from '../../notifications/run-worker';

type WorkerSummary = Awaited<ReturnType<typeof runWorker>>;
type Verify = (signature: string, body: string) => Promise<boolean>;

export function createNotificationHandler(verify: Verify, processQueue: () => Promise<WorkerSummary>) {
  return async (request: Request): Promise<Response> => {
    if (request.method !== 'POST') {
      return new Response(null, { status: 405, headers: { Allow: 'POST' } });
    }
    const signature = request.headers.get('Upstash-Signature');
    if (!signature) return new Response(null, { status: 401 });

    try {
      if (!await verify(signature, await request.text())) return new Response(null, { status: 401 });
      const summary = await processQueue();
      console.info('Notification scan completed', summary);
      return new Response(null, { status: 204 });
    } catch {
      console.error('Notification scan failed');
      return new Response(null, { status: 503 });
    }
  };
}

const handler = createNotificationHandler(async (signature, body) => {
  const receiver = new Receiver({
    currentSigningKey: requireEnv('QSTASH_CURRENT_SIGNING_KEY'),
    nextSigningKey: requireEnv('QSTASH_NEXT_SIGNING_KEY'),
  });
  const url = requireEnv('QSTASH_NOTIFICATION_URL');
  return receiver.verify({ signature, body, url }).catch(() => false);
}, () => {
  const app = firebaseAdminApp('hadirin-notification-worker');
  return runWorker(getFirestore(app), getMessaging(app));
});

export default { fetch: handler };
