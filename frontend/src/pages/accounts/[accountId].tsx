import Head from "next/head";
import type { GetServerSideProps } from "next";
import NextLink from "next/link";
import { useRouter } from "next/router";
import { useTranslation } from "react-i18next";
import { Alert, Avatar, Box, Card, CardContent, Chip, Container, Link, List, ListItem, Stack, Typography } from "@mui/material";
import { APIProvider, Map as GoogleMap, Marker } from "@vis.gl/react-google-maps";
import FacebookIcon from "@mui/icons-material/Facebook";
import InstagramIcon from "@mui/icons-material/Instagram";
import TwitterIcon from "@mui/icons-material/Twitter";
import WebIcon from "@mui/icons-material/Web";
import { useEffect, useState } from "react";

import {
  buildAccountPageMeta,
  resolveAccountAvailabilityState,
  type PublicAvailabilityState
} from "../../features/shared/publicPageSeo";
import { fetchServerGraphql } from "../../features/shared/serverGraphql";
import { ResourceCard } from "../../features/ui/ResourceCard";
import { listingCardGridSx } from "../../features/ui/listingCardGrid";

const MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? "";

type ProfileLinkType = "website" | "facebook" | "instagram" | "x";

type ProfileLink = {
  url: string;
  label: string;
  type: ProfileLinkType;
};

type AccountResource = {
  id: string;
  title: string;
  description: string | null;
  location: string | null;
  imageUrls: string[];
  expiresAt: string | null;
  intensity: string;
  defaultTokenAmount: number | null;
  isProduct: boolean;
  isService: boolean;
  canBeGiven: boolean;
  canBeExchanged: boolean;
  canBeTakenAway: boolean;
  canBeDelivered: boolean;
};

type PublicAccountDetailData = {
  accountById: {
    id: string;
    displayName: string | null;
    externalSubject: string;
    bio: string | null;
    location: string | null;
    latitude: number | null;
    longitude: number | null;
    avatarUrl: string | null;
    profileLinks: unknown;
  } | null;
  allNeeds: {
    nodes: Array<{
      id: string;
      title: string;
    }>;
  } | null;
  allResources: {
    nodes: AccountResource[];
  } | null;
};

type AccountDetailsPageProps = {
  accountId: string;
  initialAccount: PublicAccountDetailData["accountById"];
  initialNeeds: Array<{ id: string; title: string }>;
  initialResources: AccountResource[];
};

const PUBLIC_ACCOUNT_DETAIL_SSR_QUERY = `
  query PublicAccountDetailSSR($accountId: UUID!) {
    accountById(id: $accountId) {
      id
      displayName
      externalSubject
      bio
      location
      latitude
      longitude
      avatarUrl
      profileLinks
    }
    allNeeds(
      condition: { creatorAccountId: $accountId, isActive: true }
      first: 5
      orderBy: ID_DESC
    ) {
      nodes {
        id
        title
      }
    }
    allResources(
      condition: { creatorAccountId: $accountId, isActive: true }
      first: 5
      orderBy: ID_DESC
    ) {
      nodes {
        id
        title
        description
        location
        imageUrls
        expiresAt
        intensity
        defaultTokenAmount
        isProduct
        isService
        canBeGiven
        canBeExchanged
        canBeTakenAway
        canBeDelivered
      }
    }
  }
`;

function ProfileLinkIcon({ type }: { type: ProfileLinkType }) {
  switch (type) {
    case "facebook": return <FacebookIcon color="primary" />;
    case "instagram": return <InstagramIcon color="primary" />;
    case "x": return <TwitterIcon color="primary" />;
    case "website": return <WebIcon color="primary" />;
  }
}

