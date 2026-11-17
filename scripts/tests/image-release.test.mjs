import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile, copyFile, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { releaseInputs, releaseManifest } from '../prepare-image-release.mjs';

const root = fileURLToPath(new URL('../../', import.meta.url));
const sha = 'a'.repeat(40);
const digest = `sha256:${'b'.repeat(64)}`;
const config = {
  NEXT_PUBLIC_GRAPHQL_URL: 'https://review.example.com/graphql',
  NEXT_PUBLIC_GRAPHQL_WS_URL: 'wss://review.example.com/graphql',
  NEXT_PUBLIC_BACKEND_URL: 'https://review.example.com',
};
const env = {
  TARGET_ENVIRONMENT: 'review', RELEASE_SERVICES: 'all', GITHUB_SHA: sha,
  GITHUB_REPOSITORY: 'Owner/Mutuity', GITHUB_RUN_ID: '123', GITHUB_RUN_ATTEMPT: '2',
  REPOSITORY_PRIVATE: 'true',
  FRONTEND_BUILD_CONFIG: JSON.stringify(config), BACKEND_DIGEST: digest, FRONTEND_DIGEST: digest,
};

test('release inputs use unique run tags, lowercase GHCR names and exact release identity', () => {
  const inputs = releaseInputs(env);
  assert.equal(inputs.backend_tag, `ghcr.io/owner/mutuity-backend:${sha}-123-2`);
  assert.equal(inputs.frontend_tag, `ghcr.io/owner/mutuity-frontend:review-${sha}-123-2`);
  assert.match(inputs.build_args, new RegExp(`NEXT_PUBLIC_SENTRY_RELEASE=${sha}`));
  assert.match(inputs.build_args, /NEXT_PUBLIC_DEFAULT_LOCALE=fr/);
  assert.equal(releaseManifest(inputs, env), `RELEASE_COMMIT=${sha}\nRELEASE_ENVIRONMENT=review\nBACKEND_IMAGE=ghcr.io/owner/mutuity-backend@${digest}\nFRONTEND_IMAGE=ghcr.io/owner/mutuity-frontend@${digest}\n`);
});

test('backend-only publishing needs no frontend configuration and emits no frontend image', () => {
  const inputs = releaseInputs({ ...env, RELEASE_SERVICES: 'backend', FRONTEND_BUILD_CONFIG: '' });
  assert.equal(inputs.build_args, '');
  assert.doesNotMatch(releaseManifest(inputs, { BACKEND_DIGEST: digest }), /FRONTEND_IMAGE/);
});

test('frontend-only manifest requires only its own valid digest', () => {
  const inputs = releaseInputs({ ...env, RELEASE_SERVICES: 'frontend' });
  assert.doesNotMatch(releaseManifest(inputs, { FRONTEND_DIGEST: digest }), /BACKEND_IMAGE/);
  assert.throws(() => releaseManifest(inputs, { FRONTEND_DIGEST: 'latest' }), /digest/);
});

test('public repositories can prepare frontend or all images without retaining maps', () => {
  for (const services of ['frontend', 'all']) {
    const inputs = releaseInputs({ ...env, RELEASE_SERVICES: services, REPOSITORY_PRIVATE: 'false' });
    assert.match(inputs.build_args, new RegExp(`NEXT_PUBLIC_SENTRY_RELEASE=${sha}`));
    assert.match(releaseManifest(inputs, env), /FRONTEND_IMAGE=/);
  }
});

test('CLI emits valid Actions multiline outputs and writes deployable manifest/summary', async t => {
  const dir = await mkdtemp(path.join(tmpdir(), 'mutuity-release-cli-'));
  t.after(() => rm(dir, { recursive: true, force: true }));
  const output = path.join(dir, 'output');
  const summary = path.join(dir, 'summary');
  const options = { cwd: dir, encoding: 'utf8', env: { ...process.env, ...env, GITHUB_OUTPUT: output, GITHUB_STEP_SUMMARY: summary } };
  const script = path.join(root, 'scripts/prepare-image-release.mjs');
  let result = spawnSync(process.execPath, [script], options);
  assert.equal(result.status, 0, result.stderr);
  const text = await readFile(output, 'utf8');
  assert.match(text, /backend_tag<<MUTUITY_OUTPUT\nghcr.io\/owner\/mutuity-backend:/);
  assert.match(text, /build_args<<MUTUITY_OUTPUT\nNEXT_PUBLIC_GRAPHQL_URL=/);
  result = spawnSync(process.execPath, [script, 'manifest'], options);
  assert.equal(result.status, 0, result.stderr);
  assert.equal(await readFile(path.join(dir, '.release-artifacts/release.env'), 'utf8'), releaseManifest(releaseInputs(env), env));
  assert.match(await readFile(summary, 'utf8'), /Publishing does \*\*not\*\* deploy/);
});

