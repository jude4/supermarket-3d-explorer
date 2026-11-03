import {spawn} from 'node:child_process';
import {readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {resolve} from 'node:path';
const root=fileURLToPath(new URL('../',import.meta.url));
let port=process.env.PORT||'3001';try{const match=readFileSync(resolve(root,'server/.env'),'utf8').match(/^PORT=(\d+)$/m);if(!process.env.PORT&&match)port=match[1];}catch{throw new Error('Run npm run setup first, or configure server/.env as documented.');}
const target=`http://127.0.0.1:${port}`;const children=[];let stopping=false;
function stop(code=0){if(stopping)return;stopping=true;for(const child of children)if(child.pid)try{process.kill(-child.pid,'SIGTERM');}catch{}setTimeout(()=>process.exit(code),100).unref();}
function launch(args,cwd,extra={}){const child=spawn(process.execPath,args,{cwd,env:{...process.env,...extra},stdio:'inherit',detached:true});children.push(child);child.on('exit',code=>{if(!stopping)stop(code||0);});return child;}
let existing=false;try{const response=await fetch(target+'/api/health',{signal:AbortSignal.timeout(1200)});const body=await response.json();existing=response.ok&&body.ok===true&&body.database==='postgresql';}catch{}
if(!existing){launch([resolve(root,'server/node_modules/tsx/dist/cli.mjs'),'watch','src/main.ts'],resolve(root,'server'));const until=Date.now()+30000;let ready=false;while(Date.now()<until){try{const response=await fetch(target+'/api/health',{signal:AbortSignal.timeout(1000)});if(response.ok){ready=true;break;}}catch{}await new Promise(r=>setTimeout(r,300));}if(!ready){console.error('The API did not become ready. Check PostgreSQL and server/.env.');stop(1);}}
if(!stopping)launch([resolve(root,'node_modules/vite/bin/vite.js'),'--host','0.0.0.0',...process.argv.slice(2)],root,{API_PROXY_TARGET:target});
process.on('SIGTERM',()=>stop());process.on('SIGINT',()=>stop());
