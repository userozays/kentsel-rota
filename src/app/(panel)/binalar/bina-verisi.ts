import "server-only";

import { db } from "@/lib/db";

/**
 * Bina detayının sorgusu tek yerde: hem `/binalar/[id]` sayfası hem de
 * listedeki profil modalı aynı veriyi kullanıyor. İkisi ayrı sorgu yazsaydı
 * biri include'u değiştirince diğeri eksik veriyle kalırdı.
 */
export async function binaDetayiGetir(id: string) {
  return db.bina.findUnique({
    where: { id },
    include: {
      danisman: { select: { id: true, ad: true, email: true } },
      muteahhit: true,
      hisseler: {
        include: { malik: true },
        orderBy: [{ bagimsizBolumNo: "asc" }],
      },
      surecAdimlari: {
        orderBy: { sira: "asc" },
        include: { sorumlu: { select: { ad: true } } },
      },
      aktiviteler: {
        orderBy: { tarih: "desc" },
        take: 25,
        include: { kullanici: { select: { ad: true } } },
      },
    },
  });
}

export type BinaDetayi = NonNullable<Awaited<ReturnType<typeof binaDetayiGetir>>>;

/** Malik ekleme kutusu için, bu binaya henüz bağlı olmayan kişiler. */
export function binayaEklenebilirMalikler(binaId: string) {
  return db.malik.findMany({
    where: { hisseler: { none: { binaId } } },
    select: { id: true, adSoyad: true, telefon: true },
    orderBy: { adSoyad: "asc" },
    take: 500,
  });
}

/** Müteahhit atama seçicisi için portföydeki firmalar. */
export function portfoyMuteahhitleriGetir() {
  return db.muteahhit.findMany({
    select: { id: true, firmaAdi: true, durum: true },
    orderBy: [{ durum: "asc" }, { firmaAdi: "asc" }],
  });
}
