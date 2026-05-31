import NextLink from "next/link";
import Head from "next/head";
import localFont from "next/font/local";
import { useRouter } from "next/router";
import { useEffect, useMemo } from "react";
import { gql } from "@apollo/client";
import { useQuery } from "@apollo/client/react";
import {
  Box,
  Button,
  Container,
  IconButton,
  Stack,
  Typography
} from "@mui/material";
import QuestionMarkIcon from "@mui/icons-material/QuestionMark";
import QuestionAnswerIcon from "@mui/icons-material/QuestionAnswer";
import { useTranslation } from "react-i18next";
import { keyframes } from "@mui/system";
import type { AuthStatus } from "../features/auth/AuthProvider";

import { useAuth } from "../features/auth/AuthProvider";

const LANGUAGE_STORAGE_KEY = "mutuity-language";

const LANDING_TOPELA_ACCOUNTS_QUERY = gql`
  query LandingTopelaAccounts($first: Int = 50) {
    latestLandingAccounts(limitCount: $first) {
      nodes {
        id
        displayName
        externalSubject
        avatarUrl
      }
    }
  }
`;

type LandingTopelaAccountsData = {
  latestLandingAccounts: {
    nodes: Array<{
      id: string;
      displayName: string | null;
      externalSubject: string;
      avatarUrl: string | null;
    }>;
  } | null;
};

type TopelaAccountNode = NonNullable<LandingTopelaAccountsData["latestLandingAccounts"]>["nodes"][number];

const LANDING_TOPELA_ITEMS_QUERY = gql`
  query LandingTopelaItems($first: Int = 10) {
    latestLandingItems(limitCount: $first) {
      nodes {
        id
        kind
        title
        imageUrl
        creatorDisplayName
        createdAt
      }
    }
  }
`;

type LandingTopelaItemsData = {
  latestLandingItems: {
    nodes: Array<{
      id: string;
      kind: string;
      title: string;
      imageUrl: string | null;
      creatorDisplayName: string | null;
      createdAt: string;
    }>;
  } | null;
};

type TopelaItemNode = NonNullable<LandingTopelaItemsData["latestLandingItems"]>["nodes"][number];

export function shouldRedirectFromRoot(status: AuthStatus, isAuthenticated: boolean) {
  return status !== "loading" && isAuthenticated;
}

export function shouldRenderGuestActions(status: AuthStatus, isAuthenticated: boolean) {
  return status !== "loading" && !isAuthenticated;
}

const titleFont = localFont({ src: "../fonts/LTMakeup-Regular.otf" });
const sugarFont = localFont({ src: "../fonts/ComicJensFreePro-Regular.ttf" });
const generalFont = localFont({ src: "../fonts/renner-book.otf" });

interface SectionTitleRun { color: string; text: string }
function SectionTitle({ lines }: { lines: Array<Array<SectionTitleRun>> }) {
  return (
    <Box sx={{ marginBottom: "2rem", transform: "rotate(-3.7deg)", textAlign: "center" }}>
      {lines.map((line, i) => (
        <Box key={i}>
          {line.map((run, j) => (
            <Typography
              key={j}
              component="span"
              sx={{
                color: run.color,
                fontFamily: titleFont.style.fontFamily,
                fontSize: { xs: "2rem", md: "2.5rem" },
                fontWeight: 800,
                lineHeight: 1,
                textTransform: "uppercase"
              }}
            >
              {run.text}
            </Typography>
          ))}
        </Box>
      ))}
    </Box>
  );
}

const appearThreeOne = keyframes`
  0% { opacity: 0; }
  3% { opacity: 1; }
  30% { opacity: 1; }
  33% { opacity: 0; }
`;

const appearTwoOne = keyframes`
  0% { opacity: 0; }
  5% { opacity: 1; }
  45% { opacity: 1; }
  50% { opacity: 0; }
`;

const appearTwoTwo = keyframes`
  50% { opacity: 0; }
  55% { opacity: 1; }
  95% { opacity: 1; }
  100% { opacity: 0; }
`;

const appearThreeTwo = keyframes`
  34% { opacity: 0; }
  36% { opacity: 1; }
  63% { opacity: 1; }
  66% { opacity: 0; }
`;

const appearThreeThree = keyframes`
  67% { opacity: 0; }
  70% { opacity: 1; }
  97% { opacity: 1; }
  100% { opacity: 0; }
`;

