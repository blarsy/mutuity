// Opt-in: node scripts/tests/monitoring-stack.integration.mjs
// Requires Docker/Compose and the three cached deployment images. No pulls,
// production env, published ports, external egress, live events or monitors.
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { randomBytes } from 'node:crypto';
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { setTimeout } from 'node:timers/promises';

const root = fileURLToPath(new URL('../../', import.meta.url));
const project = `mutuity-monitoring-smoke-${randomBytes(12).toString('hex')}`;
const dir = mkdtempSync(path.join(tmpdir(), `${project}-`));
const composeFile = path.join(root, 'docker-compose.monitoring.yml');
const testCaddyfile = path.join(root, 'deploy/caddy/Caddyfile.test');
const envFile = path.join(dir, 'smoke.env');
const overrideFile = path.join(dir, 'isolation.json');
const MiB = 1024 * 1024;
const caps = { postgres: 128 * MiB, glitchtip: 320 * MiB };
const caddyCap = 48 * MiB;
const host = 'errors.test.tope-la.com';
const edgeNetwork = `${project}-test-edge`;
const secrets = [randomBytes(32).toString('hex'), randomBytes(48).toString('hex'), randomBytes(32).toString('hex')];
// Do not inherit Compose overrides, shell interpolation values or app secrets.
// Retain only CLI transport/user settings needed to reach the selected daemon.
const cliEnv = Object.fromEntries(Object.entries(process.env).filter(([key]) =>
  ['PATH', 'HOME', 'TMPDIR', 'USER', 'SYSTEMROOT', 'XDG_RUNTIME_DIR'].includes(key) || key.startsWith('DOCKER_')));
const redact = text => secrets.reduce((result, secret) => result.replaceAll(secret, '[redacted]'), String(text));
let started = false;
let edgeCreated = false;
let composeArgs;
let receivedSignal;
for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, () => { receivedSignal = signal; });

function run(args, { input, ok = true, timeout = 120_000 } = {}) {
  const result = spawnSync('docker', args, {
    cwd: root, env: cliEnv, input, encoding: 'utf8', maxBuffer: 16 * MiB, timeout,
  });
  if (ok && (result.error || result.status !== 0)) {
    // Arguments can contain credentials, so deliberately do not print argv.
    throw new Error(redact(`Docker command failed (${result.status}): ${result.error || ''}\n${result.stdout || ''}\n${result.stderr || ''}`));
  }
  return result;
}
const docker = (...args) => run(args).stdout.trim();
const compose = (...args) => docker(...composeArgs, ...args);
const resources = kind => docker(kind, 'ls', '-q', '--filter', `label=com.docker.compose.project=${project}`).split(/\s+/).filter(Boolean);
const containerIds = () => docker('ps', '-aq', '--filter', `label=com.docker.compose.project=${project}`).split(/\s+/).filter(Boolean);
const inspect = id => JSON.parse(docker('inspect', id))[0];
const serviceId = service => {
  const ids = compose('ps', '-aq', service).split(/\s+/).filter(Boolean);
  assert.equal(ids.length, 1, `Exactly one ${service} container expected`);
  return ids[0];
};
const sql = (id, query) => docker('exec', id, 'psql', '-X', '--no-password', '-v', 'ON_ERROR_STOP=1', '-U', 'glitchtip', '-d', 'glitchtip', '-Atqc', query);
const python = (id, code) => docker('exec', id, 'python', '-c', code);

function assertRunning(id) {
  const info = inspect(id);
  assert.equal(info.State.Running, true, `${info.Name} must stay running`);
  assert.equal(info.State.OOMKilled, false, `${info.Name} OOMKilled`);
  assert.equal(info.RestartCount, 0, `${info.Name} restarted`);
  return info;
}

