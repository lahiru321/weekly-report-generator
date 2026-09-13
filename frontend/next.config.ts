import type { NextConfig } from "next";

const backendUrl = process.env.BACKEND_URL ?? "http://localhost:8081";

const nextConfig: NextConfig = {
  // The browser calls /api/* on the Next.js origin and Next forwards it to Spring Boot.
  // Same origin means the httpOnly auth cookie just works, with no CORS setup.
  async rewrites() {
    return [{ source: "/api/:path*", destination: `${backendUrl}/api/:path*` }];
  },
};

export default nextConfig;