function TopelaCyclingColumn({ images }: { images: [string, string, string] }) {
  const { t } = useTranslation("home");

  return (
    <Box sx={{ height: { xs: 150, md: 200 }, position: "relative", width: { xs: 150, md: 200 } }}>
      <Box sx={{ animation: `${appearThreeOne} 15s linear 0s infinite`, opacity: 0, position: "absolute" }}>
        <img alt={t("alts.character")} src={images[0]} style={{ height: "100%", width: "100%" }} />
      </Box>
      <Box sx={{ animation: `${appearThreeTwo} 15s linear 0s infinite`, opacity: 0, position: "absolute" }}>
        <img alt={t("alts.character")} src={images[1]} style={{ height: "100%", width: "100%" }} />
      </Box>
      <Box sx={{ animation: `${appearThreeThree} 15s linear 0s infinite`, opacity: 0, position: "absolute" }}>
        <img alt={t("alts.character")} src={images[2]} style={{ height: "100%", width: "100%" }} />
      </Box>
    </Box>
  );
}

function TopelaAvatarRoundRobin({ avatarUrls }: { avatarUrls: string[] }) {
  const { t } = useTranslation("home");

  if (avatarUrls.length === 0) {
    return null;
  }

  if (avatarUrls.length === 1) {
    return <img alt={t("alts.avatar")} src={avatarUrls[0]} style={{ borderRadius: "50%", height: "100%", objectFit: "cover", position: "absolute", width: "100%" }} />;
  }

  if (avatarUrls.length === 2) {
    return (
      <Box sx={{ height: "100%", position: "absolute", width: "100%" }}>
        <Box sx={{ animation: `${appearTwoOne} 15s linear 0s infinite`, opacity: 0 }}>
          <img alt={t("alts.avatar")} src={avatarUrls[0]} style={{ borderRadius: "50%", height: "100%", objectFit: "cover", position: "absolute", width: "100%" }} />
        </Box>
        <Box sx={{ animation: `${appearTwoTwo} 15s linear 0s infinite`, opacity: 0 }}>
          <img alt={t("alts.avatar")} src={avatarUrls[1]} style={{ borderRadius: "50%", height: "100%", objectFit: "cover", position: "absolute", width: "100%" }} />
        </Box>
      </Box>
    );
  }

  return (
    <Box sx={{ height: "100%", position: "absolute", width: "100%" }}>
      <Box sx={{ animation: `${appearThreeOne} 15s linear 0s infinite`, opacity: 0 }}>
        <img alt={t("alts.avatar")} src={avatarUrls[0]} style={{ borderRadius: "50%", height: "100%", objectFit: "cover", position: "absolute", width: "100%" }} />
      </Box>
      <Box sx={{ animation: `${appearThreeTwo} 15s linear 0s infinite`, opacity: 0 }}>
        <img alt={t("alts.avatar")} src={avatarUrls[1]} style={{ borderRadius: "50%", height: "100%", objectFit: "cover", position: "absolute", width: "100%" }} />
      </Box>
      <Box sx={{ animation: `${appearThreeThree} 15s linear 0s infinite`, opacity: 0 }}>
        <img alt={t("alts.avatar")} src={avatarUrls[2]} style={{ borderRadius: "50%", height: "100%", objectFit: "cover", position: "absolute", width: "100%" }} />
      </Box>
    </Box>
  );
}

