import { ButtonBase } from "@mui/material";
import { Children, createElement, isValidElement, type ReactElement, type ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";

import { AvatarIconButton } from "../../src/features/ui/AvatarIconButton";
import { ListingHeader } from "../../src/features/ui/ListingHeader";

type ElementProps = {
  children?: ReactNode;
  component?: string;
  disabled?: boolean;
  onClick?: (event: { stopPropagation: () => void }) => void;
};

function findElements(node: ReactNode, type: unknown): ReactElement<ElementProps>[] {
  const matches: ReactElement<ElementProps>[] = [];
  Children.forEach(node, child => {
    if (!isValidElement<ElementProps>(child)) return;
    if (child.type === type) matches.push(child);
    matches.push(...findElements(child.props.children, type));
  });
  return matches;
}

describe("ListingHeader", () => {
  it("renders creator and expiry info", () => {
    const html = renderToStaticMarkup(
      createElement(ListingHeader, {
        creatorName: "Alice",
        listingTitle: "Resource title",
        expiresAt: "2026-06-01T10:00:00.000Z",
        expiresLabel: "Expires",
        noDateLabel: "No expiry set",
      })
    );

    expect(html).toContain("Alice");
    expect(html).toContain("Resource title");
    expect(html).toContain("Expires:");
  });

  it("renders fallback labels when no image and no expiry", () => {
    const html = renderToStaticMarkup(
      createElement(ListingHeader, {
        creatorName: "Bob",
        listingTitle: "Need title",
        expiresAt: null,
        expiresLabel: "Expires",
        noDateLabel: "No expiry set",
        noImageLabel: "No image"
      })
    );

    expect(html).toContain("No image");
    expect(html).toContain("No expiry set");
  });

  it.each([null, "https://example.com/listing.jpg"])(
    "calls the listing callback from both title and thumbnail (image: %s)",
    thumbnailUrl => {
      const onListingClick = jest.fn();
      const onCreatorClick = jest.fn();
      const tree = ListingHeader({
        creatorName: "Alice",
        listingTitle: "Resource title",
        expiresLabel: "Expires",
        noDateLabel: "No expiry set",
        thumbnailUrl,
        onListingClick,
        onCreatorClick
      });
      const controls = findElements(tree, ButtonBase);
      const listingControls = controls.filter(control => control.props.component === "button");
      expect(listingControls).toHaveLength(2);

      for (const control of listingControls) {
        const stopPropagation = jest.fn();
        control.props.onClick?.({ stopPropagation });
        expect(stopPropagation).toHaveBeenCalledTimes(1);
        // Creator avatar must remain a sibling, not a nested button.
        expect(findElements(control.props.children, AvatarIconButton)).toHaveLength(0);
      }
      expect(onListingClick).toHaveBeenCalledTimes(2);
      expect(onCreatorClick).not.toHaveBeenCalled();

      const creatorControl = controls.find(control => control.props.component === undefined);
      const avatarControl = findElements(tree, AvatarIconButton)[0];
      for (const control of [creatorControl, avatarControl]) {
        const stopPropagation = jest.fn();
        control?.props.onClick?.({ stopPropagation });
        expect(stopPropagation).toHaveBeenCalledTimes(1);
      }
      expect(onCreatorClick).toHaveBeenCalledTimes(2);
      expect(onListingClick).toHaveBeenCalledTimes(2);

      const html = renderToStaticMarkup(tree);
      expect(html.match(/<button/g)).toHaveLength(4);
      expect(html).toContain('aria-label="Resource title"');
    }
  );

  it("does not make the title or thumbnail interactive without a listing callback", () => {
    const tree = ListingHeader({
      creatorName: "Alice",
      listingTitle: "Need title",
      expiresLabel: "Expires",
      noDateLabel: "No expiry set"
    });
    const listingControls = findElements(tree, ButtonBase)
      .filter(control => control.props.component === "div");
    expect(listingControls).toHaveLength(2);
    listingControls.forEach(control => {
      expect(control.props.onClick).toBeUndefined();
      expect(control.props.disabled).toBe(true);
    });
  });
});
