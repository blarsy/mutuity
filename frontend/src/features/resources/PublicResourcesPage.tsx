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
  Checkbox,
  Chip,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  Slider,
  Stack,
  TextField,
  Typography
} from "@mui/material";
import { useTranslation } from "react-i18next";

import { useAuth } from "../auth/AuthProvider";
import { getUserFacingGraphQLErrorMessage } from "../../services/graphql/errorMessages";
import { CategoriesPicker } from "../../components/CategoriesPicker";
import { LocationPicker, type LocationValue } from "../../components/LocationPicker";
import { APIProvider } from "@vis.gl/react-google-maps";
import { useApiIsLoaded } from "@vis.gl/react-google-maps";
import { TOURNAI_CITY_CENTRE, TOURNAI_CENTRE_ADDRESS, getBrowserLocation } from "../needs/locationFallback";
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
  type ResourceSearchLocation,
  type TriStateFilter
} from "./types";
import { getDisplayIntensityLabel } from "../shared/displayIntensity";
import { ResourceCard } from "../ui/ResourceCard";
import { listingCardGridSx } from "../ui/listingCardGrid";
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

type ToggleFilterKey = Exclude<
  keyof ResourceSearchFilters,
  "searchText" | "categoryCodes" | "favorLocalResources" | "maxDistanceKm"
>;

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

  return tags.filter((tag): tag is string => Boolean(tag && tag.trim()));
}

const GOOGLE_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? "";

