import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { ResourceBidDialog } from "../../src/features/resources/ResourceBidDialog";

jest.mock("@apollo/client/react", () => ({ useMutation: () => [jest.fn(), { loading: false }] }));
jest.mock("../../src/features/resources/resources.queries", () => ({ CREATE_RESOURCE_BID_MUTATION: "bid" }));
jest.mock("react-i18next", () => ({ useTranslation: () => ({ t: (key: string) => key }) }));

const props = { resourceId: "resource", resourceTitle: "Resource", defaultTokenAmount: 100 };

describe("resource bid icon button", () => {
  it("renders a primary VolunteerActivism icon with an accessible tooltip label", () => {
    const html = renderToStaticMarkup(createElement(ResourceBidDialog, props));
    expect(html).toContain("MuiIconButton-colorPrimary");
    expect(html).toContain('data-testid="VolunteerActivismIcon"');
    expect(html).toContain('aria-label="bidDialog.respondToResource"');
    expect(html).toContain('aria-haspopup="dialog"');
    expect(html).not.toContain(">bidDialog.respondToResource<");
  });

  it.each(["OPEN", "ACCEPTED"] as const)("preserves the %s bid label and disabled state", status => {
    const html = renderToStaticMarkup(createElement(ResourceBidDialog, {
      ...props, existingBid: { id: "bid", message: null, proposedTokenAmount: 100, status }
    }));
    expect(html).toContain(`aria-label="bidDialog.${status === "OPEN" ? "updateResponse" : "responseAccepted"}"`);
    expect(html.includes(" disabled=")).toBe(status === "ACCEPTED");
    if (status === "ACCEPTED") expect(html).toContain("bidDialog.alreadyAccepted");
  });

  it("keeps unavailable resources disabled and explains why", () => {
    const html = renderToStaticMarkup(createElement(ResourceBidDialog, {
      ...props, disabled: true, disabledReason: "Unavailable"
    }));
    expect(html).toContain(" disabled=");
    expect(html).toContain("Unavailable");
  });
});