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
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  Stack,
  Typography
} from "@mui/material";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import { RichTextContent } from "../../../components/richText/RichTextContent";
import { useAuth } from "../../../features/auth/AuthProvider";
import { buildCampaignExplainerSlides } from "../../../features/campaigns/campaignExplainer";
import {
  buildCampaignPageMeta,
  resolveCampaignAvailabilityState,
  type PublicAvailabilityState
} from "../../../features/shared/publicPageSeo";
import { formatPublicDateTime } from "../../../features/shared/publicDateTime";
import { fetchServerGraphql } from "../../../features/shared/serverGraphql";
import { NeedCard } from "../../../features/ui/NeedCard";
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

type MyActiveNeedsForCampaignData = {
  allNeeds: {
    nodes: {
      id: string;
      creatorAccountId: string;
      title: string;
      description: string | null;
      intensity: string;
      proposedTopesAmount: number | null;
      imageUrls: string[] | null;
      expiresAt: string | null;
      accountByCreatorAccountId: {
        id: string;
        displayName: string | null;
        externalSubject: string;
      } | null;
      campaignNeedsByNeedId: {
        nodes: {
          status: CampaignJoinStatus;
        }[];
      };
    }[];
  };
};

type MyActiveNeedsForCampaignVariables = {
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

const MY_ACTIVE_NEEDS_FOR_CAMPAIGN_QUERY = gql`
  query MyActiveNeedsForCampaign($creatorAccountId: UUID!, $campaignId: UUID!) {
    allNeeds(condition: { creatorAccountId: $creatorAccountId, isActive: true }, orderBy: ID_DESC) {
      nodes {
        id
        creatorAccountId
        title
        description
        intensity
        proposedTopesAmount
        imageUrls
        expiresAt
        accountByCreatorAccountId {
          id
          displayName
          externalSubject
        }
        campaignNeedsByNeedId(condition: { campaignId: $campaignId }, orderBy: PRIMARY_KEY_DESC, first: 1) {
          nodes {
            status
          }
        }
      }
    }
  }
`;

const REQUEST_NEED_JOIN_MUTATION = gql`
  mutation RequestNeedJoinToCampaign($campaignId: UUID!, $needId: UUID!) {
    createCampaignNeed(input: { campaignNeed: { campaignId: $campaignId, needId: $needId, status: PENDING } }) {
      campaignNeed {
        campaignId
        needId
        status
      }
    }
  }
`;

const REOPEN_NEED_JOIN_REQUEST_MUTATION = gql`
  mutation ReopenNeedJoinToCampaign($campaignId: UUID!, $needId: UUID!) {
    updateCampaignNeedByCampaignIdAndNeedId(
      input: {
        campaignId: $campaignId
        needId: $needId
        campaignNeedPatch: { status: PENDING, actedAt: null, actedByAccountId: null }
      }
    ) {
      campaignNeed {
        campaignId
        needId
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
  const [selectedNeedIds, setSelectedNeedIds] = useState<string[]>([]);
  const [runningNeedIds, setRunningNeedIds] = useState<string[]>([]);
  const [bulkNeedRunning, setBulkNeedRunning] = useState(false);
  const [needJoinActionError, setNeedJoinActionError] = useState<string | null>(null);
  const [needJoinActionSuccessCount, setNeedJoinActionSuccessCount] = useState(0);
  const [explainerOpen, setExplainerOpen] = useState(false);
  const [explainerSlideIndex, setExplainerSlideIndex] = useState(0);
  const explainerSlides = useMemo(() => buildCampaignExplainerSlides(t), [t]);
  const activeExplainerSlide = explainerSlides[explainerSlideIndex];

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
  const {
    data: myNeedsData,
    loading: myNeedsLoading,
    error: myNeedsError,
    refetch: refetchMyNeeds
  } = useQuery<MyActiveNeedsForCampaignData, MyActiveNeedsForCampaignVariables>(
    MY_ACTIVE_NEEDS_FOR_CAMPAIGN_QUERY,
    {
      skip: !campaign || !session.authenticated || !session.account?.id,
      variables: {
        creatorAccountId: session.account?.id ?? "",
        campaignId
      }
    }
  );
  const [requestNeedJoinMutation] = useMutation(REQUEST_NEED_JOIN_MUTATION);
  const [reopenNeedJoinMutation] = useMutation(REOPEN_NEED_JOIN_REQUEST_MUTATION);

  const pageMeta = buildCampaignPageMeta({
    campaignId,
    campaignTitle: campaign?.title,
    campaignDescription: campaign?.description
  });

  const activeResources = myResourcesData?.allResources.nodes ?? [];
  const activeNeeds = myNeedsData?.allNeeds.nodes ?? [];

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

  const needStatusByNeedId = useMemo(() => {
    return new Map(
      activeNeeds.map(need => [need.id, need.campaignNeedsByNeedId.nodes[0]?.status ?? null])
    );
  }, [activeNeeds]);

  const selectedJoinableNeedIds = useMemo(() => {
    return selectedNeedIds.filter(needId => {
      const status = needStatusByNeedId.get(needId);
      return status !== "ACCEPTED" && status !== "PENDING";
    });
  }, [selectedNeedIds, needStatusByNeedId]);

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

  const requestJoinForNeed = async (needId: string) => {
    const status = needStatusByNeedId.get(needId);

    if (status === "ACCEPTED" || status === "PENDING") {
      return;
    }

    if (status === "REJECTED") {
      await reopenNeedJoinMutation({
        variables: {
          campaignId,
          needId
        }
      });

      return;
    }

    await requestNeedJoinMutation({
      variables: {
        campaignId,
        needId
      }
    });
  };

  const handleNeedJoinSingle = async (needId: string) => {
    setNeedJoinActionError(null);
    setNeedJoinActionSuccessCount(0);
    setRunningNeedIds(current => [...current, needId]);

    try {
      await requestJoinForNeed(needId);
      setNeedJoinActionSuccessCount(1);
      setSelectedNeedIds(current => current.filter(id => id !== needId));
      await refetchMyNeeds();
    } catch (error) {
      setNeedJoinActionError(
        getUserFacingGraphQLErrorMessage(error as Parameters<typeof getUserFacingGraphQLErrorMessage>[0])
        ?? t("public.needJoin.joinFailed")
      );
    } finally {
      setRunningNeedIds(current => current.filter(id => id !== needId));
    }
  };

  const handleNeedJoinSelected = async () => {
    if (selectedJoinableNeedIds.length === 0) {
      return;
    }

    setNeedJoinActionError(null);
    setNeedJoinActionSuccessCount(0);
    setBulkNeedRunning(true);

    let successCount = 0;

    try {
      for (const needId of selectedJoinableNeedIds) {
        await requestJoinForNeed(needId);
        successCount += 1;
      }

      setNeedJoinActionSuccessCount(successCount);
      setSelectedNeedIds(current => current.filter(id => !selectedJoinableNeedIds.includes(id)));
      await refetchMyNeeds();
    } catch (error) {
      setNeedJoinActionError(
        getUserFacingGraphQLErrorMessage(error as Parameters<typeof getUserFacingGraphQLErrorMessage>[0])
        ?? t("public.needJoin.joinFailed")
      );
    } finally {
      setBulkNeedRunning(false);
    }
  };

  const toggleNeedSelection = (needId: string, checked: boolean) => {
    setSelectedNeedIds(current => {
      if (checked) {
        return current.includes(needId) ? current : [...current, needId];
      }

      return current.filter(id => id !== needId);
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

  const renderNeedJoinStatusChip = (status: CampaignJoinStatus | null) => {
    if (status === "ACCEPTED") {
      return <Chip color="success" label={t("public.needJoin.status.joined")} size="small" />;
    }

    if (status === "PENDING") {
      return <Chip color="warning" label={t("public.needJoin.status.waitingApproval")} size="small" />;
    }

    if (status === "REJECTED") {
      return <Chip color="default" label={t("public.needJoin.status.rejected")} size="small" variant="outlined" />;
    }

    return <Chip label={t("public.needJoin.status.notRequested")} size="small" variant="outlined" />;
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
                    <Box>
                      <Button
                        onClick={() => {
                          setExplainerSlideIndex(0);
                          setExplainerOpen(true);
                        }}
                        variant="outlined"
                      >
                        {t("public.explainer.openButton")}
                      </Button>
                    </Box>
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

              <Dialog
                fullWidth
                maxWidth="sm"
                onClose={() => setExplainerOpen(false)}
                open={explainerOpen}
              >
                <DialogTitle>{t("public.explainer.dialogTitle")}</DialogTitle>
                <DialogContent>
                  <Stack spacing={2} sx={{ pt: 1 }}>
                    <Typography component="h3" variant="h6">
                      {activeExplainerSlide.title}
                    </Typography>
                    <Typography variant="body1">{activeExplainerSlide.body}</Typography>
                    <Typography color="text.secondary" variant="caption">
                      {t("public.explainer.progress", {
                        current: explainerSlideIndex + 1,
                        total: explainerSlides.length
                      })}
                    </Typography>
                  </Stack>
                </DialogContent>
                <DialogActions>
                  <Button
                    disabled={explainerSlideIndex === 0}
                    onClick={() => setExplainerSlideIndex(current => Math.max(0, current - 1))}
                  >
                    {t("public.explainer.previous")}
                  </Button>
                  <Button
                    onClick={() => {
                      if (explainerSlideIndex === explainerSlides.length - 1) {
                        setExplainerOpen(false);
                        return;
                      }

                      setExplainerSlideIndex(current => Math.min(explainerSlides.length - 1, current + 1));
                    }}
                    variant="contained"
                  >
                    {explainerSlideIndex === explainerSlides.length - 1
                      ? t("public.explainer.close")
                      : t("public.explainer.next")}
                  </Button>
                </DialogActions>
              </Dialog>

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

              <Stack spacing={2}>
                <Typography component="h2" variant="h5">{t("public.needJoin.title")}</Typography>
                <Typography color="text.secondary" variant="body2">{t("public.needJoin.subtitle")}</Typography>

                {needJoinActionSuccessCount > 0 ? (
                  <Alert severity="success">
                    {t("public.needJoin.joinSuccess", { count: needJoinActionSuccessCount })}
                  </Alert>
                ) : null}
                {needJoinActionError ? <Alert severity="error">{needJoinActionError}</Alert> : null}

                {!session.authenticated ? (
                  <Alert
                    action={
                      <Button component={NextLink} href={`/login?next=%2Fcampaigns%2F${campaignId}`} size="small" variant="outlined">
                        {t("public.needJoin.signInAction")}
                      </Button>
                    }
                    severity="info"
                  >
                    {t("public.needJoin.signInRequired")}
                  </Alert>
                ) : myNeedsLoading ? (
                  <Alert severity="info">{t("public.needJoin.loading")}</Alert>
                ) : myNeedsError ? (
                  <Alert severity="error">
                    {getUserFacingGraphQLErrorMessage(myNeedsError) ?? t("public.needJoin.loadingFailed")}
                  </Alert>
                ) : activeNeeds.length === 0 ? (
                  <Alert severity="info">{t("public.needJoin.empty")}</Alert>
                ) : (
                  <>
                    <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" spacing={1.5}>
                      <Typography color="text.secondary" variant="body2">
                        {selectedJoinableNeedIds.length > 0
                          ? t("public.needJoin.selectedCount", { count: selectedJoinableNeedIds.length })
                          : t("public.needJoin.noneSelected")}
                      </Typography>
                      <Button
                        disabled={selectedJoinableNeedIds.length === 0 || bulkNeedRunning}
                        onClick={() => void handleNeedJoinSelected()}
                        variant="contained"
                      >
                        {bulkNeedRunning
                          ? t("public.needJoin.joiningSelected")
                          : t("public.needJoin.joinSelected")}
                      </Button>
                    </Stack>

                    <Box sx={listingCardGridSx}>
                      {activeNeeds.map(need => {
                        const status = need.campaignNeedsByNeedId.nodes[0]?.status ?? null;
                        const isJoinDisabled = status === "ACCEPTED" || status === "PENDING";
                        const isRunning = runningNeedIds.includes(need.id);
                        const creatorLabel = need.accountByCreatorAccountId?.displayName
                          ?? need.accountByCreatorAccountId?.externalSubject
                          ?? need.creatorAccountId;

                        return (
                          <NeedCard
                            actions={
                              <Stack alignItems={{ xs: "stretch", sm: "center" }} direction={{ xs: "column", sm: "row" }} spacing={1}>
                                <FormControlLabel
                                  control={(
                                    <Checkbox
                                      checked={selectedNeedIds.includes(need.id)}
                                      disabled={isJoinDisabled || isRunning || bulkNeedRunning}
                                      onChange={event => toggleNeedSelection(need.id, event.target.checked)}
                                    />
                                  )}
                                  label={t("public.needJoin.selectNeed")}
                                />
                                <Button
                                  disabled={isJoinDisabled || isRunning || bulkNeedRunning}
                                  onClick={() => void handleNeedJoinSingle(need.id)}
                                  size="small"
                                  variant="contained"
                                >
                                  {isRunning
                                    ? t("public.needJoin.joiningSingle")
                                    : t("public.needJoin.joinSingle")}
                                </Button>
                              </Stack>
                            }
                            chips={
                              <>
                                {renderNeedJoinStatusChip(status)}
                                <Chip label={need.intensity.toLowerCase()} size="small" variant="outlined" />
                              </>
                            }
                            creatorName={creatorLabel}
                            description={need.description}
                            expiresAt={need.expiresAt}
                            footer={
                              <Typography color="text.secondary" variant="body2">
                                {t("public.needJoin.tokens", { count: need.proposedTopesAmount ?? 0 })}
                              </Typography>
                            }
                            imageUrls={need.imageUrls ?? []}
                            key={need.id}
                            title={need.title}
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
