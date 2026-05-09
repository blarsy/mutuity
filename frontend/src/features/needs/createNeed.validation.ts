import * as Yup from "yup";

export type NeedIntensityValue = "LEG_UP" | "SHARING" | "COMMITMENT" | "RARE_CONTRIBUTION";

export type CreateNeedValues = {
  title: string;
  description: string;
  imageUrls: string[];
  location: string;
  intensity: NeedIntensityValue;
  proposedTopesAmount: number | "";
  objectRequired: boolean;
  competenceRequired: boolean;
  toolingRequired: boolean;
  multiplePeopleRequired: boolean;
  requiredCompetenceText: string;
  requiredToolingText: string;
  requiredPeopleCount: number | "";
  campaignId: string;
  expiresAt: string;
};

export const createNeedInitialValues: CreateNeedValues = {
  title: "",
  description: "",
  imageUrls: [],
  location: "",
  intensity: "SHARING",
  proposedTopesAmount: "",
  objectRequired: true,
  competenceRequired: false,
  toolingRequired: false,
  multiplePeopleRequired: false,
  requiredCompetenceText: "",
  requiredToolingText: "",
  requiredPeopleCount: "",
  campaignId: "",
  expiresAt: ""
};

function isWithinTopesRange(intensity: NeedIntensityValue, value: number) {
  if (intensity === "LEG_UP") {
    return value >= 10 && value <= 99;
  }

  if (intensity === "SHARING") {
    return value >= 100 && value <= 999;
  }

  if (intensity === "COMMITMENT") {
    return value >= 1000 && value <= 4999;
  }

  return value >= 5000;
}

export const createNeedValidationSchema = Yup.object({
  title: Yup.string().trim().required("Title is required"),
  description: Yup.string().max(8000).optional(),
  imageUrls: Yup.array().of(Yup.string().url().required()).default([]),
  location: Yup.string().trim().required("Location is required"),
  intensity: Yup.mixed<NeedIntensityValue>()
    .oneOf(["LEG_UP", "SHARING", "COMMITMENT", "RARE_CONTRIBUTION"])
    .required("Intensity is required"),
  proposedTopesAmount: Yup.number()
    .transform((value, originalValue) => (originalValue === "" ? undefined : value))
    .integer("Topes amount must be an integer")
    .positive("Topes amount must be greater than zero")
    .test(
      "topes-range-by-intensity",
      "Topes amount is outside the allowed range for this intensity",
      function validateRange(value) {
        if (value == null) {
          return true;
        }

        const intensity = this.parent.intensity as NeedIntensityValue;
        return isWithinTopesRange(intensity, value);
      }
    )
    .optional(),
  objectRequired: Yup.boolean().required(),
  competenceRequired: Yup.boolean().required(),
  toolingRequired: Yup.boolean().required(),
  multiplePeopleRequired: Yup.boolean().required(),
  requiredCompetenceText: Yup.string().when("competenceRequired", {
    is: true,
    then: schema => schema.trim().required("Competence details are required when competence is needed"),
    otherwise: schema => schema.optional()
  }),
  requiredToolingText: Yup.string().when("toolingRequired", {
    is: true,
    then: schema => schema.trim().required("Tooling details are required when tooling is needed"),
    otherwise: schema => schema.optional()
  }),
  requiredPeopleCount: Yup.number()
    .transform((value, originalValue) => (originalValue === "" ? undefined : value))
    .integer("Required people count must be an integer")
    .when("multiplePeopleRequired", {
      is: true,
      then: schema => schema.min(2, "At least 2 people are required").required("People count is required"),
      otherwise: schema => schema.optional()
    }),
  campaignId: Yup.string().uuid().optional(),
  expiresAt: Yup.string().optional()
}).test("nature-at-least-one", function validateNatureFlags(value) {
  if (
    value?.objectRequired ||
    value?.competenceRequired ||
    value?.toolingRequired ||
    value?.multiplePeopleRequired
  ) {
    return true;
  }

  return this.createError({
    path: "objectRequired",
    message: "Select at least one need nature flag (object, competence, tooling, or multiple people)"
  });
});
