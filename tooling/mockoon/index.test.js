const assert = require("node:assert/strict");
const { it } = require("node:test");

const { startMockServer } = require("./index");

it("rejects a stalled startup and releases the child process", async () => {
  await assert.rejects(
    startMockServer({ startupTimeoutMs: 1 }),
    /startup timed out/,
  );
});

it("runs the mock in a child process and reports its requests over IPC", async () => {
  const mock = await startMockServer();
  try {
    const response = await fetch(`${mock.url}/rest/v1/routes`, {
      headers: { Authorization: "Bearer user-jwt" },
    });
    assert.equal(response.status, 200);

    const [{ request }] = await mock.requests();
    assert.equal(request.urlPath, "/rest/v1/routes");
    assert.ok(
      request.headers.some(
        (h) => h.key === "authorization" && h.value === "Bearer user-jwt",
      ),
    );

    await mock.clearRequests();
    assert.deepEqual(await mock.requests(), []);
  } finally {
    await mock.stop();
  }
});
