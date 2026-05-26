/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  async redirects() {
    return [
      { source: "/needs/:path*", destination: "/app/needs/:path*", permanent: false },
      { source: "/resources/:path*", destination: "/app/resources/:path*", permanent: false },
      { source: "/campaigns/:path*", destination: "/app/campaigns/:path*", permanent: false },
      { source: "/accounts/:path*", destination: "/app/accounts/:path*", permanent: false },
      { source: "/admin/:path*", destination: "/app/admin/:path*", permanent: false },
      { source: "/grants/:path*", destination: "/app/grants/:path*", permanent: false },
      { source: "/notifications", destination: "/app/notifications", permanent: false },
      { source: "/chat", destination: "/app/chat", permanent: false },
      { source: "/claims", destination: "/app/claims", permanent: false },
      { source: "/bids", destination: "/app/bids", permanent: false },
      { source: "/contribution", destination: "/app/contribution", permanent: false },
      { source: "/preferences", destination: "/app/preferences", permanent: false },
      { source: "/profile", destination: "/app/profile", permanent: false },
      { source: "/change-password", destination: "/app/change-password", permanent: false }
    ];
  }
};

export default nextConfig;
