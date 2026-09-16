const prettierConfig = require("eslint-config-prettier");

/** Shared rules for every package in the monorepo. Compose with a runtime-specific config (e.g. `./expo-app.js`). */
module.exports = [prettierConfig];
