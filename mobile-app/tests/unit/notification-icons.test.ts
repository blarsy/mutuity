import { getNotificationIcon } from "../../src/screens/notifications/notificationIcons";
import Gone from "../../src/assets/img/gone.svg";
import TimeUp from "../../src/assets/img/time-up.svg";
import Denied from "../../src/assets/img/denied.svg";
import Claim from "../../src/assets/img/claim.svg";
import Bell from "../../src/assets/img/BELL.svg";

describe("mobile notification lifecycle icons", () => {
  it.each([
    ["claim_declined", Denied],
    ["claim_withdrawn", Gone],
    ["claim_expired", TimeUp],
    ["claim_need_deactivated", Gone],
    ["need_expired_claims_declined", TimeUp]
  ] as const)("gives %s its dedicated icon", (eventType, icon) => {
    expect(getNotificationIcon(eventType)).toBe(icon);
    expect(getNotificationIcon(eventType)).not.toBe(Claim);
    expect(getNotificationIcon(eventType)).not.toBe(Bell);
  });

  it("retains prefix and unknown-event fallbacks", () => {
    expect(getNotificationIcon("claim_future_event")).toBe(Claim);
    expect(getNotificationIcon("unknown_event")).toBe(Bell);
    expect(getNotificationIcon(null)).toBe(Bell);
  });
});