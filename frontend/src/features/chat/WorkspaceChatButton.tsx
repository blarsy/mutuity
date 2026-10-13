import { useQuery } from "@apollo/client/react";
import { Stack, Typography } from "@mui/material";
import { useAuth } from "../auth/AuthProvider";
import {
  CLAIM_CONVERSATION_LOOKUP_QUERY,
  RESOURCE_CONVERSATION_LOOKUP_QUERY
} from "./chat.queries";
import { StartConversationButton } from "./StartConversationDialog";
import { getUserFacingGraphQLErrorMessage } from "../../services/graphql/errorMessages";

type Props = {
  kind: "need" | "resource";
  contextId: string;
  creatorAccountId: string;
  participantAccountId: string;
  title: string;
  label: string;
  linkedConversationId?: string | null;
  needClaimId?: string;
};

type LookupData = {
  resourceConversationByResourceIdAndOwnerAccountIdAndBidderAccountId?: { id: string } | null;
  claimConversationByNeedIdAndCreatorAccountIdAndClaimerAccountId?: { id: string } | null;
};

/** Conversations belong to a listing/participant pair, not to a particular bid or claim. */
export function WorkspaceChatButton(props: Props) {
  const { session } = useAuth();
  const currentAccountId = session.account?.id;
  const otherAccountId = currentAccountId === props.creatorAccountId
    ? props.participantAccountId
    : props.creatorAccountId;
  const { data, loading, error } = useQuery<LookupData>(
    props.kind === "resource" ? RESOURCE_CONVERSATION_LOOKUP_QUERY : CLAIM_CONVERSATION_LOOKUP_QUERY,
    {
      skip: Boolean(props.linkedConversationId) || !currentAccountId,
      fetchPolicy: "cache-and-network",
      variables: props.kind === "resource"
        ? { resourceId: props.contextId, ownerAccountId: props.creatorAccountId, bidderAccountId: props.participantAccountId }
        : { needId: props.contextId, creatorAccountId: props.creatorAccountId, claimerAccountId: props.participantAccountId }
    }
  );
  const conversationId = props.linkedConversationId
    ?? (props.kind === "resource"
      ? data?.resourceConversationByResourceIdAndOwnerAccountIdAndBidderAccountId?.id
      : data?.claimConversationByNeedIdAndCreatorAccountIdAndClaimerAccountId?.id);
  const errorMessage = getUserFacingGraphQLErrorMessage(error);

  return (
    <Stack spacing={0.5}>
      <StartConversationButton
        kind={props.kind}
        contextId={props.contextId}
        otherAccountId={otherAccountId}
        title={props.title}
        buttonLabel={props.label}
        existingConversationId={conversationId}
        needClaimId={props.needClaimId}
        lookupLoading={!currentAccountId || (!conversationId && loading)}
        disabled={Boolean(error)}
      />
      {errorMessage ? <Typography color="error" variant="caption">{errorMessage}</Typography> : null}
    </Stack>
  );
}