const httpCode = `
import json, urllib.request
opener = urllib.request.build_opener(urllib.request.ProxyHandler({}))
results = []
for endpoint in ("/_health/", "/api/0/internal/health/", "/"):
    request = urllib.request.Request("http://127.0.0.1:8000" + endpoint, headers={"Host": "${host}"})
    with opener.open(request, timeout=5) as response:
        body = response.read().decode()
        assert response.status == 200, (endpoint, response.status)
        if endpoint == "/_health/": assert body == "ok", body
        if endpoint == "/api/0/internal/health/": assert json.loads(body) == {"healthy": {}, "problems": []}, body
        if endpoint == "/": assert "<html" in body.lower(), body[:100]
        results.append({"path": endpoint, "status": response.status, "bytes": len(body)})
print(json.dumps(results))
`;

const edgeAliasProbe = `
import urllib.request
request = urllib.request.Request("http://${project}-glitchtip:8000/_health/", headers={"Host": "${host}"})
with urllib.request.urlopen(request, timeout=5) as response:
  body = response.read().decode()
  assert response.status == 200 and body == "ok", (response.status, body)
print("shared-edge-alias=200")
`;

// Kernel counters include short boot/management-command peaks that docker stats
// alone misses. v1 and v2 are both supported (Docker 20 commonly uses v1).
const memoryCode = `
import json
from pathlib import Path
base = Path("/sys/fs/cgroup")
def number(file):
    p = base / file
    return int(p.read_text().strip()) if p.exists() else None
if (base / "memory.current").exists():
    events = dict(line.split() for line in (base / "memory.events").read_text().splitlines())
    result = {"currentBytes": number("memory.current"), "peakBytes": number("memory.peak"), "limitBytes": number("memory.max"), "oom": int(events.get("oom", 0)), "oomKill": int(events.get("oom_kill", 0))}
else:
    result = {"currentBytes": number("memory/memory.usage_in_bytes"), "peakBytes": number("memory/memory.max_usage_in_bytes"), "limitBytes": number("memory/memory.limit_in_bytes"), "limitHits": number("memory/memory.failcnt")}
print(json.dumps(result))
`;

async function until(description, check, seconds = 240) {
  const deadline = Date.now() + seconds * 1000;
  let lastError;
  while (Date.now() < deadline) {
    if (receivedSignal) throw new Error(`Interrupted by ${receivedSignal}`);
    try { return check(); } catch (error) { lastError = error; }
    await setTimeout(1000);
  }
  throw new Error(`${description} timed out: ${lastError?.message}`);
}

