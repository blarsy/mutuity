import * as FileSystem from "expo-file-system";

/** Picker URIs are device-local; only uploaded HTTP(S) URLs may be persisted. */
export async function uploadListingImages(imageUris: string[]): Promise<string[]> {
  return Promise.all(imageUris.map(async (value) => {
    const uri = value.trim();
    if (/^https?:\/\//i.test(uri)) {
      return uri;
    }
    if (!/^(file|content):\/\//i.test(uri)) {
      throw new Error("Unsupported image URI. Please choose the image again.");
    }

    const cloud = process.env.EXPO_PUBLIC_CLOUDINARY_CLOUD;
    const preset = process.env.EXPO_PUBLIC_CLOUDINARY_UPLOAD_PRESET;
    if (!cloud || !preset) {
      throw new Error("Image uploads are not configured for this app.");
    }

    const base64 = await FileSystem.readAsStringAsync(uri, { encoding: FileSystem.EncodingType.Base64 });
    const extension = uri.split(/[?#]/)[0]?.split(".").pop()?.toLowerCase();
    const mimeType = extension === "png" ? "image/png"
      : extension === "webp" ? "image/webp"
      : extension === "heic" ? "image/heic"
      : extension === "heif" ? "image/heif"
      : "image/jpeg";
    const form = new FormData();
    form.append("upload_preset", preset);
    form.append("file", `data:${mimeType};base64,${base64}`);
    const response = await fetch(`https://api.cloudinary.com/v1_1/${encodeURIComponent(cloud)}/image/upload`, {
      method: "POST",
      body: form
    });
    if (!response.ok) {
      throw new Error(`Image upload failed (${response.status}). Please try again.`);
    }
    const result: { secure_url?: unknown } = await response.json();
    if (typeof result.secure_url !== "string" || !/^https:\/\//i.test(result.secure_url)) {
      throw new Error("Image upload did not return a public HTTPS URL.");
    }
    return result.secure_url;
  }));
}