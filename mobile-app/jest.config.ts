import type { Config } from "jest";

const config: Config = {
  preset: "jest-expo",
  testEnvironment: "node",
  setupFilesAfterEnv: ["<rootDir>/tests/setup.ts"],
  testMatch: ["**/tests/**/*.(test|spec).(ts|tsx)"],
  moduleFileExtensions: ["ts", "tsx", "js", "jsx", "json"],
  moduleNameMapper: {
    "^.+/assets/img/claim\\.svg$": "<rootDir>/tests/mocks/claimSvgMock.tsx",
    "^.+/assets/img/BELL\\.svg$": "<rootDir>/tests/mocks/bellSvgMock.tsx",
    "^.+/assets/img/denied\\.svg$": "<rootDir>/tests/mocks/deniedSvgMock.tsx",
    "^.+/assets/img/gone\\.svg$": "<rootDir>/tests/mocks/goneSvgMock.tsx",
    "^.+/assets/img/time-up\\.svg$": "<rootDir>/tests/mocks/timeUpSvgMock.tsx",
    "\\.svg$": "<rootDir>/tests/mocks/svgMock.tsx"
  },
  collectCoverageFrom: ["src/**/*.{ts,tsx}"],
  transformIgnorePatterns: [
    "node_modules/(?!((jest-)?react-native|@react-native|react-clone-referenced-element|@expo|expo(nent)?|expo-.*|@expo(nent)?/.*|expo-modules-core|@react-navigation|react-native-screens|react-native-safe-area-context|react-native-gesture-handler|react-native-paper)/)"
  ]
};

export default config;
