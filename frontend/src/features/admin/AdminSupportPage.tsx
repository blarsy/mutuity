import Link from "next/link";
import { useRouter } from "next/router";
import { useLazyQuery, useMutation, useQuery } from "@apollo/client/react";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import type { TypedDocumentNode } from "@apollo/client";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Container,
  Dialog,
  DialogContent,
  DialogTitle,
  FormControl,
  IconButton,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";

import { useRequireAdmin } from "../auth/requireAdmin";
import { getUserFacingGraphQLErrorMessage } from "../../services/graphql/errorMessages";
import {
  APPROVE_CAMPAIGN_MUTATION,
} from "../campaigns/campaigns.queries";
import {
  ADD_CAMPAIGN_MODERATION_NOTE_MUTATION,
  CAMPAIGN_MODERATION_HISTORY_QUERY
} from "../campaigns/campaignModeration.queries";
import { CampaignModerationHistory } from "../campaigns/CampaignModerationHistory";
import {
  ADMIN_CREATE_GRANT_MUTATION,
  ADMIN_GET_MAIL_CONTENT_QUERY,
  ADMIN_LIST_ACCOUNTS_QUERY,
  ADMIN_LIST_BIDS_QUERY,
  ADMIN_LIST_CAMPAIGNS_QUERY,
  ADMIN_LIST_GRANTS_QUERY,
  ADMIN_LIST_LOGS_QUERY,
  ADMIN_LIST_MAILS_QUERY,
  ADMIN_LIST_NOTIFICATIONS_QUERY,
  ADMIN_LIST_RESOURCES_QUERY,
  ADMIN_RESEND_MAIL_MUTATION
} from "./adminSupport.queries";

const PAGE_SIZE = 25;

type AdminSectionKey =
  | "accounts"
  | "bids"
  | "resources"
  | "notifications"
  | "mails"
  | "campaigns"
  | "grants"
  | "logs";

type AdminRecord = Record<string, unknown>;

type AdminConnection = {
  totalCount: number;
  nodes: AdminRecord[];
};

type AdminListQueryData = Record<string, AdminConnection | undefined>;

type AdminListQueryVariables = {
  pSearch?: string;
  pStatus?: string | null;
  pLimit: number;
  pOffset: number;
};

const CAMPAIGN_MODERATION_STATUSES: { value: string; label: string }[] = [
  { value: "PENDING", label: "Pending" },
  { value: "AWAITING_ADAPTATION", label: "Awaiting adaptation" },
  { value: "APPROVED", label: "Approved" },
];

type AdminQueryDocument = TypedDocumentNode<AdminListQueryData, AdminListQueryVariables>;

type AdminColumn = {
  key: string;
  label: string;
  render: (row: AdminRecord) => ReactNode;
};

type AdminSectionConfig = {
  key: AdminSectionKey;
  title: string;
  searchLabel: string;
  searchPlaceholder: string;
  connectionKey: string;
  query: AdminQueryDocument;
  columns: AdminColumn[];
  actions?: (row: AdminRecord) => ReactNode;
  pageActions?: () => ReactNode;
};

function asString(value: unknown) {
  if (typeof value === "string") {
    return value;
  }

  if (typeof value === "number") {
    return String(value);
  }

  return "";
}

function renderDate(value: unknown) {
  const text = asString(value);

  if (!text) {
    return "-";
  }

  return new Date(text).toLocaleString();
}

function renderJson(value: unknown) {
  if (value == null) {
    return "-";
  }

  if (typeof value === "string") {
    return value;
  }

  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}

