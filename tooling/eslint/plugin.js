/** The monorepo's own ESLint rules, registered as the `waytale` plugin. */
module.exports = {
  meta: { name: "eslint-plugin-waytale" },
  rules: {
    "no-literal-ui-string": require("./rules/no-literal-ui-string"),
    "require-testid": require("./rules/require-testid"),
  },
};
