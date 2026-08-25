/** Uygulama genelinde sabit kümeler. SQLite'ta enum olmadığı için doğrulama burada. */

export const DURUMLAR = [
  { kod: "olumlu", ad: "Olumlu" },
  { kod: "kararsiz", ad: "Kararsız" },
  { kod: "ulasilamadi", ad: "Ulaşılamadı" },
  { kod: "olumsuz", ad: "Olumsuz" },
] as const;
export type DurumKod = (typeof DURUMLAR)[number]["kod"];
export const DURUM_AD: Record<string, string> = Object.fromEntries(
  DURUMLAR.map((d) => [d.kod, d.ad]),
);
export const DURUM_KODLARI = DURUMLAR.map((d) => d.kod) as unknown as [string, ...string[]];

/** Satır içi düğmeler için kısa etiket — "Olumlu" ile "Olumsuz" karışmasın. */
export const DURUM_KISA: Record<string, string> = {
  olumlu: "Olumlu",
  kararsiz: "Kararsız",
  ulasilamadi: "Ulaşılmadı",
  olumsuz: "Olumsuz",
};

export const RISKLI = [
  { kod: "yok", ad: "Başvuru yok" },
  { kod: "basvuruldu", ad: "Başvuruldu" },
  { kod: "onaylandi", ad: "Rapor onaylandı" },
  { kod: "kesinlesti", ad: "Kesinleşti" },
  { kod: "itiraz", ad: "İtiraz sürecinde" },
] as const;
export const RISKLI_AD: Record<string, string> = Object.fromEntries(
  RISKLI.map((r) => [r.kod, r.ad]),
);
export const RISKLI_KODLARI = RISKLI.map((r) => r.kod) as unknown as [string, ...string[]];

/** Riskli yapı statüsü hukuki dayanağı sağlıyor mu (6306 s. Kanun) */
export function dayanakVar(riskli: string) {
  return riskli === "onaylandi" || riskli === "kesinlesti";
}

export const YMBN_GRUPLARI = ["A", "B", "C", "D", "E", "F", "G", "H"] as const;

export const MUTEAHHIT_DURUMLARI = [
  { kod: "aktif", ad: "Aktif" },
  { kod: "degerlendirmede", ad: "Değerlendirmede" },
  { kod: "kara", ad: "Kara liste" },
] as const;
export const MUTEAHHIT_DURUM_AD: Record<string, string> = Object.fromEntries(
  MUTEAHHIT_DURUMLARI.map((d) => [d.kod, d.ad]),
);

/** Teklif değerlendirme kriterleri. yuksekIyi=false ise düşük değer daha iyidir. */
export const KRITERLER = [
  { kod: "malikPayi", ad: "Malik payı (%)", yuksekIyi: true },
  { kod: "kira", ad: "Kira yardımı (toplam)", yuksekIyi: true },
  { kod: "nakdi", ad: "Nakdi destek", yuksekIyi: true },
  { kod: "sure", ad: "Teslim süresi (ay)", yuksekIyi: false },
  { kod: "teminat", ad: "Teminat mektubu", yuksekIyi: true },
  { kod: "teknik", ad: "Teknik / referans puanı", yuksekIyi: true },
] as const;
export type KriterKod = (typeof KRITERLER)[number]["kod"];

export type Agirliklar = Record<KriterKod, number>;

export const VARSAYILAN_AGIRLIKLAR: Agirliklar = {
  malikPayi: 35,
  kira: 10,
  nakdi: 10,
  sure: 15,
  teminat: 15,
  teknik: 15,
};

export function agirlikOku(json: string | null | undefined, varsayilan: Agirliklar): Agirliklar {
  try {
    const o = JSON.parse(json || "{}");
    const cikti = { ...varsayilan };
    for (const k of KRITERLER) {
      const v = Number(o?.[k.kod]);
      if (Number.isFinite(v) && v >= 0) cikti[k.kod] = v;
    }
    return cikti;
  } catch {
    return { ...varsayilan };
  }
}

export function engelOku(json: string | null | undefined): string[] {
  try {
    const a = JSON.parse(json || "[]");
    return Array.isArray(a) ? a.filter((x) => typeof x === "string") : [];
  } catch {
    return [];
  }
}
