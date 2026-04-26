import { useState } from "react";
import { useMutation, useQuery } from "@apollo/client/react";
import { useRouter } from "next/router";
import { Alert, Box, Button, CircularProgress, Container, Stack, Typography } from "@mui/material";
import { useTranslation } from "react-i18next";

import { useRequireAuth } from "../../features/auth/requireAuth";
import {
  ClaimGrantDocument,
  ClaimGrantMutation,
  GetGrantForClaimDocument,
  GetGrantForClaimQuery
} from "../../graphql/generated";

type GrantInfo = NonNullable<NonNullable<GetGrantForClaimQuery["getGrantForClaim"]>["nodes"]>[number];
type ClaimOutcome = NonNullable<NonNullable<ClaimGrantMutation["claimGrant"]>["grantClaimResult"]>;

export default function GrantClaimPage() {
  const { t } = useTranslation("grants");
  const router = useRouter();
  const { isChecking, isRedirecting } = useRequireAuth();
  const grantId = typeof router.query.id === "string" ? router.query.id : null;

  const [outcome, setOutcome] = useState<ClaimOutcome | null>(null);

  const { data, loading: queryLoading } = useQuery(GetGrantForClaimDocument, {
    variables: { grantId },
    skip: !grantId || isChecking || isRedirecting
  });

  const [claimGrant, { loading: claimLoading }] = useMutation(ClaimGrantDocument, {
    onCompleted(result) {
      const claimResult = result?.claimGrant?.grantClaimResult ?? null;
      if (claimResult) {
        setOutcome(claimResult);
      }
    }
  });

  if (isChecking || isRedirecting) {
    return (
      <Container maxWidth="sm" sx={{ py: 6, textAlign: "center" }}>
        <CircularProgress />
      </Container>
    );
  }

  if (!grantId || queryLoading) {
    return (
      <Container maxWidth="sm" sx={{ py: 6, textAlign: "center" }}>
        <CircularProgress />
        <Typography variant="body2" sx={{ mt: 2 }}>
          {t("loading")}
        </Typography>
      </Container>
    );
  }

  const grant = data?.getGrantForClaim?.nodes?.[0] as GrantInfo | null | undefined;

  if (!grant) {
    return (
      <Container maxWidth="sm" sx={{ py: 6 }}>
        <Alert severity="warning">
          <Typography fontWeight={700}>{t("unavailable")}</Typography>
          <Typography variant="body2" sx={{ mt: 1 }}>
            {t("unavailableDescription")}
          </Typography>
        </Alert>
      </Container>
    );
  }

  const handleClaim = async () => {
    await claimGrant({ variables: { grantId } });
  };

  const isSuccess = outcome?.outcomeCode === "success";
  const isDenial = outcome !== null && !isSuccess;

  return (
    <Container maxWidth="sm" sx={{ py: 6 }}>
      <Stack spacing={3}>
        <Box>
          <Typography variant="h4" fontWeight={700}>
            {grant.title}
          </Typography>
          {grant.description && (
            <Typography variant="body1" sx={{ mt: 1 }}>
              {grant.description}
            </Typography>
          )}
        </Box>

        <Stack spacing={1}>
          <Typography variant="body2" color="text.secondary">
            {t("awardedAmount", { amount: grant.awardedTokenAmount })}
          </Typography>
          {grant.expiresAt && (
            <Typography variant="body2" color="text.secondary">
              {t("expiresAt", { date: new Date(grant.expiresAt).toLocaleDateString() })}
            </Typography>
          )}
          {grant.maxSuccessfulClaimCount != null && (
            <Typography variant="body2" color="text.secondary">
              {t("maxClaims", { count: grant.maxSuccessfulClaimCount })}
            </Typography>
          )}
        </Stack>

        {!outcome && (
          <Button
            variant="contained"
            size="large"
            onClick={() => void handleClaim()}
            disabled={claimLoading}
          >
            {claimLoading
              ? t("claiming")
              : t("claimButton", { amount: grant.awardedTokenAmount })}
          </Button>
        )}

        {isSuccess && outcome && (
          <Alert severity="success">
            {t("outcome.success", { amount: outcome.claimedAmount })}
          </Alert>
        )}

        {isDenial && outcome && (
          <Alert severity="warning">
            {t(`outcome.${outcome.outcomeCode}` as Parameters<typeof t>[0])}
          </Alert>
        )}
      </Stack>
    </Container>
  );
}
