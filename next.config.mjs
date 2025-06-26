/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable static exports for deployment
  output: 'standalone',
  
  // Optimize images
  images: {
    domains: ['localhost', '127.0.0.1'],
    unoptimized: true,
  },
  
  // Environment variables
  env: {
    CUSTOM_KEY: process.env.CUSTOM_KEY,
  },
  
  // Security headers
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin',
          },
        ],
      },
    ];
  },
  
  // Redirects
  async redirects() {
    return [
      {
        source: '/admin',
        destination: '/api/admin/',
        permanent: true,
      },
    ];
  },
  
  // Rewrites for API proxy
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'http://127.0.0.1:8000/api/:path*',
      },
    ];
  },
  
  // Webpack configuration
  webpack: (config, { isServer }) => {
    // Optimize bundle size
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
      };
    }
    return config;
  },
  
  // Experimental features
  experimental: {
    optimizeCss: true,
  },
};

export default nextConfig;
