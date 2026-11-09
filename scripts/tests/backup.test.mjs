import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile, readFile, readdir, rm, symlink } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawn, spawnSync } from 'node:child_process';

const root = fileURLToPath(new URL('../../', import.meta.url));
const script = path.join(root, 'deploy/backup/backup.sh');
// Model external services only: actual Bash, tar, pipefail, temp files and traps run.
// GNU stat/flock/sha256sum shims also let this Linux-targeted suite run on macOS.
const mock = String.raw`#!/usr/bin/env node
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const name = path.basename(process.argv[1]);
const a = process.argv.slice(2);
const dir = process.env.FIXTURE;
const mode = process.env.SCENARIO || '';
const arg = flag => a[a.indexOf(flag) + 1];
const log = event => fs.appendFileSync(path.join(dir, 'events'), JSON.stringify(event) + '\n');
const fail = () => { console.error('SENSITIVE_CHILD_DIAGNOSTIC'); process.exit(7); };
if (name === 'stat') {
  const s = fs.statSync(a[2]);
  log({ tool: name, args: a, uid: s.uid, mode: (s.mode & 0o777).toString(8) });
  // Write machine-readable bytes, not console.log(number) (FORCE_COLOR adds ANSI).
  process.stdout.write(String(a[1] === '%u' ? s.uid : a[1] === '%a' ? (s.mode & 0o777).toString(8) : s.size) + '\n');
} else if (name === 'sha256sum') {
  console.log(crypto.createHash('sha256').update(fs.readFileSync(a[0])).digest('hex') + '  ' + a[0]);
} else if (name === 'flock') {
  const lock = path.join(dir, 'mock-lock');
  if (fs.existsSync(lock)) {
    try { process.kill(Number(fs.readFileSync(lock, 'utf8')), 0); process.exit(1); } catch {}
  }
  fs.writeFileSync(lock, String(process.ppid));
} else if (name === 'docker') {
  log({ tool: name, args: a });
  const sql = a.at(-1);
  if (a.includes('version')) console.log('Docker Compose v2');
  else if (sql.includes('SHOW server_version_num')) console.log(mode === 'pg17' ? '170001' : '160011');
  else if (a.includes('--version')) console.log('pg_dump (PostgreSQL) 16.11');
  else if (sql.includes('pg_dumpall')) {
    process.stdout.write('CREATE ROLE postgres;\nALTER ROLE postgres WITH SUPERUSER;\n');
    if (mode === 'roles') fail();
  } else if (sql.includes('exec pg_dump ')) {
    const finish = () => {
      process.stdout.write('PGDMP database contents');
      if (mode === 'dump') fail();
    };
    if (mode === 'hold') {
      fs.writeFileSync(path.join(dir, 'holding'), '1');
      const timer = setInterval(() => {
        if (fs.existsSync(path.join(dir, 'release'))) { clearInterval(timer); finish(); }
      }, 20);
    } else finish();
  } else if (a.includes('--list')) {
    fs.readFileSync(0);
    if (mode === 'toc') fail();
    console.log('; archive table of contents');
  } else fail();
} else if (name === 'age') {
  log({ tool: name, args: a });
  const bytes = fs.readFileSync(0);
  // Verify a complete tar, including both database and global roles, reached encryption.
  if (!bytes.includes(Buffer.from('roles.sql')) || !bytes.includes(Buffer.from('database.dump'))) fail();
  fs.writeFileSync(arg('--output'), Buffer.concat([Buffer.from('encrypted:'), bytes]));
  if (mode === 'encrypt') fail();
} else if (name === 'aws') {
  log({ tool: name, args: a });
  if (a.includes('put-object')) {
    if (mode === 'upload') fail();
    const bytes = fs.readFileSync(arg('--body'));
    fs.writeFileSync(path.join(dir, 'object'), bytes);
    fs.writeFileSync(path.join(dir, 'metadata'), arg('--metadata').slice(7));
  } else if (a.includes('head-object')) {
    if (mode === 'head') fail();
    const size = fs.statSync(path.join(dir, 'object')).size;
    const hash = fs.readFileSync(path.join(dir, 'metadata'), 'utf8');
    console.log((mode === 'size' ? size + 1 : size) + '\t' + (mode === 'checksum' ? 'bad' : hash));
  } else fail();
} else if (name === 'curl') {
  log({ tool: name, args: a });
  if (mode === 'heartbeat') fail();
} else fail();
`;

