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