test('public frontend CLI warns and records that source maps were not retained', async t => {
  const dir = await mkdtemp(path.join(tmpdir(), 'mutuity-public-release-'));
  t.after(() => rm(dir, { recursive: true, force: true }));
  const output = path.join(dir, 'output');
  const summary = path.join(dir, 'summary');
  const options = { cwd: dir, encoding: 'utf8', env: { ...process.env, ...env, REPOSITORY_PRIVATE: 'false', GITHUB_OUTPUT: output, GITHUB_STEP_SUMMARY: summary } };
  const script = path.join(root, 'scripts/prepare-image-release.mjs');
  const prepare = spawnSync(process.execPath, [script], options);
  assert.equal(prepare.status, 0, prepare.stderr);
  assert.match(prepare.stderr, /source maps will not be retained/);
  const manifest = spawnSync(process.execPath, [script, 'manifest'], options);
  assert.equal(manifest.status, 0, manifest.stderr);
  assert.match(await readFile(summary, 'utf8'), /source maps were not retained/);
});

test('invalid inputs, secrets, newline injection, missing URLs and credentials fail closed', () => {
  for (const patch of [
    { TARGET_ENVIRONMENT: 'production' }, { RELEASE_SERVICES: 'worker' }, { GITHUB_SHA: 'main' },
    { GITHUB_REPOSITORY: '../oops' }, { GITHUB_RUN_ID: 'bad' }, { FRONTEND_BUILD_CONFIG: '' },
    { FRONTEND_BUILD_CONFIG: '[]' }, { FRONTEND_BUILD_CONFIG: '{}' },
    ...[
      { SESSION_SECRET: 'secret' }, { NEXT_PUBLIC_SENTRY_RELEASE: 'wrong' },
      { NEXT_PUBLIC_DEFAULT_LOCALE: 'fr\nMUTUITY_OUTPUT\nbad=value' },
      { NEXT_PUBLIC_DEFAULT_LOCALE: 42 },
      { NEXT_PUBLIC_GRAPHQL_URL: 'https://user:password@example.com/graphql' },
      { NEXT_PUBLIC_GRAPHQL_URL: 'http://example.com/graphql' },
      { NEXT_PUBLIC_BACKEND_URL: 'https://example.com/?token=secret' },
    ].map(p => ({ FRONTEND_BUILD_CONFIG: JSON.stringify({ ...config, ...p }) })),
  ]) assert.throws(() => releaseInputs({ ...env, ...patch }));
});

async function fixture(t, scenario = '') {
  const dir = await mkdtemp(path.join(tmpdir(), 'mutuity-image-release-'));
  t.after(() => rm(dir, { recursive: true, force: true }));
  await mkdir(path.join(dir, 'scripts'));
  await mkdir(path.join(dir, 'bin'));
  await mkdir(path.join(dir, 'locks'));
  await copyFile(path.join(root, 'scripts/deploy-stack.sh'), path.join(dir, 'scripts/deploy-stack.sh'));
  await writeFile(path.join(dir, '.env.review'), 'SESSION_SECRET=not-printed\n');
  const manifest = path.join(dir, 'release.env');
  await writeFile(manifest, releaseManifest(releaseInputs(env), env));
  await writeFile(path.join(dir, 'bin/git'), `#!/usr/bin/env node
if (process.argv.includes('rev-parse')) console.log(process.env.SCENARIO === 'commit' ? 'c'.repeat(40) : '${sha}');
else if (process.env.SCENARIO === 'dirty') console.log('?? database/migrations/untracked.sql');
`, { mode: 0o700 });
  await writeFile(path.join(dir, 'bin/docker'), `#!/usr/bin/env node
const fs = require('node:fs');
const a = process.argv.slice(2), mode = process.env.SCENARIO;
fs.appendFileSync(process.env.EVENTS, JSON.stringify(a)+'\\n');
if (a[0] === 'image') {
  if (a.includes('{{index .Config.Labels "com.mutuity.environment"}}')) console.log(mode === 'environment' ? 'prod' : 'review');
  else console.log(mode === 'label' ? 'wrong' : '${sha}');
} else if (a[0] === 'inspect') console.log(a.at(-1) === 'worker' ? 'running|none' : 'running|healthy');
else {
  const command = a[9];
  if (command === 'pull' && mode === 'pull') process.exit(7);
  if (command === 'ps') console.log(a.at(-1));
}
`, { mode: 0o700 });
  return {
    dir, manifest,
    run(services = [], extra = {}) {
      return spawnSync('bash', ['scripts/deploy-stack.sh', 'review', '--images', manifest, ...services], {
        cwd: dir, encoding: 'utf8', env: { ...process.env, PATH: `${dir}/bin:${process.env.PATH}`,
          TMPDIR: path.join(dir, 'locks'), SCENARIO: scenario, EVENTS: path.join(dir, 'events'), ...extra },
      });
    },
    async events() {
      try { return (await readFile(path.join(dir, 'events'), 'utf8')).trim().split('\n').map(JSON.parse); }
      catch (error) { if (error.code === 'ENOENT') return []; throw error; }
    },
  };
}

