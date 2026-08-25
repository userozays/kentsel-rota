import { COGUNLUK_ESIGI } from "./sabitler";

const AYLAR = ["Oca", "Şub", "Mar", "Nis", "May", "Haz", "Tem", "Ağu", "Eyl", "Eki", "Kas", "Ara"];

/** 12 Oca 2026 */
export function tarih(d?: Date | string | null): string {
  if (!d) return "—";
  const t = typeof d === "string" ? new Date(d) : d;
  if (Number.isNaN(t.getTime())) return "—";
  return `${t.getDate()} ${AYLAR[t.getMonth()]} ${t.getFullYear()}`;
}

/** 12 Oca 2026 14:30 */
export function tarihSaat(d?: Date | string | null): string {
  if (!d) return "—";
  const t = typeof d === "string" ? new Date(d) : d;
  if (Number.isNaN(t.getTime())) return "—";
  const ss = String(t.getHours()).padStart(2, "0");
  const dd = String(t.getMinutes()).padStart(2, "0");
  return `${tarih(t)} ${ss}:${dd}`;
}

/** input[type=date] icin YYYY-MM-DD */
export function tarihGirdi(d?: Date | string | null): string {
  if (!d) return "";
  const t = typeof d === "string" ? new Date(d) : d;
  if (Number.isNaN(t.getTime())) return "";
  return t.toISOString().slice(0, 10);
}

/** "3 gün önce" */
export function goreceli(d?: Date | string | null): string {
  if (!d) return "—";
  const t = typeof d === "string" ? new Date(d) : d;
  const fark = Math.floor((Date.now() - t.getTime()) / 1000);
  if (fark < 60) return "az önce";
  if (fark < 3600) return `${Math.floor(fark / 60)} dk önce`;
  if (fark < 86400) return `${Math.floor(fark / 3600)} saat önce`;
  if (fark < 2592000) return `${Math.floor(fark / 86400)} gün önce`;
  if (fark < 31536000) return `${Math.floor(fark / 2592000)} ay önce`;
  return `${Math.floor(fark / 31536000)} yıl önce`;
}

export function sayi(n?: number | null, basamak = 0): string {
  if (n === null || n === undefined || Number.isNaN(n)) return "0";
  return n.toLocaleString("tr-TR", { minimumFractionDigits: basamak, maximumFractionDigits: basamak });
}

export function yuzde(n?: number | null, basamak = 1): string {
  return `%${sayi(n ?? 0, basamak)}`;
}

/** Ad Soyad -> AS */
export function basHarfler(ad?: string | null): string {
  if (!ad) return "?";
  return ad
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toLocaleUpperCase("tr-TR") ?? "")
    .join("");
}

/** Isimden sabit bir Tabler rengi uretir (avatar arka planlari icin) */
const AVATAR_RENKLERI = ["blue", "azure", "indigo", "purple", "pink", "red", "orange", "yellow", "lime", "green", "teal", "cyan"];
export function avatarRengi(anahtar: string): string {
  let toplam = 0;
  for (let i = 0; i < anahtar.length; i++) toplam = (toplam + anahtar.charCodeAt(i)) % 9973;
  return AVATAR_RENKLERI[toplam % AVATAR_RENKLERI.length];
}

export type HisseBenzeri = { hisseOrani: number; onayDurumu: string };

export type OnayOzeti = {
  bolumSayisi: number;
  toplamPay: number;
  olumluPay: number;
  olumsuzPay: number;
  bekleyenPay: number;
  ulasilamayanPay: number;
  olumluOran: number;
  olumsuzOran: number;
  olumluAdet: number;
  olumsuzAdet: number;
  bekleyenAdet: number;
  ulasilamayanAdet: number;
  cogunlukSaglandi: boolean;
  esik: number;
};

/**
 * Bir binadaki maliklerin arsa payi bazinda onay ozeti.
 * Cogunluk hesabi hisse orani (arsa payi) uzerinden yapilir, kisi sayisi uzerinden degil.
 */
export function onayOzeti(hisseler: HisseBenzeri[]): OnayOzeti {
  const pay = (durum: string) =>
    hisseler.filter((h) => h.onayDurumu === durum).reduce((t, h) => t + (h.hisseOrani || 0), 0);
  const adet = (durum: string) => hisseler.filter((h) => h.onayDurumu === durum).length;

  const toplamPay = hisseler.reduce((t, h) => t + (h.hisseOrani || 0), 0);
  const olumluPay = pay("OLUMLU");
  const olumsuzPay = pay("OLUMSUZ");
  const bolen = toplamPay > 0 ? toplamPay : 100;

  return {
    bolumSayisi: hisseler.length,
    toplamPay,
    olumluPay,
    olumsuzPay,
    bekleyenPay: pay("BEKLIYOR"),
    ulasilamayanPay: pay("ULASILAMADI"),
    olumluOran: (olumluPay / bolen) * 100,
    olumsuzOran: (olumsuzPay / bolen) * 100,
    olumluAdet: adet("OLUMLU"),
    olumsuzAdet: adet("OLUMSUZ"),
    bekleyenAdet: adet("BEKLIYOR"),
    ulasilamayanAdet: adet("ULASILAMADI"),
    cogunlukSaglandi: (olumluPay / bolen) * 100 > COGUNLUK_ESIGI,
    esik: COGUNLUK_ESIGI,
  };
}

/** Formdan gelen bos string'leri null'a cevirir */
export function bosaNull(v: FormDataEntryValue | null | undefined): string | null {
  const s = typeof v === "string" ? v.trim() : "";
  return s === "" ? null : s;
}

export function sayiyaCevir(v: FormDataEntryValue | null | undefined): number | null {
  const s = typeof v === "string" ? v.trim().replace(",", ".") : "";
  if (s === "") return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

export function tariheCevir(v: FormDataEntryValue | null | undefined): Date | null {
  const s = typeof v === "string" ? v.trim() : "";
  if (!s) return null;
  const d = new Date(s);
  return Number.isNaN(d.getTime()) ? null : d;
}

/**
 * Form gonderildikten sonra React alanlari sifirlar; sunucu tarafinda dogrulama
 * hatasi olustugunda kullanicinin girdigi degerleri geri verebilmek icin
 * form icerigini duz bir nesneye cevirir. Sifre alanlari disarida birakilir.
 */
export function formDegerleri(form: FormData): Record<string, string> {
  const cikti: Record<string, string> = {};
  for (const [anahtar, deger] of form.entries()) {
    if (typeof deger !== "string") continue;
    if (/sifre/i.test(anahtar)) continue;
    cikti[anahtar] = deger;
  }
  return cikti;
}
