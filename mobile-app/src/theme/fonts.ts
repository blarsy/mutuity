export const appFontFamilies = {
  title: "TopeTitle",
  general: "TopeGeneral",
  altGeneral: "TopeAltGeneral",
  sugar: "TopeSugar"
} as const;

export const appFontAssets: Record<string, number> = {
  [appFontFamilies.title]: require("../assets/fonts/LTMakeup-Regular.otf"),
  [appFontFamilies.general]: require("../assets/fonts/renner-book.otf"),
  [appFontFamilies.altGeneral]: require("../assets/fonts/renner-black.otf"),
  [appFontFamilies.sugar]: require("../assets/fonts/ComicJensFreePro-Regular.ttf")
};
