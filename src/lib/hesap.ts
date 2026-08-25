/**
 * Çoğunluk ve teklif hesapları.
 * 6306 s. Kanun'da çoğunluk ARSA PAYI üzerinden hesaplanır, kişi sayısı üzerinden değil.
 * Bu dosya saf fonksiyonlardan oluşur — veritabanına da React'e de bağımlı değildir.
 */
import { sayi } from "./bicim";
import { KRITERLER, type Agirliklar, engelOku } from "./sabitler";

export type MalikGirdi = {
  id: string;
  ad: string;
  bb: string;
  pay: number;
  durum: string;
  engel: string;
};

export type BinaGirdi = {
  payda: number;
  malikler: MalikGirdi[];
};

export type Ozet = {
  /** Toplam arsa payı (payda) */
  payda: number;
  olumlu: number;
  kararsiz: number;
  ulasilamadi: number;
  olumsuz: number;
  /** Malik kayıtlarına girilmiş toplam pay — paydadan küçükse eksik giriş var */
  girilen: number;
  /** Çoğunluk eşiği (pay cinsinden) */
  esik: number;
  /** Olumlu payın paydaya oranı, yüzde */
  oran: number;
  gecti: boolean;
  /** Eşiği geçmek için gereken ek pay */
  eksikPay: number;
  kisiOlumlu: number;
  kisi: number;
  /** Eşiği geçmeye yetecek en kısa ikna listesi (arsa payına göre büyükten küçüğe) */
  hedef: MalikGirdi[];
  /** Hedef liste eşiği geçmeye yetiyor mu */
  hedefYeter: boolean;
  /** Kararsız+ulaşılamayanların tamamı olumluya dönse bile açık kalan pay */
  olumsuzdanGerekli: number;
  engelliSayisi: number;
};

/** Eşik yüzdesi varsayılan 50 — kanun değişirse ayarlardan güncellenir. */
export function ozetle(bina: BinaGirdi, esikYuzde = 50): Ozet {
  const malikler = bina.malikler ?? [];
  const payda =
    sayi(bina.payda) || malikler.reduce((a, m) => a + sayi(m.pay), 0) || 1;

  const topla = (d: string) =>
    malikler.filter((m) => m.durum === d).reduce((a, m) => a + sayi(m.pay), 0);

  const olumlu = topla("olumlu");
  const kararsiz = topla("kararsiz");
  const ulasilamadi = topla("ulasilamadi");
  const olumsuz = topla("olumsuz");
  const girilen = olumlu + kararsiz + ulasilamadi + olumsuz;

  const esik = (payda * esikYuzde) / 100;
  const oran = payda ? (olumlu / payda) * 100 : 0;
  // Salt çoğunluk: eşiğin ÜZERİNDE olmak gerekir, eşitlik yetmez.
  const gecti = olumlu > esik + 1e-9;
  const eksikPay = gecti ? 0 : Math.max(0, Math.ceil(esik - olumlu + 1e-4));

  const adaylar = malikler
    .filter((m) => m.durum === "kararsiz" || m.durum === "ulasilamadi")
    .slice()
    .sort((a, b) => sayi(b.pay) - sayi(a.pay));

  const hedef: MalikGirdi[] = [];
  let birikim = 0;
  for (const m of adaylar) {
    if (olumlu + birikim > esik + 1e-9) break;
    hedef.push(m);
    birikim += sayi(m.pay);
  }
  const hedefYeter = olumlu + birikim > esik + 1e-9;

  const tumAdayPay = adaylar.reduce((a, m) => a + sayi(m.pay), 0);
  const olumsuzdanGerekli =
    olumlu + tumAdayPay > esik + 1e-9
      ? 0
      : Math.ceil(esik - (olumlu + tumAdayPay) + 1e-4);

  return {
    payda,
    olumlu,
    kararsiz,
    ulasilamadi,
    olumsuz,
    girilen,
    esik,
    oran,
    gecti,
    eksikPay,
    kisiOlumlu: malikler.filter((m) => m.durum === "olumlu").length,
    kisi: malikler.length,
    hedef,
    hedefYeter,
    olumsuzdanGerekli,
    engelliSayisi: malikler.filter((m) => engelOku(m.engel).length > 0).length,
  };
}

export function emsalAlani(arsaM2: unknown, emsal: unknown): number {
  return sayi(arsaM2) * sayi(emsal);
}

/* ---------- teklif puanlama ---------- */

export type TeklifGirdi = {
  id: string;
  malikPayi: number;
  kiraAy: number;
  kiraTutar: number;
  nakdi: number;
  sureAy: number;
  teminat: number;
  teknik: number;
};

export function kriterDegeri(t: TeklifGirdi, kod: string): number {
  if (kod === "kira") return sayi(t.kiraAy) * sayi(t.kiraTutar);
  if (kod === "sure") return sayi(t.sureAy);
  return sayi((t as unknown as Record<string, unknown>)[kod]);
}

export type PuanSatiri = {
  teklif: TeklifGirdi;
  puan: number;
  /** Kriter bazında 0–1 normalize değer — matriste ısı göstermek için */
  kirilim: Record<string, number>;
};

/**
 * Min-max normalizasyon: her kriter mevcut teklif kümesinin en iyi/en kötüsüne göre
 * 0–1 arasına sıkıştırılır. Bu GÖRECELİ bir puandır — teklif eklenip çıkarıldığında
 * diğerlerinin puanı da değişir ve iki teklif varsa kötü olan her kriterde 0 alır.
 * Şartnamede puanın göreli olduğu yazılı olmalı.
 */
export function puanla(teklifler: TeklifGirdi[], agirliklar: Agirliklar): PuanSatiri[] {
  if (!teklifler.length) return [];
  const toplamAgirlik = KRITERLER.reduce((a, k) => a + sayi(agirliklar[k.kod]), 0) || 1;

  const araliklar: Record<string, [number, number]> = {};
  for (const k of KRITERLER) {
    const degerler = teklifler.map((t) => kriterDegeri(t, k.kod));
    araliklar[k.kod] = [Math.min(...degerler), Math.max(...degerler)];
  }

  return teklifler
    .map((t) => {
      const kirilim: Record<string, number> = {};
      let toplam = 0;
      for (const k of KRITERLER) {
        const [min, max] = araliklar[k.kod];
        const v = kriterDegeri(t, k.kod);
        const nv = max === min ? 1 : k.yuksekIyi ? (v - min) / (max - min) : (max - v) / (max - min);
        kirilim[k.kod] = nv;
        toplam += sayi(agirliklar[k.kod]) * nv;
      }
      return { teklif: t, puan: (toplam / toplamAgirlik) * 100, kirilim };
    })
    .sort((a, b) => b.puan - a.puan);
}
