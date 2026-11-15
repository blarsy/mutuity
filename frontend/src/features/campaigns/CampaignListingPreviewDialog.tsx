import { gql } from "@apollo/client";
import { useQuery } from "@apollo/client/react";
import CloseIcon from "@mui/icons-material/Close";
import { Alert, Avatar, Box, Chip, CircularProgress, Dialog, DialogContent, DialogTitle, IconButton, Stack, Typography } from "@mui/material";
import { APIProvider, Map as GoogleMap, Marker } from "@vis.gl/react-google-maps";
import { useTranslation } from "react-i18next";
import { RichTextContent } from "../../components/richText/RichTextContent";
import { ZoomableImage } from "../../components/ZoomableImage";
import { IntensityDisplay } from "../../components/IntensityPicker";
import { getUserFacingGraphQLErrorMessage } from "../../services/graphql/errorMessages";
import { formatPublicDateTime } from "../shared/publicDateTime";

export const CAMPAIGN_LISTING_PREVIEW_QUERY = gql`
  query CampaignListingPreview($id: UUID!, $resource: Boolean!, $need: Boolean!) {
    resourceById(id: $id) @include(if: $resource) {
      id title description location latitude longitude intensity defaultTokenAmount imageUrls categoryLabels
      isProduct isService canBeGiven canBeExchanged canBeTakenAway canBeDelivered expiresAt createdAt isActive
      accountByCreatorAccountId { displayName avatarUrl }
    }
    needById(id: $id) @include(if: $need) {
      id title description location latitude longitude intensity proposedTopesAmount imageUrls
      objectRequired competenceRequired toolingRequired multiplePeopleRequired
      requiredCompetenceText requiredToolingText requiredPeopleCount expiresAt createdAt isActive
      accountByCreatorAccountId { displayName avatarUrl }
    }
  }
`;

type Listing = {
  id: string; title: string; description: string | null; location: string | null;
  latitude: string | number | null; longitude: string | number | null;
  intensity: string; imageUrls: Array<string | null> | null; expiresAt: string | null; createdAt: string; isActive: boolean;
  accountByCreatorAccountId: { displayName: string | null; avatarUrl: string | null } | null;
  defaultTokenAmount?: number | null; proposedTopesAmount?: number | null; categoryLabels?: Array<string | null> | null;
  isProduct?: boolean; isService?: boolean; canBeGiven?: boolean; canBeExchanged?: boolean;
  canBeTakenAway?: boolean; canBeDelivered?: boolean; objectRequired?: boolean; competenceRequired?: boolean;
  toolingRequired?: boolean; multiplePeopleRequired?: boolean; requiredCompetenceText?: string | null;
  requiredToolingText?: string | null; requiredPeopleCount?: number | null;
};

