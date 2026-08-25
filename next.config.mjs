/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: { ignoreDuringBuilds: true },
  experimental: {
    optimizePackageImports: ["@tabler/icons-react"],
    // Belge yüklemeleri sunucu eylemi üzerinden gidiyor; varsayılan 1 MB sınırı yetersiz
    serverActions: { bodySizeLimit: "16mb" },
  },
};

export default nextConfig;
