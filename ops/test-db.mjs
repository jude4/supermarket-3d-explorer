/** Creates ONLY the task's disposable test database; never drops or rewrites the working store. */
import {readFileSync,writeFileSync} from 'node:fs';
import {spawnSync} from 'node:child_process';
const env={...process.env};for(const name of ['DOCKER_HOST','DOCKER_CONTEXT','DOCKER_TLS','DOCKER_TLS_VERIFY','DOCKER_CERT_PATH'])delete env[name];
const probe=spawnSync('docker',['--host=unix:///var/run/docker.sock','exec','supermarket-explorer-db','psql','-U','supermarket','-d','postgres','-Atc',"SELECT 1 FROM pg_database WHERE datname = 'supermarket_test'"],{env,encoding:'utf8'});
if(probe.status)throw new Error('Task-owned local PostgreSQL is not ready. Run node ops/local-db.mjs.');
if(probe.stdout.trim()!=='1'){const created=spawnSync('docker',['--host=unix:///var/run/docker.sock','exec','supermarket-explorer-db','createdb','-U','supermarket','supermarket_test'],{env,encoding:'utf8'});if(created.status)throw new Error('Could not create local test database.');}
const lines=Object.fromEntries(readFileSync(new URL('../server/.env',import.meta.url),'utf8').trim().split('\n').filter(l=>l.includes('=')).map(l=>[l.slice(0,l.indexOf('=')),l.slice(l.indexOf('=')+1)]));
const url=new URL(lines.DATABASE_URL);if(!['127.0.0.1','localhost'].includes(url.hostname))throw new Error('Test runner refuses non-local database credentials.');url.pathname='/supermarket_test';
const testEnv={...process.env,DATABASE_URL:url.toString(),PORT:'3002',ALLOWED_ORIGINS:'http://127.0.0.1:5175,http://localhost:5175,http://127.0.0.1:5173,http://localhost:5173,http://127.0.0.1:5174,http://localhost:5174,http://127.0.0.1:3002,http://localhost:3002'};
writeFileSync(new URL('../.local/test-server.env',import.meta.url),`DATABASE_URL=${url}\nPORT=3002\nALLOWED_ORIGINS=${testEnv.ALLOWED_ORIGINS}\n`,{mode:0o600});
for(const command of ['db:migrate','db:seed']){const result=spawnSync('npm',['run',command],{cwd:new URL('../server/',import.meta.url),env:testEnv,stdio:'inherit'});if(result.status)process.exit(result.status||1);}
console.log('Disposable local test database supermarket_test is ready. Working supermarket database unchanged.');
