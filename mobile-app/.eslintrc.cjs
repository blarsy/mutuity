module.exports = {
  root: true,
  env: {
    es2022: true,
    node: true,
    jest: true
  },
  parser: "@typescript-eslint/parser",
  parserOptions: {
    ecmaVersion: "latest",
    sourceType: "module"
  },
  extends: [
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended",
    "prettier"
  ],
  plugins: ["@typescript-eslint"],
  ignorePatterns: ["node_modules/", "dist/", "build/"],
  rules: {
    "@typescript-eslint/no-unused-vars": [
      "warn",
      { "argsIgnorePattern": "^_", "varsIgnorePattern": "^_" }
    ]
  }
};
