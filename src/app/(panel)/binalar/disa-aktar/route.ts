import { NextResponse, type NextRequest } from "next/server";
import type { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { oturumAl } from "@/lib/oturum";
import { aramaKelimeleri } from "@/lib/arama";
import { BINA_DURUMU, ONCELIK, RISK_DURUMU, SUREC_ADIMI, etiketBul } from "@/lib/sabitler";
import { onayOzeti } from "@/lib/yardimcilar";
import { csvUret, csvYaniti, dosyaAdiUret } from "@/lib/disa-aktar";

export const dynamic = "force-dynamic";

/** Bina listesi — liste sayfasındaki filtreler querystring ile aynen taşınır */
export async function GET(istek: NextRequest) {
  const oturum = await oturumAl();
  if (!oturum) return NextResponse.redirect(new URL("/giris", istek.url));

  const p = istek.nextUrl.searchParams;
  const kosullar: Prisma.BinaWhereInput[] = [];
  for (const kelime of aramaKelimeleri(p.get("q"))) kosullar.push({ aramaMetni: { contains: kelime } });
  if (p.get("durum")) kosullar.push({ durum: p.get("durum")! });
  if (p.get("risk")) kosullar.push({ riskDurumu: p.get("risk")! });
  if (p.get("asama")) kosullar.push({ asama: p.get("asama")! });
  if (p.get("ilce")) kosullar.push({ ilce: p.get("ilce")! });
  if (p.get("danisman")) kosullar.push({ danismanId: p.get("danisman")! });

  const binalar = await db.bina.findMany({
    where: kosullar.length ? { AND: kosullar } : {},
    include: {
      hisseler: { select: { hisseOrani: true, onayDurumu: true } },
      muteahhit: { select: { firmaAdi: true } },
      danisman: { select: { ad: true } },
    },
    orderBy: { kod: "asc" },
  });

  const basliklar = [
    "Kod", "Başlık", "İl", "İlçe", "Mahalle", "Ada", "Parsel", "Adres",
    "Kat sayısı", "Bağımsız bölüm", "Yapım yılı", "Arsa alanı (m2)",
    "Risk durumu", "Aşama", "Dosya durumu", "Öncelik",
    "Kayıtlı malik", "Olumlu (%)", "Olumsuz (%)", "Bekleyen", "Ulaşılamayan", "Çoğunluk",
    "Müteahhit", "Danışman", "Son güncelleme",
  ];

  const satirlar = binalar.map((b) => {
    const o = onayOzeti(b.hisseler);
    return [
      b.kod, b.baslik, b.il, b.ilce, b.mahalle, b.ada, b.parsel, b.adres ?? "",
      b.katSayisi ?? "", b.bagimsizBolumSayisi, b.yapimYili ?? "", b.arsaAlani ?? "",
      etiketBul(RISK_DURUMU, b.riskDurumu).etiket,
      etiketBul(SUREC_ADIMI, b.asama).etiket,
      etiketBul(BINA_DURUMU, b.durum).etiket,
      etiketBul(ONCELIK, b.oncelik).etiket,
      o.bolumSayisi,
      Number(o.olumluOran.toFixed(2)),
      Number(o.olumsuzOran.toFixed(2)),
      o.bekleyenAdet,
      o.ulasilamayanAdet,
      o.cogunlukSaglandi,
      b.muteahhit?.firmaAdi ?? "",
      b.danisman?.ad ?? "",
      b.guncellemeTarihi,
    ];
  });

  return csvYaniti(dosyaAdiUret("binalar"), csvUret(basliklar, satirlar));
}
