import React, { useState } from "react";
import { Dimensions, Pressable, StyleSheet, View } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { Appbar, Menu, Text } from "react-native-paper";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";

import { AuthProvider, useAuth } from "../services/auth/AuthProvider";
import { AppCard, PrimaryButton, ScreenContainer } from "../components/primitives";
import { authenticateWithPassword } from "../services/graphql/auth";
import { EditResourceScreen } from "../screens/resources/EditResourceScreen";
import { MyResourcesScreen } from "../screens/resources/MyResourcesScreen";
import { EditNeedScreen } from "../screens/needs/EditNeedScreen";
import { MyNeedsScreen } from "../screens/needs/MyNeedsScreen";
import { ReceivedBidsScreen } from "../screens/bids/ReceivedBidsScreen";
import { SentBidsScreen } from "../screens/bids/SentBidsScreen";
import { MyClaimsScreen } from "../screens/claims/MyClaimsScreen";
import { ChatListScreen } from "../screens/chat/ChatListScreen";
import { ChatDetailScreen } from "../screens/chat/ChatDetailScreen";
import { NotificationsScreen as MobileNotificationsScreen } from "../screens/notifications/NotificationsScreen";
import { MyProfileScreen } from "../screens/profile/MyProfileScreen";
import { MyPreferencesScreen } from "../screens/profile/MyPreferencesScreen";
import { MyEconomicsScreen } from "../screens/economics/MyEconomicsScreen";
import { LoginScreen } from "../screens/auth/LoginScreen";
import { RegisterScreen } from "../screens/auth/RegisterScreen";
import { ForgotPasswordScreen } from "../screens/auth/ForgotPasswordScreen";
import type { MyResourceItem } from "../services/graphql/resources";
import type { NeedItem } from "../services/graphql/needs";
import { designTokens } from "../theme/tokens";
import { appFontFamilies } from "../theme/fonts";
import { US2ExploreScreen } from "./US2Navigator";
import { US3Navigator } from "./US3Navigator";
import {
  TopelaBellIcon,
  TopelaChatIcon,
  TopelaModifyIcon,
  TopelaSearchIcon
} from "../components/icons/TopelaBottomTabIcons";

type MainRouteName = "Explore" | "MyHub" | "Campaigns" | "Chat" | "Notifications";
type AuthEntryScreen = "login" | "register" | "forgotPassword";
type MyHubDrawerItem =
  | "myResources"
  | "receivedBids"
  | "sentBids"
  | "myNeeds"
  | "receivedClaims"
  | "sentClaims"
  | "profile"
  | "preferences"
  | "contribution";

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

