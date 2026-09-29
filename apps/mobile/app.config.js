/* global __dirname -- Node config file, run by the Expo CLI. */
const fs = require('node:fs');
const path = require('node:path');

/**
 * Extends `app.json` with the Firebase config files (EPIC-01.12). They are gitignored (they tie a
 * build to the Firebase project), so they come from the disk locally and from EAS file env vars in
 * CI (`GOOGLE_SERVICES_JSON`, `GOOGLE_SERVICE_INFO_PLIST` — see 01.13).
 *
 * iOS: only when a `GoogleService-Info.plist` registered for `com.waytale.app` exists. Without it an
 * iOS prebuild stops with the Firebase plugin's error; Android builds don't need it.
 */
module.exports = ({ config }) => {
  const iosFile =
    process.env.GOOGLE_SERVICE_INFO_PLIST ??
    (fs.existsSync(path.join(__dirname, 'GoogleService-Info.plist'))
      ? './GoogleService-Info.plist'
      : undefined);

  return {
    ...config,
    android: {
      ...config.android,
      googleServicesFile: process.env.GOOGLE_SERVICES_JSON ?? './google-services.json',
    },
    ios: { ...config.ios, ...(iosFile ? { googleServicesFile: iosFile } : {}) },
  };
};
