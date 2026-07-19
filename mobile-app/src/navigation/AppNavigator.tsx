import React, { useState } from "react";
import { StyleSheet, View } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { Appbar, Text } from "react-native-paper";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";

import { AuthProvider, useAuth } from "../services/auth/AuthProvider";
import { AppCard, PrimaryButton, ScreenContainer } from "../components/primitives";
import { authenticateWithPassword } from "../services/graphql/auth";
import { EditResourceScreen } from "../screens/resources/EditResourceScreen";
import { MyResourcesScreen } from "../screens/resources/MyResourcesScreen";
import { SearchResourcesScreen } from "../screens/resources/SearchResourcesScreen";
import { LoginScreen } from "../screens/auth/LoginScreen";
import { RegisterScreen } from "../screens/auth/RegisterScreen";
import { ForgotPasswordScreen } from "../screens/auth/ForgotPasswordScreen";
import type { MyResourceItem } from "../services/graphql/resources";

type MainRouteName = "Explore" | "MyHub" | "Campaigns" | "Chat" | "Notifications";
type AuthEntryScreen = "login" | "register" | "forgotPassword";

interface AuthEntryState {
  screen: AuthEntryScreen;
  returnTo: MainRouteName;
}

interface RestrictedTabPlaceholderScreenProps {
  tabLabel: string;
  onSignIn: () => void;
  onCreateAccount: () => void;
}

interface MainTabScreenProps {
  authenticated: boolean;
  onRequestAuth: (screen: AuthEntryScreen, routeName: MainRouteName) => void;
}

interface AuthScreenShellProps {
  activeScreen: AuthEntryScreen;
  onCompleteLogin: (credentials: { email: string; password: string }) => Promise<void> | void;
  onCompleteRegister: (account: { fullName: string; email: string; password: string; confirmPassword: string }) => Promise<void> | void;
  onSwitchToSignIn: () => void;
  onSwitchToRegister: () => void;
  onSwitchToForgotPassword: () => void;
  onCancel: () => void;
}

const Tab = createBottomTabNavigator();
const mockAuthenticatedToken = "mock:123e4567-e89b-12d3-a456-426614174000";

function LoadingScreen(): React.JSX.Element {
  const { t } = useTranslation(["common", "us1"]);

  return (
    <View accessibilityRole="progressbar" style={styles.loadingContainer}>
      <Text>{t("loading", { ns: "common" })}</Text>
    </View>
  );
}

function PlaceholderScreen({ title }: { title: string }): React.JSX.Element {
  const { t } = useTranslation(["common", "us1"]);

  return (
    <ScreenContainer>
      <AppCard accessibilityLabel={title}>
        <Text accessibilityRole="header" variant="headlineMedium">
          {title}
        </Text>
        <Text variant="bodyMedium">{t("mainNavigation", { ns: "us1" })}</Text>
        <Text variant="bodySmall">{t("screenComingSoon", { defaultValue: "This screen is not implemented yet." })}</Text>
      </AppCard>
    </ScreenContainer>
  );
}

function RestrictedTabPlaceholderScreen({ tabLabel, onSignIn, onCreateAccount }: RestrictedTabPlaceholderScreenProps): React.JSX.Element {
  const { t } = useTranslation(["common", "us1"]);

  return (
    <ScreenContainer>
      <AppCard accessibilityLabel={t("restrictedSurfaceTitle", { ns: "us1" })}>
        <Text accessibilityRole="header" variant="headlineSmall">
          {tabLabel}
        </Text>
        <Text variant="bodyMedium">{t("restrictedSurfaceTitle", { ns: "us1" })}</Text>
        <Text variant="bodySmall">{t("restrictedSurfaceBody", { ns: "us1" })}</Text>
      </AppCard>
      <PrimaryButton label={t("signIn", { ns: "us1" })} onPress={onSignIn} />
      <PrimaryButton label={t("createAccount", { ns: "us1" })} onPress={onCreateAccount} />
    </ScreenContainer>
  );
}

function AuthScreenShell({
  activeScreen,
  onCompleteLogin,
  onCompleteRegister,
  onSwitchToSignIn,
  onSwitchToRegister,
  onSwitchToForgotPassword,
  onCancel
}: AuthScreenShellProps): React.JSX.Element {
  if (activeScreen === "register") {
    return (
      <RegisterScreen
        onSubmit={async (value) => {
          await onCompleteRegister(value);
        }}
        onSwitchToSignIn={onSwitchToSignIn}
        onCancel={onCancel}
      />
    );
  }

  if (activeScreen === "forgotPassword") {
    return (
      <ForgotPasswordScreen
        onSubmit={async () => {
          onSwitchToSignIn();
        }}
        onSwitchToSignIn={onSwitchToSignIn}
        onCancel={onCancel}
      />
    );
  }

  return (
    <LoginScreen
      onSubmit={async (value) => {
        await onCompleteLogin(value);
      }}
      onSwitchToRegister={onSwitchToRegister}
      onSwitchToForgotPassword={onSwitchToForgotPassword}
      onCancel={onCancel}
    />
  );
}

