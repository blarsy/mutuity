import { useEffect, useMemo, useState } from "react";
import NextLink from "next/link";
import { useRouter } from "next/router";
import { useQuery } from "@apollo/client/react";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Container,
  Stack,
  TextField,
  Typography
} from "@mui/material";
import { useTranslation } from "react-i18next";

import { useAuth } from "../auth/AuthProvider";
import { getUserFacingGraphQLErrorMessage } from "../../services/graphql/errorMessages";
import { getDisplayIntensityLabel } from "../shared/displayIntensity";
import { buildNeedSearchVariables, cycleTriStateFilter, describeTriStateFilter, type NeedSearchQueryVariables } from "./needFilters";
import { NeedClaimDialog } from "./NeedClaimDialog";
import { getBrowserLocation } from "./locationFallback";
import { VIEWER_CLAIM_OVERVIEW_QUERY } from "./needClaims.queries";
import { PUBLIC_NEEDS_QUERY } from "./needs.queries";
import { NeedCard } from "../ui/NeedCard";
import { DEFAULT_NEED_SEARCH_FILTERS, type NeedSearchFilters, type NeedSearchLocation, type TriStateFilter } from "./types";

type NeedNode = {
  id: string;
  creatorAccountId: string;
  creatorDisplayName: string;
  title: string;
  description: string | null;
  location: string;
  intensity: string;
  proposedTopesAmount: number | null;
  objectRequired: boolean;
  competenceRequired: boolean;
  toolingRequired: boolean;
  multiplePeopleRequired: boolean;
  requiredCompetenceText: string | null;
  requiredToolingText: string | null;
  requiredPeopleCount: number | null;
  expiresAt: string | null;
  weightedScore: string;
  closenessScore: string;
  easeOfSetupScore: string;
  expirationScore: string;
  queryLatitude: string;
  queryLongitude: string;
};

type PublicNeedsQueryData = {
  searchNeeds: {
    nodes: NeedNode[];
  };
};

type ClaimOverviewNode = {
  id: string;
  needId: string;
  claimerAccountId: string;
  message: string | null;
  status: string;
  createdAt: string;
  updatedAt: string;
  settledAt: string | null;
  needByNeedId: {
    id: string;
    title: string;
    creatorAccountId: string;
  };
  accountByClaimerAccountId: {
    id: string;
    displayName: string | null;
    externalSubject: string;
  } | null;
};

type ViewerClaimOverviewData = {
  sentNeedClaims: {
    nodes: ClaimOverviewNode[];
  };
  receivedNeedClaims: {
    nodes: ClaimOverviewNode[];
  };
};

type ToggleFilterKey = Exclude<keyof NeedSearchFilters, "searchText">;

function formatDate(value: string | null, fallback: string) {
  if (!value) {
    return fallback;
  }

  return new Date(value).toLocaleString();
}

function buildNeedTags(need: NeedNode, t: (key: string, options?: Record<string, unknown>) => string) {
  const tags = [getDisplayIntensityLabel(need.intensity as Parameters<typeof getDisplayIntensityLabel>[0], t)];

  if (need.objectRequired) {
    tags.push(t("needTags.objectRequired"));
  }

  if (need.toolingRequired) {
    tags.push(t("needTags.toolingRequired"));
  }

  if (need.competenceRequired) {
    tags.push(t("needTags.competenceRequired"));
  }

  if (need.multiplePeopleRequired) {
    tags.push(
      need.requiredPeopleCount
        ? t("needTags.multiplePeopleCount", { count: need.requiredPeopleCount })
        : t("needTags.multiplePeople")
    );
  }

  return tags;
}

function filterVariant(value: TriStateFilter) {
  return value === "neutral" ? "outlined" : "contained";
}

function formatClaimStatus(status: string) {
  return status.replaceAll("_", " ").toLowerCase();
}

