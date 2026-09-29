/**
 * `waytale/no-literal-ui-string` — user-facing copy goes through i18n (`t('feature.key')`), never
 * written inline, so every screen exists in every supported language (EPIC-01.9).
 *
 * Reports text with at least one letter in:
 * - JSX text and string/template children: `<Text>Olá</Text>`, `<Text>{'Olá'}</Text>`;
 * - the copy-carrying props in `attributes` (`title`, `label`, `accessibilityLabel`, …), also as
 *   keys of an object passed to a prop: `options={{ title: 'Explore' }}`;
 * - `Alert.alert(...)` / `Alert.prompt(...)` arguments, button `text` included.
 *
 * Text without letters (`·`, `—`, `42`) is layout, not copy. Everything else in the file is out of
 * scope on purpose: ids, routes and styles are strings too, and guessing would be noise.
 */
const DEFAULT_ATTRIBUTES = [
  "accessibilityHint",
  "accessibilityLabel",
  "alt",
  "aria-label",
  "description",
  "headerBackTitle",
  "headerTitle",
  "label",
  "message",
  "placeholder",
  "subtitle",
  "tabBarAccessibilityLabel",
  "tabBarLabel",
  "text",
  "title",
];

const LETTER = /\p{L}/u;

/** The literal text of a node, or null when it isn't a literal string. */
function literalText(node) {
  if (!node) return null;
  if (node.type === "Literal" && typeof node.value === "string")
    return node.value;
  if (node.type === "TemplateLiteral") {
    return node.quasis.map((quasi) => quasi.value.cooked).join("");
  }
  return null;
}

function hasCopy(text) {
  return text !== null && LETTER.test(text);
}

function propertyName(key) {
  if (key.type === "Identifier") return key.name;
  if (key.type === "Literal") return String(key.value);
  return null;
}

module.exports = {
  DEFAULT_ATTRIBUTES,
  meta: {
    type: "problem",
    docs: { description: "Disallow user-facing strings outside i18n." },
    schema: [
      {
        type: "object",
        properties: {
          attributes: {
            type: "array",
            items: { type: "string" },
            uniqueItems: true,
          },
        },
        additionalProperties: false,
      },
    ],
    messages: {
      literal:
        "User-facing text '{{ text }}' must come from i18n: use t('feature.key').",
    },
  },
  create(context) {
    const attributes = new Set(
      context.options[0]?.attributes ?? DEFAULT_ATTRIBUTES,
    );

    function report(node, text) {
      context.report({
        node,
        messageId: "literal",
        data: { text: text.trim().slice(0, 40) },
      });
    }

    function checkValue(node) {
      const text = literalText(node);
      if (hasCopy(text)) report(node, text);
    }

    /** The copy-carrying keys of an object literal: `{ title: 'Explore' }`. */
    function checkObject(node) {
      for (const property of node.properties) {
        if (property.type !== "Property") continue;
        const key = propertyName(property.key);
        if (key && attributes.has(key)) checkValue(property.value);
      }
    }

    return {
      JSXText(node) {
        if (hasCopy(node.value)) report(node, node.value);
      },
      // `<Text>{'Olá'}</Text>` — children only; attribute values are handled below.
      "JSXElement > JSXExpressionContainer, JSXFragment > JSXExpressionContainer"(
        node,
      ) {
        checkValue(node.expression);
      },
      JSXAttribute(node) {
        const { value } = node;
        if (!value) return;
        const name = node.name.type === "JSXIdentifier" ? node.name.name : null;
        if (name && attributes.has(name)) {
          checkValue(
            value.type === "JSXExpressionContainer" ? value.expression : value,
          );
        }
        // `options={{ title: 'Explore' }}` (expo-router screens and tabs).
        if (
          value.type === "JSXExpressionContainer" &&
          value.expression.type === "ObjectExpression"
        ) {
          checkObject(value.expression);
        }
      },
      CallExpression(node) {
        const { callee } = node;
        const isAlert =
          callee.type === "MemberExpression" &&
          callee.object.type === "Identifier" &&
          callee.object.name === "Alert" &&
          callee.property.type === "Identifier" &&
          (callee.property.name === "alert" ||
            callee.property.name === "prompt");
        if (!isAlert) return;
        for (const argument of node.arguments) {
          checkValue(argument);
          // Buttons: `[{ text: 'Cancelar', style: 'cancel' }]`.
          if (argument.type !== "ArrayExpression") continue;
          for (const element of argument.elements) {
            if (element?.type === "ObjectExpression") checkObject(element);
          }
        }
      },
    };
  },
};
