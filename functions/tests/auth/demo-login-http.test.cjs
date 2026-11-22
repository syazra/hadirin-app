const assert = require('node:assert/strict');
const test = require('node:test');
const express = require('express');
const { demoLogin } = require('../../lib/auth/demo-login');

test('exported callable rejects an HTTP request without App Check before issuing a token', async t => {
  const app = express();
  app.use(express.json());
  app.post('/demoLogin', demoLogin);
  const server = app.listen(0, '127.0.0.1');
  await new Promise(resolve => server.once('listening', resolve));
  t.after(() => new Promise(resolve => {
    server.close(resolve);
    server.closeAllConnections();
  }));
  const { port } = server.address();
  const response = await fetch(`http://127.0.0.1:${port}/demoLogin`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ data: { peran: 'ASISTEN' } }),
  });
  assert.equal(response.status, 401);
  const body = await response.json();
  assert.equal(body.error.status, 'UNAUTHENTICATED');
  assert.equal('result' in body, false);
});
