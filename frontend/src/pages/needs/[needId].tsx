import { useRouter } from "next/router";

import { PlaceholderPage } from "../../features/layout/PlaceholderPage";

export default function NeedDetailsPage() {
  const router = useRouter();
  const needId = typeof router.query.needId === "string" ? router.query.needId : "this need";

  return (
    <PlaceholderPage
      title="Need details"
      description={`A dedicated public detail page for ${needId} is reserved in the new shared UI architecture.`}
    />
  );
}
