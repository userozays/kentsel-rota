import "server-only";

import { db } from "@/lib/db";

/**
 * Malik detayının sorgusu tek yerde: hem `/malikler/[id]` sayfası hem de
 * listedeki profil modalı aynı veriyi kullanıyor. İkisi ayrı ayrı sorgu
 * yazsaydı biri include'u değiştirince diğeri eksik veriyle kalırdı.
 */
export async function malikDetayiGetir(id: string) {
  return db.malik.findUnique({
    where: { id },
    include: {
      hisseler: {
        include: {
          bina: {
            select: {
              id: true,
              kod: true,
              baslik: true,
              ilce: true,
              mahalle: true,
              asama: true,
              durum: true,
            },
          },
        },
      },
      aktiviteler: {
        orderBy: { tarih: "desc" },
        take: 25,
        include: { kullanici: { select: { ad: true } } },
      },
    },
  });
}

export type MalikDetayi = NonNullable<Awaited<ReturnType<typeof malikDetayiGetir>>>;
