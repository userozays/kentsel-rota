import { NextResponse } from "next/server";
import { oturumGerekli, binaErisimiVar } from "@/lib/auth";
import { db } from "@/lib/db";
import { engelleriOku } from "@/lib/ayarlar";
import { DURUM_AD, engelOku } from "@/lib/sabitler";

function hucre(v: unknown) {
  return `"${String(v ?? "").replace(/"/g, '""')}"`;
}

/** Excel'in Türkçe yerelinde doğru açılması için BOM + noktalı virgül ayracı. */
export async function GET(_istek: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const kullanici = await oturumGerekli();
  if (!(await binaErisimiVar(kullanici, id))) {
    return new NextResponse("Erişim yok", { status: 403 });
  }

  const bina = await db.bina.findUnique({
    where: { id },
    include: { malikler: { orderBy: { pay: "desc" } } },
  });
  if (!bina) return new NextResponse("Bulunamadı", { status: 404 });

  const engelTurleri = await engelleriOku();
  const engelAd = Object.fromEntries(engelTurleri.map((e) => [e.kod, e.ad]));

  const baslik = [
    "BB",
    "Malik",
    "Kat",
    "Arsa payı",
    "Payda",
    "Tavır",
    "Hukuki engel",
    "Kiracı",
    "Telefon",
    "Son temas",
    "Not",
  ];
  const satirlar = bina.malikler.map((m) => [
    m.bb,
    m.ad,
    m.kat,
    m.pay,
    bina.payda,
    DURUM_AD[m.durum] ?? m.durum,
    engelOku(m.engel)
      .map((e) => engelAd[e] ?? e)
      .join(" / "),
    m.kiraci ? "Evet" : "Hayır",
    m.tel,
    m.sonTemas,
    m.not,
  ]);

  const csv =
    "﻿" +
    [baslik, ...satirlar].map((r) => r.map(hucre).join(";")).join("\r\n");

  const dosyaAd =
    bina.ad.replace(/[^\p{L}\p{N} _-]/gu, "").trim().replace(/\s+/g, "-") || "bina";

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename*=UTF-8''${encodeURIComponent(`${dosyaAd}-malikler.csv`)}`,
      "Cache-Control": "no-store",
    },
  });
}
