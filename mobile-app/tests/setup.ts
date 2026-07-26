import "@testing-library/jest-native/extend-expect";

jest.mock("react-native/Libraries/Animated/NativeAnimatedHelper", () => ({}), {
	virtual: true
});

jest.mock("expo-constants", () => {
	const localAppSettings = require("../config/environments/local.json");

	return {
		__esModule: true,
		default: {
			expoConfig: {
				extra: {
					targetEnv: localAppSettings.targetEnv,
					appSettings: localAppSettings
				}
			}
		},
		expoConfig: {
			extra: {
				targetEnv: localAppSettings.targetEnv,
				appSettings: localAppSettings
			}
		}
	};
});

jest.mock("@react-navigation/bottom-tabs", () => {
	const mockReact = require("react");
	const { View } = require("react-native");

	return {
		createBottomTabNavigator: () => ({
			Navigator: ({ children }: { children: any }) =>
				mockReact.createElement(mockReact.Fragment, null, children),
			Screen: ({ component: Component, children }: { component?: any; children?: any }) => {
				if (Component) {
					return mockReact.createElement(View, null, mockReact.createElement(Component));
				}

				if (typeof children === "function") {
					return mockReact.createElement(View, null, children());
				}

				return mockReact.createElement(View, null, children ?? null);
			}
		})
	};
});

jest.mock("react-native-maps", () => {
	const mockReact = require("react");
	const { View } = require("react-native");

	const MockMap = ({ children }: { children?: any }) => mockReact.createElement(View, null, children ?? null);
	const MockMarker = ({ children }: { children?: any }) => mockReact.createElement(View, null, children ?? null);

	return {
		__esModule: true,
		default: MockMap,
		Marker: MockMarker,
		PROVIDER_GOOGLE: "google"
	};
});

jest.mock("expo-font", () => ({
	isLoaded: () => true,
	loadAsync: async () => undefined,
	useFonts: () => [true, null]
}));

jest.mock("expo-image-picker", () => ({
	MediaTypeOptions: {
		Images: "Images"
	},
	requestMediaLibraryPermissionsAsync: async () => ({ granted: true }),
	requestCameraPermissionsAsync: async () => ({ granted: true }),
	launchImageLibraryAsync: async () => ({ canceled: true, assets: [] }),
	launchCameraAsync: async () => ({ canceled: true, assets: [] })
}));

jest.mock("expo-linear-gradient", () => {
	const mockReact = require("react");
	const { View } = require("react-native");

	return {
		LinearGradient: ({ children }: { children?: React.ReactNode }) =>
			mockReact.createElement(View, null, children ?? null)
	};
});

jest.mock("react-native-paper-dates", () => ({
	DatePickerModal: () => null
}));

jest.mock("react-native-safe-area-context", () => {
	const mockReact = require("react");
	const { View } = require("react-native");
	const insets = { top: 0, right: 0, bottom: 0, left: 0 };
	const frame = { x: 0, y: 0, width: 320, height: 640 };
	const SafeAreaInsetsContext = mockReact.createContext(insets);
	const SafeAreaFrameContext = mockReact.createContext(frame);

	return {
		SafeAreaInsetsContext,
		SafeAreaFrameContext,
		SafeAreaProvider: ({ children }: { children?: React.ReactNode }) =>
			mockReact.createElement(View, null, children ?? null),
		SafeAreaView: ({ children }: { children?: React.ReactNode }) =>
			mockReact.createElement(View, null, children ?? null),
		useSafeAreaInsets: () => insets,
		useSafeAreaFrame: () => frame
	};
});
