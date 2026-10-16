import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import crypto from 'node:crypto';
const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'lps-tests-'));
const password = crypto.randomBytes(20).toString('hex');
let server, base, cookie, id;
async function start() {
  server = spawn(process.execPath, ['server.mjs'], { env: { ...process.env, PORT: '0', HOST: '127.0.0.1', DATA_DIR: directory, ADMIN_PASSWORD: password, NODE_ENV: 'test', PUBLIC_ORIGIN: '' }, stdio: ['ignore', 'pipe', 'pipe'] });
  await new Promise((resolve, reject) => { const timeout = setTimeout(() => reject(new Error('Server timeout')), 10000); server.stdout.on('data', chunk => { const match = chunk.toString().match(/http:\/\/127.0.0.1:\d+/); if (match) { base = match[0]; clearTimeout(timeout); resolve(); } }); server.once('error', reject); server.stderr.on('data', chunk => process.stderr.write(chunk)); });
}
const stop = () => new Promise(resolve => { server.once('exit', resolve); server.kill(); });
const api = (route, method = 'GET', data, auth = false, headers = {}) => fetch(base + route, { method, headers: { ...(data !== undefined ? { 'Content-Type': 'application/json' } : {}), ...(auth ? { Cookie: cookie } : {}), ...headers }, body: data !== undefined ? JSON.stringify(data) : undefined });
const valid = () => ({ name: 'Cliente de teste <script>', phone: '(13) 99999-9999', email: 'teste@example.com', date: '2027-12-20', people: 3, profile: 'Família', interests: ['verde', 'centro'], notes: '=HYPERLINK("example.com")', consent: true, requestKey: crypto.randomUUID(), website: '' });
before(start);
after(async () => { await stop(); fs.rmSync(directory, { recursive: true, force: true }); });
test('Site serves local assets and does not expose private files', async () => {
  assert.equal((await api('/')).status, 200);
  for (const url of ['/styles.css', '/app.js', '/assets/dm-serif.ttf', '/assets/sao-paulo.jpg', '/favicon.svg']) assert.equal((await api(url)).status, 200, url);
  for (const url of ['/server.mjs', '/data/admin-key.txt', '/.env', '/..%5cserver.mjs']) assert.ok([403, 404].includes((await api(url)).status), url);
});
test('Unauthenticated requests cannot read or change client information', async () => {
  assert.equal((await api('/api/requests')).status, 401);
  assert.equal((await api('/api/export')).status, 401);
  assert.equal((await api('/api/requests/00000000-0000-0000-0000-000000000000', 'DELETE', {})).status, 401);
});
test('Server validates consent, dates, contact, interests, group and honeypot', async () => {
  for (const change of [{ consent: false }, { phone: '123' }, { date: '2020-01-01' }, { date: '2027-02-30' }, { people: 0 }, { interests: ['invalid'] }, { email: 'invalid' }, { website: 'spam' }]) assert.equal((await api('/api/requests', 'POST', { ...valid(), ...change })).status, 400);
});
let reference;
test('Valid request persists, returns a reference and retries are idempotent', async () => {
  const payload = valid();
  const response = await api('/api/requests', 'POST', payload); assert.equal(response.status, 201);
  reference = (await response.json()).reference; assert.match(reference, /^LPS-/);
  const retry = await api('/api/requests', 'POST', payload); assert.equal(retry.status, 200); assert.equal((await retry.json()).reference, reference);
  const changed = await api('/api/requests', 'POST', { ...payload, name: 'Outro nome' }); assert.equal(changed.status, 409);
  const persisted = JSON.parse(fs.readFileSync(path.join(directory, 'requests.json'), 'utf8')); assert.equal(persisted.length, 1); assert.equal(persisted[0].status, 'Novo'); id = persisted[0].id;
});
test('Authentication creates an HttpOnly, SameSite session', async () => {
  assert.equal((await api('/api/login', 'POST', { password: 'wrong' })).status, 401);
  const response = await api('/api/login', 'POST', { password }); assert.equal(response.status, 200);
  const header = response.headers.get('set-cookie'); assert.match(header, /HttpOnly/); assert.match(header, /SameSite=Strict/); cookie = header.split(';')[0];
  const result = await (await api('/api/requests', 'GET', undefined, true)).json(); assert.equal(result.requests.length, 1);
});
test('Cross-origin changes are blocked and invalid status is rejected', async () => {
  assert.equal((await api(`/api/requests/${id}`, 'PATCH', { status: 'Confirmado' }, true, { Origin: 'https://evil.example' })).status, 403);
  assert.equal((await api(`/api/requests/${id}`, 'PATCH', { status: 'Invalid' }, true)).status, 400);
});
test('Status and notes are saved and CSV escapes formula injection', async () => {
  const response = await api(`/api/requests/${id}`, 'PATCH', { status: 'Proposta enviada', internalNotes: 'Proposta de roteiro enviada.' }, true); assert.equal(response.status, 200);
  const item = (await response.json()).request; assert.equal(item.status, 'Proposta enviada');
  const csv = await (await api('/api/export', 'GET', undefined, true)).text(); assert.ok(csv.includes(reference)); assert.ok(csv.includes("'=HYPERLINK")); assert.ok(csv.includes('Proposta de roteiro enviada.'));
});
test('Requests survive a server restart; sessions require a new login', async () => {
  await stop(); await start();
  assert.equal((await api('/api/requests', 'GET', undefined, true)).status, 401);
  const response = await api('/api/login', 'POST', { password }); cookie = response.headers.get('set-cookie').split(';')[0];
  const result = await (await api('/api/requests', 'GET', undefined, true)).json(); assert.equal(result.requests[0].status, 'Proposta enviada');
});
test('Deletion removes the request and logout revokes access', async () => {
  assert.equal((await api(`/api/requests/${id}`, 'DELETE', {}, true)).status, 200);
  assert.equal(JSON.parse(fs.readFileSync(path.join(directory, 'requests.json'), 'utf8')).length, 0);
  assert.equal((await api('/api/logout', 'POST', {}, true)).status, 200);
  assert.equal((await api('/api/requests', 'GET', undefined, true)).status, 401);
});
