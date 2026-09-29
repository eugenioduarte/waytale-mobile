const { describe, it } = require("node:test");

const tsParser = require("@typescript-eslint/parser");
const { RuleTester } = require("eslint");

const rule = require("./no-literal-ui-string");

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

ruleTester.run("no-literal-ui-string", rule, {
  valid: [
    "<Text>{t('auth.login')}</Text>",
    "<Action testID=\"login-continue\" label={t('auth.continue')} />",
    // Ids, routes and styles aren't copy.
    '<Screen testID="screen-login" />',
    '<SymbolView name="map" tintColor={color} />',
    "router.push('/deviations')",
    // No letters: layout, not copy.
    "<Text>·</Text>",
    "<Text>{' — '}</Text>",
    "<Screen description={`${t('place.detailDescription')} · ${id}`} />",
    "<Tabs.Screen name=\"saved\" options={{ title: t('tabs.saved'), tabBarButtonTestID: 'tab-saved' }} />",
    "Alert.alert(t('sync.error'), undefined, [{ text: t('common.ok'), style: 'cancel' }])",
    // Other calls are out of scope.
    "console.warn('Sync failed')",
    // Only the listed attributes when configured.
    {
      code: '<Card heading="Olá" />',
      options: [{ attributes: ["title"] }],
    },
  ],
  invalid: [
    {
      code: "<Text>Olá</Text>",
      errors: [{ messageId: "literal", data: { text: "Olá" } }],
    },
    {
      code: "<><Text>{'Continuar'}</Text></>",
      errors: [{ messageId: "literal", data: { text: "Continuar" } }],
    },
    {
      code: "<>{`Olá ${name}`}</>",
      errors: [{ messageId: "literal" }],
    },
    {
      code: '<Action testID="login-continue" label="Continuar" />',
      errors: [{ messageId: "literal", data: { text: "Continuar" } }],
    },
    {
      code: "<Screen title={'Login'} description={`${t('x')} e mais`} />",
      errors: [{ messageId: "literal" }, { messageId: "literal" }],
    },
    {
      code: '<Pressable accessibilityLabel="Tocar" testID="x" />',
      errors: [{ messageId: "literal", data: { text: "Tocar" } }],
    },
    {
      code: "<Tabs.Screen name=\"index\" options={{ title: 'Explore' }} />",
      errors: [{ messageId: "literal", data: { text: "Explore" } }],
    },
    {
      code: "Alert.alert('Sem ligação', t('sync.offline'), [{ text: 'OK' }])",
      errors: [
        { messageId: "literal", data: { text: "Sem ligação" } },
        { messageId: "literal", data: { text: "OK" } },
      ],
    },
    {
      code: '<Card heading="Olá" />',
      options: [{ attributes: ["heading"] }],
      errors: [{ messageId: "literal" }],
    },
  ],
});
