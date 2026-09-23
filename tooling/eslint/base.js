const prettierConfig = require("eslint-config-prettier");
const importX = require("eslint-plugin-import-x");

/**
 * Shared rules for every package in the monorepo. Compose with a runtime-specific config (e.g. `./expo-app.js`).
 *
 * Import ordering uses `eslint-plugin-import-x` under its own `import-x` namespace on purpose:
 * `eslint-config-expo` already registers `eslint-plugin-import` as `import`, so re-declaring that
 * name in this shared layer makes ESLint fail with "Cannot redefine plugin". Keeping the rules
 * here (instead of in `expo-app.js`) means packages that don't use the Expo config — `packages/ui`
 * — are ordered the same way.
 */
const importOrderConfig = {
  plugins: {
    "import-x": importX,
  },

  settings: {
    // `@/...` is the app's internal alias (see `apps/mobile/tsconfig.json`).
    "import-x/internal-regex": "^@/",
  },

  rules: {
    "import-x/order": [
      "error",
      {
        // `type` is deliberately absent: type-only imports are ranked by their source path, so
        // `import type { ReactNode } from 'react'` sorts with the other externals.
        groups: [
          "builtin",
          "external",
          "internal",
          ["parent", "sibling", "index"],
          "object",
        ],
        "newlines-between": "always",
        alphabetize: { order: "asc", caseInsensitive: true },
      },
    ],

    "import-x/newline-after-import": "error",
  },
};

module.exports = [importOrderConfig, prettierConfig];
