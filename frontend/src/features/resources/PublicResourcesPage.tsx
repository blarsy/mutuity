import { useEffect, useMemo, useState } from "react";
import NextLink from "next/link";
import { useRouter } from "next/router";
import { useQuery } from "@apollo/client/react";
import { Alert, Box, Button, Card, CardContent, Chip, Container, Stack, TextField, Typography } from "@mui/material";

import { useAuth } from "../auth/AuthProvider";
import { LogoutButton } from "../auth/LogoutButton";
import { getUserFacingGraphQLErrorMessage } from "../../services/graphql/errorMessages";
import { getBrowserLocation } from "../needs/locationFallback";
import {
  buildResourceSearchVariables,
  cycleTriStateFilter,
  describeTriStateFilter,
  type ResourceSearchQueryVariables
} from "./resourceFilters";
import {
  DEFAULT_RESOURCE_SEARCH_FILTERS,
  type PublicResourceCard,
  type ResourceCategoryOption,
  type ResourceSearchFilters,
  type TriStateFilter
} from "./types";
import { ResourceCard } from "../ui/ResourceCard";
import { PUBLIC_RESOURCES_QUERY, RESOURCE_CATEGORY_OPTIONS_QUERY } from "./resources.queries";

type PublicResourcesQueryData = {
  searchResources: {
    nodes: PublicResourceCard[];
  };
};

type ResourceCategoryOptionsQueryData = {
  allResourceCategories: {
    nodes: ResourceCategoryOption[];
  };
};

type ToggleFilterKey = Exclude<keyof ResourceSearchFilters, "searchText" | "categoryCodes">;

function formatDate(value: string | null) {
  if (!value) {
    return "Permanent";
  }

  return new Date(value).toLocaleString();
}

function filterVariant(value: TriStateFilter) {
  return value === "neutral" ? "outlined" : "contained";
}

