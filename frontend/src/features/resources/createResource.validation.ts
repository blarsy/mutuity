import * as Yup from "yup";

import type { ResourceIntensity } from "./types";

export type CreateResourceValues = {
  title: string;
  description: string;
  imageUrls: string[];
  location: string;
  latitude: number | "";
  longitude: number | "";
  intensity: ResourceIntensity;
  defaultTokenAmount: number | "";
  categoryCodes: number[];
  isProduct: boolean;
  isService: boolean;
  canBeGiven: boolean;
  canBeExchanged: boolean;
  canBeTakenAway: boolean;
  canBeDelivered: boolean;
  expiresAt: string;
};

export const createResourceInitialValues: CreateResourceValues = {
  title: "",
  description: "",
  imageUrls: [],
  location: "Tournai centre",
  latitude: 50.6072,
  longitude: 3.3889,
  intensity: "sharing",
  defaultTokenAmount: "",
  categoryCodes: [],
  isProduct: true,
  isService: false,
  canBeGiven: true,
  canBeExchanged: false,
  canBeTakenAway: true,
  canBeDelivered: false,
  expiresAt: ""
};

export function isTokenAmountWithinIntensityRange(
  intensity: ResourceIntensity,
  tokenAmount: number | null | undefined
) {
  if (tokenAmount == null) {
    return true;
  }

  switch (intensity) {
    case "leg_up":
      return tokenAmount >= 10 && tokenAmount <= 99;
    case "sharing":
      return tokenAmount >= 100 && tokenAmount <= 999;
    case "commitment":
      return tokenAmount >= 1000 && tokenAmount <= 4999;
    case "rare_contribution":
      return tokenAmount >= 5000;
    default:
      return false;
  }
}

export function getTokenRangeLabel(intensity: ResourceIntensity) {
  switch (intensity) {
    case "leg_up":
      return "10–99";
    case "sharing":
      return "100–999";
    case "commitment":
      return "1000–4999";
    case "rare_contribution":
      return "5000+";
    default:
      return "";
  }
}

export function toGraphQLResourceIntensity(intensity: ResourceIntensity) {
  switch (intensity) {
    case "leg_up":
      return "LEG_UP";
    case "sharing":
      return "SHARING";
    case "commitment":
      return "COMMITMENT";
    case "rare_contribution":
      return "RARE_CONTRIBUTION";
    default:
      return "SHARING";
  }
}

const optionalIntegerField = Yup.number()
  .transform((value, originalValue) => (originalValue === "" || originalValue == null ? null : value))
  .nullable()
  .integer("Use a whole number")
  .min(1, "Use a positive number")
  .optional();

export const createResourceValidationSchema = Yup.object({
  title: Yup.string().trim().required("Title is required"),
  description: Yup.string().max(8000, "Description must be 8000 characters or fewer"),
  imageUrls: Yup.array().of(Yup.string().url().required()).default([]),
  location: Yup.string().trim().required("Location is required"),
  latitude: Yup.number()
    .transform((value, originalValue) => (originalValue === "" || originalValue == null ? Number.NaN : value))
    .min(-90, "Latitude must be at least -90")
    .max(90, "Latitude must be at most 90")
    .required("Latitude is required"),
  longitude: Yup.number()
    .transform((value, originalValue) => (originalValue === "" || originalValue == null ? Number.NaN : value))
    .min(-180, "Longitude must be at least -180")
    .max(180, "Longitude must be at most 180")
    .required("Longitude is required"),
  intensity: Yup.mixed<ResourceIntensity>()
    .oneOf(["leg_up", "sharing", "commitment", "rare_contribution"])
    .required("Intensity is required"),
  defaultTokenAmount: optionalIntegerField,
  categoryCodes: Yup.array().of(Yup.number().integer().required()).default([]),
  isProduct: Yup.boolean().required(),
  isService: Yup.boolean().required(),
  canBeGiven: Yup.boolean().required(),
  canBeExchanged: Yup.boolean().required(),
  canBeTakenAway: Yup.boolean().required(),
  canBeDelivered: Yup.boolean().required(),
  expiresAt: Yup.string().optional()
})
  .test("product-or-service", function (value) {
    if (!value || value.isProduct || value.isService) {
      return true;
    }

    return this.createError({
      path: "isService",
      message: "Select product, service, or both"
    });
  })
  .test("token-range", function (value) {
    if (!value) {
      return true;
    }

    const tokenAmount =
      typeof value.defaultTokenAmount === "number"
        ? value.defaultTokenAmount
        : value.defaultTokenAmount == null
          ? null
          : Number(value.defaultTokenAmount);

    if (tokenAmount == null || Number.isNaN(tokenAmount)) {
      return true;
    }

    if (isTokenAmountWithinIntensityRange(value.intensity, tokenAmount)) {
      return true;
    }

    return this.createError({
      path: "defaultTokenAmount",
      message: "Suggested token amount does not match the selected intensity"
    });
  })
  .test("future-expiration", function (value) {
    if (!value?.expiresAt) {
      return true;
    }

    const timestamp = new Date(value.expiresAt).getTime();

    if (!Number.isNaN(timestamp) && timestamp > Date.now()) {
      return true;
    }

    return this.createError({
      path: "expiresAt",
      message: "Expiration must be in the future"
    });
  });
