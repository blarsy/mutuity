import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile, copyFile, readFile, readdir, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const root = fileURLToPath(new URL('../../', import.meta.url));
// Run real Bash and filesystem locking; model only the external Docker daemon.
const docker = `#!/usr/bin/env node
const fs = require('node:fs');
const a = process.argv.slice(2);
const mode = process.env.SCENARIO;
fs.appendFileSync(process.env.EVENTS, JSON.stringify(a) + '\\n');
if (a[0] === 'inspect') {
  const service = a.at(-1);
  if (mode === 'unhealthy' && service === 'backend') console.log('running|unhealthy');
  else if (mode === 'exited' && service === 'worker') console.log('exited|none');
  else if (mode === 'timeout' && service === 'frontend') console.log('running|starting');
  else console.log(service === 'worker' ? 'running|none' : 'running|healthy');
} else {
  const command = a[7];
  if (command === mode || (mode === 'migration' && command === 'run')) process.exit(7);
  if (command === 'ps') console.log(a.at(-1));
}
`;

async function fixture(t, scenario = '') {
  const dir = await mkdtemp(path.join(tmpdir(), 'mutuity-deploy-test-'));
  t.after(() => rm(dir, { recursive: true, force: true }));
  await mkdir(path.join(dir, 'scripts'));
  await mkdir(path.join(dir, 'bin'));
  await mkdir(path.join(dir, 'locks'));
  await copyFile(path.join(root, 'scripts/deploy-stack.sh'), path.join(dir, 'scripts/deploy-stack.sh'));
  for (const environment of ['test', 'review', 'prod']) {
    await writeFile(path.join(dir, `.env.${environment}`), 'SESSION_SECRET=not-printed\n');
  }
  await writeFile(path.join(dir, 'bin/docker'), docker, { mode: 0o700 });
  const eventsFile = path.join(dir, 'events');
  return {
    dir,
    run(args = ['review'], extraEnv = {}) {
      return spawnSync('bash', ['scripts/deploy-stack.sh', ...args], {
        cwd: dir, encoding: 'utf8',
        env: { ...process.env, PATH: `${dir}/bin:${process.env.PATH}`, TMPDIR: `${dir}/locks`,
          EVENTS: eventsFile, SCENARIO: scenario, DEPLOY_READINESS_TIMEOUT_SECONDS: '1', ...extraEnv },
      });
    },
    async events() {
      try { return (await readFile(eventsFile, 'utf8')).trim().split('\n').map(JSON.parse); }
      catch (error) { if (error.code === 'ENOENT') return []; throw error; }
    },
  };
}

for (const environment of ['test', 'review', 'prod']) {
  test(`${environment}: validate, build, migrate, replace, verify; never stop ingress/database`, async t => {
    const f = await fixture(t);
    const result = f.run([environment]);
    assert.equal(result.status, 0, result.stderr);
    const events = await f.events();
    const compose = events.filter(a => a[0] === 'compose');
    for (const a of compose) assert.deepEqual(a.slice(0, 7), [
      'compose', '-p', `mutuity-${environment}`, '-f', 'docker-compose.prod.yml', '--env-file', `.env.${environment}`,
    ]);
    const actions = compose.filter(a => a[7] !== 'ps').map(a => a.slice(7));
    assert.deepEqual(actions, [
      ['config', '--quiet'], ['build', 'backend', 'worker', 'frontend'],
      ['up', '-d', '--no-recreate', 'postgres'], ['run', '--rm', '--no-deps', 'migrate'],
      ['up', '-d', '--no-build', '--no-deps', '--force-recreate', 'backend', 'worker', 'frontend'],
    ]);
    assert.ok(events.some(a => a[0] === 'inspect' && a.at(-1) === 'postgres'));
    assert.ok(events.some(a => a[0] === 'inspect' && a.at(-1) === 'worker'));
    assert.doesNotMatch(result.stdout + result.stderr, /not-printed/);
    assert.deepEqual(await readdir(path.join(f.dir, 'locks')), []);
  });
}

