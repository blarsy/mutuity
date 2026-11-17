#!/usr/bin/env node
// No dependency installation needed: fail before starting expensive CI builds.
import { mkdir, writeFile, appendFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';

export function releaseInputs(env) {
  const { TARGET_ENVIRONMENT: target, RELEASE_SERVICES: services, GITHUB_SHA: revision,
    GITHUB_REPOSITORY: repository, GITHUB_RUN_ID: run, GITHUB_RUN_ATTEMPT: attempt } = env;
  if (!['test', 'review', 'prod'].includes(target)) throw new Error('Invalid target environment.');
  if (!['all', 'backend', 'frontend'].includes(services)) throw new Error('Invalid service selection.');
  if (!/^[a-f0-9]{40}$/.test(revision || '')) throw new Error('Expected a full Git commit SHA.');
  if (!/^[a-z0-9][a-z0-9-]*\/[a-z0-9_][a-z0-9_.-]*$/i.test(repository || '')) throw new Error('Invalid repository.');
  if (!/^\d+$/.test(run || '') || !/^\d+$/.test(attempt || '')) throw new Error('Invalid run identity.');
  const base = `ghcr.io/${repository.toLowerCase()}`;
  const tag = `${revision}-${run}-${attempt}`;
  const result = {
    target, services, revision,
    backend: `${base}-backend`, frontend: `${base}-frontend`,
    backend_tag: `${base}-backend:${tag}`, frontend_tag: `${base}-frontend:${target}-${tag}`,
    build_args: '',
  };
  if (services !== 'backend') {
    let config;
    try { config = JSON.parse(env.FRONTEND_BUILD_CONFIG || ''); }
    catch { throw new Error('Set FRONTEND_BUILD_CONFIG to a public-settings JSON object in the selected GitHub Environment.'); }
    if (!config || Array.isArray(config) || typeof config !== 'object') throw new Error('Invalid frontend config object.');
    const defaults = {
      NEXT_PUBLIC_GRAPHQL_URL: '', NEXT_PUBLIC_GRAPHQL_WS_URL: '', NEXT_PUBLIC_BACKEND_URL: '',
      NEXT_PUBLIC_DEFAULT_LOCALE: 'fr', NEXT_PUBLIC_CLOUDINARY_CLOUD: '',
      NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET: '', NEXT_PUBLIC_GOOGLE_MAPS_API_KEY: '',
      NEXT_PUBLIC_TOKEN_BALANCE_POLL_INTERVAL_MS: '', NEXT_PUBLIC_SENTRY_DSN: '',
      NEXT_PUBLIC_SENTRY_ENVIRONMENT: target === 'prod' ? 'production' : target,
      NEXT_PUBLIC_SENTRY_TRACES_SAMPLE_RATE: '0.01',
    };
    for (const [key, value] of Object.entries(config)) {
      if (!Object.hasOwn(defaults, key) || typeof value !== 'string' || /[\r\n\0]/.test(value)) {
        throw new Error('Frontend config must contain only allowlisted public string settings; release is set by CI.');
      }
    }
    const values = { ...defaults, ...config, NEXT_PUBLIC_SENTRY_RELEASE: revision };
    for (const [key, protocol] of Object.entries({
      NEXT_PUBLIC_GRAPHQL_URL: 'https:', NEXT_PUBLIC_GRAPHQL_WS_URL: 'wss:', NEXT_PUBLIC_BACKEND_URL: 'https:',
    })) {
      let url;
      try { url = new URL(values[key]); } catch { throw new Error(`Missing or invalid ${key}.`); }
      if (url.protocol !== protocol || url.username || url.password || url.search || url.hash) {
        throw new Error(`Expected a public ${protocol} URL without credentials/query/fragment for ${key}.`);
      }
    }
    result.build_args = Object.entries(values).map(([key, value]) => `${key}=${value}`).join('\n');
  }
  return result;
}

export function releaseManifest(inputs, env) {
  const lines = [`RELEASE_COMMIT=${inputs.revision}`, `RELEASE_ENVIRONMENT=${inputs.target}`];
  for (const service of ['backend', 'frontend']) {
    if (inputs.services !== 'all' && inputs.services !== service) continue;
    const digest = env[`${service.toUpperCase()}_DIGEST`];
    if (!/^sha256:[a-f0-9]{64}$/.test(digest || '')) throw new Error(`Missing/invalid ${service} image digest.`);
    lines.push(`${service.toUpperCase()}_IMAGE=${inputs[service]}@${digest}`);
  }
  return `${lines.join('\n')}\n`;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    const inputs = releaseInputs(process.env);
    if (process.argv[2] === 'manifest') {
      await mkdir('.release-artifacts', { recursive: true });
      const manifest = releaseManifest(inputs, process.env);
      await writeFile('.release-artifacts/release.env', manifest);
      if (process.env.GITHUB_STEP_SUMMARY) await appendFile(process.env.GITHUB_STEP_SUMMARY,
        `## Published ${inputs.target} images\n\nCommit: ${inputs.revision}\n\n\`\`\`text\n${manifest}\`\`\`\n\nDownload the release manifest. Publishing does **not** deploy.\n${inputs.services !== 'backend' && process.env.REPOSITORY_PRIVATE !== 'true' ? '\n**Frontend source maps were not retained:** client stack traces cannot be symbolicated for this exact build.\n' : ''}`);
    } else {
      if (inputs.services !== 'backend' && process.env.REPOSITORY_PRIVATE !== 'true') {
        console.warn('::warning::Frontend source maps will not be retained for this public repository; client stack traces cannot be symbolicated for this exact build.');
      }
      const output = ['backend_tag', 'frontend_tag', 'build_args'].map(key =>
        `${key}<<MUTUITY_OUTPUT\n${inputs[key]}\nMUTUITY_OUTPUT\n`).join('');
      if (!process.env.GITHUB_OUTPUT) throw new Error('GITHUB_OUTPUT is required.');
      await appendFile(process.env.GITHUB_OUTPUT, output);
    }
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}