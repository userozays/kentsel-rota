import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { oturumGerekli } from "@/lib/auth";
import { yetkiVar } from "@/lib/roller";
import { engelleriOku } from "@/lib/ayarlar";
import { binaGetir } from "@/actions/bina";
import { malikGuncelle, malikSil } from "@/actions/malik";
import { EylemFormu, Gonder, OnayliDugme } from "@/components/Form";
import { MalikAlanlari } from "@/components/MalikAlanlari";

export const metadata = { title: "Malik düzenle — Kentsel Rota" };

export default async function MalikDuzenleSayfasi({
  params,
}: {
  params: Promise<{ id: string; malikId: string }>;
}) {
  const { id, malikId } = await params;
  const kullanici = await oturumGerekli();
  if (!yetkiVar(kullanici.rol, "malikYaz")) redirect(`/bina/${id}`);

  const bina = await binaGetir(id);
  if (!bina) notFound();
  const malik = bina.malikler.find((m) => m.id === malikId);
  if (!malik) notFound();

  const engelTurleri = await engelleriOku();

  async function sil() {
    "use server";
    await malikSil(malikId);
    redirect(`/bina/${id}`);
  }

  return (
    <>
      <div className="crumb">
        <Link href="/">← Panel</Link>
        <span>/</span>
        <Link href={`/bina/${bina.id}`}>{bina.ad}</Link>
        <span>/</span>
        <span>{malik.ad}</span>
      </div>

      <div className="head">
        <div>
          <h1>{malik.ad}</h1>
          <div className="sub mono" style={{ fontSize: 12.5 }}>
            D.{malik.bb || "—"}
            {malik.kat ? ` · Kat ${malik.kat}` : ""} · {malik.pay} pay
            {malik.sonTemas ? ` · son temas ${malik.sonTemas}` : ""}
          </div>
        </div>
        {/* Kayıt silme yapısal bir işlem — saha personeline kapalı */}
        {yetkiVar(kullanici.rol, "binaYaz") && (
          <div className="acts">
            <OnayliDugme
              eylem={sil}
              soru={`${malik.ad} kaydı silinsin mi?`}
              etiket="Kaydı sil"
              sinif="btn danger"
            />
          </div>
        )}
      </div>

      <div className="panel">
        <div className="pbody">
          <EylemFormu eylem={malikGuncelle}>
            <input type="hidden" name="binaId" value={bina.id} />
            <input type="hidden" name="id" value={malik.id} />
            <MalikAlanlari deger={malik} engelTurleri={engelTurleri.filter((e) => e.aktif)} />
            <div className="form-alt">
              <Link href={`/bina/${bina.id}`} className="btn">
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
