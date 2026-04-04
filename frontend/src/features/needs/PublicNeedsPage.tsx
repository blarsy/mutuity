import { useEffect, useMemo, useState } from "react";
import NextLink from "next/link";
import { useQuery } from "@apollo/client/react";
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
  TextField,
  Typography
} from "@mui/material";

import { useAuth } from "../auth/AuthProvider";
import { LogoutButton } from "../auth/LogoutButton";
import { getUserFacingGraphQLErrorMessage } from "../../services/graphql/errorMessages";
import { buildNeedSearchVariables, cycleTriStateFilter, describeTriStateFilter, type NeedSearchQueryVariables } from "./needFilters";
import { getBrowserLocation } from "./locationFallback";
import { PUBLIC_NEEDS_QUERY } from "./needs.queries";
import { DEFAULT_NEED_SEARCH_FILTERS, type NeedSearchFilters, type NeedSearchLocation, type TriStateFilter } from "./types";

type NeedNode = {
  id: string;
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

type ToggleFilterKey = Exclude<keyof NeedSearchFilters, "searchText">;

function formatDate(value: string | null) {
  if (!value) {
    return "No expiry set";
  }

  return new Date(value).toLocaleString();
}

function buildNeedTags(need: NeedNode) {
  const tags = [need.intensity.replaceAll("_", " ")];

  if (need.objectRequired) {
    tags.push("object required");
  }

  if (need.toolingRequired) {
    tags.push("tooling required");
  }

  if (need.competenceRequired) {
    tags.push("competence required");
  }

  if (need.multiplePeopleRequired) {
    tags.push(need.requiredPeopleCount ? `${need.requiredPeopleCount}+ people` : "multiple people");
  }

  return tags;
}

function filterVariant(value: TriStateFilter) {
  return value === "neutral" ? "outlined" : "contained";
}

export default function PublicNeedsPage() {
  const { session, status } = useAuth();
  const [filters, setFilters] = useState(DEFAULT_NEED_SEARCH_FILTERS);
  const [browserLocation, setBrowserLocation] = useState<NeedSearchLocation | undefined>(undefined);
  const [locationStatus, setLocationStatus] = useState(
    "Using account or Tournai fallback when no explicit coordinates are provided."
  );

  useEffect(() => {
    let active = true;

    void getBrowserLocation().then(location => {
      if (!active || !location) {
        return;
      }

      setBrowserLocation(location);
      setLocationStatus("Browser coordinates are available as a fallback when account coordinates are unavailable.");
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

  const needs = data?.searchNeeds.nodes ?? [];
  const errorMessage = getUserFacingGraphQLErrorMessage(error);

  const toggleFilter = (key: ToggleFilterKey) => {
    setFilters(current => ({
      ...current,
      [key]: cycleTriStateFilter(current[key])
    }));
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
              Discover active needs
            </Typography>
            <Typography color="text.secondary">
              Search by text, refine with tri-state filters, and rank results from the best available location context.
            </Typography>
          </Box>

          <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
            <Button component={NextLink} href="/" variant="outlined">
              Back home
            </Button>
            {session.authenticated ? (
              <LogoutButton color="inherit" redirectTo="/needs" variant="outlined">
                Sign out
              </LogoutButton>
            ) : (
              <Button component={NextLink} href="/login?next=%2Fneeds" variant="contained">
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
          <Alert severity="success" sx={{ mb: 2 }}>
            Signed in as {session.account?.displayName ?? session.account?.externalSubject ?? "account"}. Claiming can build on this session next.
          </Alert>
        ) : (
          <Alert severity="info" sx={{ mb: 2 }}>
            You can browse needs while signed out. Sign in will be required for claiming.
          </Alert>
        )}

        <Alert severity="info" sx={{ mb: 2 }}>
          Current ranking mixes closeness (50%), ease of setup (30%), and sooner expiry (20%).
        </Alert>

        <Alert severity="info" sx={{ mb: 3 }}>
          {locationStatus}
        </Alert>

        <Card sx={{ mb: 3 }} variant="outlined">
          <CardContent>
            <Stack spacing={2}>
              <TextField
                fullWidth
                label="Search needs"
                placeholder="Try creator name, title, tooling, or competence"
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
                  Object: {describeTriStateFilter(filters.objectRequired)}
                </Button>
                <Button onClick={() => toggleFilter("toolingRequired")} size="small" variant={filterVariant(filters.toolingRequired)}>
                  Tooling: {describeTriStateFilter(filters.toolingRequired)}
                </Button>
                <Button onClick={() => toggleFilter("competenceRequired")} size="small" variant={filterVariant(filters.competenceRequired)}>
                  Competence: {describeTriStateFilter(filters.competenceRequired)}
                </Button>
                <Button onClick={() => toggleFilter("multiplePeopleRequired")} size="small" variant={filterVariant(filters.multiplePeopleRequired)}>
                  People: {describeTriStateFilter(filters.multiplePeopleRequired)}
                </Button>
              </Stack>
            </Stack>
          </CardContent>
        </Card>

        {loading ? <Alert severity="info">Loading active needs…</Alert> : null}
        {errorMessage ? <Alert severity="error">{errorMessage}</Alert> : null}

        {!loading && !errorMessage && needs.length === 0 ? (
          <Alert severity="warning">No active needs match the current filters right now.</Alert>
        ) : null}

        <Stack spacing={2} sx={{ mt: 3 }}>
          {needs.map(need => (
            <Card key={need.id} variant="outlined">
              <CardContent>
                <Stack spacing={1.5}>
                  <Box>
                    <Typography gutterBottom variant="h6">
                      {need.title}
                    </Typography>
                    <Typography color="text.secondary" variant="body2">
                      Posted by {need.creatorDisplayName} • {need.location}
                    </Typography>
                  </Box>

                  {need.description ? <Typography>{need.description}</Typography> : null}

                  <Stack direction="row" flexWrap="wrap" gap={1}>
                    {buildNeedTags(need).map(tag => (
                      <Chip key={`${need.id}-${tag}`} label={tag} size="small" variant="outlined" />
                    ))}
                    {need.proposedTopesAmount ? (
                      <Chip label={`${need.proposedTopesAmount} Topes proposed`} size="small" color="primary" />
                    ) : null}
                  </Stack>

                  {(need.requiredToolingText || need.requiredCompetenceText) ? (
                    <Box>
                      {need.requiredToolingText ? (
                        <Typography variant="body2">Tooling: {need.requiredToolingText}</Typography>
                      ) : null}
                      {need.requiredCompetenceText ? (
                        <Typography variant="body2">Competence: {need.requiredCompetenceText}</Typography>
                      ) : null}
                    </Box>
                  ) : null}

                  <Divider />

                  <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                    <Typography variant="body2">Weighted score: {need.weightedScore}</Typography>
                    <Typography variant="body2">Closeness: {need.closenessScore}</Typography>
                    <Typography variant="body2">Ease: {need.easeOfSetupScore}</Typography>
                    <Typography variant="body2">Expiry: {need.expirationScore}</Typography>
                  </Stack>

                  <Typography color="text.secondary" variant="caption">
                    Expires: {formatDate(need.expiresAt)} • Query origin: {need.queryLatitude}, {need.queryLongitude}
                  </Typography>
                </Stack>
              </CardContent>
            </Card>
          ))}
        </Stack>
      </Box>
    </Container>
  );
}