test('image deployment pulls and validates all image identities before migration, never builds', async t => {
  const f = await fixture(t);
  const result = f.run();
  assert.equal(result.status, 0, result.stderr);
  const events = await f.events();
  const commands = events.filter(a => a[0] === 'compose');
  assert.ok(commands.every(a => a[7] === '-f' && a[8] === 'docker-compose.images.yml'));
  assert.deepEqual(commands.filter(a => a[9] !== 'ps').map(a => a.slice(9)), [
    ['config', '--quiet'], ['pull', 'backend', 'worker', 'frontend'],
    ['up', '-d', '--no-recreate', 'postgres'], ['run', '--rm', '--no-deps', 'migrate'],
    ['up', '-d', '--no-build', '--no-deps', '--force-recreate', 'backend', 'worker', 'frontend'],
  ]);
  assert.ok(events.findIndex(a => a[9] === 'up') > events.findLastIndex(a => a[0] === 'image'));
});

for (const scenario of ['pull', 'label', 'environment', 'commit', 'dirty']) {
  test(`${scenario} failure never starts PostgreSQL, migrates or replaces services`, async t => {
    const f = await fixture(t, scenario);
    const result = f.run();
    assert.notEqual(result.status, 0);
    assert.ok(!(await f.events()).some(a => ['up', 'run', 'build'].includes(a[9])));
  });
}

test('selective manifest deploys only selected services and ignores inherited image references', async t => {
  const f = await fixture(t);
  await writeFile(f.manifest, releaseManifest(releaseInputs({ ...env, RELEASE_SERVICES: 'backend' }), env));
  assert.equal(f.run(['backend', 'worker'], { FRONTEND_IMAGE: 'inherited:latest' }).status, 0);
  const events = await f.events();
  assert.deepEqual(events.find(a => a[9] === 'pull').slice(9), ['pull', 'backend', 'worker']);
  assert.notEqual(f.run().status, 0, 'missing frontend must not silently use the base image');
});

test('never sources manifests: reject mutable tags, wrong target, unknown fields and duplicates', async t => {
  const f = await fixture(t);
  const valid = releaseManifest(releaseInputs(env), env);
  for (const contents of [
    valid.replace(`@${digest}`, ':latest'), valid.replace('RELEASE_ENVIRONMENT=review', 'RELEASE_ENVIRONMENT=prod'),
    `${valid}MALICIOUS=$(touch unsafe)\n`, `${valid}RELEASE_COMMIT=${sha}\n`,
    valid.replace(sha, 'main'), valid.replace('RELEASE_COMMIT=', 'RELEASE_COMMIT=$(echo '),
  ]) {
    await writeFile(f.manifest, contents);
    assert.notEqual(f.run().status, 0);
  }
  assert.deepEqual(await f.events(), []);
});

test('manual workflow bounds spending and separates maps from manifest storage', async () => {
  const workflow = await readFile(path.join(root, '.github/workflows/publish-images.yml'), 'utf8');
  assert.match(workflow, /workflow_dispatch:/);
  assert.doesNotMatch(workflow, /^  (push|pull_request|schedule|workflow_run):/m);
  assert.match(workflow, /runs-on: ubuntu-latest/);
  assert.match(workflow, /timeout-minutes: 40/);
  assert.match(workflow, /cancel-in-progress: true/);
  assert.match(workflow, /retention-days: 7/);
  assert.match(workflow, /retention-days: 14/);
  assert.match(workflow, /DOCKER_BUILD_RECORD_UPLOAD: "false"/);
  assert.doesNotMatch(workflow, /ssh|deploy-stack\.sh/);
  assert.match(workflow, /platforms: linux\/amd64/);
  assert.match(workflow, /target: artifacts/);
  assert.match(workflow, /name: Export private source maps[^\n]*\n\s+if: inputs\.services != 'backend' && github\.event\.repository\.private == true/);
  assert.match(workflow, /name: Upload private frontend monitoring artifacts\n\s+if: inputs\.services != 'backend' && github\.event\.repository\.private == true/);
  assert.match(workflow, /cache-from: \$\{\{ github\.event\.repository\.private == true && format\('type=gha,scope=release-frontend-\{0\}', inputs\.environment\) \|\| '' \}\}/);
  assert.match(workflow, /cache-to: \$\{\{ github\.event\.repository\.private == true && format\('type=gha,scope=release-frontend-\{0\},mode=max', inputs\.environment\) \|\| '' \}\}/);
});