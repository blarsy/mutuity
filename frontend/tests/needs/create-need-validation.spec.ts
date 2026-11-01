import { createNeedInitialValues, createNeedValidationSchema } from "../../src/features/needs/createNeed.validation";
import { createResourceInitialValues, createResourceValidationSchema } from "../../src/features/resources/createResource.validation";

describe("create form location defaults", () => {
  it("leaves new need and resource locations empty until a profile location is supplied", () => {
    expect(createNeedInitialValues).toMatchObject({ location: "", latitude: "", longitude: "" });
    expect(createResourceInitialValues).toMatchObject({ location: "", latitude: "", longitude: "" });
  });

  it("allows an optional empty resource location", async () => {
    await expect(createResourceValidationSchema.validateAt("location", createResourceInitialValues)).resolves.toBe("");
    await expect(createResourceValidationSchema.validateAt("latitude", createResourceInitialValues)).resolves.toBeNull();
    await expect(createResourceValidationSchema.validateAt("longitude", createResourceInitialValues)).resolves.toBeNull();
  });

  it("requires a need location and coordinates instead of substituting defaults", async () => {
    await expect(createNeedValidationSchema.validateAt("location", createNeedInitialValues)).rejects.toThrow("Location is required");
    await expect(createNeedValidationSchema.validateAt("latitude", {
      ...createNeedInitialValues,
      location: "Tournai"
    })).rejects.toThrow("Latitude is required");
  });
});

describe("leg-up need token validation", () => {
  const values = {
    ...createNeedInitialValues,
    title: "Grocery pickup",
    location: "Tournai",
    intensity: "LEG_UP"
  };

  it.each([1, 5, 9, 10, 99])("accepts %i tokens", async tokenAmount => {
    await expect(createNeedValidationSchema.validateAt("proposedTopesAmount", {
      ...values, proposedTopesAmount: tokenAmount
    })).resolves.toBe(tokenAmount);
  });

  it.each([-1, 0, 100])("rejects %i tokens", async tokenAmount => {
    await expect(createNeedValidationSchema.validateAt("proposedTopesAmount", {
      ...values, proposedTopesAmount: tokenAmount
    })).rejects.toThrow();
  });
});