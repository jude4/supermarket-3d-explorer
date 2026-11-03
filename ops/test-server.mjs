import {readFileSync} from 'node:fs';
import {spawn} from 'node:child_process';
const env={...process.env};for(const line of readFileSync(new URL('../.local/test-server.env',import.meta.url),'utf8').trim().split('\n')){const i=line.indexOf('=');if(i>0)env[line.slice(0,i)]=line.slice(i+1);}
const url=new URL(env.DATABASE_URL);if(url.pathname!=='/supermarket_test'||!['127.0.0.1','localhost'].includes(url.hostname))throw new Error('Refusing to run stock tests on a non-disposable database.');
const child=spawn(process.execPath,['dist/main.js'],{cwd:new URL('../server/',import.meta.url),env,stdio:'inherit'});for(const signal of ['SIGTERM','SIGINT'])process.on(signal,()=>child.kill(signal));child.on('exit',code=>process.exit(code||0));
