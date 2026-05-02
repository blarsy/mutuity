import { useEffect, useMemo, useState } from "react";
import NextLink from "next/link";
import { useRouter } from "next/router";
import { useQuery } from "@apollo/client/react";
import { Alert, Box, Button, Card, CardContent, Chip, Container, Stack, TextField, Typography } from "@mui/material";
import { useTranslation } from "react-i18next";

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
import { getDisplayIntensityLabel } from "../shared/displayIntensity";
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

function formatDate(value: string | null, noDateLabel: string) {
  if (!value) {
    return noDateLabel;
  }

  return new Date(value).toLocaleString();
}

function filterVariant(value: TriStateFilter) {
  return value === "neutral" ? "outlined" : "contained";
}

function buildResourceTags(resource: PublicResourceCard, t: (key: string) => string) {
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

export default function PublicResourcesPage() {
  const router = useRouter();
  const { session, status } = useAuth();
  const { t, i18n } = useTranslation("resources");
  const publishResourceHref = session.authenticated
    ? "/resources/create"
    : "/login?next=%2Fresources%2Fcreate";
  const [filters, setFilters] = useState(DEFAULT_RESOURCE_SEARCH_FILTERS);
  const [browserLocation, setBrowserLocation] = useState<ReturnType<typeof getBrowserLocation> extends Promise<infer T> ? T : never>();
  const [locationStatusKey, setLocationStatusKey] = useState("browse.locationFallbackStatus");

  useEffect(() => {
    let active = true;

    void getBrowserLocation().then(location => {
      if (!active || !location) {
        return;
      }

      setBrowserLocation(location);
      setLocationStatusKey("browse.locationBrowserStatus");
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
              {t("browse.title")}
            </Typography>
            <Typography color="text.secondary">
              {t("browse.subtitle")}
            </Typography>
          </Box>

          <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
            <Button component={NextLink} href={publishResourceHref} variant="contained">
              {t("browse.addButton")}
            </Button>
            {!session.authenticated &&
              <Button component={NextLink} href="/login?next=%2Fresources" variant="contained">
                {t("browse.signInButton")}
              </Button>
            }
          </Stack>
        </Stack>

        {status === "loading" && (
          <Alert severity="info" sx={{ mb: 2 }}>
            {t("authGuard.checking", { ns: "common" })}
          </Alert>
        )}

        <Alert severity="info" sx={{ mb: 2 }}>
          {t("browse.sortDescription")}
        </Alert>

        <Alert severity="info" sx={{ mb: 3 }}>
          {t(locationStatusKey)}
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

              <Box>
                <Typography gutterBottom variant="subtitle2">
                  {t("browse.categoriesLabel")}
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
                        {isFrench ? category.labelFr : category.label}
                      </Button>
                    );
                  })}
                </Stack>
              </Box>

              <Stack direction={{ xs: "column", sm: "row" }} flexWrap="wrap" gap={1}>
                <Button onClick={() => toggleFilter("isProduct")} size="small" variant={filterVariant(filters.isProduct)}>
                  {t("filters.isProduct")}: {t(`triState.${describeTriStateFilter(filters.isProduct)}`)}
                </Button>
                <Button onClick={() => toggleFilter("isService")} size="small" variant={filterVariant(filters.isService)}>
                  {t("filters.isService")}: {t(`triState.${describeTriStateFilter(filters.isService)}`)}
                </Button>
                <Button onClick={() => toggleFilter("canBeGiven")} size="small" variant={filterVariant(filters.canBeGiven)}>
                  {t("filters.canBeGiven")}: {t(`triState.${describeTriStateFilter(filters.canBeGiven)}`)}
                </Button>
                <Button onClick={() => toggleFilter("canBeExchanged")} size="small" variant={filterVariant(filters.canBeExchanged)}>
                  {t("filters.canBeExchanged")}: {t(`triState.${describeTriStateFilter(filters.canBeExchanged)}`)}
                </Button>
                <Button onClick={() => toggleFilter("canBeTakenAway")} size="small" variant={filterVariant(filters.canBeTakenAway)}>
                  {t("filters.canBeTakenAway")}: {t(`triState.${describeTriStateFilter(filters.canBeTakenAway)}`)}
                </Button>
                <Button onClick={() => toggleFilter("canBeDelivered")} size="small" variant={filterVariant(filters.canBeDelivered)}>
                  {t("filters.canBeDelivered")}: {t(`triState.${describeTriStateFilter(filters.canBeDelivered)}`)}
                </Button>
              </Stack>
            </Stack>
          </CardContent>
        </Card>

        {loading ? (
          <Alert severity="info">{t("browse.loading")}</Alert>
        ) : resources.length === 0 ? (
          <Alert severity="warning">{t("browse.empty")}</Alert>
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
                        {isCreator ? t("card.reviewResponses") : t("card.viewDetails")}
                      </Button>
                      {!session.authenticated ? (
                        <Button component={NextLink} href={`/login?next=%2Fresources%2F${resource.id}`} variant="contained">
                          {t("card.signInToRespond")}
                        </Button>
                      ) : null}
                    </Stack>
                  }
                  chips={
                    <>
                      <Chip label={t("card.distanceKm", { value: Number(resource.distanceKm).toFixed(1) })} size="small" />
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
                      {isCreator ? <Chip color="secondary" label={t("card.yourResource")} size="small" /> : null}
                    </>
                  }
                  creatorName={resource.creatorDisplayName}
                  description={resource.description}
                  expiresAt={resource.expiresAt}
                  imageUrl={resource.imageUrls?.[0] ?? null}
                  footer={
                    <Typography color="text.secondary" variant="body2">
                      {t("card.suggestedTokenAmount")}: {resource.defaultTokenAmount ?? t("card.notSet")} • {t("card.expires")}: {formatDate(resource.expiresAt, t("card.permanent"))}
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
