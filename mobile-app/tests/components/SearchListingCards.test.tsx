import React from "react";
import { Image, Pressable, StyleSheet } from "react-native";
import { fireEvent, render } from "@testing-library/react-native";
import { Icon, IconButton } from "react-native-paper";
import { createInstance } from "i18next";
import { I18nextProvider } from "react-i18next";

import {
  NeedSearchCard,
  ResourceSearchCard,
  type NeedSearchListing,
  type ResourceSearchListing
} from "../../src/components/listings/SearchListingCards";
import enCommon from "../../src/i18n/locales/en/common.json";
import enUs2 from "../../src/i18n/locales/en/us2.json";
import frCommon from "../../src/i18n/locales/fr/common.json";
import frUs2 from "../../src/i18n/locales/fr/us2.json";
import { appFontFamilies } from "../../src/theme/fonts";
import { designTokens } from "../../src/theme/tokens";

const resource: ResourceSearchListing = {
  id: "resource-1",
  title: "Garden tools",
  createdAt: "2026-11-14T12:00:00Z",
  creatorDisplayName: "Alice",
  imageUrls: ["https://example.test/first.jpg", "https://example.test/second.jpg"],
  canBeGifted: true,
  canBeExchanged: true
};

const need: NeedSearchListing = {
  id: "need-1",
  title: "Help in the garden",
  createdAt: "2026-11-14T12:00:00Z",
  creatorDisplayName: "Bob",
  imageUrls: ["https://example.test/need.jpg"],
  proposedTokenAmount: 1250
};

function renderCard(card: React.ReactElement, language = "en") {
  const i18n = createInstance();
  void i18n.init({
    lng: language,
    initAsync: false,
    defaultNS: "common",
    interpolation: { escapeValue: false },
    resources: {
      en: { common: enCommon, us2: enUs2 },
      fr: { common: frCommon, us2: frUs2 }
    }
  });
  return {
    ...render(<I18nextProvider i18n={i18n}>{card}</I18nextProvider>),
    i18n
  };
}

