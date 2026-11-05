import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtemp, mkdir, readFile, readdir, rm, symlink, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';

const script = fileURLToPath(new URL('../../frontend/scripts/prepare-monitoring-artifacts.mjs', import.meta.url));

async function fixture(t) {
  // macOS /var is itself a symlink; use the canonical temp path so the
  // deliberate no-symlink policy tests our fixtures, not the OS alias.
  const { realpath } = await import('node:fs/promises');
  const root = await mkdtemp(path.join(await realpath(os.tmpdir()), 'monitoring-artifacts-'));
  t.after(() => rm(root, { recursive: true, force: true }));
  const build = path.join(root, '.next');
  const output = path.join(root, '.monitoring-artifacts/frontend');
  await mkdir(path.join(build, 'static/chunks/nested'), { recursive: true });
  await writeFile(path.join(build, 'BUILD_ID'), 'fixture-build\n');
  const put = async (relative, content) => {
    const target = path.join(build, relative);
    await mkdir(path.dirname(target), { recursive: true });
    await writeFile(target, content);
  };
  const run = (args = [], env = {}) => spawnSync(process.execPath, [script, '--build-dir', build, '--output-dir', output, ...args], {
    encoding: 'utf8', env: { ...process.env, NEXT_PUBLIC_SENTRY_RELEASE: 'frontend@fixture', ...env },
  });
  return { root, build, output, put, run };
}

async function listFiles(directory, relative = '') {
  const result = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const name = path.join(relative, entry.name);
    if (entry.isDirectory()) result.push(...await listFiles(path.join(directory, entry.name), name));
    else result.push(name.split(path.sep).join('/'));
  }
  return result.sort();
}

test('exports nested client maps and exact assets, purges all public maps, excludes server/dependencies', async (t) => {
  const f = await fixture(t);
  const js = 'self._sentryDebugIds={"fixture":"debug-id"};\nconsole.log("unchanged");\n';
  const map = JSON.stringify({ version: 3, sources: ['private.ts'], sourcesContent: ['private source'], mappings: '' });
  await f.put('static/chunks/nested/app.js', js);
  await f.put('static/chunks/nested/app.js.map', map);
  await f.put('static/css/style.css', 'body{}');
  await f.put('static/css/style.css.map', map);
  await f.put('static/chunks/unmapped.js', 'not copied');
  await f.put('server/pages/index.js', 'server JS');
  await f.put('server/pages/index.js.map', 'server map');
  await f.put('node_modules/large/file.js', 'dependency');
  const result = f.run();
  assert.equal(result.status, 0, result.stderr);
  assert.equal(await readFile(path.join(f.output, '_next/static/chunks/nested/app.js'), 'utf8'), js);
  assert.equal(await readFile(path.join(f.output, '_next/static/chunks/nested/app.js.map'), 'utf8'), map);
  assert.equal(await readFile(path.join(f.build, 'static/chunks/nested/app.js'), 'utf8'), js);
  assert.equal(await readFile(path.join(f.build, 'server/pages/index.js.map'), 'utf8'), 'server map');
  assert.deepEqual(await listFiles(path.join(f.build, 'static')), ['chunks/nested/app.js', 'chunks/unmapped.js', 'css/style.css']);
  assert.deepEqual(await listFiles(f.output), [
    '_next/static/chunks/nested/app.js', '_next/static/chunks/nested/app.js.map',
    '_next/static/css/style.css', '_next/static/css/style.css.map', 'manifest.json',
  ]);
  const manifest = JSON.parse(await readFile(path.join(f.output, 'manifest.json'), 'utf8'));
  assert.equal(manifest.release, 'frontend@fixture');
  assert.equal(manifest.buildId, 'fixture-build');
  assert.equal(manifest.sourceMapCount, 2);
  assert.equal(manifest.status, 'prepared');
  assert.equal(manifest.urlPrefix, '~/_next/static');
  assert.match(manifest.serverArtifacts, /separately/);
  assert.deepEqual(manifest.files, (await listFiles(f.output)).filter((file) => file !== 'manifest.json'));
});

test('second run with purged maps is a no-op preserving artifacts and manifest', async (t) => {
  const f = await fixture(t);
  await f.put('static/app.js', 'JS');
  await f.put('static/app.js.map', 'map');
  assert.equal(f.run().status, 0);
  const before = await readFile(path.join(f.output, 'manifest.json'), 'utf8');
  const result = f.run([], { NEXT_PUBLIC_SENTRY_RELEASE: 'different-release' });
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /preserving existing/);
  assert.equal(await readFile(path.join(f.output, 'manifest.json'), 'utf8'), before);
  assert.equal(await readFile(path.join(f.output, '_next/static/app.js.map'), 'utf8'), 'map');
});

test('no source maps produces only a clean empty manifest and supports repeat invocation', async (t) => {
  const f = await fixture(t);
  await f.put('static/app.js', 'JS');
  const result = f.run([], { NEXT_PUBLIC_SENTRY_RELEASE: '', SENTRY_RELEASE: '' });
  assert.equal(result.status, 0, result.stderr);
  assert.deepEqual(await listFiles(f.output), ['manifest.json']);
  const manifest = JSON.parse(await readFile(path.join(f.output, 'manifest.json'), 'utf8'));
  assert.equal(manifest.release, null);
  assert.equal(manifest.sourceMapCount, 0);
  assert.equal(manifest.status, 'no-source-maps');
  assert.deepEqual(manifest.files, []);
  assert.equal(f.run().status, 0);
});

