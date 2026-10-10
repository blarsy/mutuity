import { apolloClient } from "../../../src/services/graphql/client";
import { uploadListingImages } from "../../../src/services/images";
import { createNeedForAccount, updateNeedById, type UpsertNeedInput } from "../../../src/services/graphql/needs";

jest.mock("../../../src/services/graphql/client", () => ({ apolloClient: { mutate: jest.fn(), query: jest.fn() } }));
jest.mock("../../../src/services/images", () => ({ uploadListingImages: jest.fn() }));

const input: UpsertNeedInput = {
  title: "A need", description: " Plain text description ", imageUrls: ["file:///cache/image.jpg"],
  location: null, proposedTokenAmount: 12, objectRequired: true, competenceRequired: false,
  toolingRequired: false, multiplePeopleRequired: false, requiredCompetenceText: "",
  requiredToolingText: "", requiredPeopleCount: null, campaignId: null, expiresAt: null
};

describe("need save image persistence", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.mocked(uploadListingImages).mockResolvedValue(["https://example.com/image.jpg"]);
    (apolloClient.mutate as jest.Mock).mockResolvedValue({ data: {} });
  });

  it.each(["create", "update"])("uploads images before %s and preserves the description", async (mode) => {
    if (mode === "create") await createNeedForAccount("account", input);
    else await updateNeedById("need", input);
    expect(uploadListingImages).toHaveBeenCalledWith(input.imageUrls);
    const variables = (apolloClient.mutate as jest.Mock).mock.calls[0][0].variables;
    expect(variables.input ?? variables.needPatch).toMatchObject({
      description: "Plain text description", imageUrls: ["https://example.com/image.jpg"]
    });
  });

  it("allows removal of every image and clearing the description", async () => {
    jest.mocked(uploadListingImages).mockResolvedValue([]);
    await updateNeedById("need", { ...input, imageUrls: [], description: "" });
    expect((apolloClient.mutate as jest.Mock).mock.calls[0][0].variables.needPatch)
      .toMatchObject({ imageUrls: [], description: "" });
  });

  it.each(["create", "update"])("does not %s when the image upload fails", async (mode) => {
    jest.mocked(uploadListingImages).mockRejectedValue(new Error("Upload failed"));
    await expect(mode === "create" ? createNeedForAccount("account", input) : updateNeedById("need", input))
      .rejects.toThrow("Upload failed");
    expect(apolloClient.mutate).not.toHaveBeenCalled();
  });
});