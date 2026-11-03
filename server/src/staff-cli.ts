import 'dotenv/config';
import { Role } from '@prisma/client';
import { randomBytes } from 'node:crypto';
import { readFile, writeFile, chmod, open, unlink } from 'node:fs/promises';
import { resolve } from 'node:path';
import { createInterface } from 'node:readline/promises';
import { Writable } from 'node:stream';
import { AuthService, verifyPassword } from './auth';

function flag(name: string) { const index = process.argv.indexOf(name); return index < 0 ? undefined : process.argv[index + 1]; }
import {prisma} from './db';
const auth = new AuthService(prisma);

async function promptPassword(question: string): Promise<string> {
  if (!process.stdin.isTTY) throw new Error('Use --password-env ENV_NAME for noninteractive account creation.');
  let muted = false;
  const output = new Writable({ write(chunk, _encoding, callback) { if (!muted) process.stdout.write(chunk); callback(); } });
  const rl = createInterface({ input: process.stdin, output, terminal: true });
  process.stdout.write(question); muted = true;
  try { const password = await rl.question(''); process.stdout.write('\n'); return password; }
  finally { muted = false; rl.close(); }
}

async function main() {
  if (process.argv.includes('--generate-local')) {
    const file = resolve(process.cwd(), '.local-admin.json');
    let saved: { email: string; password: string } | undefined;
    try { saved = JSON.parse(await readFile(file, 'utf8')); } catch (error) {
      if ((error as { code?: string }).code !== 'ENOENT') throw new Error('Existing local credential file cannot be read; preserve or repair it before bootstrapping.');
    }
    if (saved) {
      if (!saved.email || !saved.password) throw new Error('Existing local credential file is invalid; it was not overwritten.');
      const user = await prisma.user.findUnique({ where: { email: saved.email } });
      if (user && (user.role !== Role.ADMIN || !user.passwordHash || !await verifyPassword(saved.password, user.passwordHash))) throw new Error('Existing local credentials do not match an administrator; file was preserved.');
      if (!user) await auth.createUser({ email: saved.email, name: 'Local administrator', password: saved.password, role: Role.ADMIN });
      await chmod(file, 0o600);
      console.log(`Local administrator ready. Credentials are in ${file} (mode 600); password is not printed.`);
      return;
    }
    const email = flag('--email') || 'local-admin@example.test';
    if (await prisma.user.findUnique({ where: { email: email.toLowerCase() } })) throw new Error('That account already exists. Use your existing credentials or choose another --email; no account was reset.');
    const password = randomBytes(24).toString('base64url');
    const handle = await open(file, 'wx', 0o600);
    try {
      await handle.writeFile(`${JSON.stringify({ email, password, note: 'Local development only. Do not commit this file.' }, null, 2)}\n`); await handle.close();
      await auth.createUser({ email, name: 'Local administrator', password, role: Role.ADMIN });
    } catch (error) { await handle.close().catch(() => {}); await unlink(file).catch(() => {}); throw error; }
    console.log(`Local administrator created. Credentials are in ${file} (mode 600); password is not printed.`);
    return;
  }

  const role = flag('--role') || Role.ADMIN;
  if (!Object.values(Role).includes(role as Role)) throw new Error('Role must be ADMIN, MANAGER, STOCK_CLERK, or CUSTOMER.');
  let email = flag('--email'), name = flag('--name');
  if (!email || !name) {
    if (!process.stdin.isTTY) throw new Error('Provide --email and --name for noninteractive account creation.');
    const rl = createInterface({ input: process.stdin, output: process.stdout });
    try { email ||= await rl.question('Email: '); name ||= await rl.question('Name: '); } finally { rl.close(); }
  }
  const envName = flag('--password-env');
  if (envName && !/^[A-Za-z_][A-Za-z0-9_]*$/.test(envName)) throw new Error('Invalid --password-env variable name.');
  const password = envName ? process.env[envName] : await promptPassword('Password (12–200 characters, hidden): ');
  if (!password) throw new Error('The password environment variable is empty or unset.');
  const user = await auth.createUser({ email, name, password, role: role as Role });
  console.log(`Created ${user.role} account for ${user.email}. No password was printed.`);
}
main().catch(error => { console.error(error instanceof Error ? error.message : 'Account creation failed.'); process.exitCode = 1; }).finally(() => prisma.$disconnect());
