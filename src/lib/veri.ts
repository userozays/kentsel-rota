import "server-only";
import { db } from "@/lib/db";
import { gorunurBinaIdleri, type OturumKullanici } from "@/lib/auth";
import { ozetle, type Ozet } from "@/lib/hesap";

/** Kullanıcının görebildiği binalar + malikleri + çoğunluk özeti. */
export async function binalariGetir(kullanici: OturumKullanici, esikYuzde: number) {
  const gorunur = await gorunurBinaIdleri(kullanici);
  const binalar = await db.bina.findMany({
    where: gorunur === null ? {} : { id: { in: gorunur } },
    include: {
      malikler: { orderBy: { pay: "desc" } },
      _count: { select: { teklifler: true } },
    },
    orderBy: { ad: "asc" },
  });

  return binalar.map((b) => ({
    ...b,
    ozet: ozetle({ payda: b.payda, malikler: b.malikler }, esikYuzde),
  }));
}

export type BinaOzetli = Awaited<ReturnType<typeof binalariGetir>>[number];
export type { Ozet };