function MailRowActions({ row }: { row: AdminRecord }) {
  const mailId = asString(row.id);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [sendSuccess, setSendSuccess] = useState(false);

  const [getMailContent, { loading: contentLoading, data: contentData, error: contentError }] =
    useLazyQuery<{ adminGetMailContent: string | null }>(ADMIN_GET_MAIL_CONTENT_QUERY);

  const [resendMail, { loading: resendLoading, error: resendError }] =
    useMutation(ADMIN_RESEND_MAIL_MUTATION);

  function handleViewContent() {
    setDialogOpen(true);
    void getMailContent({ variables: { pMailId: mailId } });
  }

  async function handleSendAgain() {
    setSendSuccess(false);

    try {
      await resendMail({ variables: { pMailId: mailId } });
      setSendSuccess(true);
    } catch {
      // error surfaced via resendError
    }
  }

  const htmlContent = contentData?.adminGetMailContent ?? null;
  const contentErrorMessage = getUserFacingGraphQLErrorMessage(contentError);
  const resendErrorMessage = getUserFacingGraphQLErrorMessage(resendError);

  return (
    <>
      <Stack direction="row" spacing={1}>
        <Button size="small" variant="outlined" onClick={handleViewContent}>View content</Button>
        <Button
          disabled={resendLoading}
          size="small"
          variant="outlined"
          onClick={() => { void handleSendAgain(); }}
        >
          {resendLoading ? <CircularProgress size={14} /> : "Send again"}
        </Button>
      </Stack>

      {resendErrorMessage ? (
        <Typography color="error" variant="caption">{resendErrorMessage}</Typography>
      ) : null}
      {sendSuccess && !resendLoading ? (
        <Typography color="success.main" variant="caption">Queued for delivery</Typography>
      ) : null}

      <Dialog fullScreen open={dialogOpen} onClose={() => { setDialogOpen(false); }}>
        <DialogTitle sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          Mail content
          <IconButton aria-label="close" onClick={() => { setDialogOpen(false); }}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          {contentLoading ? <CircularProgress /> : null}
          {contentErrorMessage ? <Alert severity="error">{contentErrorMessage}</Alert> : null}
          {!contentLoading && !contentErrorMessage && htmlContent ? (
            <iframe
              sandbox="allow-same-origin"
              srcDoc={htmlContent}
              style={{ width: "100%", height: "100%", border: "none", minHeight: "70vh" }}
              title="Mail HTML content"
            />
          ) : null}
          {!contentLoading && !contentErrorMessage && !htmlContent ? (
            <Alert severity="info">No HTML content stored for this mail.</Alert>
          ) : null}
        </DialogContent>
      </Dialog>
    </>
  );
}

