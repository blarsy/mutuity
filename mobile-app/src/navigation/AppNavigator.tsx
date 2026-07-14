import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { StyleSheet, View } from "react-native";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { Text } from "react-native-paper";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";

import { AuthProvider, useAuth } from "../services/auth/AuthProvider";
import { useTranslation } from "react-i18next";
import i18n from "../i18n";
import { AppCard, AppTextField, PrimaryButton, ScreenContainer } from "../components/primitives";
import { SearchResourcesScreen } from "../screens/resources/SearchResourcesScreen";
import { appFontFamilies } from "../theme/fonts";

const Tab = createBottomTabNavigator();

function LoadingScreen(): React.JSX.Element {
  const { t } = useTranslation();

  return (
    <View accessibilityRole="progressbar" style={styles.loadingContainer}>
      <Text>{t("loading")}</Text>
    </View>
  );
}

interface MainTabsNavigatorProps {
  authenticated: boolean;
}

function MainTabsNavigator({ authenticated }: MainTabsNavigatorProps): React.JSX.Element {
  const { t } = useTranslation();
  const tabBarIconByRoute: Record<string, string> = {
    Explore: "compass-outline",
    MyHub: "view-dashboard-outline",
    Campaigns: "bullhorn-outline",
    Chat: "chat-outline",
    Notifications: "bell-outline"
  };

  return (
    <View accessible accessibilityLabel="Main navigation" style={styles.fill}>
      <Tab.Navigator
        initialRouteName="Explore"
        screenOptions={({ route }) => ({
          headerShown: false,
          tabBarLabelStyle: styles.tabLabel,
          tabBarIcon: ({ color, size, focused }) => {
            const outlinedIcon = tabBarIconByRoute[route.name] ?? "circle-outline";
            const iconName = focused ? outlinedIcon.replace("-outline", "") : outlinedIcon;

            return <MaterialCommunityIcons name={iconName as keyof typeof MaterialCommunityIcons.glyphMap} size={size} color={color} />;
          }
        })}
      >
        <Tab.Screen name="Explore" component={ExploreScreen} options={{ tabBarLabel: t("resourceSearchLabel") }} />
        <Tab.Screen
          name="MyHub"
          options={{ tabBarLabel: t("myHubLabel", { defaultValue: "My Hub" }) }}
        >
          {() => <MyHubScreen authenticated={authenticated} />}
        </Tab.Screen>
        <Tab.Screen
          name="Campaigns"
          options={{ tabBarLabel: t("campaignsLabel", { defaultValue: "Campaigns" }) }}
        >
          {() => <CampaignsScreen authenticated={authenticated} />}
        </Tab.Screen>
        <Tab.Screen name="Chat" options={{ tabBarLabel: t("chatLabel", { defaultValue: "Chat" }) }}>
          {() => <ChatScreen authenticated={authenticated} />}
        </Tab.Screen>
        <Tab.Screen
          name="Notifications"
          options={{ tabBarLabel: t("notificationsLabel", { defaultValue: "Notifications" }) }}
        >
          {() => <NotificationsScreen authenticated={authenticated} />}
        </Tab.Screen>
      </Tab.Navigator>
    </View>
  );
}

function ExploreScreen(): React.JSX.Element {
  return <SearchResourcesScreen />;
}

interface PlaceholderScreenProps {
  tabLabel: string;
}

function PlaceholderScreen({ tabLabel }: PlaceholderScreenProps): React.JSX.Element {
  const { t } = useTranslation();

  return (
    <ScreenContainer>
      <AppCard>
        <Text accessibilityRole="header" variant="headlineMedium">
          {tabLabel}
        </Text>
        <Text variant="bodyMedium">{t("mainNavigation")}</Text>
        <Text variant="bodySmall">
          {t("screenComingSoon", { defaultValue: "This screen is not implemented yet." })}
        </Text>
      </AppCard>
      <AppTextField
        label={t("placeholderInputLabel", { defaultValue: "Placeholder" })}
        value={tabLabel}
        accessibilityLabel={t("placeholderInputLabel", { defaultValue: "Placeholder" })}
      />
      <PrimaryButton label={t("comingSoonLabel", { defaultValue: "Coming soon" })} onPress={() => undefined} />
    </ScreenContainer>
  );
}

interface RestrictedTabPlaceholderScreenProps {
  tabLabel: string;
}

function RestrictedTabPlaceholderScreen({ tabLabel }: RestrictedTabPlaceholderScreenProps): React.JSX.Element {
  const { t } = useTranslation();

  return (
    <ScreenContainer>
      <AppCard>
        <Text accessibilityRole="header" variant="headlineMedium">
          {tabLabel}
        </Text>
        <Text variant="bodyMedium">
          {t("authPromptTitle", { defaultValue: "Sign in to continue" })}
        </Text>
        <Text variant="bodySmall">
          {t("authPromptBody", {
            defaultValue: "You can browse Explore now. Sign in or create an account to access this tab."
          })}
        </Text>
      </AppCard>
      <PrimaryButton label={t("signIn", { defaultValue: "Sign in" })} onPress={() => undefined} />
      <PrimaryButton label={t("createAccount", { defaultValue: "Create account" })} onPress={() => undefined} />
    </ScreenContainer>
  );
}

interface MainTabScreenProps {
  authenticated: boolean;
}

function MyHubScreen({ authenticated }: MainTabScreenProps): React.JSX.Element {
  const { t } = useTranslation();

  if (!authenticated) {
    return <RestrictedTabPlaceholderScreen tabLabel={t("myHubLabel", { defaultValue: "My Hub" })} />;
  }

  return <PlaceholderScreen tabLabel={t("myHubLabel", { defaultValue: "My Hub" })} />;
}

function CampaignsScreen({ authenticated }: MainTabScreenProps): React.JSX.Element {
  const { t } = useTranslation();

  if (!authenticated) {
    return <RestrictedTabPlaceholderScreen tabLabel={t("campaignsLabel", { defaultValue: "Campaigns" })} />;
  }

  return <PlaceholderScreen tabLabel={t("campaignsLabel", { defaultValue: "Campaigns" })} />;
}

function ChatScreen({ authenticated }: MainTabScreenProps): React.JSX.Element {
  const { t } = useTranslation();

  if (!authenticated) {
    return <RestrictedTabPlaceholderScreen tabLabel={t("chatLabel", { defaultValue: "Chat" })} />;
  }

  return <PlaceholderScreen tabLabel={t("chatLabel", { defaultValue: "Chat" })} />;
}

function NotificationsScreen({ authenticated }: MainTabScreenProps): React.JSX.Element {
  const { t } = useTranslation();

  if (!authenticated) {
    return <RestrictedTabPlaceholderScreen tabLabel={t("notificationsLabel", { defaultValue: "Notifications" })} />;
  }

  return <PlaceholderScreen tabLabel={t("notificationsLabel", { defaultValue: "Notifications" })} />;
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
            <MainTabsNavigator authenticated={authenticated} />
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
  tabLabel: {
    fontSize: 12,
    fontFamily: appFontFamilies.altGeneral
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24
  }
});