function TopelaSketchyCircleSvg() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 1300 1300"
      xmlns="http://www.w3.org/2000/svg"
      style={{ height: "100%", position: "absolute", width: "100%" }}
    >
      <path
        fill="rgb(255, 68, 1)"
        d="M -11.7,-3 0,1300 H 1300 V 0 Z m 1282.4,696.4 c -2,17.7 -2.2,35.6 -4.3,53.3 -4.4,37.4 -12.8,73.5 -34.8,105 -9.8,14 -20.6,27 -32.8,39 -2.2,2.2 -3.1,3.9 -1.8,7.2 4.8,12.3 3.6,24.8 -0.1,37.2 -8.9,29.8 -23.8,56.7 -40.1,82.9 -62.4,100.4 -148.3,173.7 -257,219.8 -28.9,12.3 -58.4,23.3 -89.3,30.2 -10.7,2.4 -17,-3.4 -14.8,-14.4 0.7,-3.6 3.2,-5.2 6.5,-6 9.4,-2.3 18.7,-4.7 27.9,-7.8 5.1,-1.8 9.7,-4.2 14.3,-7.1 2.7,-1.7 2.6,-3.3 0.9,-5.6 -4.8,-6.4 -11.3,-8.3 -18.9,-7.9 -9.1,0.5 -17.6,3.5 -26.3,5.6 -8.8,2.1 -17.4,3.2 -26.5,3.1 -29.9,-0.6 -59.6,1.7 -87.7,13.6 -10.9,4.6 -21.2,10.3 -31.3,17.6 5.2,2.7 10.5,3 15.6,3.6 11.6,1.5 23.3,1.2 35,1.1 5.5,-0.1 6.5,1.2 5.7,6.5 -1.6,9.7 -6.4,13.6 -16.1,14.3 -22.7,1.7 -45.3,2.1 -67.9,-0.1 -81.5,-7.7 -159.3,-28.1 -232.6,-65.4 -46.4,-23.7 -86.9,-54.3 -120.1,-94.4 -14.8,-17.9 -32.8,-32.1 -49.8,-47.5 C 165.2,1024 116.6,962.4 81.3,890.9 54.6,836.7 37.6,779.5 30.7,719.3 25.5,674.6 25,629.9 29,585.1 c 3,-34 9.5,-67.5 16.4,-101 7.9,-38.5 18.3,-76 34.6,-111.8 16.2,-35.6 40.3,-65.7 66.7,-94.2 22,-23.7 44.6,-46.8 68.1,-69 11,-10.5 21.1,-21.9 29.3,-34.7 12.2,-19.1 27.6,-34.6 46,-47.9 23.5,-17 47,-33.9 73,-46.9 41.4,-20.8 83.3,-40.1 128.9,-50.4 19.9,-4.5 40.2,-5.9 60.2,-8.8 26.4,-3.9 52.9,-6 79.7,-5 34.8,1.3 66.5,12.3 96.5,29.2 4.8,2.7 9.5,5.5 14.2,8.4 1.9,1.2 3.3,1.6 5.4,0.2 12.7,-8.3 26.8,-9.4 41.3,-8 35.6,3.6 69.4,14.1 102.7,26.6 106.3,40 193.8,105.3 261.2,196.8 18.4,25 35.9,50.9 49.5,79 4.8,9.9 2.6,15 -8.1,17.4 -4.5,1 -7.7,-0.3 -9.9,-4.5 -4.4,-8.2 -8.9,-16.4 -13.5,-24.5 -2.5,-4.4 -5.7,-8.2 -9.3,-11.7 -4.4,-4.3 -5.4,-4.2 -9,1 -4.8,7 -3.6,14.2 -0.7,21.5 5.5,13.8 14,25.7 24.4,36.2 12.7,12.8 25.2,25.7 33.3,42.1 3.6,7.3 6.9,14.7 10.7,22.9 3,-6 7.8,-4.4 11.8,-4 5.7,0.6 10.1,3.6 11.8,9.3 4.1,13.5 8.3,27 11.3,40.9 5.8,27 8.2,54.4 9.6,81.8 0.9,17 4.6,33.6 5.9,50.6 1.4,22.2 2.2,44.4 -0.3,66.8 z"
      />
    </svg>
  );
}

function TopelaAvatarBubble({ avatarUrls, index }: { avatarUrls: string[]; index: number }) {
  const largestBubbleSize = 200;
  const smallestBubbleSize = 112;
  const highestPosition = -75;
  const lowestPosition = 325;
  const mostLeftPosition = -100;
  const leastLeftPosition = 350;

  let lgTop: number;
  let lgLeft: number;

  if (index === 1) {
    lgTop = highestPosition;
    lgLeft = leastLeftPosition;
  } else if (index === 2) {
    lgTop = highestPosition + (lowestPosition - highestPosition) / 2;
    lgLeft = mostLeftPosition;
  } else {
    lgTop = lowestPosition;
    lgLeft = leastLeftPosition * 0.8;
  }

  return (
    <Box
      sx={{
        height: {
          lg: `${largestBubbleSize}px`,
          md: `${smallestBubbleSize + ((largestBubbleSize - smallestBubbleSize) / 2)}px`,
          xs: `${smallestBubbleSize}px`
        },
        left: {
          lg: `${lgLeft}px`,
          md: `${lgLeft * 0.75}px`,
          xs: `${lgLeft * 0.5}px`
        },
        position: "absolute",
        top: {
          lg: `${lgTop}px`,
          md: `${lgTop * 0.75}px`,
          xs: `${lgTop * 0.5}px`
        },
        width: {
          lg: `${largestBubbleSize}px`,
          md: `${smallestBubbleSize + ((largestBubbleSize - smallestBubbleSize) / 2)}px`,
          xs: `${smallestBubbleSize}px`
        }
      }}
    >
      <TopelaAvatarRoundRobin avatarUrls={avatarUrls} />
      <TopelaSketchyCircleSvg />
    </Box>
  );
}

