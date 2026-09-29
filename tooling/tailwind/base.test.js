const assert = require("node:assert/strict");
const { describe, it } = require("node:test");

const preset = require("./base");
const tokens = require("./tokens.json");

const { theme } = preset;

describe("tailwind preset from tokens.json", () => {
  it("has exactly the token colours, kebab-cased, plus transparent/current", () => {
    assert.deepEqual(Object.keys(theme.colors).sort(), [
      "accent",
      "border",
      "border-soft",
      "canvas",
      "current",
      "ink",
      "ink-faint",
      "ink-muted",
      "surface",
      "transparent",
    ]);
    assert.equal(theme.colors.accent, tokens.color.accent);
    assert.equal(theme.colors["ink-muted"], "#a19c90");
  });

  it("uses the token spacing scale in px, replacing Tailwind's", () => {
    assert.equal(theme.spacing[4], "16px");
    assert.equal(theme.spacing[7], "32px");
    assert.equal(theme.spacing[10], "80px");
    assert.equal(theme.spacing[11], undefined);
  });

  it("resolves the type scale's multipliers to px for React Native", () => {
    assert.deepEqual(theme.fontSize.display, [
      "26px",
      { fontWeight: "600", lineHeight: "32.5px", letterSpacing: "-0.39px" },
    ]);
    assert.deepEqual(theme.fontSize.body, [
      "14.5px",
      { fontWeight: "400", lineHeight: "23.92px" },
    ]);
    assert.deepEqual(theme.fontSize.label, ["13px", { fontWeight: "500" }]);
    assert.equal(theme.fontSize.xl, undefined);
  });

  it("maps radii and motion", () => {
    assert.equal(theme.borderRadius.md, "14px");
    assert.equal(theme.borderRadius.pill, "999px");
    assert.equal(theme.extend.transitionDuration.base, "220ms");
    assert.equal(
      theme.extend.transitionTimingFunction.DEFAULT,
      "cubic-bezier(.2,.8,.2,1)",
    );
  });
});
