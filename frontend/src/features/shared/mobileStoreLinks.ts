export const DEFAULT_ANDROID_STORE_URL = "https://play.google.com/store/apps/details?id=com.topela";
export const DEFAULT_IOS_STORE_URL = "https://apps.apple.com/be/app/tope-la/id6470202780";

export function resolveMobileStoreLinks() {
  return {
    androidUrl: process.env.NEXT_PUBLIC_ANDROID_STORE_URL || DEFAULT_ANDROID_STORE_URL,
    iosUrl: process.env.NEXT_PUBLIC_IOS_STORE_URL || DEFAULT_IOS_STORE_URL
  };
}
