import {
  Box,
  IconButton,
  Stack,
  Tooltip,
  Typography
} from "@mui/material";
import NextLink from "next/link";
import { useId } from "react";
import { conversationDraftUrl, conversationThreadUrl } from "./chatRouting";

type StartConversationButtonProps = {
  kind: "need" | "resource";
  contextId: string;
  otherAccountId: string;
  title: string;
  buttonLabel: string;
  existingConversationId?: string | null;
  lookupLoading?: boolean;
  disabled?: boolean;
  disabledReason?: string | null;
};

export function StartConversationButton(props: StartConversationButtonProps) {
  const iconFilterId = `chat-icon-${useId().replace(/:/g, "")}`;
  const canOpenExistingConversation = Boolean(props.existingConversationId);
  const resolvedDisabled = Boolean(props.lookupLoading) || (Boolean(props.disabled) && !canOpenExistingConversation);
  const href = props.existingConversationId
    ? conversationThreadUrl(props.kind, props.existingConversationId)
    : conversationDraftUrl({
        kind: props.kind,
        contextId: props.contextId,
        otherAccountId: props.otherAccountId,
        title: props.title
      });

  return (
    <Stack alignItems="flex-start" spacing={1}>
      <Tooltip title={props.buttonLabel}>
        <span>
          <IconButton aria-label={props.buttonLabel} color="primary" component={NextLink} disabled={resolvedDisabled} href={href}>
            <Box component="svg" viewBox="0 0 200 200" aria-hidden="true" focusable="false"
              sx={{ display: "block", height: 35, width: 35 }}>
              <defs>
                <filter id={iconFilterId} colorInterpolationFilters="sRGB">
                  {/* Keep the black bubble, but make its white dots transparent. */}
                  <feColorMatrix type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  -0.2126 -0.7152 -0.0722 1 0" result="shape" />
                  <feFlood floodColor="currentColor" />
                  <feComposite in2="shape" operator="in" />
                </filter>
              </defs>
              <image href="/topela/CHAT.svg" width="200" height="200" filter={`url(#${iconFilterId})`} />
            </Box>
          </IconButton>
        </span>
      </Tooltip>
      {resolvedDisabled && !props.lookupLoading && props.disabledReason ? (
        <Typography color="text.secondary" variant="caption">
          {props.disabledReason}
        </Typography>
      ) : null}
    </Stack>
  );
}