describe("ResourceSearchCard", () => {
  it("preserves the first image, author, date, ordered flags and search typography", () => {
    const screen = renderCard(<ResourceSearchCard listing={resource} />);
    const image = screen.UNSAFE_getByType(Image);
    expect(image.props.source).toEqual({ uri: resource.imageUrls?.[0] });
    expect(StyleSheet.flatten(image.props.style)).toEqual({
      width: 92,
      height: 92,
      borderRadius: designTokens.radius.md,
      backgroundColor: "#fff"
    });
    expect(screen.getByTestId("resource-card-resource-1")).toHaveStyle({
      flexDirection: "row",
      gap: 12,
      paddingHorizontal: 8,
      paddingVertical: 8,
      borderRadius: designTokens.radius.md,
      backgroundColor: designTokens.colors.primaryContainer
    });
    expect(screen.getByText(resource.title)).toHaveProp("numberOfLines", 2);
    expect(screen.getByText(resource.title)).toHaveStyle({
      fontFamily: appFontFamilies.altGeneral,
      fontSize: 16,
      lineHeight: 20
    });
    expect(screen.getByText("Brought by Alice")).toBeTruthy();
    const date = new Intl.DateTimeFormat("en", {
      day: "2-digit", month: "2-digit", year: "numeric"
    }).format(new Date(resource.createdAt!));
    expect(screen.getByText(`Published ${date}`)).toBeTruthy();
    expect(screen.getAllByText(/^(Gift|Exchange)$/).map(node => node.props.children))
      .toEqual(["Gift", "Exchange"]);
    expect(screen.getByText("Gift")).toHaveStyle({ textTransform: "uppercase" });
  });

  it("is read-only without callbacks and provides the original image fallback", () => {
    const screen = renderCard(<ResourceSearchCard listing={{ id: "minimal", title: "Tools" }} />);
    expect(screen.getByTestId("resource-card-minimal")).toBeTruthy();
    expect(screen.UNSAFE_queryAllByType(Pressable)).toHaveLength(0);
    expect(screen.queryAllByRole("button")).toHaveLength(0);
    expect(screen.UNSAFE_queryAllByType(Image)).toHaveLength(0);
    expect(screen.UNSAFE_getByType(Icon).props).toMatchObject({ source: "image-outline", size: 20 });
    expect(screen.getByText("Brought by Anonymous")).toBeTruthy();
    expect(screen.getByText("Published -")).toBeTruthy();
    expect(screen.queryByText("Gift")).toBeNull();
    expect(screen.queryByText("Exchange")).toBeNull();
    expect(screen.queryByTestId("resource-card-chat-minimal")).toBeNull();
  });

  it("delegates opening and chat separately, preserving search accessibility and the chat icon", () => {
    const onPress = jest.fn();
    const onStartChat = jest.fn();
    const stopPropagation = jest.fn();
    const label = "Garden tools. Garden. 2.0 km.";
    const screen = renderCard(
      <ResourceSearchCard
        listing={resource}
        onPress={onPress}
        onStartChat={onStartChat}
        accessibilityLabel={label}
      />
    );
    expect(screen.getByTestId("resource-card-resource-1")).toHaveProp("accessibilityLabel", label);
    expect(screen.UNSAFE_getByType(IconButton).props).toMatchObject({ icon: "chat-outline", size: 15 });
    fireEvent.press(screen.getByTestId("resource-card-chat-resource-1"), { stopPropagation });
    expect(stopPropagation).toHaveBeenCalledTimes(1);
    expect(onStartChat).toHaveBeenCalledTimes(1);
    expect(onPress).not.toHaveBeenCalled();
    fireEvent.press(screen.getByTestId("resource-card-resource-1"));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it("allows chat without a pressable card and defaults the opening label to the title", () => {
    const onStartChat = jest.fn();
    const screen = renderCard(<ResourceSearchCard listing={resource} onStartChat={onStartChat} />);
    expect(screen.getByTestId("resource-card-resource-1").props.onPress).toBeUndefined();
    fireEvent.press(screen.getByTestId("resource-card-chat-resource-1"), { stopPropagation: jest.fn() });
    expect(onStartChat).toHaveBeenCalledTimes(1);
    screen.unmount();
    const openingCard = renderCard(<ResourceSearchCard listing={resource} onPress={jest.fn()} />);
    expect(openingCard.getByRole("button", { name: resource.title })).toBeTruthy();
  });

  it("localizes common metadata and flags and handles invalid dates", () => {
    const screen = renderCard(
      <ResourceSearchCard listing={{ ...resource, createdAt: "invalid", creatorDisplayName: null }} />,
      "fr"
    );
    expect(screen.getByText("Publié -")).toBeTruthy();
    expect(screen.getByText("Proposé par Anonyme")).toBeTruthy();
    expect(screen.getByText("Don")).toBeTruthy();
    expect(screen.getByText("Échange")).toBeTruthy();
  });
});

describe("NeedSearchCard", () => {
  it("preserves image, author, date, token format and search accessibility", () => {
    const onPress = jest.fn();
    const screen = renderCard(<NeedSearchCard listing={need} onPress={onPress} />);
    expect(screen.UNSAFE_getByType(Image).props.source).toEqual({ uri: need.imageUrls?.[0] });
    expect(screen.UNSAFE_getByType(Image).props.style).toMatchObject({ width: 92, height: 92 });
    expect(screen.getByText("Brought by Bob")).toBeTruthy();
    const date = new Intl.DateTimeFormat("en", {
      day: "2-digit", month: "2-digit", year: "numeric"
    }).format(new Date(need.createdAt!));
    expect(screen.getByText(`Published ${date}`)).toBeTruthy();
    expect(screen.getByText("1250 Topes")).toBeTruthy();
    expect(screen.getByText(need.title)).toHaveStyle({
      flex: 1,
      fontFamily: appFontFamilies.altGeneral,
      fontSize: 16,
      lineHeight: 20
    });
    expect(screen.getByText(need.title)).toHaveProp("numberOfLines", 2);
    fireEvent.press(screen.getByRole("button", { name: "Help in the garden. 1250 Tope." }));
    expect(onPress).toHaveBeenCalledTimes(1);
    expect(screen.UNSAFE_queryAllByType(IconButton)).toHaveLength(0);
  });

  it.each([null, "invalid"])("renders missing images/author and %s dates without interactive controls", createdAt => {
    const screen = renderCard(
      <NeedSearchCard listing={{ id: "minimal", title: "Help", proposedTokenAmount: null, createdAt }} />
    );
    expect(screen.getByTestId("need-card-minimal")).toBeTruthy();
    expect(screen.getByText("Published -")).toBeTruthy();
    expect(screen.getByText("Brought by Anonymous")).toBeTruthy();
    expect(screen.UNSAFE_getByType(Icon).props.source).toBe("image-outline");
    expect(screen.UNSAFE_queryAllByType(Image)).toHaveLength(0);
    expect(screen.UNSAFE_queryAllByType(Pressable)).toHaveLength(0);
    expect(screen.queryAllByRole("button")).toHaveLength(0);
    // Unknown token amounts must not be invented as zero.
    expect(screen.queryByText("0 Topes")).toBeNull();
  });

  it("keeps common metadata and us2 token translations in French, including zero amounts", () => {
    const screen = renderCard(
      <NeedSearchCard listing={{ ...need, creatorDisplayName: null, proposedTokenAmount: 0 }} />,
      "fr"
    );
    const date = new Intl.DateTimeFormat("fr", {
      day: "2-digit", month: "2-digit", year: "numeric"
    }).format(new Date(need.createdAt!));
    expect(screen.getByText(`Publié ${date}`)).toBeTruthy();
    expect(screen.getByText("Proposé par Anonyme")).toBeTruthy();
    expect(screen.getByText(screen.i18n.t("needTokenAmount", { ns: "us2", amount: 0 }))).toBeTruthy();
  });
});