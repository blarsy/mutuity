import { Children, isValidElement, type ReactElement, type ReactNode } from "react";
import { Badge } from "@mui/material";
import { AppTopBar } from "../../src/features/layout/AppTopBar";
import { TokenBalanceDisplay } from "../../src/features/contribution/TokenBalanceDisplay";
import { TokenAmount } from "../../src/components/TokenAmount";

let mockBalance: number | null = null;
let mockUnreadCount: number | null = null;
let mockMobile = false;
jest.mock("react", () => ({
  ...jest.requireActual("react"),
  useState: (initial: unknown) => [initial, jest.fn()],
  useRef: (initial: unknown) => ({ current: initial }),
  useEffect: jest.fn(),
  useMemo: (factory: () => unknown) => factory()
}));
jest.mock("@mui/material", () => ({
  ...jest.requireActual("@mui/material"),
  useTheme: () => ({ breakpoints: { down: () => "mobile" } }),
  useMediaQuery: () => mockMobile
}));
jest.mock("@apollo/client/react", () => ({
  useQuery: () => ({ data: { countUnreadChatConversations: 0 }, refetch: jest.fn() }),
  useLazyQuery: () => [jest.fn()]
}));
jest.mock("../../src/features/auth/AuthProvider", () => ({ useAuth: () => ({ session: { authenticated: true, account: { id: "viewer" } }, signOut: jest.fn() }) }));
jest.mock("../../src/features/auth/LoginDialog", () => ({ LoginDialog: () => null }));
jest.mock("../../src/features/ui/AvatarIconButton", () => ({ AvatarIconButton: () => null }));
jest.mock("../../src/features/contribution/useTokenBalance", () => ({ useTokenBalance: () => ({ balance: mockBalance }) }));
jest.mock("../../src/features/notifications/useUnreadNotifications", () => ({ useUnreadNotifications: () => ({ count: mockUnreadCount }) }));
jest.mock("../../src/services/graphql/accountEvents", () => ({ useAccountEventSignal: jest.fn() }));
jest.mock("next/router", () => ({ useRouter: () => ({ pathname: "/app/search", push: jest.fn() }) }));
jest.mock("react-i18next", () => ({ useTranslation: () => ({ t: (key: string) => key, i18n: { language: "en" } }) }));

type Props = { children?: ReactNode; primary?: ReactNode; badgeContent?: number; invisible?: boolean; balance?: number | null; format?: (amount: number) => ReactNode };
function find(node: ReactNode, type: unknown): ReactElement<Props>[] {
  const results: ReactElement<Props>[] = [];
  Children.forEach(node, child => {
    if (!isValidElement<Props>(child)) return;
    if (child.type === type) results.push(child);
    results.push(...find(child.props.children, type));
    results.push(...find(child.props.primary, type));
  });
  return results;
}

describe.each([false, true])("topbar reactive values (mobile=%s)", mobile => {
  it("renders shared updated values without replacing unknown balance with zero", () => {
    mockMobile = mobile;
    mockBalance = null;
    mockUnreadCount = null;
    const render = () => AppTopBar({ colorMode: "light", onToggleColorMode: jest.fn() });
    expect(find(render(), TokenBalanceDisplay)[0].props.balance).toBeNull();
    mockBalance = 27;
    mockUnreadCount = 8;
    let tree = render();
    expect(find(tree, TokenBalanceDisplay)[0].props.balance).toBe(27);
    expect(find(tree, Badge).some(badge => badge.props.badgeContent === 8 && badge.props.invisible === false)).toBe(true);
    mockBalance = 19;
    mockUnreadCount = 0;
    tree = render();
    expect(find(tree, TokenBalanceDisplay)[0].props.balance).toBe(19);
    expect(find(tree, Badge).every(badge => badge.props.badgeContent === 0 && badge.props.invisible)).toBe(true);
  });

  it("uses a compact signed TokenAmount inside the contribution link without nesting a help button", () => {
    mockMobile = mobile;
    mockBalance = -12;
    const tree = AppTopBar({ colorMode: "light", onToggleColorMode: jest.fn() });
    const display = find(tree, TokenBalanceDisplay)[0];
    const amount = find(display.props.format?.(-12), TokenAmount)[0];
    expect(amount.props).toMatchObject({ amount: -12, size: 24, signed: true, showExplainer: false, textColor: "inherit" });
  });
});