function CampaignRowActions({ row }: { row: AdminRecord }) {
  const campaignId = asString(row.id);
  const description = asString(row.description);
  const summary = asString(row.summary);
  const moderationStatus = asString(row.moderationStatus);

  const [descOpen, setDescOpen] = useState(false);
  const [moderateOpen, setModerateOpen] = useState(false);
  const [confirmApproveOpen, setConfirmApproveOpen] = useState(false);
  const [noteBody, setNoteBody] = useState("");
  const [approveSuccess, setApproveSuccess] = useState(false);
  const [noteSent, setNoteSent] = useState(false);

  const [addNote, { loading: noteLoading, error: noteError }] = useMutation(
    ADD_CAMPAIGN_MODERATION_NOTE_MUTATION
  );
  const [approveCampaign, { loading: approveLoading, error: approveError }] = useMutation(
    APPROVE_CAMPAIGN_MUTATION
  );

  const noteErrorMessage = getUserFacingGraphQLErrorMessage(noteError);
  const approveErrorMessage = getUserFacingGraphQLErrorMessage(approveError);
  const isAlreadyApproved = moderationStatus === "APPROVED" || approveSuccess;

  async function handleSendNote() {
    if (!noteBody.trim()) return;
    setNoteSent(false);
    try {
      await addNote({
        variables: { campaignId, body: noteBody.trim() },
        refetchQueries: [{ query: CAMPAIGN_MODERATION_HISTORY_QUERY, variables: { campaignId } }],
        awaitRefetchQueries: true
      });
      setNoteBody("");
      setNoteSent(true);
    } catch {
      // error surfaced via noteError
    }
  }

  async function handleApprove() {
    setApproveSuccess(false);
    try {
      await approveCampaign({ variables: { campaignId } });
      setApproveSuccess(true);
      setConfirmApproveOpen(false);
    } catch {
      // error surfaced via approveError
    }
  }

  return (
    <>
      <Stack direction="row" spacing={1}>
        <Button size="small" variant="outlined" onClick={() => { setDescOpen(true); }}>
          View description
        </Button>
        <Button size="small" variant="outlined" onClick={() => { setModerateOpen(true); }}>
          Moderate
        </Button>
      </Stack>

      {/* Fullscreen description dialog */}
      <Dialog fullScreen open={descOpen} onClose={() => { setDescOpen(false); }}>
        <DialogTitle sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          Campaign description — {summary || campaignId}
          <IconButton aria-label="close" onClick={() => { setDescOpen(false); }}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          <Typography sx={{ whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
            {description || "No description stored."}
          </Typography>
        </DialogContent>
      </Dialog>

      {/* Moderation dialog */}
      <Dialog fullWidth maxWidth="xl" open={moderateOpen} onClose={() => { setModerateOpen(false); }}>
        <DialogTitle sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          Moderate campaign — {summary || campaignId}
          <IconButton aria-label="close" onClick={() => { setModerateOpen(false); }}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ pt: 1 }}>
            {noteErrorMessage ? <Alert severity="error">{noteErrorMessage}</Alert> : null}
            {noteSent && !noteLoading ? (
              <Alert severity="success">Moderation note sent.</Alert>
            ) : null}
            <TextField
              fullWidth
              label="Moderation note"
              multiline
              minRows={3}
              placeholder="Enter note for campaign creator..."
              value={noteBody}
              onChange={event => { setNoteBody(event.target.value); }}
            />
            <Button
              disabled={noteLoading || !noteBody.trim()}
              variant="outlined"
              onClick={() => { void handleSendNote(); }}
            >
              {noteLoading ? <CircularProgress size={14} /> : "Send note"}
            </Button>

            <Box sx={{ borderTop: 1, borderColor: "divider", pt: 2, mt: 1 }}>
              {approveErrorMessage ? <Alert severity="error" sx={{ mb: 1 }}>{approveErrorMessage}</Alert> : null}
              {approveSuccess && !approveLoading ? (
                <Alert severity="success" sx={{ mb: 1 }}>Campaign approved.</Alert>
              ) : null}
              <Button
                color="success"
                disabled={approveLoading || isAlreadyApproved}
                variant="contained"
                onClick={() => { setConfirmApproveOpen(true); }}
              >
                {approveLoading ? <CircularProgress size={14} /> : isAlreadyApproved ? "Already approved" : "Approve campaign"}
              </Button>
            </Box>

            <Box sx={{ borderTop: 1, borderColor: "divider", pt: 2, mt: 1 }}>
              <Typography sx={{ mb: 1 }} variant="subtitle2">Moderation history</Typography>
              <CampaignModerationHistory campaignId={campaignId} />
            </Box>
          </Stack>
        </DialogContent>
      </Dialog>

      <Dialog fullWidth maxWidth="xs" open={confirmApproveOpen} onClose={() => { setConfirmApproveOpen(false); }}>
        <DialogTitle>Approve campaign</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ pt: 1 }}>
            <Typography>Are you sure you want to approve this campaign?</Typography>
            <Stack direction="row" spacing={1}>
              <Button variant="outlined" onClick={() => { setConfirmApproveOpen(false); }}>
                No
              </Button>
              <Button
                color="success"
                disabled={approveLoading}
                variant="contained"
                onClick={() => { void handleApprove(); }}
              >
                {approveLoading ? <CircularProgress size={14} /> : "Yes, approve"}
              </Button>
            </Stack>
          </Stack>
        </DialogContent>
      </Dialog>
    </>
  );
}