export default function PublicResourcesPage() {
  const router = useRouter();
  const { session, status } = useAuth();
  const { t, i18n } = useTranslation("resources");
  const [filters, setFilters] = useState(DEFAULT_RESOURCE_SEARCH_FILTERS);
  const [browserLocation, setBrowserLocation] = useState<ResourceSearchLocation | undefined>(undefined);
  const [explicitLocation, setExplicitLocation] = useState<ResourceSearchLocation | undefined>(undefined);
  const [explicitLocationAddress, setExplicitLocationAddress] = useState("");
  const [resolvedLocationLabel, setResolvedLocationLabel] = useState("");
  const [locationDialogOpen, setLocationDialogOpen] = useState(false);
  const [locationDraft, setLocationDraft] = useState<LocationValue>({
    address: "",
    latitude: TOURNAI_CITY_CENTRE.latitude,
    longitude: TOURNAI_CITY_CENTRE.longitude
  });
  const isGoogleMapsApiLoaded = useApiIsLoaded();

  useEffect(() => {
    let active = true;

    void getBrowserLocation().then(location => {
      if (!active || !location) {
        return;
      }

      setBrowserLocation(location);
    });

    return () => {
      active = false;
    };
  }, []);

  // Resolve a human-readable label for the current active reference location.
  const activeLocation = explicitLocation ?? browserLocation ?? TOURNAI_CITY_CENTRE;
  const locationStatusKey = explicitLocation
    ? "browse.locationExplicitStatus"
    : (browserLocation ? "browse.locationBrowserStatus" : "browse.locationFallbackStatus");

  useEffect(() => {
    if (explicitLocationAddress.trim().length > 0) {
      setResolvedLocationLabel(explicitLocationAddress);
      return;
    }

    const lat = activeLocation?.latitude ?? TOURNAI_CITY_CENTRE.latitude;
    const lng = activeLocation?.longitude ?? TOURNAI_CITY_CENTRE.longitude;
    const coordLabel = `Lat: ${lat.toFixed(5)}; Lng ${lng.toFixed(5)}`;

    // Check if this is the Tournai fallback location
    const isTournaiCenter = Math.abs(lat - TOURNAI_CITY_CENTRE.latitude) < 0.0001 && Math.abs(lng - TOURNAI_CITY_CENTRE.longitude) < 0.0001;
    if (isTournaiCenter) {
      setResolvedLocationLabel(TOURNAI_CENTRE_ADDRESS);
      return;
    }

    // If API is not ready, show coordinate fallback
    if (!isGoogleMapsApiLoaded || typeof window === "undefined" || !window.google?.maps?.Geocoder) {
      setResolvedLocationLabel(coordLabel);
      return;
    }

    // Attempt reverse geocoding with proper status checking
    let cancelled = false;
    const geocoder = new window.google.maps.Geocoder();
    geocoder.geocode({ location: { lat, lng } }, (results, status) => {
      if (cancelled) return;
      if (status === window.google.maps.GeocoderStatus.OK && results?.length && results[0].formatted_address) {
        setResolvedLocationLabel(results[0].formatted_address);
      } else {
        setResolvedLocationLabel(coordLabel);
      }
    });

    return () => { cancelled = true; };
  }, [explicitLocationAddress, activeLocation?.latitude, activeLocation?.longitude, isGoogleMapsApiLoaded]);

  const referenceLocationLabel = resolvedLocationLabel;

  const variables = useMemo<ResourceSearchQueryVariables>(
    () => buildResourceSearchVariables({ filters, location: activeLocation }),
    [activeLocation, filters]
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

  const openLocationDialog = () => {
    setLocationDraft({
      address: explicitLocationAddress,
      latitude: explicitLocation?.latitude ?? browserLocation?.latitude ?? TOURNAI_CITY_CENTRE.latitude,
      longitude: explicitLocation?.longitude ?? browserLocation?.longitude ?? TOURNAI_CITY_CENTRE.longitude
    });
    setLocationDialogOpen(true);
  };

  return (
    <APIProvider apiKey={GOOGLE_API_KEY}>
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
                <CategoriesPicker
                  options={categoryOptions}
                  selected={filters.categoryCodes}
                  localizedLabel={(opt) => isFrench ? opt.labelFr : opt.label}
                  onChange={(codes) => {
                    setFilters(current => ({
                      ...current,
                      categoryCodes: codes
                    }));
                  }}
                />
              </Box>

              <Box>
                <Typography gutterBottom variant="subtitle2">
                  {t("browse.filtersLabel")}
                </Typography>
                <Stack direction={{ xs: "column", sm: "row" }} flexWrap="wrap" gap={1}>
                  <Button color="primary" onClick={() => toggleFilter("isProduct")} size="small" variant={filterVariant(filters.isProduct)}>
                    {t("filters.isProduct")}: {t(`triState.${describeTriStateFilter(filters.isProduct)}`)}
                  </Button>
                  <Button color="primary" onClick={() => toggleFilter("isService")} size="small" variant={filterVariant(filters.isService)}>
                    {t("filters.isService")}: {t(`triState.${describeTriStateFilter(filters.isService)}`)}
                  </Button>
                  <Button color="primary" onClick={() => toggleFilter("canBeGiven")} size="small" variant={filterVariant(filters.canBeGiven)}>
                    {t("filters.canBeGiven")}: {t(`triState.${describeTriStateFilter(filters.canBeGiven)}`)}
                  </Button>
                  <Button color="primary" onClick={() => toggleFilter("canBeExchanged")} size="small" variant={filterVariant(filters.canBeExchanged)}>
                    {t("filters.canBeExchanged")}: {t(`triState.${describeTriStateFilter(filters.canBeExchanged)}`)}
                  </Button>
                  <Button color="primary" onClick={() => toggleFilter("canBeTakenAway")} size="small" variant={filterVariant(filters.canBeTakenAway)}>
                    {t("filters.canBeTakenAway")}: {t(`triState.${describeTriStateFilter(filters.canBeTakenAway)}`)}
                  </Button>
                  <Button color="primary" onClick={() => toggleFilter("canBeDelivered")} size="small" variant={filterVariant(filters.canBeDelivered)}>
                    {t("filters.canBeDelivered")}: {t(`triState.${describeTriStateFilter(filters.canBeDelivered)}`)}
                  </Button>
                </Stack>
              </Box>

              <Box>
                <Typography gutterBottom variant="subtitle2">
                  {t("browse.proximityLabel")}
                </Typography>
                <Stack spacing={1}>
                  <Stack direction={{ xs: "column", sm: "row" }} alignItems="flex-start" justifyContent="space-between" spacing={1}>
                    <Typography color="text.secondary" sx={{ flex: 1 }} variant="body2">
                      {t("browse.referenceLocationLabel")}: {referenceLocationLabel}
                    </Typography>
                    <Button onClick={openLocationDialog} size="small" sx={{ flexShrink: 0 }} variant="outlined">
                      {t("browse.setReferenceLocation")}
                    </Button>
                  </Stack>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={filters.favorLocalResources}
                        onChange={(_event, checked) => {
                          setFilters(current => ({
                            ...current,
                            favorLocalResources: checked
                          }));
                        }}
                      />
                    }
                    label={t("browse.favorLocalResources")}
                  />
                  <Box sx={{ px: 1 }}>
                    <Typography color="text.secondary" variant="body2">
                      {t("browse.maxDistanceValue", { value: filters.maxDistanceKm })}
                    </Typography>
                    <Slider
                      min={1}
                      max={50}
                      step={1}
                      value={filters.maxDistanceKm}
                      valueLabelDisplay="auto"
                      onChange={(_event, value) => {
                        setFilters(current => ({
                          ...current,
                          maxDistanceKm: Array.isArray(value) ? value[0] : value
                        }));
                      }}
                    />
                  </Box>
                </Stack>
              </Box>
            </Stack>
          </CardContent>
        </Card>

        <Dialog fullWidth maxWidth="sm" onClose={() => setLocationDialogOpen(false)} open={locationDialogOpen}>
          <DialogTitle>{t("browse.referenceLocationDialogTitle")}</DialogTitle>
          <DialogContent>
            <LocationPicker
              addressLabel={t("browse.referenceLocationInputLabel")}
              onChange={setLocationDraft}
              required
              value={locationDraft}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setLocationDialogOpen(false)}>{t("actions.cancel", { ns: "common" })}</Button>
            <Button
              onClick={() => {
                setExplicitLocation({
                  latitude: locationDraft.latitude,
                  longitude: locationDraft.longitude,
                  source: "explicit"
                });
                setExplicitLocationAddress(locationDraft.address);
                setLocationDialogOpen(false);
              }}
              variant="contained"
            >
              {t("actions.save", { ns: "common" })}
            </Button>
          </DialogActions>
        </Dialog>

        {loading ? (
          <Alert severity="info">{t("browse.loading")}</Alert>
        ) : resources.length === 0 ? (
          <Alert severity="warning">{t("browse.empty")}</Alert>
        ) : (
          <Box sx={listingCardGridSx}>
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
                      {resource.categoryLabels.filter((label): label is string => Boolean(label && label.trim())).map(label => (
                        <Chip
                          key={`${resource.id}-category-${label}`}
                          color="primary"
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
                  imageUrls={resource.imageUrls ?? []}
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
    </APIProvider>
  );
}
