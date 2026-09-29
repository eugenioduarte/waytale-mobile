const { startMockServer } = require("./server");

/**
 * The mock in a child process, driven over IPC by `index.js` (`startMockServer`). Keeps the
 * Mockoon engine out of the parent's module system (Jest's `jest-expo` resolver would load browser
 * builds of its dependencies) and gives every test file its own server.
 */
startMockServer().then(
  (mock) => {
    process.on("message", async ({ id, type }) => {
      if (type === "requests") process.send({ id, requests: mock.requests });
      if (type === "clear") {
        mock.clearRequests();
        process.send({ id });
      }
      if (type === "stop") {
        await mock.stop();
        process.send({ id }, () => process.exit(0));
      }
    });
    // The parent died without stopping us (killed test run): don't linger on the port.
    process.on("disconnect", () => mock.stop().then(() => process.exit(0)));
    process.send({ type: "ready", url: mock.url });
  },
  (error) => {
    process.send({ type: "error", message: error.message }, () =>
      process.exit(1),
    );
  },
);
