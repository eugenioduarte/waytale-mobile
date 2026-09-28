/** The monorepo's own ESLint rules, registered as the `waytale` plugin. */
module.exports = {
  meta: { name: "eslint-plugin-waytale" },
  rules: {
    "require-testid": require("./rules/require-testid"),
  },
};
