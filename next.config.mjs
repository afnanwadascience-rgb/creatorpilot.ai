/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // CreatorPilot AI is served from inside a Whop iframe / redirect flow.
  // Allow Whop to frame this app and keep default security headers otherwise.
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
        ],
      },
    ];
  },
};

export default nextConfig;
