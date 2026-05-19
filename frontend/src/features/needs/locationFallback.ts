import type { NeedSearchLocation } from "./types";

export const TOURNAI_CITY_CENTRE: NeedSearchLocation = {
  latitude: 50.6072,
  longitude: 3.3889,
  source: "fallback"
};

export const TOURNAI_CENTRE_ADDRESS = "Rue du Curé Notre Dame 15, 7500 Tournai, Belgium";
type PartialLocation = {
  latitude: number;
  longitude: number;
};

function hasCoordinates(location?: PartialLocation | null): location is PartialLocation {
  return Boolean(
    location
      && Number.isFinite(location.latitude)
      && Number.isFinite(location.longitude)
  );
}

export function resolveNeedSearchLocation(input: {
  explicitLocation?: PartialLocation | null;
  accountLocation?: PartialLocation | null;
  browserLocation?: PartialLocation | null;
}): NeedSearchLocation {
  if (hasCoordinates(input.explicitLocation)) {
    return {
      latitude: input.explicitLocation.latitude,
      longitude: input.explicitLocation.longitude,
      source: "explicit"
    };
  }

  if (hasCoordinates(input.accountLocation)) {
    return {
      latitude: input.accountLocation.latitude,
      longitude: input.accountLocation.longitude,
      source: "account"
    };
  }

  if (hasCoordinates(input.browserLocation)) {
    return {
      latitude: input.browserLocation.latitude,
      longitude: input.browserLocation.longitude,
      source: "browser"
    };
  }

  return TOURNAI_CITY_CENTRE;
}

export async function getBrowserLocation(): Promise<NeedSearchLocation | undefined> {
  if (typeof window === "undefined" || !("geolocation" in navigator)) {
    return undefined;
  }

  return new Promise(resolve => {
    navigator.geolocation.getCurrentPosition(
      position => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          source: "browser"
        });
      },
      () => resolve(undefined),
      {
        enableHighAccuracy: false,
        timeout: 5000,
        maximumAge: 5 * 60 * 1000
      }
    );
  });
}
