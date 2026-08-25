import { NextResponse, type NextRequest } from "next/server";
import type { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { oturumAl } from "@/lib/oturum";
import { aramaKelimeleri } from "@/lib/arama";
import { MUTEAHHIT_DURUMU, etiketBul } from "@/lib/sabitler";
import { csvUret, csvYaniti, dosyaAdiUret } from "@/lib/disa-aktar";

export const dynamic = "force-dynamic";

export async function GET(istek: NextRequest) {
  const oturum = await oturumAl();
  if (!oturum) return NextResponse.redirect(new URL("/giris", istek.url));

  const p = istek.nextUrl.searchParams;
  const kosullar: Prisma.MuteahhitWhereInput[] = [];
  for (const kelime of aramaKelimeleri(p.get("q"))) kosullar.push({ aramaMetni: { contains: kelime } });
  if (p.get("durum")) kosullar.push({ durum: p.get("durum")! });
  if (p.get("puan")) kosullar.push({ puan: { gte: Number(p.get("puan")) } });

  const muteahhitler = await db.muteahhit.findMany({
    where: kosullar.length ? { AND: kosullar } : {},
    include: { _count: { select: { binalar: true } } },
    orderBy: [{ durum: "asc" }, { firmaAdi: "asc" }],
  });

  const basliklar = [
    "Kod", "Firma adı", "Yetkili kişi", "Telefon", "E-posta", "Web sitesi",
    "Vergi dairesi", "Vergi no", "Adres", "Çalışma bölgeleri",
    "Tamamlanan proje", "Devam eden proje", "Teslim edilen daire", "Puan",
    "Çalışma durumu", "Bizdeki dosya sayısı", "Notlar", "Kayıt tarihi",
  ];

  const satirlar = muteahhitler.map((m) => [
    m.kod, m.firmaAdi, m.yetkiliKisi ?? "", m.telefon ?? "", m.email ?? "", m.websitesi ?? "",
    m.vergiDairesi ?? "", m.vergiNo ?? "", m.adres ?? "", m.calismaBolgeleri ?? "",
    m.tamamlananProje, m.devamEdenProje, m.toplamDaire, m.puan,
    etiketBul(MUTEAHHIT_DURUMU, m.durum).etiket, m._count.binalar, m.notlar ?? "", m.olusturmaTarihi,
  ]);

  return csvYaniti(dosyaAdiUret("muteahhitler"), csvUret(basliklar, satirlar));
}
