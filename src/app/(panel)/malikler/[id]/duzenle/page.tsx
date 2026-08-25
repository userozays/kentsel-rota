import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { db } from "@/lib/db";
import { oturumGerekli } from "@/lib/oturum";
import { yazabilir } from "@/lib/sabitler";
import { SayfaBasligi } from "@/components/ortak";
import { MalikFormu } from "../../malik-formu";

export const metadata: Metadata = { title: "Malik Duzenle" };
export const dynamic = "force-dynamic";

export default async function MalikDuzenleSayfasi({ params }: { params: Promise<{ id: string }> }) {
  const oturum = await oturumGerekli();
  const { id } = await params;
  if (!yazabilir(oturum.rol)) redirect(`/malikler/${id}`);

  const malik = await db.malik.findUnique({ where: { id } });
  if (!malik) notFound();

  return (
    <>
      <SayfaBasligi ustBaslik="Malikler" baslik={malik.adSoyad} />
      <div className="page-body">
        <div className="container-fluid">
          <div className="row justify-content-center">
            <div className="col-lg-9">
              <MalikFormu malik={malik} />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
