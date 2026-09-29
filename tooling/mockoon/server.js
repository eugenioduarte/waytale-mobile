const fs = require("node:fs");
const net = require("node:net");
const path = require("node:path");

const { EnvironmentSchema, Migrations } = require("@mockoon/commons");
const { MockoonServer } = require("@mockoon/commons-server");

/**
 * The Waytale mock (`waytale.json` + `data/`) started in-process — the same environment
 * `pnpm mockoon` serves for the app, so tests and dev answer from one set of mock data.
 *
 *   const mock = await startMockServer();   // http://127.0.0.1:<free port>
 *   createClient(mock.url, 'mock-key');     // the app's Supabase client, pointed at it
 *   mock.requests                           // what reached it, for assertions
 *   await mock.stop();
 */

const ENVIRONMENT_PATH = path.join(__dirname, "waytale.json");

/** Migrate and fill defaults exactly as `mockoon-cli start` does. */
function loadEnvironment(port) {
  const environment = JSON.parse(fs.readFileSync(ENVIRONMENT_PATH, "utf8"));
  for (const migration of Migrations) {
    if (migration.id > environment.lastMigration) {
      migration.migrationFunction(environment);
      environment.lastMigration = migration.id;
    }
  }
  const { value, error } = EnvironmentSchema.validate(environment);
  if (error) throw new Error(`Invalid Mockoon environment: ${error.message}`);
  return { ...value, port, hostname: "127.0.0.1" };
}

/** A port nobody is listening on right now, so test files can run in parallel. */
function freePort() {
  return new Promise((resolve, reject) => {
    const probe = net.createServer();
    probe.unref();
    probe.on("error", reject);
    probe.listen(0, "127.0.0.1", () => {
      const { port } = probe.address();
      probe.close(() => resolve(port));
    });
  });
}

/**
 * @param {{ port?: number }} [options] - defaults to a free port.
 */
async function startMockServer({ port } = {}) {
  const environment = loadEnvironment(port ?? (await freePort()));
  const server = new MockoonServer(environment, {
    environmentDirectory: __dirname,
    enableAdminApi: false,
    disableTls: true,
    // Deterministic `faker` output, should a response ever use it.
    fakerOptions: { seed: 1 },
  });

  /** @type {import('@mockoon/commons').Transaction[]} */
  const requests = [];
  server.on("transaction-complete", (transaction) =>
    requests.push(transaction),
  );

  await new Promise((resolve, reject) => {
    server.once("started", resolve);
    server.on("error", (code, error) => reject(error ?? new Error(code)));
    server.start();
  });

  return {
    url: `http://127.0.0.1:${environment.port}`,
    requests,
    /** Forget the requests seen so far (between tests). */
    clearRequests() {
      requests.length = 0;
    },
    stop() {
      return new Promise((resolve) => {
        server.once("stopped", resolve);
        server.stop();
      });
    },
  };
}

module.exports = { ENVIRONMENT_PATH, loadEnvironment, startMockServer };
