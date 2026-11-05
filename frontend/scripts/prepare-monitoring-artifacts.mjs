#!/usr/bin/env node
/**
 * Offline client artifact export. Run after next build, before deployment.
 * Upload the exported _next/static tree with a source-map CLI using URL prefix
 * ~/_next/static and the release in manifest.json; never serve this directory.
 * Compiled assets (including SDK debug IDs) are copied without modification.
 * Server maps are deliberately separate: archive selected server JS/map pairs
 * privately if needed, not the whole .next/server tree or node_modules.
 */
import { copyFile, lstat, mkdir, mkdtemp, readdir, readFile, rename, rm, rmdir, unlink, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const frontendDir = fileURLToPath(new URL('../', import.meta.url));

function parseOptions(args) {
  const options = {
    buildDir: path.join(frontendDir, '.next'),
    outputDir: undefined,
  };
  const seen = new Set();
  for (let index = 0; index < args.length; index += 2) {
    const option = args[index];
    const value = args[index + 1];
    if (!['--build-dir', '--output-dir'].includes(option) || !value || value.startsWith('--') || seen.has(option)) {
      throw new Error('Usage: prepare-monitoring-artifacts.mjs [--build-dir path] [--output-dir path]');
    }
    seen.add(option);
    options[option === '--build-dir' ? 'buildDir' : 'outputDir'] = path.resolve(value);
  }
  return options;
}

async function statIfExists(target) {
  try {
    return await lstat(target);
  } catch (error) {
    if (error.code === 'ENOENT') return null;
    throw error;
  }
}

// Reject aliases rather than resolving them: neither input nor output may cross
// a symlink, including a symlink in an existing ancestor of a missing directory.
async function assertNoSymlink(target) {
  const parent = path.dirname(target);
  if (parent !== target) await assertNoSymlink(parent);
  const stat = await statIfExists(target);
  if (stat?.isSymbolicLink()) throw new Error(`Refusing symlink: ${target}`);
  return stat;
}

function contains(parent, child) {
  const relative = path.relative(parent, child);
  return relative === '' || (!relative.startsWith(`..${path.sep}`) && relative !== '..' && !path.isAbsolute(relative));
}

async function collectMaps(directory, relative = '') {
  const maps = [];
  for (const entry of (await readdir(directory, { withFileTypes: true })).sort((a, b) => a.name.localeCompare(b.name))) {
    const name = path.join(relative, entry.name);
    const source = path.join(directory, entry.name);
    const stat = await lstat(source);
    if (stat.isSymbolicLink()) throw new Error(`Refusing symlink: ${source}`);
    if (stat.isDirectory()) maps.push(...await collectMaps(source, name));
    else if (!stat.isFile()) throw new Error(`Refusing non-regular file: ${source}`);
    else if (entry.name.endsWith('.map')) maps.push(name);
  }
  return maps;
}

async function prepare({ buildDir, outputDir }) {
  // Keep each build separately so repeated npm builds never overwrite artifacts
  // needed to symbolize an already deployed release.
  if (!outputDir) {
    await assertNoSymlink(buildDir);
    const idFile = path.join(buildDir, 'BUILD_ID');
    await assertNoSymlink(idFile);
    const id = (await readFile(idFile, 'utf8')).trim();
    if (!/^[A-Za-z0-9_-]{1,200}$/.test(id)) throw new Error('Invalid BUILD_ID for artifact directory.');
    outputDir = path.resolve(frontendDir, '../.monitoring-artifacts/frontend', id);
  }
  if (contains(buildDir, outputDir) || contains(outputDir, buildDir)) {
    throw new Error('Build and output directories must not overlap (output must be outside build).');
  }
  const buildStat = await assertNoSymlink(buildDir);
  const outputStat = await assertNoSymlink(outputDir);
  if (!buildStat?.isDirectory()) throw new Error(`Build directory does not exist: ${buildDir}`);
  if (outputStat && !outputStat.isDirectory()) throw new Error('Output must be a directory.');

  const staticDir = path.join(buildDir, 'static');
  const staticStat = await assertNoSymlink(staticDir);
  if (staticStat && !staticStat.isDirectory()) throw new Error('Build static path must be a directory.');
  const maps = staticStat ? await collectMaps(staticDir) : [];
  const existingFiles = outputStat ? await readdir(outputDir) : [];
  if (maps.length === 0 && existingFiles.length > 0) {
    console.log('No public source maps found; preserving existing monitoring artifacts unchanged.');
    return;
  }
  if (existingFiles.length > 0) {
    throw new Error('Output is not empty; use a fresh output directory for this build. Existing artifacts were preserved.');
  }

  // Validate every pair before writing anything or purging a single map.
  const files = new Set();
  for (const map of maps) {
    const asset = map.slice(0, -4);
    const stat = await assertNoSymlink(path.join(staticDir, asset));
    if (!stat?.isFile()) throw new Error(`Source map has no corresponding regular asset: ${map}`);
    files.add(asset);
    files.add(map);
  }
  const buildIdPath = path.join(buildDir, 'BUILD_ID');
  const buildIdStat = await assertNoSymlink(buildIdPath);
  if (buildIdStat && !buildIdStat.isFile()) throw new Error('BUILD_ID must be a regular file.');
  const buildId = buildIdStat ? (await readFile(buildIdPath, 'utf8')).trim() : null;
  const manifest = {
    version: 1,
    release: process.env.NEXT_PUBLIC_SENTRY_RELEASE || process.env.SENTRY_RELEASE || null,
    buildId,
    scope: 'frontend-client',
    status: maps.length ? 'prepared' : 'no-source-maps',
    urlPrefix: '~/_next/static',
    sourceMapCount: maps.length,
    files: [...files].sort().map((file) => `_next/static/${file.split(path.sep).join('/')}`),
    serverArtifacts: 'Excluded. Export selected .next/server JS/map pairs separately; do not copy the full server tree or node_modules.',
  };

  await mkdir(path.dirname(outputDir), { recursive: true });
  const staging = await mkdtemp(path.join(path.dirname(outputDir), '.frontend-artifacts-'));
  try {
    for (const file of files) {
      const target = path.join(staging, '_next/static', file);
      await mkdir(path.dirname(target), { recursive: true });
      await copyFile(path.join(staticDir, file), target);
    }
    await writeFile(path.join(staging, 'manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`);
    if (outputStat) await rmdir(outputDir); // Only an empty, validated directory.
    await rename(staging, outputDir);
  } catch (error) {
    await rm(staging, { recursive: true, force: true });
    throw error;
  }

  // Publication is complete before purge. A failure is fatal, never a successful
  // build with unarchived maps or an attempted automatic network upload.
  for (const map of maps) await unlink(path.join(staticDir, map));
  console.log(`Prepared ${maps.length} client source maps in ${outputDir}; removed public maps. Server artifacts excluded.`);
}

try {
  await prepare(parseOptions(process.argv.slice(2)));
} catch (error) {
  console.error(`Monitoring artifact preparation failed: ${error.message}`);
  process.exitCode = 1;
}