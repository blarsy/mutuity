import type { SvgProps } from "react-native-svg";

import Airdrop from "../../assets/img/airdrop.svg";
import BidReceived from "../../assets/img/bid-received.svg";
import Bell from "../../assets/img/BELL.svg";
import Campaign from "../../assets/img/campaign.svg";
import Claim from "../../assets/img/claim.svg";
import Denied from "../../assets/img/denied.svg";
import GiftSent from "../../assets/img/gift-sent.svg";
import Gone from "../../assets/img/gone.svg";
import GotGift from "../../assets/img/got-gift.svg";
import Hey from "../../assets/img/hey.svg";
import Moderation from "../../assets/img/moderation.svg";
import MoneyIn from "../../assets/img/money-in.svg";
import PrizeWon from "../../assets/img/prize-won.svg";
import ThumbUp from "../../assets/img/thumb-up.svg";
import TimeUp from "../../assets/img/time-up.svg";

type NotificationIcon = React.ComponentType<SvgProps>;

// Maps account_notification event types (see database/functions/notification) to their Tope-là equivalent artwork.
const EXACT_EVENT_TYPE_ICONS: Record<string, NotificationIcon> = {
  gift_tokens_received: MoneyIn,
  gift_tokens_sent: GiftSent,
  campaign_airdrop_coming_soon: Airdrop,
  campaign_airdrop_done: ThumbUp,
  welcome_profile_reward: Hey,
  grant_claim: GotGift,
  campaign_approved: PrizeWon,
  campaign_moderation_note_received: Moderation,
  campaign_creator_adaptation_submitted: Moderation,
  resource_bid_expiring_soon: TimeUp,
  resource_bid_accepted: PrizeWon,
  resource_bid_declined: Denied,
  resource_bid_expired: Gone,
  resource_bid_cancelled: TimeUp,
  claim_created: Claim,
  claim_settled: BidReceived,
  claim_declined: Denied
};

const PREFIX_EVENT_TYPE_ICONS: Array<[prefix: string, icon: NotificationIcon]> = [
  ["campaign_airdrop", ThumbUp],
  ["campaign", Campaign],
  ["resource_bid", BidReceived],
  ["gift_tokens", MoneyIn],
  ["claim", Claim]
];

export function getNotificationIcon(eventType?: string | null): NotificationIcon {
  if (!eventType) {
    return Bell;
  }

  const exactMatch = EXACT_EVENT_TYPE_ICONS[eventType];
  if (exactMatch) {
    return exactMatch;
  }

  const prefixMatch = PREFIX_EVENT_TYPE_ICONS.find(([prefix]) => eventType.startsWith(prefix));
  return prefixMatch ? prefixMatch[1] : Bell;
}