export default function AccountDetailsPage({
  accountId,
  initialAccount,
  initialNeeds,
  initialResources
}: AccountDetailsPageProps) {
  const router = useRouter();
  const { t } = useTranslation("common");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const availabilityState = resolveAccountAvailabilityState(initialAccount);
  const pageMeta = buildAccountPageMeta({
    accountId,
    displayName: initialAccount?.displayName,
    bio: initialAccount?.bio
  });
  const displayName = initialAccount?.displayName || t("publicAccount.fallbackName");
  const initials = displayName
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map(token => token[0]?.toUpperCase() || "")
    .join("");
  const hasProfile = Boolean(initialAccount);
  const account = initialAccount;

  const profileLinks: ProfileLink[] = Array.isArray(account?.profileLinks)
    ? (account.profileLinks as ProfileLink[]).filter(l => Boolean(l?.url))
    : [];

  const latitude = Number(account?.latitude);
  const longitude = Number(account?.longitude);
  const hasCompleteLocation =
    Boolean(account?.location?.trim()) &&
    Number.isFinite(latitude) &&
    Number.isFinite(longitude);

  return (
    <Container maxWidth="md">
      <Head>
        <title>{pageMeta.title}</title>
        <meta content={pageMeta.description} name="description" />
        <meta content={pageMeta.title} property="og:title" />
        <meta content={pageMeta.description} property="og:description" />
        <link href={pageMeta.canonicalUrl} rel="canonical" />
      </Head>
      <Box sx={{ py: 6 }}>
        <Stack spacing={2.5}>
          <Typography component="h1" variant="h4">{displayName}</Typography>
          <AccountAvailabilityAlert state={availabilityState} />

          {!hasProfile || !account ? (
            <Alert severity="warning">{t("publicAccount.unavailable")}</Alert>
          ) : (
            <Card variant="outlined">
              <CardContent>
                <Stack spacing={2}>
                  <Stack alignItems="center" direction="row" spacing={2}>
                    <Avatar alt={displayName} src={account.avatarUrl || undefined}>
                      {initials}
                    </Avatar>
                    <Typography variant="h6">{displayName}</Typography>
                  </Stack>

                  {account.bio ? (
                    <Typography variant="body1">{account.bio}</Typography>
                  ) : null}

                  {account.location ? (
                    <Stack spacing={1}>
                      <Typography color="text.secondary" variant="body2">{account.location}</Typography>
                      {mounted && hasCompleteLocation && MAPS_API_KEY ? (
                        <Box sx={{ aspectRatio: "16 / 9", borderRadius: 1, overflow: "hidden", width: "100%" }}>
                          <APIProvider apiKey={MAPS_API_KEY}>
                            <GoogleMap
                              center={{ lat: latitude, lng: longitude }}
                              defaultZoom={14}
                              clickableIcons={false}
                              mapTypeControl={false}
                              streetViewControl={false}
                              fullscreenControl={false}
                              style={{ width: "100%", height: "100%" }}
                            >
                              <Marker position={{ lat: latitude, lng: longitude }} />
                            </GoogleMap>
                          </APIProvider>
                        </Box>
                      ) : null}
                    </Stack>
                  ) : null}

                  {profileLinks.length > 0 ? (
                    <Stack spacing={0.5}>
                      <Typography color="text.secondary" variant="overline">
                        {t("publicAccount.links")}
                      </Typography>
                      <Stack spacing={0.5}>
                        {profileLinks.map((link, idx) => (
                          <Stack key={idx} alignItems="center" direction="row" spacing={1}>
                            <ProfileLinkIcon type={link.type} />
                            <Link
                              href={link.url}
                              rel="noopener noreferrer"
                              target="_blank"
                              underline="hover"
                              variant="body2"
                            >
                              {link.label || link.url}
                            </Link>
                          </Stack>
                        ))}
                      </Stack>
                    </Stack>
                  ) : null}

                  <Stack direction="row" spacing={1}>
                    <Chip label={availabilityState.toLowerCase()} size="small" />
                    <Chip label={t("publicAccount.needsCount", { count: initialNeeds.length })} size="small" />
                    <Chip label={t("publicAccount.resourcesCount", { count: initialResources.length })} size="small" />
                  </Stack>
                </Stack>
              </CardContent>
            </Card>
          )}

          <Stack spacing={1}>
            <Typography variant="h6">{t("publicAccount.activeNeeds")}</Typography>
            {initialNeeds.length ? (
              <List disablePadding>
                {initialNeeds.map(need => (
                  <ListItem disableGutters key={need.id}>
                    <Typography component={NextLink} href={`/needs/${need.id}`} variant="body2">
                      {need.title}
                    </Typography>
                  </ListItem>
                ))}
              </List>
            ) : (
              <Typography color="text.secondary" variant="body2">{t("publicAccount.noNeeds")}</Typography>
            )}
          </Stack>

          <Stack spacing={1}>
            <Typography variant="h6">{t("publicAccount.activeResources")}</Typography>
            {initialResources.length ? (
              <Box sx={listingCardGridSx}>
                {initialResources.map(resource => (
                  <ResourceCard
                    key={resource.id}
                    title={resource.title}
                    creatorName={displayName}
                    creatorImageUrl={account?.avatarUrl}
                    description={resource.description}
                    expiresAt={resource.expiresAt}
                    imageUrls={resource.imageUrls}
                    location={resource.location}
                    onClick={() => {
                      void router.push(`/resources/${resource.id}`);
                    }}
                  />
                ))}
              </Box>
            ) : (
              <Typography color="text.secondary" variant="body2">{t("publicAccount.noResources")}</Typography>
            )}
          </Stack>
        </Stack>
      </Box>
    </Container>
  );
}

function AccountAvailabilityAlert({ state }: { state: PublicAvailabilityState }) {
  if (state === "VISIBLE_DELETED") {
    return <Alert severity="warning">This account has been deleted and anonymized.</Alert>;
  }

  return null;
}

export const getServerSideProps: GetServerSideProps<AccountDetailsPageProps> = async context => {
  const rawAccountId = context.params?.accountId;

  if (typeof rawAccountId !== "string") {
    return { notFound: true };
  }

  const data = await fetchServerGraphql<PublicAccountDetailData>(PUBLIC_ACCOUNT_DETAIL_SSR_QUERY, {
    accountId: rawAccountId
  });

  if (!data) {
    return {
      props: {
        accountId: rawAccountId,
        initialAccount: null,
        initialNeeds: [],
        initialResources: []
      }
    };
  }

  return {
    props: {
      accountId: rawAccountId,
      initialAccount: data.accountById,
      initialNeeds: data.allNeeds?.nodes ?? [],
      initialResources: data.allResources?.nodes ?? []
    }
  };
};
