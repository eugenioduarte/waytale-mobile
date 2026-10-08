import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname } from "node:path";

const [manifestPath, outputPath] = process.argv.slice(2);
if (!manifestPath || !outputPath) {
  throw new Error(
    "Usage: download-eas-build.mjs <eas-build.json> <output.apk>",
  );
}

const builds = JSON.parse(await readFile(manifestPath, "utf8"));
const build =
  Array.isArray(builds) && builds.length === 1 ? builds[0] : undefined;
if (build?.status !== "FINISHED" || build.platform !== "ANDROID") {
  throw new Error("Expected one successful Android EAS build");
}
const artifactUrl = new URL(
  build.artifacts?.applicationArchiveUrl ?? build.artifacts?.buildUrl,
);
if (artifactUrl.protocol !== "https:")
  throw new Error("EAS artifact must use HTTPS");

const response = await fetch(artifactUrl, {
  signal: AbortSignal.timeout(120_000),
});
if (!response.ok) throw new Error(`APK download failed (${response.status})`);
const apk = Buffer.from(await response.arrayBuffer());
if (apk.length < 4 || apk.readUInt32LE(0) !== 0x04034b50) {
  throw new Error("EAS artifact is not an APK/ZIP archive");
}
await mkdir(dirname(outputPath), { recursive: true });
await writeFile(outputPath, apk);
console.log(`Downloaded Android build ${build.id}`);
