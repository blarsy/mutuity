import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile, readFile, copyFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const root = fileURLToPath(new URL('../../', import.meta.url));
const mock = String.raw`#!/usr/bin/env node
const fs = require('node:fs');
const path = require('node:path');
const a = process.argv.slice(2);
const dir = process.env.FIXTURE;
const scenario = process.env.SCENARIO;
fs.appendFileSync(path.join(dir, 'events'), JSON.stringify(a) + '\n');
if (a[0] === 'ps') {
  if (scenario !== 'fresh') console.log('existing');
  if (scenario === 'ambiguous') console.log('second');
} else if (a[0] === 'inspect') {
  const format = a[2];
  if (format.includes('.Config.Labels')) {
    const config = scenario === 'conflict' ? 'docker-compose.prod.yml' : 'docker-compose.ingress.yml';
    console.log('deployed-project|caddy|' + path.join(dir, config));
  } else if (format.includes('.HostPort')) console.log('80\n443');
  else console.log('/legacy-caddy');
} else if (a[0] === 'compose') {
  if (a.includes('validate') && scenario === 'invalid') process.exit(1);
  if (a.includes('up')) {
    const env = fs.readFileSync(a[a.indexOf('--env-file') + 1], 'utf8');
    if (!env.includes('REVIEW_CANDIDATE_VERSION=1.0.9')) process.exit(9);
  }
} else process.exit(8);
`;

async function run(t, scenario) {
  const dir = await mkdtemp(path.join(tmpdir(), 'mutuity-candidate-test-'));
  t.after(() => rm(dir, { recursive: true, force: true }));
  for (const subdir of ['scripts', 'mobile-app', 'bin']) await mkdir(path.join(dir, subdir));
  await copyFile(path.join(root, 'scripts/set-review-candidate-version.sh'), path.join(dir, 'scripts/set-review-candidate-version.sh'));
  const initial = 'PRODUCTION_APP_VERSION=1.0.8\nREVIEW_CANDIDATE_VERSION=__NO_REVIEW_CANDIDATE__\n';
  await writeFile(path.join(dir, '.env.ingress'), initial);
  await writeFile(path.join(dir, 'mobile-app/app.config.ts'), 'const APP_VERSION = "1.0.9";\n');
  await writeFile(path.join(dir, 'bin/docker'), mock, { mode: 0o755 });
  const result = spawnSync('bash', [path.join(dir, 'scripts/set-review-candidate-version.sh'), '1.0.9'], {
    encoding: 'utf8',
    env: { ...process.env, PATH: `${dir}/bin:${process.env.PATH}`, FIXTURE: dir, SCENARIO: scenario },
  });
  const events = (await readFile(path.join(dir, 'events'), 'utf8')).trim().split('\n').map(JSON.parse);
  return { result, events, initial, env: await readFile(path.join(dir, '.env.ingress'), 'utf8') };
}

for (const scenario of ['existing', 'fresh']) {
  test(`candidate update uses the correct project: ${scenario}`, async t => {
    const { result, events, env } = await run(t, scenario);
    assert.equal(result.status, 0, result.stderr);
    const compose = events.filter(a => a[0] === 'compose');
    assert.equal(compose.length, 2);
    for (const args of compose) assert.equal(args[args.indexOf('-p') + 1], scenario === 'fresh' ? 'mutuity-ingress' : 'deployed-project');
    assert.ok(compose[0].includes('validate'));
    assert.ok(compose[1].includes('--force-recreate'));
    assert.match(env, /REVIEW_CANDIDATE_VERSION=1\.0\.9/);
  });
}

for (const scenario of ['conflict', 'ambiguous', 'invalid']) {
  test(`candidate update preserves the environment on ${scenario}`, async t => {
    const { result, events, initial, env } = await run(t, scenario);
    assert.notEqual(result.status, 0);
    assert.equal(env, initial);
    assert.ok(!events.some(a => a.includes('up')));
    if (scenario === 'conflict') assert.match(result.stderr, /legacy-caddy.*already publishes/);
    if (scenario !== 'invalid') assert.ok(!events.some(a => a[0] === 'compose'));
  });
}