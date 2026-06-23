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
  Checkbox,
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
import { APIProvider, useApiIsLoaded } from "@vis.gl/react-google-maps";

import { useAuth } from "../auth/AuthProvider";
import { LocationPicker, type LocationValue } from "../../components/LocationPicker";
import { getUserFacingGraphQLErrorMessage } from "../../services/graphql/errorMessages";
import { getDisplayIntensityLabel } from "../shared/displayIntensity";
import { buildNeedSearchVariables, cycleTriStateFilter, describeTriStateFilter, type NeedSearchQueryVariables } from "./needFilters";
import { NeedClaimDialog } from "./NeedClaimDialog";
import { TOURNAI_CITY_CENTRE, TOURNAI_CENTRE_ADDRESS, getBrowserLocation } from "./locationFallback";
import {
  ViewerClaimOverviewDocument,
  type ViewerClaimOverviewQuery,
  type ViewerClaimOverviewQueryVariables
} from "../../graphql/generated";
import { PUBLIC_NEEDS_QUERY } from "./needs.queries";
import { NeedCard } from "../ui/NeedCard";
import { listingCardGridSx } from "../ui/listingCardGrid";
import { DEFAULT_NEED_SEARCH_FILTERS, type NeedSearchFilters, type NeedSearchLocation, type TriStateFilter } from "./types";

type NeedNode = {
  id: string;
  creatorAccountId: string;
  creatorDisplayName: string;
  title: string;
  description: string | null;
  imageUrls: string[];
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

type ClaimOverviewNode = NonNullable<ViewerClaimOverviewQuery["sentNeedClaims"]>["nodes"][number];

function hasNeedByNeedId(claim: ClaimOverviewNode): claim is ClaimOverviewNode & {
  needByNeedId: NonNullable<ClaimOverviewNode["needByNeedId"]>;
} {
  return claim.needByNeedId != null;
}

function isIncomingClaimForViewer(
  claim: ClaimOverviewNode,
  currentAccountId: string | null | undefined
): claim is ClaimOverviewNode & { needByNeedId: NonNullable<ClaimOverviewNode["needByNeedId"]> } {
  return hasNeedByNeedId(claim) && claim.needByNeedId.creatorAccountId === currentAccountId;
}

type ToggleFilterKey = Exclude<keyof NeedSearchFilters, "searchText" | "favorLocalResources" | "maxDistanceKm">;

const GOOGLE_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? "";

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
  const [explicitLocation, setExplicitLocation] = useState<NeedSearchLocation | undefined>(undefined);
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

  const activeLocation = explicitLocation ?? browserLocation ?? TOURNAI_CITY_CENTRE;

  useEffect(() => {
    if (explicitLocationAddress.trim().length > 0) {
      setResolvedLocationLabel(explicitLocationAddress);
      return;
    }

    const lat = activeLocation.latitude;
    const lng = activeLocation.longitude;
    const coordLabel = `Lat: ${lat.toFixed(5)}; Lng ${lng.toFixed(5)}`;

    const isTournaiCenter = Math.abs(lat - TOURNAI_CITY_CENTRE.latitude) < 0.0001
      && Math.abs(lng - TOURNAI_CITY_CENTRE.longitude) < 0.0001;

    if (isTournaiCenter) {
      setResolvedLocationLabel(TOURNAI_CENTRE_ADDRESS);
      return;
    }

    if (!isGoogleMapsApiLoaded || typeof window === "undefined" || !window.google?.maps?.Geocoder) {
      setResolvedLocationLabel(coordLabel);
      return;
    }

    let cancelled = false;
    const geocoder = new window.google.maps.Geocoder();
    geocoder.geocode({ location: { lat, lng } }, (results, statusValue) => {
      if (cancelled) {
        return;
      }

      if (statusValue === window.google.maps.GeocoderStatus.OK && results?.length && results[0].formatted_address) {
        setResolvedLocationLabel(results[0].formatted_address);
      } else {
        setResolvedLocationLabel(coordLabel);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [explicitLocationAddress, activeLocation.latitude, activeLocation.longitude, isGoogleMapsApiLoaded]);

  const variables = useMemo<NeedSearchQueryVariables>(
    () => buildNeedSearchVariables({ filters, location: activeLocation }),
    [activeLocation, filters]
  );

  const { data, loading, error } = useQuery<PublicNeedsQueryData, NeedSearchQueryVariables>(
    PUBLIC_NEEDS_QUERY,
    {
      fetchPolicy: "cache-and-network",
      nextFetchPolicy: "cache-first",
      variables
    }
  );
  const {
    data: claimOverviewData,
    refetch: refetchClaimOverview
  } = useQuery<ViewerClaimOverviewQuery, ViewerClaimOverviewQueryVariables>(ViewerClaimOverviewDocument, {
    skip: !session.authenticated,
    pollInterval: session.authenticated ? 15000 : 0,
    variables: { viewerId: session.account?.id ?? "" }
  });

  const needs = data?.searchNeeds.nodes ?? [];
  const sentClaims = claimOverviewData?.sentNeedClaims?.nodes ?? [];
  const receivedClaims = claimOverviewData?.receivedNeedClaims?.nodes ?? [];
  const myClaimsByNeedId = new Map(
    sentClaims.map(claim => [claim.needId, claim] as const)
  );
  const incomingClaimCountsByNeedId = new Map<string, number>();

  receivedClaims
    .filter(
      (claim): claim is ClaimOverviewNode & { needByNeedId: NonNullable<ClaimOverviewNode["needByNeedId"]> } =>
        isIncomingClaimForViewer(claim, session.account?.id)
    )
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

  const openLocationDialog = () => {
    setLocationDraft({
      address: explicitLocationAddress,
      latitude: explicitLocation?.latitude ?? browserLocation?.latitude ?? TOURNAI_CITY_CENTRE.latitude,
      longitude: explicitLocation?.longitude ?? browserLocation?.longitude ?? TOURNAI_CITY_CENTRE.longitude
    });
    setLocationDialogOpen(true);
  };

  const handleClaimed = (_claimId: string) => {
    void refetchClaimOverview();
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

              <Box>
                <Typography gutterBottom variant="subtitle2">
                  {t("browse.proximityLabel")}
                </Typography>
                <Stack spacing={1}>
                  <Stack direction={{ xs: "column", sm: "row" }} alignItems="flex-start" justifyContent="space-between" spacing={1}>
                    <Typography color="text.secondary" sx={{ flex: 1 }} variant="body2">
                      {t("browse.referenceLocationLabel")}: {resolvedLocationLabel}
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

        {loading ? <Alert severity="info">{t("browse.loading")}</Alert> : null}
        {errorMessage ? <Alert severity="error">{errorMessage}</Alert> : null}

        {!loading && !errorMessage && needs.length === 0 ? (
          <Alert severity="warning">{t("browse.empty")}</Alert>
        ) : null}

        <Box sx={{ ...listingCardGridSx, mt: 3 }}>
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
                          href="/app/claims"
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
                imageUrls={need.imageUrls}
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
    </APIProvider>
  );
}
