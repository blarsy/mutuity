import React, { useEffect, useMemo, useRef, useState } from "react";
import { ActivityIndicator, Platform, Pressable, ScrollView, StyleSheet, View } from "react-native";
import * as ExpoLocation from "expo-location";
import MapView, { Marker, PROVIDER_GOOGLE } from "react-native-maps";
import { Button, IconButton, Text, TextInput } from "react-native-paper";
import { useTranslation } from "react-i18next";

import { designTokens } from "../../theme/tokens";
import { FormTextInput } from "./FormTextInput";
import { ThemedDialog } from "./ThemedDialog";

export interface ProximityLocationValue {
  label: string;
  latitude?: number;
  longitude?: number;
}

export interface ProximityLocationEditorProps {
  value: ProximityLocationValue | null;
  onChange: (value: ProximityLocationValue | null) => void;
}

interface LocationSuggestion {
  label: string;
  latitude: number;
  longitude: number;
}

interface NominatimSearchResult {
  display_name?: string;
  lat?: string;
  lon?: string;
}

class LocationSuggestionSearchError extends Error {
  readonly statusCode: number | undefined;

  constructor(message: string, statusCode?: number) {
    super(message);
    this.name = "LocationSuggestionSearchError";
    this.statusCode = statusCode;
  }
}

interface ReverseGeocodedAddress {
  name?: string;
  street?: string;
  district?: string;
  city?: string;
  region?: string;
  subregion?: string;
  county?: string;
  country?: string;
}

const DEFAULT_MAP_REGION = {
  latitude: 46.2276,
  longitude: 2.2137,
  latitudeDelta: 6,
  longitudeDelta: 6
} as const;

const mapProviderProps: { provider?: typeof PROVIDER_GOOGLE } =
  Platform.OS === "android" ? { provider: PROVIDER_GOOGLE } : {};

function toDraftCoordinates(value: ProximityLocationValue | null): { latitude?: number; longitude?: number } {
  const coordinates: { latitude?: number; longitude?: number } = {};

  if (value?.latitude !== undefined) {
    coordinates.latitude = value.latitude;
  }

  if (value?.longitude !== undefined) {
    coordinates.longitude = value.longitude;
  }

  return coordinates;
}

function hasDraftCoordinates(
  coordinates: { latitude?: number; longitude?: number }
): coordinates is { latitude: number; longitude: number } {
  return coordinates.latitude !== undefined && coordinates.longitude !== undefined;
}

function formatReverseGeocodedLabel(address: ReverseGeocodedAddress | undefined): string {
  return [address?.name, address?.street, address?.district, address?.city, address?.region, address?.country]
    .filter((candidate): candidate is string => Boolean(candidate && candidate.trim().length > 0))
    .join(", ");
}

async function searchLocationSuggestions(query: string): Promise<LocationSuggestion[]> {
  const response = await fetch(
    `https://nominatim.openstreetmap.org/search?format=jsonv2&addressdetails=1&limit=5&q=${encodeURIComponent(query)}`,
    {
      headers: {
        Accept: "application/json"
      }
    }
  );

  if (!response.ok) {
    throw new LocationSuggestionSearchError("Location search failed", response.status);
  }

  const payload = (await response.json()) as NominatimSearchResult[];
  return payload
    .map((entry) => {
      const latitude = entry.lat ? Number(entry.lat) : Number.NaN;
      const longitude = entry.lon ? Number(entry.lon) : Number.NaN;

      if (!entry.display_name || Number.isNaN(latitude) || Number.isNaN(longitude)) {
        return null;
      }

      return {
        label: entry.display_name,
        latitude,
        longitude
      } satisfies LocationSuggestion;
    })
    .filter((entry): entry is LocationSuggestion => entry !== null);
}

async function searchLocationSuggestionsFallback(query: string): Promise<LocationSuggestion[]> {
  const geocoded = await ExpoLocation.geocodeAsync(query);
  const closestMatches = geocoded.slice(0, 5);

  const suggestions = await Promise.all(
    closestMatches.map(async (location) => {
      const reverseGeocoded = await ExpoLocation.reverseGeocodeAsync({
        latitude: location.latitude,
        longitude: location.longitude
      });
      const reverseGeocodedLabel = formatReverseGeocodedLabel(reverseGeocoded[0] as ReverseGeocodedAddress | undefined);

      return {
        label: reverseGeocodedLabel || query,
        latitude: location.latitude,
        longitude: location.longitude
      } satisfies LocationSuggestion;
    })
  );

  const deduped = new Map<string, LocationSuggestion>();
  suggestions.forEach((suggestion) => {
    const key = `${suggestion.label}-${suggestion.latitude.toFixed(5)}-${suggestion.longitude.toFixed(5)}`;
    deduped.set(key, suggestion);
  });

  return Array.from(deduped.values());
}

