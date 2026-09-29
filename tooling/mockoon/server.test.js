const assert = require("node:assert/strict");
const { after, before, describe, it } = require("node:test");

const scenarios = require("./scenarios.json");
const { loadEnvironment, startMockServer } = require("./server");

let mock;
before(async () => {
  mock = await startMockServer();
});
after(() => mock.stop());

const post = (endpoint, body) =>
  fetch(`${mock.url}/${endpoint}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

describe("waytale.json", () => {
  it("every scenario input is a rule value in the environment, and back", () => {
    const ruleValues = loadEnvironment(0)
      .routes.flatMap((route) => route.responses)
      .flatMap((response) => response.rules.map((rule) => rule.value));
    const { email, code } = scenarios.auth;
    const inputs = [
      email.rateLimited,
      email.notAuthorized,
      email.serverError,
      code.expired,
    ];

    assert.deepEqual([...ruleValues].sort(), [...inputs].sort());
  });
});

describe("Supabase Auth", () => {
  it("sends the code, or answers the scenario picked by the email", async () => {
    const { email } = scenarios.auth;
    assert.equal((await post("auth/v1/otp", { email: email.ok })).status, 200);

    const limited = await post("auth/v1/otp", { email: email.rateLimited });
    assert.equal(limited.status, 429);
    assert.equal(limited.headers.get("x-supabase-api-version"), "2024-01-01");
    assert.equal((await limited.json()).code, "over_email_send_rate_limit");

    assert.equal(
      (await post("auth/v1/otp", { email: email.notAuthorized })).status,
      400,
    );
    assert.equal(
      (await post("auth/v1/otp", { email: email.serverError })).status,
      503,
    );
  });

  it("a valid code opens a session for that email; the expired one does not", async () => {
    const { email, code } = scenarios.auth;
    const session = await (
      await post("auth/v1/verify", {
        email: "ana@mail.pt",
        token: code.valid,
        type: "email",
      })
    ).json();
    assert.equal(session.user.email, "ana@mail.pt");
    assert.equal(session.expires_in, 3600);

    const expired = await post("auth/v1/verify", {
      email: email.ok,
      token: code.expired,
    });
    assert.equal(expired.status, 403);
  });
});

describe("PostgREST (sync)", () => {
  it("serves each synced table from data/rest", async () => {
    const routes = await (
      await fetch(`${mock.url}/rest/v1/routes?select=*`)
    ).json();
    assert.equal(routes[0].title, "Baixa de Lisboa");
    assert.deepEqual(
      await (await fetch(`${mock.url}/rest/v1/saved_items`)).json(),
      [],
    );
    assert.equal((await fetch(`${mock.url}/rest/v1/not_a_table`)).status, 404);
  });

  it("records every request", async () => {
    mock.clearRequests();
    await fetch(`${mock.url}/rest/v1/places`);
    assert.deepEqual(
      mock.requests.map(
        ({ request }) => `${request.method} ${request.urlPath}`,
      ),
      ["get /rest/v1/places"],
    );
  });
});
