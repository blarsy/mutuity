// Opt-in: Docker + cached PostgreSQL 16 image + age/age-keygen on PATH.
// No Compose, ports, network, production env, storage credentials or services.
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { randomBytes, createHash } from 'node:crypto';
import { mkdtempSync, writeFileSync, readFileSync, rmSync, chmodSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { setTimeout } from 'node:timers/promises';

const image = process.env.BACKUP_TEST_PG_IMAGE || 'postgres:16';
const prefix = `mutuity-backup-smoke-${randomBytes(12).toString('hex')}`;
const dir = mkdtempSync(path.join(tmpdir(), `${prefix}-`));
const containers = [];
const volumes = [];
function run(command, args, input, ok = true) {
  const result = spawnSync(command, args, { input, maxBuffer: 32 * 1024 * 1024 });
  if (ok && (result.error || result.status !== 0)) throw new Error(`${command} failed: ${result.error?.message ?? result.stderr}`);
  return result;
}
const docker = (...args) => run('docker', args).stdout.toString().trim();
function sql(name, user, database, text) {
  return docker('exec', name, 'psql', '-X', '--no-password', '-v', 'ON_ERROR_STOP=1',
    '-U', user, '-d', database, '-Atqc', text);
}
async function start(suffix, user, database, rootPassword = false) {
  const name = `${prefix}-${suffix}`;
  const volume = `${name}-data`;
  assert.equal(docker('ps', '-aq', '--filter', `name=^/${name}$`), '');
  assert.notEqual(run('docker', ['volume', 'inspect', volume], undefined, false).status, 0);
  docker('volume', 'create', volume);
  volumes.push(volume);
  // Match the documented default-root entrypoint and private password bind.
  const password = path.join(dir, `${suffix}-password`);
  writeFileSync(password, randomBytes(32).toString('hex') + '\n', { mode: 0o600 });
  containers.push(name);
  docker('run', '-d', '--pull=never', '--name', name, '--network', 'none',
    '--mount', `type=volume,src=${volume},dst=/var/lib/postgresql/data`,
    '--mount', `type=bind,src=${password},dst=/run/bootstrap-password,readonly`,
    '-e', `POSTGRES_USER=${user}`, '-e', `POSTGRES_DB=${database}`,
    '-e', 'POSTGRES_PASSWORD_FILE=/run/bootstrap-password',
    ...(rootPassword ? ['--entrypoint', 'bash'] : []), image,
    ...(rootPassword ? ['-eu', '-c',
      'install -o root -g root -m 0600 /run/bootstrap-password /run/root-password; export POSTGRES_PASSWORD_FILE=/run/root-password; exec /usr/local/bin/docker-entrypoint.sh postgres'] : []));
  for (let attempt = 0; attempt < 60; attempt++) {
    const ready = run('docker', ['exec', name, 'sh', '-c',
      'test "$(cat /proc/1/comm)" = postgres && pg_isready -U "$POSTGRES_USER" -d "$POSTGRES_DB"'], undefined, false);
    if (ready.status === 0) {
      assert.equal(docker('inspect', '--format', '{{.HostConfig.NetworkMode}}', name), 'none');
      assert.equal(docker('port', name), '');
      return name;
    }
    await setTimeout(1000);
  }
  throw new Error(`Readiness timeout: ${docker('logs', name)}`);
}

try {
  run('age', ['--version']);
  run('age-keygen', ['--version']);
  docker('image', 'inspect', image); // Do not pull or mutate an existing image.
  const source = await start('source', 'postgres', 'backup_smoke');
  assert.match(sql(source, 'postgres', 'backup_smoke', 'SHOW server_version_num'), /^16\d{4}$/);
  console.log(`PostgreSQL: ${sql(source, 'postgres', 'backup_smoke', 'SELECT version()')}`);
  console.log(`Image: ${docker('image', 'inspect', '--format', '{{.Id}}', image)}`);
  sql(source, 'postgres', 'backup_smoke', `
    CREATE ROLE smoke_owner NOLOGIN;
    CREATE ROLE smoke_reader LOGIN PASSWORD 'disposable-smoke-only';
    GRANT smoke_owner TO smoke_reader WITH ADMIN FALSE, INHERIT FALSE, SET TRUE;
    CREATE SCHEMA smoke AUTHORIZATION smoke_owner;
    SET ROLE smoke_owner;
    CREATE TABLE smoke.items(id integer PRIMARY KEY, owner_name text NOT NULL, payload text);
    INSERT INTO smoke.items VALUES (1, 'smoke_reader', 'retained'), (2, 'other', 'private');
    ALTER TABLE smoke.items ENABLE ROW LEVEL SECURITY;
    ALTER TABLE smoke.items FORCE ROW LEVEL SECURITY;
    CREATE POLICY own_items ON smoke.items TO smoke_reader USING (owner_name = current_user);
    GRANT USAGE ON SCHEMA smoke TO smoke_reader;
    GRANT SELECT ON smoke.items TO smoke_reader;
    CREATE FUNCTION smoke.answer() RETURNS integer LANGUAGE sql SECURITY DEFINER
      SET search_path = pg_catalog AS 'SELECT 42';
    REVOKE ALL ON FUNCTION smoke.answer() FROM PUBLIC;
    GRANT EXECUTE ON FUNCTION smoke.answer() TO smoke_reader;
    RESET ROLE;
    CREATE TABLE public.schema_migrations(version integer PRIMARY KEY);
    INSERT INTO public.schema_migrations VALUES (162), (163);
  `);
  const roles = run('docker', ['exec', source, 'sh', '-eu', '-c',
    'exec pg_dumpall --no-password --username="${POSTGRES_USER:-postgres}" --database="${POSTGRES_DB:-mutuity}" --roles-only']).stdout;
  writeFileSync(path.join(dir, 'roles.sql'), roles);
  const dump = run('docker', ['exec', source, 'sh', '-eu', '-c',
    'exec pg_dump --no-password --username="${POSTGRES_USER:-postgres}" --dbname="${POSTGRES_DB:-mutuity}" --format=custom --compress=9 --create']).stdout;
  writeFileSync(path.join(dir, 'database.dump'), dump);
  const toc = run('docker', ['exec', '-i', source, 'pg_restore', '--list'], dump).stdout;
  writeFileSync(path.join(dir, 'toc.txt'), toc);
  writeFileSync(path.join(dir, 'manifest.txt'), 'format=1\npostgres_major=16\nfixture=synthetic-only\n');
  run('age-keygen', ['-o', path.join(dir, 'identity')]);
  const recipient = run('age-keygen', ['-y', path.join(dir, 'identity')]).stdout.toString().trim();
  run('tar', ['-C', dir, '-cf', path.join(dir, 'bundle.tar'), 'roles.sql', 'database.dump', 'toc.txt', 'manifest.txt']);
  run('age', ['--recipient', recipient, '--output', path.join(dir, 'bundle.tar.age'), path.join(dir, 'bundle.tar')]);
  const encrypted = readFileSync(path.join(dir, 'bundle.tar.age'));
  run('age', ['--decrypt', '--identity', path.join(dir, 'identity'), '--output', path.join(dir, 'decrypted.tar'), path.join(dir, 'bundle.tar.age')]);
  assert.deepEqual(readFileSync(path.join(dir, 'decrypted.tar')), readFileSync(path.join(dir, 'bundle.tar')));
  const entries = run('tar', ['-tf', path.join(dir, 'decrypted.tar')]).stdout.toString().trim().split('\n').sort();
  assert.deepEqual(entries, ['database.dump', 'manifest.txt', 'roles.sql', 'toc.txt']);
  run('tar', ['--extract', '--file', path.join(dir, 'decrypted.tar'), '--no-same-owner', '--no-same-permissions', '-C', dir]);
  assert.deepEqual(readFileSync(path.join(dir, 'database.dump')), dump);
  assert.deepEqual(readFileSync(path.join(dir, 'roles.sql')), roles);
  const corrupted = Buffer.from(encrypted);
  corrupted[corrupted.length - 1] ^= 1;
  writeFileSync(path.join(dir, 'corrupted.age'), corrupted);
  assert.notEqual(run('age', ['--decrypt', '--identity', path.join(dir, 'identity'), '--output', path.join(dir, 'rejected.tar'), path.join(dir, 'corrupted.age')], undefined, false).status, 0);
  console.log(`age round-trip + tamper rejection PASS; encrypted bytes=${encrypted.length}, sha256=${createHash('sha256').update(encrypted).digest('hex')}`);

  // Keep the source initdb superuser at PG's special bootstrap role OID (10).
  const bootstrap = 'postgres';
  const target = await start('restore', bootstrap, 'postgres');
  assert.equal(sql(target, bootstrap, 'postgres', "SELECT rolname FROM pg_roles WHERE rolname !~ '^pg_' ORDER BY rolname"), bootstrap);
  assert.equal(sql(target, bootstrap, 'postgres', "SELECT oid FROM pg_roles WHERE rolname='postgres' AND rolsuper"), '10');
  run('docker', ['exec', '-i', target, 'pg_restore', '--list'], readFileSync(path.join(dir, 'database.dump')));
  // Only reconcile this one explicitly inventoried initdb role on a fresh target.
  // Retain every ALTER ROLE (including password hash) and membership statement.
  assert.equal(roles.toString().split('\n').filter(line => line === 'CREATE ROLE postgres;').length, 1);
  const restoreRoles = run('awk', ['-v', `bootstrap=${bootstrap}`, `
    $0 == "CREATE ROLE " bootstrap ";" {
      print "-- inventoried bootstrap role already created by initdb"; next
    }
    { print }
  `, path.join(dir, 'roles.sql')]).stdout;
  run('docker', ['exec', '-i', target, 'psql', '-X', '--no-password', '-v', 'ON_ERROR_STOP=1', '--single-transaction', '-U', bootstrap, '-d', 'postgres'], restoreRoles);
  run('docker', ['exec', '-i', target, 'pg_restore', '--no-password', '--exit-on-error', '--create', '-U', bootstrap, '--dbname=template1'], readFileSync(path.join(dir, 'database.dump')));
  const inventory = [
    `SELECT row(rolname, rolsuper, rolinherit, rolcreaterole, rolcreatedb, rolcanlogin, rolreplication, rolconnlimit, rolpassword, rolvaliduntil, rolbypassrls)::text FROM pg_authid WHERE rolname IN ('postgres','smoke_owner','smoke_reader') ORDER BY rolname`,
    `SELECT row(r.rolname, m.rolname, g.rolname, a.admin_option, a.inherit_option, a.set_option)::text FROM pg_auth_members a JOIN pg_roles r ON r.oid=a.roleid JOIN pg_roles m ON m.oid=a.member JOIN pg_roles g ON g.oid=a.grantor WHERE r.rolname='smoke_owner' ORDER BY m.rolname`,
    `SELECT row(n.nspname, n.nspowner::regrole, n.nspacl)::text FROM pg_namespace n WHERE n.nspname='smoke'`,
    `SELECT row(relname, relowner::regrole, relacl, relrowsecurity, relforcerowsecurity)::text FROM pg_class WHERE relnamespace='smoke'::regnamespace ORDER BY relname`,
    `SELECT row(policyname, permissive, roles, cmd, qual, with_check)::text FROM pg_policies WHERE schemaname='smoke' ORDER BY policyname`,
    `SELECT row(proname, proowner::regrole, prosecdef, proacl, proconfig, pg_get_functiondef(oid))::text FROM pg_proc WHERE pronamespace='smoke'::regnamespace`,
    `TABLE smoke.items ORDER BY id`,
    `TABLE public.schema_migrations ORDER BY version`,
    `SET ROLE smoke_reader; SELECT * FROM smoke.items ORDER BY id; SELECT smoke.answer()`,
  ];
  for (const query of inventory) assert.equal(sql(target, bootstrap, 'backup_smoke', query), sql(source, 'postgres', 'backup_smoke', query));
  assert.equal(sql(target, bootstrap, 'backup_smoke', 'SET ROLE smoke_reader; SELECT count(*) FROM smoke.items'), '1');
  const denied = run('docker', ['exec', target, 'psql', '-X', '-v', 'ON_ERROR_STOP=1', '-U', bootstrap, '-d', 'backup_smoke', '-c', "SET ROLE smoke_reader; INSERT INTO smoke.items VALUES (3,'smoke_reader','denied')"], undefined, false);
  assert.notEqual(denied.status, 0);
  assert.match(denied.stderr.toString(), /permission denied/);
  console.log('PG16 roles/password hashes/membership options/owners/ACLs/forced RLS/policy/definer function/rows/migration ledger + denied write PASS');
  console.log('Documented default-entrypoint private password bind and fresh source-bootstrap reconciliation PASS');
  const rootSecret = await start('root-secret', 'postgres', 'postgres', true);
  assert.equal(docker('exec', rootSecret, 'stat', '-c', '%u:%g:%a', '/run/root-password'), '0:0:600');
  assert.notEqual(run('docker', ['exec', '--user', 'postgres', rootSecret, 'test', '-r', '/run/root-password'], undefined, false).status, 0);
  assert.equal(sql(rootSecret, 'postgres', 'postgres', 'SELECT 1'), '1');
  console.log('Actual entrypoint startup with Linux root:root 0600 secret unreadable by postgres PASS');
} finally {
  for (const name of containers.reverse()) run('docker', ['rm', '-f', name], undefined, false);
  for (const volume of volumes.reverse()) run('docker', ['volume', 'rm', volume], undefined, false);
  chmodSync(dir, 0o700);
  rmSync(dir, { recursive: true, force: true });
  console.log(`Cleaned only isolated resources with prefix ${prefix}`);
}