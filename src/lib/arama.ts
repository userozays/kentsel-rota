/**
 * Arama metni normalizasyonu.
 *
 * SQLite'ın LIKE operatörü yalnızca ASCII harflerde büyük/küçük harf duyarsızdır;
 * "Şimşek" kaydı küçük harfle "şimşek" aranınca bulunamıyordu. Prisma'nın
 * mode:"insensitive" seçeneği de SQLite sağlayıcısında desteklenmiyor.
 *
 * Çözüm: her kayıtta normalize edilmiş bir arama sütunu tutmak. Metin küçük
 * harfe indirgenir ve aksanlar sadeleştirilir; böylece "sirinevler" yazınca
 * "Şirinevler" de bulunur — klavyede Türkçe karakter aramaya gerek kalmaz.
 */

export function aramaNormalize(metin?: string | null): string {
  if (!metin) return "";
  return (
    metin
      // Türkçe i/I çifti Unicode küçük harfe çevirmede tuzaklı; önce sabitleniyor
      .replace(/[İIı]/g, "i")
      .toLowerCase()
      // aksanları ayrıştırıp birleşen işaretleri at (ş→s, ğ→g, ü→u, ö→o, ç→c, â→a)
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .replace(/\s+/g, " ")
      .trim()
  );
}

/** Birden çok alanı tek bir arama metnine birleştirir. */
export function aramaMetniYap(...parcalar: (string | number | null | undefined)[]): string {
  return aramaNormalize(parcalar.filter((p) => p !== null && p !== undefined && p !== "").join(" "));
}

/* ----------------------------------------------- Varlığa göre arama metinleri */

export function binaAramaMetni(b: {
  kod?: string | null;
  baslik?: string | null;
  il?: string | null;
  ilce?: string | null;
  mahalle?: string | null;
  ada?: string | null;
  parsel?: string | null;
  adres?: string | null;
  notlar?: string | null;
}): string {
  return aramaMetniYap(b.kod, b.baslik, b.il, b.ilce, b.mahalle, b.ada, b.parsel, b.adres, b.notlar);
}

export function malikAramaMetni(m: {
  adSoyad?: string | null;
  tcKimlik?: string | null;
  telefon?: string | null;
  telefon2?: string | null;
  email?: string | null;
  adres?: string | null;
  notlar?: string | null;
}): string {
  return aramaMetniYap(m.adSoyad, m.tcKimlik, m.telefon, m.telefon2, m.email, m.adres, m.notlar);
}

export function muteahhitAramaMetni(m: {
  kod?: string | null;
  firmaAdi?: string | null;
  yetkiliKisi?: string | null;
  telefon?: string | null;
  email?: string | null;
  vergiNo?: string | null;
  adres?: string | null;
  calismaBolgeleri?: string | null;
  notlar?: string | null;
}): string {
  return aramaMetniYap(
    m.kod,
    m.firmaAdi,
    m.yetkiliKisi,
    m.telefon,
    m.email,
    m.vergiNo,
    m.adres,
    m.calismaBolgeleri,
    m.notlar,
  );
}

/**
 * Arama terimini kelimelere böler. Her kelime ayrı bir "contains" koşulu olur,
 * böylece "sirinevler 1290" gibi çok kelimeli aramalar sıradan bağımsız çalışır.
 */
export function aramaKelimeleri(terim?: string | null): string[] {
  const n = aramaNormalize(terim);
  if (!n) return [];
  return n.split(" ").filter((k) => k.length > 0);
}
