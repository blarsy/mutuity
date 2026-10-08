import React, { useState } from "react";

import { AccountPublicProfileScreen, type AccountPublicProfileScreenProps } from "../screens/profile/AccountPublicProfileScreen";
import { ResourceDetailScreen } from "../screens/resources/ResourceDetailScreen";
import { NeedDetailScreen } from "../screens/needs/NeedDetailScreen";

type ProfileListing = { kind: "resource" | "need"; id: string };

interface AccountPublicProfileNavigatorProps extends Omit<AccountPublicProfileScreenProps, "onOpenResource" | "onOpenNeed"> {
  currentAccountId: string | null;
}

// Keep profile-originated details separate from the listing that originally opened the profile.
export function AccountPublicProfileNavigator({
  currentAccountId,
  ...profileProps
}: AccountPublicProfileNavigatorProps): React.JSX.Element {
  const [listing, setListing] = useState<ProfileListing | null>(null);
  const returnToProfile = (): void => setListing(null);

  if (listing?.kind === "resource") {
    return (
      <ResourceDetailScreen
        resourceId={listing.id}
        currentAccountId={currentAccountId}
        onBack={returnToProfile}
        onOpenCreatorAccount={returnToProfile}
      />
    );
  }

  if (listing?.kind === "need") {
    return (
      <NeedDetailScreen
        needId={listing.id}
        currentAccountId={currentAccountId}
        onBack={returnToProfile}
        onOpenCreatorAccount={returnToProfile}
      />
    );
  }

  return (
    <AccountPublicProfileScreen
      {...profileProps}
      onOpenResource={(id) => setListing({ kind: "resource", id })}
      onOpenNeed={(id) => setListing({ kind: "need", id })}
    />
  );
}