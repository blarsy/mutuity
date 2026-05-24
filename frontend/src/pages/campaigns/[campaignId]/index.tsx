import Head from "next/head";
import type { GetServerSideProps } from "next";
import NextLink from "next/link";
import { useMutation, useQuery } from "@apollo/client/react";
import { gql } from "@apollo/client";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Checkbox,
  Chip,
  Container,
  FormControlLabel,
  Stack,
  Typography
} from "@mui/material";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import { RichTextContent } from "../../../components/richText/RichTextContent";
import { useAuth } from "../../../features/auth/AuthProvider";
import {
  buildCampaignPageMeta,
  resolveCampaignAvailabilityState,
  type PublicAvailabilityState
} from "../../../features/shared/publicPageSeo";
import { formatPublicDateTime } from "../../../features/shared/publicDateTime";
import { fetchServerGraphql } from "../../../features/shared/serverGraphql";
import { ResourceCard } from "../../../features/ui/ResourceCard";
import { listingCardGridSx } from "../../../features/ui/listingCardGrid";
import { getUserFacingGraphQLErrorMessage } from "../../../services/graphql/errorMessages";

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

type CampaignJoinStatus = "PENDING" | "ACCEPTED" | "REJECTED";

type MyActiveResourcesForCampaignData = {
  allResources: {
    nodes: {
      id: string;
      creatorAccountId: string;
      title: string;
      description: string | null;
      location: string | null;
      defaultTokenAmount: number | null;
      imageUrls: string[] | null;
      categoryLabels: string[];
      isProduct: boolean;
      isService: boolean;
      canBeGiven: boolean;
      canBeExchanged: boolean;
      canBeTakenAway: boolean;
      canBeDelivered: boolean;
      expiresAt: string | null;
      updatedAt: string;
      accountByCreatorAccountId: {
        id: string;
        displayName: string | null;
        externalSubject: string;
      } | null;
      campaignResourcesByResourceId: {
        nodes: {
          status: CampaignJoinStatus;
        }[];
      };
    }[];
  };
};

type MyActiveResourcesForCampaignVariables = {
  creatorAccountId: string;
  campaignId: string;
};

const MY_ACTIVE_RESOURCES_FOR_CAMPAIGN_QUERY = gql`
  query MyActiveResourcesForCampaign($creatorAccountId: UUID!, $campaignId: UUID!) {
    allResources(
      condition: { creatorAccountId: $creatorAccountId, isActive: true }
      orderBy: ID_DESC
    ) {
      nodes {
        id
        creatorAccountId
        title
        description
        location
        defaultTokenAmount
        imageUrls
        categoryLabels
        isProduct
        isService
        canBeGiven
        canBeExchanged
        canBeTakenAway
        canBeDelivered
        expiresAt
        updatedAt
        accountByCreatorAccountId {
          id
          displayName
          externalSubject
        }
        campaignResourcesByResourceId(condition: { campaignId: $campaignId }, orderBy: PRIMARY_KEY_DESC, first: 1) {
          nodes {
            status
          }
        }
      }
    }
  }
`;

const REQUEST_RESOURCE_JOIN_MUTATION = gql`
  mutation RequestResourceJoinToCampaign($campaignId: UUID!, $resourceId: UUID!) {
    createCampaignResource(
      input: {
        campaignResource: { campaignId: $campaignId, resourceId: $resourceId, status: PENDING }
      }
    ) {
      campaignResource {
        campaignId
        resourceId
        status
      }
    }
  }
`;