test('absent static directory is a successful empty export, missing build is an error', async (t) => {
  const f = await fixture(t);
  await rm(path.join(f.build, 'static'), { recursive: true });
  assert.equal(f.run().status, 0);
  await rm(f.build, { recursive: true });
  const result = f.run();
  assert.equal(result.status, 1);
  assert.match(result.stderr, /Build directory does not exist/);
});

test('existing output fails explicitly when new maps exist, without purging or clearing', async (t) => {
  const f = await fixture(t);
  await mkdir(f.output, { recursive: true });
  await writeFile(path.join(f.output, 'keep'), 'previous build');
  await f.put('static/app.js', 'JS');
  await f.put('static/app.js.map', 'map');
  const result = f.run();
  assert.equal(result.status, 1);
  assert.match(result.stderr, /Output is not empty/);
  assert.equal(await readFile(path.join(f.output, 'keep'), 'utf8'), 'previous build');
  assert.equal(await readFile(path.join(f.build, 'static/app.js.map'), 'utf8'), 'map');
});

test('missing matching asset fails before export or purge', async (t) => {
  const f = await fixture(t);
  await f.put('static/app.js', 'JS');
  await f.put('static/app.js.map', 'valid map');
  await f.put('static/orphan.js.map', 'orphan');
  const result = f.run();
  assert.equal(result.status, 1);
  assert.match(result.stderr, /no corresponding regular asset/);
  assert.equal(await readFile(path.join(f.build, 'static/app.js.map'), 'utf8'), 'valid map');
  await assert.rejects(readdir(f.output), { code: 'ENOENT' });
});

test('refuses overlapping build/output paths in both directions', async (t) => {
  const f = await fixture(t);
  for (const output of [f.build, path.join(f.build, 'private'), f.root]) {
    const result = spawnSync(process.execPath, [script, '--build-dir', f.build, '--output-dir', output], { encoding: 'utf8' });
    assert.equal(result.status, 1);
    assert.match(result.stderr, /must not overlap/);
  }
});

for (const kind of ['static directory', 'nested directory', 'map', 'asset', 'build ancestor', 'output ancestor', 'output directory', 'build ID']) {
  test(`refuses symlink traversal: ${kind}`, async (t) => {
    const f = await fixture(t);
    const outside = path.join(f.root, 'outside');
    await mkdir(outside);
    await writeFile(path.join(outside, 'secret'), 'untouched');
    let build = f.build;
    let output = f.output;
    if (kind === 'static directory') {
      await rm(path.join(build, 'static'), { recursive: true });
      await symlink(outside, path.join(build, 'static'));
    } else if (kind === 'nested directory') {
      await symlink(outside, path.join(build, 'static/chunks/link'));
    } else if (kind === 'map' || kind === 'asset') {
      await f.put(kind === 'map' ? 'static/app.js' : 'static/app.js.map', 'pair');
      await symlink(path.join(outside, 'secret'), path.join(build, kind === 'map' ? 'static/app.js.map' : 'static/app.js'));
    } else if (kind === 'build ancestor') {
      await symlink(f.root, path.join(f.root, 'alias'));
      build = path.join(f.root, 'alias/.next');
    } else if (kind === 'output ancestor') {
      await symlink(outside, path.join(f.root, '.monitoring-artifacts'));
    } else if (kind === 'output directory') {
      await mkdir(path.dirname(output));
      await symlink(outside, output);
    } else {
      await rm(path.join(build, 'BUILD_ID'));
      await symlink(path.join(outside, 'secret'), path.join(build, 'BUILD_ID'));
    }
    const result = spawnSync(process.execPath, [script, '--build-dir', build, '--output-dir', output], { encoding: 'utf8' });
    assert.equal(result.status, 1);
    assert.match(result.stderr, /Refusing symlink/);
    assert.equal(await readFile(path.join(outside, 'secret'), 'utf8'), 'untouched');
  });
}

test('validates CLI options', async (t) => {
  const f = await fixture(t);
  for (const args of [['--unknown', 'x'], ['--output-dir'], ['--build-dir', f.build]]) {
    const result = f.run(args);
    assert.equal(result.status, 1);
    assert.match(result.stderr, /Usage:/);
  }
});

test('build hook and Docker artifact target keep exported artifacts out of final runner', async () => {
  const frontend = new URL('../../frontend/', import.meta.url);
  const pkg = JSON.parse(await readFile(new URL('package.json', frontend), 'utf8'));
  assert.equal(pkg.scripts.build, 'next build && node scripts/prepare-monitoring-artifacts.mjs');
  const dockerfile = await readFile(new URL('Dockerfile', frontend), 'utf8');
  assert.match(dockerfile, /FROM scratch AS artifacts\s+COPY --from=builder \/app\/\.monitoring-artifacts\/frontend \/frontend/);
  const runner = dockerfile.split('FROM node:20-alpine AS runner')[1];
  assert.ok(runner);
  assert.doesNotMatch(runner, /^FROM /m);
  assert.doesNotMatch(runner, /^COPY frontend frontend/m);
  assert.doesNotMatch(runner, /^COPY .*\.monitoring-artifacts/m);
  assert.match(runner, /COPY --from=builder \/app\/frontend\/\.next frontend\/\.next/);
});