/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: { ignoreDuringBuilds: true },
  experimental: {
    optimizePackageImports: ["@tabler/icons-react"],
  },
};

export default nextConfig;
