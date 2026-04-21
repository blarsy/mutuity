import { createTheme } from "@mui/material";
import localFont from "next/font/local";

const title = localFont({ src: "./fonts/LTMakeup-Regular.otf" });
const general = localFont({ src: "./fonts/renner-book.otf" });
const altGeneral = localFont({ src: "./fonts/renner-black.otf", weight: "800" });
const sugar = localFont({ src: "./fonts/ComicJensFreePro-Regular.ttf" });

const titleFont = `${title.style.fontFamily}, sans-serif`;
const bodyFont = `${general.style.fontFamily}, sans-serif`;
const accentFont = `${sugar.style.fontFamily}, cursive`;
const buttonFont = `${altGeneral.style.fontFamily}, sans-serif`;

export type AppColorMode = "light" | "dark";

export function createAppTheme(mode: AppColorMode = "light") {
  const isDark = mode === "dark";

  return createTheme({
    palette: {
      mode,
      primary: {
        main: "#ff4401",
        contrastText: isDark ? "#fff3ec" : "#000000"
      },
      secondary: {
        main: "#f50057"
      },
      background: {
        default: isDark ? "#1b1412" : "#fff3ec",
        paper: isDark ? "#2a201d" : "#ffffff"
      },
      text: {
        primary: isDark ? "#fff1ea" : "#171717",
        secondary: isDark ? "#e2c7bb" : "#4b4b4b"
      },
      divider: isDark ? "#5f4337" : "#ffccb5"
    },
    typography: {
      fontFamily: bodyFont,
      body1: { fontFamily: bodyFont },
      body2: { fontFamily: accentFont },
      h1: { fontFamily: titleFont, fontWeight: 800 },
      h2: { fontFamily: titleFont, fontWeight: 800 },
      h3: { fontFamily: titleFont, fontWeight: 800 },
      h4: { fontFamily: titleFont, fontWeight: 800 },
      h5: { fontFamily: titleFont, fontWeight: 800 },
      h6: { fontFamily: titleFont, fontWeight: 800 },
      subtitle1: { fontFamily: titleFont },
      subtitle2: { fontFamily: titleFont },
      overline: { fontFamily: bodyFont },
      caption: { fontFamily: buttonFont },
      button: { fontFamily: buttonFont }
    },
    components: {
      MuiAppBar: {
        styleOverrides: {
          colorInherit: {
            backgroundColor: isDark ? "#261b17" : "#fff8f4",
            color: isDark ? "#fff1ea" : "#1f1f1f"
          }
        }
      },
      MuiCard: {
        styleOverrides: {
          root: {
            backgroundColor: isDark ? "#2f2320" : "#fffdfb",
            borderColor: isDark ? "#5f4337" : "#ffd9c8"
          }
        }
      },
      MuiAlert: {
        styleOverrides: {
          root: {
            borderRadius: 10
          },
          standardInfo: {
            backgroundColor: isDark ? "#3f2d27" : "#ffe9de",
            color: isDark ? "#ffe6db" : "#4b2b1f"
          },
          standardSuccess: {
            backgroundColor: isDark ? "#473127" : "#ffe3d4",
            color: isDark ? "#ffe8dc" : "#4a2a1f"
          }
        }
      },
      MuiButton: {
        styleOverrides: {
          root: {
            borderRadius: 10,
            textTransform: "none"
          }
        }
      },
      MuiContainer: {
        styleOverrides: {
          root: {
            position: "relative",
            zIndex: 1
          }
        }
      }
    }
  });
}
