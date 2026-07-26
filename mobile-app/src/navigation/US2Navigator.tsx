import React, { useState } from "react";

import { SearchResourcesScreen } from "../screens/resources/SearchResourcesScreen";
import { SearchNeedsScreen } from "../screens/needs/SearchNeedsScreen";

type ExploreSurface = "resources" | "needs";

export interface US2ExploreScreenProps {
  currentAccountId: string | null;
}

export function US2ExploreScreen({ currentAccountId }: US2ExploreScreenProps): React.JSX.Element {
  const [activeSurface, setActiveSurface] = useState<ExploreSurface>("resources");

  if (activeSurface === "needs") {
    return (
      <SearchNeedsScreen
        currentAccountId={currentAccountId}
        onSwitchToResources={() => setActiveSurface("resources")}
      />
    );
  }

  return (
    <SearchResourcesScreen
      currentAccountId={currentAccountId}
      onSwitchToNeeds={() => setActiveSurface("needs")}
    />
  );
}
