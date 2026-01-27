import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone',
  // Exclude circuit files from output file tracing (they're read at runtime via fs)
  outputFileTracingExcludes: {
    '*': ['./circuits/**'],
  },
  serverExternalPackages: ['snarkjs', 'poseidon-lite'],
  async headers() {
    return [
      {
        source: "/api/:path*",
        headers: [
          { key: "Access-Control-Allow-Credentials", value: "true" },
          { key: "Access-Control-Allow-Origin", value: "*" },
          { key: "Access-Control-Allow-Methods", value: "GET,DELETE,PATCH,POST,PUT" },
          { key: "Access-Control-Allow-Headers", value: "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version" },
        ]
      }
    ]
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'iptkkciwewzpmzfhkpqf.supabase.co',
        port: '',
        pathname: '/storage/v1/object/public/**',
      },
    ],
  },
};

export default nextConfig;
