import Head from "next/head";
import type { GetServerSideProps } from "next";
import NextLink from "next/link";
import { useTranslation } from "react-i18next";
import { Alert, Avatar, Box, Card, CardContent, Chip, Container, List, ListItem, Stack, Typography } from "@mui/material";

import {
  buildAccountPageMeta,
  resolveAccountAvailabilityState,
  type PublicAvailabilityState
} from "../../features/shared/publicPageSeo";
import { fetchServerGraphql } from "../../features/shared/serverGraphql";

type PublicAccountDetailData = {
  accountById: {
    id: string;
    displayName: string | null;
    externalSubject: string;
    bio: string | null;
    location: string | null;
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
    nodes: Array<{
      id: string;
      title: string;
    }>;
  } | null;
};

type AccountDetailsPageProps = {
  accountId: string;
  initialAccount: PublicAccountDetailData["accountById"];
  initialNeeds: Array<{ id: string; title: string }>;
  initialResources: Array<{ id: string; title: string }>;
};

const PUBLIC_ACCOUNT_DETAIL_SSR_QUERY = `
  query PublicAccountDetailSSR($accountId: UUID!) {
    accountById(id: $accountId) {
      id
      displayName
      externalSubject
      bio
      location
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
      }
    }
  }
`;

export default function AccountDetailsPage({
  accountId,
  initialAccount,
  initialNeeds,
  initialResources
}: AccountDetailsPageProps) {
  const { t } = useTranslation("common");
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
                    <Stack spacing={0.5}>
                      <Typography variant="h6">{displayName}</Typography>
                      {account.location ? (
                        <Typography color="text.secondary" variant="body2">{account.location}</Typography>
                      ) : null}
                    </Stack>
                  </Stack>

                  {account.bio ? <Typography variant="body1">{account.bio}</Typography> : null}

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
              <List disablePadding>
                {initialResources.map(resource => (
                  <ListItem disableGutters key={resource.id}>
                    <Typography component={NextLink} href={`/resources/${resource.id}`} variant="body2">
                      {resource.title}
                    </Typography>
                  </ListItem>
                ))}
              </List>
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
