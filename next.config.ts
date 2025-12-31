import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Empty turbopack config to silence the warning when using webpack config
  turbopack: {},
  webpack: (config) => {
    // Handle .wasm files
    config.experiments = {
      ...config.experiments,
      asyncWebAssembly: true,
    };

    // Add rule for .wasm files
    config.module.rules.push({
      test: /\.wasm$/,
      type: 'asset/resource',
    });

    // Add rule for .zkey files (treat as static assets)
    config.module.rules.push({
      test: /\.zkey$/,
      type: 'asset/resource',
    });

    return config;
  },
};

export default nextConfig;
