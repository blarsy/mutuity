export type PublicAvailabilityState =
  | "VISIBLE_ACTIVE"
  | "VISIBLE_ENDED"
  | "VISIBLE_DELETED"
  | "NOT_FOUND_OR_HIDDEN";

type NeedLike = {
  isActive: boolean;
  expiresAt: string | null;
};

type CampaignLike = {
  startAt: string;
  endAt: string;
};

type AccountLike = {
  externalSubject: string;
};

type PageMeta = {
  title: string;
  description: string;
  canonicalUrl: string;
  ogImageUrl?: string;
};

const DEFAULT_SITE_URL = "http://localhost:3000";
const CAMPAIGN_OG_IMAGE_SIZE = 600;
const CAMPAIGN_OG_FALLBACK_PATH = "/campaign.svg";

function nowMs() {
  return Date.now();
}

function safeDateMs(value: string | null | undefined) {
  if (!value) {
    return null;
  }

  const timestamp = new Date(value).getTime();
  return Number.isFinite(timestamp) ? timestamp : null;
}

export function plainText(value: string | null | undefined, fallback = "") {
  if (!value) {
    return fallback;
  }

  const collapsed = value
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/\s+/g, " ")
    .trim();

  return collapsed || fallback;
}

export function canonicalUrlForPath(pathname: string) {
  const baseUrl = (process.env.NEXT_PUBLIC_SITE_URL || DEFAULT_SITE_URL).replace(/\/$/, "");
  const path = pathname.startsWith("/") ? pathname : `/${pathname}`;
  return `${baseUrl}${path}`;
}

function buildCampaignOgImageUrl(imageUrl: string | null | undefined) {
  const fallbackUrl = canonicalUrlForPath(CAMPAIGN_OG_FALLBACK_PATH);
  if (!imageUrl) {
    return fallbackUrl;
  }

  const cloudinaryMatch = imageUrl.match(/^(https?:\/\/res\.cloudinary\.com\/[^/]+\/image\/upload\/)(.+)$/i);
  if (!cloudinaryMatch) {
    return imageUrl;
  }

  return `${cloudinaryMatch[1]}c_fill,g_auto,h_${CAMPAIGN_OG_IMAGE_SIZE},w_${CAMPAIGN_OG_IMAGE_SIZE}/${cloudinaryMatch[2]}`;
}

export function resolveNeedAvailabilityState(need: NeedLike | null): PublicAvailabilityState {
  if (!need) {
    return "NOT_FOUND_OR_HIDDEN";
  }

  if (!need.isActive) {
    return "VISIBLE_DELETED";
  }

  const expiresAtMs = safeDateMs(need.expiresAt);
  if (expiresAtMs !== null && expiresAtMs <= nowMs()) {
    return "VISIBLE_ENDED";
  }

  return "VISIBLE_ACTIVE";
}

export function resolveCampaignAvailabilityState(campaign: CampaignLike | null): PublicAvailabilityState {
  if (!campaign) {
    return "NOT_FOUND_OR_HIDDEN";
  }

  const endAtMs = safeDateMs(campaign.endAt);
  if (endAtMs !== null && endAtMs <= nowMs()) {
    return "VISIBLE_ENDED";
  }

  return "VISIBLE_ACTIVE";
}

export function resolveAccountAvailabilityState(account: AccountLike | null): PublicAvailabilityState {
  if (!account) {
    return "NOT_FOUND_OR_HIDDEN";
  }

  if (account.externalSubject.startsWith("deleted-")) {
    return "VISIBLE_DELETED";
  }

  return "VISIBLE_ACTIVE";
}

export function buildNeedPageMeta(input: {
  needTitle: string | null | undefined;
  needDescription: string | null | undefined;
  needId: string;
}): PageMeta {
  return {
    title: plainText(input.needTitle, "Need"),
    description: plainText(input.needDescription, "Need details on Mutuity"),
    canonicalUrl: canonicalUrlForPath(`/needs/${input.needId}`)
  };
}

export function buildCampaignPageMeta(input: {
  campaignTitle: string | null | undefined;
  campaignDescription: string | null | undefined;
  campaignId: string;
  campaignImageUrl: string | null | undefined;
}): PageMeta {
  return {
    title: plainText(input.campaignTitle, "Campaign"),
    description: plainText(input.campaignDescription, "Campaign details on Mutuity"),
    canonicalUrl: canonicalUrlForPath(`/campaigns/${input.campaignId}`),
    ogImageUrl: buildCampaignOgImageUrl(input.campaignImageUrl)
  };
}

export function buildAccountPageMeta(input: {
  displayName: string | null | undefined;
  bio: string | null | undefined;
  accountId: string;
}): PageMeta {
  const title = plainText(input.displayName, "Account");
  const description = plainText(input.bio, `${title} on Mutuity`);

  return {
    title,
    description,
    canonicalUrl: canonicalUrlForPath(`/accounts/${input.accountId}`)
  };
}