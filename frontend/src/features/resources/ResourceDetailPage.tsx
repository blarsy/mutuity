import NextLink from "next/link";
import { useRouter } from "next/router";
import { useMutation, useQuery } from "@apollo/client/react";
import ArrowBackIosNewIcon from "@mui/icons-material/ArrowBackIosNew";
import ArrowForwardIosIcon from "@mui/icons-material/ArrowForwardIos";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Container,
  IconButton,
  Stack,
  Typography
} from "@mui/material";
import { APIProvider, Map as GoogleMap, Marker } from "@vis.gl/react-google-maps";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import { useAuth } from "../auth/AuthProvider";
import { getUserFacingGraphQLErrorMessage } from "../../services/graphql/errorMessages";
import { RichTextContent } from "../../components/richText/RichTextContent";
import { IntensityDisplay } from "../../components/IntensityPicker";
import { AvatarIconButton } from "../ui/AvatarIconButton";
import { StartConversationDialog } from "../chat/StartConversationDialog";
import { ResourceBidDialog } from "./ResourceBidDialog";
import { RESOURCE_CATEGORY_OPTIONS_QUERY, RESOURCE_DETAIL_QUERY, RESPOND_TO_RESOURCE_BID_MUTATION } from "./resources.queries";
import type { ResourceBidStatus, ResourceBidSummary, ResourceIntensity } from "./types";
import type { ResourceCategoryOption } from "./types";

const MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? "";

type ResourceDetailPageProps = {
  resourceId: string;
};

type ResourceDetailData = {
  resourceById: {
    id: string;
    creatorAccountId: string;
    title: string;
    description: string | null;
    location: string;
    latitude: number;
    longitude: number;
    intensity: ResourceIntensity;
    defaultTokenAmount: number | null;
    imageUrls: string[];
    categoryLabels: string[];
    isProduct: boolean;
    isService: boolean;
    canBeGiven: boolean;
    canBeExchanged: boolean;
    canBeTakenAway: boolean;
    canBeDelivered: boolean;
    expiresAt: string | null;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
    accountByCreatorAccountId: {
      id: string;
      displayName: string | null;
      externalSubject: string;
    } | null;
    resourceBidsByResourceId: {
      nodes: ResourceBidSummary[];
    };
  } | null;
};

type RespondToResourceBidMutationData = {
  respondToResourceBid: {
    resourceBid: {
      id: string;
      status: string;
    };
  };
};

type ResourceCategoryOptionsQueryData = {
  allResourceCategories: {
    nodes: ResourceCategoryOption[];
  };
};

function formatDate(value: string | null, noDateLabel: string) {
  if (!value) {
    return noDateLabel;
  }

  return new Date(value).toLocaleString();
}

function formatBidStatus(status: ResourceBidStatus, t: (key: string, options?: Record<string, unknown>) => string) {
  return t(`detail.bidStatuses.${status}`, { defaultValue: status.replaceAll("_", " ").toLowerCase() });
}

function bidChipColor(status: ResourceBidStatus): "default" | "success" | "warning" | "error" | "info" {
  switch (status) {
    case "ACCEPTED":
      return "success";
    case "DECLINED":
      return "error";
    case "EXPIRED":
      return "warning";
    case "WITHDRAWN":
      return "default";
    default:
      return "info";
  }
}

