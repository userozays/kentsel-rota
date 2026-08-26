import { NextResponse, type NextRequest } from "next/server";
import { db } from "@/lib/db";
import { gecerliOturum } from "@/lib/oturum";
import { KULLANIM_TURU, ONAY_DURUMU, RISK_DURUMU, SUREC_ADIMI, etiketBul } from "@/lib/sabitler";
import { onayOzeti } from "@/lib/yardimcilar";
import { csvUret, csvYaniti, dosyaAdiUret } from "@/lib/disa-aktar";

export const dynamic = "force-dynamic";

/** Bir binanın malik + arsa payı + onay çizelgesi. Toplantı ve imza takibi için. */
export async function GET(istek: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const oturum = await gecerliOturum();
  // Cerez imzasi gecerli ama hesap artik gecerli degilse: /giris yerine
  // /api/cikis, cunku cerez durdugu surece middleware kullaniciyi panele
  // geri atar. Cikis rotasi cerezi dusurup giris ekranina goturur.
  if (!oturum) return NextResponse.redirect(new URL("/api/cikis", istek.url));

  const { id } = await params;
  const bina = await db.bina.findUnique({
    where: { id },
    include: {
      hisseler: { include: { malik: true }, orderBy: { bagimsizBolumNo: "asc" } },
      muteahhit: { select: { firmaAdi: true } },
      danisman: { select: { ad: true } },
    },
  });

  if (!bina) return new NextResponse("Bina bulunamadı", { status: 404 });

  const ozet = onayOzeti(bina.hisseler);

  const basliklar = [
    "B.B. No",
    "Malik",
    "T.C. / Vergi No",
    "Telefon",
    "E-posta",
    "Kullanım",
    "Arsa payı (pay)",
    "Arsa payı (payda)",
    "Oran (%)",
    "Onay durumu",
    "Onay tarihi",
    "Not",
  ];

  const satirlar: unknown[][] = bina.hisseler.map((h) => [
    h.bagimsizBolumNo ?? "",
    h.malik.adSoyad,
    h.malik.tcKimlik ?? "",
    h.malik.telefon ?? "",
    h.malik.email ?? "",
    etiketBul(KULLANIM_TURU, h.kullanimTuru).etiket,
    h.arsaPayiPay ?? "",
    h.arsaPayiPayda ?? "",
    h.hisseOrani,
    etiketBul(ONAY_DURUMU, h.onayDurumu).etiket,
    h.onayTarihi ?? "",
    h.notlar ?? "",
  ]);

  // Çizelgenin altına özet satırları
  satirlar.push([]);
  satirlar.push(["ÖZET", bina.baslik]);
  satirlar.push(["Dosya kodu", bina.kod]);
  satirlar.push(["Konum", `${bina.mahalle}, ${bina.ilce} / ${bina.il}`]);
  satirlar.push(["Ada / Parsel", `${bina.ada} / ${bina.parsel}`]);
  satirlar.push(["Risk durumu", etiketBul(RISK_DURUMU, bina.riskDurumu).etiket]);
  satirlar.push(["Aşama", etiketBul(SUREC_ADIMI, bina.asama).etiket]);
  satirlar.push(["Müteahhit", bina.muteahhit?.firmaAdi ?? "Seçilmedi"]);
  satirlar.push(["Danışman", bina.danisman?.ad ?? "Atanmadı"]);
  satirlar.push(["Bağımsız bölüm sayısı", ozet.bolumSayisi]);
  satirlar.push(["Olumlu (arsa payı %)", Number(ozet.olumluOran.toFixed(2))]);
  satirlar.push(["Olumsuz (arsa payı %)", Number(ozet.olumsuzOran.toFixed(2))]);
  satirlar.push(["Karar bekleyen", ozet.bekleyenAdet]);
  satirlar.push(["Ulaşılamayan", ozet.ulasilamayanAdet]);
  satirlar.push(["Çoğunluk eşiği (%)", ozet.esik]);
  satirlar.push(["Çoğunluk sağlandı mı", ozet.cogunlukSaglandi]);

  return csvYaniti(dosyaAdiUret(`${bina.kod} onay cizelgesi`), csvUret(basliklar, satirlar));
}
