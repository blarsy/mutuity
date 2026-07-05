import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { StyleSheet, View } from "react-native";
import { Text } from "react-native-paper";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";

import { AuthProvider, useAuth } from "../services/auth/AuthProvider";
import { useTranslation } from "react-i18next";
import i18n from "../i18n";
import { AppCard, AppTextField, PrimaryButton, ScreenContainer } from "../components/primitives";

const Stack = createNativeStackNavigator();

function LoadingScreen(): React.JSX.Element {
  const { t } = useTranslation();

  return (
    <View accessibilityRole="progressbar" style={styles.loadingContainer}>
      <Text>{t("loading")}</Text>
    </View>
  );
}

function AuthenticatedNavigator(): React.JSX.Element {
  return (
    <View accessible accessibilityLabel="Main navigation" style={styles.fill}>
      <Stack.Navigator>
        <Stack.Screen name="Home" component={HomeScreen} options={{ headerShown: false }} />
      </Stack.Navigator>
    </View>
  );
}

function HomeScreen(): React.JSX.Element {
  const { t } = useTranslation();

  return (
    <ScreenContainer>
      <AppCard>
        <Text accessibilityRole="header" variant="headlineMedium">
          {t("appName")}
        </Text>
        <Text variant="bodyMedium">{t("mainNavigation")}</Text>
      </AppCard>
      <AppTextField
        label={t("resourceSearchLabel")}
        placeholder={t("resourceSearchPlaceholder")}
        value=""
        accessibilityLabel={t("resourceSearchLabel")}
      />
      <AppTextField
        label={t("resourceCategoryFilterLabel")}
        value="Food"
        accessibilityLabel={t("resourceCategoryFilterLabel")}
      />
      <AppTextField
        label={t("resourceDistanceFilterLabel")}
        value="10 km"
        accessibilityLabel={t("resourceDistanceFilterLabel")}
      />
      <AppTextField
        label={t("resourceTitleEditLabel")}
        value="Community pantry"
        accessibilityLabel={t("resourceTitleEditLabel")}
      />
      <AppTextField
        label={t("resourcePriceEditLabel")}
        value="0"
        accessibilityLabel={t("resourcePriceEditLabel")}
      />
      <AppTextField
        label={t("resourceImagesEditLabel")}
        value="cover.jpg"
        accessibilityLabel={t("resourceImagesEditLabel")}
      />
      <PrimaryButton label={t("saveResource")} onPress={() => undefined} />
      <Text accessibilityLabel={t("offlineResourceSaveWarningLabel")} variant="bodySmall">
        {t("offlineResourceSaveWarning")}
      </Text>
    </ScreenContainer>
  );
}

function RootNavigator(): React.JSX.Element {
  const {
    session: { authenticated, loading }
  } = useAuth();

  return (
    <SafeAreaProvider>
      <SafeAreaView edges={["top", "right", "bottom", "left"]} style={styles.fill}>
        {loading ? (
          <LoadingScreen />
        ) : (
          <NavigationContainer>
            {authenticated ? <AuthenticatedNavigator /> : <LoadingScreen />}
          </NavigationContainer>
        )}
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

export function AppNavigator(): React.JSX.Element {
  return (
    <AuthProvider>
      <RootNavigator />
    </AuthProvider>
  );
}

export function AppNavigatorRoot(): React.JSX.Element {
  return <AppNavigator />;
}

export { i18n };

const styles = StyleSheet.create({
  fill: {
    flex: 1
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24
  }
});
