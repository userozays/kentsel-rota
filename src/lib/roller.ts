/** Rol tanımları ve yetki matrisi. Tek kaynak — hem sunucu hem arayüz buradan okur. */

export const ROLLER = [
  {
    kod: "ADMIN",
    ad: "Yönetici (Admin)",
    aciklama:
      "Her şeye erişir. Kullanıcı açar, rol verir, sistem ayarlarını değiştirir, portföy raporunu görür.",
  },
  {
    kod: "YONETICI",
    ad: "Proje Yöneticisi",
    aciklama:
      "Tüm binaları görür ve düzenler, teklif açar ve ağırlık kilitler. Kullanıcı ve ayar yönetimi yoktur.",
  },
  {
    kod: "SAHA",
    ad: "Saha Personeli",
    aciklama:
      "Yalnız kendisine atanan binaları görür; malik tavrı ve notlarını günceller. Teklifleri göremez — kapalı zarf gizliliği.",
  },
  {
    kod: "OKUYUCU",
    ad: "Okuyucu",
    aciklama: "Salt okunur. Hiçbir kaydı değiştiremez, teklif rakamlarını göremez.",
  },
] as const;

export type RolKod = (typeof ROLLER)[number]["kod"];
export const ROL_KODLARI = ROLLER.map((r) => r.kod) as unknown as [string, ...string[]];
export const ROL_AD: Record<string, string> = Object.fromEntries(ROLLER.map((r) => [r.kod, r.ad]));

export type Yetki =
  | "yonetim" // kullanıcı + ayar + portföy raporu
  | "binaYaz" // bina ekle/düzenle/sil
  | "malikYaz" // malik ekle/düzenle/sil, tavır değiştir
  | "muteahhitYaz"
  | "teklifOku" // teklif rakamlarını görme
  | "teklifYaz"
  | "tumBinalar"; // atama olmadan bütün binaları görme

const MATRIS: Record<RolKod, Yetki[]> = {
  ADMIN: [
    "yonetim",
    "binaYaz",
    "malikYaz",
    "muteahhitYaz",
    "teklifOku",
    "teklifYaz",
    "tumBinalar",
  ],
  YONETICI: ["binaYaz", "malikYaz", "muteahhitYaz", "teklifOku", "teklifYaz", "tumBinalar"],
  SAHA: ["malikYaz"],
  OKUYUCU: ["tumBinalar"],
};

export function yetkiVar(rol: string, yetki: Yetki): boolean {
  return (MATRIS[rol as RolKod] ?? []).includes(yetki);
}

export function yetkiListesi(rol: string): Yetki[] {
  return MATRIS[rol as RolKod] ?? [];
}

export const YETKI_ADI: Record<Yetki, string> = {
  yonetim: "Yönetim paneli",
  binaYaz: "Bina ekle / düzenle",
  malikYaz: "Malik ve tavır güncelle",
  muteahhitYaz: "Müteahhit havuzu",
  teklifOku: "Teklifleri görme",
  teklifYaz: "Teklif girme",
  tumBinalar: "Tüm binalara erişim",
};
