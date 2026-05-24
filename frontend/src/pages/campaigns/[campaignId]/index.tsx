import Head from "next/head";
import type { GetServerSideProps } from "next";
import { Alert, Box, Card, CardContent, Chip, Container, Stack, Typography } from "@mui/material";
import { useTranslation } from "react-i18next";

import { RichTextContent } from "../../../components/richText/RichTextContent";
import {
  buildCampaignPageMeta,
  resolveCampaignAvailabilityState,
  type PublicAvailabilityState
} from "../../../features/shared/publicPageSeo";
import { formatPublicDateTime } from "../../../features/shared/publicDateTime";
import { fetchServerGraphql } from "../../../features/shared/serverGraphql";

type PublicCampaignDetailData = {
  campaignById: {
    id: string;
    creatorAccountId: string;
    title: string;
    description: string;
    theme: string;
    moderationStatus: string;
    imageUrl: string | null;
    startAt: string;
    airdropAt: string;
    endAt: string;
    accountByCreatorAccountId: {
      id: string;
      displayName: string | null;
      externalSubject: string;
    } | null;
  } | null;
};

type PublicCampaignDetailPageProps = {
  campaignId: string;
  initialCampaign: PublicCampaignDetailData["campaignById"];
  formattedDates: {
    startAt: string;
    airdropAt: string;
    endAt: string;
  };
};

const PUBLIC_CAMPAIGN_DETAIL_SSR_QUERY = `
  query PublicCampaignDetailSSR($campaignId: UUID!) {
    campaignById(id: $campaignId) {
      id
      creatorAccountId
      title
      description
      theme
      moderationStatus
      imageUrl
      startAt
      airdropAt
      endAt
      accountByCreatorAccountId {
        id
        displayName
        externalSubject
      }
    }
  }
`;

export default function PublicCampaignDetailPage({
  campaignId,
  initialCampaign,
  formattedDates
}: PublicCampaignDetailPageProps) {
  const { t } = useTranslation("campaigns");
  const campaign = initialCampaign;
  const availabilityState = resolveCampaignAvailabilityState(campaign);
  const pageMeta = buildCampaignPageMeta({
    campaignId,
    campaignTitle: campaign?.title,
    campaignDescription: campaign?.description
  });

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
          {campaign ? (
            <>
              <CampaignAvailabilityAlert state={availabilityState} />
              <Card variant="outlined">
                <CardContent>
                  <Stack spacing={1.5}>
                    <Typography component="h1" variant="h4">{campaign.title}</Typography>
                    <Stack direction="row" spacing={1}>
                      <Chip label={campaign.moderationStatus.toLowerCase()} size="small" />
                      <Chip label={availabilityState.toLowerCase()} size="small" />
                    </Stack>
                    <Typography color="text.secondary" variant="body2">
                      {campaign.accountByCreatorAccountId?.displayName
                        ?? campaign.accountByCreatorAccountId?.externalSubject
                        ?? campaign.creatorAccountId}
                    </Typography>
                    {campaign.imageUrl ? (
                      <Box
                        alt={campaign.title}
                        component="img"
                        src={campaign.imageUrl}
                        sx={{
                          width: "100%",
                          aspectRatio: "1 / 1",
                          objectFit: "cover",
                          borderRadius: 1,
                          border: theme => `1px solid ${theme.palette.divider}`
                        }}
                      />
                    ) : null}
                    <Typography variant="body1">{campaign.description}</Typography>
                    <Typography color="text.secondary" variant="caption">{t("labels.theme")}</Typography>
                    <RichTextContent html={campaign.theme} />
                    <Stack direction={{ xs: "column", sm: "row" }} spacing={3}>
                      <Typography variant="body2">{t("labels.start")}: {formattedDates.startAt}</Typography>
                      <Typography variant="body2">{t("labels.airdrop")}: {formattedDates.airdropAt}</Typography>
                      <Typography variant="body2">{t("labels.end")}: {formattedDates.endAt}</Typography>
                    </Stack>
                  </Stack>
                </CardContent>
              </Card>
            </>
          ) : <Alert severity="warning">{t("public.empty")}</Alert>}
        </Stack>
      </Box>
    </Container>
  );
}

function CampaignAvailabilityAlert({ state }: { state: PublicAvailabilityState }) {
  if (state === "VISIBLE_ENDED") {
    return <Alert severity="info">This campaign has ended.</Alert>;
  }

  if (state === "VISIBLE_DELETED") {
    return <Alert severity="warning">This campaign is archived and kept visible for context.</Alert>;
  }

  return null;
}

export const getServerSideProps: GetServerSideProps<PublicCampaignDetailPageProps> = async context => {
  const rawCampaignId = context.params?.campaignId;

  if (typeof rawCampaignId !== "string") {
    return { notFound: true };
  }

  const data = await fetchServerGraphql<PublicCampaignDetailData>(PUBLIC_CAMPAIGN_DETAIL_SSR_QUERY, {
    campaignId: rawCampaignId
  });

  if (!data?.campaignById) {
    return { notFound: true };
  }

  const localeHeader = context.req.headers["accept-language"];
  const locale = Array.isArray(localeHeader)
    ? localeHeader[0]
    : localeHeader?.split(",")[0]?.trim() || "en-US";

  return {
    props: {
      campaignId: rawCampaignId,
      initialCampaign: data.campaignById,
      formattedDates: {
        startAt: formatPublicDateTime(data.campaignById.startAt, locale),
        airdropAt: formatPublicDateTime(data.campaignById.airdropAt, locale),
        endAt: formatPublicDateTime(data.campaignById.endAt, locale)
      }
    }
  };
};
