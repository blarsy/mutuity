import { createElement, type ComponentProps } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import type { GetServerSidePropsContext } from "next";

import AccountDetailsPage, { getServerSideProps } from "../../src/pages/accounts/[accountId]";
import { NeedCard } from "../../src/features/ui/NeedCard";
import { ResourceCard } from "../../src/features/ui/ResourceCard";
import { fetchServerGraphql } from "../../src/features/shared/serverGraphql";
import { MOCK_ACCOUNT_ID, mockAccountDetail, mockAccountNeeds, mockAccountResources } from "../../src/stories/fixtures/listings";

const mockPush = jest.fn();

jest.mock("next/router", () => ({ useRouter: () => ({ push: mockPush }) }));
jest.mock("next/head", () => ({ __esModule: true, default: () => null }));
jest.mock("react-i18next", () => ({ useTranslation: () => ({ t: (key: string) => key }) }));
jest.mock("@vis.gl/react-google-maps", () => ({ APIProvider: () => null, Map: () => null, Marker: () => null }));
jest.mock("../../src/features/contribution/GiftTokensButton", () => ({ GiftTokensButton: () => null }));
jest.mock("../../src/features/ui/NeedCard", () => ({ NeedCard: jest.fn(() => null) }));
jest.mock("../../src/features/ui/ResourceCard", () => ({ ResourceCard: jest.fn(() => null) }));
jest.mock("../../src/features/shared/serverGraphql", () => ({
  fetchServerGraphql: jest.fn(),
  getLanguageFromHeaders: () => "en"
}));

describe("public account listing cards", () => {
  beforeEach(() => jest.clearAllMocks());

  const renderPage = (needs = mockAccountNeeds, resources = mockAccountResources) => renderToStaticMarkup(
    createElement(AccountDetailsPage, {
      accountId: MOCK_ACCOUNT_ID,
      initialAccount: mockAccountDetail,
      initialNeeds: needs,
      initialResources: resources
    })
  );

  it("displays resources before needs and supplies full listing data to need cards", () => {
    const html = renderPage();
    expect(html.indexOf("publicAccount.activeResources")).toBeLessThan(html.indexOf("publicAccount.activeNeeds"));
    expect(jest.mocked(ResourceCard)).toHaveBeenCalledTimes(mockAccountResources.length);
    expect(jest.mocked(NeedCard)).toHaveBeenCalledTimes(mockAccountNeeds.length);
    const props = jest.mocked(NeedCard).mock.calls[0][0] as ComponentProps<typeof NeedCard>;
    expect(props).toMatchObject({
      title: mockAccountNeeds[0].title,
      description: mockAccountNeeds[0].description,
      imageUrls: mockAccountNeeds[0].imageUrls,
      expiresAt: mockAccountNeeds[0].expiresAt,
      creatorName: mockAccountDetail.displayName,
      creatorImageUrl: mockAccountDetail.avatarUrl
    });
    props.onClick?.();
    expect(mockPush).toHaveBeenLastCalledWith(`/needs/${mockAccountNeeds[0].id}`);
    props.onCreatorClick?.();
    expect(mockPush).toHaveBeenLastCalledWith(`/accounts/${MOCK_ACCOUNT_ID}`);
  });

  it("preserves the empty-state messages in resources-first order", () => {
    const html = renderPage([], []);
    expect(html).toContain("publicAccount.noResources");
    expect(html).toContain("publicAccount.noNeeds");
    expect(html.indexOf("publicAccount.activeResources")).toBeLessThan(html.indexOf("publicAccount.activeNeeds"));
    expect(NeedCard).not.toHaveBeenCalled();
    expect(ResourceCard).not.toHaveBeenCalled();
  });

  it("fetches need images, descriptions and expiry for server-rendered cards", async () => {
    jest.mocked(fetchServerGraphql).mockResolvedValue({
      accountById: mockAccountDetail,
      allNeeds: { nodes: mockAccountNeeds },
      allResources: { nodes: mockAccountResources }
    });
    const result = await getServerSideProps({
      params: { accountId: MOCK_ACCOUNT_ID },
      req: { headers: {} }
    } as unknown as GetServerSidePropsContext);
    const query = jest.mocked(fetchServerGraphql).mock.calls[0][0];
    const needSelection = query.slice(query.indexOf("allNeeds("), query.indexOf("allResources("));
    expect(needSelection).toContain("description");
    expect(needSelection).toContain("imageUrls");
    expect(needSelection).toContain("expiresAt");
    expect(result).toMatchObject({ props: { initialNeeds: mockAccountNeeds } });
  });

  it("does not send malformed account route IDs as GraphQL UUID variables", async () => {
    const result = await getServerSideProps({
      params: { accountId: "account-001" },
      req: { headers: {} }
    } as unknown as GetServerSidePropsContext);

    expect(fetchServerGraphql).not.toHaveBeenCalled();
    expect(result).toMatchObject({
      props: {
        accountId: "account-001",
        initialAccount: null,
        initialNeeds: [],
        initialResources: []
      }
    });
  });
});