export function ProximityLocationEditor({ value, onChange }: ProximityLocationEditorProps): React.JSX.Element {
  const { t } = useTranslation();
  const [showEditorDialog, setShowEditorDialog] = useState(false);
  const [draftLocationLabel, setDraftLocationLabel] = useState(value?.label ?? "");
  const [draftCoordinates, setDraftCoordinates] = useState<{ latitude?: number; longitude?: number }>(
    toDraftCoordinates(value)
  );
  const [locationSuggestions, setLocationSuggestions] = useState<LocationSuggestion[]>([]);
  const [suggestionsLoading, setSuggestionsLoading] = useState(false);
  const [editorLoading, setEditorLoading] = useState(false);
  const [editorError, setEditorError] = useState<string | null>(null);
  const searchRequestId = useRef(0);
  const suggestionsCache = useRef<Map<string, LocationSuggestion[]>>(new Map());

  const editorMapRegion = useMemo(
    () =>
      hasDraftCoordinates(draftCoordinates)
        ? {
            latitude: draftCoordinates.latitude,
            longitude: draftCoordinates.longitude,
            latitudeDelta: 0.02,
            longitudeDelta: 0.02
          }
        : DEFAULT_MAP_REGION,
    [draftCoordinates]
  );

  const canRenderMap = useMemo(
    () => value?.latitude !== undefined && value?.longitude !== undefined,
    [value?.latitude, value?.longitude]
  );

  const openEditor = (): void => {
    setDraftLocationLabel(value?.label ?? "");
    setDraftCoordinates(toDraftCoordinates(value));
    setLocationSuggestions([]);
    setSuggestionsLoading(false);
    setEditorError(null);
    setShowEditorDialog(true);
  };

  useEffect(() => {
    if (!showEditorDialog) {
      return;
    }

    const nextQuery = draftLocationLabel.trim();
    if (nextQuery.length < 3) {
      setLocationSuggestions([]);
      setSuggestionsLoading(false);
      return;
    }

    const cachedSuggestions = suggestionsCache.current.get(nextQuery.toLowerCase());
    if (cachedSuggestions) {
      setLocationSuggestions(cachedSuggestions);
      setSuggestionsLoading(false);
      return;
    }

    const requestId = searchRequestId.current + 1;
    searchRequestId.current = requestId;

    const timeoutId = setTimeout(() => {
      setSuggestionsLoading(true);

      void searchLocationSuggestions(nextQuery)
        .then((suggestions) => {
          if (searchRequestId.current === requestId) {
            suggestionsCache.current.set(nextQuery.toLowerCase(), suggestions);
            setLocationSuggestions(suggestions);
          }
        })
        .catch(async (error: unknown) => {
          if (searchRequestId.current !== requestId) {
            return;
          }

          try {
            const fallbackSuggestions = await searchLocationSuggestionsFallback(nextQuery);
            if (searchRequestId.current === requestId) {
              suggestionsCache.current.set(nextQuery.toLowerCase(), fallbackSuggestions);
              setLocationSuggestions(fallbackSuggestions);
            }
          } catch {
            if (searchRequestId.current === requestId) {
              setLocationSuggestions([]);
              if (error instanceof LocationSuggestionSearchError && error.statusCode === 429) {
                setEditorError(
                  t("locationSuggestionsRateLimitedLabel", {
                    defaultValue: "Address suggestions are temporarily limited. Please keep typing or tap the map."
                  })
                );
              }
            }
          }
        })
        .finally(() => {
          if (searchRequestId.current === requestId) {
            setSuggestionsLoading(false);
          }
        });
    }, 450);

    return () => {
      clearTimeout(timeoutId);
    };
  }, [draftLocationLabel, showEditorDialog]);

  const applySelectedLocation = (nextLabel: string, latitude: number, longitude: number): void => {
    setDraftLocationLabel(nextLabel);
    setDraftCoordinates({ latitude, longitude });
    setEditorError(null);
    setLocationSuggestions([]);
  };

  const resolveCoordinatesToLabel = async (latitude: number, longitude: number): Promise<void> => {
    setEditorLoading(true);
    setEditorError(null);

    try {
      const reverseGeocoded = await ExpoLocation.reverseGeocodeAsync({ latitude, longitude });
      const resolved = reverseGeocoded[0] as ReverseGeocodedAddress | undefined;
      const nextLabel = formatReverseGeocodedLabel(resolved);

      setDraftLocationLabel(nextLabel || t("currentLocationLabel", { defaultValue: "Current location" }));
      setDraftCoordinates({ latitude, longitude });
      setLocationSuggestions([]);
    } catch {
      setEditorError(
        t("locationLookupFailedLabel", {
          defaultValue: "Unable to retrieve location details right now."
        })
      );
    } finally {
      setEditorLoading(false);
    }
  };

  const useCurrentLocation = async (): Promise<void> => {
    setEditorLoading(true);
    setEditorError(null);

    try {
      const permission = await ExpoLocation.requestForegroundPermissionsAsync();
      if (permission.status !== ExpoLocation.PermissionStatus.GRANTED) {
        setEditorError(
          t("locationPermissionDeniedLabel", {
            defaultValue: "Location permission is required to use your current location."
          })
        );
        return;
      }

      const currentPosition = await ExpoLocation.getCurrentPositionAsync({
        accuracy: ExpoLocation.Accuracy.Balanced
      });
      const reverseGeocoded = await ExpoLocation.reverseGeocodeAsync({
        latitude: currentPosition.coords.latitude,
        longitude: currentPosition.coords.longitude
      });
      const resolved = reverseGeocoded[0] as ReverseGeocodedAddress | undefined;
      const nextLabel = formatReverseGeocodedLabel(resolved);

      setDraftLocationLabel(nextLabel || t("currentLocationLabel", { defaultValue: "Current location" }));
      setDraftCoordinates({
        latitude: currentPosition.coords.latitude,
        longitude: currentPosition.coords.longitude
      });
      setLocationSuggestions([]);
    } catch {
      setEditorError(
        t("locationLookupFailedLabel", {
          defaultValue: "Unable to retrieve your current location right now."
        })
      );
    } finally {
      setEditorLoading(false);
    }
  };

  const handleSuggestionPress = (suggestion: LocationSuggestion): void => {
    applySelectedLocation(suggestion.label, suggestion.latitude, suggestion.longitude);
  };

  const handleMapPress = (latitude: number, longitude: number): void => {
    void resolveCoordinatesToLabel(latitude, longitude);
  };

  const saveEditor = async (): Promise<void> => {
    const nextValue = draftLocationLabel.trim();
    if (nextValue.length === 0) {
      onChange(null);
      setShowEditorDialog(false);
      return;
    }

    if (hasDraftCoordinates(draftCoordinates)) {
      onChange({
        label: nextValue,
        latitude: draftCoordinates.latitude,
        longitude: draftCoordinates.longitude
      });
      setShowEditorDialog(false);
      return;
    }

    setEditorLoading(true);
    try {
      const geocoded = await ExpoLocation.geocodeAsync(nextValue);
      const firstMatch = geocoded[0];
      const nextLocation: ProximityLocationValue = { label: nextValue };
      if (firstMatch?.latitude !== undefined) {
        nextLocation.latitude = firstMatch.latitude;
      }
      if (firstMatch?.longitude !== undefined) {
        nextLocation.longitude = firstMatch.longitude;
      }
      onChange(nextLocation);
      setShowEditorDialog(false);
    } catch {
      onChange({ label: nextValue });
      setShowEditorDialog(false);
    } finally {
      setEditorLoading(false);
    }
  };

  return (
    <View style={styles.root}>
      {value ? (
        <View style={styles.valueRow}>
          <Text numberOfLines={2} style={styles.valueText}>
            {value.label}
          </Text>
          <View style={styles.actionsRow}>
            <IconButton icon="pencil-outline" size={18} onPress={openEditor} />
            <IconButton icon="delete-outline" size={18} iconColor={designTokens.colors.primary} onPress={() => onChange(null)} />
          </View>
        </View>
      ) : (
        <View style={styles.emptyState}>
          <Text variant="headlineSmall" style={styles.emptyText}>
            {t("noAddressDefinedLabel", { defaultValue: "No address defined" })}
          </Text>
          <IconButton
            icon="map-marker-plus"
            size={36}
            mode="contained-tonal"
            containerColor="#fff"
            iconColor="#000"
            onPress={openEditor}
          />
        </View>
      )}

      {canRenderMap && value && !showEditorDialog ? (
        <MapView
          {...mapProviderProps}
          style={styles.mapPreview}
          scrollEnabled={false}
          zoomEnabled={false}
          rotateEnabled={false}
          pitchEnabled={false}
          region={{
            latitude: value.latitude!,
            longitude: value.longitude!,
            latitudeDelta: 0.02,
            longitudeDelta: 0.02
          }}
        >
          <Marker coordinate={{ latitude: value.latitude!, longitude: value.longitude! }} />
        </MapView>
      ) : null}

      {showEditorDialog ? (
        <ThemedDialog
          visible={showEditorDialog}
          title={t("locationLabel", { defaultValue: "Location" })}
          onDismiss={() => setShowEditorDialog(false)}
          content={
            <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.dialogContent}>
              <Button
                mode="outlined"
                icon="crosshairs-gps"
                onPress={() => {
                  void useCurrentLocation();
                }}
                loading={editorLoading}
                disabled={editorLoading}
              >
                {t("useCurrentLocationLabel", { defaultValue: "Use my current location" })}
              </Button>

              <FormTextInput
                label={t("locationLabel", { defaultValue: "Location" })}
                placeholder={t("locationPlaceholderLabel", { defaultValue: "Enter a location" })}
                value={draftLocationLabel}
                onChangeText={(nextText) => {
                  setDraftLocationLabel(nextText);
                  setDraftCoordinates({});
                  setEditorError(null);
                }}
                autoFocus
                right={
                  suggestionsLoading ? (
                    <TextInput.Icon
                      icon={() => <ActivityIndicator size="small" color={designTokens.colors.primary} />}
                      forceTextInputFocus={false}
                    />
                  ) : null
                }
              />

              {editorError ? (
                <Text variant="bodySmall" style={styles.errorText}>
                  {editorError}
                </Text>
              ) : null}

              {locationSuggestions.length > 0 ? (
                <View style={styles.suggestionsList}>
                  {locationSuggestions.map((suggestion) => (
                    <Pressable
                      key={`${suggestion.latitude}-${suggestion.longitude}-${suggestion.label}`}
                      accessibilityRole="button"
                      onPress={() => handleSuggestionPress(suggestion)}
                      style={({ pressed }) => [styles.suggestionRow, pressed && styles.suggestionRowPressed]}
                    >
                      <Text variant="bodyMedium" numberOfLines={2} style={styles.suggestionLabel}>
                        {suggestion.label}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              ) : null}

              <View style={styles.mapContainer}>
                <MapView
                  {...mapProviderProps}
                  style={styles.mapPreview}
                  scrollEnabled
                  zoomEnabled
                  rotateEnabled={false}
                  pitchEnabled={false}
                  onPress={(event) => {
                    const coordinate = event.nativeEvent.coordinate;
                    handleMapPress(coordinate.latitude, coordinate.longitude);
                  }}
                  region={editorMapRegion}
                >
                  {hasDraftCoordinates(draftCoordinates) ? (
                    <Marker coordinate={{ latitude: draftCoordinates.latitude, longitude: draftCoordinates.longitude }} />
                  ) : null}
                </MapView>
                {!hasDraftCoordinates(draftCoordinates) ? (
                  <View style={styles.mapHintOverlay} pointerEvents="none">
                    <Text variant="bodySmall" style={styles.mapHintText}>
                      {t("selectAddressOrTapMapLabel", {
                        defaultValue: "Type an address or tap the map to set a location."
                      })}
                    </Text>
                  </View>
                ) : null}
              </View>
            </ScrollView>
          }
          actions={[
            <Button key="cancel" onPress={() => setShowEditorDialog(false)}>
              {t("cancelLabel", { defaultValue: "Cancel" })}
            </Button>,
            <Button
              key="save"
              mode="contained"
              onPress={() => {
                void saveEditor();
              }}
              disabled={editorLoading}
            >
              {t("confirmLabel", { defaultValue: "OK" })}
            </Button>
          ]}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    gap: 12,
    paddingBottom: 10
  },
  valueRow: {
    paddingLeft: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between"
  },
  valueText: {
    flex: 1,
    flexShrink: 1,
    color: "#000"
  },
  actionsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2
  },
  emptyState: {
    alignItems: "center",
    gap: designTokens.spacing.sm
  },
  emptyText: {
    color: "#000",
    textAlign: "center"
  },
  dialogContent: {
    gap: designTokens.spacing.sm,
    paddingBottom: designTokens.spacing.sm
  },
  suggestionsList: {
    borderWidth: 1,
    borderColor: "rgba(0, 0, 0, 0.14)",
    borderRadius: designTokens.radius.md,
    overflow: "hidden"
  },
  suggestionRow: {
    paddingHorizontal: designTokens.spacing.sm,
    paddingVertical: designTokens.spacing.sm,
    backgroundColor: "rgba(255, 255, 255, 0.9)"
  },
  suggestionRowPressed: {
    opacity: 0.72
  },
  suggestionLabel: {
    color: "#000"
  },
  mapContainer: {
    borderRadius: designTokens.radius.md,
    overflow: "hidden",
    position: "relative"
  },
  mapPreview: {
    height: 150,
    borderRadius: designTokens.radius.md,
    overflow: "hidden"
  },
  mapHintOverlay: {
    position: "absolute",
    left: designTokens.spacing.sm,
    right: designTokens.spacing.sm,
    bottom: designTokens.spacing.sm,
    paddingHorizontal: designTokens.spacing.sm,
    paddingVertical: designTokens.spacing.xs,
    borderRadius: designTokens.radius.sm,
    backgroundColor: "rgba(0, 0, 0, 0.55)"
  },
  mapHintText: {
    color: "#fff",
    textAlign: "center"
  },
  errorText: {
    color: designTokens.colors.primary
  }
});