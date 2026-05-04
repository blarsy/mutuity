import { useMutation, useQuery } from "@apollo/client/react";
import { Alert, Box, Button, Card, CardContent, Stack, Typography } from "@mui/material";
import { useTranslation } from "react-i18next";

import { getUserFacingGraphQLErrorMessage } from "../../services/graphql/errorMessages";
import { useAccountEventSignal } from "../../services/graphql/accountEvents";
import { ClaimConversationPanel } from "./ClaimConversationPanel";
import { NEED_CLAIM_MANAGEMENT_QUERY, SETTLE_NEED_CLAIM_MUTATION } from "./needClaims.queries";
import { NeedClaimStatusChip } from "./NeedClaimStatusChip";

type NeedClaimManagementPageProps = {
  claimId: string;
  currentAccountId: string;
  onClaimsChanged?: () => void;
};

type NeedClaimManagementData = {
  needClaimById: {
    id: string;
    needId: string;
    claimerAccountId: string;
    message: string | null;
    status: string;
    createdAt: string;
    updatedAt: string;
    settledAt: string | null;
    settledByAccountId: string | null;
    needByNeedId: {
      id: string;
      title: string;
      creatorAccountId: string;
      proposedTopesAmount: number | null;
    };
    accountByClaimerAccountId: {
      id: string;
      displayName: string | null;
      externalSubject: string;
    } | null;
    needClaimSettlementEventByNeedClaimId: {
      id: string;
      topesAmount: number;
      createdAt: string;
      settledByAccountId: string;
    } | null;
  } | null;
};

export function NeedClaimManagementPage({
  claimId,
  currentAccountId,
  onClaimsChanged
}: NeedClaimManagementPageProps) {
  const { t } = useTranslation("needs");
  const { data, loading, error, refetch } = useQuery<NeedClaimManagementData>(NEED_CLAIM_MANAGEMENT_QUERY, {
    fetchPolicy: "cache-and-network",
    nextFetchPolicy: "cache-first",
    variables: { claimId }
  });
  const [settleNeedClaim, { loading: settleLoading, error: settleError }] = useMutation(
    SETTLE_NEED_CLAIM_MUTATION
  );

  const claim = data?.needClaimById ?? null;
  const isCreator = claim?.needByNeedId.creatorAccountId === currentAccountId;
  const canSettle = isCreator && claim?.status === "OPEN";
  const errorMessage = getUserFacingGraphQLErrorMessage(error) ?? getUserFacingGraphQLErrorMessage(settleError);

  useAccountEventSignal(() => {
    void refetch();
  }, Boolean(currentAccountId));

  const handleSettle = async () => {
    if (!claim) {
      return;
    }

    await settleNeedClaim({
      variables: {
        input: {
          needClaimId: claim.id
        }
      }
    });

    await refetch();
    onClaimsChanged?.();
  };

  if (loading && !claim) {
    return <Alert severity="info">{t("claimManagement.loading")}</Alert>;
  }

  if (!claim) {
    return <Alert severity="warning">{t("claimManagement.notAvailable")}</Alert>;
  }

  const participantLabel =
    claim.accountByClaimerAccountId?.displayName ??
    claim.accountByClaimerAccountId?.externalSubject ??
    claim.claimerAccountId;

  return (
    <Stack spacing={2}>
      <Card variant="outlined">
        <CardContent>
          <Stack spacing={2}>
            <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" spacing={1}>
              <Box>
                <Typography variant="h6">{t("claimManagement.title")}</Typography>
                <Typography color="text.secondary" variant="body2">
                  {t("claimManagement.need")}: {claim.needByNeedId.title}
                </Typography>
                <Typography color="text.secondary" variant="body2">
                  {t("claimManagement.claimer")}: {participantLabel}
                </Typography>
              </Box>
              <NeedClaimStatusChip
                settledAt={claim.settledAt}
                status={claim.status}
                topesAmount={claim.needClaimSettlementEventByNeedClaimId?.topesAmount ?? null}
              />
            </Stack>

            {errorMessage ? <Alert severity="error">{errorMessage}</Alert> : null}

            {canSettle ? (
              <Alert severity="info">
                {t("claimManagement.settleInfo")}
              </Alert>
            ) : null}

            <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" spacing={1}>
              <Typography color="text.secondary" variant="body2">
                {claim.needByNeedId.proposedTopesAmount
                  ? t("claimManagement.topesAttached", { amount: claim.needByNeedId.proposedTopesAmount })
                  : t("claimManagement.noTopesAttached")}
              </Typography>

              {canSettle ? (
                <Button color="success" disabled={settleLoading} onClick={() => void handleSettle()} variant="contained">
                  {settleLoading ? t("claimManagement.settling") : t("claimManagement.settleButton")}
                </Button>
              ) : null}
            </Stack>
          </Stack>
        </CardContent>
      </Card>

      <ClaimConversationPanel claimId={claimId} currentAccountId={currentAccountId} />
    </Stack>
  );
}
