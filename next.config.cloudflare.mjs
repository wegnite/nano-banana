import bundleAnalyzer from "@next/bundle-analyzer";
import createNextIntlPlugin from "next-intl/plugin";
import { createMDX } from "fumadocs-mdx/next";
import { createRequire } from "module";

const require = createRequire(import.meta.url);

const withMDX = createMDX();

const withBundleAnalyzer = bundleAnalyzer({
  enabled: process.env.ANALYZE === "true",
});

const withNextIntl = createNextIntlPlugin();

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Output configuration for Cloudflare Pages
  output: "standalone",
  
  // Disable barrel optimization for recharts to fix lodash import issues
  transpilePackages: ['recharts', 'lodash'],
  
  // React configuration
  reactStrictMode: false,
  pageExtensions: ["ts", "tsx", "js", "jsx", "md", "mdx"],
  
  // Webpack optimization for Edge Runtime
  webpack: (config, { isServer, dev }) => {
    // Production optimizations
    if (!dev) {
      config.optimization.splitChunks.chunks = 'all';
      config.optimization.splitChunks.maxSize = 244000; // ~244KB
    }
    
    // Edge runtime compatibility - critical for Cloudflare
    if (isServer) {
      config.externals = [...(config.externals || []), 'canvas', 'jsdom', 'sharp', 'onnxruntime-node'];
      
      // Replace Node.js modules with Edge-compatible alternatives
      config.resolve.alias = {
        ...config.resolve.alias,
        'fs': false,
        'path': false,
        'os': false,
        'crypto': false,
        'stream': false,
        'buffer': false,
      };
    }
    
    return config;
  },
  
  // Image optimization for Cloudflare
  images: {
    // Use Cloudflare Images or external providers
    loader: 'custom',
    loaderFile: './src/lib/cloudflare-image-loader.js',
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.kie.ai",
        port: "",
        pathname: "**",
      },
      {
        protocol: "https",
        hostname: "*.cloudflare.com",
        port: "",
        pathname: "**",
      },
      {
        protocol: "https",
        hostname: "*.r2.cloudflarestorage.com",
        port: "",
        pathname: "**",
      },
      {
        protocol: "https",
        hostname: "replicate.delivery",
        port: "",
        pathname: "**",
      },
      {
        protocol: "https",
        hostname: "*.openai.com",
        port: "",
        pathname: "**",
      },
      {
        protocol: "https",
        hostname: "*",
      },
    ],
    formats: ['image/webp'],
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
    minimumCacheTTL: 60,
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },
  
  // Experimental features for Cloudflare
  experimental: {
    optimizePackageImports: ['lucide-react', '@radix-ui/react-icons'],
  },
  
  // External packages for Edge Runtime
  serverExternalPackages: [],
  
  // Compression handled by Cloudflare
  compress: false,
  poweredByHeader: false,
  generateEtags: false,
  
  // Headers for Cloudflare Pages
  async headers() {
    return [
      {
        source: "/_next/static/(.*)",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
      {
        source: "/imgs/(.*)",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=3600, stale-while-revalidate=86400",
          },
        ],
      },
      {
        source: "/api/character-figure/(.*)",
        headers: [
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
          {
            key: "X-XSS-Protection",
            value: "1; mode=block",
          },
        ],
      },
    ];
  },
  
  // Redirects for Cloudflare Pages
  async redirects() {
    return [
      {
        source: "/character",
        destination: "/en/character-figure",
        permanent: true,
      },
      {
        source: "/ai-character",
        destination: "/en/character-figure", 
        permanent: true,
      },
      {
        source: "/api/generate-character",
        destination: "/api/character-figure/generate",
        permanent: false,
      },
      {
        source: "/character-figure/:path*",
        destination: "/en/character-figure/:path*",
        permanent: false,
      },
      {
        source: "/docs",
        destination: "/en/docs",
        permanent: false,
      },
    ];
  },
  
  // Rewrites for API compatibility
  async rewrites() {
    return {
      beforeFiles: [
        {
          source: "/api/v1/character/:path*",
          destination: "/api/character-figure/:path*",
        },
      ],
    };
  },
  
  // Environment configuration
  env: {
    CUSTOM_KEY: process.env.NODE_ENV === 'production' ? 'prod-value' : 'dev-value',
  },
};

export default withBundleAnalyzer(withNextIntl(withMDX(nextConfig)));