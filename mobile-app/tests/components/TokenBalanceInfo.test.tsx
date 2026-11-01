import React from "react";
import { render } from "@testing-library/react-native";
import { createInstance } from "i18next";
import { I18nextProvider } from "react-i18next";
import { TokenBalanceInfo } from "../../src/components/contribution/TokenBalanceInfo";
import en from "../../src/i18n/locales/en/common.json";
import fr from "../../src/i18n/locales/fr/common.json";

function renderBalance(language: string, props: React.ComponentProps<typeof TokenBalanceInfo>) {
  const i18n = createInstance();
  void i18n.init({
    lng: language,
    initAsync: false,
    defaultNS: "common",
    resources: { en: { common: en }, fr: { common: fr } }
  });
  return render(<I18nextProvider i18n={i18n}><TokenBalanceInfo {...props} /></I18nextProvider>);
}

it("localizes the available balance and keeps it read-only", () => {
  const screen = renderBalance("fr", { balance: 3115 });
  expect(screen.getByTestId("available-token-balance"))
    .toHaveTextContent(`Solde disponible : ${new Intl.NumberFormat("fr").format(3115)}`);
  expect(screen.queryAllByRole("button")).toHaveLength(0);
});

it.each([null, Number.NaN, Number.POSITIVE_INFINITY])("displays an unknown balance (%s) as a dash", balance => {
  const screen = renderBalance("en", { balance });
  expect(screen.getByTestId("available-token-balance")).toHaveTextContent("Available balance: —");
});

it("retains the last known balance during loading or a refresh failure", () => {
  const screen = renderBalance("en", { balance: 3115, loading: true, error: new Error("offline") });
  expect(screen.getByTestId("available-token-balance")).toHaveTextContent("Available balance: 3,115");
  expect(screen.getByText("Loading token balance...")).toBeTruthy();
  expect(screen.getByText("We could not update your balance.")).toBeTruthy();
});

it("renders a zero balance summary without making it a menu action", () => {
  const screen = renderBalance("en", { balance: 0, summary: true });
  expect(screen.getByText("Token balance")).toBeTruthy();
  expect(screen.getByTestId("available-token-balance")).toHaveTextContent("0");
  expect(screen.queryAllByRole("button")).toHaveLength(0);
});