export function ResourceDetailPage({ resourceId }: ResourceDetailPageProps) {
  const router = useRouter();
  const { session, status } = useAuth();
  const { t, i18n } = useTranslation("resources");
  const { data, loading, error, refetch } = useQuery<ResourceDetailData>(RESOURCE_DETAIL_QUERY, {
    variables: { resourceId }
  });
  const { data: categoryData } = useQuery<ResourceCategoryOptionsQueryData>(RESOURCE_CATEGORY_OPTIONS_QUERY);
  const [respondToResourceBid, { loading: respondLoading, error: respondError }] =
    useMutation<RespondToResourceBidMutationData>(RESPOND_TO_RESOURCE_BID_MUTATION);

  const resource = data?.resourceById ?? null;
  const currentAccountId = session.account?.id ?? null;
  const isCreator = resource?.creatorAccountId === currentAccountId;
  const resourceBids = [...(resource?.resourceBidsByResourceId.nodes ?? [])].sort(
    (left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime()
  );
  const existingBid = resourceBids.find(bid => bid.bidderAccountId === currentAccountId) ?? null;
  const isExpired = resource?.expiresAt ? new Date(resource.expiresAt).getTime() <= Date.now() : false;
  const creatorLabel = resource?.accountByCreatorAccountId?.displayName
    ?? resource?.accountByCreatorAccountId?.externalSubject
    ?? resource?.creatorAccountId
    ?? t("detail.unknownAccount");
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const imageUrls = resource?.imageUrls ?? [];
  const currentImageUrl = imageUrls[currentImageIndex] ?? null;
  const errorMessage = getUserFacingGraphQLErrorMessage(error) ?? getUserFacingGraphQLErrorMessage(respondError);
  const categoryOptions = categoryData?.allResourceCategories.nodes ?? [];
  const isFrench = i18n.language.toLowerCase().startsWith("fr");
  const localizedCategoryByLabel = useMemo(() => {
    const map = new Map<string, string>();

    for (const category of categoryOptions) {
      const localizedLabel = isFrench ? category.labelFr : category.label;
      map.set(category.label, localizedLabel);
      map.set(category.labelFr, localizedLabel);
    }

    return map;
  }, [categoryOptions, isFrench]);
  const natureLabels = [
    resource?.isProduct ? t("form.isProduct") : null,
    resource?.isService ? t("form.isService") : null
  ].filter((value): value is string => Boolean(value));
  const exchangeLabels = [
    resource?.canBeGiven ? t("form.canBeGiven") : null,
    resource?.canBeExchanged ? t("form.canBeExchanged") : null
  ].filter((value): value is string => Boolean(value));
  const deliveryLabels = [
    resource?.canBeTakenAway ? t("form.canBeTakenAway") : null,
    resource?.canBeDelivered ? t("form.canBeDelivered") : null
  ].filter((value): value is string => Boolean(value));
  const latitude = Number(resource?.latitude);
  const longitude = Number(resource?.longitude);
  const hasValidCoordinates = Number.isFinite(latitude) && Number.isFinite(longitude);

  useEffect(() => {
    setCurrentImageIndex(0);
  }, [resource?.id]);

  const handleDecision = async (resourceBidId: string, nextStatus: "ACCEPTED" | "DECLINED") => {
    await respondToResourceBid({
      variables: {
        input: {
          resourceBidId,
          status: nextStatus
        }
      }
    });

    await refetch();
  };

  if (loading) {
    return <Alert severity="info">{t("detail.loading")}</Alert>;
  }

  if (!resource) {
    return <Alert severity="warning">{t("detail.notAvailable")}</Alert>;
  }

  return (
    <Container maxWidth="md">
      <Box sx={{ py: 6 }}>
        <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" spacing={2} sx={{ mb: 3 }}>
          <Box>
            <Typography component="h1" gutterBottom variant="h4">
              {resource.title}
            </Typography>
            <Stack alignItems="center" direction="row" spacing={1}>
              <AvatarIconButton
                displayName={creatorLabel}
                onClick={() => {
                  void router.push(`/accounts/${resource.creatorAccountId}`);
                }}
              />
              <Button
                color="inherit"
                onClick={() => {
                  void router.push(`/accounts/${resource.creatorAccountId}`);
                }}
                sx={{ minWidth: 0, px: 0.5 }}
              >
                {creatorLabel}
              </Button>
            </Stack>
          </Box>


        </Stack>

        {status === "loading" ? (
          <Alert severity="info" sx={{ mb: 2 }}>
            {t("authGuard.checking", { ns: "common" })}
          </Alert>
        ) : session.authenticated ? (
          <Alert severity={isCreator ? "success" : "info"} sx={{ mb: 2 }}>
            <Stack
              alignItems={{ xs: "flex-start", sm: "center" }}
              direction={{ xs: "column", sm: "row" }}
              justifyContent="space-between"
              spacing={1.5}
            >
              <Typography variant="body2">
                {isCreator
                  ? t("detail.creatorHint")
                  : t("detail.bidderHint")}
              </Typography>
              {isCreator ? (
                <Button
                  component={NextLink}
                  href={`/resources/create?resourceId=${resource.id}`}
                  size="small"
                  variant="contained"
                >
                  {t("page.editTitle")}
                </Button>
              ) : null}
            </Stack>
          </Alert>
        ) : (
          <Alert severity="info" sx={{ mb: 2 }}>
            {t("detail.signInHint")}
          </Alert>
        )}

        {!resource.isActive ? (
          <Alert severity="warning" sx={{ mb: 2 }}>
            {t("detail.inactiveWarning")}
          </Alert>
        ) : null}

        {isExpired ? (
          <Alert severity="warning" sx={{ mb: 2 }}>
            {t("detail.expiredWarning")}
          </Alert>
        ) : null}

        {errorMessage ? (
          <Alert severity="error" sx={{ mb: 2 }}>
            {errorMessage}
          </Alert>
        ) : null}

        <Card sx={{ mb: 3 }} variant="outlined">
          <CardContent>
            <Stack spacing={2.5}>
              <Box
                sx={{
                  alignItems: "center",
                  display: "flex",
                  justifyContent: "center",
                  gap: 1
                }}
              >
                <IconButton
                  disabled={currentImageIndex === 0 || imageUrls.length <= 1}
                  onClick={() => setCurrentImageIndex((prev) => Math.max(0, prev - 1))}
                  sx={{
                    visibility: currentImageIndex === 0 || imageUrls.length <= 1 ? "hidden" : "visible"
                  }}
                >
                  <ArrowBackIosNewIcon fontSize="small" />
                </IconButton>

                <Box
                  sx={{
                    alignItems: "center",
                    bgcolor: currentImageUrl ? "grey.100" : "grey.50",
                    backgroundImage: currentImageUrl ? `url(${currentImageUrl})` : "none",
                    backgroundPosition: "center",
                    backgroundSize: "cover",
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
                  {!currentImageUrl ? <Typography variant="body2">{t("detail.noImageYet")}</Typography> : null}
                </Box>

                <IconButton
                  disabled={currentImageIndex >= imageUrls.length - 1 || imageUrls.length <= 1}
                  onClick={() => setCurrentImageIndex((prev) => Math.min(imageUrls.length - 1, prev + 1))}
                  sx={{
                    visibility: currentImageIndex >= imageUrls.length - 1 || imageUrls.length <= 1 ? "hidden" : "visible"
                  }}
                >
                  <ArrowForwardIosIcon fontSize="small" />
                </IconButton>
              </Box>

              {imageUrls.length > 1 ? (
                <Stack direction="row" justifyContent="center" spacing={0.75}>
                  {imageUrls.map((_, index) => (
                    <Box
                      key={`detail-image-dot-${index}`}
                      sx={(theme) => ({
                        width: 8,
                        height: 8,
                        borderRadius: "50%",
                        bgcolor: index === currentImageIndex ? theme.palette.primary.main : theme.palette.action.disabled
                      })}
                    />
                  ))}
                </Stack>
              ) : null}

              <Stack spacing={0.5}>
                <Typography color="text.secondary" variant="overline">
                  {t("form.titleLabel")}
                </Typography>
                <Typography variant="h5">
                  {resource.title}
                </Typography>
              </Stack>

              <Stack spacing={0.5}>
                <Typography color="text.secondary" variant="overline">
                  {t("form.descriptionLabel")}
                </Typography>
                <RichTextContent emptyFallback={t("detail.noDescription")} html={resource.description ?? ""} />
              </Stack>

              <Stack spacing={0.5}>
                <Typography color="text.secondary" variant="overline">
                  {t("form.intensityLabel")}
                </Typography>
                <IntensityDisplay intensity={resource.intensity} tokenAmount={resource.defaultTokenAmount} />
              </Stack>

              <Stack spacing={0.5}>
                <Typography color="text.secondary" variant="overline">
                  {t("form.categoriesLabel")}
                </Typography>
                <Stack direction="row" flexWrap="wrap" gap={1}>
                  {resource.categoryLabels.length === 0 ? (
                    <Chip label={t("categories.noCategories")} size="small" variant="outlined" />
                  ) : resource.categoryLabels.map(label => (
                    <Chip
                      key={`${resource.id}-category-${label}`}
                      color="primary"
                      label={localizedCategoryByLabel.get(label) ?? label}
                      size="small"
                      variant="outlined"
                    />
                  ))}
                </Stack>
              </Stack>

              <Stack spacing={0.5}>
                <Typography color="text.secondary" variant="overline">
                  {t("form.resourceTypeTitle")}
                </Typography>
                <Stack direction="row" flexWrap="wrap" gap={1}>
                  {natureLabels.map(label => (
                    <Chip key={`nature-${label}`} label={label} size="small" variant="outlined" />
                  ))}
                </Stack>
              </Stack>

              <Stack spacing={0.5}>
                <Typography color="text.secondary" variant="overline">
                  {t("filters.canBeExchanged")}
                </Typography>
                <Stack direction="row" flexWrap="wrap" gap={1}>
                  {exchangeLabels.map(label => (
                    <Chip key={`exchange-${label}`} label={label} size="small" variant="outlined" />
                  ))}
                </Stack>
              </Stack>

              <Stack spacing={0.5}>
                <Typography color="text.secondary" variant="overline">
                  {t("filters.canBeDelivered")}
                </Typography>
                <Stack direction="row" flexWrap="wrap" gap={1}>
                  {deliveryLabels.map(label => (
                    <Chip key={`delivery-${label}`} label={label} size="small" variant="outlined" />
                  ))}
                </Stack>
              </Stack>

              <Stack spacing={0.5}>
                <Typography color="text.secondary" variant="overline">
                  {t("form.locationLabel")}
                </Typography>
                <Stack spacing={1.25}>
                  <Typography variant="body2">
                    {resource.location}
                  </Typography>
                  <Box
                    sx={{
                      borderRadius: 1,
                      overflow: "hidden",
                      width: "100%",
                      aspectRatio: "16 / 9",
                      bgcolor: "grey.100"
                    }}
                  >
                    {MAPS_API_KEY && hasValidCoordinates ? (
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
                    ) : (
                      <Box
                        sx={{
                          alignItems: "center",
                          color: "text.secondary",
                          display: "flex",
                          height: "100%",
                          justifyContent: "center"
                        }}
                      >
                        <Typography variant="caption">{resource.location}</Typography>
                      </Box>
                    )}
                  </Box>
                </Stack>
              </Stack>

              <Stack direction={{ xs: "column", sm: "row" }} spacing={2.5}>
                <Stack spacing={0.25}>
                  <Typography color="text.secondary" variant="overline">
                    {t("card.expires")}
                  </Typography>
                  <Typography variant="body2">
                    {formatDate(resource.expiresAt, t("card.permanent"))}
                  </Typography>
                </Stack>
                <Stack spacing={0.25}>
                  <Typography color="text.secondary" variant="overline">
                    {t("detail.published")}
                  </Typography>
                  <Typography variant="body2">
                    {formatDate(resource.createdAt, t("card.permanent"))}
                  </Typography>
                </Stack>
              </Stack>
            </Stack>
          </CardContent>
        </Card>

        {!isCreator ? (
          <Card sx={{ mb: 3 }} variant="outlined">
            <CardContent>
              <Stack spacing={2}>
                <Typography variant="h6">{t("detail.respondTitle")}</Typography>

                {existingBid ? (
                  <Alert severity={existingBid.status === "ACCEPTED" ? "success" : "info"}>
                    {t("detail.currentResponsePrefix")} <strong>{formatBidStatus(existingBid.status, t)}</strong>.
                  </Alert>
                ) : (
                  <Typography color="text.secondary" variant="body2">
                    {t("detail.respondHint")}
                  </Typography>
                )}

                {session.authenticated ? (
                  <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
                    <ResourceBidDialog
                      defaultTokenAmount={resource.defaultTokenAmount}
                      disabled={!resource.isActive || isExpired}
                      disabledReason={!resource.isActive || isExpired ? t("detail.notAcceptingResponses") : null}
                      existingBid={existingBid ?? undefined}
                      resourceId={resource.id}
                      resourceTitle={resource.title}
                      onSubmitted={() => {
                        void refetch();
                      }}
                    />
                    <StartConversationDialog
                      buttonLabel={t("detail.contactCreator")}
                      creatorAccountId={resource.creatorAccountId}
                      disabled={!resource.isActive || isExpired}
                      disabledReason={!resource.isActive || isExpired ? t("detail.notAcceptingResponses") : null}
                      kind="resource"
                      resourceId={resource.id}
                      title={resource.title}
                    />
                  </Stack>
                ) : (
                  <Button component={NextLink} href={`/login?next=%2Fresources%2F${resource.id}`} variant="contained">
                    {t("card.signInToRespond")}
                  </Button>
                )}
              </Stack>
            </CardContent>
          </Card>
        ) : null}

        {(isCreator || existingBid) ? (
          <Card variant="outlined">
            <CardContent>
              <Stack spacing={2}>
                <Typography variant="h6">
                  {isCreator ? t("detail.incomingResponses") : t("detail.yourResponseHistory")}
                </Typography>

                {resourceBids.length === 0 ? (
                  <Alert severity="info">{t("detail.noResponsesYet")}</Alert>
                ) : (
                  <Stack spacing={2}>
                    {(isCreator ? resourceBids : resourceBids.filter(bid => bid.bidderAccountId === currentAccountId)).map(bid => {
                      const bidderLabel = bid.accountByBidderAccountId?.displayName
                        ?? bid.accountByBidderAccountId?.externalSubject
                        ?? bid.bidderAccountId;

                      return (
                        <Card key={bid.id} variant="outlined">
                          <CardContent>
                            <Stack spacing={1.5}>
                              <Stack
                                alignItems={{ xs: "flex-start", sm: "center" }}
                                direction={{ xs: "column", sm: "row" }}
                                justifyContent="space-between"
                                spacing={1}
                              >
                                <Box>
                                  <Typography variant="subtitle1">
                                    {isCreator ? bidderLabel : t("detail.yourResponse")}
                                  </Typography>
                                  <Typography color="text.secondary" variant="body2">
                                    {t("detail.sentAt", { date: formatDate(bid.createdAt, t("card.permanent")) })}
                                    {bid.respondedAt ? ` • ${t("detail.reviewedAt", { date: formatDate(bid.respondedAt, t("card.permanent")) })}` : ""}
                                  </Typography>
                                </Box>
                                <Chip color={bidChipColor(bid.status)} label={formatBidStatus(bid.status, t)} size="small" />
                              </Stack>

                              {bid.message ? (
                                <Typography sx={{ whiteSpace: "pre-wrap" }} variant="body2">
                                  {bid.message}
                                </Typography>
                              ) : (
                                <Typography color="text.secondary" variant="body2">
                                  {t("detail.noOpeningMessage")}
                                </Typography>
                              )}

                              <Typography color="text.secondary" variant="body2">
                                {t("detail.proposedTokenAmount")}: {bid.proposedTokenAmount ?? t("card.notSet")}
                              </Typography>

                              {isCreator && bid.status === "OPEN" ? (
                                <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
                                  <Button
                                    color="success"
                                    disabled={respondLoading}
                                    onClick={() => void handleDecision(bid.id, "ACCEPTED")}
                                    variant="contained"
                                  >
                                    {t("detail.accept")}
                                  </Button>
                                  <Button
                                    color="error"
                                    disabled={respondLoading}
                                    onClick={() => void handleDecision(bid.id, "DECLINED")}
                                    variant="outlined"
                                  >
                                    {t("detail.decline")}
                                  </Button>
                                </Stack>
                              ) : null}
                            </Stack>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </Stack>
                )}
              </Stack>
            </CardContent>
          </Card>
        ) : null}
      </Box>
    </Container>
  );
}
