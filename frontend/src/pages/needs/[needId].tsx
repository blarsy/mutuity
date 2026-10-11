import NextLink from "next/link";
import Head from "next/head";
import { useRouter } from "next/router";
import type { GetServerSideProps } from "next";
import { useQuery } from "@apollo/client/react";
import ArrowBackIosNewIcon from "@mui/icons-material/ArrowBackIosNew";
import ArrowForwardIosIcon from "@mui/icons-material/ArrowForwardIos";
import { Alert, Box, Button, Card, CardContent, Chip, Container, IconButton, Stack, Typography } from "@mui/material";
import { APIProvider, Map as GoogleMap, Marker } from "@vis.gl/react-google-maps";
import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";

import { useAuth } from "../../features/auth/AuthProvider";
import { CLAIM_CONVERSATION_LOOKUP_QUERY } from "../../features/chat/chat.queries";
import { StartConversationButton } from "../../features/chat/StartConversationDialog";
import { RichTextContent } from "../../components/richText/RichTextContent";
import { ZoomableImage } from "../../components/ZoomableImage";
import { IntensityDisplay } from "../../components/IntensityPicker";
import { buildNeedContactLoginHref, shouldShowNeedContactCta } from "../../features/needs/needCta";
import { AvatarIconButton } from "../../features/ui/AvatarIconButton";
import {
  buildNeedPageMeta,
  resolveNeedAvailabilityState,
  type PublicAvailabilityState
} from "../../features/shared/publicPageSeo";
import { fetchServerGraphql, getLanguageFromHeaders } from "../../features/shared/serverGraphql";

const MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? "";

