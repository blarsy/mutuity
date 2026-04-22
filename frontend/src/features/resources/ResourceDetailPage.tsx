import NextLink from "next/link";
import { useRouter } from "next/router";
import { useMutation, useQuery } from "@apollo/client/react";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Container,
  Divider,
  Stack,
  Typography
} from "@mui/material";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";

import { useAuth } from "../auth/AuthProvider";
import { LogoutButton } from "../auth/LogoutButton";
import { getUserFacingGraphQLErrorMessage } from "../../services/graphql/errorMessages";
import { getDisplayIntensityLabel } from "../shared/displayIntensity";
import { AvatarIconButton } from "../ui/AvatarIconButton";
import { ResourceBidDialog } from "./ResourceBidDialog";
import { RESOURCE_CATEGORY_OPTIONS_QUERY, RESOURCE_DETAIL_QUERY, RESPOND_TO_RESOURCE_BID_MUTATION } from "./resources.queries";
import type { ResourceBidStatus, ResourceBidSummary, ResourceIntensity } from "./types";
import type { ResourceCategoryOption } from "./types";

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

function buildResourceTags(resource: ResourceDetailData["resourceById"], t: (key: string) => string) {
  if (!resource) {
    return [] as string[];
  }

  const tags = [getDisplayIntensityLabel(resource.intensity, t)];

  if (resource.isProduct) {
    tags.push(t("tags.product"));
  }

  if (resource.isService) {
    tags.push(t("tags.service"));
  }

  if (resource.canBeGiven) {
    tags.push(t("tags.canBeGiven"));
  }

  if (resource.canBeExchanged) {
    tags.push(t("tags.canBeExchanged"));
  }

  if (resource.canBeTakenAway) {
    tags.push(t("tags.pickupAvailable"));
  }

  if (resource.canBeDelivered) {
    tags.push(t("tags.deliveryAvailable"));
  }

  return tags;
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
  const firstImageUrl = resource?.imageUrls?.[0] ?? null;
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
              <Typography color="text.secondary">• {resource.location}</Typography>
            </Stack>
          </Box>

          <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
            <Button component={NextLink} href="/resources" variant="outlined">
              {t("detail.backToResources")}
            </Button>
            {session.authenticated ? (
              <LogoutButton color="inherit" redirectTo={`/resources/${resource.id}`} variant="outlined">
                {t("detail.signOut")}
              </LogoutButton>
            ) : (
              <Button component={NextLink} href={`/login?next=%2Fresources%2F${resource.id}`} variant="contained">
                {t("detail.signIn")}
              </Button>
            )}
          </Stack>
        </Stack>

        {status === "loading" ? (
          <Alert severity="info" sx={{ mb: 2 }}>
            {t("authGuard.checking", { ns: "common" })}
          </Alert>
        ) : session.authenticated ? (
          <Alert severity={isCreator ? "success" : "info"} sx={{ mb: 2 }}>
            {isCreator
              ? t("detail.creatorHint")
              : t("detail.bidderHint")}
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
            <Stack spacing={2}>
              <Box
                sx={{
                  alignItems: "center",
                  bgcolor: firstImageUrl ? "grey.100" : "grey.50",
                  backgroundImage: firstImageUrl ? `url(${firstImageUrl})` : "none",
                  backgroundPosition: "center",
                  backgroundSize: "cover",
                  borderRadius: 1,
                  color: "text.secondary",
                  display: "flex",
                  height: 220,
                  justifyContent: "center",
                  overflow: "hidden"
                }}
              >
                {!firstImageUrl ? <Typography variant="body2">{t("detail.noImageYet")}</Typography> : null}
              </Box>

              {resource.description ? (
                <Typography sx={{ whiteSpace: "pre-wrap" }} variant="body1">
                  {resource.description}
                </Typography>
              ) : (
                <Typography color="text.secondary" variant="body2">
                  {t("detail.noDescription")}
                </Typography>
              )}

              <Stack direction="row" flexWrap="wrap" gap={1}>
                {buildResourceTags(resource, t).map(tag => (
                  <Chip key={`${resource.id}-${tag}`} label={tag} size="small" variant="outlined" />
                ))}
                {resource.categoryLabels.map(label => (
                  <Chip
                    key={`${resource.id}-category-${label}`}
                    color="secondary"
                    label={localizedCategoryByLabel.get(label) ?? label}
                    size="small"
                    variant="outlined"
                  />
                ))}
              </Stack>

              <Divider />

              <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                <Typography color="text.secondary" variant="body2">
                  {t("card.suggestedTokenAmount")}: {resource.defaultTokenAmount ?? t("card.notSet")}
                </Typography>
                <Typography color="text.secondary" variant="body2">
                  {t("card.expires")}: {formatDate(resource.expiresAt, t("card.permanent"))}
                </Typography>
                <Typography color="text.secondary" variant="body2">
                  {t("detail.published")}: {formatDate(resource.createdAt, t("card.permanent"))}
                </Typography>
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
