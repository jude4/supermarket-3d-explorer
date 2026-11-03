import {readFileSync} from 'node:fs';
import {spawnSync} from 'node:child_process';
const env={...process.env};for(const line of readFileSync(new URL('../.local/test-server.env',import.meta.url),'utf8').trim().split('\n')){const i=line.indexOf('=');if(i>0)env[line.slice(0,i)]=line.slice(i+1);}
const url=new URL(env.DATABASE_URL);if(url.pathname!=='/supermarket_test'||!['localhost','127.0.0.1'].includes(url.hostname))throw new Error('Tests require the isolated supermarket_test database.');env.TEST_API_URL='http://127.0.0.1:3002/api';
const result=spawnSync(process.execPath,['--import','tsx','--test','test/integration.test.ts'],{cwd:new URL('../server/',import.meta.url),env,stdio:'inherit'});process.exit(result.status||0);
