import { useEffect, useMemo, useRef, useState } from "react";
import NextLink from "next/link";
import { useRouter } from "next/router";
import { useMutation, useQuery } from "@apollo/client/react";
import {
  Alert,
  Box,
  Button,
  Chip,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  Typography
} from "@mui/material";
import { useTranslation } from "react-i18next";

import { useAuth } from "../../features/auth/AuthProvider";
import { useRequireAuth } from "../../features/auth/requireAuth";
import { MY_RESOURCES_CONNECTION_QUERY, RESOURCE_OPEN_BID_COUNT_QUERY, SOFT_DELETE_RESOURCE_MUTATION } from "../../features/resources/resources.queries";
import { ResourceCard } from "../../features/ui/ResourceCard";
import { getUserFacingGraphQLErrorMessage } from "../../services/graphql/errorMessages";

type ManageResourceNode = {
  id: string;
  creatorAccountId: string;
  title: string;
  description: string | null;
  location: string;
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
  createdAt: string;
  updatedAt: string;
  accountByCreatorAccountId: {
    id: string;
    displayName: string | null;
    externalSubject: string;
  } | null;
};

type MyResourcesData = {
  allResources: {
    nodes: ManageResourceNode[];
    pageInfo: {
      hasNextPage: boolean;
      endCursor: string | null;
    };
  };
};

type MyResourcesVariables = {
  creatorAccountId: string;
  first: number;
  after?: string;
};

const PAGE_SIZE = 10;

function formatUpdatedAt(value: string) {
  return new Date(value).toLocaleString();
}

