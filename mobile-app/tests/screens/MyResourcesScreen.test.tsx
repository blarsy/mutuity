import React from "react";
import { fireEvent, render } from "@testing-library/react-native";

import { MyResourcesScreen } from "../../src/screens/resources/MyResourcesScreen";
import type { MyResourceItem } from "../../src/services/graphql/resources";

jest.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (_key: string, options?: { defaultValue?: string }) => options?.defaultValue ?? _key
  })
}));

const sampleResources: MyResourceItem[] = [
  {
    id: "res-001",
    title: "Community bike repair stand",
    description: "Compact stand with full basic tool kit available on weekends.",
    defaultTokenAmount: 22,
    imageUrls: [],
    isActive: true,
    isProduct: true,
    isService: false,
    canBeTakenAway: true,
    canBeDelivered: false,
    canBeExchanged: true,
    canBeGifted: true,
    location: {
      label: "12 Rue des Fleurs, Lyon"
    },
    expiresAt: null,
    updatedAt: "2026-07-10T12:30:00.000Z",
    categoryCodes: [1, 2]
  }
];

describe("MyResourcesScreen", () => {
  it("renders injected resources instead of showing a loading state", () => {
    const { queryByText, getByText } = render(
      <MyResourcesScreen
        creatorAccountId="00000000-0000-0000-0000-000000000111"
        onAddResource={() => undefined}
        onEditResource={() => undefined}
        injectedResources={sampleResources}
      />
    );

    expect(queryByText("Loading...")).toBeNull();
    expect(getByText("Community bike repair stand")).toBeTruthy();
  });

  it("still shows loading when injectedLoading is explicitly true", () => {
    const { getByText } = render(
      <MyResourcesScreen
        creatorAccountId="00000000-0000-0000-0000-000000000111"
        onAddResource={() => undefined}
        onEditResource={() => undefined}
        injectedResources={sampleResources}
        injectedLoading={true}
      />
    );

    expect(getByText("Loading...")).toBeTruthy();
  });

  it("opens the selected resource for editing when its card is pressed", () => {
    const onEditResource = jest.fn();
    const screen = render(
      <MyResourcesScreen
        creatorAccountId="00000000-0000-0000-0000-000000000111"
        onAddResource={() => undefined}
        onEditResource={onEditResource}
        injectedResources={sampleResources}
      />
    );

    fireEvent.press(screen.getByTestId("my-resource-card-res-001"));

    expect(onEditResource).toHaveBeenCalledWith(sampleResources[0]);
  });
});
