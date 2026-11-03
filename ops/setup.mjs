import {spawnSync} from 'node:child_process';
import {readFileSync} from 'node:fs';
const root=new URL('../',import.meta.url);
function run(command,args,cwd=root){const child=spawnSync(command,args,{cwd,stdio:'inherit',env:process.env});if(child.status)process.exit(child.status||1);}
run(process.execPath,['ops/local-db.mjs']);
const urlLine=readFileSync(new URL('server/.env',root),'utf8').split('\n').find(l=>l.startsWith('DATABASE_URL='));const url=new URL(urlLine?.slice(13)||'');if(!['127.0.0.1','localhost'].includes(url.hostname))throw new Error('Automatic local setup requires a local database. For a managed database use the explicit migration commands in README.');
run('npm',['ci','--ignore-scripts'],new URL('server/',root));
for(const command of ['prisma:generate','db:migrate','db:seed','build'])run('npm',['run',command],new URL('server/',root));
run('npm',['run','staff:create','--','--generate-local'],new URL('server/',root));run('npm',['run','build']);
console.log('Store setup complete. Run npm run dev. Staff credentials are in ignored server/.local-admin.json; they were not printed.');
