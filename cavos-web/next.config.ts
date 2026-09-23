import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Exclude circuit files from output file tracing (they're read at runtime via fs)
  outputFileTracingExcludes: {
    '*': ['./circuits/**'],
  },
  serverExternalPackages: [
    'snarkjs',
    'poseidon-lite',
    'koffi',
    '@reclaimprotocol/attestor-core',
    // jwks-sync imports these through `new Function('specifier', 'return import(specifier)')`,
    // which the bundler cannot trace. Without them the serverless bundle omits the packages
    // and every register_key fails with "Cannot find package '@reclaimprotocol/tls'".
    '@reclaimprotocol/tls',
    '@reclaimprotocol/zk-symmetric-crypto',
    're2',
  ],
  async rewrites() {
    return [
      // Standard JWKS discovery path → Cavos Firebase public key endpoint
      { source: '/.well-known/jwks.json', destination: '/api/jwks/cavos-firebase' },
      // SEP-10 client_domain sign endpoint (canonical: /api/stellar/sep10/sign)
      { source: '/sign', destination: '/api/stellar/sep10/sign' },
      { source: '/vault', destination: '/vault/index.html' },
      { source: '/vault/confirm', destination: '/vault/confirm.html' },
    ];
  },
  async headers() {
    return [
      {
        source: "/vault/:path*",
        headers: [
          { key: "X-Robots-Tag", value: "noindex, nofollow" },
          { key: "Referrer-Policy", value: "no-referrer" },
          { key: "X-Content-Type-Options", value: "nosniff" },
        ],
      },
      {
        // Embedded by any app; the page itself checks the embedding origin.
        source: "/vault/:page(index.html)?",
        headers: [
          {
            key: "Content-Security-Policy",
            value: "default-src 'none'; script-src 'self'; connect-src 'self' https:; base-uri 'none'; form-action 'none'; frame-ancestors *",
          },
        ],
      },
      {
        // Top-level only: this is where the user decides, so nothing may draw over it.
        source: "/vault/:page(confirm|confirm.html)",
        headers: [
          {
            key: "Content-Security-Policy",
            value: "default-src 'none'; script-src 'self'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'",
          },
        ],
      },
      {
        source: "/.well-known/stellar.toml",
        headers: [
          { key: "Content-Type", value: "text/plain; charset=utf-8" },
          { key: "Access-Control-Allow-Origin", value: "*" },
        ],
      },
      {
        source: "/api/:path*",
        headers: [
          { key: "X-Robots-Tag", value: "noindex, nofollow" },
          { key: "Access-Control-Allow-Credentials", value: "true" },
          { key: "Access-Control-Allow-Origin", value: "*" },
          { key: "Access-Control-Allow-Methods", value: "GET,DELETE,PATCH,POST,PUT,OPTIONS" },
          { key: "Access-Control-Allow-Headers", value: "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization" },
        ],
      },
      {
        source: "/dashboard/:path*",
        headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow" }],
      },
      {
        source: "/apps/:path*",
        headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow" }],
      },
      {
        source:
          "/:utility(login|register|forgot-password|update-password|verification-error|verification-success)",
        headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow" }],
      },
      {
        source: "/auth/:path*",
        headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow" }],
      },
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