function MyHubScreen({ authenticated, onRequestAuth }: MainTabScreenProps): React.JSX.Element {
  const { t } = useTranslation(["common", "us1"]);
  const {
    session: { accountId }
  } = useAuth();
  const [editingResource, setEditingResource] = useState<MyResourceItem | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [refreshToken, setRefreshToken] = useState(0);

  const canAccessMyHub = authenticated && Boolean(accountId);

  if (!canAccessMyHub) {
    return (
      <RestrictedTabPlaceholderScreen
        tabLabel={t("myHubLabel", { ns: "us1" })}
        onSignIn={() => onRequestAuth("login", "MyHub")}
        onCreateAccount={() => onRequestAuth("register", "MyHub")}
      />
    );
  }

  if (isCreating || editingResource) {
    return (
      <EditResourceScreen
        creatorAccountId={accountId}
        initialResource={editingResource}
        onBack={() => {
          setIsCreating(false);
          setEditingResource(null);
        }}
        onSaved={() => {
          setIsCreating(false);
          setEditingResource(null);
          setRefreshToken((previous) => previous + 1);
        }}
      />
    );
  }

  return (
    <MyResourcesScreen
      creatorAccountId={accountId}
      refreshToken={refreshToken}
      onAddResource={() => {
        setIsCreating(true);
        setEditingResource(null);
      }}
      onEditResource={(resource) => {
        setIsCreating(false);
        setEditingResource(resource);
      }}
    />
  );
}

function CampaignsScreen({ authenticated, onRequestAuth }: MainTabScreenProps): React.JSX.Element {
  const { t } = useTranslation(["common", "us1"]);

  if (!authenticated) {
    return (
      <RestrictedTabPlaceholderScreen
        tabLabel={t("campaignsLabel", { ns: "us1" })}
        onSignIn={() => onRequestAuth("login", "Campaigns")}
        onCreateAccount={() => onRequestAuth("register", "Campaigns")}
      />
    );
  }

  return <PlaceholderScreen title={t("campaignsLabel", { ns: "us1" })} />;
}

function ChatScreen({ authenticated, onRequestAuth }: MainTabScreenProps): React.JSX.Element {
  const { t } = useTranslation(["common", "us1"]);

  if (!authenticated) {
    return (
      <RestrictedTabPlaceholderScreen
        tabLabel={t("chatLabel", { ns: "us1" })}
        onSignIn={() => onRequestAuth("login", "Chat")}
        onCreateAccount={() => onRequestAuth("register", "Chat")}
      />
    );
  }

  return <PlaceholderScreen title={t("chatLabel", { ns: "us1" })} />;
}

function NotificationsScreen({ authenticated, onRequestAuth }: MainTabScreenProps): React.JSX.Element {
  const { t } = useTranslation(["common", "us1"]);

  if (!authenticated) {
    return (
      <RestrictedTabPlaceholderScreen
        tabLabel={t("notificationsLabel", { ns: "us1" })}
        onSignIn={() => onRequestAuth("login", "Notifications")}
        onCreateAccount={() => onRequestAuth("register", "Notifications")}
      />
    );
  }

  return <PlaceholderScreen title={t("notificationsLabel", { ns: "us1" })} />;
}

