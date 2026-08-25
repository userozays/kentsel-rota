import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { db } from "@/lib/db";
import { oturumGerekli } from "@/lib/oturum";
import { yazabilir } from "@/lib/sabitler";
import { SayfaBasligi } from "@/components/ortak";
import { BinaFormu } from "../../bina-formu";

export const metadata: Metadata = { title: "Bina Duzenle" };
export const dynamic = "force-dynamic";

export default async function BinaDuzenleSayfasi({ params }: { params: Promise<{ id: string }> }) {
  const oturum = await oturumGerekli();
  const { id } = await params;
  if (!yazabilir(oturum.rol)) redirect(`/binalar/${id}`);

  const [bina, danismanlar, muteahhitler] = await Promise.all([
    db.bina.findUnique({ where: { id } }),
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

  if (!bina) notFound();

  return (
    <>
      <SayfaBasligi ustBaslik={bina.kod} baslik={bina.baslik} />
      <div className="page-body">
        <div className="container-fluid">
          <BinaFormu bina={bina} danismanlar={danismanlar} muteahhitler={muteahhitler} />
        </div>
      </div>
    </>
  );
}
