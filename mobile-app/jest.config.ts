import type { Config } from "jest";

const config: Config = {
  preset: "jest-expo",
  testEnvironment: "node",
  setupFilesAfterEnv: ["<rootDir>/tests/setup.ts"],
  testMatch: ["**/tests/**/*.(test|spec).(ts|tsx)"],
  moduleFileExtensions: ["ts", "tsx", "js", "jsx", "json"],
  collectCoverageFrom: ["src/**/*.{ts,tsx}"],
  transformIgnorePatterns: [
    "node_modules/(?!((jest-)?react-native|@react-native|react-clone-referenced-element|@expo|expo(nent)?|@expo(nent)?/.*|expo-modules-core)/)"
  ]
};

export default config;
