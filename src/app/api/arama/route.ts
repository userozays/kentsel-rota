import { NextResponse, type NextRequest } from "next/server";
import { db } from "@/lib/db";
import { oturumAl } from "@/lib/oturum";
import { aramaKelimeleri } from "@/lib/arama";
import { BINA_DURUMU, MUTEAHHIT_DURUMU, SUREC_ADIMI, etiketBul } from "@/lib/sabitler";
import { sayi, yuzde, onayOzeti } from "@/lib/yardimcilar";

export const dynamic = "force-dynamic";

/** Grup başına gösterilecek en fazla sonuç */
const GRUP_LIMITI = 5;
/** Bu uzunluğun altındaki terimler için sorgu çalıştırılmaz (istemci tarafı: global-arama.tsx) */
const EN_AZ_KARAKTER = 2;

export type AramaSonucu = {
  id: string;
  baslik: string;
  altBilgi: string;
  yol: string;
  rozet?: { etiket: string; renk: string };
};

export type AramaGrubu = {
  tur: "bina" | "malik" | "muteahhit";
  etiket: string;
  sonuclar: AramaSonucu[];
  toplam: number;
};

export type AramaYaniti = {
  terim: string;
  gruplar: AramaGrubu[];
  toplam: number;
};

export async function GET(istek: NextRequest) {
  const oturum = await oturumAl();
  if (!oturum) {
    return NextResponse.json({ hata: "Oturum gerekli" }, { status: 401 });
  }

  const terim = istek.nextUrl.searchParams.get("q") ?? "";
  const kelimeler = aramaKelimeleri(terim);

  if (kelimeler.join("").length < EN_AZ_KARAKTER) {
    return NextResponse.json({ terim, gruplar: [], toplam: 0 } satisfies AramaYaniti);
  }

  const kosul = { AND: kelimeler.map((k) => ({ aramaMetni: { contains: k } })) };

  const [binalar, binaSayisi, malikler, malikSayisi, muteahhitler, muteahhitSayisi] = await Promise.all([
    db.bina.findMany({
      where: kosul,
      take: GRUP_LIMITI,
      orderBy: { guncellemeTarihi: "desc" },
      include: { hisseler: { select: { hisseOrani: true, onayDurumu: true } } },
    }),
    db.bina.count({ where: kosul }),
    db.malik.findMany({
      where: kosul,
      take: GRUP_LIMITI,
      orderBy: { adSoyad: "asc" },
      include: { _count: { select: { hisseler: true } } },
    }),
    db.malik.count({ where: kosul }),
    db.muteahhit.findMany({
      where: kosul,
      take: GRUP_LIMITI,
      orderBy: [{ durum: "asc" }, { firmaAdi: "asc" }],
      include: { _count: { select: { binalar: true } } },
    }),
    db.muteahhit.count({ where: kosul }),
  ]);

  const gruplar: AramaGrubu[] = [];

  if (binalar.length) {
    gruplar.push({
      tur: "bina",
      etiket: "Binalar",
      toplam: binaSayisi,
      sonuclar: binalar.map((b) => {
        const ozet = onayOzeti(b.hisseler);
        return {
          id: b.id,
          baslik: b.baslik,
          altBilgi: `${b.kod} · ${b.ilce} · onay ${yuzde(ozet.olumluOran, 0)}`,
          yol: `/binalar/${b.id}`,
          rozet: {
            etiket: etiketBul(SUREC_ADIMI, b.asama).etiket,
            renk: etiketBul(BINA_DURUMU, b.durum).renk,
          },
        };
      }),
    });
  }

  if (malikler.length) {
    gruplar.push({
      tur: "malik",
      etiket: "Malikler",
      toplam: malikSayisi,
      sonuclar: malikler.map((m) => ({
        id: m.id,
        baslik: m.adSoyad,
        altBilgi: [m.telefon, m.email, `${sayi(m._count.hisseler)} bağımsız bölüm`]
          .filter(Boolean)
          .join(" · "),
        yol: `/malikler/${m.id}`,
      })),
    });
  }

  if (muteahhitler.length) {
    gruplar.push({
      tur: "muteahhit",
      etiket: "Müteahhitler",
      toplam: muteahhitSayisi,
      sonuclar: muteahhitler.map((m) => ({
        id: m.id,
        baslik: m.firmaAdi,
        altBilgi: [m.kod, m.yetkiliKisi, `${sayi(m._count.binalar)} dosyamızda`].filter(Boolean).join(" · "),
        yol: `/muteahhitler/${m.id}`,
        rozet: {
          etiket: etiketBul(MUTEAHHIT_DURUMU, m.durum).etiket,
          renk: etiketBul(MUTEAHHIT_DURUMU, m.durum).renk,
        },
      })),
    });
  }

  return NextResponse.json({
    terim,
    gruplar,
    toplam: binaSayisi + malikSayisi + muteahhitSayisi,
  } satisfies AramaYaniti);
}