function GrantCreatePageAction() {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [tokenAmount, setTokenAmount] = useState("");
  const [maxClaims, setMaxClaims] = useState("");
  const [linkedCampaignId, setLinkedCampaignId] = useState("");
  const [targetEmails, setTargetEmails] = useState("");
  const [expiresAt, setExpiresAt] = useState("");
  const [validationError, setValidationError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const [createGrant, { loading, error }] = useMutation(ADMIN_CREATE_GRANT_MUTATION);
  const errorMessage = getUserFacingGraphQLErrorMessage(error);

  function handleClose() {
    setOpen(false);
    setSuccess(false);
    setValidationError(null);
    setTitle("");
    setDescription("");
    setTokenAmount("");
    setMaxClaims("");
    setLinkedCampaignId("");
    setTargetEmails("");
    setExpiresAt("");
  }

  async function handleCreate() {
    setSuccess(false);
    setValidationError(null);
    const amount = parseInt(tokenAmount, 10);
    const maxClaimsValue = maxClaims.trim() ? parseInt(maxClaims, 10) : null;
    const targetEmailList = targetEmails
      .split(/[\n,;]/)
      .map(value => value.trim())
      .filter(Boolean);
    const expiresAtDate = new Date(expiresAt);
    const hasConstraint =
      (maxClaimsValue !== null && !isNaN(maxClaimsValue) && maxClaimsValue > 0)
      || linkedCampaignId.trim().length > 0
      || targetEmailList.length > 0;

    if (!expiresAt || isNaN(expiresAtDate.getTime())) {
      setValidationError("Expiration datetime is required.");
      return;
    }

    if (!title.trim() || isNaN(amount) || amount <= 0) return;
    if (maxClaimsValue !== null && (isNaN(maxClaimsValue) || maxClaimsValue <= 0)) {
      setValidationError("Max successful claims must be a positive integer when provided.");
      return;
    }
    if (!hasConstraint) {
      setValidationError(
        "At least one constraint is required: max successful claims, linked campaign id, or target email whitelist."
      );
      return;
    }

    try {
      await createGrant({
        variables: {
          pTitle: title.trim(),
          pDescription: description.trim() || null,
          pAwardedTokenAmount: amount,
          pMaxSuccessfulClaimCount: maxClaimsValue,
          pExpiresAt: expiresAtDate.toISOString(),
          pLinkedCampaignId: linkedCampaignId.trim() || null,
          pTargetEmails: targetEmailList.length > 0 ? targetEmailList : null
        }
      });
      setSuccess(true);
      setValidationError(null);
      setTitle("");
      setDescription("");
      setTokenAmount("");
      setMaxClaims("");
      setLinkedCampaignId("");
      setTargetEmails("");
      setExpiresAt("");
    } catch {
      // error surfaced via errorMessage
    }
  }

  return (
    <>
      <Button size="small" variant="contained" onClick={() => { setOpen(true); }}>
        Create grant
      </Button>

      <Dialog fullWidth maxWidth="sm" open={open} onClose={handleClose}>
        <DialogTitle sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          Create grant
          <IconButton aria-label="close" onClick={handleClose}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ pt: 1 }}>
            {validationError ? <Alert severity="warning">{validationError}</Alert> : null}
            {errorMessage ? <Alert severity="error">{errorMessage}</Alert> : null}
            {success ? <Alert severity="success">Grant created successfully.</Alert> : null}
            <TextField
              fullWidth
              required
              label="Title"
              value={title}
              onChange={event => { setTitle(event.target.value); }}
            />
            <TextField
              fullWidth
              label="Description"
              multiline
              minRows={2}
              value={description}
              onChange={event => { setDescription(event.target.value); }}
            />
            <TextField
              fullWidth
              required
              label="Awarded token amount"
              type="number"
              inputProps={{ min: 1 }}
              value={tokenAmount}
              onChange={event => { setTokenAmount(event.target.value); }}
            />
            <TextField
              fullWidth
              label="Max successful claims (optional)"
              type="number"
              inputProps={{ min: 1 }}
              value={maxClaims}
              onChange={event => { setMaxClaims(event.target.value); }}
            />
            <TextField
              fullWidth
              label="Linked campaign ID (optional)"
              placeholder="Campaign UUID"
              value={linkedCampaignId}
              onChange={event => { setLinkedCampaignId(event.target.value); }}
            />
            <TextField
              fullWidth
              label="Target email whitelist (optional)"
              helperText="One email per line (or comma-separated)."
              multiline
              minRows={2}
              value={targetEmails}
              onChange={event => { setTargetEmails(event.target.value); }}
            />
            <TextField
              fullWidth
              required
              label="Expires at"
              type="datetime-local"
              value={expiresAt}
              onChange={event => { setExpiresAt(event.target.value); }}
              InputLabelProps={{ shrink: true }}
            />
            <Button
              disabled={loading || !title.trim() || !tokenAmount.trim() || !expiresAt.trim()}
              variant="contained"
              onClick={() => { void handleCreate(); }}
            >
              {loading ? <CircularProgress size={14} /> : "Create"}
            </Button>
          </Stack>
        </DialogContent>
      </Dialog>
    </>
  );
}

