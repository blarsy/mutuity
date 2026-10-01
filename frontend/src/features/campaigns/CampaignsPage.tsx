import { useEffect, useMemo, useRef, useState } from "react";
import NextLink from "next/link";
import InfoIcon from "@mui/icons-material/Info";
import PublicIcon from "@mui/icons-material/Public";
import { useQuery } from "@apollo/client/react";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  IconButton,
  Stack,
  Tooltip,
  Typography
} from "@mui/material";
import { useTranslation } from "react-i18next";

import { useAuth } from "../auth/AuthProvider";
import { getUserFacingGraphQLErrorMessage } from "../../services/graphql/errorMessages";
import { buildCampaignExplainerSlides } from "./campaignExplainer";
import { INSPIRATION_CAMPAIGNS_QUERY, MY_CAMPAIGNS_CONNECTION_QUERY } from "./campaigns.queries";
import { RichTextContent } from "../../components/richText/RichTextContent";
import { resolveMobileStoreLinks } from "../../features/shared/mobileStoreLinks";
import type { MyCampaignsConnectionQuery, MyCampaignsConnectionQueryVariables, InspirationCampaignsQuery } from "../../graphql/generated";
import LightbulbIcon from "@mui/icons-material/Lightbulb";

type CampaignNode = {
  id: string;
  title: string;
  theme: string;
  moderationStatus: string;
  startAt: string;
  airdropAt: string;
  endAt: string;
  createdAt: string;
};

const PAGE_SIZE = 10;

function isCampaignActive(now: Date, startAtIso: string, endAtIso: string) {
  const startAt = new Date(startAtIso);
  const endAt = new Date(endAtIso);

  return now >= startAt && now <= endAt;
}

function isCampaignEnded(now: Date, endAtIso: string) {
  return now > new Date(endAtIso);
}

function canOpenPublicCampaign(moderationStatus: string) {
  return moderationStatus !== "PENDING" && moderationStatus !== "AWAITING_ADAPTATION";
}

type CampaignCardsProps = {
  campaigns: CampaignNode[];
  grayEnded: boolean;
  t: (key: string, options?: Record<string, unknown>) => string;
};

function CampaignCards({ campaigns, grayEnded, t }: CampaignCardsProps) {
  const now = new Date();

  return (
    <Grid container spacing={2} sx={{ mt: 1 }}>
      {campaigns.map(campaign => {
        const ended = isCampaignEnded(now, campaign.endAt);

        return (
          <Grid item key={campaign.id} xs={12}>
            <Card
              sx={grayEnded && ended ? { opacity: 0.55 } : undefined}
              variant="outlined"
            >
              <CardContent>
                <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" spacing={1}>
                  <Box>
                    <Stack alignItems="center" direction="row" sx={{ gap: "1rem" }}>
                      <Typography variant="h6">{campaign.title}</Typography>
                      {canOpenPublicCampaign(campaign.moderationStatus) ? (
                        <Tooltip title={t("page.openPublicCampaign")}>
                          <IconButton
                            aria-label={t("page.openPublicCampaign")}
                            component={NextLink}
                            href={`/campaigns/${campaign.id}`}
                            size="large"
                            sx={{
                              border: theme => `1px solid ${theme.palette.divider}`,
                              borderRadius: "9999px"
                            }}
                          >
                            <PublicIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      ) : null}
                    </Stack>
                    <Typography color="text.secondary" variant="caption">{t("labels.theme")}</Typography>
                    <RichTextContent html={campaign.theme} />
                  </Box>
                  <Stack alignItems="center" direction="row" spacing={1}>
                    <Stack direction="row" spacing={1}>
                      <Chip
                        color={isCampaignActive(now, campaign.startAt, campaign.endAt) ? "success" : "default"}
                        label={isCampaignActive(now, campaign.startAt, campaign.endAt) ? t("statuses.active") : ended ? t("statuses.ended") : t("statuses.upcoming")}
                        size="small"
                      />
                      <Chip label={campaign.moderationStatus} size="small" variant="outlined" />
                    </Stack>
                  </Stack>
                </Stack>

                <Stack direction={{ xs: "column", sm: "row" }} spacing={3} sx={{ mt: 2 }}>
                  <Typography variant="body2">{t("labels.created")}: {new Date(campaign.createdAt).toLocaleString()}</Typography>
                  <Typography variant="body2">{t("labels.start")}: {new Date(campaign.startAt).toLocaleString()}</Typography>
                  <Typography variant="body2">{t("labels.airdrop")}: {new Date(campaign.airdropAt).toLocaleString()}</Typography>
                  <Typography variant="body2">{t("labels.end")}: {new Date(campaign.endAt).toLocaleString()}</Typography>
                </Stack>

                <Stack direction="row" spacing={1} sx={{ mt: 2 }}>
                  <Button
                    component={NextLink}
                    href={`/campaigns/${campaign.id}/moderation`}
                    size="small"
                    variant="outlined"
                  >
                    {t("moderationNotes.openModeration")}
                  </Button>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        );
      })}
    </Grid>
  );
}

