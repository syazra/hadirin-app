import { execFileSync } from 'node:child_process';
import test from 'node:test';

test('Firebase Admin dan konversi kunci JWKS berjalan tanpa require(esm)', () => {
    // Vercel dapat memakai loader CommonJS yang tidak mendukung require(esm),
    // meskipun impor yang sama berhasil di Node 24 lokal dengan pengaturan bawaan.
    execFileSync(process.execPath, [
        '--no-experimental-require-module',
        '--input-type=commonjs',
        '--eval',
        `
        const assert = require('node:assert/strict');
        const { generateKeyPairSync } = require('node:crypto');
        const { initializeApp } = require('firebase-admin/app');
        const { getAuth } = require('firebase-admin/auth');
        require('firebase-admin/firestore');
        const jwksClient = require('jwks-rsa');

        async function periksa() {
            const app = initializeApp({ projectId: 'hadirin-runtime-test' });
            await assert.rejects(getAuth(app).verifyIdToken('token-tidak-valid'), {
                code: 'auth/argument-error',
            });

            const { publicKey } = generateKeyPairSync('rsa', { modulusLength: 2048 });
            const jwk = { ...publicKey.export({ format: 'jwk' }), kid: 'kunci-uji', alg: 'RS256' };
            const client = jwksClient({
                jwksUri: 'https://example.invalid/jwks',
                fetcher: async () => ({ keys: [jwk] }),
            });
            const key = await client.getSigningKey(jwk.kid);
            assert.equal(key.getPublicKey(), publicKey.export({ format: 'pem', type: 'spki' }));
        }

        periksa().catch((error) => {
            console.error(error);
            process.exitCode = 1;
        });
        `,
    ], { cwd: new URL('..', import.meta.url), stdio: 'pipe', timeout: 15_000 });
});
