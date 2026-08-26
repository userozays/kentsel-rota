import "server-only";

import { db } from "@/lib/db";

/**
 * Müteahhit detayının sorgusu tek yerde: hem `/muteahhitler/[id]` sayfası hem
 * de listedeki profil modalı aynı veriyi kullanıyor.
 */
export async function muteahhitDetayiGetir(id: string) {
  return db.muteahhit.findUnique({
    where: { id },
    include: {
      binalar: {
        include: { hisseler: { select: { hisseOrani: true, onayDurumu: true } } },
        orderBy: { guncellemeTarihi: "desc" },
      },
      aktiviteler: {
        orderBy: { tarih: "desc" },
        take: 25,
        include: { kullanici: { select: { ad: true } } },
      },
    },
  });
}

export type MuteahhitDetayi = NonNullable<Awaited<ReturnType<typeof muteahhitDetayiGetir>>>;
