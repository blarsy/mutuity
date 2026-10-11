import { Linking } from "react-native";
import { mockLinkingUrlListener } from "../utils/mockLinkingUrlListener";

describe("typed Linking URL listener spy", () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("captures the handler and returns a removable native subscription", () => {
    const handlerRef: { current: Parameters<typeof Linking.addEventListener>[1] | null } = { current: null };
    mockLinkingUrlListener(handlerRef);
    const handler = jest.fn();

    const subscription = Linking.addEventListener("url", handler);
    expect(handlerRef.current).toBe(handler);
    handlerRef.current?.({ url: "topela://auth/google/callback" });
    expect(handler).toHaveBeenCalledWith({ url: "topela://auth/google/callback" });
    expect(() => subscription.remove()).not.toThrow();
  });
});