import type { NextConfig } from "next";

const nextConfig: NextConfig = {

  reactStrictMode: false,

  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
    ],
  },

  async redirects() {
    return [
      {
        source: "/:lang/admin/insight",
        destination: "/:lang/admin/insights",
        permanent: true,
      },
      {
        source: "/:lang/admin/insight/:path*",
        destination: "/:lang/admin/insights/:path*",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;