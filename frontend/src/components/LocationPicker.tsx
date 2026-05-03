/**
 * LocationPicker — address autocomplete (Google Places) + interactive map.
 *
 * Requires NEXT_PUBLIC_GOOGLE_MAPS_API_KEY in the environment.
 *
 * Props expose { address, latitude, longitude } separately so Formik fields
 * can be updated individually.
 */
import {
  Autocomplete,
  Box,
  CircularProgress,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { APIProvider, Map, Marker, useMapsLibrary, useMarkerRef } from "@vis.gl/react-google-maps";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

export interface LocationValue {
  address: string;
  latitude: number;
  longitude: number;
}

interface LocationPickerProps {
  value: LocationValue;
  onChange: (value: LocationValue) => void;
  onBlur?: () => void;
  addressLabel?: string;
  addressError?: boolean;
  addressHelperText?: string;
  coordinatesError?: boolean;
  coordinatesHelperText?: string;
  required?: boolean;
}

const API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? "";

// ── address autocomplete input ───────────────────────────────────────────────

interface AddressAutocompleteProps {
  value: string;
  label: string;
  error?: boolean;
  helperText?: string;
  required?: boolean;
  onBlur?: () => void;
  onLocationResolved: (loc: LocationValue) => void;
}

function AddressAutocomplete({
  value,
  label,
  error,
  helperText,
  required,
  onBlur,
  onLocationResolved,
}: AddressAutocompleteProps) {
  const { t } = useTranslation("common");
  const placesLibrary = useMapsLibrary("places");
  const [inputValue, setInputValue] = useState(value);
  const [suggestions, setSuggestions] = useState<
    google.maps.places.PlacePrediction[]
  >([]);
  const [ready, setReady] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    setInputValue(value);
  }, [value]);

  useEffect(() => {
    if (!API_KEY) {
      setLoadError(t("locationPicker.loadError"));
      setReady(false);
      return;
    }

    if (!placesLibrary) {
      return;
    }

    setLoadError(null);
    setReady(true);
  }, [placesLibrary, t]);

  const handleInputChange = async (text: string) => {
    setInputValue(text);
    if (!ready || !placesLibrary || text.length < 3) {
      setSuggestions([]);
      return;
    }
    try {
      const session = new google.maps.places.AutocompleteSessionToken();
      const results = await google.maps.places.AutocompleteSuggestion.fetchAutocompleteSuggestions({
        input: text,
        sessionToken: session,
      });
      setSuggestions(
        (results.suggestions ?? [])
          .map((s: { placePrediction: google.maps.places.PlacePrediction | null }) => s.placePrediction)
          .filter((p): p is google.maps.places.PlacePrediction => p !== null)
      );
    } catch {
      setSuggestions([]);
    }
  };

  const handleSelect = async (
    suggestion: google.maps.places.PlacePrediction | string | null
  ) => {
    if (!suggestion || typeof suggestion === "string") return;
    const raw = suggestion.toPlace();
    const { place } = await raw.fetchFields({
      fields: ["formattedAddress", "location"],
    });
    onLocationResolved({
      address: place.formattedAddress ?? inputValue,
      latitude: place.location?.lat() ?? 0,
      longitude: place.location?.lng() ?? 0,
    });
    setSuggestions([]);
  };

  return (
    <Autocomplete<google.maps.places.PlacePrediction, false, true, true>
      freeSolo
      disableClearable
      disabled={Boolean(loadError)}
      options={suggestions}
      getOptionLabel={(opt) => {
        if (typeof opt === "string") return opt;
        return opt.text?.text ?? "";
      }}
      inputValue={inputValue}
      onInputChange={(_, newVal) => {
        void handleInputChange(newVal);
      }}
      onChange={(_, val) => {
        void handleSelect(val);
      }}
      renderInput={(params) => (
        <TextField
          {...params}
          label={label}
          required={required}
          error={Boolean(error || loadError)}
          helperText={loadError ?? helperText}
          onBlur={onBlur}
          InputProps={{
            ...params.InputProps,
            endAdornment: (
              <>
                {!ready ? <CircularProgress size={16} /> : null}
                {params.InputProps.endAdornment}
              </>
            ),
          }}
        />
      )}
    />
  );
}

// ── map with clickable marker ────────────────────────────────────────────────

interface PickerMapProps {
  latitude: number;
  longitude: number;
  onMapClick: (lat: number, lng: number) => void;
}

function PickerMap({ latitude, longitude, onMapClick }: PickerMapProps) {
  const [markerRef, marker] = useMarkerRef();

  useEffect(() => {
    if (marker) {
      marker
        .getMap()
        ?.setOptions({ center: { lat: latitude, lng: longitude } });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [latitude, longitude]);

  return (
    <Map
      style={{ width: "100%", height: "100%" }}
      defaultCenter={{ lat: latitude, lng: longitude }}
      defaultZoom={15}
      disableDefaultUI
      onClick={(e) => {
        if (e.detail.latLng) {
          onMapClick(e.detail.latLng.lat, e.detail.latLng.lng);
        }
      }}
    >
      <Marker ref={markerRef} position={{ lat: latitude, lng: longitude }} />
    </Map>
  );
}

// ── public component ─────────────────────────────────────────────────────────

export function LocationPicker({
  value,
  onChange,
  onBlur,
  addressLabel,
  addressError,
  addressHelperText,
  coordinatesError,
  coordinatesHelperText,
  required,
}: LocationPickerProps) {
  const { t } = useTranslation("common");

  const handleMapClick = (lat: number, lng: number) => {
    // Reverse-geocode click → update address label via Places API
    (async () => {
      try {
        const geocoder = new google.maps.Geocoder();
        const result = await geocoder.geocode({ location: { lat, lng } });
        const address =
          result.results?.[0]?.formatted_address ?? `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
        onChange({ address, latitude: lat, longitude: lng });
      } catch {
        onChange({ address: `${lat.toFixed(5)}, ${lng.toFixed(5)}`, latitude: lat, longitude: lng });
      }
    })();
  };

  return (
    <APIProvider apiKey={API_KEY}>
      <Stack spacing={1}>
        <AddressAutocomplete
          value={value.address}
          label={addressLabel ?? t("locationPicker.addressLabel")}
          error={addressError}
          helperText={addressHelperText}
          required={required}
          onBlur={onBlur}
          onLocationResolved={onChange}
        />
        <Box
          sx={{
            borderRadius: 1,
            aspectRatio: "1 / 1",
            overflow: "hidden",
            width: "100%"
          }}
        >
          <PickerMap
            latitude={value.latitude || 50.6072}
            longitude={value.longitude || 3.3889}
            onMapClick={handleMapClick}
          />
        </Box>
        {(coordinatesError && coordinatesHelperText) ? (
          <Typography color="error" variant="caption">
            {coordinatesHelperText}
          </Typography>
        ) : null}
      </Stack>
    </APIProvider>
  );
}
