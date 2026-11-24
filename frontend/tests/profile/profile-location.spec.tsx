/** @jest-environment jsdom */
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { useMutation, useQuery } from "@apollo/client/react";

import ProfilePage from "../../src/pages/profile";
import { ACCOUNT_PROFILE_QUERY } from "../../src/features/profile/profile.queries";

jest.mock("@apollo/client/react", () => ({ useQuery: jest.fn(), useMutation: jest.fn() }));
jest.mock("next/router", () => ({ useRouter: () => ({ replace: jest.fn() }) }));
jest.mock("react-i18next", () => ({
  useTranslation: () => ({ t: (key: string) => key, i18n: { language: "fr" } })
}));
jest.mock("../../src/features/auth/AuthProvider", () => ({
  useAuth: () => ({ session: { account: { id: "account-id" } }, refreshSession: jest.fn(), signOut: jest.fn() })
}));
jest.mock("../../src/features/auth/requireAuth", () => ({ useRequireAuth: () => ({ isAuthenticated: true }) }));
jest.mock("../../src/features/auth/ChangePasswordDialog", () => ({ ChangePasswordDialog: () => null }));
jest.mock("../../src/components/SingleImageUploadField", () => ({ SingleImageUploadField: () => null }));
jest.mock("../../src/components/PageContainer", () => ({ PageContainer: ({ children }: { children: React.ReactNode }) => <>{children}</> }));
jest.mock("@vis.gl/react-google-maps", () => ({
  APIProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  Map: () => <div data-testid="map" />,
  Marker: () => null,
  useMap: () => null,
  useMapsLibrary: () => null
}));

describe("profile location removal", () => {
  let container: HTMLDivElement;
  let root: Root;
  const updateProfile = jest.fn();
  const refetch = jest.fn();

  beforeEach(() => {
    (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    jest.clearAllMocks();
    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);
    updateProfile.mockResolvedValue({ data: {} });
    (useMutation as unknown as jest.Mock).mockReturnValue([updateProfile, {}]);
  });

  afterEach(() => {
    act(() => root.unmount());
    container.remove();
  });

  it.each([
    { location: "Tournai", latitude: "50.6072", longitude: "3.3889" },
    { location: null, latitude: null, longitude: null }
  ])("saves absent location fields as null, including after reload (%o)", async profile => {
    const data = { accountById: { id: "account-id", ...profile } };
    (useQuery as unknown as jest.Mock).mockImplementation(query => ({
      data: query === ACCOUNT_PROFILE_QUERY ? data : { currentAccountEmail: "me@example.com" },
      refetch
    }));
    act(() => root.render(<ProfilePage />));

    const remove = container.querySelector<HTMLButtonElement>('button[aria-label="locationPicker.remove"]');
    if (profile.location) {
      expect(remove).not.toBeNull();
      expect(container.querySelector('[data-testid="map"]')).not.toBeNull();
      act(() => remove!.click());
    } else {
      expect(remove).toBeNull();
    }
    expect(container.querySelector('button[aria-label="locationPicker.remove"]')).toBeNull();
    expect(container.querySelector('[data-testid="map"]')).toBeNull();
    const save = Array.from(container.querySelectorAll("button")).find(button => button.textContent === "saveButton");
    await act(async () => { save!.click(); });
    expect(updateProfile).toHaveBeenCalledWith({ variables: {
      accountId: "account-id",
      patch: expect.objectContaining({ location: null, latitude: null, longitude: null })
    } });
  });
});