export function CampaignListingPreviewDialog({ listing, onClose }: {
  listing: { kind: "resource" | "need"; id: string } | null;
  onClose: () => void;
}) {
  const { t, i18n } = useTranslation(["campaigns", "resources", "needs", "common"]);
  const { data, loading, error } = useQuery<{ resourceById?: Listing | null; needById?: Listing | null }>(CAMPAIGN_LISTING_PREVIEW_QUERY, {
    skip: !listing,
    variables: { id: listing?.id ?? "", resource: listing?.kind === "resource", need: listing?.kind === "need" },
    fetchPolicy: "network-only"
  });
  const value = listing?.kind === "resource" ? data?.resourceById : data?.needById;
  const ns = listing?.kind === "resource" ? "resources" : "needs";
  const label = (key: string) => t(key, { ns });
  const flags = value ? (listing?.kind === "resource" ? [
    value.isProduct && label("form.isProduct"), value.isService && label("form.isService"),
    value.canBeGiven && label("form.canBeGiven"), value.canBeExchanged && label("form.canBeExchanged"),
    value.canBeTakenAway && label("form.canBeTakenAway"), value.canBeDelivered && label("form.canBeDelivered")
  ] : [
    value.objectRequired && label("form.objectRequired"), value.competenceRequired && label("form.competenceRequired"),
    value.toolingRequired && label("form.toolingRequired"), value.multiplePeopleRequired && label("form.multiplePeopleRequired")
  ]).filter((flag): flag is string => typeof flag === "string") : [];
  const latitude = Number(value?.latitude);
  const longitude = Number(value?.longitude);
  const mapsKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? "";
  const hasCoordinates = value?.latitude != null && value.longitude != null && Number.isFinite(latitude) && Number.isFinite(longitude);
  const errorMessage = getUserFacingGraphQLErrorMessage(error);
  return (
    <Dialog open={Boolean(listing)} onClose={onClose} fullWidth maxWidth="md" aria-labelledby="campaign-listing-preview-title">
      <DialogTitle id="campaign-listing-preview-title" sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 2 }}>
        {value?.title ?? t("moderationListings.publicInfo")}
        <IconButton aria-label={t("actions.close", { ns: "common", defaultValue: "Close" })} onClick={onClose}><CloseIcon /></IconButton>
      </DialogTitle>
      <DialogContent dividers>
        {loading ? <Box role="status" sx={{ p: 3, textAlign: "center" }}><CircularProgress aria-label={label("detail.loading")} /></Box> : null}
        {errorMessage ? <Alert severity="error">{errorMessage}</Alert> : null}
        {!loading && !errorMessage && !value ? <Alert severity="info">{t("moderationListings.unavailable")}</Alert> : null}
        {!loading && !errorMessage && value ? (
          <Stack spacing={2.5}>
            <Stack direction="row" alignItems="center" spacing={1}>
              <Avatar src={value.accountByCreatorAccountId?.avatarUrl ?? undefined} />
              <Typography>{value.accountByCreatorAccountId?.displayName ?? t("moderationListings.unknownCreator")}</Typography>
            </Stack>
            {!value.isActive ? <Alert severity="info">{t("moderationListings.inactive")}</Alert> : null}
            <Stack direction="row" useFlexGap flexWrap="wrap" spacing={1}>
              {(value.imageUrls ?? []).filter((url): url is string => Boolean(url)).map((url, index) => (
                <ZoomableImage key={`${url}-${index}`} src={url} alt={`${value.title} — ${index + 1}`} sx={{ width: { xs: "100%", sm: 240 }, maxHeight: 360, objectFit: "contain", borderRadius: 1 }} />
              ))}
            </Stack>
            <RichTextContent html={value.description ?? ""} emptyFallback={label("detail.noDescription")} />
            <IntensityDisplay intensity={value.intensity} tokenAmount={value.defaultTokenAmount ?? value.proposedTopesAmount ?? null} />
            <Stack direction="row" useFlexGap flexWrap="wrap" spacing={1}>
              {flags.map(flag => <Chip key={flag} label={flag} size="small" variant="outlined" />)}
              {(value.categoryLabels ?? []).filter(Boolean).map(category => <Chip key={category} label={category} size="small" />)}
            </Stack>
            {value.requiredCompetenceText ? <Typography>{label("form.requiredCompetenceLabel")}: {value.requiredCompetenceText}</Typography> : null}
            {value.requiredToolingText ? <Typography>{label("form.requiredToolingLabel")}: {value.requiredToolingText}</Typography> : null}
            {value.requiredPeopleCount != null ? <Typography>{label("form.requiredPeopleCountLabel")}: {value.requiredPeopleCount}</Typography> : null}
            {value.location ? <Typography>{label("form.locationLabel")}: {value.location}</Typography> : null}
            {hasCoordinates && mapsKey ? (
              <Box sx={{ height: 260, overflow: "hidden", borderRadius: 1 }}>
                <APIProvider apiKey={mapsKey}>
                  <GoogleMap center={{ lat: latitude, lng: longitude }} defaultZoom={14} mapTypeControl={false} streetViewControl={false} style={{ width: "100%", height: "100%" }}>
                    <Marker position={{ lat: latitude, lng: longitude }} />
                  </GoogleMap>
                </APIProvider>
              </Box>
            ) : null}
            <Typography variant="body2" color="text.secondary">{t("moderationListings.published", { date: formatPublicDateTime(value.createdAt, i18n.language) })}</Typography>
            <Typography variant="body2" color="text.secondary">{t("moderationListings.expires", { date: value.expiresAt ? formatPublicDateTime(value.expiresAt, i18n.language) : t("moderationListings.noExpiry") })}</Typography>
          </Stack>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}