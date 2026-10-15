import React from "react";
import { fireEvent, render, waitFor } from "@testing-library/react-native";

import App from "../../src/App";

jest.mock("@react-navigation/native", () => {
  const mockReact = require("react");

  return {
    useNavigationContainerRef: () => ({ current: null, navigate: jest.fn() }),
    NavigationContainer: ({ children }: { children: React.ReactNode }) =>
      mockReact.createElement(mockReact.Fragment, null, children)
  };
});

jest.mock("@react-navigation/native-stack", () => {
  const mockReact = require("react");
  const { View } = require("react-native");

  return {
    createNativeStackNavigator: () => ({
      Navigator: ({ children }: { children: React.ReactNode }) =>
        mockReact.createElement(mockReact.Fragment, null, children),
      Screen: ({ component: Component }: { component: React.ComponentType }) =>
        mockReact.createElement(View, null, mockReact.createElement(Component))
    })
  };
});

jest.mock("../../src/services/auth/session", () => ({
  bootstrapSession: jest.fn().mockResolvedValue({
    token: "mock:123e4567-e89b-12d3-a456-426614174000",
    accountId: "123e4567-e89b-12d3-a456-426614174000"
  }),
  clearPersistedToken: jest.fn(),
  getPersistedAccountId: jest.fn().mockResolvedValue("123e4567-e89b-12d3-a456-426614174000"),
  getPersistedLanguage: jest.fn().mockResolvedValue(null),
  getPersistedToken: jest.fn().mockResolvedValue("mock:123e4567-e89b-12d3-a456-426614174000"),
  setPersistedAccountId: jest.fn(),
  setPersistedLanguage: jest.fn(),
  setPersistedToken: jest.fn()
}));

jest.mock("../../src/services/graphql/resources", () => ({
  ...jest.requireActual("../../src/services/graphql/resources"),
  fetchMyResources: jest.fn().mockResolvedValue([]),
  fetchResourceCategories: jest.fn().mockResolvedValue([])
}));

jest.mock("../../src/services/graphql/campaigns", () => ({
  ...jest.requireActual("../../src/services/graphql/campaigns"),
  fetchLinkableCampaigns: jest.fn().mockResolvedValue([])
}));

jest.mock("../../src/assets/img/CAMERA.svg", () => () => null);
jest.mock("../../src/assets/img/PHOTOS.svg", () => () => null);

jest.mock("@react-native-community/netinfo", () => ({
  __esModule: true,
  default: {
    addEventListener: jest.fn(() => jest.fn()),
    fetch: jest.fn().mockResolvedValue({ isConnected: true, isInternetReachable: true })
  }
}));

describe("US1 manage resources acceptance", () => {
  it("edit resource title/price/images and persist", async () => {
    const screen = render(React.createElement(App));

    await waitFor(() => {
      expect(screen.getByLabelText("Main navigation")).toBeTruthy();
    });

    fireEvent.press(screen.getByTestId("my-hub-section-myResources"));
    await waitFor(() => expect(screen.getByTestId("my-resources-screen")).toBeTruthy());
    fireEvent.press(screen.getAllByRole("button", { name: "Add Resource" })[0]);

    expect(screen.queryByLabelText("Edit resource title")).toBeTruthy();
    expect(screen.queryByLabelText("Edit resource price")).toBeTruthy();
    expect(screen.queryByLabelText("Edit resource images")).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Save resource" })).toBeTruthy();
  });
});