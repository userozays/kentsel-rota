/**
 * Belge yardımcılarının saf (sunucu bağımsız) kısmı.
 * İstemci tarafındaki yükleme kartı da izinli türleri ve boyut metnini kullanıyor.
 */

export const EN_BUYUK_BOYUT = 15 * 1024 * 1024; // 15 MB

/** İzin verilen türler: uzantı -> MIME */
export const IZINLI_TURLER: Record<string, string> = {
  pdf: "application/pdf",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  heic: "image/heic",
  doc: "application/msword",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  xls: "application/vnd.ms-excel",
  xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  txt: "text/plain",
};

export const IZINLI_UZANTILAR = Object.keys(IZINLI_TURLER);

/** input[type=file] accept özniteliği için */
export const KABUL_LISTESI = IZINLI_UZANTILAR.map((u) => "." + u).join(",");

export function uzantiAl(dosyaAdi: string): string {
  const nokta = dosyaAdi.lastIndexOf(".");
  if (nokta < 0) return "";
  return dosyaAdi.slice(nokta + 1).toLowerCase();
}

/** Dosya sisteminde sorun çıkaran işaretler (kontrol karakterleri ayrıca elenir) */
const YASAKLI_ISARETLER = new Set(["<", ">", ":", '"', "|", "?", "*"]);

/** Hem Windows hem POSIX dizin ayırıcısı */
const AYIRICI = new RegExp("[\\\\/]");

/**
 * Kullanıcıdan gelen dosya adını görüntüleme için temizler.
 * Dizin ayırıcıları ve baştaki noktalar atılır (path traversal koruması).
 */
export function dosyaAdiTemizle(ad: string): string {
  const yalnizAd = ad.split(AYIRICI).pop() ?? "dosya";

  let temiz = "";
  for (const karakter of yalnizAd) {
    const kod = karakter.codePointAt(0) ?? 0;
    if (kod < 32 || kod === 127) continue; // kontrol karakterleri
    if (YASAKLI_ISARETLER.has(karakter)) continue;
    temiz += karakter;
  }

  // Baştaki noktalar: gizli dosya ve ".." denemelerini engeller
  while (temiz.startsWith(".")) temiz = temiz.slice(1);

  return temiz.trim().slice(0, 180) || "dosya";
}

export function boyutMetni(bayt: number): string {
  if (bayt < 1024) return `${bayt} B`;
  if (bayt < 1024 * 1024) return `${Math.round(bayt / 1024)} KB`;
  return `${(bayt / 1024 / 1024).toFixed(1)} MB`;
}