async function fixture(t, scenario = '') {
  const dir = await mkdtemp(path.join(tmpdir(), 'mutuity-backup-test-'));
  t.after(() => rm(dir, { recursive: true, force: true }));
  const bin = path.join(dir, 'bin');
  const state = path.join(dir, 'state');
  await mkdir(bin);
  await mkdir(state, { mode: 0o700 });
  const dispatcher = path.join(bin, 'mock.cjs');
  await writeFile(dispatcher, mock, { mode: 0o700 });
  const commands = ['docker', 'age', 'aws', 'curl'];
  if (process.platform !== 'linux') commands.push('stat', 'flock', 'sha256sum');
  for (const command of commands) {
    await symlink(dispatcher, path.join(bin, command));
  }
  const compose = path.join(dir, 'compose.yml');
  const composeEnv = path.join(dir, 'production.env');
  await writeFile(compose, 'services: {}\n');
  await writeFile(composeEnv, 'SECRET=not-logged\n', { mode: 0o600 });
  const config = path.join(dir, 'backup.env');
  const settings = {
    REPO_DIR: dir, COMPOSE_FILE: compose, COMPOSE_ENV_FILE: composeEnv, STATE_DIR: state,
    AGE_RECIPIENT: 'age1publictest', R2_ENDPOINT: 'https://account.r2.cloudflarestorage.com',
    R2_BUCKET: 'test-backups', AWS_ACCESS_KEY_ID: 'SECRET_ACCESS', AWS_SECRET_ACCESS_KEY: 'SECRET_KEY',
    SUCCESS_HEARTBEAT_URL: 'https://monitor.invalid/SECRET_SUCCESS',
    FAILURE_HEARTBEAT_URL: 'https://monitor.invalid/SECRET_FAILURE',
  };
  await writeFile(config, Object.entries(settings).map(([k, v]) => `${k}='${v}'`).join('\n'), { mode: 0o600 });
  const env = { ...process.env, PATH: `${bin}:${process.env.PATH}`, MUTUITY_BACKUP_CONFIG: config, FIXTURE: dir, SCENARIO: scenario };
  function run(args = [], executable = script) {
    const child = spawn('bash', [executable, ...args], { env });
    let output = '';
    child.stdout.on('data', data => { output += data; });
    child.stderr.on('data', data => { output += data; });
    const done = new Promise((resolve, reject) => {
      child.on('error', reject);
      child.on('close', code => resolve({ code, output }));
    });
    return { child, done };
  }
  const events = async () => (await readFile(path.join(dir, 'events'), 'utf8').catch(() => '')).trim().split('\n').filter(Boolean).map(JSON.parse);
  return { dir, state, config, run, events };
}

test('Bash syntax is valid', () => {
  const result = spawnSync('bash', ['-n', script], { encoding: 'utf8' });
  assert.equal(result.status, 0, result.stderr);
});

test('local check validates configuration without dump, upload or heartbeat', async t => {
  const f = await fixture(t);
  const result = await f.run(['--check']).done;
  assert.equal(result.code, 0, result.output);
  assert.match(result.output, /local preflight checks passed/);
  assert.equal((await f.events()).some(e => ['docker', 'aws', 'age', 'curl'].includes(e.tool)), false);
  assert.deepEqual(await readdir(f.state), []);
});