function RootNavigator(): React.JSX.Element {
  const {
    session: { authenticated, loading },
    signIn
  } = useAuth();
  const { t } = useTranslation(["common", "us1"]);
  const [authEntry, setAuthEntry] = useState<AuthEntryState | null>(null);
  const [activeRouteName, setActiveRouteName] = useState<MainRouteName>("Explore");
  const [mainNavigatorVersion, setMainNavigatorVersion] = useState(0);

  const requestAuth = (screen: AuthEntryScreen, routeName: MainRouteName): void => {
    setAuthEntry({ screen, returnTo: routeName });
  };

  const completeLoginAuth = async (credentials: { email: string; password: string }): Promise<void> => {
    if (!authEntry) {
      return;
    }

    const { accountId } = await authenticateWithPassword(credentials);
    await signIn(accountId);
    setActiveRouteName(authEntry.returnTo);
    setMainNavigatorVersion((previous) => previous + 1);
    setAuthEntry(null);
  };

  const completeRegisterAuth = async (): Promise<void> => {
    if (!authEntry) {
      return;
    }

    await signIn(mockAuthenticatedToken);
    setActiveRouteName(authEntry.returnTo);
    setMainNavigatorVersion((previous) => previous + 1);
    setAuthEntry(null);
  };

  const tabBarIconByRoute: Record<MainRouteName, string> = {
    Explore: "compass-outline",
    MyHub: "view-dashboard-outline",
    Campaigns: "bullhorn-outline",
    Chat: "chat-outline",
    Notifications: "bell-outline"
  };

  const headerTitleByRoute: Record<MainRouteName, string> = {
    Explore: t("exploreLabel", { ns: "us1" }),
    MyHub: t("myHubLabel", { ns: "us1" }),
    Campaigns: t("campaignsLabel", { ns: "us1" }),
    Chat: t("chatLabel", { ns: "us1" }),
    Notifications: t("notificationsLabel", { ns: "us1" })
  };

  const currentHeaderTitle = headerTitleByRoute[activeRouteName];

  return (
    <SafeAreaProvider>
      <SafeAreaView edges={["top", "right", "left"]} style={styles.fill}>
        <Appbar.Header mode="center-aligned" statusBarHeight={0} style={styles.header}>
          <Appbar.Action
            accessibilityLabel="Support"
            icon="help-circle-outline"
            size={24}
            color="#000"
            style={styles.headerAction}
            onPress={() => undefined}
          />
          <Text accessibilityRole="header" style={styles.title}>
            {currentHeaderTitle}
          </Text>
          <Appbar.Action
            accessibilityLabel="Account"
            icon="account-outline"
            size={24}
            color="#000"
            style={styles.headerAction}
            onPress={() => requestAuth("login", "Explore")}
          />
        </Appbar.Header>

        {loading ? (
          <LoadingScreen />
        ) : authEntry ? (
          <AuthScreenShell
            activeScreen={authEntry.screen}
            onCompleteLogin={completeLoginAuth}
            onCompleteRegister={completeRegisterAuth}
            onSwitchToSignIn={() => setAuthEntry((previous) => (previous ? { ...previous, screen: "login" } : previous))}
            onSwitchToRegister={() => setAuthEntry((previous) => (previous ? { ...previous, screen: "register" } : previous))}
            onSwitchToForgotPassword={() => setAuthEntry((previous) => (previous ? { ...previous, screen: "forgotPassword" } : previous))}
            onCancel={() => setAuthEntry(null)}
          />
        ) : (
          <View accessible accessibilityLabel={t("mainNavigation", { ns: "us1", defaultValue: "Main navigation" })} style={styles.fill}>
            <NavigationContainer>
              <Tab.Navigator
                key={mainNavigatorVersion}
                initialRouteName={activeRouteName}
                screenListeners={({ route }) => ({
                  focus: () => {
                    const routeName = route.name;
                    if (routeName in headerTitleByRoute) {
                      setActiveRouteName(routeName as MainRouteName);
                    }
                  }
                })}
                screenOptions={({ route }) => ({
                  headerShown: false,
                  tabBarIcon: ({ color, size, focused }) => {
                    const outlinedIcon = tabBarIconByRoute[route.name as MainRouteName] ?? "circle-outline";
                    const iconName = focused ? outlinedIcon.replace("-outline", "") : outlinedIcon;

                    return (
                      <MaterialCommunityIcons
                        name={iconName as keyof typeof MaterialCommunityIcons.glyphMap}
                        size={size}
                        color={color}
                      />
                    );
                  }
                })}
              >
                <Tab.Screen
                  name="Explore"
                  component={SearchResourcesScreen}
                  options={{ tabBarLabel: t("exploreLabel", { ns: "us1" }) }}
                />
                <Tab.Screen name="MyHub" options={{ tabBarLabel: t("myHubLabel", { ns: "us1" }) }}>
                  {() => <MyHubScreen authenticated={authenticated} onRequestAuth={requestAuth} />}
                </Tab.Screen>
                <Tab.Screen name="Campaigns" options={{ tabBarLabel: t("campaignsLabel", { ns: "us1" }) }}>
                  {() => <CampaignsScreen authenticated={authenticated} onRequestAuth={requestAuth} />}
                </Tab.Screen>
                <Tab.Screen name="Chat" options={{ tabBarLabel: t("chatLabel", { ns: "us1" }) }}>
                  {() => <ChatScreen authenticated={authenticated} onRequestAuth={requestAuth} />}
                </Tab.Screen>
                <Tab.Screen name="Notifications" options={{ tabBarLabel: t("notificationsLabel", { ns: "us1" }) }}>
                  {() => <NotificationsScreen authenticated={authenticated} onRequestAuth={requestAuth} />}
                </Tab.Screen>
              </Tab.Navigator>
            </NavigationContainer>
          </View>
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

const styles = StyleSheet.create({
  fill: {
    flex: 1
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center"
  },
  header: {
    backgroundColor: "#ff4401"
  },
  title: {
    color: "#ffffff",
    fontWeight: "400",
    textAlign: "center",
    textTransform: "uppercase",
    letterSpacing: 0.8,
    fontSize: 18,
    lineHeight: 22,
    flex: 1
  },
  headerAction: {
    backgroundColor: "#fef0e3"
  }
});
