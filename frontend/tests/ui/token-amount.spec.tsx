import { Children, isValidElement, useState, type ReactElement, type ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { createElement } from "react";
import { Button, Dialog, IconButton, LinearProgress } from "@mui/material";
import { TokenAmount } from "../../src/components/TokenAmount";
import { TokenExplainerDialog } from "../../src/components/tokenExplainer/TokenExplainerDialog";
import { ExplainerDialog, ExplainerDialogContent } from "../../src/components/explainer/ExplainerDialog";

jest.mock("react", () => ({ ...jest.requireActual("react"), useState: jest.fn(),
  useId: () => "test-id", useMemo: (factory: () => unknown) => factory() }));
jest.mock("@mui/material/styles", () => ({ ...jest.requireActual("@mui/material/styles"),
  useTheme: () => ({ breakpoints: { down: () => "(max-width:600px)" } }) }));
jest.mock("@mui/material", () => ({ ...jest.requireActual("@mui/material"), useMediaQuery: () => false }));
jest.mock("react-i18next", () => ({ useTranslation: () => ({ t: (key: string, options?: { amount?: number }) =>
  key === "topesAmount" ? `${options?.amount} Topes` : key }) }));

type Props = { children?: ReactNode; disabled?: boolean; onClick?: (event: { stopPropagation: () => void }) => void; onClose?: () => void };
function find(node: ReactNode, type: unknown): ReactElement<Props>[] {
  const matches: ReactElement<Props>[] = [];
  Children.forEach(node, child => {
    if (!isValidElement<Props>(child)) return;
    if (child.type === type) matches.push(child);
    matches.push(...find(child.props.children, type));
  });
  return matches;
}

beforeEach(() => {
  jest.clearAllMocks();
  (useState as jest.Mock).mockImplementation(initial => [initial, jest.fn()]);
});

it.each([[42.6, 43], [-5, 0], [NaN, 0], [Infinity, 0], [0, 0]])("renders normalized price %s with the mobile graphic", (amount, expected) => {
  const html = renderToStaticMarkup(createElement(TokenAmount, { amount }));
  expect(html).toContain(`aria-label="${expected} Topes"`);
  expect(html).toContain('src="/token-symbol.svg"');
  expect(html).toContain('aria-haspopup="dialog"');
});

it("preserves negative balances rather than displaying zero", () => {
  const html = renderToStaticMarkup(createElement(TokenAmount, { amount: -53, signed: true, size: 80 }));
  expect(html).toContain('aria-label="-53 Topes"');
  expect(html).toContain("width:80px");
});

it("opens an accessible explainer without triggering parent card navigation", () => {
  const setOpen = jest.fn();
  (useState as jest.Mock).mockReturnValueOnce([false, setOpen]);
  const tree = TokenAmount({ amount: 42, explainerAccessibilityLabel: "Explain tokens" });
  const [button] = find(tree, IconButton);
  expect(button.props).toMatchObject({ "aria-label": "Explain tokens" });
  const stopPropagation = jest.fn();
  button.props.onClick?.({ stopPropagation });
  expect(stopPropagation).toHaveBeenCalledTimes(1);
  expect(setOpen).toHaveBeenCalledWith(true);
});

it("can hide the help button and only mounts the dialog when opened", () => {
  expect(find(TokenAmount({ amount: 10, showExplainer: false }), IconButton)).toHaveLength(0);
  expect(find(TokenAmount({ amount: 10 }), TokenExplainerDialog)).toHaveLength(0);
  (useState as jest.Mock).mockReturnValueOnce([true, jest.fn()]);
  expect(find(TokenAmount({ amount: 10 }), TokenExplainerDialog)).toHaveLength(1);
});

it.each([0, 1, 2])("provides bounded slide navigation for slide %s", index => {
  const setIndex = jest.fn();
  (useState as jest.Mock).mockReturnValueOnce([index, setIndex]);
  const close = jest.fn();
  const slides = ["what", "earn", "spend"].map(id => ({ id, title: id, body: `${id} body` }));
  const labels = { stepLabel: "Step {{current}} of {{total}}", close: "Close", previous: "Previous", next: "Next" };
  const tree = ExplainerDialogContent({ slides, labels, onClose: close });
  expect(find(tree, LinearProgress)[0].props).toMatchObject({ value: ((index + 1) / 3) * 100 });
  const [closeButton, previous, next] = find(tree, Button);
  expect(previous.props.disabled).toBe(index === 0);
  expect(next.props.disabled).toBe(index === 2);
  closeButton.props.onClick?.({ stopPropagation: jest.fn() });
  expect(close).toHaveBeenCalledTimes(1);
  previous.props.onClick?.({ stopPropagation: jest.fn() });
  expect(setIndex.mock.calls.at(-1)![0](index)).toBe(Math.max(0, index - 1));
  next.props.onClick?.({ stopPropagation: jest.fn() });
  expect(setIndex.mock.calls.at(-1)![0](index)).toBe(Math.min(2, index + 1));
});

it("uses the mobile wrapper contract and passes translated slides and labels to the generic dialog", () => {
  const close = jest.fn();
  const tree = TokenExplainerDialog({ visible: true, onClose: close, testID: "token-guide" });
  expect(tree.type).toBe(ExplainerDialog);
  expect(tree.props).toMatchObject({ visible: true, onClose: close, testID: "token-guide", title: "topesGuide.title",
    labels: { close: "topesGuide.closeButton", previous: "topesGuide.previousButton", next: "topesGuide.nextButton" } });
  expect(tree.props.slides.map((slide: { id: string }) => slide.id)).toEqual(["what", "earn", "spend"]);
  const dialog = ExplainerDialog(tree.props);
  expect(find(dialog, Dialog)[0].props).toMatchObject({ open: true, onClose: close });
  expect(ExplainerDialog({ ...tree.props, visible: false })).toBeNull();
  expect(ExplainerDialog({ ...tree.props, slides: [] })).toBeNull();
});