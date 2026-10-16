import type { NextConfig } from "next";

const backendUrl =
  process.env.INTERNAL_API_URL ??
  process.env.NEXT_PUBLIC_API_URL ??
  "http://localhost:5000/api/v1";

// Strip /api/v1 suffix if present to get the bare origin.
const backendOrigin = backendUrl.replace(/\/api\/v\d+\/?$/, "");

const nextConfig: NextConfig = {
  basePath: "/admin",
  async rewrites() {
    return [
      {
        source: "/api/v1/:path*",
        destination: `${backendOrigin}/api/v1/:path*`,
      },
    ];
  },

  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "api.dicebear.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
        pathname: "/**",
      },
    ],
  },
  allowedDevOrigins: ["172.20.10.3"],
};

export default nextConfig;

// NOTE: This file should not be edited