function buildResourceTags(resource: PublicResourceCard) {
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

export default function PublicResourcesPage() {
  const router = useRouter();
  const { session, status } = useAuth();
  const publishResourceHref = session.authenticated
    ? "/resources/create"
    : "/login?next=%2Fresources%2Fcreate";
  const [filters, setFilters] = useState(DEFAULT_RESOURCE_SEARCH_FILTERS);
  const [browserLocation, setBrowserLocation] = useState<ReturnType<typeof getBrowserLocation> extends Promise<infer T> ? T : never>();
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

  const variables = useMemo<ResourceSearchQueryVariables>(
    () => buildResourceSearchVariables({ filters, location: browserLocation }),
    [browserLocation, filters]
  );

  const { data, loading, error } = useQuery<PublicResourcesQueryData, ResourceSearchQueryVariables>(
    PUBLIC_RESOURCES_QUERY,
    { variables }
  );
  const { data: categoryData, error: categoryError } = useQuery<ResourceCategoryOptionsQueryData>(
    RESOURCE_CATEGORY_OPTIONS_QUERY
  );

  const resources = data?.searchResources.nodes ?? [];
  const errorMessage = getUserFacingGraphQLErrorMessage(error);
  const categoryErrorMessage = getUserFacingGraphQLErrorMessage(categoryError);
  const categoryOptions = categoryData?.allResourceCategories.nodes ?? [];

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
              Discover active resources
            </Typography>
            <Typography color="text.secondary">
              Browse nearby offers of objects and services, then refine results with tri-state modality filters.
            </Typography>
          </Box>

          <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
            <Button component={NextLink} href="/" variant="outlined">
              Back home
            </Button>
            <Button component={NextLink} href="/needs" variant="outlined">
              Browse needs
            </Button>
            <Button component={NextLink} href={publishResourceHref} variant="contained">
              Add resource
            </Button>
            {session.authenticated ? (
              <LogoutButton color="inherit" redirectTo="/resources" variant="outlined">
                Sign out
              </LogoutButton>
            ) : (
              <Button component={NextLink} href="/login?next=%2Fresources" variant="contained">
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
            Signed in as {session.account?.displayName ?? session.account?.externalSubject ?? "account"}.
          </Alert>
        ) : (
          <Alert severity="info" sx={{ mb: 2 }}>
            You can browse resources while signed out. Sign in will be required for publishing and bidding.
          </Alert>
        )}

        <Alert severity="info" sx={{ mb: 2 }}>
          Results are sorted by geographical closeness. Equal distances are broken by newest resources first.
        </Alert>

        <Alert severity="info" sx={{ mb: 3 }}>
          {locationStatus}
        </Alert>

        {errorMessage ? (
          <Alert severity="error" sx={{ mb: 3 }}>
            {errorMessage}
          </Alert>
        ) : null}

        {categoryErrorMessage ? (
          <Alert severity="error" sx={{ mb: 3 }}>
            {categoryErrorMessage}
          </Alert>
        ) : null}

        <Card sx={{ mb: 3 }} variant="outlined">
          <CardContent>
            <Stack spacing={2}>
              <TextField
                fullWidth
                label="Search resources"
                placeholder="Try creator name, title, description, or category"
                value={filters.searchText}
                onChange={event => {
                  setFilters(current => ({
                    ...current,
                    searchText: event.target.value
                  }));
                }}
              />

              <Box>
                <Typography gutterBottom variant="subtitle2">
                  Categories
                </Typography>
                <Stack direction="row" flexWrap="wrap" gap={1}>
                  {categoryOptions.map(category => {
                    const selected = filters.categoryCodes.includes(category.code);

                    return (
                      <Button
                        key={category.code}
                        onClick={() => {
                          setFilters(current => ({
                            ...current,
                            categoryCodes: selected
                              ? current.categoryCodes.filter(code => code !== category.code)
                              : [...current.categoryCodes, category.code].sort((left, right) => left - right)
                          }));
                        }}
                        size="small"
                        variant={selected ? "contained" : "outlined"}
                      >
                        {category.label}
                      </Button>
                    );
                  })}
                </Stack>
              </Box>

              <Stack direction={{ xs: "column", sm: "row" }} flexWrap="wrap" gap={1}>
                <Button onClick={() => toggleFilter("isProduct")} size="small" variant={filterVariant(filters.isProduct)}>
                  Product: {describeTriStateFilter(filters.isProduct)}
                </Button>
                <Button onClick={() => toggleFilter("isService")} size="small" variant={filterVariant(filters.isService)}>
                  Service: {describeTriStateFilter(filters.isService)}
                </Button>
                <Button onClick={() => toggleFilter("canBeGiven")} size="small" variant={filterVariant(filters.canBeGiven)}>
                  Giveable: {describeTriStateFilter(filters.canBeGiven)}
                </Button>
                <Button onClick={() => toggleFilter("canBeExchanged")} size="small" variant={filterVariant(filters.canBeExchanged)}>
                  Exchangeable: {describeTriStateFilter(filters.canBeExchanged)}
                </Button>
                <Button onClick={() => toggleFilter("canBeTakenAway")} size="small" variant={filterVariant(filters.canBeTakenAway)}>
                  Pickup: {describeTriStateFilter(filters.canBeTakenAway)}
                </Button>
                <Button onClick={() => toggleFilter("canBeDelivered")} size="small" variant={filterVariant(filters.canBeDelivered)}>
                  Delivery: {describeTriStateFilter(filters.canBeDelivered)}
                </Button>
              </Stack>
            </Stack>
          </CardContent>
        </Card>

        {loading ? (
          <Alert severity="info">Loading nearby resources…</Alert>
        ) : resources.length === 0 ? (
          <Alert severity="warning">No resources match the current filters yet.</Alert>
        ) : (
          <Box
            sx={{
              display: "grid",
              gap: 2,
              gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))"
            }}
          >
            {resources.map(resource => {
              const isCreator = session.account?.id === resource.creatorAccountId;

              return (
                <ResourceCard
                  actions={
                    <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
                      <Button component={NextLink} href={`/resources/${resource.id}`} variant="outlined">
                        {isCreator ? "Review responses" : "View details"}
                      </Button>
                      {!session.authenticated ? (
                        <Button component={NextLink} href={`/login?next=%2Fresources%2F${resource.id}`} variant="contained">
                          Sign in to respond
                        </Button>
                      ) : null}
                    </Stack>
                  }
                  chips={
                    <>
                      <Chip label={`${Number(resource.distanceKm).toFixed(1)} km away`} size="small" />
                      {buildResourceTags(resource).map(tag => (
                        <Chip key={`${resource.id}-${tag}`} label={tag} size="small" variant="outlined" />
                      ))}
                      {resource.categoryLabels.map(label => (
                        <Chip key={`${resource.id}-category-${label}`} color="secondary" label={label} size="small" variant="outlined" />
                      ))}
                      {isCreator ? <Chip color="secondary" label="your resource" size="small" /> : null}
                    </>
                  }
                  creatorName={resource.creatorDisplayName}
                  description={resource.description}
                  expiresAt={resource.expiresAt}
                  footer={
                    <Typography color="text.secondary" variant="body2">
                      Suggested token amount: {resource.defaultTokenAmount ?? "not set"} • Expires: {formatDate(resource.expiresAt)}
                    </Typography>
                  }
                  key={resource.id}
                  location={resource.location}
                  onClick={() => {
                    void router.push(`/resources/${resource.id}`);
                  }}
                  onCreatorClick={() => {
                    void router.push(`/accounts/${resource.creatorAccountId}`);
                  }}
                  title={resource.title}
                />
              );
            })}
          </Box>
        )}
      </Box>
    </Container>
  );
}