function TopelaItemsGallerySection({ items }: { items: TopelaItemNode[] }) {
  const { t } = useTranslation("home");

  if (items.length === 0) {
    return null;
  }

  return (
    <Stack sx={{ pb: "4rem", pt: "2rem" }}>
      <Stack sx={{ alignItems: "center", mb: "2rem", transform: "rotate(-2.1deg)" }}>
        <Typography sx={{ color: "#fff", fontFamily: titleFont.style.fontFamily, fontSize: 36, fontWeight: 400, lineHeight: 1, textTransform: "uppercase" }}>
          {t("itemsGallery.headingLine1")}
        </Typography>
        <Typography sx={{ color: "#000", fontFamily: titleFont.style.fontFamily, fontSize: 36, fontWeight: 400, lineHeight: 1, textTransform: "uppercase" }}>
          {t("itemsGallery.headingLine2")}
        </Typography>
      </Stack>
      <Box sx={{
        alignSelf: "stretch",
        display: "flex",
        flexDirection: "row",
        flexWrap: "wrap",
        gap: "1rem",
        justifyContent: "center",
        px: "1rem"
      }}>
        {items.map((item, idx) => (
          <Box key={idx} component="a"
            href={item.kind === "resource" ? `/app/resources/${item.id}` : `/app/needs/${item.id}`}
            sx={{
              borderWidth: 2,
              borderColor: "#000",
              borderStyle: "solid",
              flex: "0 1 18%",
              textDecoration: "none",
              "@media (max-width: 1200px)": { flex: "0 1 28%" },
              "@media (max-width: 900px)": { flex: "0 1 44%" },
              "@media (max-width: 600px)": { flex: "0 1 100%" }
            }}
          >
            <Typography textAlign="center"
              sx={{
                backgroundColor: "#fef0e3",
                borderBottom: "2px solid #000",
                color: "#000",
                fontFamily: sugarFont.style.fontFamily,
                fontSize: 14,
                px: "0.25rem",
                py: "0.1rem"
              }}
            >{item.title}</Typography>
            {item.imageUrl && (
              <img
                alt={item.title}
                src={item.imageUrl}
                style={{ display: "block", width: "100%" }}
              />
            )}
            <Typography textAlign="center"
              sx={{
                backgroundColor: "#fef0e3",
                borderTop: "2px solid #000",
                color: "#000",
                fontFamily: sugarFont.style.fontFamily,
                fontSize: 14,
                px: "0.25rem",
                py: "0.1rem"
              }}
            >{item.kind === "resource" ? t("itemsGallery.proposedBy") : t("itemsGallery.requestedBy")} {item.creatorDisplayName ?? "?"}</Typography>
          </Box>
        ))}
      </Box>
    </Stack>
  );
}