type PublicNeedDetailData = {
  needById: {
    id: string;
    creatorAccountId: string;
    title: string;
    description: string | null;
    location: string;
    latitude: string | number | null;
    longitude: string | number | null;
    intensity: string;
    proposedTopesAmount: number | null;
    objectRequired: boolean;
    competenceRequired: boolean;
    toolingRequired: boolean;
    multiplePeopleRequired: boolean;
    requiredCompetenceText: string | null;
    requiredToolingText: string | null;
    requiredPeopleCount: number | null;
    imageUrls: Array<string | null> | null;
    createdAt: string;
    expiresAt: string | null;
    isActive: boolean;
    accountByCreatorAccountId: {
      id: string;
      displayName: string | null;
      externalSubject: string;
      avatarUrl: string | null;
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
      latitude
      longitude
      intensity
      proposedTopesAmount
      objectRequired
      competenceRequired
      toolingRequired
      multiplePeopleRequired
      requiredCompetenceText
      requiredToolingText
      requiredPeopleCount
      imageUrls
      createdAt
      expiresAt
      isActive
      accountByCreatorAccountId {
        id
        displayName
        externalSubject
        avatarUrl
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
  const router = useRouter();
  const { session } = useAuth();
  const { t, i18n } = useTranslation("needs");
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const need = initialNeed;
  const availabilityState = resolveNeedAvailabilityState(need);
  const pageMeta = buildNeedPageMeta({
    needId,
    needTitle: need?.title,
    needDescription: need?.description
  });
  const imageUrls = (need?.imageUrls ?? [])
    .map(url => url?.trim())
    .filter((url): url is string => Boolean(url && (/^https?:\/\//i.test(url) || /^\/(?!\/)/.test(url))));
  const currentImageUrl = imageUrls[currentImageIndex] ?? null;
  const creatorLabel = need?.accountByCreatorAccountId?.displayName
    ?? need?.accountByCreatorAccountId?.externalSubject
    ?? need?.creatorAccountId
    ?? t("detail.unknownAccount");
  const latitude = Number(need?.latitude);
  const longitude = Number(need?.longitude);
  const hasCompleteLocation = Boolean(need?.location.trim())
    && need?.latitude !== null
    && need?.latitude !== undefined
    && need?.longitude !== null
    && need?.longitude !== undefined
    && Number.isFinite(latitude)
    && Number.isFinite(longitude);

  useEffect(() => {
    setCurrentImageIndex(0);
  }, [need?.id]);

  const { data: conversationData, loading: conversationLoading } = useQuery<ClaimConversationLookupData>(CLAIM_CONVERSATION_LOOKUP_QUERY, {
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
          {need ? (
            <>
              <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" spacing={2}>
                <Box>
                  <Typography component="h1" gutterBottom variant="h4">{need.title}</Typography>
                  <Stack alignItems="center" direction="row" spacing={1}>
                    <AvatarIconButton
                      displayName={creatorLabel}
                      imageUrl={need.accountByCreatorAccountId?.avatarUrl}
                      onClick={() => {
                        void router.push(`/accounts/${need.creatorAccountId}`);
                      }}
                    />
                    <Button
                      color="inherit"
                      onClick={() => {
                        void router.push(`/accounts/${need.creatorAccountId}`);
                      }}
                      sx={{ minWidth: 0, px: 0.5 }}
                    >
                      {creatorLabel}
                    </Button>
                  </Stack>
                </Box>
                <Stack alignItems={{ xs: "stretch", sm: "flex-end" }} spacing={1}>
                  {shouldShowNeedContactCta({
                    authenticated: session.authenticated,
                    viewerAccountId: session.account?.id,
                    creatorAccountId: need.creatorAccountId
                  }) && session.authenticated ? (
                    <StartConversationButton
                      buttonLabel={t("page.contactCreator")}
                      contextId={need.id}
                      existingConversationId={existingConversationId}
                      kind="need"
                      lookupLoading={conversationLoading}
                      otherAccountId={need.creatorAccountId}
                      title={need.title}
                    />
                  ) : !session.authenticated ? (
                    <Button component={NextLink} href={buildNeedContactLoginHref(need.id)} variant="contained">
                      {t("page.signInToContact")}
                    </Button>
                  ) : null}
                </Stack>
              </Stack>

              <NeedAvailabilityAlert state={availabilityState} t={t} />

              <Card variant="outlined">
                <CardContent>
                  <Stack spacing={2.5}>
                    <Box sx={{ alignItems: "center", display: "flex", justifyContent: "center", gap: 1 }}>
                      <IconButton
                        aria-label={t("detail.previousImage")}
                        disabled={currentImageIndex === 0 || imageUrls.length <= 1}
                        onClick={() => setCurrentImageIndex(index => Math.max(0, index - 1))}
                        size="large"
                        sx={{ visibility: currentImageIndex === 0 || imageUrls.length <= 1 ? "hidden" : "visible" }}
                      >
                        <ArrowBackIosNewIcon />
                      </IconButton>
                      <Box
                        sx={{
                          alignItems: "center",
                          bgcolor: currentImageUrl ? "grey.100" : "grey.50",
                          borderRadius: 3,
                          color: "text.secondary",
                          display: "flex",
                          justifyContent: "center",
                          overflow: "hidden",
                          width: "100%",
                          maxWidth: 520,
                          aspectRatio: "1 / 1"
                        }}
                      >
                        {currentImageUrl ? (
                          <ZoomableImage
                            alt={`${need.title} ${currentImageIndex + 1}`}
                            src={currentImageUrl}
                            sx={{ display: "block", height: "100%", objectFit: "cover", width: "100%" }}
                          />
                        ) : <Typography variant="body2">{t("detail.noImage")}</Typography>}
                      </Box>
                      <IconButton
                        aria-label={t("detail.nextImage")}
                        disabled={currentImageIndex >= imageUrls.length - 1 || imageUrls.length <= 1}
                        onClick={() => setCurrentImageIndex(index => Math.min(imageUrls.length - 1, index + 1))}
                        size="large"
                        sx={{ visibility: currentImageIndex >= imageUrls.length - 1 || imageUrls.length <= 1 ? "hidden" : "visible" }}
                      >
                        <ArrowForwardIosIcon />
                      </IconButton>
                    </Box>

                    {imageUrls.length > 1 ? (
                      <Stack direction="row" justifyContent="center" spacing={0.75}>
                        {imageUrls.map((_, index) => (
                          <Box
                            key={`need-detail-image-dot-${index}`}
                            sx={theme => ({
                              bgcolor: index === currentImageIndex ? theme.palette.primary.main : theme.palette.action.disabled,
                              borderRadius: "50%",
                              height: 8,
                              width: 8
                            })}
                          />
                        ))}
                      </Stack>
                    ) : null}

                    <DetailSection label={t("form.titleLabel")}>
                      <Typography variant="h5">{need.title}</Typography>
                    </DetailSection>

                    <DetailSection label={t("form.descriptionLabel")}>
                      <RichTextContent emptyFallback={t("detail.noDescription")} html={need.description ?? ""} />
                    </DetailSection>

                    <DetailSection label={t("form.intensityLabel")}>
                      <IntensityDisplay intensity={need.intensity} tokenAmount={need.proposedTopesAmount} />
                    </DetailSection>

                    <DetailSection label={t("form.needNatureLabel")}>
                      <Stack direction="row" flexWrap="wrap" gap={1}>
                        <RequirementChip label={t("form.objectRequired")} required={need.objectRequired} t={t} />
                        <RequirementChip label={t("form.toolingRequired")} required={need.toolingRequired} t={t} />
                        <RequirementChip label={t("form.competenceRequired")} required={need.competenceRequired} t={t} />
                        <RequirementChip label={t("form.multiplePeopleRequired")} required={need.multiplePeopleRequired} t={t} />
                      </Stack>
                      {need.requiredToolingText ? (
                        <Typography variant="body2"><strong>{t("form.requiredToolingLabel")}:</strong> {need.requiredToolingText}</Typography>
                      ) : null}
                      {need.requiredCompetenceText ? (
                        <Typography variant="body2"><strong>{t("form.requiredCompetenceLabel")}:</strong> {need.requiredCompetenceText}</Typography>
                      ) : null}
                      {need.requiredPeopleCount !== null ? (
                        <Typography variant="body2"><strong>{t("form.requiredPeopleCountLabel")}:</strong> {need.requiredPeopleCount}</Typography>
                      ) : null}
                    </DetailSection>

                    <DetailSection label={t("form.locationLabel")}>
                      <Typography variant="body2">{need.location}</Typography>
                      {hasCompleteLocation ? (
                        <Box sx={{ aspectRatio: "16 / 9", bgcolor: "grey.100", borderRadius: 1, overflow: "hidden", width: "100%" }}>
                          {MAPS_API_KEY ? (
                            <APIProvider apiKey={MAPS_API_KEY}>
                              <GoogleMap
                                center={{ lat: latitude, lng: longitude }}
                                defaultZoom={14}
                                disableDefaultUI={false}
                                clickableIcons={false}
                                mapTypeControl={false}
                                streetViewControl={false}
                                fullscreenControl={false}
                                style={{ width: "100%", height: "100%" }}
                              >
                                <Marker position={{ lat: latitude, lng: longitude }} />
                              </GoogleMap>
                            </APIProvider>
                          ) : null}
                        </Box>
                      ) : null}
                    </DetailSection>

                    <Stack direction={{ xs: "column", sm: "row" }} spacing={2.5}>
                      <Stack spacing={0.25}>
                        <Typography color="text.secondary" variant="overline">{t("browse.expires")}</Typography>
                        <Typography variant="body2">{formatDate(need.expiresAt, t("detail.permanent"), i18n.language)}</Typography>
                      </Stack>
                      <Stack spacing={0.25}>
                        <Typography color="text.secondary" variant="overline">{t("detail.published")}</Typography>
                        <Typography variant="body2">{formatDate(need.createdAt, t("detail.unknownDate"), i18n.language)}</Typography>
                      </Stack>
                    </Stack>
                  </Stack>
                </CardContent>
              </Card>
            </>
          ) : <Alert severity="warning">{t("form.notFound")}</Alert>}
        </Stack>
      </Box>
    </Container>
  );
}

function formatDate(value: string | null, fallback: string, language: string) {
  if (!value) {
    return fallback;
  }

  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) {
    return fallback;
  }

  return new Intl.DateTimeFormat(language, { dateStyle: "medium", timeStyle: "short" }).format(date);
}

function DetailSection({ children, label }: { children: ReactNode; label: string }) {
  return (
    <Stack spacing={0.75}>
      <Typography color="text.secondary" variant="overline">{label}</Typography>
      {children}
    </Stack>
  );
}

function RequirementChip({
  label,
  required,
  t
}: {
  label: string;
  required: boolean;
  t: (key: string, options?: Record<string, unknown>) => string;
}) {
  return <Chip label={`${label}: ${t(required ? "detail.required" : "detail.notRequired")}`} size="small" variant="outlined" />;
}

function NeedAvailabilityAlert({
  state,
  t
}: {
  state: PublicAvailabilityState;
  t: (key: string, options?: Record<string, unknown>) => string;
}) {
  if (state === "VISIBLE_DELETED") {
    return <Alert severity="warning">{t("detail.archivedNotice")}</Alert>;
  }

  if (state === "VISIBLE_ENDED") {
    return <Alert severity="info">{t("detail.endedNotice")}</Alert>;
  }

  return null;
}

export const getServerSideProps: GetServerSideProps<NeedDetailsPageProps> = async context => {
  const rawNeedId = context.params?.needId;

  if (typeof rawNeedId !== "string") {
    return { notFound: true };
  }

  const language = getLanguageFromHeaders(context.req.headers);

  const data = await fetchServerGraphql<PublicNeedDetailData>(PUBLIC_NEED_DETAIL_SSR_QUERY, {
    needId: rawNeedId
  }, language);
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