for (const [setting, value, message] of [
  ['REPO_DIR', '/missing/SECRET_CHECKOUT', 'REPO_DIR does not point to an accessible directory'],
  ['COMPOSE_FILE', '/missing/SECRET_COMPOSE', 'COMPOSE_FILE does not point to an accessible file'],
  ['SUCCESS_HEARTBEAT_URL', 'http://monitor.invalid/SECRET_SUCCESS', 'SUCCESS_HEARTBEAT_URL must use HTTPS'],
  ['AWS_SECRET_ACCESS_KEY', '', 'required setting is empty or unset: AWS_SECRET_ACCESS_KEY'],
]) {
  test(`preflight identifies invalid ${setting} without logging its value`, async t => {
    const f = await fixture(t);
    await writeFile(f.config, (await readFile(f.config, 'utf8'))
      .replace(new RegExp(`^${setting}=.*$`, 'm'), `${setting}='${value}'`));
    const result = await f.run(['--check']).done;
    assert.notEqual(result.code, 0);
    assert.ok(result.output.includes(message), result.output);
    assert.doesNotMatch(result.output, /SECRET_CHECKOUT|SECRET_COMPOSE|SECRET_SUCCESS|\bSECRET_ACCESS\b|SENSITIVE_CHILD/);
    assert.equal((await f.events()).some(e => ['docker', 'aws', 'age', 'curl'].includes(e.tool)), false);
  });
}

test('preflight identifies a missing dependency in the service PATH', async t => {
  const f = await fixture(t);
  await writeFile(f.config, `${await readFile(f.config, 'utf8')}\nPATH=/nonexistent\n`);
  const result = await f.run(['--check']).done;
  assert.notEqual(result.code, 0);
  assert.match(result.output, /required command not found in PATH: docker/);
  assert.doesNotMatch(result.output, /SECRET|SENSITIVE/);
});

test('preflight identifies insecure Compose env permissions without exposing contents', async t => {
  const f = await fixture(t);
  const { chmod } = await import('node:fs/promises');
  await chmod(path.join(f.dir, 'production.env'), 0o644);
  const result = await f.run(['--check']).done;
  assert.notEqual(result.code, 0);
  assert.match(result.output, /COMPOSE_ENV_FILE must have mode 0600 or 0400/);
  assert.doesNotMatch(result.output, /SECRET|not-logged/);
});

test('both services use the installed script independently of the checkout', async () => {
  for (const [name, suffix] of [
    ['mutuity-backup.service', ''],
    ['mutuity-backup-failure.service', ' --failure-signal'],
  ]) {
    const unit = await readFile(path.join(root, 'deploy/backup', name), 'utf8');
    assert.equal(unit.match(/^ExecStart=.+$/m)?.[0],
      `ExecStart=/bin/bash /usr/local/libexec/mutuity/backup.sh${suffix}`);
    assert.doesNotMatch(unit, /\/opt\/mutuity|\/srv\/mutuity/);
  }
  const config = await readFile(path.join(root, 'deploy/backup/backup.env.example'), 'utf8');
  assert.match(config, /^REPO_DIR=\/srv\/mutuity$/m);
  assert.doesNotMatch(config, /^COMPOSE_(?:FILE|ENV_FILE)=/m);
});

test('installed script derives Compose paths from REPO_DIR and handles a checkout containing spaces', async t => {
  const f = await fixture(t);
  const checkout = path.join(f.dir, 'deployment checkout');
  await mkdir(checkout);
  await writeFile(path.join(checkout, 'docker-compose.prod.yml'), 'services: {}\n');
  await writeFile(path.join(checkout, '.env.prod'), 'SECRET=not-logged\n', { mode: 0o600 });
  const config = await readFile(f.config, 'utf8');
  await writeFile(f.config, config
    .replace(/^REPO_DIR=.*$/m, `REPO_DIR='${checkout}'`)
    .replace(/^COMPOSE_(?:FILE|ENV_FILE)=.*\n/gm, ''));
  const installed = path.join(f.dir, 'installed-backup.sh');
  await writeFile(installed, await readFile(script), { mode: 0o700 });
  const result = await f.run([], installed).done;
  assert.equal(result.code, 0, result.output);
  for (const event of (await f.events()).filter(e => e.tool === 'docker')) {
    assert.equal(event.args[event.args.indexOf('--project-directory') + 1], checkout);
    assert.equal(event.args[event.args.indexOf('--env-file') + 1], path.join(checkout, '.env.prod'));
    assert.equal(event.args[event.args.indexOf('-f') + 1], path.join(checkout, 'docker-compose.prod.yml'));
  }
  assert.equal((await f.run(['--failure-signal'], installed).done).code, 0);
});

