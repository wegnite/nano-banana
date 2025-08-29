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
  // Output configuration for Vercel deployment
  output: "standalone",
  
  // 禁用 Next.js 15 的 barrel optimization 对 recharts 的优化
  // 解决 lodash 导入问题
  transpilePackages: ['recharts', 'lodash'],
  
  // React configuration
  reactStrictMode: false,
  pageExtensions: ["ts", "tsx", "js", "jsx", "md", "mdx"],
  
  // Webpack 优化配置
  webpack: (config, { isServer, dev }) => {
    // 生产环境优化
    if (!dev) {
      config.optimization.splitChunks.chunks = 'all';
      config.optimization.splitChunks.maxSize = 244000; // ~244KB
    }
    
    // Edge runtime compatibility
    if (isServer) {
      config.externals = [...(config.externals || []), 'canvas', 'jsdom'];
    }
    
    return config;
  },
  
  // Image optimization configuration
  images: {
    // Remote patterns for AI-generated images
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
    // Optimize for performance
    formats: ['image/avif', 'image/webp'],
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
    // Caching configuration
    minimumCacheTTL: 60,
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },
  
  // Experimental features for performance
  experimental: {
    // 禁用对 recharts 的 barrel optimization 以修复 lodash 导入问题
    optimizePackageImports: ['lucide-react', '@radix-ui/react-icons'],
    // Edge runtime for API routes - Next.js 15 已移动此配置
    // serverComponentsExternalPackages: ['sharp', 'onnxruntime-node'],
    // optimizeFonts: true, // Next.js 15 已自动优化
    // outputFileTracingIncludes 已移动到顶层配置
  },
  
  // Next.js 15 新配置位置
  serverExternalPackages: ['sharp', 'onnxruntime-node'],
  outputFileTracingIncludes: {
    '/api/character-figure/**/*': ['./node_modules/@ai-sdk/**/*'],
    '/api/nano-banana/**/*': ['./node_modules/aws4fetch/**/*'],
  },
  
  // Compression and optimization
  compress: true,
  poweredByHeader: false,
  generateEtags: false,
  
  // Headers for production
  async headers() {
    return [
      {
        // Cache static assets aggressively
        source: "/_next/static/(.*)",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
      {
        // Cache images with shorter TTL for updates
        source: "/imgs/(.*)",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=3600, stale-while-revalidate=86400",
          },
        ],
      },
      {
        // Security headers for AI generation endpoints
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
  
  // Redirects for SEO and user experience
  async redirects() {
    return [
      // Character Figure feature redirects
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
      // Legacy API redirects
      {
        source: "/api/generate-character",
        destination: "/api/character-figure/generate",
        permanent: false,
      },
    ];
  },
  
  // Rewrites for API versioning and backwards compatibility
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
  
  // Environment-specific configuration
  env: {
    CUSTOM_KEY: process.env.NODE_ENV === 'production' ? 'prod-value' : 'dev-value',
  },
};

// Next.js 15 已经稳定支持 MDX，不再需要 experimental 标志
export default withBundleAnalyzer(withNextIntl(withMDX(nextConfig)));
