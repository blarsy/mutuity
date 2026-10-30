import * as FileSystem from "expo-file-system";
import { appSettings } from "../../src/config/appSettings";
import { uploadListingImages } from "../../src/services/images";

jest.mock("../../src/config/appSettings", () => ({
  appSettings: { cloudinary: { cloud: "test-cloud", uploadPreset: "test-preset" } }
}));

jest.mock("expo-file-system", () => ({
  File: jest.fn().mockImplementation(() => ({
    base64: jest.fn().mockResolvedValue("image-base64")
  }))
}));

describe("listing image uploads", () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    jest.clearAllMocks();
    appSettings.cloudinary.cloud = "test-cloud";
    appSettings.cloudinary.uploadPreset = "test-preset";
    global.fetch = jest.fn().mockResolvedValue({ ok: true, json: async () => ({ secure_url: "https://example.com/uploaded.jpg" }) });
  });

  afterAll(() => {
    global.fetch = originalFetch;
  });

  it("uploads local picker files and preserves existing public URLs in order", async () => {
    expect(await uploadListingImages(["https://example.com/existing.jpg", "file:///cache/picked.jpg"]))
      .toEqual(["https://example.com/existing.jpg", "https://example.com/uploaded.jpg"]);
    expect(FileSystem.File).toHaveBeenCalledWith("file:///cache/picked.jpg");
    expect(jest.mocked(FileSystem.File).mock.results[0]?.value.base64).toHaveBeenCalledTimes(1);
    expect(global.fetch).toHaveBeenCalledTimes(1);
    expect(global.fetch).toHaveBeenCalledWith(
      "https://api.cloudinary.com/v1_1/test-cloud/image/upload",
      expect.objectContaining({ method: "POST", body: expect.any(FormData) })
    );
  });

  it("does not upload images already hosted publicly", async () => {
    expect(await uploadListingImages(["https://example.com/image.jpg"])).toEqual(["https://example.com/image.jpg"]);
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it("fails before persisting local paths when uploads are not configured", async () => {
    appSettings.cloudinary.cloud = "";
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