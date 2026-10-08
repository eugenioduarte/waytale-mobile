const { fork } = require("node:child_process");
const path = require("node:path");

/**
 * The Waytale mock for tests: the same environment `pnpm mockoon` serves (`waytale.json` +
 * `data/`), started in its own Node process on a free port — so tests and dev answer from one set
 * of mock data, with the real Mockoon engine. Only Node built-ins here, so it loads in any test
 * runner (Jest with `jest-expo` included).
 *
 *   const mock = await startMockServer();
 *   createClient(mock.url, key);          // point the client under test at it
 *   await mock.requests();                // what reached it, for assertions
 *   await mock.stop();
 */
function startMockServer({ startupTimeoutMs = 25_000 } = {}) {
  const child = fork(path.join(__dirname, "child.js"), [], {
    stdio: ["ignore", "ignore", "inherit", "ipc"],
  });
  let nextId = 0;

  function call(type) {
    const id = (nextId += 1);
    return new Promise((resolve, reject) => {
      const onMessage = (message) => {
        if (message.id !== id) return;
        child.off("message", onMessage);
        resolve(message);
      };
      child.on("message", onMessage);
      child.send({ id, type }, (error) => error && reject(error));
    });
  }

  return new Promise((resolve, reject) => {
    const fail = (error) => {
      clearTimeout(timer);
      child.kill();
      reject(error);
    };
    const timer = setTimeout(
      () =>
        fail(
          new Error(`Mockoon startup timed out after ${startupTimeoutMs}ms`),
        ),
      startupTimeoutMs,
    );
    child.once("error", fail);
    child.once("exit", (code) => {
      clearTimeout(timer);
      reject(new Error(`Mockoon exited before starting (${code})`));
    });
    child.once("message", (message) => {
      clearTimeout(timer);
      if (message.type !== "ready") {
        fail(new Error(`Mockoon failed to start: ${message.message}`));
        return;
      }
      child.removeAllListeners("exit");
      resolve({
        url: message.url,
        requests: async () => (await call("requests")).requests,
        clearRequests: async () => void (await call("clear")),
        stop: async () => {
          if (!child.connected) return;
          await call("stop");
        },
      });
    });
  });
}

module.exports = { startMockServer };
