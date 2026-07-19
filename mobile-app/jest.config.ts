import type { Config } from "jest";

const config: Config = {
  preset: "jest-expo",
  testEnvironment: "node",
  setupFilesAfterEnv: ["<rootDir>/tests/setup.ts"],
  testMatch: ["**/tests/**/*.(test|spec).(ts|tsx)"],
  moduleFileExtensions: ["ts", "tsx", "js", "jsx", "json"],
  collectCoverageFrom: ["src/**/*.{ts,tsx}"],
  transformIgnorePatterns: [
    "node_modules/(?!((jest-)?react-native|@react-native|react-clone-referenced-element|@expo|expo(nent)?|expo-.*|@expo(nent)?/.*|expo-modules-core|@react-navigation|react-native-screens|react-native-safe-area-context|react-native-gesture-handler|react-native-paper)/)"
  ]
};

export default config;