function TopelaAccountsGallerySection({ accounts }: { accounts: TopelaAccountNode[] }) {
  const { t } = useTranslation("home");

  const logoBatches: string[][] = [[], [], []];

  accounts.slice(0, 9).forEach((account, idx) => {
    const avatarUrl = account.avatarUrl;
    if (!avatarUrl) {
      return;
    }

    const batchIndex = idx % 3;
    if (logoBatches[batchIndex].length < 3) {
      logoBatches[batchIndex].push(avatarUrl);
    }
  });

  if (accounts.length === 0) {
    return null;
  }

  return (
    <Stack sx={{ pb: "4rem", pt: "3rem" }}>
      <Stack sx={{ alignItems: "center", mb: "4rem", transform: "rotate(3.19deg)" }}>
        <Typography sx={{ color: "#fff", fontFamily: titleFont.style.fontFamily, fontSize: 36, fontWeight: 400, lineHeight: 1, textTransform: "uppercase" }}>
          {t("accountsGallery.headingLine1")}
        </Typography>
        <Typography sx={{ color: "#fff", fontFamily: titleFont.style.fontFamily, fontSize: 36, fontWeight: 400, lineHeight: 1, textTransform: "uppercase" }}>
          {t("accountsGallery.headingLine2")}
        </Typography>
        <Typography sx={{ color: "#000", fontFamily: sugarFont.style.fontFamily, fontSize: 24, fontWeight: 400, pt: "1rem" }}>
          {t("accountsGallery.subheading")}
        </Typography>
      </Stack>

      <Stack direction="row" justifyContent="center">
        <Stack
          sx={{
            flex: { md: "0 0 300px", sm: "0 0 300px", xs: "0 0 200px", lg: "0 0 400px" },
            position: "relative"
          }}
        >
          {logoBatches[0].length > 0 ? <TopelaAvatarBubble avatarUrls={logoBatches[0]} index={1} /> : null}
          {logoBatches[1].length > 0 ? <TopelaAvatarBubble avatarUrls={logoBatches[1]} index={2} /> : null}
          {logoBatches[2].length > 0 ? <TopelaAvatarBubble avatarUrls={logoBatches[2]} index={3} /> : null}
          <img alt={t("alts.hands")} src="/topela/stair-hands.svg" style={{ width: "100%" }} />
        </Stack>
      </Stack>
    </Stack>
  );
}

interface TeamMemberProps {
  firstName: string;
  fullName: string;
  imageUrl: string;
  title: string;
}

function TeamMemberCard({ firstName, fullName, imageUrl, title }: TeamMemberProps) {
  return (
    <Stack sx={{ width: { xs: "300px", lg: "350px", xl: "500px" } }}>
      <img alt={firstName} src={imageUrl} />
      <Typography
        sx={{
          color: "#000",
          fontFamily: titleFont.style.fontFamily,
          fontSize: 24,
          fontWeight: 400,
          lineHeight: 1,
          textAlign: "center",
          textTransform: "uppercase"
        }}
      >
        {fullName}
      </Typography>
      <Typography
        sx={{
          color: "#000",
          fontFamily: sugarFont.style.fontFamily,
          fontSize: 20,
          fontWeight: 400,
          textAlign: "center"
        }}
      >
        {title}
      </Typography>
    </Stack>
  );
}

interface RoadmapStepProps {
  done?: boolean;
  linkUrl?: string;
  leftText: string;
  rightTextDetail: string;
  rightTextTitle: string;
}

function RoadmapStepStone({ done, leftText, linkUrl, rightTextDetail, rightTextTitle }: RoadmapStepProps) {
  const { t } = useTranslation("home");

  return (
    <Stack direction="row">
      <Stack justifyContent="center" sx={{ flex: "0 0 30%" }}>
        <Typography
          sx={{
            color: "#000",
            fontFamily: sugarFont.style.fontFamily,
            fontSize: { xs: 8, md: 12, lg: 22 },
            fontWeight: "bolder",
            lineHeight: 1,
            textAlign: "right"
          }}
        >
          {leftText}
        </Typography>
      </Stack>
      <Stack alignItems="center" justifyContent="center" sx={{ flex: "0 0 20%" }}>
        <Box sx={{ width: { xs: "2rem", md: "3rem", lg: "4rem" } }}>
          <img alt={done ? t("alts.done") : t("alts.todo")} src={done ? "/topela/roadmap/check.svg" : "/topela/roadmap/check-empty.svg"} />
        </Box>
      </Stack>
      <Stack sx={{ flex: "0 0 50%" }}>
        <Typography
          sx={{
            color: "#000",
            fontFamily: titleFont.style.fontFamily,
            fontSize: { xs: 16, md: 24, lg: 22 },
            fontWeight: "bolder",
            textTransform: "uppercase"
          }}
        >
          {rightTextTitle}
          {linkUrl ? (
            <NextLink href={linkUrl} style={{ marginLeft: "1rem", textDecoration: "underline", textTransform: "none" }}>
              {t("roadmap.infoLink")}
            </NextLink>
          ) : null}
        </Typography>
        <Typography
          sx={{
            color: "#000",
            fontFamily: sugarFont.style.fontFamily,
            fontSize: { xs: 8, md: 12, lg: 22 },
            fontWeight: "bolder",
            lineHeight: 1
          }}
        >
          {rightTextDetail}
        </Typography>
      </Stack>
    </Stack>
  );
}

