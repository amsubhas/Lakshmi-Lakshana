import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // During local development, proxy /api/* to the backend
  // In production on Vercel, set NEXT_PUBLIC_API_URL to the full backend URL.
  // api.ts and useSSE.ts use NEXT_PUBLIC_API_URL directly (absolute URL),
  // so the proxy is only needed when NEXT_PUBLIC_API_URL is empty (local dev).
  ...(process.env.NEXT_PUBLIC_API_URL ? {} : {
    async rewrites() {
      const backend = process.env.BACKEND_URL || "http://localhost:8000";
      return [
        { source: "/api/:path*", destination: `${backend}/api/:path*` },
      ];
    },
  }),

  // Prevent build failures from warnings in strict mode
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Type errors are caught by CI's tsc --noEmit step instead
    ignoreBuildErrors: false,
  },
};

export default nextConfig;
