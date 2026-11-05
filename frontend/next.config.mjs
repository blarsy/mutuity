import { createRequire } from "module";

const require = createRequire(import.meta.url);
const { withSentryConfig } = require("@sentry/nextjs/config");
const legacyAppRedirects = require("./legacyAppRedirects.cjs");

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: { instrumentationHook: true },
  webpack(config, { dev, isServer }) {
    if (!dev && !isServer) config.devtool = "hidden-source-map";
    return config;
  },
  async redirects() {
    return legacyAppRedirects;
  }
};

export default withSentryConfig(nextConfig, {
  silent: true,
  telemetry: false,
  // Explicit empty credential prevents fallback to SENTRY_AUTH_TOKEN in CI.
  // Archive/upload artifacts externally, then purge public .map files BEFORE deploy.
  authToken: "",
  release: { create: false, finalize: false },
  sourcemaps: { disable: false, deleteSourcemapsAfterUpload: false }
});
