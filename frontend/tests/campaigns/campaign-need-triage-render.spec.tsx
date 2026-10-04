import { renderToStaticMarkup } from "react-dom/server";
import { useQuery } from "@apollo/client/react";

import CampaignNeedTriagePage from "../../src/features/campaigns/CampaignNeedTriagePage";
import CampaignResourceTriagePage from "../../src/features/campaigns/CampaignResourceTriagePage";
import { createCampaignTriageMocks } from "../../src/stories/harness/campaignTriageMocks";

jest.mock("next/router", () => ({ useRouter: () => ({ query: {} }) }));
jest.mock("../../src/i18n", () => ({ __esModule: true, default: { language: "en" } }));
jest.mock("react-i18next", () => ({ useTranslation: () => ({ t: (key: string) => key }) }));
jest.mock("../../src/features/auth/requireAuth", () => ({
  useRequireAuth: () => ({ isAuthenticated: true, isChecking: false, isRedirecting: false })
}));
jest.mock("@apollo/client/react", () => ({
  useQuery: jest.fn(),
  useMutation: () => [jest.fn(), { loading: false }]
}));

describe("campaign need triage missing connection regression", () => {
  it.each([undefined, {}, { allCampaignNeeds: null }, { allCampaignNeeds: { nodes: [] } }])(
    "renders safely with query data %p", data => {
      jest.mocked(useQuery).mockReturnValue({ data, loading: false } as ReturnType<typeof useQuery>);
      const html = renderToStaticMarkup(<CampaignNeedTriagePage />);
      expect(html).toContain("triage.empty");
      expect(html).toContain("triage.title");
    }
  );
});

describe.each(["need", "resource"] as const)("%s triage detail links", kind => {
  it.each([false, true])("opens detail pages safely in a new browsing context (missing detail: %s)", missingDetail => {
    const mocks = createCampaignTriageMocks(kind, "pending");
    const operationName = kind === "need" ? "CampaignNeedTriage" : "CampaignResourceTriage";
    const resolver = mocks.operations![operationName]!;
    const data = typeof resolver === "function" ? resolver({}) : resolver;
    const connectionName = kind === "need" ? "allCampaignNeeds" : "allCampaignResources";
    const nodes = (data[connectionName] as { nodes: Record<string, unknown>[] }).nodes;
    if (missingDetail) {
      nodes[0]![kind === "need" ? "needByNeedId" : "resourceByResourceId"] = null;
    }
    jest.mocked(useQuery).mockReturnValue({ data, loading: false } as ReturnType<typeof useQuery>);
    const Page = kind === "need" ? CampaignNeedTriagePage : CampaignResourceTriagePage;
    const html = renderToStaticMarkup(<Page />);
    const anchors = html.match(/<a\b[^>]*>/g) ?? [];
    expect(anchors).toHaveLength(nodes.length);
    nodes.forEach((node, index) => {
      expect(anchors[index]).toContain(`href="/${kind}s/${node[kind === "need" ? "needId" : "resourceId"]}"`);
      expect(anchors[index]).toContain('target="_blank"');
      expect(anchors[index]).toContain('rel="noopener noreferrer"');
    });
  });
});