interface MyHubScreenProps extends MainTabScreenProps {
  drawerVisible: boolean;
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
const isCompactTabLayout = Dimensions.get("window").width < 400;
const tabBarIconSize = 26;
const standardAppBarTitleFontSize = 36;
const appBarTitleFontSize = isCompactTabLayout ? 30 : standardAppBarTitleFontSize;

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

function MyHubDrawerPlaceholderSurface({ title, body }: { title: string; body: string }): React.JSX.Element {
  return (
    <ScreenContainer>
      <AppCard accessibilityLabel={title}>
        <Text accessibilityRole="header" variant="headlineSmall">
          {title}
        </Text>
        <Text variant="bodyMedium">{body}</Text>
      </AppCard>
    </ScreenContainer>
  );
}

function MyHubScreen({ authenticated, onRequestAuth, drawerVisible }: MyHubScreenProps): React.JSX.Element {
  const { t } = useTranslation(["common", "us1"]);
  const {
    session: { accountId },
    signOut
  } = useAuth();
  const [editingResource, setEditingResource] = useState<MyResourceItem | null>(null);
  const [editingNeed, setEditingNeed] = useState<NeedItem | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [isCreatingNeed, setIsCreatingNeed] = useState(false);
  const [refreshToken, setRefreshToken] = useState(0);
  const [needsRefreshToken, setNeedsRefreshToken] = useState(0);
  const [activeDrawerItem, setActiveDrawerItem] = useState<MyHubDrawerItem>("myResources");

  const canAccessMyHub = authenticated && Boolean(accountId);

  const topDrawerItems: Array<{ key: MyHubDrawerItem; label: string }> = [
    { key: "myResources", label: t("myHubDrawerMyResources", { ns: "us1", defaultValue: "My resources" }) },
    { key: "receivedBids", label: t("myHubDrawerReceivedBids", { ns: "us1", defaultValue: "Received bids" }) },
    { key: "sentBids", label: t("myHubDrawerSentBids", { ns: "us1", defaultValue: "Sent bids" }) },
    { key: "myNeeds", label: t("myHubDrawerMyNeeds", { ns: "us1", defaultValue: "My needs" }) },
    { key: "receivedClaims", label: t("myHubDrawerReceivedClaims", { ns: "us1", defaultValue: "Received claims" }) },
    { key: "sentClaims", label: t("myHubDrawerSentClaims", { ns: "us1", defaultValue: "Sent claims" }) }
  ];

  const bottomDrawerItems: Array<{ key: MyHubDrawerItem; label: string }> = [
    { key: "profile", label: t("myHubDrawerProfile", { ns: "us1", defaultValue: "Profile" }) },
    { key: "preferences", label: t("myHubDrawerPreferences", { ns: "us1", defaultValue: "Preferences" }) },
    { key: "contribution", label: t("myHubDrawerContribution", { ns: "us1", defaultValue: "Contribution" }) }
  ];

  const drawerIconByItem: Record<MyHubDrawerItem, keyof typeof MaterialCommunityIcons.glyphMap> = {
    myResources: "cube-outline",
    receivedBids: "arrow-down-circle-outline",
    sentBids: "arrow-up-circle-outline",
    myNeeds: "clipboard-list-outline",
    receivedClaims: "download-circle-outline",
    sentClaims: "arrow-up-circle-outline",
    profile: "account-circle-outline",
    preferences: "tune-variant",
    contribution: "cash-multiple"
  };

  const renderActiveSurface = (): React.JSX.Element => {
    if (!accountId) {
      return <LoadingScreen />;
    }

    if (activeDrawerItem === "myResources") {
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

    if (activeDrawerItem === "receivedBids") {
      return <ReceivedBidsScreen />;
    }

    if (activeDrawerItem === "sentBids") {
      return <SentBidsScreen />;
    }

    if (activeDrawerItem === "myNeeds") {
      return (
        <MyNeedsScreen
          creatorAccountId={accountId}
          refreshToken={needsRefreshToken}
          onAddNeed={() => {
            setIsCreatingNeed(true);
            setEditingNeed(null);
          }}
          onEditNeed={(need) => {
            setIsCreatingNeed(false);
            setEditingNeed(need);
          }}
        />
      );
    }

    if (activeDrawerItem === "receivedClaims" || activeDrawerItem === "sentClaims") {
      return (
        <MyClaimsScreen
          direction={activeDrawerItem === "receivedClaims" ? "received" : "sent"}
          accountId={accountId}
        />
      );
    }

    if (activeDrawerItem === "profile") {
      return (
        <MyProfileScreen
          accountId={accountId}
          onLogout={async () => {
            await signOut();
          }}
        />
      );
    }

    if (activeDrawerItem === "preferences") {
      return <MyPreferencesScreen accountId={accountId} />;
    }

    return <MyEconomicsScreen accountId={accountId} />;
  };

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

  if (isCreatingNeed || editingNeed) {
    return (
      <EditNeedScreen
        creatorAccountId={accountId}
        initialNeed={editingNeed}
        onBack={() => {
          setIsCreatingNeed(false);
          setEditingNeed(null);
        }}
        onSaved={() => {
          setIsCreatingNeed(false);
          setEditingNeed(null);
          setNeedsRefreshToken((previous) => previous + 1);
        }}
      />
    );
  }

  return (
    <View style={styles.myHubLayout}>
      {drawerVisible ? (
        <View style={styles.myHubDrawer}>
          <View style={styles.myHubDrawerSection}>
            {topDrawerItems.map((item) => {
              const selected = activeDrawerItem === item.key;

              return (
                <Pressable
                  key={item.key}
                  accessibilityRole="button"
                  accessibilityLabel={item.label}
                  onPress={() => setActiveDrawerItem(item.key)}
                  style={[styles.drawerItem, selected ? styles.drawerItemSelected : null]}
                >
                  <MaterialCommunityIcons
                    name={drawerIconByItem[item.key]}
                    size={20}
                    color={selected ? "#ffffff" : "#7a3a15"}
                  />
                  <Text style={[styles.drawerItemLabel, selected ? styles.drawerItemLabelSelected : null]}>{item.label}</Text>
                </Pressable>
              );
            })}
          </View>

          <View style={styles.myHubDrawerSection}>
            {bottomDrawerItems.map((item) => {
              const selected = activeDrawerItem === item.key;

              return (
                <Pressable
                  key={item.key}
                  accessibilityRole="button"
                  accessibilityLabel={item.label}
                  onPress={() => setActiveDrawerItem(item.key)}
                  style={[styles.drawerItem, selected ? styles.drawerItemSelected : null]}
                >
                  <MaterialCommunityIcons
                    name={drawerIconByItem[item.key]}
                    size={20}
                    color={selected ? "#ffffff" : "#7a3a15"}
                  />
                  <Text style={[styles.drawerItemLabel, selected ? styles.drawerItemLabelSelected : null]}>{item.label}</Text>
                </Pressable>
              );
            })}
          </View>
        </View>
      ) : null}

      <View style={styles.myHubContent}>{renderActiveSurface()}</View>
    </View>
  );
}

function CampaignsScreen({ authenticated, onRequestAuth }: MainTabScreenProps): React.JSX.Element {
  const { t } = useTranslation(["common", "us1"]);
  const {
    session: { accountId }
  } = useAuth();
  if (!authenticated) {
    return (
      <RestrictedTabPlaceholderScreen
        tabLabel={t("campaignsLabel", { ns: "us1" })}
        onSignIn={() => onRequestAuth("login", "Campaigns")}
        onCreateAccount={() => onRequestAuth("register", "Campaigns")}
      />
    );
  }

  if (!accountId) {
    return <LoadingScreen />;
  }

  return <US3Navigator currentAccountId={accountId} />;
}

function ChatScreen({ authenticated, onRequestAuth }: MainTabScreenProps): React.JSX.Element {
  const { t } = useTranslation(["common", "us1"]);
  const {
    session: { accountId }
  } = useAuth();
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);

  if (!authenticated) {
    return (
      <RestrictedTabPlaceholderScreen
        tabLabel={t("chatLabel", { ns: "us1" })}
        onSignIn={() => onRequestAuth("login", "Chat")}
        onCreateAccount={() => onRequestAuth("register", "Chat")}
      />
    );
  }

  if (!accountId) {
    return <LoadingScreen />;
  }

  if (activeConversationId) {
    return (
      <ChatDetailScreen
        conversationId={activeConversationId}
        currentAccountId={accountId}
        conversation={null}
        onBackToList={() => setActiveConversationId(null)}
      />
    );
  }

  return (
    <ChatListScreen
      onOpenMyHub={() => undefined}
      onOpenConversation={(conversationId) => setActiveConversationId(conversationId)}
    />
  );
}

function NotificationsScreen({ authenticated, onRequestAuth }: MainTabScreenProps): React.JSX.Element {
  const { t } = useTranslation(["common", "us1"]);
  const {
    session: { accountId }
  } = useAuth();

  if (!authenticated) {
    return (
      <RestrictedTabPlaceholderScreen
        tabLabel={t("notificationsLabel", { ns: "us1" })}
        onSignIn={() => onRequestAuth("login", "Notifications")}
        onCreateAccount={() => onRequestAuth("register", "Notifications")}
      />
    );
  }

  if (!accountId) {
    return <LoadingScreen />;
  }

  return (
    <MobileNotificationsScreen
      accountId={accountId}
      onOpenNotification={() => undefined}
    />
  );
}

function RootNavigator(): React.JSX.Element {
  const {
    session: { authenticated, loading, accountId },
    signIn,
    signOut
  } = useAuth();
  const { t } = useTranslation(["common", "us1"]);
  const [authEntry, setAuthEntry] = useState<AuthEntryState | null>(null);
  const [activeRouteName, setActiveRouteName] = useState<MainRouteName>("Explore");
  const [mainNavigatorVersion, setMainNavigatorVersion] = useState(0);
  const [accountMenuVisible, setAccountMenuVisible] = useState(false);
  const [myHubDrawerVisible, setMyHubDrawerVisible] = useState(true);

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
    Explore: "circle-outline",
    MyHub: "circle-outline",
    Campaigns: "bullhorn-outline",
    Chat: "circle-outline",
    Notifications: "circle-outline"
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
          <View style={styles.headerLeadingActions}>
            {activeRouteName === "MyHub" ? (
              <Appbar.Action
                accessibilityLabel={t("toggleDrawer", { ns: "us1", defaultValue: "Toggle drawer" })}
                icon={myHubDrawerVisible ? "menu-open" : "menu"}
                size={24}
                color="#000"
                style={styles.headerAction}
                onPress={() => setMyHubDrawerVisible((previous) => !previous)}
              />
            ) : (
              <View style={styles.headerActionSpacer} />
            )}
            <Appbar.Action
              accessibilityLabel={t("support", { ns: "common", defaultValue: "Support" })}
              icon="help"
              size={24}
              color="#000"
              style={styles.headerAction}
              onPress={() => undefined}
            />
          </View>
          <Text accessibilityRole="header" style={styles.title}>
            {currentHeaderTitle}
          </Text>
          {authenticated ? (
            <Menu
              visible={accountMenuVisible}
              onDismiss={() => setAccountMenuVisible(false)}
              anchor={(
                <Appbar.Action
                  accessibilityLabel="Account"
                  icon="account-outline"
                  size={24}
                  color="#000"
                  style={styles.headerAction}
                  onPress={() => setAccountMenuVisible(true)}
                />
              )}
            >
              <Menu.Item
                title={t("logout", { ns: "us1", defaultValue: "Log out" })}
                onPress={async () => {
                  setAccountMenuVisible(false);
                  await signOut();
                }}
              />
            </Menu>
          ) : (
            <Appbar.Action
              accessibilityLabel="Account"
              icon="account-outline"
              size={24}
              color="#000"
              style={styles.headerAction}
              onPress={() => {
                requestAuth("login", "Explore");
              }}
            />
          )}
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
                  tabBarActiveTintColor: designTokens.colors.primary,
                  tabBarInactiveTintColor: "#000000",
                  tabBarStyle: {
                    backgroundColor: designTokens.colors.secondary,
                    borderTopWidth: 0,
                    height: isCompactTabLayout ? 64 : 72,
                    paddingTop: isCompactTabLayout ? 4 : 8,
                    paddingBottom: isCompactTabLayout ? 6 : 10
                  },
                  tabBarLabelStyle: {
    textTransform: "uppercase",
    textAlign: "center",
                    fontSize: isCompactTabLayout ? 11 : 12,
                    lineHeight: isCompactTabLayout ? 13 : 14,
                    fontFamily: appFontFamilies.altGeneral,
                    letterSpacing: 0.4,
                    marginTop: -2
                  },
                  tabBarIcon: ({ color, focused }) => {
                    if (route.name === "Explore") {
                      return <TopelaSearchIcon color={color} size={tabBarIconSize} />;
                    }

                    if (route.name === "MyHub") {
                      return <TopelaModifyIcon color={color} size={tabBarIconSize} />;
                    }

                    if (route.name === "Chat") {
                      return <TopelaChatIcon color={color} size={tabBarIconSize} />;
                    }

                    if (route.name === "Notifications") {
                      return <TopelaBellIcon color={color} size={tabBarIconSize} />;
                    }

                    const outlinedIcon = tabBarIconByRoute[route.name as MainRouteName] ?? "circle-outline";
                    const iconName = focused ? outlinedIcon.replace("-outline", "") : outlinedIcon;

                    return (
                      <MaterialCommunityIcons
                        name={iconName as keyof typeof MaterialCommunityIcons.glyphMap}
                        size={tabBarIconSize}
                        color={color}
                      />
                    );
                  }
                })}
              >
                <Tab.Screen
                  name="Explore"
                  options={{ tabBarLabel: t("exploreLabel", { ns: "us1" }).toUpperCase() }}
                >
                  {() => <US2ExploreScreen currentAccountId={accountId} />}
                </Tab.Screen>
                <Tab.Screen name="MyHub" options={{ tabBarLabel: t("myHubLabel", { ns: "us1" }).toUpperCase() }}>
                  {() => (
                    <MyHubScreen
                      authenticated={authenticated}
                      onRequestAuth={requestAuth}
                      drawerVisible={myHubDrawerVisible}
                    />
                  )}
                </Tab.Screen>
                <Tab.Screen name="Campaigns" options={{ tabBarLabel: t("campaignsLabel", { ns: "us1" }).toUpperCase() }}>
                  {() => <CampaignsScreen authenticated={authenticated} onRequestAuth={requestAuth} />}
                </Tab.Screen>
                <Tab.Screen name="Chat" options={{ tabBarLabel: t("chatLabel", { ns: "us1" }).toUpperCase() }}>
                  {() => <ChatScreen authenticated={authenticated} onRequestAuth={requestAuth} />}
                </Tab.Screen>
                <Tab.Screen name="Notifications" options={{ tabBarLabel: t("notificationsLabel", { ns: "us1" }).toUpperCase() }}>
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
    fontFamily: appFontFamilies.title,
    fontWeight: "400",
    textAlign: "center",
    textTransform: "uppercase",
    letterSpacing: 0.8,
    fontSize: appBarTitleFontSize,
    lineHeight: appBarTitleFontSize + 4,
    flex: 1
  },
  headerAction: {
    backgroundColor: "#fef0e3"
  },
  headerActionSpacer: {
    width: 40,
    height: 40
  },
  headerLeadingActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4
  },
  myHubLayout: {
    flex: 1,
    flexDirection: "row"
  },
  myHubDrawer: {
    backgroundColor: "#fff2e6",
    borderRightWidth: 1,
    borderRightColor: "#f1d6bf",
    paddingVertical: 4,
    paddingRight: 8,
    paddingLeft: 0,
    justifyContent: "space-between"
  },
  myHubDrawerSection: {
    gap: 8
  },
  drawerItem: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 4,
    paddingHorizontal: 4,
    borderTopRightRadius: 8,
    borderBottomRightRadius: 8,
    borderWidth: 1,
    borderLeftWidth: 0,
    borderColor: "#f1d6bf"
  },
  drawerItemSelected: {
    backgroundColor: "#ff4401",
    borderColor: "#ff4401",
    paddingVertical: 4,
  },
  drawerItemLabel: {
    color: "#7a3a15",
    textAlign: "center",
    fontSize: 11,
    lineHeight: 14,
    fontWeight: "600"
  },
  drawerItemLabelSelected: {
    color: "#ffffff"
  },
  myHubContent: {
    flex: 1
  }
});