function TopelaRoadmap() {
  const { t } = useTranslation("home");

  return (
    <Stack
      direction="row"
      justifyContent="center"
      sx={{
        px: { xs: "0.5rem", md: "1rem", lg: "3rem" },
        py: "3rem"
      }}
    >
      <Stack
        sx={{
          backgroundImage: "url('/topela/sketchy-poster.svg')",
          backgroundOrigin: "border-box",
          backgroundPosition: "top",
          backgroundRepeat: "no-repeat",
          backgroundSize: "cover",
          flex: { xs: "0 0 95%", md: "0 0 80%", lg: "0 0 60%" },
          gap: "1rem",
          p: "2rem"
        }}
      >
        <Typography variant="h1" color="#000" textAlign="center" textTransform="uppercase">
          {t("roadmap.title")}
        </Typography>
        <RoadmapStepStone done leftText={t("roadmap.steps.step1.left")} rightTextDetail={t("roadmap.steps.step1.detail")} rightTextTitle={t("roadmap.steps.step1.title")} />
        <RoadmapStepStone done leftText={t("roadmap.steps.step2.left")} rightTextDetail={t("roadmap.steps.step2.detail")} rightTextTitle={t("roadmap.steps.step2.title")} />
        <RoadmapStepStone done leftText={t("roadmap.steps.step3.left")} rightTextDetail={t("roadmap.steps.step3.detail")} rightTextTitle={t("roadmap.steps.step3.title")} />
        <RoadmapStepStone done leftText={t("roadmap.steps.step4.left")} rightTextDetail={t("roadmap.steps.step4.detail")} rightTextTitle={t("roadmap.steps.step4.title")} />
        <RoadmapStepStone done leftText={t("roadmap.steps.step5.left")} rightTextDetail={t("roadmap.steps.step5.detail")} rightTextTitle={t("roadmap.steps.step5.title")} />
        <RoadmapStepStone
          leftText={t("roadmap.steps.step6.left")}
          linkUrl="/collectif"
          rightTextDetail={t("roadmap.steps.step6.detail")}
          rightTextTitle={t("roadmap.steps.step6.title")}
        />
      </Stack>
    </Stack>
  );
}

