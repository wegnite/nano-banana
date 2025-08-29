import createMDX from 'fumadocs-mdx/config';
import { rehypeCodeDefaultOptions } from 'fumadocs-core/mdx-plugins';
import { remarkInstall } from 'fumadocs-docgen';
import createBundleAnalyzer from '@next/bundle-analyzer';

const withMDX = createMDX({
  mdxOptions: {
    remarkPlugins: [[remarkInstall, { persist: { id: 'package-manager' } }]],
    rehypeCodeOptions: {
      inline: 'tailing-curly-colon',
      themes: {
        light: 'catppuccin-latte',
        dark: 'catppuccin-mocha',
      },
    },
  },
});

const withBundleAnalyzer = createBundleAnalyzer({
  enabled: process.env.ANALYZE === 'true',
});

const buildMode = process.env.BUILD_MODE ?? 'default';

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  
  // Cloudflare 优化配置
  compress: true,
  poweredByHeader: false,
  generateEtags: false,
  
  // 禁用不必要的功能
  productionBrowserSourceMaps: false,
  
  // 优化构建
  swcMinify: true,
  
  // 减小构建体积
  experimental: {
    optimizeCss: true,
    optimizePackageImports: [
      '@radix-ui/react-icons',
      'lucide-react',
      'recharts',
      '@tabler/icons-react',
    ],
  },
  
  reactStrictMode: true,
  
  // 跳过类型检查和 linting（在 CI 中单独运行）
  typescript: {
    ignoreBuildErrors: buildMode === 'production',
  },
  eslint: {
    ignoreDuringBuilds: buildMode === 'production',
  },
  
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
      {
        protocol: 'http',
        hostname: 'localhost',
      },
    ],
    // Cloudflare 不支持 Next.js 图片优化
    unoptimized: true,
  },
  
  // Webpack 配置
  webpack: (config, { isServer }) => {
    // 优化打包体积
    if (!isServer) {
      config.optimization = {
        ...config.optimization,
        splitChunks: {
          chunks: 'all',
          cacheGroups: {
            default: false,
            vendors: false,
            framework: {
              name: 'framework',
              chunks: 'all',
              test: /(?<!node_modules.*)[\\/]node_modules[\\/](react|react-dom|scheduler|prop-types|use-subscription)[\\/]/,
              priority: 40,
              enforce: true,
            },
            lib: {
              test(module) {
                return module.size() > 160000 &&
                  /node_modules[/\\]/.test(module.identifier());
              },
              name(module) {
                const hash = require('crypto').createHash('sha256');
                hash.update(module.identifier());
                return hash.digest('hex').substring(0, 8);
              },
              priority: 30,
              minChunks: 1,
              reuseExistingChunk: true,
            },
            commons: {
              name: 'commons',
              minChunks: 2,
              priority: 20,
            },
            shared: {
              name(module, chunks) {
                return `shared-${require('crypto')
                  .createHash('sha256')
                  .update(chunks.reduce((acc, chunk) => acc + chunk.name, ''))
                  .digest('hex')
                  .substring(0, 8)}`;
              },
              priority: 10,
              minChunks: 2,
              reuseExistingChunk: true,
            },
          },
          maxAsyncRequests: 30,
          maxInitialRequests: 30,
        },
      };
      
      // 忽略大文件警告
      config.performance = {
        ...config.performance,
        maxAssetSize: 5000000, // 5MB
        maxEntrypointSize: 5000000,
      };
    }
    
    return config;
  },
  
  // 重写规则
  async rewrites() {
    return [
      {
        source: '/docs',
        destination: '/docs/get-started',
      },
    ];
  },
  
  // 重定向规则
  async redirects() {
    return [
      {
        source: '/discord',
        destination: 'https://discord.gg/your-discord',
        permanent: false,
      },
      {
        source: '/github',
        destination: 'https://github.com/wegnite/nano-banana',
        permanent: false,
      },
    ];
  },
};

export default withBundleAnalyzer(withMDX(nextConfig));