export default function PublicNeedsPage() {
  const router = useRouter();
  const { session, status } = useAuth();
  const { t } = useTranslation("needs");
  const [filters, setFilters] = useState(DEFAULT_NEED_SEARCH_FILTERS);
  const [browserLocation, setBrowserLocation] = useState<NeedSearchLocation | undefined>(undefined);
  const [locationStatus, setLocationStatus] = useState(
    "browse.locationFallbackStatus"
  );

  useEffect(() => {
    let active = true;

    void getBrowserLocation().then(location => {
      if (!active || !location) {
        return;
      }

      setBrowserLocation(location);
      setLocationStatus("browse.locationBrowserStatus");
    });

    return () => {
      active = false;
    };
  }, []);

  const variables = useMemo<NeedSearchQueryVariables>(
    () => buildNeedSearchVariables({ filters, location: browserLocation }),
    [browserLocation, filters]
  );

  const { data, loading, error } = useQuery<PublicNeedsQueryData, NeedSearchQueryVariables>(
    PUBLIC_NEEDS_QUERY,
    {
      variables
    }
  );
  const {
    data: claimOverviewData,
    refetch: refetchClaimOverview
  } = useQuery<ViewerClaimOverviewData>(VIEWER_CLAIM_OVERVIEW_QUERY, {
    skip: !session.authenticated,
    pollInterval: session.authenticated ? 15000 : 0,
    variables: { viewerId: session.account?.id ?? "" }
  });

  const needs = data?.searchNeeds.nodes ?? [];
  const sentClaims = claimOverviewData?.sentNeedClaims.nodes ?? [];
  const receivedClaims = claimOverviewData?.receivedNeedClaims.nodes ?? [];
  const myClaimsByNeedId = new Map(
    sentClaims.map(claim => [claim.needId, claim] as const)
  );
  const incomingClaimCountsByNeedId = new Map<string, number>();

  receivedClaims
    .filter(claim => claim.needByNeedId.creatorAccountId === session.account?.id)
    .forEach(claim => {
      incomingClaimCountsByNeedId.set(
        claim.needId,
        (incomingClaimCountsByNeedId.get(claim.needId) ?? 0) + 1
      );
    });

  const errorMessage = getUserFacingGraphQLErrorMessage(error);

  const toggleFilter = (key: ToggleFilterKey) => {
    setFilters(current => ({
      ...current,
      [key]: cycleTriStateFilter(current[key])
    }));
  };

  const handleClaimed = (_claimId: string) => {
    void refetchClaimOverview();
  };

  return (
    <Container maxWidth="md">
      <Box sx={{ py: 6 }}>
        <Stack
          direction={{ xs: "column", sm: "row" }}
          justifyContent="space-between"
          spacing={2}
          sx={{ mb: 3 }}
        >
          <Box>
            <Typography component="h1" gutterBottom variant="h4">
              {t("browse.title")}
            </Typography>
          </Box>

          <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
            {!session.authenticated &&(
              <Button component={NextLink} href="/login?next=%2Fneeds" variant="contained">
                {t("browse.signInButton")}
              </Button>
            )}
          </Stack>
        </Stack>

        {status === "loading" && (
          <Alert severity="info" sx={{ mb: 2 }}>
            {t("authGuard.checking", { ns: "common" })}
          </Alert>
        )}

        <Alert severity="info" sx={{ mb: 3 }}>
          {t(locationStatus)}
        </Alert>

        <Card sx={{ mb: 3 }} variant="outlined">
          <CardContent>
            <Stack spacing={2}>
              <TextField
                fullWidth
              label={t("browse.searchLabel")}
              placeholder={t("browse.searchPlaceholder")}
                value={filters.searchText}
                onChange={event => {
                  setFilters(current => ({
                    ...current,
                    searchText: event.target.value
                  }));
                }}
              />

              <Stack direction={{ xs: "column", sm: "row" }} flexWrap="wrap" gap={1}>
                <Button onClick={() => toggleFilter("objectRequired")} size="small" variant={filterVariant(filters.objectRequired)}>
                  {t("filters.objectRequired")}: {t(`triState.${filters.objectRequired}`)}
                </Button>
                <Button onClick={() => toggleFilter("toolingRequired")} size="small" variant={filterVariant(filters.toolingRequired)}>
                  {t("filters.toolingRequired")}: {t(`triState.${filters.toolingRequired}`)}
                </Button>
                <Button onClick={() => toggleFilter("competenceRequired")} size="small" variant={filterVariant(filters.competenceRequired)}>
                  {t("filters.competenceRequired")}: {t(`triState.${filters.competenceRequired}`)}
                </Button>
                <Button onClick={() => toggleFilter("multiplePeopleRequired")} size="small" variant={filterVariant(filters.multiplePeopleRequired)}>
                  {t("filters.multiplePeopleRequired")}: {t(`triState.${filters.multiplePeopleRequired}`)}
                </Button>
              </Stack>
            </Stack>
          </CardContent>
        </Card>

        {loading ? <Alert severity="info">{t("browse.loading")}</Alert> : null}
        {errorMessage ? <Alert severity="error">{errorMessage}</Alert> : null}

        {!loading && !errorMessage && needs.length === 0 ? (
          <Alert severity="warning">{t("browse.empty")}</Alert>
        ) : null}

        <Box
          sx={{
            display: "grid",
            gap: 2,
            gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
            mt: 3
          }}
        >
          {needs.map(need => {
            const ownClaim = myClaimsByNeedId.get(need.id);
            const isCreator = session.account?.id === need.creatorAccountId;
            const incomingClaimCount = incomingClaimCountsByNeedId.get(need.id) ?? 0;

            return (
              <NeedCard
                actions={
                  <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
                    {session.authenticated ? (
                      isCreator ? (
                        <Button
                          component={NextLink}
                          disabled={incomingClaimCount === 0}
                          href="/claims"
                          variant="outlined"
                        >
                          {incomingClaimCount > 0 ? t("browse.manageIncomingClaims") : t("browse.noClaimsYet")}
                        </Button>
                      ) : (
                        <NeedClaimDialog
                          existingClaim={ownClaim}
                          needId={need.id}
                          needTitle={need.title}
                          onClaimed={handleClaimed}
                        />
                      )
                    ) : (
                      <Button component={NextLink} href="/login?next=%2Fneeds" variant="outlined">
                        {t("browse.signInToClaim")}
                      </Button>
                    )}
                    <Button component={NextLink} href={`/needs/${need.id}`} variant="outlined">
                      {t("browse.viewDetails")}
                    </Button>
                  </Stack>
                }
                chips={
                  <>
                    {buildNeedTags(need, t).filter(tag => tag.trim().length > 0).map(tag => (
                      <Chip key={`${need.id}-${tag}`} label={tag} size="small" variant="outlined" />
                    ))}
                    {need.proposedTopesAmount ? (
                      <Chip label={t("browse.topesProposed", { amount: need.proposedTopesAmount })} size="small" color="primary" />
                    ) : null}
                    {isCreator ? <Chip label={t("browse.yourNeedChip")} size="small" color="secondary" /> : null}
                    {ownClaim ? (
                      <Chip label={t("browse.yourClaim", { status: formatClaimStatus(ownClaim.status) })} size="small" color="success" />
                    ) : null}
                    {isCreator && incomingClaimCount > 0 ? (
                      <Chip label={t("browse.incomingClaims", { count: incomingClaimCount })} size="small" color="warning" />
                    ) : null}
                  </>
                }
                creatorName={need.creatorDisplayName}
                description={need.description}
                expiresAt={need.expiresAt}
                footer={
                  <Stack spacing={1}>
                    {(need.requiredToolingText || need.requiredCompetenceText) ? (
                      <Box>
                        {need.requiredToolingText ? (
                          <Typography variant="body2">{t("browse.tooling")}: {need.requiredToolingText}</Typography>
                        ) : null}
                        {need.requiredCompetenceText ? (
                          <Typography variant="body2">{t("browse.competence")}: {need.requiredCompetenceText}</Typography>
                        ) : null}
                      </Box>
                    ) : null}

                    <Typography color="text.secondary" variant="caption">
                      {need.location} • {t("browse.expires")}: {formatDate(need.expiresAt, t("browse.noExpirySet"))}
                    </Typography>
                  </Stack>
                }
                key={need.id}
                onClick={() => {
                  void router.push(`/needs/${need.id}`);
                }}
                onCreatorClick={() => {
                  void router.push(`/accounts/${need.creatorAccountId}`);
                }}
                title={need.title}
              />
            );})}
        </Box>
      </Box>
    </Container>
  );
}