const REOPEN_RESOURCE_JOIN_REQUEST_MUTATION = gql`
  mutation ReopenResourceJoinToCampaign($campaignId: UUID!, $resourceId: UUID!) {
    updateCampaignResourceByCampaignIdAndResourceId(
      input: {
        campaignId: $campaignId
        resourceId: $resourceId
        campaignResourcePatch: { status: PENDING, actedAt: null, actedByAccountId: null }
      }
    ) {
      campaignResource {
        campaignId
        resourceId
        status
      }
    }
  }
`;

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
  const { session } = useAuth();
  const { t } = useTranslation("campaigns");
  const campaign = initialCampaign;
  const availabilityState = resolveCampaignAvailabilityState(campaign);
  const [selectedResourceIds, setSelectedResourceIds] = useState<string[]>([]);
  const [runningResourceIds, setRunningResourceIds] = useState<string[]>([]);
  const [bulkRunning, setBulkRunning] = useState(false);
  const [joinActionError, setJoinActionError] = useState<string | null>(null);
  const [joinActionSuccessCount, setJoinActionSuccessCount] = useState(0);

  const {
    data: myResourcesData,
    loading: myResourcesLoading,
    error: myResourcesError,
    refetch: refetchMyResources
  } = useQuery<MyActiveResourcesForCampaignData, MyActiveResourcesForCampaignVariables>(
    MY_ACTIVE_RESOURCES_FOR_CAMPAIGN_QUERY,
    {
      skip: !campaign || !session.authenticated || !session.account?.id,
      variables: {
        creatorAccountId: session.account?.id ?? "",
        campaignId
      }
    }
  );

  const [requestJoinMutation] = useMutation(REQUEST_RESOURCE_JOIN_MUTATION);
  const [reopenJoinMutation] = useMutation(REOPEN_RESOURCE_JOIN_REQUEST_MUTATION);

  const pageMeta = buildCampaignPageMeta({
    campaignId,
    campaignTitle: campaign?.title,
    campaignDescription: campaign?.description
  });

  const activeResources = myResourcesData?.allResources.nodes ?? [];

  const statusByResourceId = useMemo(() => {
    return new Map(
      activeResources.map(resource => [resource.id, resource.campaignResourcesByResourceId.nodes[0]?.status ?? null])
    );
  }, [activeResources]);

  const selectedJoinableIds = useMemo(() => {
    return selectedResourceIds.filter(resourceId => {
      const status = statusByResourceId.get(resourceId);
      return status !== "ACCEPTED" && status !== "PENDING";
    });
  }, [selectedResourceIds, statusByResourceId]);

  const requestJoinForResource = async (resourceId: string) => {
    const status = statusByResourceId.get(resourceId);

    if (status === "ACCEPTED" || status === "PENDING") {
      return;
    }

    if (status === "REJECTED") {
      await reopenJoinMutation({
        variables: {
          campaignId,
          resourceId
        }
      });

      return;
    }

    await requestJoinMutation({
      variables: {
        campaignId,
        resourceId
      }
    });
  };

  const handleJoinSingle = async (resourceId: string) => {
    setJoinActionError(null);
    setJoinActionSuccessCount(0);
    setRunningResourceIds(current => [...current, resourceId]);

    try {
      await requestJoinForResource(resourceId);
      setJoinActionSuccessCount(1);
      setSelectedResourceIds(current => current.filter(id => id !== resourceId));
      await refetchMyResources();
    } catch (error) {
      setJoinActionError(
        getUserFacingGraphQLErrorMessage(error as Parameters<typeof getUserFacingGraphQLErrorMessage>[0])
        ?? t("public.resourceJoin.joinFailed")
      );
    } finally {
      setRunningResourceIds(current => current.filter(id => id !== resourceId));
    }
  };

  const handleJoinSelected = async () => {
    if (selectedJoinableIds.length === 0) {
      return;
    }

    setJoinActionError(null);
    setJoinActionSuccessCount(0);
    setBulkRunning(true);

    let successCount = 0;

    try {
      for (const resourceId of selectedJoinableIds) {
        await requestJoinForResource(resourceId);
        successCount += 1;
      }

      setJoinActionSuccessCount(successCount);
      setSelectedResourceIds(current => current.filter(id => !selectedJoinableIds.includes(id)));
      await refetchMyResources();
    } catch (error) {
      setJoinActionError(
        getUserFacingGraphQLErrorMessage(error as Parameters<typeof getUserFacingGraphQLErrorMessage>[0])
        ?? t("public.resourceJoin.joinFailed")
      );
    } finally {
      setBulkRunning(false);
    }
  };

  const toggleSelection = (resourceId: string, checked: boolean) => {
    setSelectedResourceIds(current => {
      if (checked) {
        return current.includes(resourceId) ? current : [...current, resourceId];
      }

      return current.filter(id => id !== resourceId);
    });
  };

  const renderJoinStatusChip = (status: CampaignJoinStatus | null) => {
    if (status === "ACCEPTED") {
      return <Chip color="success" label={t("public.resourceJoin.status.joined")} size="small" />;
    }

    if (status === "PENDING") {
      return <Chip color="warning" label={t("public.resourceJoin.status.waitingApproval")} size="small" />;
    }

    if (status === "REJECTED") {
      return <Chip color="default" label={t("public.resourceJoin.status.rejected")} size="small" variant="outlined" />;
    }

    return <Chip label={t("public.resourceJoin.status.notRequested")} size="small" variant="outlined" />;
  };

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
              {session.authenticated && session.account?.id === campaign.creatorAccountId ? (
                <Alert
                  action={
                    <Button
                      component={NextLink}
                      href={`/campaigns/${campaignId}/moderation`}
                      size="small"
                      variant="outlined"
                    >
                      {t("moderationNotes.openModeration")}
                    </Button>
                  }
                  severity="info"
                >
                  {t("public.ownCampaignHint")}
                </Alert>
              ) : null}
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

              <Stack spacing={2}>
                    <Typography component="h2" variant="h5">{t("public.resourceJoin.title")}</Typography>
                    <Typography color="text.secondary" variant="body2">{t("public.resourceJoin.subtitle")}</Typography>

                    {joinActionSuccessCount > 0 ? (
                      <Alert severity="success">
                        {t("public.resourceJoin.joinSuccess", { count: joinActionSuccessCount })}
                      </Alert>
                    ) : null}
                    {joinActionError ? <Alert severity="error">{joinActionError}</Alert> : null}

                    {!session.authenticated ? (
                      <Alert
                        action={
                          <Button component={NextLink} href={`/login?next=%2Fcampaigns%2F${campaignId}`} size="small" variant="outlined">
                            {t("public.resourceJoin.signInAction")}
                          </Button>
                        }
                        severity="info"
                      >
                        {t("public.resourceJoin.signInRequired")}
                      </Alert>
                    ) : myResourcesLoading ? (
                      <Alert severity="info">{t("public.resourceJoin.loading")}</Alert>
                    ) : myResourcesError ? (
                      <Alert severity="error">
                        {getUserFacingGraphQLErrorMessage(myResourcesError) ?? t("public.resourceJoin.loadingFailed")}
                      </Alert>
                    ) : activeResources.length === 0 ? (
                      <Alert severity="info">{t("public.resourceJoin.empty")}</Alert>
                    ) : (
                      <>
                        <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" spacing={1.5}>
                          <Typography color="text.secondary" variant="body2">
                            {selectedJoinableIds.length > 0
                              ? t("public.resourceJoin.selectedCount", { count: selectedJoinableIds.length })
                              : t("public.resourceJoin.noneSelected")}
                          </Typography>
                          <Button
                            disabled={selectedJoinableIds.length === 0 || bulkRunning}
                            onClick={() => void handleJoinSelected()}
                            variant="contained"
                          >
                            {bulkRunning
                              ? t("public.resourceJoin.joiningSelected")
                              : t("public.resourceJoin.joinSelected")}
                          </Button>
                        </Stack>

                        <Box sx={listingCardGridSx}>
                          {activeResources.map(resource => {
                            const status = resource.campaignResourcesByResourceId.nodes[0]?.status ?? null;
                            const isJoinDisabled = status === "ACCEPTED" || status === "PENDING";
                            const isRunning = runningResourceIds.includes(resource.id);
                            const creatorLabel = resource.accountByCreatorAccountId?.displayName
                              ?? resource.accountByCreatorAccountId?.externalSubject
                              ?? resource.creatorAccountId;

                            return (
                              <ResourceCard
                                actions={
                                  <Stack alignItems={{ xs: "stretch", sm: "center" }} direction={{ xs: "column", sm: "row" }} spacing={1}>
                                    <FormControlLabel
                                      control={(
                                        <Checkbox
                                          checked={selectedResourceIds.includes(resource.id)}
                                          disabled={isJoinDisabled || isRunning || bulkRunning}
                                          onChange={event => toggleSelection(resource.id, event.target.checked)}
                                        />
                                      )}
                                      label={t("public.resourceJoin.selectResource")}
                                    />
                                    <Button
                                      disabled={isJoinDisabled || isRunning || bulkRunning}
                                      onClick={() => void handleJoinSingle(resource.id)}
                                      size="small"
                                      variant="contained"
                                    >
                                      {isRunning
                                        ? t("public.resourceJoin.joiningSingle")
                                        : t("public.resourceJoin.joinSingle")}
                                    </Button>
                                  </Stack>
                                }
                                chips={
                                  <>
                                    {renderJoinStatusChip(status)}
                                    {resource.categoryLabels.slice(0, 2).map(label => (
                                      <Chip key={`${resource.id}-${label}`} label={label} size="small" variant="outlined" />
                                    ))}
                                  </>
                                }
                                creatorName={creatorLabel}
                                description={resource.description}
                                expiresAt={resource.expiresAt}
                                footer={
                                  <Typography color="text.secondary" variant="body2">
                                    {t("public.resourceJoin.tokens", { count: resource.defaultTokenAmount ?? 0 })}
                                  </Typography>
                                }
                                imageUrls={resource.imageUrls ?? []}
                                key={resource.id}
                                location={resource.location}
                                showListingHeader={false}
                                title={resource.title}
                              />
                            );
                          })}
                        </Box>
                      </>
                    )}
              </Stack>
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
