import NextLink from "next/link";
import Head from "next/head";
import type { GetServerSideProps } from "next";
import { useQuery } from "@apollo/client/react";
import { Alert, Box, Button, Card, CardContent, Chip, Container, Stack, Typography } from "@mui/material";
import { useTranslation } from "react-i18next";

import { useAuth } from "../../features/auth/AuthProvider";
import { CLAIM_CONVERSATION_LOOKUP_QUERY } from "../../features/chat/chat.queries";
import { StartConversationDialog } from "../../features/chat/StartConversationDialog";
import { buildNeedContactLoginHref, shouldShowNeedContactCta } from "../../features/needs/needCta";
import {
  buildNeedPageMeta,
  resolveNeedAvailabilityState,
  type PublicAvailabilityState
} from "../../features/shared/publicPageSeo";
import { fetchServerGraphql } from "../../features/shared/serverGraphql";

type PublicNeedDetailData = {
  needById: {
    id: string;
    creatorAccountId: string;
    title: string;
    description: string | null;
    location: string;
    intensity: string;
    proposedTopesAmount: number | null;
    imageUrls: string[];
    expiresAt: string | null;
    isActive: boolean;
    accountByCreatorAccountId: {
      id: string;
      displayName: string | null;
      externalSubject: string;
    } | null;
  } | null;
};

type NeedDetailsPageProps = {
  needId: string;
  initialNeed: PublicNeedDetailData["needById"];
};

const PUBLIC_NEED_DETAIL_SSR_QUERY = `
  query PublicNeedDetailSSR($needId: UUID!) {
    needById(id: $needId) {
      id
      creatorAccountId
      title
      description
      location
      intensity
      proposedTopesAmount
      imageUrls
      expiresAt
      isActive
      accountByCreatorAccountId {
        id
        displayName
        externalSubject
      }
    }
  }
`;

type ClaimConversationLookupData = {
  claimConversationByNeedIdAndCreatorAccountIdAndClaimerAccountId: {
    id: string;
  } | null;
};

export default function NeedDetailsPage({ needId, initialNeed }: NeedDetailsPageProps) {
  const { session } = useAuth();
  const { t } = useTranslation("needs");
  const need = initialNeed;
  const availabilityState = resolveNeedAvailabilityState(need);
  const pageMeta = buildNeedPageMeta({
    needId,
    needTitle: need?.title,
    needDescription: need?.description
  });

  const { data: conversationData } = useQuery<ClaimConversationLookupData>(CLAIM_CONVERSATION_LOOKUP_QUERY, {
    skip: !need || !session.authenticated || !session.account?.id || need.creatorAccountId === session.account.id,
    variables: {
      needId,
      creatorAccountId: need?.creatorAccountId,
      claimerAccountId: session.account?.id
    }
  });

  const existingConversationId =
    conversationData?.claimConversationByNeedIdAndCreatorAccountIdAndClaimerAccountId?.id ?? null;

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
          <Typography component="h1" variant="h4">{t("page.detailTitle")}</Typography>

          {need ? (
            <>
              <NeedAvailabilityAlert state={availabilityState} />

              <Card variant="outlined">
                <CardContent>
                  <Stack spacing={1.5}>
                    <Typography variant="h5">{need.title}</Typography>
                    <Typography color="text.secondary" variant="body2">
                      {need.accountByCreatorAccountId?.displayName
                        ?? need.accountByCreatorAccountId?.externalSubject
                        ?? need.creatorAccountId}
                    </Typography>
                    <Stack direction="row" spacing={1}>
                      <Chip label={need.intensity} size="small" />
                      <Chip label={availabilityState.toLowerCase()} size="small" />
                      {need.proposedTopesAmount ? <Chip label={`${need.proposedTopesAmount} Topes`} size="small" /> : null}
                    </Stack>
                    {need.description ? <Typography variant="body1">{need.description}</Typography> : null}
                    <Typography color="text.secondary" variant="body2">{need.location}</Typography>
                  </Stack>
                </CardContent>
              </Card>

              <Stack alignItems={{ xs: "stretch", sm: "flex-start" }} spacing={1}>
                {shouldShowNeedContactCta({
                  authenticated: session.authenticated,
                  viewerAccountId: session.account?.id,
                  creatorAccountId: need.creatorAccountId
                }) && session.authenticated ? (
                  <StartConversationDialog
                    buttonLabel={t("page.contactCreator")}
                    existingConversationId={existingConversationId}
                    kind="need"
                    needId={need.id}
                    title={need.title}
                  />
                ) : !session.authenticated ? (
                  <Button
                    component={NextLink}
                    href={buildNeedContactLoginHref(need.id)}
                    variant="contained"
                  >
                    {t("page.signInToContact", { ns: "needs" })}
                  </Button>
                ) : null}
              </Stack>
            </>
          ) : <Alert severity="warning">{t("form.notFound")}</Alert>}
        </Stack>
      </Box>
    </Container>
  );
}

function NeedAvailabilityAlert({ state }: { state: PublicAvailabilityState }) {
  if (state === "VISIBLE_DELETED") {
    return <Alert severity="warning">This need is archived and kept visible for context.</Alert>;
  }

  if (state === "VISIBLE_ENDED") {
    return <Alert severity="info">This need is no longer active.</Alert>;
  }

  return null;
}

export const getServerSideProps: GetServerSideProps<NeedDetailsPageProps> = async context => {
  const rawNeedId = context.params?.needId;

  if (typeof rawNeedId !== "string") {
    return { notFound: true };
  }

  const data = await fetchServerGraphql<PublicNeedDetailData>(PUBLIC_NEED_DETAIL_SSR_QUERY, {
    needId: rawNeedId
  });

  if (!data?.needById) {
    return { notFound: true };
  }

  return {
    props: {
      needId: rawNeedId,
      initialNeed: data.needById
    }
  };
};
