/**
 * CSV üretimi.
 *
 * Türkçe Windows Excel'de çift tıklamayla düzgün açılması için:
 * - UTF-8 BOM eklenir (aksi halde ş/ğ/ı bozuk görünür)
 * - Ayırıcı noktalı virgüldür (ondalık ayracı virgül olduğu için virgül kullanılamaz)
 * - Satır sonu CRLF
 */

const BOM = "﻿"; // Excel UTF-8 imzasi
const AYIRICI = ";";
const SATIR_SONU = "\r\n";

function hucre(deger: unknown): string {
  if (deger === null || deger === undefined) return "";

  let metin: string;
  if (deger instanceof Date) {
    metin = `${String(deger.getDate()).padStart(2, "0")}.${String(deger.getMonth() + 1).padStart(2, "0")}.${deger.getFullYear()}`;
  } else if (typeof deger === "number") {
    // Türkçe ondalık ayracı
    metin = Number.isInteger(deger) ? String(deger) : String(deger).replace(".", ",");
  } else if (typeof deger === "boolean") {
    metin = deger ? "Evet" : "Hayır";
  } else {
    metin = String(deger);
  }

  // Excel'in formül olarak yorumlamasını engelle (CSV injection)
  if (/^[=+\-@]/.test(metin) && metin.length > 1) metin = "'" + metin;

  if (metin.includes(AYIRICI) || metin.includes('"') || /[\r\n]/.test(metin)) {
    return '"' + metin.replace(/"/g, '""') + '"';
  }
  return metin;
}

export function csvUret(basliklar: string[], satirlar: unknown[][]): string {
  const govde = [basliklar, ...satirlar].map((s) => s.map(hucre).join(AYIRICI)).join(SATIR_SONU);
  return BOM + govde + SATIR_SONU;
}

/** Dosya adında kullanılamayacak karakterleri temizler ve tarih ekler */
export function dosyaAdiUret(temel: string): string {
  const t = new Date();
  const tarih = `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, "0")}-${String(t.getDate()).padStart(2, "0")}`;
  const temiz = temel
    .toLowerCase()
    .replace(/ı/g, "i")
    .replace(/ş/g, "s")
    .replace(/ğ/g, "g")
    .replace(/ü/g, "u")
    .replace(/ö/g, "o")
    .replace(/ç/g, "c")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return `${temiz}-${tarih}.csv`;
}

export function csvYaniti(dosyaAdi: string, icerik: string): Response {
  return new Response(icerik, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename*=UTF-8''${encodeURIComponent(dosyaAdi)}`,
      "Cache-Control": "private, no-store",
    },
  });
}
