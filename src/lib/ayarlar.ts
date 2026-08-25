import "server-only";
import { cache } from "react";
import { db } from "./db";
import { VARSAYILAN_AGIRLIKLAR, agirlikOku, type Agirliklar } from "./sabitler";

export type Ayarlar = {
  sirketAd: string;
  sirketUnvan: string;
  /** Danışmanlık bedelinin şartnamede ilan edilen formülü — teklif sayfasında gösterilir */
  ucretFormulu: string;
  /** Çoğunluk eşiği yüzdesi (6306 s. Kanun: 50) */
  esikYuzde: number;
  varsayilanAgirliklar: Agirliklar;
  /** Panoda uyarı: bu gün sayısından uzun süredir temas edilmemiş malikler */
  temasUyariGun: number;
  kvkkNot: string;
};

export const VARSAYILAN_AYARLAR: Ayarlar = {
  sirketAd: "Kentsel Rota",
  sirketUnvan: "",
  ucretFormulu:
    "Danışmanlık bedeli kazanan yükleniciden alınır; tutar ihale şartnamesinde ilan edilir ve tüm teklif verenler için aynıdır.",
  esikYuzde: 50,
  varsayilanAgirliklar: VARSAYILAN_AGIRLIKLAR,
  temasUyariGun: 30,
  kvkkNot:
    "Bu sistemde malik ad-soyad, telefon ve tapu bilgisi işlenir. Aydınlatma metni münhasır yetki sözleşmesinin ekidir.",
};

/** İstek başına tek okuma. */
export const ayarlariOku = cache(async (): Promise<Ayarlar> => {
  const satirlar = await db.ayar.findMany();
  const harita = Object.fromEntries(satirlar.map((s) => [s.anahtar, s.deger]));

  const sayiOku = (k: keyof Ayarlar, varsayilan: number, min: number, max: number) => {
    const v = Number(harita[k]);
    return Number.isFinite(v) && v >= min && v <= max ? v : varsayilan;
  };

  return {
    sirketAd: harita.sirketAd ?? VARSAYILAN_AYARLAR.sirketAd,
    sirketUnvan: harita.sirketUnvan ?? VARSAYILAN_AYARLAR.sirketUnvan,
    ucretFormulu: harita.ucretFormulu ?? VARSAYILAN_AYARLAR.ucretFormulu,
    esikYuzde: sayiOku("esikYuzde", VARSAYILAN_AYARLAR.esikYuzde, 1, 99),
    varsayilanAgirliklar: agirlikOku(harita.varsayilanAgirliklar, VARSAYILAN_AGIRLIKLAR),
    temasUyariGun: sayiOku("temasUyariGun", VARSAYILAN_AYARLAR.temasUyariGun, 1, 365),
    kvkkNot: harita.kvkkNot ?? VARSAYILAN_AYARLAR.kvkkNot,
  };
});

export async function ayarYaz(anahtar: string, deger: string) {
  await db.ayar.upsert({
    where: { anahtar },
    create: { anahtar, deger },
    update: { deger },
  });
}

/* ---------- sözlükler ---------- */

export const asamalariOku = cache(async () => {
  const a = await db.asama.findMany({ orderBy: { sira: "asc" } });
  return a;
});

export const engelleriOku = cache(async () => {
  return db.engelTuru.findMany({ orderBy: { sira: "asc" } });
});
