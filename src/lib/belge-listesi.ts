import "server-only";

import { db } from "./db";
import { tarih } from "./yardimcilar";
import type { BelgeSatiri } from "@/components/belgeler-karti";

/** Detay sayfalarının Belgeler kartı için satırları hazırlar. */
export async function belgeleriGetir(
  filtre: { binaId?: string; malikId?: string; muteahhitId?: string },
  oturum: { id: string; rol: string },
): Promise<BelgeSatiri[]> {
  const kayitlar = await db.belge.findMany({
    where: filtre,
    include: { yukleyen: { select: { ad: true } } },
    orderBy: { tarih: "desc" },
  });

  return kayitlar.map((b) => ({
    id: b.id,
    ad: b.ad,
    dosyaAdi: b.dosyaAdi,
    mimeTur: b.mimeTur,
    boyut: b.boyut,
    kategori: b.kategori,
    tarih: tarih(b.tarih),
    yukleyenAdi: b.yukleyen.ad,
    // Yönetici her belgeyi, danışman yalnızca kendi yüklediğini silebilir
    silebilir: oturum.rol === "ADMIN" || b.yukleyenId === oturum.id,
  }));
}
