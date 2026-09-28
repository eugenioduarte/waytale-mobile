const { describe, it } = require("node:test");

const tsParser = require("@typescript-eslint/parser");
const { RuleTester } = require("eslint");

const rule = require("./require-testid");

// RuleTester reports through the runner's describe/it.
RuleTester.describe = describe;
RuleTester.it = it;
RuleTester.itOnly = it.only;

const ruleTester = new RuleTester({
  languageOptions: {
    parser: tsParser,
    parserOptions: { ecmaFeatures: { jsx: true } },
  },
});

ruleTester.run("require-testid", rule, {
  valid: [
    '<Pressable testID="login-continue" onPress={go} />',
    '<TextInput testID="login-email" value={email} />',
    '<Animated.Pressable testID="walk-play" />',
    // The wrapper forwards what its caller passed.
    "<Pressable {...props} />",
    // Not interactive.
    "<View><Text>Olá</Text></View>",
    // App components are only checked when listed.
    '<Action label="Continuar" />',
    {
      code: '<Action testID="login-continue" label="Continuar" />',
      options: [{ components: ["Action"] }],
    },
  ],
  invalid: [
    {
      code: "<Pressable onPress={go} />",
      errors: [{ messageId: "missing", data: { name: "Pressable" } }],
    },
    {
      code: "<TouchableOpacity><Text>Ok</Text></TouchableOpacity>",
      errors: [{ messageId: "missing", data: { name: "TouchableOpacity" } }],
    },
    {
      code: "<Animated.Pressable />",
      errors: [{ messageId: "missing", data: { name: "Pressable" } }],
    },
    {
      code: '<Switch value={on} testid="x" />',
      errors: [{ messageId: "missing", data: { name: "Switch" } }],
    },
    {
      code: '<Action label="Continuar" />',
      options: [{ components: ["Action"] }],
      errors: [{ messageId: "missing", data: { name: "Action" } }],
    },
  ],
});