for (const [scenario, forbidden] of [
  ['config', ['build', 'up', 'run']], ['build', ['up', 'run']], ['migration', []],
]) {
  test(`${scenario} failure stops before the next deployment phase and releases lock`, async t => {
    const f = await fixture(t, scenario);
    assert.notEqual(f.run().status, 0);
    const events = await f.events();
    for (const command of forbidden) assert.ok(!events.some(a => a[7] === command));
    assert.ok(!events.some(a => a.includes('--no-build')));
    assert.deepEqual(await readdir(path.join(f.dir, 'locks')), []);
  });
}

test('frontend-only updates build and replace only frontend', async t => {
  const f = await fixture(t);
  assert.equal(f.run(['test', 'frontend']).status, 0);
  const events = await f.events();
  assert.deepEqual(events.find(a => a[7] === 'build').slice(7), ['build', 'frontend']);
  assert.deepEqual(events.find(a => a.includes('--no-build')).slice(7), ['up', '-d', '--no-build', '--no-deps', '--force-recreate', 'frontend']);
});

for (const scenario of ['unhealthy', 'exited', 'timeout']) {
  test(`readiness ${scenario} fails without attempting destructive rollback`, async t => {
    const f = await fixture(t, scenario);
    const result = f.run();
    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /readiness|Readiness/);
    const events = await f.events();
    assert.ok(!events.some(a => a.some(value => ['stop', 'down', 'prune', '--remove-orphans'].includes(value))));
    assert.deepEqual(await readdir(path.join(f.dir, 'locks')), []);
  });
}

test('an existing deployment lock prevents even configuration/build operations', async t => {
  const f = await fixture(t);
  const checksum = spawnSync('cksum', { input: f.dir, encoding: 'utf8' }).stdout.trim().split(/\s+/)[0];
  // macOS /var is a symlink; Bash pwd returns the physical checkout path here.
  const physical = spawnSync('bash', ['-c', 'pwd'], { cwd: f.dir, encoding: 'utf8' }).stdout.trim();
  const key = physical === f.dir ? checksum : spawnSync('cksum', { input: physical, encoding: 'utf8' }).stdout.trim().split(/\s+/)[0];
  const lock = path.join(f.dir, 'locks', `mutuity-deploy-${key}-review.lock`);
  await mkdir(lock);
  const result = f.run();
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /Deployment locked/);
  assert.deepEqual(await f.events(), []);
  assert.equal((await readdir(path.join(f.dir, 'locks'))).length, 1, 'never remove another deployment lock');
});

test('reject invalid environment, services, timeout and missing configuration before Docker', async t => {
  const f = await fixture(t);
  for (const args of [[], ['production'], ['review', 'postgres'], ['review', 'caddy']]) {
    assert.equal(f.run(args).status, 2);
  }
  assert.equal(f.run(['review'], { DEPLOY_READINESS_TIMEOUT_SECONDS: 'zero' }).status, 2);
  await rm(path.join(f.dir, '.env.review'));
  assert.notEqual(f.run().status, 0);
  assert.deepEqual(await f.events(), []);
});

test('Dockerfile cache ordering and private monitoring artifact export stay intact', async () => {
  const frontend = await readFile(path.join(root, 'frontend/Dockerfile'), 'utf8');
  const backend = await readFile(path.join(root, 'backend/Dockerfile'), 'utf8');
  assert.ok(frontend.indexOf('npm ci') < frontend.indexOf('ARG NEXT_PUBLIC_'));
  assert.match(frontend, /npm ci --workspace frontend --include-workspace-root=true/);
  assert.match(frontend, /npm ci --workspace frontend --include-workspace-root=false --omit=dev/);
  assert.match(frontend, /target=\/app\/frontend\/\.next\/cache,sharing=locked/);
  assert.match(frontend, /FROM scratch AS artifacts/);
  assert.match(frontend, /COPY --from=builder \/app\/\.monitoring-artifacts\/frontend \/frontend/);
  for (const dockerfile of [frontend, backend]) {
    assert.match(dockerfile, /^# syntax=docker\/dockerfile:1/);
    assert.match(dockerfile, /target=\/root\/\.npm,sharing=locked/);
    assert.doesNotMatch(dockerfile, /npm cache clean/);
  }
});