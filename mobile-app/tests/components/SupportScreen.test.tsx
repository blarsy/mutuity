import React from "react";
import { act, fireEvent, render, waitFor } from "@testing-library/react-native";
import { PaperProvider } from "react-native-paper";

import { SupportScreen } from "../../src/screens/profile/SupportScreen";
import { submitIssueReport } from "../../src/services/support/reportIssue";

jest.mock("../../src/services/support/reportIssue", () => ({ submitIssueReport: jest.fn() }));
const submit = submitIssueReport as jest.Mock;

beforeEach(() => submit.mockReset());

function renderScreen() {
  return render(<PaperProvider><SupportScreen appVersion="1.2.3" buildNumber="42" /></PaperProvider>);
}

it("waits for confirmation, disables editing and repeat submissions, then clears the form", async () => {
  let resolve!: (id: string) => void;
  submit.mockReturnValue(new Promise<string>(done => { resolve = done; }));
  const screen = renderScreen();
  const summary = screen.getByLabelText("Summary");
  const description = screen.getByLabelText("Description");
  fireEvent.changeText(summary, "  Problem  ");
  fireEvent.changeText(description, "  Details  ");
  fireEvent.press(screen.getByRole("button", { name: "Send report" }));
  expect(submit).toHaveBeenCalledWith({ summary: "Problem", description: "Details", appVersion: "1.2.3", buildNumber: "42" });
  expect(screen.getByRole("button", { name: "Send report" })).toBeDisabled();
  expect(summary.props.editable).toBe(false);
  expect(screen.queryByText("Report sent. Thank you!")).toBeNull();
  fireEvent.press(screen.getByRole("button", { name: "Send report" }));
  expect(submit).toHaveBeenCalledTimes(1);
  await act(async () => resolve("12345678-1234-1234-1234-123456789abc"));
  expect(screen.getByText("Report sent. Thank you!")).toBeTruthy();
  expect(summary.props.value).toBe("");
  expect(description.props.value).toBe("");
});

it("preserves the form on failure and permits a retry", async () => {
  submit.mockRejectedValueOnce(new Error("offline")).mockResolvedValueOnce("12345678-1234-1234-1234-123456789abc");
  const screen = renderScreen();
  const summary = screen.getByLabelText("Summary");
  fireEvent.changeText(summary, "Problem");
  fireEvent.changeText(screen.getByLabelText("Description"), "Details");
  fireEvent.press(screen.getByRole("button", { name: "Send report" }));
  await waitFor(() => expect(screen.getByText("We could not send your report. Please try again.")).toBeTruthy());
  expect(summary.props.value).toBe("Problem");
  expect(screen.getByLabelText("Description").props.value).toBe("Details");
  expect(screen.queryByText("Report sent. Thank you!")).toBeNull();
  fireEvent.press(screen.getByRole("button", { name: "Send report" }));
  await waitFor(() => expect(screen.getByText("Report sent. Thank you!")).toBeTruthy());
  expect(submit).toHaveBeenCalledTimes(2);
});

it("does not allow a blank summary", () => {
  const screen = renderScreen();
  fireEvent.changeText(screen.getByLabelText("Summary"), "   ");
  expect(screen.getByRole("button", { name: "Send report" })).toBeDisabled();
  expect(submit).not.toHaveBeenCalled();
});