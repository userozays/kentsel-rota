/** @type {import('next').NextConfig} */

/* Güvenlik başlıkları.
   Panel tapu ve kimlik belgesi taşıdığı için varsayılanlarla yetinilmiyor.
   HSTS bilinçli olarak burada yok: sertifika kurulmadan gönderilirse tarayıcı
   alan adını HTTPS'e kilitler ve panel erişilemez hale gelir. Nginx tarafında,
   SSL çalıştığı doğrulandıktan sonra eklenmesi doğrusu (README'ye bakın). */
const GUVENLIK_BASLIKLARI = [
  // Panelin başka bir sitede çerçeve içine alınmasını engeller (clickjacking)
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Content-Security-Policy", value: "frame-ancestors 'none'" },
  // Tarayıcı içerik türünü kendi tahmin etmesin; yüklenen belgeler için önemli
  { key: "X-Content-Type-Options", value: "nosniff" },
  // Dış bağlantılara tam adres sızmasın (bina/malik kimlikleri adreste geçiyor)
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // Kullanılmayan tarayıcı yetenekleri kapalı
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
];

const nextConfig = {
  eslint: { ignoreDuringBuilds: true },
  // Sunucu sürüm bilgisini yanıt başlığında duyurmaya gerek yok
  poweredByHeader: false,
  experimental: {
    optimizePackageImports: ["@tabler/icons-react"],
    // Belge yüklemeleri sunucu eylemi üzerinden gidiyor; varsayılan 1 MB sınırı yetersiz
    serverActions: { bodySizeLimit: "16mb" },
  },
  async headers() {
    return [{ source: "/:yol*", headers: GUVENLIK_BASLIKLARI }];
  },
};

export default nextConfig;
