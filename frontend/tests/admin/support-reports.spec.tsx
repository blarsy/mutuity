import { Children, isValidElement, type ReactElement, type ReactNode } from "react";
import { parse, print, buildSchema, validate } from "graphql";
import { Button, Dialog, TextField } from "@mui/material";
import AdminSupportPage, { adminSectionHref, getAdminSectionConfig, isAdminSectionKey } from "../../src/features/admin/AdminSupportPage";
import { ADMIN_LIST_SUPPORT_REPORTS_QUERY } from "../../src/features/admin/adminSupport.queries";
import AdminSectionRoute from "../../src/pages/admin/[section]";

let mockStates: unknown[] = [];
let mockStateIndex = 0;
let mockAdmin = { isAdmin: true, isChecking: false, isRedirecting: false, isForbiddenRedirecting: false };
let mockResult: Record<string, unknown> = {};
const mockUseQuery = jest.fn();
const mockPrefetch = jest.fn();
let mockSection = "reports";

jest.mock("react", () => ({ ...jest.requireActual("react"),
  useEffect: () => undefined,
  useMemo: (compute: () => unknown) => compute(),
  useState: (initial: unknown) => {
    const index = mockStateIndex++;
    if (!(index in mockStates)) mockStates[index] = typeof initial === "function" ? initial() : initial;
    return [mockStates[index], (next: unknown) => {
      mockStates[index] = typeof next === "function" ? next(mockStates[index]) : next;
    }];
  }
}));
jest.mock("next/router", () => ({ useRouter: () => ({ isReady: true, query: { section: mockSection }, prefetch: mockPrefetch }) }));
jest.mock("@apollo/client/react", () => ({ useQuery: (...args: unknown[]) => mockUseQuery(...args), useMutation: jest.fn() }));
jest.mock("../../src/features/auth/requireAdmin", () => ({ useRequireAdmin: () => mockAdmin }));
jest.mock("../../src/components/richText/RichTextContent", () => ({ RichTextContent: () => null }));

type Element = ReactElement<Record<string, any>>;
function elements(tree: ReactNode): Element[] {
  const found: Element[] = [];
  Children.forEach(tree, child => {
    if (isValidElement<Record<string, any>>(child)) found.push(child, ...elements(child.props.children));
  });
  return found;
}
function renderPage() {
  mockStateIndex = 0;
  return elements(AdminSupportPage({ section: "reports" }));
}
function button(tree: Element[], text: string) {
  return tree.find(element => element.type === Button && element.props.children === text)!;
}
const report = {
  id: "report-1", createdAt: "2026-11-22T12:00:00Z", accountId: "account-1", accountName: "Alice",
  summary: "Cannot sign in", description: "Details", diagnostics: { platform: "ios" }, totalCount: "53"
};