export default function CampaignsPage() {
  const { t } = useTranslation("campaigns");
  const { session, status } = useAuth();
  const loadMoreRef = useRef<HTMLDivElement | null>(null);
  const [isInspirationOpen, setIsInspirationOpen] = useState(false);
  const [isExplainerOpen, setIsExplainerOpen] = useState(false);
  const [explainerSlideIndex, setExplainerSlideIndex] = useState(0);
  const storeLinks = useMemo(() => resolveMobileStoreLinks(), []);
  const explainerSlides = useMemo(() => {
    const nextDestination = encodeURIComponent("/campaigns");

    return buildCampaignExplainerSlides(t, {
      isAuthenticated: session.authenticated,
      isCampaignCreator: false,
      moderationStatus: null,
      loginHref: `/login?next=${nextDestination}`,
      registerHref: `/register?next=${nextDestination}`,
      androidUrl: storeLinks.androidUrl,
      iosUrl: storeLinks.iosUrl
    });
  }, [session.authenticated, storeLinks.androidUrl, storeLinks.iosUrl, t]);
  const activeExplainerSlide = explainerSlides[explainerSlideIndex];

  const createCampaignHref = session.authenticated
    ? "/campaigns/create"
    : "/login?next=%2Fcampaigns%2Fcreate";

  const {
    data,
    loading,
    error,
    fetchMore
  } = useQuery<MyCampaignsConnectionQuery, MyCampaignsConnectionQueryVariables>(MY_CAMPAIGNS_CONNECTION_QUERY, {
    skip: !session.authenticated || !session.account?.id,
    fetchPolicy: "cache-and-network",
    variables: {
      creatorAccountId: session.account?.id ?? "",
      first: PAGE_SIZE
    }
  });

  const {
    data: inspirationData,
    loading: inspirationLoading,
    error: inspirationError
  } = useQuery<InspirationCampaignsQuery>(INSPIRATION_CAMPAIGNS_QUERY);

  const myCampaigns = data?.allCampaigns?.nodes ?? [];
  const hasNextPage = data?.allCampaigns?.pageInfo.hasNextPage ?? false;
  const endCursor = data?.allCampaigns?.pageInfo.endCursor ?? null;

  useEffect(() => {
    if (!loadMoreRef.current || !session.authenticated) {
      return;
    }

    const observer = new IntersectionObserver(entries => {
      const [entry] = entries;

      if (!entry?.isIntersecting || loading || !hasNextPage || !endCursor || !session.account?.id) {
        return;
      }

      void fetchMore({
        variables: {
          creatorAccountId: session.account.id,
          first: PAGE_SIZE,
          after: endCursor
        },
        updateQuery: (previousResult, { fetchMoreResult }) => {
          if (!fetchMoreResult || !previousResult.allCampaigns || !fetchMoreResult.allCampaigns) {
            return previousResult;
          }

          return {
            __typename: 'Query',
            allCampaigns: {
              ...fetchMoreResult.allCampaigns,
              nodes: [...previousResult.allCampaigns.nodes, ...fetchMoreResult.allCampaigns.nodes]
            }
          };
        }
      });
    });

    observer.observe(loadMoreRef.current);

    return () => {
      observer.disconnect();
    };
  }, [endCursor, fetchMore, hasNextPage, loading, session.account?.id, session.authenticated]);

  const errorMessage = getUserFacingGraphQLErrorMessage(error);
  const inspirationErrorMessage = getUserFacingGraphQLErrorMessage(inspirationError);

  const inspirationCampaigns = useMemo(() => {
    const now = new Date();
    const nodes = inspirationData?.allCampaigns?.nodes ?? [];

    const active = nodes.filter(node => isCampaignActive(now, node.startAt, node.endAt));
    const inactive = nodes.filter(node => !isCampaignActive(now, node.startAt, node.endAt));

    return [...active, ...inactive].slice(0, 10);
  }, [inspirationData?.allCampaigns?.nodes]);

  return (
    <Container maxWidth="md">
      <Box sx={{ py: 6 }}>
        <Typography component="h1" gutterBottom variant="h4">
          {t("page.title")}
        </Typography>

        <Stack direction={{ xs: "column", sm: "row" }} spacing={1} sx={{ mb: 2 }}>
          <Button component={NextLink} href={createCampaignHref} variant="contained">
            {t("page.launchCampaign")}
          </Button>
          <Button
            onClick={() => {
              setExplainerSlideIndex(0);
              setIsExplainerOpen(true);
            }}
            startIcon={<InfoIcon />}
            sx={{ mb: 2 }}
          >
            {t("page.whatAreCampaigns")}
          </Button>
        </Stack>


        <Button
          onClick={() => setIsInspirationOpen(true)}
          sx={{ mb: 3 }}
          startIcon={<LightbulbIcon />}
        >
          {t("page.seeInspiration")}
        </Button>

        {status === "loading" ? (
          <Alert severity="info" sx={{ mb: 2 }}>
            {t("authGuard.checking", { ns: "common" })}
          </Alert>
        ) : null}

        {!session.authenticated ? (
          <Alert severity="info" sx={{ mb: 2 }}>
            {t("page.signInHint")}
          </Alert>
        ) : null}

        {errorMessage ? <Alert severity="error">{errorMessage}</Alert> : null}

        {session.authenticated ? (
          <>
            {loading ? <Alert severity="info">{t("page.loadingMine")}</Alert> : null}

            {!loading && !errorMessage && myCampaigns.length === 0 ? (
              <Alert severity="info">{t("page.emptyMine")}</Alert>
            ) : null}

            <CampaignCards
              campaigns={myCampaigns}
              grayEnded
              t={t}
            />

            {hasNextPage ? (
              <Box ref={loadMoreRef} sx={{ display: "flex", justifyContent: "center", mt: 2 }}>
                <Chip label={t("page.loadingMore")} size="small" variant="outlined" />
              </Box>
            ) : null}
          </>
        ) : null}

        <Dialog fullWidth maxWidth="lg" onClose={() => setIsInspirationOpen(false)} open={isInspirationOpen}>
          <DialogTitle>{t("page.inspirationTitle")}</DialogTitle>
          <DialogContent>
            {inspirationLoading ? <Alert severity="info">{t("public.loading")}</Alert> : null}
            {inspirationErrorMessage ? <Alert severity="error">{inspirationErrorMessage}</Alert> : null}
            {!inspirationLoading && !inspirationErrorMessage && inspirationCampaigns.length === 0 ? (
              <Alert severity="info">{t("page.inspirationEmpty")}</Alert>
            ) : null}
            <CampaignCards campaigns={inspirationCampaigns} grayEnded={false} t={t} />
          </DialogContent>
        </Dialog>

        <Dialog
          fullWidth
          maxWidth="sm"
          onClose={() => setIsExplainerOpen(false)}
          open={isExplainerOpen}
        >
          <DialogTitle>{t("public.explainer.dialogTitle")}</DialogTitle>
          <DialogContent>
            <Stack spacing={2} sx={{ pt: 1 }}>
              <Typography component="h3" variant="h6">
                {activeExplainerSlide.title}
              </Typography>
              <Typography variant="body1">{activeExplainerSlide.body}</Typography>
              {activeExplainerSlide.details?.length ? (
                <Stack spacing={0.6}>
                  {activeExplainerSlide.details.map(detail => (
                    <Typography color="text.secondary" key={detail} variant="body2">
                      • {detail}
                    </Typography>
                  ))}
                </Stack>
              ) : null}
              {activeExplainerSlide.ctas?.length ? (
                <Stack direction={{ xs: "column", sm: "row" }} spacing={1.2}>
                  {activeExplainerSlide.ctas.map(cta => (
                    <Button
                      component={cta.external ? "a" : NextLink}
                      href={cta.href}
                      key={cta.label}
                      rel={cta.external ? "noreferrer" : undefined}
                      size="small"
                      target={cta.external ? "_blank" : undefined}
                      variant="outlined"
                    >
                      {cta.label}
                    </Button>
                  ))}
                </Stack>
              ) : null}
              <Typography color="text.secondary" variant="caption">
                {t("public.explainer.progress", {
                  current: explainerSlideIndex + 1,
                  total: explainerSlides.length
                })}
              </Typography>
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button
              disabled={explainerSlideIndex === 0}
              onClick={() => setExplainerSlideIndex(current => Math.max(0, current - 1))}
            >
              {t("public.explainer.previous")}
            </Button>
            <Button
              onClick={() => {
                if (explainerSlideIndex === explainerSlides.length - 1) {
                  setIsExplainerOpen(false);
                  return;
                }

                setExplainerSlideIndex(current => Math.min(explainerSlides.length - 1, current + 1));
              }}
              variant="contained"
            >
              {explainerSlideIndex === explainerSlides.length - 1
                ? t("public.explainer.close")
                : t("public.explainer.next")}
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </Container>
  );
}
