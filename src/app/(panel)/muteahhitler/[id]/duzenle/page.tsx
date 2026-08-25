import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { db } from "@/lib/db";
import { oturumGerekli } from "@/lib/oturum";
import { yazabilir } from "@/lib/sabitler";
import { SayfaBasligi } from "@/components/ortak";
import { MuteahhitFormu } from "../../muteahhit-formu";

export const metadata: Metadata = { title: "Muteahhit Duzenle" };
export const dynamic = "force-dynamic";

export default async function MuteahhitDuzenleSayfasi({ params }: { params: Promise<{ id: string }> }) {
  const oturum = await oturumGerekli();
  const { id } = await params;
  if (!yazabilir(oturum.rol)) redirect(`/muteahhitler/${id}`);

  const muteahhit = await db.muteahhit.findUnique({ where: { id } });
  if (!muteahhit) notFound();

  return (
    <>
      <SayfaBasligi ustBaslik={muteahhit.kod} baslik={muteahhit.firmaAdi} />
      <div className="page-body">
        <div className="container-xl">
          <MuteahhitFormu muteahhit={muteahhit} />
        </div>
      </div>
    </>
  );
}
