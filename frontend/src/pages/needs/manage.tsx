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
import { MY_NEEDS_CONNECTION_QUERY, SOFT_DELETE_NEED_MUTATION } from "../../features/needs/needs.queries";
import { NeedCard } from "../../features/ui/NeedCard";
import { getUserFacingGraphQLErrorMessage } from "../../services/graphql/errorMessages";

type ManageNeedNode = {
  id: string;
  creatorAccountId: string;
  title: string;
  description: string | null;
  location: string;
  intensity: string;
  proposedTopesAmount: number | null;
  objectRequired: boolean;
  competenceRequired: boolean;
  toolingRequired: boolean;
  multiplePeopleRequired: boolean;
  requiredPeopleCount: number | null;
  expiresAt: string | null;
  createdAt: string;
  updatedAt: string;
  accountByCreatorAccountId: {
    id: string;
    displayName: string | null;
    externalSubject: string;
  } | null;
};

type MyNeedsData = {
  allNeeds: {
    nodes: ManageNeedNode[];
    pageInfo: {
      hasNextPage: boolean;
      endCursor: string | null;
    };
  } | null;
};

type MyNeedsVariables = {
  creatorAccountId: string;
  first: number;
  after?: string;
};

const PAGE_SIZE = 10;

function formatUpdatedAt(value: string) {
  return new Date(value).toLocaleString();
}

function buildNeedTags(need: ManageNeedNode) {
  const tags = [need.intensity.toLowerCase().replaceAll("_", " ")];

  if (need.objectRequired) {
    tags.push("object");
  }

  if (need.toolingRequired) {
    tags.push("tooling");
  }

  if (need.competenceRequired) {
    tags.push("competence");
  }

  if (need.multiplePeopleRequired) {
    tags.push(need.requiredPeopleCount ? `${need.requiredPeopleCount}+ people` : "multiple people");
  }

  return tags;
}

export default function ManageNeedsPage() {
  const router = useRouter();
  const { session } = useAuth();
  const { t } = useTranslation("needs");
  const { isAuthenticated, isChecking, isRedirecting } = useRequireAuth();
  const loadMoreRef = useRef<HTMLDivElement | null>(null);
  const [needPendingDelete, setNeedPendingDelete] = useState<ManageNeedNode | null>(null);

  const { data, loading, error, fetchMore, refetch } = useQuery<MyNeedsData, MyNeedsVariables>(MY_NEEDS_CONNECTION_QUERY, {
    skip: !isAuthenticated || !session.account?.id,
    variables: {
      creatorAccountId: session.account?.id ?? "",
      first: PAGE_SIZE
    }
  });
  const [softDeleteNeed, { loading: deleting, error: deleteError }] = useMutation(SOFT_DELETE_NEED_MUTATION);

  const hasNextPage = data?.allNeeds?.pageInfo.hasNextPage ?? false;
  const endCursor = data?.allNeeds?.pageInfo.endCursor ?? null;

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
          if (!fetchMoreResult?.allNeeds || !previousResult.allNeeds) {
            return previousResult;
          }

          return {
            allNeeds: {
              ...fetchMoreResult.allNeeds,
              nodes: [...previousResult.allNeeds.nodes, ...fetchMoreResult.allNeeds.nodes]
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

  const sortedNeeds = useMemo(() => {
    return [...(data?.allNeeds?.nodes ?? [])].sort(
      (left, right) => new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime()
    );
  }, [data?.allNeeds?.nodes]);

  const errorMessage = getUserFacingGraphQLErrorMessage(error) ?? getUserFacingGraphQLErrorMessage(deleteError);

  const confirmSoftDelete = async () => {
    if (!needPendingDelete) {
      return;
    }

    await softDeleteNeed({
      variables: {
        id: needPendingDelete.id
      }
    });

    setNeedPendingDelete(null);
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
            <Typography color="text.secondary">
              {t("manage.subtitle")}
            </Typography>
          </Box>

          {loading ? <Alert severity="info">{t("manage.loading")}</Alert> : null}
          {errorMessage ? <Alert severity="error">{errorMessage}</Alert> : null}

          {!loading && !errorMessage && sortedNeeds.length === 0 ? (
            <Alert severity="info">{t("manage.empty")}</Alert>
          ) : null}

          <Box
            sx={{
              display: "grid",
              gap: 2,
              gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))"
            }}
          >
            {sortedNeeds.map(need => {
              const creatorLabel = need.accountByCreatorAccountId?.displayName
                ?? need.accountByCreatorAccountId?.externalSubject
                ?? need.creatorAccountId;

              return (
                <NeedCard
                  actions={(
                    <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
                      <Button
                        component={NextLink}
                        href={`/needs/create?needId=${need.id}`}
                        size="small"
                        variant="outlined"
                      >
                        {t("actions.edit", { ns: "common" })}
                      </Button>
                      <Button
                        color="error"
                        disabled={deleting}
                        onClick={() => setNeedPendingDelete(need)}
                        size="small"
                        variant="text"
                      >
                        {t("actions.delete", { ns: "common" })}
                      </Button>
                    </Stack>
                  )}
                  chips={
                    <>
                      <Chip label={`${need.proposedTopesAmount ?? "-"} topes`} size="small" variant="outlined" />
                      {buildNeedTags(need).slice(0, 2).map(tag => (
                        <Chip key={`${need.id}-${tag}`} label={tag} size="small" variant="outlined" />
                      ))}
                    </>
                  }
                  creatorName={creatorLabel}
                  description={need.description}
                  expiresAt={need.expiresAt}
                  footer={(
                    <Typography color="text.secondary" variant="body2">
                      {t("lastUpdated", { ns: "common", date: formatUpdatedAt(need.updatedAt) })}
                    </Typography>
                  )}
                  key={need.id}
                  onClick={() => {
                    void router.push(`/needs/${need.id}`);
                  }}
                  onCreatorClick={() => {
                    void router.push(`/accounts/${need.creatorAccountId}`);
                  }}
                  title={need.title}
                />
              );
            })}
          </Box>

          {hasNextPage ? (
            <Box ref={loadMoreRef} sx={{ display: "flex", justifyContent: "center", mt: 2 }}>
              <Chip label={t("manage.loadingMore")} size="small" variant="outlined" />
            </Box>
          ) : null}

          <Typography color="text.secondary" variant="body2">
            <NextLink href="/needs">{t("manage.backToSearch")}</NextLink>
          </Typography>
        </Stack>
      </Box>

      <Dialog onClose={() => setNeedPendingDelete(null)} open={Boolean(needPendingDelete)}>
        <DialogTitle>{t("manage.deleteDialog.title")}</DialogTitle>
        <DialogContent>
          <Typography variant="body2">
            {t("manage.deleteDialog.body", { title: needPendingDelete?.title ?? "" })}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button disabled={deleting} onClick={() => setNeedPendingDelete(null)}>
            {t("actions.cancel", { ns: "common" })}
          </Button>
          <Button color="error" disabled={deleting} onClick={() => void confirmSoftDelete()} variant="contained">
            {deleting ? t("manage.deleteDialog.deleting") : t("actions.delete", { ns: "common" })}
          </Button>
        </DialogActions>
      </Dialog>

      <Button
        component={NextLink}
        href="/needs/create"
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