try {
  writeFileSync(envFile, [
    `MONITORING_HOST=${host}`, `EDGE_NETWORK_NAME=${edgeNetwork}`,
    `MONITORING_EDGE_ALIAS=${project}-glitchtip`,
    `GLITCHTIP_DB_PASSWORD=${secrets[0]}`, `GLITCHTIP_SECRET_KEY=${secrets[1]}`,
    'GLITCHTIP_EMAIL_URL=consolemail://', 'GLITCHTIP_FROM_EMAIL=smoke@example.invalid', '',
  ].join('\n'), { mode: 0o600 });
  // Model Test ingress with a uniquely named Docker-internal external network.
  // Test Caddy is validated separately and never started/published here.
  writeFileSync(overrideFile, JSON.stringify({ networks: { edge: { external: true, name: edgeNetwork } } }), { mode: 0o600 });
  const baseArgs = ['compose', '--project-directory', root, '--env-file', envFile, '-p', project, '-f', composeFile];
  composeArgs = baseArgs;
  const original = JSON.parse(compose('config', '--format', 'json'));
  assert.deepEqual(Object.keys(original.services).sort(), Object.keys(caps).sort());
  assert.equal(Object.values(original.services).reduce((sum, service) => sum + Number(service.mem_limit), 0), 448 * MiB);
  for (const [name, bytes] of Object.entries(caps)) {
    const service = original.services[name];
    assert.equal(Number(service.mem_limit), bytes);
    assert.equal(Number(service.memswap_limit), bytes, `${name}: swap must not hide memory pressure`);
    assert.ok(!service.container_name && !service.network_mode && !service.privileged);
    assert.ok(!(service.env_file?.length), 'Do not load additional environment files');
    docker('image', 'inspect', service.image); // cached only; no manifest/pull requirement
  }
  assert.equal(original.services.glitchtip.environment.SERVER_ROLE, 'all_in_one');
  assert.equal(original.services.glitchtip.environment.VALKEY_URL, '');
  for (const name of ['postgres', 'glitchtip']) {
    assert.ok(!original.services[name].ports?.length, `${name}: no published ports`);
    assert.ok(!original.services[name].volumes.some(volume => volume.type !== 'volume'), 'Only fresh named volumes allowed');
  }
  for (const value of Object.values(original.volumes)) {
    assert.ok(!value.external);
    assert.ok(value.name.startsWith(`${project}_`), 'Resources must belong only to the unique project');
  }
  assert.equal(original.networks.database.internal, true);
  assert.equal(original.networks.edge.external, true);
  assert.equal(original.networks.edge.name, edgeNetwork);
  assert.deepEqual(containerIds(), []);
  assert.deepEqual(resources('volume'), []);
  assert.deepEqual(resources('network'), []);
  console.log(`Project: ${project}`);
  console.log(`Docker ${docker('version', '--format', '{{.Server.Version}}')}; ${docker('compose', 'version')}`);
  console.log(`Daemon: ${docker('info', '--format', 'memoryBytes={{.MemTotal}} cpus={{.NCPU}}')}`);
  console.log('Parsed deployment caps: postgres=128MiB glitchtip=320MiB total=448MiB; Test app and shared Caddy are additional host workload; swap disabled');
  for (const [name, service] of Object.entries(original.services)) console.log(`${name} image: ${service.image} (${docker('image', 'inspect', '--format', '{{.Id}}', service.image)})`);

  composeArgs = [...baseArgs, '-f', overrideFile];
  const isolated = JSON.parse(compose('config', '--format', 'json'));
  assert.deepEqual(isolated.services, original.services, 'Isolation must not alter deployment services');
  assert.equal(isolated.networks.database.internal, true);
  assert.equal(isolated.networks.edge.external, true);
  assert.equal(isolated.networks.edge.name, edgeNetwork);

  // validate only: no server, DNS, ACME/certificate requests, ports or volumes.
  started = true;
  console.log(docker('run', '--rm', '--pull=never', '--network', 'none', '--name', `${project}-caddy-validate`,
    '--label', `com.docker.compose.project=${project}`, '--memory', String(caddyCap), '--memory-swap', String(caddyCap),
    '-e', `MONITORING_HOST=${host}`, '-e', `TEST_GLITCHTIP_UPSTREAM=${project}-glitchtip:8000`,
    '-e', 'TEST_FRONTEND_UPSTREAM=frontend-test:3000', '-e', 'TEST_API_UPSTREAM=backend-test:5050',
    '-e', 'CADDY_EMAIL=smoke@example.invalid',
    '--mount', `type=bind,src=${testCaddyfile},dst=/etc/caddy/Caddyfile,readonly`,
    'caddy:2', 'caddy', 'validate', '--config', '/etc/caddy/Caddyfile', '--adapter', 'caddyfile'));
  console.log('Shared Test Caddy offline validation PASS (no ingress server/certificates started)');
  docker('network', 'create', '--internal', '--label', `com.docker.compose.project=${project}`, edgeNetwork);
  edgeCreated = true;
  console.log(compose('up', '-d', '--no-build', '--pull', 'never', 'postgres', 'glitchtip'));
  const pg = serviceId('postgres');
  const app = serviceId('glitchtip');
  assert.equal(containerIds().length, 2);
  for (const [name, id] of [['postgres', pg], ['glitchtip', app]]) {
    const info = inspect(id);
    assert.equal(info.HostConfig.Memory, caps[name]);
    assert.equal(info.HostConfig.MemorySwap, caps[name]);
    assert.ok(!Object.keys(info.HostConfig.PortBindings || {}).length);
    assert.equal(info.Config.Labels['com.docker.compose.project'], project);
    assert.equal(JSON.parse(docker('network', 'inspect', `${project}_database`))[0].Internal, true);
    assert.equal(JSON.parse(docker('network', 'inspect', edgeNetwork))[0].Internal, true);
  }
  const bootStarted = Date.now();
  const responses = await until('GlitchTip local HTTP readiness', () => {
    assertRunning(pg);
    assertRunning(app);
    return JSON.parse(python(app, httpCode));
  });
  console.log(`HTTP readiness after ${((Date.now() - bootStarted) / 1000).toFixed(1)}s: ${JSON.stringify(responses)}`);
  assert.match(python(app, edgeAliasProbe), /shared-edge-alias=200/);
  console.log('Test Caddy upstream alias resolves over the shared edge network PASS');
  console.log(`PostgreSQL: ${sql(pg, 'SELECT version()')}`);
  assert.equal(inspect(pg).State.Health.Status, 'healthy');
  assert.match(sql(pg, 'SELECT count(*) FROM django_migrations'), /^[1-9]\d*$/);
  console.log(`Applied migration count: ${sql(pg, 'SELECT count(*) FROM django_migrations')}`);
  docker('exec', app, 'python', 'manage.py', 'migrate', '--check', '--noinput');
  console.log('Migration completeness: manage.py migrate --check PASS');
  docker('exec', '-e', 'DJANGO_SUPERUSER_EMAIL=admin@example.invalid', '-e', `DJANGO_SUPERUSER_PASSWORD=${secrets[2]}`,
    app, 'python', 'manage.py', 'createsuperuser', '--noinput');
  const settingsCode = `
import json, os
from django.conf import settings
from django.contrib.auth import get_user_model
from django_vtasks.conf import settings as vtasks_settings
from django.core.cache import cache
user = get_user_model().objects.get(email="admin@example.invalid")
assert user.is_superuser and user.is_staff and user.is_active
assert user.check_password(os.environ["SMOKE_PASSWORD"])
assert not settings.VALKEY_URL
assert settings.TASKS["default"]["BACKEND"] == "django_vtasks.backends.db.DatabaseTaskBackend"
assert settings.GLITCHTIP_ENABLE_UPTIME and not settings.GLITCHTIP_UPTIME_ALLOW_PRIVATE_IPS
assert "uptime-dispatch-checks" in settings.VTASKS_SCHEDULE
assert vtasks_settings.VTASKS_CONCURRENCY == 2
print("SMOKE_SETTINGS=" + json.dumps({"superuser": True, "uptimeEnabled": settings.GLITCHTIP_ENABLE_UPTIME, "privateUptimeBlocked": not settings.GLITCHTIP_UPTIME_ALLOW_PRIVATE_IPS, "backend": settings.TASKS["default"]["BACKEND"], "concurrency": vtasks_settings.VTASKS_CONCURRENCY, "uptimeTick": cache.get("uptime_counter")}))
`;
  console.log(redact(docker('exec', '-e', `SMOKE_PASSWORD=${secrets[2]}`, app, 'python', 'manage.py', 'shell', '-c', settingsCode)));
  console.log('Noninteractive disposable superuser + password verification PASS');
  // dispatch_checks increments this DB cache key only when the embedded worker
  // actually executes the scheduled uptime task. No monitor/alert is created.
  const tickQuery = "SELECT value FROM django_cache WHERE cache_key LIKE '%:uptime_counter'";
  const firstTick = sql(pg, tickQuery);
  assert.ok(firstTick, 'Uptime task must have written its cache counter');
  let distinctTicks = 0;
  let previousTick = firstTick;
  const observationStarted = Date.now();
  while (Date.now() - observationStarted < 30_000) {
    if (receivedSignal) throw new Error(`Interrupted by ${receivedSignal}`);
    assertRunning(pg);
    assertRunning(app);
    const tick = sql(pg, tickQuery);
    if (tick && tick !== previousTick) distinctTicks++;
    previousTick = tick;
    python(app, httpCode);
    await setTimeout(1000);
  }
  assert.ok(distinctTicks >= 5, `Uptime scheduler stalled: only ${distinctTicks} observed updates`);
  assert.equal(sql(pg, "SELECT count(*) FROM db_queuedtask WHERE status='FAILED'"), '0');
  console.log(`Embedded worker + uptime scheduling PASS: ${distinctTicks} observed counter changes over ${((Date.now() - observationStarted) / 1000).toFixed(1)}s; zero failed tasks; no live monitors/events`);
  for (const [name, id] of [['postgres', pg], ['glitchtip', app]]) {
    const info = assertRunning(id);
    // PostgreSQL has no Python. Read its cgroup counters with its own shell.
    const memory = name === 'glitchtip' ? JSON.parse(python(id, memoryCode)) :
      docker('exec', id, 'sh', '-c', 'for f in /sys/fs/cgroup/memory.current /sys/fs/cgroup/memory.peak /sys/fs/cgroup/memory.events /sys/fs/cgroup/memory/memory.usage_in_bytes /sys/fs/cgroup/memory/memory.max_usage_in_bytes /sys/fs/cgroup/memory/memory.failcnt; do if test -f "$f"; then echo "$f"; cat "$f"; fi; done');
    console.log(`${name}: OOMKilled=${info.State.OOMKilled} restarts=${info.RestartCount} capBytes=${info.HostConfig.Memory} cgroup=${JSON.stringify(memory)}`);
    if (typeof memory === 'object') {
      assert.equal(memory.oom || 0, 0);
      assert.equal(memory.oomKill || 0, 0);
      assert.equal(memory.limitHits || 0, 0);
      assert.equal(memory.limitBytes, caps[name]);
    } else {
      assert.ok(!/oom(?:_kill)? [1-9]/.test(memory));
      const hits = memory.match(/memory\.failcnt\n(\d+)/);
      if (hits) assert.equal(Number(hits[1]), 0);
    }
  }
  console.log(docker('stats', '--no-stream', '--format', '{{.Name}} {{.MemUsage}} CPU={{.CPUPerc}}', pg, app));
  console.log('Monitoring deployment smoke PASS (not a load test or 512MiB-host capacity guarantee)');
} catch (error) {
  console.error(redact(error.stack || error));
  if (started) for (const id of containerIds()) {
    const info = inspect(id);
    console.error(`${info.Name}: ${JSON.stringify(info.State)} restarts=${info.RestartCount}`);
    const logs = run(['logs', '--tail', '100', id], { ok: false });
    console.error(redact(`${logs.stdout}\n${logs.stderr}`));
  }
  process.exitCode = 1;
} finally {
  try {
    if (started) {
      // -p and both explicit -f paths scope down to this project only. Never use
      // prune or remove any images, bind data, production containers or volumes.
      const result = run([...composeArgs, 'down', '--volumes', '--remove-orphans', '--timeout', '10'], { ok: false });
      if (result.status !== 0) console.error(redact(result.stderr));
      for (const id of containerIds()) docker('rm', '-f', id);
      for (const id of resources('volume')) docker('volume', 'rm', id);
      for (const id of resources('network')) {
        const network = JSON.parse(docker('network', 'inspect', id))[0];
        if (network.Name !== edgeNetwork) docker('network', 'rm', id);
      }
      if (edgeCreated && run(['network', 'inspect', edgeNetwork], { ok: false }).status === 0) {
        docker('network', 'rm', edgeNetwork);
      }
      assert.deepEqual(containerIds(), []);
      assert.deepEqual(resources('volume'), []);
      assert.deepEqual(resources('network'), []);
      assert.equal(run(['network', 'inspect', edgeNetwork], { ok: false }).status, 1);
      console.log(`Cleanup PASS: no containers/volumes/networks remain for ${project}`);
    }
  } catch (error) {
    process.exitCode = 1;
    console.error(`Cleanup FAILED for ${project}: ${redact(error.message)}`);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}