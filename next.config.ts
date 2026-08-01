import type { NextConfig } from "next";
import withPWAInit from "@ducanh2912/next-pwa";

const withPWA = withPWAInit({
  dest: "public",
  disable: process.env.NODE_ENV === "development",
  reloadOnOnline: true,
  cacheOnFrontEndNav: false,
  aggressiveFrontEndNavCaching: false,
  extendDefaultRuntimeCaching: true,
  workboxOptions: {
    disableDevLogs: true,
    cleanupOutdatedCaches: true,
    skipWaiting: true,
    clientsClaim: true,
    importScripts: ["/sw-helpers.js"],
    navigateFallbackDenylist: [
      /^\/api\//,
      /^https:\/\/(?:[^/]+\.)?razorpay\.com/,
      /^https:\/\/(?:[^/]+\.)?phonepe\.com/,
      /^\/admin/,
    ],
    runtimeCaching: [
      {
        urlPattern: /^https:\/\/(?:[^/]+\.)?razorpay\.com\/.*/i,
        handler: "NetworkOnly",
      },
      {
        urlPattern: /^https:\/\/(?:[^/]+\.)?phonepe\.com\/.*/i,
        handler: "NetworkOnly",
      },
      {
        urlPattern: /^\/api\/auth\/.*/i,
        handler: "NetworkOnly",
      },
      {
        urlPattern: /^\/api\/.*/i,
        handler: "NetworkFirst",
        options: {
          cacheName: "apis",
          networkTimeoutSeconds: 5,
          expiration: {
            maxEntries: 32,
            maxAgeSeconds: 86400,
          },
        },
      },
    ],
  },
  fallbacks: {
    document: "/~offline",
  },
});

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
    ],
    formats: ["image/avif", "image/webp"],
  },
  headers: async () => [
    {
      source: "/:path*",
      headers: [
        {
          key: "X-DNS-Prefetch-Control",
          value: "on",
        },
        {
          key: "Strict-Transport-Security",
          value: "max-age=63072000; includeSubDomains; preload",
        },
        {
          key: "X-Frame-Options",
          value: "SAMEORIGIN",
        },
        {
          key: "X-Content-Type-Options",
          value: "nosniff",
        },
        {
          key: "Referrer-Policy",
          value: "strict-origin-when-cross-origin",
        },
        {
          key: "Permissions-Policy",
          value: "camera=(), microphone=(), geolocation=()",
        },
        {
          key: "Content-Security-Policy",
          value: [
            "default-src 'self'",
            "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://checkout.razorpay.com https://api.razorpay.com https://*.razorpay.com",
            "script-src-elem 'self' 'unsafe-inline' 'unsafe-eval' https://checkout.razorpay.com https://api.razorpay.com https://*.razorpay.com",
            "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://checkout.razorpay.com",
            "font-src 'self' https://fonts.gstatic.com https://checkout.razorpay.com",
            "img-src 'self' data: blob: https: https://*.razorpay.com",
            "connect-src 'self' https://api.phonepe.com https://api-preprod.phonepe.com https://api.razorpay.com https://checkout.razorpay.com https://lumberjack.razorpay.com https://lumberjack-cx.razorpay.com https://custom-auth.razorpay.com https://*.razorpay.com wss://*.razorpay.com",
            "frame-src 'self' https://api.razorpay.com https://checkout.razorpay.com https://custom-auth.razorpay.com https://*.razorpay.com",
            "child-src 'self' blob: https://*.razorpay.com",
            "worker-src 'self' blob: https://*.razorpay.com",
            "object-src 'none'",
            "base-uri 'self'",
          ].join("; "),
        },
      ],
    },
    {
      source: "/audio/:path*",
      headers: [
        {
          key: "Cache-Control",
          value: "public, max-age=31536000, immutable",
        },
      ],
    },
    {
      source: "/assets/:path*",
      headers: [
        {
          key: "Cache-Control",
          value: "public, max-age=31536000, immutable",
        },
      ],
    },
    {
      source: "/uploads/:path*",
      headers: [
        {
          key: "X-Content-Type-Options",
          value: "nosniff",
        },
        {
          key: "Content-Security-Policy",
          value: "default-src 'none'; style-src 'unsafe-inline'; sandbox",
        },
      ],
    },
  ],
  poweredByHeader: false,
};

export default withPWA(nextConfig);
