import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import ts from "typescript";

// Verify each listing surface passes its actual amount to the shared display.
function source(path: string) {
  return ts.createSourceFile(path, readFileSync(resolve(__dirname, "../../src", path), "utf8"), ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
}

function elements(file: ts.SourceFile, name: string) {
  const found: Array<ts.JsxElement | ts.JsxSelfClosingElement> = [];
  const visit = (node: ts.Node) => {
    if (ts.isJsxElement(node) && node.openingElement.tagName.getText(file) === name) found.push(node);
    if (ts.isJsxSelfClosingElement(node) && node.tagName.getText(file) === name) found.push(node);
    ts.forEachChild(node, visit);
  };
  visit(file);
  return found;
}

function attribute(node: ts.JsxElement | ts.JsxSelfClosingElement, name: string, file: ts.SourceFile) {
  const attributes = ts.isJsxElement(node) ? node.openingElement.attributes : node.attributes;
  const attr = attributes.properties.find(prop => ts.isJsxAttribute(prop) && prop.name.getText(file) === name);
  return attr && ts.isJsxAttribute(attr) ? attr.initializer?.getText(file) : undefined;
}

function condition(node: ts.Node, file: ts.SourceFile) {
  for (let parent = node.parent; parent; parent = parent.parent) {
    if (ts.isConditionalExpression(parent)) return parent.condition.getText(file);
  }
  return undefined;
}

describe("web TokenAmount integration", () => {
  it.each(["NeedCard", "ResourceCard"])("keeps %s token help outside its clickable body and omits only unknown amounts", name => {
    const file = source(`features/ui/${name}.tsx`);
    const [display] = elements(file, "TokenAmount");
    const [body] = elements(file, "ButtonBase");
    expect(display).toBeDefined();
    expect(attribute(display, "amount", file)).toBe("{tokenAmount}");
    expect(condition(display, file)).toBe("tokenAmount != null");
    expect(display.end).toBeLessThan(body.pos);
    for (let parent = display.parent; parent; parent = parent.parent) {
      if (ts.isJsxElement(parent)) expect(parent.openingElement.tagName.getText(file)).not.toBe("ButtonBase");
    }
    expect(file.text).toContain("tokenAmount?: number | null");
  });

  it.each([
    ["features/needs/PublicNeedsPage.tsx", "NeedCard", "need.proposedTopesAmount", "browse.topesProposed"],
    ["features/resources/PublicResourcesPage.tsx", "ResourceCard", "resource.defaultTokenAmount", "card.suggestedTokenAmount"],
    ["pages/needs/manage.tsx", "NeedCard", "need.proposedTopesAmount", "manage.topesChip"],
    ["pages/resources/manage.tsx", "ResourceCard", "resource.defaultTokenAmount", "manage.tokensChip"],
    ["pages/claims.tsx", "NeedCard", "need.proposedTopesAmount", 't("topesAmount"']
  ])("passes the actual amount on %s without duplicate token labels", (path, card, amount, oldLabel) => {
    const file = source(path);
    const cards = elements(file, card);
    expect(cards.length).toBeGreaterThan(0);
    cards.forEach(node => expect(attribute(node, "tokenAmount", file)).toBe(`{${amount}}`));
    expect(file.text).not.toContain(oldLabel);
  });

  it("displays the bid proposal without falling back to the resource default and preserves reserved/status badges", () => {
    const file = source("pages/bids.tsx");
    expect(file.text).toContain("const tokenAmount = bid.proposedTokenAmount;");
    expect(elements(file, "TokenAmount")).toHaveLength(1);
    expect(file.text).not.toContain('t("chips.tokens"');
    expect(file.text).toContain('t("reserved", { value: tokenAmount })');
    expect(file.text).toContain("bidChipColor(bid.status)");
  });

  it.each([
    ["features/needs/CreateNeedPage.tsx", "values.proposedTopesAmount"],
    ["features/resources/CreateResourcePage.tsx", "values.defaultTokenAmount"]
  ])("previews current numeric form state below the retained input in %s", (path, amount) => {
    const file = source(path);
    const [picker] = elements(file, "IntensityPicker");
    const [display] = elements(file, "TokenAmount");
    expect(attribute(picker, "tokenAmount", file)).toBe(`{${amount}}`);
    expect(attribute(display, "amount", file)).toBe(`{${amount}}`);
    expect(condition(display, file)).toBe(`typeof ${amount} === "number" && Number.isFinite(${amount})`);
    expect(display.pos).toBeGreaterThan(picker.end);
    expect(attribute(picker, "onTokenAmountChange", file)).toBeDefined();
    expect(attribute(picker, "error", file)).toBeDefined();
  });

  it.each([
    ["pages/needs/[needId].tsx", "need.proposedTopesAmount"],
    ["features/resources/ResourceDetailPage.tsx", "resource.defaultTokenAmount"]
  ])("uses the shared price tag on public detail %s", (path, amount) => {
    const file = source(path);
    const [display] = elements(file, "IntensityDisplay");
    expect(attribute(display, "tokenAmount", file)).toBe(`{${amount}}`);
    expect(elements(file, "TokenAmount")).toHaveLength(0);
  });

  it("centers a prominent contribution balance and preserves signed and unknown balance semantics", () => {
    const file = source("pages/contribution.tsx");
    const [display] = elements(file, "TokenAmount");
    expect(attribute(display, "size", file)).toBe("{80}");
    expect(attribute(display, "signed", file)).toBeUndefined(); // Boolean JSX attribute.
    expect(display.getText(file)).toContain("signed");
    expect(file.text).toContain('<Stack alignItems="center" spacing={2}');
    expect(elements(file, "TokenBalanceDisplay")).toHaveLength(1);
  });
});