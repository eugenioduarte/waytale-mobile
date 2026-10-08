/** Shared Jest preset for Expo apps in the monorepo. Extend from `apps/mobile/jest.config.js`. */
module.exports = {
  preset: "jest-expo",
  transformIgnorePatterns: [
    "node_modules/(?!((jest-)?react-native|nativewind|@react-native(-community)?)|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@unimodules/.*|unimodules|sentry-expo|native-base|react-native-svg)",
  ],
  moduleNameMapper: {
    // First: the first matching pattern wins, and `@/global.css` also matches `@/*`.
    "\\.css$": require.resolve("./style-stub.js"),
    // Mirrors the `@/*` → `./src/*` path in the app's tsconfig (tests import with `@/`).
    "^@/(.*)$": "<rootDir>/src/$1",
  },
  collectCoverageFrom: ["src/**/*.{ts,tsx}", "!src/**/*.d.ts"],
};
