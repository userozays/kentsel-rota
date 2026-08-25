/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    // Sunucu eylemlerinde büyük form gövdelerine izin ver (toplu daire oluşturma vb.)
    serverActions: { bodySizeLimit: "2mb" },
  },
};

export default nextConfig;