function LogRowActions({ row }: { row: AdminRecord }) {
  const message = asString(row.message);
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button size="small" variant="outlined" onClick={() => { setOpen(true); }}>
        View message
      </Button>

      <Dialog fullScreen open={open} onClose={() => { setOpen(false); }}>
        <DialogTitle sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          Log message
          <IconButton aria-label="close" onClick={() => { setOpen(false); }}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          <Typography sx={{ whiteSpace: "pre-wrap", wordBreak: "break-word", fontFamily: "monospace" }}>
            {message || "(empty)"}
          </Typography>
        </DialogContent>
      </Dialog>
    </>
  );
}

const ADMIN_SECTION_ORDER: AdminSectionKey[] = [
  "accounts",
  "bids",
  "resources",
  "notifications",
  "mails",
  "campaigns",
  "grants",
  "logs"
];

const ADMIN_SECTIONS: Record<AdminSectionKey, AdminSectionConfig> = {
  accounts: {
    key: "accounts",
    title: "Admin Support - Accounts",
    searchLabel: "Search by account name or email",
    searchPlaceholder: "Type a name or email",
    connectionKey: "adminListAccounts",
    query: ADMIN_LIST_ACCOUNTS_QUERY,
    columns: [
      { key: "id", label: "ID", render: row => asString(row.id) },
      { key: "name", label: "Name", render: row => asString(row.name) || "-" },
      { key: "email", label: "Email", render: row => asString(row.email) || "-" },
      { key: "language", label: "Language", render: row => asString(row.language) || "-" },
      { key: "tokenAmount", label: "Tokens", render: row => asString(row.tokenAmount) || "0" },
      { key: "createdAt", label: "Created", render: row => renderDate(row.createdAt) },
      { key: "address", label: "Address", render: row => asString(row.address) || "-" }
    ]
  },
  bids: {
    key: "bids",
    title: "Admin Support - Bids",
    searchLabel: "Search by bidder, receiver, or resource title",
    searchPlaceholder: "Type bidder name, receiver name, or resource title",
    connectionKey: "adminListBids",
    query: ADMIN_LIST_BIDS_QUERY,
    columns: [
      { key: "id", label: "ID", render: row => asString(row.id) },
      { key: "bidderName", label: "Bidder", render: row => asString(row.bidderName) || "-" },
      { key: "receiverName", label: "Receiver", render: row => asString(row.receiverName) || "-" },
      { key: "resourceTitle", label: "Resource", render: row => asString(row.resourceTitle) || "-" },
      { key: "intensity", label: "Intensity", render: row => asString(row.intensity) || "-" },
      { key: "tokenAmount", label: "Tokens", render: row => asString(row.tokenAmount) || "0" },
      { key: "status", label: "Status", render: row => asString(row.status) || "-" },
      { key: "createdAt", label: "Created", render: row => renderDate(row.createdAt) },
      { key: "expirationDatetime", label: "Expires", render: row => renderDate(row.expirationDatetime) }
    ]
  },
  resources: {
    key: "resources",
    title: "Admin Support - Resources",
    searchLabel: "Search by title or creator",
    searchPlaceholder: "Type a title, description term, or creator name",
    connectionKey: "adminListResources",
    query: ADMIN_LIST_RESOURCES_QUERY,
    columns: [
      { key: "id", label: "ID", render: row => asString(row.id) },
      { key: "title", label: "Title", render: row => asString(row.title) || "-" },
      { key: "creatorName", label: "Creator", render: row => asString(row.creatorName) || "-" },
      { key: "intensity", label: "Intensity", render: row => asString(row.intensity) || "-" },
      { key: "tokenAmount", label: "Tokens", render: row => asString(row.tokenAmount) || "0" },
      { key: "imageCount", label: "Images", render: row => asString(row.imageCount) || "0" },
      { key: "location", label: "Location", render: row => asString(row.location) || "-" },
      { key: "createdAt", label: "Created", render: row => renderDate(row.createdAt) },
      { key: "expirationDatetime", label: "Expires", render: row => renderDate(row.expirationDatetime) }
    ]
  },
  notifications: {
    key: "notifications",
    title: "Admin Support - Notifications",
    searchLabel: "Search by account name or notification content",
    searchPlaceholder: "Type account name or payload term",
    connectionKey: "adminListNotifications",
    query: ADMIN_LIST_NOTIFICATIONS_QUERY,
    columns: [
      { key: "id", label: "ID", render: row => asString(row.id) },
      { key: "accountName", label: "Account", render: row => asString(row.accountName) || "-" },
      { key: "data", label: "Data", render: row => renderJson(row.data) },
      { key: "createdAt", label: "Created", render: row => renderDate(row.createdAt) },
      { key: "readAt", label: "Read", render: row => renderDate(row.readAt) }
    ]
  },
  mails: {
    key: "mails",
    title: "Admin Support - Mails",
    searchLabel: "Search by email, recipient name, or subject",
    searchPlaceholder: "Type recipient email, account, or subject",
    connectionKey: "adminListMails",
    query: ADMIN_LIST_MAILS_QUERY,
    columns: [
      { key: "id", label: "ID", render: row => asString(row.id) },
      { key: "email", label: "Email", render: row => asString(row.email) || "-" },
      { key: "subject", label: "Subject", render: row => asString(row.subject) || "-" },
      {
        key: "recipientAccountName",
        label: "Recipient",
        render: row => asString(row.recipientAccountName) || "-"
      },
      { key: "createdAt", label: "Created", render: row => renderDate(row.createdAt) }
    ],
    actions: (row) => <MailRowActions row={row} />
  },
  campaigns: {
    key: "campaigns",
    title: "Admin Support - Campaigns",
    searchLabel: "Search by summary, description, or creator",
    searchPlaceholder: "Type summary, description term, or creator name",
    connectionKey: "adminListCampaigns",
    query: ADMIN_LIST_CAMPAIGNS_QUERY,
    columns: [
      { key: "id", label: "ID", render: row => asString(row.id) },
      { key: "creatorName", label: "Creator", render: row => asString(row.creatorName) || "-" },
      { key: "summary", label: "Summary", render: row => asString(row.summary) || "-" },
      { key: "moderationStatus", label: "Status", render: row => asString(row.moderationStatus) || "-" },
      {
        key: "airdropTokenAmount",
        label: "Airdrop Tokens",
        render: row => asString(row.airdropTokenAmount) || "0"
      },
      { key: "airdropDatetime", label: "Airdrop At", render: row => renderDate(row.airdropDatetime) },
      { key: "beginDatetime", label: "Begin", render: row => renderDate(row.beginDatetime) },
      { key: "endDatetime", label: "End", render: row => renderDate(row.endDatetime) },
      {
        key: "resourceRewardsMultiplier",
        label: "Rewards Multiplier",
        render: row => asString(row.resourceRewardsMultiplier) || "-"
      },
      { key: "createdAt", label: "Created", render: row => renderDate(row.createdAt) }
    ],
    actions: (row) => <CampaignRowActions row={row} />
  },
  grants: {
    key: "grants",
    title: "Admin Support - Grants",
    searchLabel: "Search by title or description",
    searchPlaceholder: "Type title or description term",
    connectionKey: "adminListGrants",
    query: ADMIN_LIST_GRANTS_QUERY,
    columns: [
      { key: "id", label: "ID", render: row => asString(row.id) },
      { key: "title", label: "Title", render: row => asString(row.title) || "-" },
      { key: "description", label: "Description", render: row => asString(row.description) || "-" },
      { key: "amountGranted", label: "Amount", render: row => asString(row.amountGranted) || "0" },
      { key: "expirationDatetime", label: "Expires", render: row => renderDate(row.expirationDatetime) },
      { key: "createdAt", label: "Created", render: row => renderDate(row.createdAt) }
    ],
    pageActions: () => <GrantCreatePageAction />
  },
  logs: {
    key: "logs",
    title: "Admin Support - Logs",
    searchLabel: "Search by component, message, or context",
    searchPlaceholder: "Type component name or log text",
    connectionKey: "adminListLogs",
    query: ADMIN_LIST_LOGS_QUERY,
    columns: [
      { key: "component", label: "Component", render: row => asString(row.component) || "-" },
      { key: "timestamp", label: "Timestamp", render: row => renderDate(row.timestamp) },
      { key: "severity", label: "Severity", render: row => asString(row.severity) || "-" },
      { key: "message", label: "Message", render: row => asString(row.message) || "-" },
      { key: "context", label: "Context", render: row => asString(row.context) || "-" }
    ],
    actions: (row) => <LogRowActions row={row} />
  }
};

