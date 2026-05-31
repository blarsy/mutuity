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

const BIGGEST_TITLE_FONT_SIZE = 2.5;
const TITLE_SIZE_RATIOS = [1, 0.8, 0.65, 0.55, 0.45, 0.4] as const;

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
      h1: {
        fontFamily: titleFont,
        fontSize: `${BIGGEST_TITLE_FONT_SIZE * TITLE_SIZE_RATIOS[0]}rem`,
        fontStretch: "expanded",
        fontWeight: 800,
        padding: "1.5rem 0",
        textTransform: "uppercase"
      },
      h2: {
        fontFamily: titleFont,
        fontSize: `${BIGGEST_TITLE_FONT_SIZE * TITLE_SIZE_RATIOS[1]}rem`,
        fontWeight: 800,
        padding: "1.2rem 0"
      },
      h3: {
        fontFamily: titleFont,
        fontSize: `${BIGGEST_TITLE_FONT_SIZE * TITLE_SIZE_RATIOS[2]}rem`,
        fontWeight: 800,
        padding: "1rem 0"
      },
      h4: {
        fontFamily: titleFont,
        fontSize: `${BIGGEST_TITLE_FONT_SIZE * TITLE_SIZE_RATIOS[3]}rem`,
        fontWeight: 800,
        padding: "0.5rem 0"
      },
      h5: {
        fontFamily: titleFont,
        fontSize: `${BIGGEST_TITLE_FONT_SIZE * TITLE_SIZE_RATIOS[4]}rem`,
        fontWeight: 800,
        padding: "0.3rem 0"
      },
      h6: {
        fontFamily: titleFont,
        fontSize: `${BIGGEST_TITLE_FONT_SIZE * TITLE_SIZE_RATIOS[5]}rem`,
        fontWeight: 800,
        padding: "0.2rem 0"
      },
      subtitle1: { fontFamily: titleFont },
      subtitle2: { fontFamily: titleFont },
      overline: { fontFamily: bodyFont },
      caption: { fontFamily: buttonFont },
      button: { fontFamily: buttonFont }
    },
    breakpoints: {
      values: {
        xs: 0,
        sm: 600,
        md: 900,
        lg: 1200,
        xl: 1650
      }
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