test('backup timer runs every six hours UTC with bounded execution and matching heartbeat guidance', async () => {
  const timer = await readFile(path.join(root, 'deploy/backup/mutuity-backup.timer'), 'utf8');
  const service = await readFile(path.join(root, 'deploy/backup/mutuity-backup.service'), 'utf8');
  const config = await readFile(path.join(root, 'deploy/backup/backup.env.example'), 'utf8');
  assert.deepEqual(timer.match(/^OnCalendar=.+$/gm), [2, 8, 14, 20].map(hour =>
    `OnCalendar=*-*-* ${String(hour).padStart(2, '0')}:00:00 UTC`));
  assert.match(timer, /^Persistent=true$/m);
  assert.match(timer, /^AccuracySec=1min$/m);
  assert.match(timer, /^Unit=mutuity-backup\.service$/m);
  assert.match(service, /^TimeoutStartSec=1h$/m);
  assert.match(service, /^OnFailure=mutuity-backup-failure\.service$/m);
  assert.match(config, /interval 25200 seconds \(7h\)/);
  assert.match(config, /^FAILURE_HEARTBEAT_URL=$/m);
});

test('complete encrypted archive uploaded uniquely, HEAD checked before success; cleanup and permissions', async t => {
  const f = await fixture(t);
  const result = await f.run().done;
  assert.equal(result.code, 0, result.output + JSON.stringify(await f.events()));
  const events = await f.events();
  const put = events.find(e => e.args.includes('put-object'));
  assert.ok(put);
  assert.match(put.args[put.args.indexOf('--key') + 1], /^postgres\/mutuity-\d{8}T\d{6}Z-[a-f0-9]{32}\.tar\.age$/);
  assert.deepEqual(events.filter(e => ['aws', 'curl'].includes(e.tool)).map(e => e.tool === 'curl' ? 'heartbeat' : e.args.includes('put-object') ? 'put' : 'head'), ['put', 'head', 'heartbeat']);
  const heartbeat = events.find(e => e.tool === 'curl');
  assert.equal(heartbeat.args[heartbeat.args.indexOf('--request') + 1], 'POST');
  assert.equal(heartbeat.args.some(arg => ['--data', '--data-binary', '-d'].includes(arg)), false);
  const dump = events.find(e => e.args.at(-1).includes('exec pg_dump '));
  assert.ok(dump.args.includes('-T'));
  assert.ok(dump.args.includes('mutuity-prod'));
  assert.match(dump.args.at(-1), /--format=custom --compress=9 --create/);
  assert.doesNotMatch(dump.args.at(-1), /--no-owner|--no-acl|--schema|--enable-row-security/);
  assert.deepEqual(await readdir(f.state), ['backup.lock']);
  assert.doesNotMatch(result.output, /SECRET|SENSITIVE/);
  const again = await f.run().done;
  assert.equal(again.code, 0, again.output);
  const keys = (await f.events()).filter(e => e.args.includes('put-object')).map(e => e.args[e.args.indexOf('--key') + 1]);
  assert.notEqual(keys[0], keys[1]);
});

for (const scenario of ['roles', 'dump', 'toc', 'encrypt', 'upload', 'head', 'size', 'checksum', 'heartbeat', 'pg17']) {
  test(`fails closed and cleans temporary files: ${scenario}`, async t => {
    const f = await fixture(t, scenario);
    const result = await f.run().done;
    assert.notEqual(result.code, 0);
    assert.match(result.output, /backup failed/);
    assert.doesNotMatch(result.output, /SECRET|SENSITIVE/);
    const events = await f.events();
    if (scenario !== 'heartbeat') assert.equal(events.some(e => e.tool === 'curl'), false);
    if (['roles', 'dump', 'toc', 'encrypt', 'pg17'].includes(scenario)) assert.equal(events.some(e => e.tool === 'aws'), false);
    assert.deepEqual(await readdir(f.state), ['backup.lock']);
  });
}

