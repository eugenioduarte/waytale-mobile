import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";

const configScript = `
  const configure = require('./apps/mobile/app.config.js');
  const result = configure({ config: { extra: { existing: true } } });
  console.log(JSON.stringify(result.extra));
`;

test("production cannot silently fall back to preview authentication", () => {
  const result = spawnSync(process.execPath, ["-e", configScript], {
    encoding: "utf8",
    env: {
      ...process.env,
      EAS_BUILD_PROFILE: "production",
      EXPO_PUBLIC_SUPABASE_URL: "",
      EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "",
    },
  });
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /Production builds require/);
});

test("production rejects an explicitly disabled backend", () => {
  const result = spawnSync(process.execPath, ["-e", configScript], {
    encoding: "utf8",
    env: {
      ...process.env,
      EAS_BUILD_PROFILE: "production",
      EXPO_PUBLIC_BACKEND_DISABLED: "true",
      EXPO_PUBLIC_SUPABASE_URL: "https://example.supabase.co",
      EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "sb_publishable_test",
    },
  });
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /Production builds require/);
});

test("the EAS project binding preserves existing Expo extra values", () => {
  const result = spawnSync(process.execPath, ["-e", configScript], {
    encoding: "utf8",
    env: {
      ...process.env,
      EAS_BUILD_PROFILE: "preview",
      EAS_PROJECT_ID: "test-project",
    },
  });
  assert.equal(result.status, 0, result.stderr);
  assert.deepEqual(JSON.parse(result.stdout), {
    existing: true,
    eas: { projectId: "test-project" },
  });
});

test("artifact download rejects failed builds, non-Android builds and insecure URLs", async () => {
  const directory = await mkdtemp(join(tmpdir(), "waytale-build-test-"));
  try {
    const manifest = join(directory, "build.json");
    for (const build of [
      { status: "ERRORED", platform: "ANDROID" },
      { status: "FINISHED", platform: "IOS" },
      {
        status: "FINISHED",
        platform: "ANDROID",
        artifacts: { buildUrl: "http://example.invalid/app.apk" },
      },
    ]) {
      await writeFile(manifest, JSON.stringify([build]));
      const result = spawnSync(
        process.execPath,
        [
          "scripts/download-eas-build.mjs",
          manifest,
          join(directory, "app.apk"),
        ],
        { encoding: "utf8", timeout: 5000 },
      );
      assert.notEqual(result.status, 0);
      assert.match(
        result.stderr,
        /successful Android EAS build|must use HTTPS/,
      );
    }
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});
