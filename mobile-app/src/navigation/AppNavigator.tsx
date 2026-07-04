import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { Text, View } from "react-native";

import { AuthProvider, useAuth } from "../services/auth/AuthProvider";
import { useTranslation } from "react-i18next";
import i18n from "../i18n";

const Stack = createNativeStackNavigator();

function LoadingScreen(): React.JSX.Element {
  const { t } = useTranslation();

  return (
    <View accessibilityRole="progressbar">
      <Text>{t("loading")}</Text>
    </View>
  );
}

function AuthenticatedNavigator(): React.JSX.Element {
  return (
    <Stack.Navigator>
      <Stack.Screen name="Home" component={HomeScreen} options={{ headerShown: false }} />
    </Stack.Navigator>
  );
}

function HomeScreen(): React.JSX.Element {
  const { t } = useTranslation();

  return (
    <View>
      <Text>{t("appName")}</Text>
    </View>
  );
}

function RootNavigator(): React.JSX.Element {
  const {
    session: { authenticated, loading }
  } = useAuth();

  if (loading) {
    return <LoadingScreen />;
  }

  return (
    <NavigationContainer>
      {authenticated ? <AuthenticatedNavigator /> : <LoadingScreen />}
    </NavigationContainer>
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
