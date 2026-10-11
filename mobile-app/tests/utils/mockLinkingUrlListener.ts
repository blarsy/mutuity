import { Linking } from "react-native";
import type EventEmitter from "react-native/Libraries/vendor/emitter/EventEmitter";

type UrlHandler = Parameters<typeof Linking.addEventListener>[1];

/** Capture the callback with a real React Native event subscription, without native Linking. */
export function mockLinkingUrlListener(handlerRef: { current: UrlHandler | null }): void {
  const { default: ActualEventEmitter } = jest.requireActual<{ default: typeof EventEmitter }>(
    "react-native/Libraries/vendor/emitter/EventEmitter"
  );
  const emitter = new ActualEventEmitter();

  jest.spyOn(Linking, "addEventListener").mockImplementation((eventName, handler) => {
    handlerRef.current = handler;
    return emitter.addListener(eventName, handler);
  });
}