test('rejects insecure config before external calls', async t => {
  const f = await fixture(t);
  const { chmod } = await import('node:fs/promises');
  await chmod(f.config, 0o644);
  assert.notEqual((await f.run().done).code, 0);
  assert.equal((await f.events()).some(e => e.tool !== 'stat'), false);
});

test('failure signal sends only failure heartbeat, never dumps or uploads', async t => {
  const f = await fixture(t);
  assert.equal((await f.run(['--failure-signal']).done).code, 0);
  const events = (await f.events()).filter(e => e.tool !== 'stat');
  assert.equal(events.length, 1);
  assert.equal(events[0].tool, 'curl');
  assert.equal(events[0].args.at(-1), 'https://monitor.invalid/SECRET_FAILURE');
});

for (const absent of ['unset', 'empty']) {
  test(`failure signal is a successful no-op with ${absent} failure URL`, async t => {
    const f = await fixture(t);
    const config = await readFile(f.config, 'utf8');
    await writeFile(f.config, config.replace(/^FAILURE_HEARTBEAT_URL=.*$/m,
      absent === 'unset' ? 'unset FAILURE_HEARTBEAT_URL' : "FAILURE_HEARTBEAT_URL=''"));
    const result = await f.run(['--failure-signal']).done;
    assert.equal(result.code, 0, result.output);
    assert.equal((await f.events()).some(e => e.tool !== 'stat'), false);
  });
}

test('configured failure heartbeat rejects HTTP and propagates delivery failure', async t => {
  const f = await fixture(t, 'heartbeat');
  assert.notEqual((await f.run(['--failure-signal']).done).code, 0);
  await writeFile(f.config, (await readFile(f.config, 'utf8')).replace('https://monitor.invalid/SECRET_FAILURE', 'http://monitor.invalid/SECRET_FAILURE'));
  const before = (await f.events()).filter(e => e.tool === 'curl').length;
  assert.notEqual((await f.run(['--failure-signal']).done).code, 0);
  assert.equal((await f.events()).filter(e => e.tool === 'curl').length, before);
});

test('concurrent invocation cannot dump/upload while lock held', async t => {
  const f = await fixture(t, 'hold');
  const first = f.run();
  t.after(() => { if (first.child.exitCode === null) first.child.kill('SIGTERM'); });
  for (let i = 0; i < 500; i++) {
    if ((await readdir(f.dir)).includes('holding')) break;
    await new Promise(resolve => setTimeout(resolve, 10));
  }
  assert.ok((await readdir(f.dir)).includes('holding'), 'first invocation reached dump');
  const second = await f.run().done;
  assert.notEqual(second.code, 0);
  assert.match(second.output, /failed \(lock\)/);
  await writeFile(path.join(f.dir, 'release'), '1');
  assert.equal((await first.done).code, 0);
  assert.equal((await f.events()).filter(e => e.args.includes('put-object')).length, 1);
});

test('Linux real flock excludes another process when available', { skip: process.platform !== 'linux' }, async t => {
  const check = spawnSync('flock', ['--version']);
  if (check.status !== 0) return t.skip('util-linux flock not installed');
  const f = await fixture(t, 'hold');
  const first = f.run();
  for (let i = 0; i < 500; i++) {
    if ((await readdir(f.dir)).includes('holding')) break;
    await new Promise(resolve => setTimeout(resolve, 10));
  }
  // Release even if assertions fail, so the test cannot strand a child.
  try {
    assert.ok((await readdir(f.dir)).includes('holding'));
    assert.match((await f.run().done).output, /failed \(lock\)/);
  } finally {
    await writeFile(path.join(f.dir, 'release'), '1');
    await first.done;
  }
});