import { renderToStaticMarkup } from "react-dom/server";
import { useQuery } from "@apollo/client/react";

import CampaignNeedTriagePage from "../../src/features/campaigns/CampaignNeedTriagePage";

jest.mock("next/router", () => ({ useRouter: () => ({ query: {} }) }));
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