import { createNeedInitialValues, createNeedValidationSchema } from "../../src/features/needs/createNeed.validation";

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