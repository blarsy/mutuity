import * as FileSystem from "expo-file-system";
import { uploadListingImages } from "../../src/services/images";

jest.mock("expo-file-system", () => ({
  EncodingType: { Base64: "base64" },
  readAsStringAsync: jest.fn().mockResolvedValue("image-base64")
}));

describe("listing image uploads", () => {
  const originalFetch = global.fetch;
  const originalCloud = process.env.EXPO_PUBLIC_CLOUDINARY_CLOUD;
  const originalPreset = process.env.EXPO_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env.EXPO_PUBLIC_CLOUDINARY_CLOUD = "test-cloud";
    process.env.EXPO_PUBLIC_CLOUDINARY_UPLOAD_PRESET = "test-preset";
    global.fetch = jest.fn().mockResolvedValue({ ok: true, json: async () => ({ secure_url: "https://example.com/uploaded.jpg" }) });
  });

  afterAll(() => {
    global.fetch = originalFetch;
    if (originalCloud === undefined) delete process.env.EXPO_PUBLIC_CLOUDINARY_CLOUD;
    else process.env.EXPO_PUBLIC_CLOUDINARY_CLOUD = originalCloud;
    if (originalPreset === undefined) delete process.env.EXPO_PUBLIC_CLOUDINARY_UPLOAD_PRESET;
    else process.env.EXPO_PUBLIC_CLOUDINARY_UPLOAD_PRESET = originalPreset;
  });

  it("uploads local picker files and preserves existing public URLs in order", async () => {
    expect(await uploadListingImages(["https://example.com/existing.jpg", "file:///cache/picked.jpg"]))
      .toEqual(["https://example.com/existing.jpg", "https://example.com/uploaded.jpg"]);
    expect(FileSystem.readAsStringAsync).toHaveBeenCalledWith("file:///cache/picked.jpg", { encoding: "base64" });
    expect(global.fetch).toHaveBeenCalledTimes(1);
  });

  it("does not upload images already hosted publicly", async () => {
    expect(await uploadListingImages(["https://example.com/image.jpg"])).toEqual(["https://example.com/image.jpg"]);
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it("fails before persisting local paths when uploads are not configured", async () => {
    delete process.env.EXPO_PUBLIC_CLOUDINARY_CLOUD;
    await expect(uploadListingImages(["file:///cache/image.jpg"])).rejects.toThrow("not configured");
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it("rejects failed uploads and nonpublic upload results", async () => {
    jest.mocked(global.fetch).mockResolvedValueOnce({ ok: false, status: 500 } as Response);
    await expect(uploadListingImages(["file:///cache/image.jpg"])).rejects.toThrow("Image upload failed");
    jest.mocked(global.fetch).mockResolvedValueOnce({ ok: true, json: async () => ({ secure_url: "file:///invalid.jpg" }) } as Response);
    await expect(uploadListingImages(["file:///cache/image.jpg"])).rejects.toThrow("public HTTPS URL");
  });
});