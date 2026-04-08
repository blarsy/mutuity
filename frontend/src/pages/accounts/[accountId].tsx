import { useRouter } from "next/router";

import { PlaceholderPage } from "../../features/layout/PlaceholderPage";

export default function AccountDetailsPage() {
  const router = useRouter();
  const accountId = typeof router.query.accountId === "string" ? router.query.accountId : "this account";

  return (
    <PlaceholderPage
      title="Account details"
      description={`This reserved public page will show the profile, resources, and needs for ${accountId}.`}
    />
  );
}
