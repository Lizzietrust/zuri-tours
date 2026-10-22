import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "http",
        hostname: "localhost",
        port: "8000",
        pathname: "/img/**",
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      // Add your production API host here, e.g.
      // {
      //   protocol: "https",
      //   hostname: "api.zuritours.com",
      //   pathname: "/img/**",
      // },
    ],
  },
};

export default nextConfig;
