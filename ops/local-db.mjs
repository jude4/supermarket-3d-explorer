import {randomBytes} from 'node:crypto';
import {existsSync,mkdirSync,readFileSync,writeFileSync,chmodSync} from 'node:fs';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {resolve} from 'node:path';
const root=fileURLToPath(new URL('../',import.meta.url));
const local=resolve(root,'.local');mkdirSync(local,{recursive:true,mode:0o700});
const envPath=resolve(local,'postgres.env'),serverEnv=resolve(root,'server/.env');
if(!existsSync(envPath)){const password=randomBytes(32).toString('base64url');writeFileSync(envPath,`POSTGRES_USER=supermarket\nPOSTGRES_DB=supermarket\nPOSTGRES_PASSWORD=${password}\n`,{mode:0o600});}
chmodSync(envPath,0o600);
const config=Object.fromEntries(readFileSync(envPath,'utf8').trim().split('\n').map(l=>{const i=l.indexOf('=');return [l.slice(0,i),l.slice(i+1)];}));
if(!existsSync(serverEnv)){writeFileSync(serverEnv,`DATABASE_URL=postgresql://${config.POSTGRES_USER}:${encodeURIComponent(config.POSTGRES_PASSWORD)}@127.0.0.1:5432/${config.POSTGRES_DB}?schema=public\nPORT=3001\nALLOWED_ORIGINS=http://localhost:5173,http://127.0.0.1:5173,http://localhost:5174,http://127.0.0.1:5174\n`,{mode:0o600});}
const env={...process.env};for(const key of ['DOCKER_HOST','DOCKER_CONTEXT','DOCKER_TLS','DOCKER_TLS_VERIFY','DOCKER_CERT_PATH'])delete env[key];
function docker(args,stdio='pipe'){return spawnSync('docker',['--host=unix:///var/run/docker.sock',...args],{env,encoding:'utf8',stdio});}
const existing=docker(['inspect','--format','{{index .Config.Labels "app"}}','supermarket-explorer-db']);
if(existing.status===0){if(existing.stdout.trim()!=='supermarket-explorer')throw new Error('That container name is already used by another application.');const started=docker(['start','supermarket-explorer-db']);if(started.status)throw new Error(started.stderr);}
else {const result=docker(['run','--name','supermarket-explorer-db','--label','app=supermarket-explorer','--env-file',envPath,'-p','127.0.0.1:5432:5432','-v','supermarket_explorer_pgdata:/var/lib/postgresql/data','-d','postgres:16-alpine']);if(result.status)throw new Error(result.stderr);}
const deadline=Date.now()+60000;let ready=false;
while(Date.now()<deadline){const result=docker(['exec','supermarket-explorer-db','pg_isready','-U',config.POSTGRES_USER,'-d',config.POSTGRES_DB]);if(result.status===0){ready=true;break;}await new Promise(resolve=>setTimeout(resolve,500));}
if(!ready)throw new Error('PostgreSQL did not become ready.');
console.log('PostgreSQL ready on 127.0.0.1:5432. Local credentials are in ignored, permission-restricted configuration files.');