export default function HomePage() {
  const router = useRouter();
  const { session, status } = useAuth();
  const { t, i18n } = useTranslation("home");
  const {
    data: topelaLatestAccountsData
  } = useQuery<LandingTopelaAccountsData>(LANDING_TOPELA_ACCOUNTS_QUERY);
  const {
    data: topelaLatestItemsData
  } = useQuery<LandingTopelaItemsData>(LANDING_TOPELA_ITEMS_QUERY);

  const topelaLatestAccounts = useMemo(() => {
    return topelaLatestAccountsData?.latestLandingAccounts?.nodes ?? [];
  }, [topelaLatestAccountsData]);
  const topelaLatestItems = topelaLatestItemsData?.latestLandingItems?.nodes ?? [];

  useEffect(() => {
    if (shouldRedirectFromRoot(status, session.authenticated)) {
      void router.replace("/app");
    }
  }, [router, session.authenticated, status]);

  const currentLanguage = i18n.language.toLowerCase().startsWith("en") ? "en" : "fr";

  const handleLanguageChange = (language: "en" | "fr") => {
    if (currentLanguage === language) {
      return;
    }

    if (typeof window !== "undefined") {
      window.localStorage.setItem(LANGUAGE_STORAGE_KEY, language);
    }

    void i18n.changeLanguage(language);
  };

  return (
    <Box
      sx={{
        backgroundColor: "#ff4401",
        minHeight: "100vh"
      }}
    >
      <Head>
        <title>{t("pageTitle")}</title>
        <link href="/favicon.ico" rel="icon" />
      </Head>

      <Stack direction="row" spacing={1} sx={{ position: "absolute", right: { xs: 8, md: 16 }, top: { xs: 8, md: 16 }, zIndex: 2 }}>
        <Button
          onClick={() => handleLanguageChange("fr")}
          size="small"
          sx={{
            bgcolor: currentLanguage === "fr" ? "#000" : "rgba(255, 255, 255, 0.6)",
            color: currentLanguage === "fr" ? "#fff" : "#000",
            minWidth: "2.5rem"
          }}
          variant={currentLanguage === "fr" ? "contained" : "text"}
        >
          FR
        </Button>
        <Button
          onClick={() => handleLanguageChange("en")}
          size="small"
          sx={{
            bgcolor: currentLanguage === "en" ? "#000" : "rgba(255, 255, 255, 0.6)",
            color: currentLanguage === "en" ? "#fff" : "#000",
            minWidth: "2.5rem"
          }}
          variant={currentLanguage === "en" ? "contained" : "text"}
        >
          EN
        </Button>
      </Stack>

      <Stack alignItems="center" spacing={5}>
        <Box>
          <img alt={t("alts.logo")} src="/topela/logo-topela.svg" style={{ maxWidth: "100%", width: 360 }} />
        </Box>

        <Stack alignItems="flex-start" direction={{ xs: "column", lg: "row" }} justifyContent="center" spacing={3}>
          <Stack spacing={5} sx={{ maxWidth: 700 }} paddingBottom={{ xs: 2, md: 0 }}>
            <SectionTitle lines={[
              [{ color: "#000", text: t("hero.titleLine1Black") }, { color: "#fff", text: t("hero.titleLine1White") }],
              [{ color: "#000", text: t("hero.titleLine2Black") }, { color: "#fff", text: t("hero.titleLine2White") }]
            ]} />

            <Box sx={{ maxWidth: 680, px: { xs: 0, md: 2 }, textAlign: "center" }}>
              <Typography sx={{ color: "#ffffff", fontFamily: sugarFont.style.fontFamily, fontSize: 18 }}>
                {t("hero.bodyLine1")}
              </Typography>
              <Typography sx={{ color: "#000000", fontFamily: sugarFont.style.fontFamily, fontSize: 18, mt: 1 }}>
                {t("hero.bodyLine2")}
              </Typography>
            </Box>

            <Button
              endIcon={<QuestionAnswerIcon />}
              href="https://linktr.ee/topela"
              startIcon={<QuestionMarkIcon />}
              sx={{
                alignSelf: "center",
                borderColor: "#cccccc",
                borderRadius: 3,
                color: "#ffffff",
                fontFamily: titleFont.style.fontFamily,
                fontSize: { xs: "1rem", md: "1.35rem" },
                mt: 2,
                textTransform: "none"
              }}
              target="_blank"
              variant="outlined"
            >
              {t("hero.faq")}
            </Button>
          </Stack>

          <Box
            sx={{
              display: { xs: "none", lg: "block" },
              flex: "0 0 380px",
              maxWidth: 380,
              transform: "rotate(12deg)"
            }}
          >
            <img
              alt={t("alts.phone")}
              src="/topela/phone.png"
              style={{ marginBottom: -300, maxWidth: 380, objectFit: "contain", position: "relative", top: -100, width: "100%" }}
            />
          </Box>
        </Stack>
      </Stack>

      <Stack
        alignItems="center"
        spacing={3}
        sx={theme => ({
          backgroundColor: "#fcf5ef",
          position: "relative",
          px: { xs: 2, md: 4 },
          py: { xs: 4 },
          width: "100%",
          [theme.breakpoints.up("md")]: {
            backgroundColor: "transparent",
            backgroundImage: "url('/topela/fond-180.svg')",
            backgroundOrigin: "border-box",
            backgroundPosition: "top",
            backgroundRepeat: "no-repeat",
            backgroundSize: "130% 100%",
            py: "8rem"
          }
        })}
      >
        <SectionTitle lines={[
          [{ color: "#000", text: t("audience.titleLine1") }],
          [{ color: "#ff4401", text: t("audience.titleLine2") }]
        ]} />

        <Stack alignItems="center" direction={{ xs: "column", md: "row" }} justifyContent="center" spacing={3}>
          <Stack direction="row" spacing={2} flexWrap="wrap" justifyContent="center">
            <TopelaCyclingColumn
              images={[
                "/topela/toppers/handyman.svg",
                "/topela/toppers/painter.svg",
                "/topela/toppers/pastry-chef.svg"
              ]}
            />
            <TopelaCyclingColumn
              images={[
                "/topela/toppers/gardener.svg",
                "/topela/toppers/dev.svg",
                "/topela/toppers/jewelry-maker.svg"
              ]}
            />
            <TopelaCyclingColumn
              images={[
                "/topela/toppers/babysitter.svg",
                "/topela/toppers/bike-repairer.svg",
                "/topela/toppers/scout.svg"
              ]}
            />
          </Stack>
        </Stack>

        <Typography sx={{ color: "#000000", fontFamily: sugarFont.style.fontFamily, fontSize: 18, maxWidth: 360, textAlign: "center" }}>
          {t("audience.body")}
        </Typography>
      </Stack>

      <Container maxWidth="lg">
        <Stack alignItems="center" spacing={2} sx={{ py: { xs: 3, md: 5 } }}>
          <Typography sx={{ color: "#000", fontFamily: sugarFont.style.fontFamily, fontSize: 28, textAlign: "center" }}>
            {t("downloads.title")}
          </Typography>
          <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
            <NextLink href="https://play.google.com/store/apps/details?id=com.topela" target="_blank">
              <img alt={t("alts.googlePlay")} src="/topela/google-play.svg" style={{ height: 80 }} />
            </NextLink>
            <NextLink href="https://apps.apple.com/be/app/tope-la/id6470202780" target="_blank">
              <img alt={t("alts.appStore")} src="/topela/app-store.svg" style={{ height: 80 }} />
            </NextLink>
          </Stack>

          <Typography sx={{ color: "#000", fontFamily: sugarFont.style.fontFamily, fontSize: 28, textAlign: "center" }}>
            {t("webVersion.title")}
          </Typography>
          <Stack position="relative">
            <NextLink href="/app" style={{ color: "#000", fontFamily: generalFont.style.fontFamily, fontSize: "1.7rem", fontWeight: 900, textDecoration: "none" }}>
              <Box sx={{ alignItems: "center", backgroundImage: "url('/topela/fond-180.svg')", display: "flex", height: 80, px: "2rem" }}>
                {t("webVersion.connect")}
              </Box>
            </NextLink>
          </Stack>

          <Typography sx={{ color: "#000", fontFamily: sugarFont.style.fontFamily, fontSize: 28, textAlign: "center" }}>
            {t("social.title")}
          </Typography>
          <Stack direction="row" spacing={2}>
            <IconButton component={NextLink} href="https://www.facebook.com/profile.php?id=61552205033496" target="_blank">
              <img alt={t("alts.facebook")} src="/topela/facebook.svg" style={{ height: 60, width: 60 }} />
            </IconButton>
            <IconButton component={NextLink} href="https://www.instagram.com/tope.la.app/" target="_blank">
              <img alt={t("alts.instagram")} src="/topela/instagram.svg" style={{ height: 60, width: 60 }} />
            </IconButton>
          </Stack>
        </Stack>
      </Container>

      <TopelaItemsGallerySection items={topelaLatestItems} />
      
      <Stack
        alignItems="center"
        py={4}
        sx={theme => ({
          backgroundColor: "#fcf5ef",
          position: "relative",
          [theme.breakpoints.up("md")]: {
            backgroundColor: "transparent",
            backgroundImage: "url('/topela/fond-180.svg')",
            backgroundOrigin: "border-box",
            backgroundPosition: "top",
            backgroundRepeat: "no-repeat",
            backgroundSize: "130% 100%",
            paddingTop: "8rem",
            paddingBottom: "3rem"
          }
        })}
      >
        <SectionTitle lines={[[{ color: "#ff4401", text: t("team.titleLine1") }, { color: "#000", text: t("team.titleLine2") }]]} />
        <Stack direction="row" flexWrap="wrap" gap="2rem" justifyContent="center">
          <TeamMemberCard
            firstName="Bertrand"
            fullName="Bertrand Larsy"
            imageUrl="/topela/portrait-bertrand.png"
            title={t("team.bertrandTitle")}
          />
          <TeamMemberCard
            firstName="Alice"
            fullName="Alice Beck"
            imageUrl="/topela/portrait-alice.png"
            title={t("team.aliceTitle")}
          />
        </Stack>
      </Stack>

      <TopelaAccountsGallerySection accounts={topelaLatestAccounts} />
      <TopelaRoadmap />

      <Container maxWidth="lg" sx={{ pb: 4 }}>
        <Stack direction="row" spacing={2} justifyContent="center">
          <Button sx={{ color: '#fff' }} component={NextLink} href="/privacy" size="small">
            {t("privacy")}
          </Button>
          <Button sx={{ color: '#fff' }} component={NextLink} href="/terms" size="small">
            {t("terms")}
          </Button>
        </Stack>
      </Container>
    </Box>
  );
}
