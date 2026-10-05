import { createElement, type ComponentProps } from "react";
import { renderToStaticMarkup } from "react-dom/server";

import { ListingHeader } from "../../src/features/ui/ListingHeader";
import { NeedCard } from "../../src/features/ui/NeedCard";
import { ResourceCard } from "../../src/features/ui/ResourceCard";

jest.mock("../../src/features/ui/ListingHeader", () => ({
  ListingHeader: jest.fn(() => null)
}));

jest.mock("../../src/components/richText/RichTextContent", () => ({
  RichTextContent: () => null
}));

jest.mock("../../src/components/ZoomableImage", () => ({
  ZoomableImage: () => null
}));

jest.mock("react-i18next", () => ({
  useTranslation: () => ({ t: (key: string) => key })
}));

describe("listing card navigation", () => {
  beforeEach(() => jest.clearAllMocks());

  it.each([NeedCard, ResourceCard])("forwards listing and creator navigation separately (%p)", Card => {
    const onClick = jest.fn();
    const onCreatorClick = jest.fn();
    renderToStaticMarkup(createElement(Card, {
      title: "Listing title",
      creatorName: "Alice",
      imageUrls: ["https://example.com/listing.jpg"],
      onClick,
      onCreatorClick
    }));

    const props = jest.mocked(ListingHeader).mock.calls[0][0] as ComponentProps<typeof ListingHeader>;
    expect(props.onListingClick).toBe(onClick);
    expect(props.onCreatorClick).toBe(onCreatorClick);
    props.onListingClick?.();
    expect(onClick).toHaveBeenCalledTimes(1);
    expect(onCreatorClick).not.toHaveBeenCalled();
  });

  it.each([NeedCard, ResourceCard])("allows header navigation to differ from the card body action (%p)", Card => {
    const onClick = jest.fn();
    const onListingClick = jest.fn();
    renderToStaticMarkup(createElement(Card, {
      title: "Listing title",
      creatorName: "Alice",
      onClick,
      onListingClick
    }));

    const props = jest.mocked(ListingHeader).mock.calls[0][0] as ComponentProps<typeof ListingHeader>;
    expect(props.onListingClick).toBe(onListingClick);
    props.onListingClick?.();
    expect(onListingClick).toHaveBeenCalledTimes(1);
    expect(onClick).not.toHaveBeenCalled();
  });
});