import { Cloudinary } from "@cloudinary/url-gen";

const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD ?? "";
const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET ?? "";

const cld = new Cloudinary({ cloud: { cloudName } });

export const RESOURCE_IMAGE_SIZE = 512;

export function urlFromPublicId(publicId: string): string {
  return cld.image(publicId).toURL();
}

export async function uploadImage(base64DataUrl: string): Promise<string> {
  const formData = new FormData();
  formData.append("unsigned", "true");
  formData.append("upload_preset", uploadPreset);
  formData.append("file", base64DataUrl);

  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
    { method: "POST", body: formData }
  );

  if (!res.ok) {
    throw new Error(`Image upload failed: ${res.status} ${res.statusText}`);
  }

  const result = await res.json() as { public_id: string };
  return result.public_id;
}
