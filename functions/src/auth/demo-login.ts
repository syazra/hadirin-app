import { getApps, initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import { defineBoolean, defineSecret, defineString } from 'firebase-functions/params';
import { onCall } from 'firebase-functions/v2/https';

import { createDemoLoginHandler } from './demo-login-handler';
import { consumeDemoLoginQuota } from './demo-login-rate-limit';

const enabled = defineBoolean('DEMO_LOGIN_ENABLED', { default: false });
const environment = defineString('DEMO_LOGIN_ENVIRONMENT', { default: 'production' });
const allowedProjectId = defineString('DEMO_LOGIN_PROJECT_ID', { default: '' });
const androidAppId = defineString('DEMO_LOGIN_ANDROID_APP_ID', { default: '' });
const asistenUid = defineString('DEMO_LOGIN_ASISTEN_UID', { default: '' });
const praktikanUid = defineString('DEMO_LOGIN_PRAKTIKAN_UID', { default: '' });
const rateLimitSalt = defineSecret('DEMO_LOGIN_RATE_LIMIT_SALT');

if (!getApps().length) initializeApp();

const handler = createDemoLoginHandler({
  config: () => ({
    enabled: enabled.value(),
    environment: environment.value(),
    projectId: process.env.GCLOUD_PROJECT ?? '',
    allowedProjectId: allowedProjectId.value(),
    appId: androidAppId.value(),
    asistenUid: asistenUid.value(),
    praktikanUid: praktikanUid.value(),
    rateLimitSalt: enabled.value() ? rateLimitSalt.value() : '',
  }),
  consumeQuota: key => consumeDemoLoginQuota(getFirestore(), key),
  getAccount: async uid => {
    const [account, profile] = await Promise.all([
      getAuth().getUser(uid), getFirestore().collection('pengguna').doc(uid).get(),
    ]);
    return {
      uid: account.uid, disabled: account.disabled, email: account.email,
      profile: profile.data() ?? null,
    };
  },
  createCustomToken: uid => getAuth().createCustomToken(uid),
});

export const demoLogin = onCall({
  region: 'asia-southeast2',
  enforceAppCheck: true,
  consumeAppCheckToken: true,
  secrets: [rateLimitSalt],
  maxInstances: 3,
  timeoutSeconds: 15,
}, handler);
