import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { once } from "node:events";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import http from "node:http";
import { tmpdir } from "node:os";
import path from "node:path";
import { after, before, test } from "node:test";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";
import { setTimeout as delay } from "node:timers/promises";

// Run the real Caddyfiles against disposable, labelled HTTP upstreams.
// Nothing reaches the application stacks, database, Google, or production.
const exec = promisify(execFile);
const root = fileURLToPath(new URL("../../", import.meta.url));
const servers = [];
const containers = [];
const ports = {};
let directory;

before(async () => {
  directory = await mkdtemp(path.join(tmpdir(), "mutuity-oauth-ingress-"));
  const env = { PRODUCTION_HOSTS: "http://production.test", REVIEW_CANDIDATE_VERSION: "1.2.3" };
  for (const label of ["production-api", "production-frontend", "review-api", "review-frontend", "test-api", "test-frontend"]) {
    const server = http.createServer((request, response) => {
      // APIs have no /api mount: ingress must strip the browser base path.
      response.writeHead(request.url.startsWith("/api/") ? 404 : 200, { "Content-Type": "text/plain" });
      response.end(label);
    });
    servers.push(server);
    server.listen(0, "0.0.0.0");
    await once(server, "listening");
    env[`${label.replaceAll("-", "_").toUpperCase()}_UPSTREAM`] = `host.docker.internal:${server.address().port}`;
  }

  for (const [name, source] of [["shared", "Caddyfile"], ["test", "Caddyfile.test"]]) {
    const config = await readFile(path.join(root, "deploy/caddy", source), "utf8");
    // Disable public TLS/admin only in this temporary copy; preserve routing.
    const localConfig = config
      .replace(/^\{[^}]*\{\$CADDY_EMAIL\}[^}]*\}/, "{\n\tadmin off\n\tauto_https off\n}")
      .replace(/^(review|test)\.tope-la\.com \{/m, "http://$1.tope-la.com {");
    assert.notEqual(localConfig, config, "Expected the Caddy global options block");
    const configPath = path.join(directory, source);
    await writeFile(configPath, localConfig);
    const containerName = `mutuity-oauth-ingress-${name}-${process.pid}`;
    containers.push(containerName);
    await exec("docker", [
      "run", "--detach", "--rm", "--name", containerName,
      "--add-host", "host.docker.internal:host-gateway",
      "--publish", "127.0.0.1::80",
      "--volume", `${configPath}:/etc/caddy/Caddyfile:ro`,
      ...Object.entries(env).flatMap(([key, value]) => ["--env", `${key}=${value}`]),
      "caddy:2"
    ]);
    const { stdout } = await exec("docker", ["port", containerName, "80/tcp"]);
    ports[name] = Number(stdout.trim().split(":").at(-1));
    // A published container port can accept/reset sockets before Caddy has
    // loaded its config. Wait for a real upstream response, not just docker run.
    const host = name === "shared" ? "production.test" : "test.tope-la.com";
    const expected = name === "shared" ? "production-api" : "test-api";
    const deadline = Date.now() + 15_000;
    for (;;) {
      try {
        assert.deepEqual(await request(name, host, "/health"), { status: 200, body: expected });
        break;
      } catch (error) {
        if (Date.now() >= deadline) {
          const { stdout: logs, stderr } = await exec("docker", ["logs", containerName]);
          throw new Error(`Caddy did not become ready: ${logs}${stderr}`, { cause: error });
        }
        await delay(50);
      }
    }
  }
});

after(async () => {
  await Promise.all(containers.map((name) => exec("docker", ["rm", "--force", name]).catch(() => undefined)));
  await Promise.all(servers.map((server) => new Promise((resolve) => server.close(resolve))));
  if (directory) await rm(directory, { recursive: true, force: true });
});

function request(stack, host, url, method = "GET", headers = {}) {
  return new Promise((resolve, reject) => {
    const req = http.request({ hostname: "127.0.0.1", port: ports[stack], path: url, method, headers: { ...headers, Host: host } }, (res) => {
      let body = "";
      res.setEncoding("utf8");
      res.on("data", (chunk) => { body += chunk; });
      res.on("end", () => resolve({ status: res.statusCode, body }));
    });
    req.on("error", reject);
    req.setTimeout(5000, () => req.destroy(new Error("Ingress request timed out")));
    req.end();
  });
}

for (const [stack, host, environment] of [
  ["shared", "production.test", "production"],
  ["shared", "review.tope-la.com", "review"],
  ["test", "test.tope-la.com", "test"]
]) {
  for (const provider of ["google", "apple"]) {
    for (const status of ["success", "register_required", "link_confirmation_required", "password_reset_required", "error"]) {
      test(`${host}: ${provider} ${status} result reaches the frontend`, async () => {
        const response = await request(stack, host, `/auth/${provider}/callback?status=${status}&next=%2F&error=Missing+OAuth+callback+parameters`);
        assert.deepEqual(response, { status: 200, body: `${environment}-frontend` });
      });
    }
  }
  test(`${host}: raw Google callback stays on the API`, async () => {
    assert.equal((await request(stack, host, "/auth/google/callback?code=test&state=test")).body, `${environment}-api`);
    assert.equal((await request(stack, host, "/auth/google/callback")).body, `${environment}-api`);
  });
  test(`${host}: Apple POST stays on the API even with a status query`, async () => {
    assert.equal((await request(stack, host, "/auth/apple/callback?status=error", "POST")).body, `${environment}-api`);
  });
  test(`${host}: start/API endpoints are not mistaken for result pages`, async () => {
    for (const url of ["/auth/google/start?status=error", "/graphql", "/health", "/api/auth/google/callback?code=test&state=test"]) {
      assert.deepEqual(await request(stack, host, url), { status: 200, body: `${environment}-api` });
    }
  });
  test(`${host}: browser API paths strip the prefix and reach the local API`, async () => {
    for (const url of [
      "/api/auth/google/start?next=%2Fapp&context=web",
      "/api/auth/apple/start?next=%2Fapp&context=web",
      "/api/graphql", "/api/health",
    ]) {
      for (const headers of [{}, { "X-App-Version": "1.0.0" }]) {
        assert.deepEqual(await request(stack, host, url, "GET", headers), { status: 200, body: `${environment}-api` });
      }
    }
    assert.equal((await request(stack, host, "/api")).status, 308);
  });
  if (environment !== "review") {
    test(`${host}: legacy 0.13 startup POST reaches the API without a redirect`, async () => {
      for (const url of ["/v0_13/graphql", "/v0_13/graphql/"]) {
        assert.deepEqual(await request(stack, host, url, "POST"), { status: 200, body: `${environment}-api` });
      }
    });
  }
}

test("review: processed results take precedence over candidate/production version routing", async () => {
  for (const version of ["1.2.3", "1.0.0"]) {
    assert.equal((await request("shared", "review.tope-la.com", `/auth/google/callback?status=success&appVersion=${version}`)).body, "review-frontend");
    const expected = version === "1.2.3" ? "review-api" : "production-api";
    assert.equal((await request("shared", "review.tope-la.com", `/auth/google/start?appVersion=${version}`)).body, expected);
    assert.equal((await request("shared", "review.tope-la.com", "/health", "GET", { "X-App-Version": version })).body, expected);
  }
});