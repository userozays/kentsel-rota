import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { oturumGerekli } from "@/lib/oturum";
import { yazabilir } from "@/lib/sabitler";
import { SayfaBasligi } from "@/components/ortak";
import { BinaFormu } from "../bina-formu";

export const metadata: Metadata = { title: "Yeni Bina Dosyasi" };
export const dynamic = "force-dynamic";

export default async function YeniBinaSayfasi() {
  const oturum = await oturumGerekli();
  if (!yazabilir(oturum.rol)) redirect("/binalar");

  const [danismanlar, muteahhitler] = await Promise.all([
    db.kullanici.findMany({
      where: { aktif: true, rol: { in: ["ADMIN", "DANISMAN"] } },
      select: { id: true, ad: true },
      orderBy: { ad: "asc" },
    }),
    db.muteahhit.findMany({
      select: { id: true, firmaAdi: true, durum: true },
      orderBy: [{ durum: "asc" }, { firmaAdi: "asc" }],
    }),
  ]);

  return (
    <>
      <SayfaBasligi ustBaslik="Binalar" baslik="Yeni Bina Dosyasi" />
      <div className="page-body">
        <div className="container-fluid">
          <BinaFormu danismanlar={danismanlar} muteahhitler={muteahhitler} />
        </div>
      </div>
    </>
  );
}
