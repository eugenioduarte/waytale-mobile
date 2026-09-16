const expoConfig = require("eslint-config-expo/flat");

const base = require("./base");

/** Extends the Expo flat config with the monorepo's shared rules. Use from `apps/mobile/eslint.config.js`. */
module.exports = [...expoConfig, ...base];
