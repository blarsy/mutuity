import { useMemo } from "react";
import { Alert, Box, Button, Card, CardContent, Chip, Divider, Stack, Typography } from "@mui/material";

import { ClaimConversationPanel } from "./ClaimConversationPanel";

type NeedClaimOverview = {
  id: string;
  needId: string;
  claimerAccountId: string;
  message: string | null;
  status: string;
  createdAt: string;
  updatedAt: string;
  settledAt: string | null;
  needByNeedId: {
    id: string;
    title: string;
    creatorAccountId: string;
  };
  accountByClaimerAccountId: {
    id: string;
    displayName: string | null;
    externalSubject: string;
  };
  claimConversationByNeedClaimId: {
    id: string;
    createdAt: string;
  } | null;
};

type NeedClaimNotificationOverview = {
  id: string;
  needClaimId: string;
  eventType: string;
  payload: {
    needId?: string;
    claimerAccountId?: string;
    status?: string;
  };
  createdAt: string;
  readAt: string | null;
};

type ClaimNotificationsPanelProps = {
  currentAccountId: string;
  claims: NeedClaimOverview[];
  notifications: NeedClaimNotificationOverview[];
  selectedClaimId: string | null;
  onSelectClaim: (claimId: string) => void;
};

function formatStatus(status: string) {
  return status.replaceAll("_", " ").toLowerCase();
}

export function ClaimNotificationsPanel({
  currentAccountId,
  claims,
  notifications,
  selectedClaimId,
  onSelectClaim
}: ClaimNotificationsPanelProps) {
  const incomingClaims = useMemo(
    () => claims.filter(claim => claim.needByNeedId.creatorAccountId === currentAccountId),
    [claims, currentAccountId]
  );
  const myClaims = useMemo(
    () => claims.filter(claim => claim.claimerAccountId === currentAccountId),
    [claims, currentAccountId]
  );

  if (incomingClaims.length === 0 && myClaims.length === 0 && notifications.length === 0) {
    return (
      <Alert severity="info" sx={{ mb: 3 }}>
        No claim activity yet. Once you claim a need or receive one on your own need, it will appear here.
      </Alert>
    );
  }

  return (
    <Stack spacing={2} sx={{ mb: 3 }}>
      <Card variant="outlined">
        <CardContent>
          <Stack spacing={2}>
            <Box>
              <Typography variant="h6">Claim activity</Typography>
              <Typography color="text.secondary" variant="body2">
                Track your own claims, incoming requests on your needs, and open the related conversation threads.
              </Typography>
            </Box>

            {incomingClaims.length > 0 ? (
              <Stack spacing={1.5}>
                <Typography variant="subtitle1">Incoming claims on your needs</Typography>
                {incomingClaims.map(claim => (
                  <Stack key={claim.id} spacing={1}>
                    <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" spacing={1}>
                      <Box>
                        <Typography variant="body2">
                          <strong>{claim.needByNeedId.title}</strong> — {claim.accountByClaimerAccountId.displayName ?? claim.accountByClaimerAccountId.externalSubject}
                        </Typography>
                        {claim.message ? (
                          <Typography color="text.secondary" variant="caption">
                            “{claim.message}”
                          </Typography>
                        ) : null}
                      </Box>
                      <Stack direction="row" spacing={1}>
                        <Chip label={formatStatus(claim.status)} size="small" />
                        <Button onClick={() => onSelectClaim(claim.id)} size="small" variant="outlined">
                          {claim.claimConversationByNeedClaimId ? "Open thread" : "Reply now"}
                        </Button>
                      </Stack>
                    </Stack>
                    <Divider />
                  </Stack>
                ))}
              </Stack>
            ) : null}

            {myClaims.length > 0 ? (
              <Stack spacing={1.5}>
                <Typography variant="subtitle1">Your submitted claims</Typography>
                {myClaims.map(claim => (
                  <Stack key={claim.id} spacing={1}>
                    <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" spacing={1}>
                      <Box>
                        <Typography variant="body2">
                          <strong>{claim.needByNeedId.title}</strong>
                        </Typography>
                        <Typography color="text.secondary" variant="caption">
                          {claim.message ? `Your note: “${claim.message}”` : "No note attached"}
                        </Typography>
                      </Box>
                      <Stack direction="row" spacing={1}>
                        <Chip label={formatStatus(claim.status)} size="small" />
                        <Button onClick={() => onSelectClaim(claim.id)} size="small" variant="outlined">
                          {claim.claimConversationByNeedClaimId ? "Open thread" : "View status"}
                        </Button>
                      </Stack>
                    </Stack>
                    <Divider />
                  </Stack>
                ))}
              </Stack>
            ) : null}

            {notifications.length > 0 ? (
              <Stack spacing={1}>
                <Typography variant="subtitle1">Recent notifications</Typography>
                {notifications.slice(0, 5).map(notification => (
                  <Typography color="text.secondary" key={notification.id} variant="body2">
                    {notification.eventType.replaceAll("_", " ")} • {new Date(notification.createdAt).toLocaleString()}
                  </Typography>
                ))}
              </Stack>
            ) : null}
          </Stack>
        </CardContent>
      </Card>

      {selectedClaimId ? (
        <ClaimConversationPanel claimId={selectedClaimId} currentAccountId={currentAccountId} />
      ) : null}
    </Stack>
  );
}
