import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { oturumGerekli, binaErisimiVar } from "@/lib/auth";
import { yetkiVar } from "@/lib/roller";
import { db } from "@/lib/db";
import { teklifGuncelle, teklifSil } from "@/actions/teklif";
import { EylemFormu, Gonder, OnayliDugme } from "@/components/Form";
import { TeklifAlanlari } from "@/components/TeklifAlanlari";

export const metadata = { title: "Teklif düzenle — Kentsel Rota" };

export default async function TeklifDuzenleSayfasi({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const kullanici = await oturumGerekli();
  if (!yetkiVar(kullanici.rol, "teklifYaz")) redirect("/teklifler");

  const teklif = await db.teklif.findUnique({
    where: { id },
    include: { bina: true, muteahhit: true },
  });
  if (!teklif) notFound();
  if (!(await binaErisimiVar(kullanici, teklif.binaId))) redirect("/teklifler");

  const muteahhitler = await db.muteahhit.findMany({ orderBy: { unvan: "asc" } });

  async function sil() {
    "use server";
    await teklifSil(id);
    redirect("/teklifler");
  }

  return (
    <>
      <div className="crumb">
        <Link href={`/teklifler?bina=${teklif.binaId}`}>← Teklifler</Link>
        <span>/</span>
        <span>{teklif.muteahhit.unvan}</span>
      </div>

      <div className="head">
        <div>
          <h1>{teklif.muteahhit.unvan}</h1>
          <div className="sub">
            {teklif.bina.ad}
            {teklif.tarih ? ` · teklif tarihi ${teklif.tarih}` : ""}
          </div>
        </div>
        <div className="acts">
          <OnayliDugme
            eylem={sil}
            soru="Teklif silinsin mi?"
            etiket="Teklifi sil"
            sinif="btn danger"
          />
        </div>
      </div>

      <div className="panel">
        <div className="pbody">
          <EylemFormu eylem={teklifGuncelle}>
            <input type="hidden" name="binaId" value={teklif.binaId} />
            <input type="hidden" name="id" value={teklif.id} />
            <TeklifAlanlari deger={teklif} muteahhitler={muteahhitler} />
            <div className="form-alt">
              <Link href={`/teklifler?bina=${teklif.binaId}`} className="btn">
                Vazgeç
              </Link>
              <Gonder />
            </div>
          </EylemFormu>
        </div>
      </div>
    </>
  );
}
