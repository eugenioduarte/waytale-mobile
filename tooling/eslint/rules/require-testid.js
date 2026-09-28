/**
 * `waytale/require-testid` — every interactive element carries a `testID`, so Maestro flows and
 * Testing Library select it by a stable id instead of copy that changes (EPIC-01.8).
 *
 * Checks the React Native primitives below plus any app component passed in `components` (e.g. the
 * `Action` button). A spread (`{...props}`) counts as providing it: the wrapper forwards whatever it
 * was given, and its own call sites are checked where they are written.
 */
const DEFAULT_COMPONENTS = [
  "Button",
  "Pressable",
  "Switch",
  "TextInput",
  "TouchableHighlight",
  "TouchableNativeFeedback",
  "TouchableOpacity",
  "TouchableWithoutFeedback",
];

/** `<Pressable>` → "Pressable", `<Animated.Pressable>` → "Pressable". */
function elementName(name) {
  if (name.type === "JSXIdentifier") return name.name;
  if (name.type === "JSXMemberExpression") return name.property.name;
  return null;
}

module.exports = {
  DEFAULT_COMPONENTS,
  meta: {
    type: "problem",
    docs: { description: "Require a testID on interactive elements." },
    schema: [
      {
        type: "object",
        properties: {
          components: {
            type: "array",
            items: { type: "string" },
            uniqueItems: true,
          },
        },
        additionalProperties: false,
      },
    ],
    messages: {
      missing:
        "<{{name}}> is interactive: give it a testID (`<screen>-<action>`) for Maestro and Testing Library.",
    },
  },
  create(context) {
    const extra = context.options[0]?.components ?? [];
    const components = new Set([...DEFAULT_COMPONENTS, ...extra]);
    return {
      JSXOpeningElement(node) {
        const name = elementName(node.name);
        if (!name || !components.has(name)) return;
        const hasTestId = node.attributes.some(
          (attribute) =>
            attribute.type === "JSXSpreadAttribute" ||
            (attribute.type === "JSXAttribute" &&
              attribute.name.name === "testID"),
        );
        if (!hasTestId)
          context.report({ node, messageId: "missing", data: { name } });
      },
    };
  },
};
