import NextLink from "next/link";
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

import { useAuth } from "../auth/AuthProvider";
import { LogoutButton } from "../auth/LogoutButton";
import { getUserFacingGraphQLErrorMessage } from "../../services/graphql/errorMessages";
import { ResourceBidDialog } from "./ResourceBidDialog";
import { RESOURCE_DETAIL_QUERY, RESPOND_TO_RESOURCE_BID_MUTATION } from "./resources.queries";
import type { ResourceBidStatus, ResourceBidSummary, ResourceIntensity } from "./types";

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

function formatDate(value: string | null) {
  if (!value) {
    return "Permanent";
  }

  return new Date(value).toLocaleString();
}

function formatBidStatus(status: ResourceBidStatus) {
  return status.replaceAll("_", " ").toLowerCase();
}

function buildResourceTags(resource: ResourceDetailData["resourceById"]) {
  if (!resource) {
    return [] as string[];
  }

  const tags = [resource.intensity.toLowerCase().replaceAll("_", " ")];

  if (resource.isProduct) {
    tags.push("product");
  }

  if (resource.isService) {
    tags.push("service");
  }

  if (resource.canBeGiven) {
    tags.push("can be given");
  }

  if (resource.canBeExchanged) {
    tags.push("can be exchanged");
  }

  if (resource.canBeTakenAway) {
    tags.push("pickup available");
  }

  if (resource.canBeDelivered) {
    tags.push("delivery available");
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
  const { session, status } = useAuth();
  const { data, loading, error, refetch } = useQuery<ResourceDetailData>(RESOURCE_DETAIL_QUERY, {
    variables: { resourceId }
  });
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
    ?? "Unknown account";
  const errorMessage = getUserFacingGraphQLErrorMessage(error) ?? getUserFacingGraphQLErrorMessage(respondError);

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
    return <Alert severity="info">Loading resource details…</Alert>;
  }

  if (!resource) {
    return <Alert severity="warning">This resource is no longer available.</Alert>;
  }

  return (
    <Container maxWidth="md">
      <Box sx={{ py: 6 }}>
        <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" spacing={2} sx={{ mb: 3 }}>
          <Box>
            <Typography component="h1" gutterBottom variant="h4">
              {resource.title}
            </Typography>
            <Typography color="text.secondary">
              Shared by {creatorLabel} • {resource.location}
            </Typography>
          </Box>

          <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
            <Button component={NextLink} href="/resources" variant="outlined">
              Back to resources
            </Button>
            {session.authenticated ? (
              <LogoutButton color="inherit" redirectTo={`/resources/${resource.id}`} variant="outlined">
                Sign out
              </LogoutButton>
            ) : (
              <Button component={NextLink} href={`/login?next=%2Fresources%2F${resource.id}`} variant="contained">
                Sign in
              </Button>
            )}
          </Stack>
        </Stack>

        {status === "loading" ? (
          <Alert severity="info" sx={{ mb: 2 }}>
            Checking your session…
          </Alert>
        ) : session.authenticated ? (
          <Alert severity={isCreator ? "success" : "info"} sx={{ mb: 2 }}>
            {isCreator
              ? "This is your resource. You can review and respond to incoming bids below."
              : "You can send or update one response for this resource while it remains active."}
          </Alert>
        ) : (
          <Alert severity="info" sx={{ mb: 2 }}>
            Sign in if you want to respond to this resource.
          </Alert>
        )}

        {!resource.isActive ? (
          <Alert severity="warning" sx={{ mb: 2 }}>
            This resource is currently inactive and cannot accept new responses.
          </Alert>
        ) : null}

        {isExpired ? (
          <Alert severity="warning" sx={{ mb: 2 }}>
            This resource has expired and is no longer accepting new responses.
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
              {resource.description ? (
                <Typography sx={{ whiteSpace: "pre-wrap" }} variant="body1">
                  {resource.description}
                </Typography>
              ) : (
                <Typography color="text.secondary" variant="body2">
                  No additional description was provided.
                </Typography>
              )}

              <Stack direction="row" flexWrap="wrap" gap={1}>
                {buildResourceTags(resource).map(tag => (
                  <Chip key={`${resource.id}-${tag}`} label={tag} size="small" variant="outlined" />
                ))}
                {resource.categoryLabels.map(label => (
                  <Chip key={`${resource.id}-category-${label}`} color="secondary" label={label} size="small" variant="outlined" />
                ))}
              </Stack>

              <Divider />

              <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                <Typography color="text.secondary" variant="body2">
                  Suggested token amount: {resource.defaultTokenAmount ?? "not set"}
                </Typography>
                <Typography color="text.secondary" variant="body2">
                  Expires: {formatDate(resource.expiresAt)}
                </Typography>
                <Typography color="text.secondary" variant="body2">
                  Published: {formatDate(resource.createdAt)}
                </Typography>
              </Stack>
            </Stack>
          </CardContent>
        </Card>

        {!isCreator ? (
          <Card sx={{ mb: 3 }} variant="outlined">
            <CardContent>
              <Stack spacing={2}>
                <Typography variant="h6">Respond to this resource</Typography>

                {existingBid ? (
                  <Alert severity={existingBid.status === "ACCEPTED" ? "success" : "info"}>
                    Your current response is <strong>{formatBidStatus(existingBid.status)}</strong>.
                  </Alert>
                ) : (
                  <Typography color="text.secondary" variant="body2">
                    Send a short note and optionally propose a token amount to start the coordination.
                  </Typography>
                )}

                {session.authenticated ? (
                  <ResourceBidDialog
                    defaultTokenAmount={resource.defaultTokenAmount}
                    disabled={!resource.isActive || isExpired}
                    disabledReason={!resource.isActive || isExpired ? "This resource is not accepting new responses." : null}
                    existingBid={existingBid ?? undefined}
                    resourceId={resource.id}
                    resourceTitle={resource.title}
                    onSubmitted={() => {
                      void refetch();
                    }}
                  />
                ) : (
                  <Button component={NextLink} href={`/login?next=%2Fresources%2F${resource.id}`} variant="contained">
                    Sign in to respond
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
                  {isCreator ? "Incoming responses" : "Your response history"}
                </Typography>

                {resourceBids.length === 0 ? (
                  <Alert severity="info">No responses have arrived for this resource yet.</Alert>
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
                                    {isCreator ? bidderLabel : "Your response"}
                                  </Typography>
                                  <Typography color="text.secondary" variant="body2">
                                    Sent {formatDate(bid.createdAt)}
                                    {bid.respondedAt ? ` • Reviewed ${formatDate(bid.respondedAt)}` : ""}
                                  </Typography>
                                </Box>
                                <Chip color={bidChipColor(bid.status)} label={formatBidStatus(bid.status)} size="small" />
                              </Stack>

                              {bid.message ? (
                                <Typography sx={{ whiteSpace: "pre-wrap" }} variant="body2">
                                  {bid.message}
                                </Typography>
                              ) : (
                                <Typography color="text.secondary" variant="body2">
                                  No opening message was added.
                                </Typography>
                              )}

                              <Typography color="text.secondary" variant="body2">
                                Proposed token amount: {bid.proposedTokenAmount ?? "not set"}
                              </Typography>

                              {isCreator && bid.status === "OPEN" ? (
                                <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
                                  <Button
                                    color="success"
                                    disabled={respondLoading}
                                    onClick={() => void handleDecision(bid.id, "ACCEPTED")}
                                    variant="contained"
                                  >
                                    Accept
                                  </Button>
                                  <Button
                                    color="error"
                                    disabled={respondLoading}
                                    onClick={() => void handleDecision(bid.id, "DECLINED")}
                                    variant="outlined"
                                  >
                                    Decline
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
