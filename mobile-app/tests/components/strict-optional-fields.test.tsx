import React from "react";
import { act, fireEvent, render, waitFor } from "@testing-library/react-native";
import * as ImagePicker from "expo-image-picker";
import * as ExpoLocation from "expo-location";
import { TimePickerModal } from "react-native-paper-dates";

import { AccountAvatar } from "../../src/components/AccountAvatar";
import { DateTimePickerField } from "../../src/components/primitives/DateTimePickerField";
import { ImagePickerField } from "../../src/components/primitives/ImagePickerField";
import { ProximityLocationEditor } from "../../src/components/primitives/ProximityLocationEditor";

jest.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string, options?: { defaultValue?: string }) => options?.defaultValue ?? key,
    i18n: { language: "en" }
  })
}));

jest.mock("react-native-paper-dates", () => ({
  DatePickerModal: jest.fn(() => null),
  TimePickerModal: jest.fn(() => null)
}));

jest.mock("expo-image-picker", () => ({
  MediaTypeOptions: { Images: "Images" },
  requestMediaLibraryPermissionsAsync: jest.fn().mockResolvedValue({ granted: true }),
  requestCameraPermissionsAsync: jest.fn().mockResolvedValue({ granted: true }),
  launchImageLibraryAsync: jest.fn(),
  launchCameraAsync: jest.fn()
}));

jest.mock("expo-location", () => ({
  geocodeAsync: jest.fn()
}));

describe("strict optional field behavior", () => {
  afterEach(() => {
    jest.restoreAllMocks();
    jest.clearAllMocks();
  });

  it("keeps the initials fallback when avatar fields are omitted", () => {
    const screen = render(<AccountAvatar authenticated />);
    expect(screen.getByText("?")).toBeTruthy();
  });

  it("passes the translated confirm label to the time picker", () => {
    render(<DateTimePickerField label="Expiry" value={undefined} onChange={() => undefined} testID="expiry" />);
    expect(jest.mocked(TimePickerModal).mock.calls[0]?.[0]).toEqual(
      expect.objectContaining({ confirmLabel: "Select" })
    );
    expect(jest.mocked(TimePickerModal).mock.calls[0]?.[0]).not.toHaveProperty("saveLabel");
  });

  const results: Array<{ name: string; result: ImagePicker.ImagePickerResult; expectedUri: string | null }> = [
    { name: "cancelled", result: { canceled: true, assets: null }, expectedUri: null },
    { name: "empty", result: { canceled: false, assets: [] }, expectedUri: null },
    {
      name: "selected",
      result: { canceled: false, assets: [{ uri: "file:///avatar.jpg", width: 100, height: 100 }] },
      expectedUri: "file:///avatar.jpg"
    }
  ];

  describe.each(["library", "camera"] as const)("%s picker", (source) => {
    it.each(results)("handles $name results and releases the busy state", async ({ result, expectedUri }) => {
      const method = source === "library" ? "launchImageLibraryAsync" : "launchCameraAsync";
      const picker = jest.mocked(ImagePicker[method]).mockResolvedValue(result);
      const onChange = jest.fn<void, [string | null]>();
      const screen = render(
        <ImagePickerField
          label="Avatar"
          imageUri={null}
          onChange={onChange}
          addFromCameraLabel="Camera"
          addFromLibraryLabel="Library"
        />
      );
      const button = screen.getByRole("button", { name: source === "library" ? "Library" : "Camera" });

      await act(async () => {
        fireEvent.press(button);
      });

      expect(picker).toHaveBeenCalledTimes(1);
      expect(button).toBeEnabled();
      if (expectedUri === null) {
        expect(onChange).not.toHaveBeenCalled();
      } else {
        expect(onChange).toHaveBeenCalledWith(expectedUri);
      }
    });
  });

  it("accepts a label-only location and resolves its coordinates", async () => {
    jest.mocked(ExpoLocation.geocodeAsync).mockResolvedValue([{ latitude: 0, longitude: 0 }]);
    const onChange = jest.fn();
    render(<ProximityLocationEditor value={{ label: "Null Island" }} onChange={onChange} />);

    await waitFor(() => {
      expect(onChange).toHaveBeenCalledWith({ label: "Null Island", latitude: 0, longitude: 0 });
    });
  });
});