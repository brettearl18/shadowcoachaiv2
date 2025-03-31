/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    turbo: {
      rules: {
        // Configure any custom rules for Turbopack
      },
    },
  },
  // Ensure proper module resolution
  webpack: (config, { isServer }) => {
    // Add any custom webpack configurations if needed
    return config;
  },
};

module.exports = nextConfig; 