export function isAdminSectionKey(value: string): value is AdminSectionKey {
  return ADMIN_SECTION_ORDER.some(key => key === value);
}

export function adminSectionHref(section: AdminSectionKey) {
  return `/admin/${section}`;
}

export function getAdminSectionConfig(section: AdminSectionKey) {
  return ADMIN_SECTIONS[section];
}

export function getAdminSectionOrder() {
  return ADMIN_SECTION_ORDER;
}

type AdminSupportPageProps = {
  section: AdminSectionKey;
};

export default function AdminSupportPage({ section }: AdminSupportPageProps) {
  const router = useRouter();
  const [searchInput, setSearchInput] = useState("");
  const [searchValue, setSearchValue] = useState<string | undefined>(undefined);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [offset, setOffset] = useState(0);
  const { isAdmin, isChecking, isRedirecting, isForbiddenRedirecting } = useRequireAdmin();
  const config = getAdminSectionConfig(section);

  useEffect(() => {
    if (!router.isReady || section !== "campaigns") {
      return;
    }

    const prefilledSearch = typeof router.query.search === "string" ? router.query.search.trim() : "";
    const prefilledStatus = typeof router.query.status === "string" ? router.query.status.toUpperCase() : "";

    if (prefilledSearch) {
      setSearchInput(prefilledSearch);
      setSearchValue(prefilledSearch);
      setOffset(0);
    }

    if (CAMPAIGN_MODERATION_STATUSES.some(status => status.value === prefilledStatus)) {
      setStatusFilter(prefilledStatus);
      setOffset(0);
    }
  }, [router.isReady, router.query.search, router.query.status, section]);

  const variables = useMemo<AdminListQueryVariables>(
    () => ({
      pSearch: searchValue,
      pStatus: section === "campaigns" && statusFilter !== "all" ? statusFilter : null,
      pLimit: PAGE_SIZE,
      pOffset: offset
    }),
    [offset, searchValue, section, statusFilter]
  );

  const { data, loading, error } = useQuery<AdminListQueryData, AdminListQueryVariables>(config.query, {
    skip: isChecking || isRedirecting || isForbiddenRedirecting || !isAdmin,
    variables
  });

  const connection = data?.[config.connectionKey];
  const rows = connection?.nodes ?? [];
  const totalCount = connection?.totalCount ?? 0;
  const hasPreviousPage = offset > 0;
  const hasNextPage = offset + PAGE_SIZE < totalCount;
  const errorMessage = getUserFacingGraphQLErrorMessage(error);

  if (isChecking || isRedirecting || isForbiddenRedirecting) {
    return (
      <Container maxWidth="xl">
        <Box sx={{ py: 6 }}>
          <Alert severity="info">Checking administrator access...</Alert>
        </Box>
      </Container>
    );
  }

  if (!isAdmin) {
    return (
      <Container maxWidth="xl">
        <Box sx={{ py: 6 }}>
          <Alert severity="error">Administrator access is required.</Alert>
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl">
      <Box sx={{ py: 4 }}>
        <Stack direction={{ xs: "column", md: "row" }} spacing={2} sx={{ mb: 2 }}>
          {getAdminSectionOrder().map(sectionKey => {
            const sectionConfig = getAdminSectionConfig(sectionKey);
            const selected = sectionKey === section;

            return (
              <Button
                key={sectionKey}
                component={Link}
                href={adminSectionHref(sectionKey)}
                variant={selected ? "contained" : "outlined"}
              >
                {sectionConfig.title.replace("Admin Support - ", "")}
              </Button>
            );
          })}
        </Stack>

        <Stack alignItems="center" direction="row" justifyContent="space-between" sx={{ mb: 2 }}>
          <Typography component="h1" variant="h4">
            {config.title}
          </Typography>
          {config.pageActions ? config.pageActions() : null}
        </Stack>

        <Paper sx={{ p: 2, mb: 2 }} variant="outlined">
          <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
            <TextField
              fullWidth
              label={config.searchLabel}
              placeholder={config.searchPlaceholder}
              value={searchInput}
              onChange={event => {
                setSearchInput(event.target.value);
              }}
            />
            {section === "campaigns" ? (
              <FormControl sx={{ minWidth: 180 }}>
                <InputLabel id="campaign-status-filter-label">Status</InputLabel>
                <Select
                  label="Status"
                  labelId="campaign-status-filter-label"
                  value={statusFilter}
                  onChange={event => {
                    setStatusFilter(event.target.value);
                    setOffset(0);
                  }}
                >
                  <MenuItem value="all">All statuses</MenuItem>
                  {CAMPAIGN_MODERATION_STATUSES.map(option => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            ) : null}
            <Stack direction="row" spacing={1}>
              <Button
                onClick={() => {
                  const normalized = searchInput.trim();
                  setSearchValue(normalized.length > 0 ? normalized : undefined);
                  setOffset(0);
                }}
                variant="contained"
              >
                Search
              </Button>
              <Button
                onClick={() => {
                  setSearchInput("");
                  setSearchValue(undefined);
                  setStatusFilter("all");
                  setOffset(0);
                }}
                variant="outlined"
              >
                Reset
              </Button>
            </Stack>
          </Stack>
        </Paper>

        {loading ? <Alert severity="info" sx={{ mb: 2 }}>Loading records...</Alert> : null}
        {errorMessage ? <Alert severity="error" sx={{ mb: 2 }}>{errorMessage}</Alert> : null}

        {!loading && !errorMessage && rows.length === 0 ? (
          <Alert severity="info" sx={{ mb: 2 }}>No records found.</Alert>
        ) : null}

        <TableContainer component={Paper} variant="outlined">
          <Table size="small">
            <TableHead>
              <TableRow>
                {config.columns.map(column => (
                  <TableCell key={column.key}>{column.label}</TableCell>
                ))}
                {config.actions ? <TableCell>Actions</TableCell> : null}
              </TableRow>
            </TableHead>
            <TableBody>
              {rows.map((row, index) => {
                const rowKey = asString(row.id) || `${section}-${index}`;

                return (
                  <TableRow key={rowKey} hover>
                    {config.columns.map(column => (
                      <TableCell key={column.key}>{column.render(row)}</TableCell>
                    ))}
                    {config.actions ? <TableCell>{config.actions(row)}</TableCell> : null}
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>

        <Stack
          alignItems="center"
          direction={{ xs: "column", sm: "row" }}
          justifyContent="space-between"
          spacing={2}
          sx={{ mt: 2 }}
        >
          <Typography variant="body2">
            Showing {rows.length} of {totalCount} records
          </Typography>
          <Stack direction="row" spacing={1}>
            <Button
              disabled={!hasPreviousPage}
              onClick={() => {
                setOffset(current => Math.max(0, current - PAGE_SIZE));
                void router.prefetch(adminSectionHref(section));
              }}
              variant="outlined"
            >
              Previous
            </Button>
            <Button
              disabled={!hasNextPage}
              onClick={() => {
                setOffset(current => current + PAGE_SIZE);
                void router.prefetch(adminSectionHref(section));
              }}
              variant="outlined"
            >
              Next
            </Button>
          </Stack>
        </Stack>
      </Box>
    </Container>
  );
}
