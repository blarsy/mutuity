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
    const server = http.createServer((_request, response) => {
      response.writeHead(200, { "Content-Type": "text/plain" });
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
      // Review only exposes unprefixed API routes; /api is a web/test scheme.
      if (environment === "review" && url.startsWith("/api/")) continue;
      assert.equal((await request(stack, host, url)).body, `${environment}-api`);
    }
  });
}

test("review: processed results take precedence over candidate/production version routing", async () => {
  for (const version of ["1.2.3", "1.0.0"]) {
    assert.equal((await request("shared", "review.tope-la.com", `/auth/google/callback?status=success&appVersion=${version}`)).body, "review-frontend");
    const expected = version === "1.2.3" ? "review-api" : "production-api";
    assert.equal((await request("shared", "review.tope-la.com", `/auth/google/start?appVersion=${version}`)).body, expected);
    assert.equal((await request("shared", "review.tope-la.com", "/health", "GET", { "X-App-Version": version })).body, expected);
  }
});