export default function ManageResourcesPage() {
  const router = useRouter();
  const { session } = useAuth();
  const { t } = useTranslation("resources");
  const { isAuthenticated, isChecking, isRedirecting } = useRequireAuth();
  const loadMoreRef = useRef<HTMLDivElement | null>(null);
  const [resourcePendingDelete, setResourcePendingDelete] = useState<ManageResourceNode | null>(null);

  const {
    data,
    loading,
    error,
    fetchMore,
    refetch
  } = useQuery<MyResourcesData, MyResourcesVariables>(MY_RESOURCES_CONNECTION_QUERY, {
    skip: !isAuthenticated || !session.account?.id,
    variables: {
      creatorAccountId: session.account?.id ?? "",
      first: PAGE_SIZE
    }
  });
  const [softDeleteResource, { loading: deleting, error: deleteError }] = useMutation(SOFT_DELETE_RESOURCE_MUTATION);

  const { data: openBidData, loading: openBidLoading } = useQuery<{ allResourceBids: { totalCount: number } }, { resourceId: string }>(
    RESOURCE_OPEN_BID_COUNT_QUERY,
    { skip: !resourcePendingDelete, variables: { resourceId: resourcePendingDelete?.id ?? "" }, fetchPolicy: "network-only" }
  );
  const openBidCount = openBidData?.allResourceBids.totalCount ?? 0;

  const hasNextPage = data?.allResources.pageInfo.hasNextPage ?? false;
  const endCursor = data?.allResources.pageInfo.endCursor ?? null;

  useEffect(() => {
    if (!loadMoreRef.current || !isAuthenticated) {
      return;
    }

    const observer = new IntersectionObserver(entries => {
      const [entry] = entries;

      if (!entry?.isIntersecting || loading || !hasNextPage || !endCursor || !session.account?.id) {
        return;
      }

      void fetchMore({
        variables: {
          creatorAccountId: session.account.id,
          first: PAGE_SIZE,
          after: endCursor
        },
        updateQuery: (previousResult, { fetchMoreResult }) => {
          if (!fetchMoreResult) {
            return previousResult;
          }

          return {
            allResources: {
              ...fetchMoreResult.allResources,
              nodes: [...previousResult.allResources.nodes, ...fetchMoreResult.allResources.nodes]
            }
          };
        }
      });
    });

    observer.observe(loadMoreRef.current);

    return () => {
      observer.disconnect();
    };
  }, [endCursor, fetchMore, hasNextPage, isAuthenticated, loading, session.account?.id]);

  const sortedResources = useMemo(() => {
    return [...(data?.allResources.nodes ?? [])].sort(
      (left, right) => new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime()
    );
  }, [data?.allResources.nodes]);

  const errorMessage = getUserFacingGraphQLErrorMessage(error) ?? getUserFacingGraphQLErrorMessage(deleteError);

  const confirmSoftDelete = async () => {
    if (!resourcePendingDelete) {
      return;
    }

    await softDeleteResource({
      variables: {
        id: resourcePendingDelete.id
      }
    });

    setResourcePendingDelete(null);
    await refetch();
  };

  if (!isAuthenticated) {
    return (
      <Container maxWidth="md">
        <Box sx={{ py: 6 }}>
          <Typography component="h1" gutterBottom variant="h4">
            {t("manage.title")}
          </Typography>
          <Alert severity="info">
            {isChecking ? t("authGuard.checking", { ns: "common" }) : isRedirecting ? t("authGuard.redirecting", { ns: "common" }) : t("authGuard.signInRequired", { ns: "common" })}
          </Alert>
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg">
      <Box sx={{ py: 6 }}>
        <Stack spacing={3}>
          <Box>
            <Typography component="h1" gutterBottom variant="h4">
              {t("manage.title")}
            </Typography>
          </Box>

          {loading ? <Alert severity="info">{t("manage.loading")}</Alert> : null}
          {errorMessage ? <Alert severity="error">{errorMessage}</Alert> : null}

          {!loading && !errorMessage && sortedResources.length === 0 ? (
            <Alert severity="info">{t("manage.empty")}</Alert>
          ) : null}

          <Box
            sx={{
              display: "grid",
              gap: 2,
              gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))"
            }}
          >
            {sortedResources.map(resource => {
              const creatorLabel = resource.accountByCreatorAccountId?.displayName
                ?? resource.accountByCreatorAccountId?.externalSubject
                ?? resource.creatorAccountId;

              return (
                <ResourceCard
                  actions={(
                    <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
                      <Button
                        component={NextLink}
                        href={`/resources/create?resourceId=${resource.id}`}
                        size="small"
                        variant="outlined"
                      >
                        {t("actions.edit", { ns: "common" })}
                      </Button>
                      <Button
                        color="error"
                        disabled={deleting}
                        onClick={() => setResourcePendingDelete(resource)}
                        size="small"
                        variant="text"
                      >
                        {t("actions.delete", { ns: "common" })}
                      </Button>
                    </Stack>
                  )}
                  chips={
                    <>
                      <Chip label={t("manage.tokensChip", { amount: resource.defaultTokenAmount ?? "—" })} size="small" variant="outlined" />
                      {resource.categoryLabels.slice(0, 2).map(label => (
                        <Chip key={`${resource.id}-${label}`} label={label} size="small" variant="outlined" />
                      ))}
                    </>
                  }
                  creatorName={creatorLabel}
                  description={resource.description}
                  expiresAt={resource.expiresAt}
                  footer={(
                    <Typography color="text.secondary" variant="body2">
                      {t("lastUpdated", { ns: "common", date: formatUpdatedAt(resource.updatedAt) })}
                    </Typography>
                  )}
                  imageUrls={resource.imageUrls ?? []}
                  key={resource.id}
                  location={resource.location}
                  onClick={() => {
                    void router.push(`/resources/${resource.id}`);
                  }}
                  onCreatorClick={() => {
                    void router.push(`/accounts/${resource.creatorAccountId}`);
                  }}
                  showListingHeader={false}
                  title={resource.title}
                />
              );
            })}
          </Box>

          {hasNextPage ? (
            <Box ref={loadMoreRef} sx={{ display: "flex", justifyContent: "center", mt: 2 }}>
              <Chip label={t("manage.loadingMore")} size="small" variant="outlined" />
            </Box>
          ) : null}

        </Stack>
      </Box>

      <Dialog onClose={() => setResourcePendingDelete(null)} open={Boolean(resourcePendingDelete)}>
        <DialogTitle>{t("manage.deleteDialog.title")}</DialogTitle>
        <DialogContent>
          <Typography variant="body2">
            {t("manage.deleteDialog.body", { title: resourcePendingDelete?.title ?? "" })}
          </Typography>
          {!openBidLoading && openBidCount > 0 ? (
            <Alert severity="warning" sx={{ mt: 1.5 }}>
              {t("manage.deleteDialog.openBidsWarning", { count: openBidCount })}
            </Alert>
          ) : null}
        </DialogContent>
        <DialogActions>
          <Button disabled={deleting} onClick={() => setResourcePendingDelete(null)}>
            {t("actions.cancel", { ns: "common" })}
          </Button>
          <Button color="error" disabled={deleting || openBidLoading} onClick={() => void confirmSoftDelete()} variant="contained">
            {deleting ? t("manage.deleteDialog.deleting") : t("actions.delete", { ns: "common" })}
          </Button>
        </DialogActions>
      </Dialog>

      <Button
        component={NextLink}
        href="/resources/create"
        sx={{
          bottom: 24,
          position: "fixed",
          right: 24,
          zIndex: theme => theme.zIndex.speedDial
        }}
        variant="contained"
      >
        {t("manage.addButton")}
      </Button>
    </Container>
  );
}
