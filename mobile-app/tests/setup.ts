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
