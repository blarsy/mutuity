export function buildNeedContactLoginHref(needId: string) {
  return `/login?next=${encodeURIComponent(`/needs/${needId}`)}`;
}

export function shouldShowNeedContactCta(input: {
  authenticated: boolean;
  viewerAccountId: string | null | undefined;
  creatorAccountId: string;
}) {
  if (!input.authenticated) {
    return true;
  }

  return input.viewerAccountId !== input.creatorAccountId;
}