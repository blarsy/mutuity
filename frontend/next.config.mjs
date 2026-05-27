import { createRequire } from "module";

const require = createRequire(import.meta.url);
const legacyAppRedirects = require("./legacyAppRedirects.cjs");

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  async redirects() {
    return legacyAppRedirects;
  }
};

export default nextConfig;
