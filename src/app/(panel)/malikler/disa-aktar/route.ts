import { NextResponse, type NextRequest } from "next/server";
import type { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { oturumAl } from "@/lib/oturum";
import { aramaKelimeleri } from "@/lib/arama";
import { KULLANIM_TURU, MALIK_TIPI, ONAY_DURUMU, etiketBul } from "@/lib/sabitler";
import { csvUret, csvYaniti, dosyaAdiUret } from "@/lib/disa-aktar";

export const dynamic = "force-dynamic";

/** Malik listesi — her satır bir bağımsız bölüm bağlantısıdır */
export async function GET(istek: NextRequest) {
  const oturum = await oturumAl();
  if (!oturum) return NextResponse.redirect(new URL("/giris", istek.url));

  const p = istek.nextUrl.searchParams;
  const kosullar: Prisma.MalikWhereInput[] = [];
  for (const kelime of aramaKelimeleri(p.get("q"))) kosullar.push({ aramaMetni: { contains: kelime } });
  if (p.get("tip")) kosullar.push({ tip: p.get("tip")! });
  if (p.get("onay")) kosullar.push({ hisseler: { some: { onayDurumu: p.get("onay")! } } });
  if (p.get("bina")) kosullar.push({ hisseler: { some: { binaId: p.get("bina")! } } });

  const malikler = await db.malik.findMany({
    where: kosullar.length ? { AND: kosullar } : {},
    include: { hisseler: { include: { bina: { select: { kod: true, baslik: true, ilce: true } } } } },
    orderBy: { adSoyad: "asc" },
  });

  const basliklar = [
    "Ad Soyad / Ünvan", "Kişi tipi", "T.C. / Vergi No", "Telefon", "İkinci telefon", "E-posta", "Adres",
    "Bina kodu", "Bina", "İlçe", "B.B. No", "Kullanım", "Arsa payı (%)", "Onay durumu", "Onay tarihi", "Not",
  ];

  const satirlar: unknown[][] = [];
  for (const m of malikler) {
    const ortak = [
      m.adSoyad, etiketBul(MALIK_TIPI, m.tip).etiket, m.tcKimlik ?? "",
      m.telefon ?? "", m.telefon2 ?? "", m.email ?? "", m.adres ?? "",
    ];
    if (m.hisseler.length === 0) {
      satirlar.push([...ortak, "", "", "", "", "", "", "", "", ""]);
      continue;
    }
    for (const h of m.hisseler) {
      satirlar.push([
        ...ortak,
        h.bina.kod, h.bina.baslik, h.bina.ilce,
        h.bagimsizBolumNo ?? "",
        etiketBul(KULLANIM_TURU, h.kullanimTuru).etiket,
        h.hisseOrani,
        etiketBul(ONAY_DURUMU, h.onayDurumu).etiket,
        h.onayTarihi ?? "",
        h.notlar ?? "",
      ]);
    }
  }

  return csvYaniti(dosyaAdiUret("malikler"), csvUret(basliklar, satirlar));
}