describe("admin support reports", () => {
  beforeEach(() => {
    mockStates = [];
    mockSection = "reports";
    mockAdmin = { isAdmin: true, isChecking: false, isRedirecting: false, isForbiddenRedirecting: false };
    mockResult = { data: { adminListSupportReports: { nodes: [report] } }, loading: false };
    mockUseQuery.mockReset().mockImplementation(() => mockResult);
    mockPrefetch.mockReset().mockResolvedValue(undefined);
  });

  it("registers the admin route and queries the expected function contract", () => {
    expect(isAdminSectionKey("reports")).toBe(true);
    expect(adminSectionHref("reports")).toBe("/admin/reports");
    expect(AdminSectionRoute()).toMatchObject({ key: "reports", props: { section: "reports" } });
    expect(getAdminSectionConfig("reports").query).toBe(ADMIN_LIST_SUPPORT_REPORTS_QUERY);
    const schema = buildSchema(`
      scalar JSON
      type Report { id: String, createdAt: String, accountId: String, accountName: String,
        summary: String, description: String, diagnostics: JSON, totalCount: String }
      type Reports { nodes: [Report!]! }
      type Query { adminListSupportReports(pSearch: String, pLimit: Int, pOffset: Int): Reports }
    `);
    const document = parse(ADMIN_LIST_SUPPORT_REPORTS_QUERY.loc!.source.body);
    expect(validate(schema, document)).toEqual([]);
    expect(print(document)).toContain("totalCount");
  });

  it("renders rows in server order and paginates using the per-row filtered total", () => {
    mockResult = { data: { adminListSupportReports: { nodes: [report, { ...report, id: "older", summary: "Older report" }] } }, loading: false };
    let tree = renderPage();
    expect(mockUseQuery).toHaveBeenLastCalledWith(ADMIN_LIST_SUPPORT_REPORTS_QUERY, expect.objectContaining({
      skip: false, fetchPolicy: "no-cache", variables: expect.objectContaining({ pLimit: 25, pOffset: 0 })
    }));
    const summaries = tree.filter(element => element.props.children === "Cannot sign in" || element.props.children === "Older report");
    expect(summaries.map(element => element.props.children)).toEqual(["Cannot sign in", "Older report"]);
    expect(button(tree, "Previous").props.disabled).toBe(true);
    expect(button(tree, "Next").props.disabled).toBe(false);
    button(tree, "Next").props.onClick();
    tree = renderPage();
    expect(mockUseQuery).toHaveBeenLastCalledWith(expect.anything(), expect.objectContaining({ variables: expect.objectContaining({ pOffset: 25 }) }));
    expect(button(tree, "Previous").props.disabled).toBe(false);
    button(tree, "Previous").props.onClick();
    renderPage();
    expect(mockUseQuery).toHaveBeenLastCalledWith(expect.anything(), expect.objectContaining({ variables: expect.objectContaining({ pOffset: 0 }) }));
  });

  it("submits trimmed searches, resets the offset, and clears the filter", () => {
    let tree = renderPage();
    button(tree, "Next").props.onClick();
    tree = renderPage();
    tree.find(element => element.type === TextField)!.props.onChange({ target: { value: "  Alice  " } });
    tree = renderPage();
    button(tree, "Search").props.onClick();
    tree = renderPage();
    expect(mockUseQuery).toHaveBeenLastCalledWith(expect.anything(), expect.objectContaining({ variables: expect.objectContaining({ pSearch: "Alice", pOffset: 0 }) }));
    button(tree, "Reset").props.onClick();
    renderPage();
    expect(mockUseQuery).toHaveBeenLastCalledWith(expect.anything(), expect.objectContaining({ variables: expect.objectContaining({ pSearch: undefined, pOffset: 0 }) }));
  });

  it("disables next on the final page and allows recovery from an emptied page", () => {
    let tree = renderPage();
    button(tree, "Next").props.onClick();
    tree = renderPage();
    button(tree, "Next").props.onClick();
    mockResult = { data: { adminListSupportReports: { nodes: [{ ...report, totalCount: 53 }] } }, loading: false };
    tree = renderPage();
    expect(button(tree, "Next").props.disabled).toBe(true);
    expect(button(tree, "Previous").props.disabled).toBe(false);
    mockResult = { data: { adminListSupportReports: { nodes: [] } }, loading: false };
    tree = renderPage();
    expect(button(tree, "Previous").props.disabled).toBe(false);
    button(tree, "Previous").props.onClick();
    renderPage();
    expect(mockUseQuery).toHaveBeenLastCalledWith(expect.anything(), expect.objectContaining({ variables: expect.objectContaining({ pOffset: 25 }) }));
  });

  it.each([
    { isAdmin: false, isChecking: true, isRedirecting: false, isForbiddenRedirecting: false },
    { isAdmin: false, isChecking: false, isRedirecting: true, isForbiddenRedirecting: false },
    { isAdmin: false, isChecking: false, isRedirecting: false, isForbiddenRedirecting: true },
    { isAdmin: false, isChecking: false, isRedirecting: false, isForbiddenRedirecting: false }
  ])("skips the report query when access is not established: %o", state => {
    mockAdmin = state;
    const tree = renderPage();
    expect(mockUseQuery).toHaveBeenLastCalledWith(expect.anything(), expect.objectContaining({ skip: true }));
    expect(tree.some(element => element.props.children === "Cannot sign in")).toBe(false);
  });

  it("shows loading, empty and error states", () => {
    mockResult = { loading: true };
    expect(renderPage().some(element => element.props.children === "Loading records...")).toBe(true);
    mockResult = { loading: false, data: { adminListSupportReports: { nodes: [] } } };
    expect(renderPage().some(element => element.props.children === "No records found.")).toBe(true);
    mockResult = { loading: false, error: { message: "network failed" } };
    const tree = renderPage();
    expect(tree.some(element => element.props.children === "Something went wrong. Please try again.")).toBe(true);
    expect(tree.some(element => element.props.children === "No records found.")).toBe(false);
  });

  it("opens and closes a read-only report dialog with the selected row", () => {
    const rowAction = getAdminSectionConfig("reports").actions!(report) as Element;
    const renderAction = () => { mockStateIndex = 0; return elements((rowAction.type as (props: unknown) => ReactNode)(rowAction.props)); };
    let tree = renderAction();
    expect(tree.find(element => element.type === Dialog)!.props.open).toBe(false);
    button(tree, "View report").props.onClick();
    tree = renderAction();
    expect(tree.find(element => element.type === Dialog)!.props.open).toBe(true);
    expect(tree.find(element => element.props.report === report)).toBeDefined();
    tree.find(element => element.type === Dialog)!.props.onClose();
    expect(renderAction().find(element => element.type === Dialog)!.props.open).toBe(false);
  });
});