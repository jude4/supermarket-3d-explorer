/** Runs the built image against the isolated local test DB; never resets stock. */
import assert from 'node:assert/strict';
import {readFileSync, writeFileSync, unlinkSync} from 'node:fs';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const dockerEnv = {...process.env};
for (const key of ['DOCKER_HOST', 'DOCKER_CONTEXT', 'DOCKER_TLS', 'DOCKER_TLS_VERIFY', 'DOCKER_CERT_PATH']) delete dockerEnv[key];
function docker(args) {
  const result = spawnSync('docker', ['--host=unix:///var/run/docker.sock', ...args], {cwd:root, env:dockerEnv, encoding:'utf8'});
  if (result.status !== 0) throw new Error('Container smoke command failed. Inspect the task-owned image/container separately.');
  return result.stdout.trim();
}
const values = Object.fromEntries(readFileSync(new URL('../.local/test-server.env', import.meta.url), 'utf8').trim().split('\n').map(line => {
  const index = line.indexOf('='); return [line.slice(0,index), line.slice(index+1)];
}));
const database = new URL(values.DATABASE_URL);
assert.equal(database.pathname, '/supermarket_test');
assert.ok(['localhost','127.0.0.1'].includes(database.hostname));
database.hostname = docker(['inspect','--format','{{.NetworkSettings.Networks.bridge.IPAddress}}','supermarket-explorer-db']);
assert.match(database.hostname, /^\d+\.\d+\.\d+\.\d+$/);
const file = fileURLToPath(new URL('../.local/image-check.env', import.meta.url));
writeFileSync(file, `DATABASE_URL=${database}\nNODE_ENV=production\nPORT=3001\nALLOWED_ORIGINS=http://127.0.0.1:3003\n`, {mode:0o600});
let container;
try {
  container = docker(['run','--rm','-d','--env-file',file,'-p','127.0.0.1:3003:3001','supermarket-explorer:inventory']);
  const base = 'http://127.0.0.1:3003';
  const deadline = Date.now()+45000;
  let healthy = false;
  while (Date.now()<deadline) {
    try {
      const response = await fetch(base+'/api/health', {signal:AbortSignal.timeout(1500)});
      if (response.ok && (await response.json()).database === 'postgresql') {healthy=true; break;}
    } catch {}
    await new Promise(resolve => setTimeout(resolve,300));
  }
  assert.ok(healthy, 'Image must migrate, seed and start successfully.');
  for (const path of ['/', '/admin', '/models/empty-gondola.glb', '/audio/door-slide.wav']) assert.equal((await fetch(base+path)).status,200,path);
  assert.equal((await fetch(base+'/api/unknown-image-check')).status,404);
  const catalogue = await (await fetch(base+'/api/catalogue')).json();
  assert.equal(catalogue.departments.length,8);
  assert.ok(catalogue.variants.length>=328);
  const guest = await fetch(base+'/api/auth/guest', {method:'POST', headers:{Origin:base,'Content-Type':'application/json'}, body:'{}'});
  assert.ok(guest.ok);
  const cookie = guest.headers.get('set-cookie');
  assert.ok(cookie && /HttpOnly/i.test(cookie) && /Secure/i.test(cookie), 'Production session must use Secure HttpOnly cookies.');
  const cart = await fetch(base+'/api/cart', {headers:{Cookie:cookie.split(';')[0]}});
  assert.equal(cart.status,200);
  console.log('PASS: production image migrates/seeds without reset, serves customer/admin/assets/API, and authenticates a database-backed guest with Secure HttpOnly cookies.');
} finally {
  if (container) docker(['stop',container]);
  unlinkSync(file);
}
