import Link from "next/link";
import { useRouter } from "next/router";
import { useLazyQuery, useMutation, useQuery } from "@apollo/client/react";
import { useMemo, useState, type ReactNode } from "react";
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
  IconButton,
  Paper,
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
  pLimit: number;
  pOffset: number;
};

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
    actions: () => (
      <Stack direction="row" spacing={1}>
        <Button disabled size="small" variant="outlined">View description</Button>
        <Button disabled size="small" variant="outlined">Moderate</Button>
      </Stack>
    )
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
    actions: () => <Button disabled size="small" variant="outlined">Create</Button>
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
    actions: () => <Button disabled size="small" variant="outlined">View message</Button>
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
  const [offset, setOffset] = useState(0);
  const { isAdmin, isChecking, isRedirecting, isForbiddenRedirecting } = useRequireAdmin();
  const config = getAdminSectionConfig(section);

  const variables = useMemo<AdminListQueryVariables>(
    () => ({
      pSearch: searchValue,
      pLimit: PAGE_SIZE,
      pOffset: offset
    }),
    [offset, searchValue]
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

        <Typography component="h1" variant="h4" sx={{ mb: 2 }}>
          {config.title}
        </Typography>

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
