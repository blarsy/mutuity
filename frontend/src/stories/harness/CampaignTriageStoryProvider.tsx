import { useMemo, type ReactNode } from "react";

import { createCampaignTriageMocks, type CampaignTriageKind, type CampaignTriagePhase } from "./campaignTriageMocks";
import { MockApolloProvider } from "./mockApollo";

export function CampaignTriageStoryProvider({
  children, kind, phase
}: {
  children: ReactNode;
  kind: CampaignTriageKind;
  phase: CampaignTriagePhase;
}) {
  // Keep decisions through refetches, but reset them when the story remounts.
  const parameters = useMemo(() => createCampaignTriageMocks(kind, phase), [kind, phase]);
  return <MockApolloProvider parameters={parameters}>{children}</MockApolloProvider>;
}