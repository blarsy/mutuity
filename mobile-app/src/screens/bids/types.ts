export type BidDirection = "sent" | "received";

export type BidWorkspaceStatus = "OPEN" | "ACCEPTED" | "DECLINED" | "WITHDRAWN" | "EXPIRED";

export interface BidWorkspaceItem {
  id: string;
  direction: BidDirection;
  status: BidWorkspaceStatus;
  title: string;
  counterpartyDisplayName: string;
  counterpartyAccountId: string;
  counterpartyAvatarUrl?: string | null;
  resourceId: string;
  conversationId: string | null;
  listingAuthorDisplayName?: string | null;
  listingAuthorAvatarUrl?: string | null;
  listingImageUrl?: string | null;
  message?: string | null;
  createdAt?: string | null;
  respondedAt?: string | null;
  validUntil?: string | null;
  canBeExchanged?: boolean;
  tokenAmount: number;
  isActive: boolean;
  updatedAt: string | null;
}