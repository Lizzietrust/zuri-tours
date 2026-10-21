import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      // Development
      {
        protocol: "http",
        hostname: "localhost",
        port: "8000",
        pathname: "/img/**",
      },
      // Add production domains here as needed, e.g.:
      // {
      //   protocol: "https",
      //   hostname: "api.zuritours.com",
      //   pathname: "/img/**",
      // },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
    ],
  },
};

export default nextConfig;
