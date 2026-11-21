export const appFontFamilies = {
  display: "TopeDisplay",
  title: "TopeTitle",
  general: "TopeGeneral",
  altGeneral: "TopeAltGeneral",
  //sugar: "TopeSugar"
} as const;

export const appFontAssets: Record<string, number> = {
  [appFontFamilies.display]: require("../assets/fonts/LTMakeup-Regular.otf"),
  [appFontFamilies.title]: require("../assets/fonts/renner-black.otf"),
  [appFontFamilies.general]: require("../assets/fonts/renner-book.otf"),
  [appFontFamilies.altGeneral]: require("../assets/fonts/renner-black.otf")
};
