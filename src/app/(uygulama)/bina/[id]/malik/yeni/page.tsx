import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { oturumGerekli } from "@/lib/auth";
import { yetkiVar } from "@/lib/roller";
import { engelleriOku } from "@/lib/ayarlar";
import { binaGetir } from "@/actions/bina";
import { malikOlustur } from "@/actions/malik";
import { EylemFormu, Gonder } from "@/components/Form";
import { MalikAlanlari } from "@/components/MalikAlanlari";
import { tl } from "@/lib/bicim";

export const metadata = { title: "Yeni malik — Kentsel Rota" };

export default async function YeniMalikSayfasi({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const kullanici = await oturumGerekli();
  if (!yetkiVar(kullanici.rol, "malikYaz")) redirect(`/bina/${id}`);

  const bina = await binaGetir(id);
  if (!bina) notFound();
  const engelTurleri = await engelleriOku();

  const girilen = bina.malikler.reduce((a, m) => a + m.pay, 0);
  const kalan = bina.payda - girilen;

  return (
    <>
      <div className="crumb">
        <Link href="/">← Panel</Link>
        <span>/</span>
        <Link href={`/bina/${bina.id}`}>{bina.ad}</Link>
        <span>/</span>
        <span>Yeni malik</span>
      </div>

      <div className="head">
        <div>
          <h1>Yeni malik</h1>
          <div className="sub">
            Bu binanın paydası {tl(bina.payda)}; şu ana kadar {tl(girilen)} pay girildi.{" "}
            {kalan > 0 ? (
              <>
                Girilmeyi bekleyen pay: <b>{tl(kalan)}</b>.
              </>
            ) : kalan < 0 ? (
              <b>Girilen paylar paydayı {tl(-kalan)} aşıyor — kontrol et.</b>
            ) : (
              <>Paylar paydayla tam örtüşüyor.</>
            )}
          </div>
        </div>
      </div>

      <div className="panel">
        <div className="pbody">
          <EylemFormu eylem={malikOlustur}>
            <input type="hidden" name="binaId" value={bina.id} />
            <MalikAlanlari engelTurleri={engelTurleri.filter((e) => e.aktif)} />
            <div className="form-alt">
              <Link href={`/bina/${bina.id}`} className="btn">
                Vazgeç
              </Link>
              <Gonder etiket="Malik ekle" />
            </div>
          </EylemFormu>
        </div>
      </div>
    </>
  );
}
