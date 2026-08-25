import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { oturumGerekli, binaErisimiVar } from "@/lib/auth";
import { yetkiVar } from "@/lib/roller";
import { db } from "@/lib/db";
import { teklifOlustur } from "@/actions/teklif";
import { EylemFormu, Gonder } from "@/components/Form";
import { TeklifAlanlari } from "@/components/TeklifAlanlari";

export const metadata = { title: "Yeni teklif — Kentsel Rota" };

export default async function YeniTeklifSayfasi({
  searchParams,
}: {
  searchParams: Promise<{ bina?: string }>;
}) {
  const kullanici = await oturumGerekli();
  if (!yetkiVar(kullanici.rol, "teklifYaz")) redirect("/teklifler");

  const { bina: binaId } = await searchParams;
  if (!binaId) redirect("/teklifler");
  if (!(await binaErisimiVar(kullanici, binaId))) redirect("/teklifler");

  const bina = await db.bina.findUnique({ where: { id: binaId } });
  if (!bina) notFound();

  const muteahhitler = await db.muteahhit.findMany({ orderBy: { unvan: "asc" } });
  if (muteahhitler.length === 0) {
    return (
      <>
        <div className="head">
          <div>
            <h1>Yeni teklif</h1>
          </div>
        </div>
        <div className="panel">
          <div className="empty">
            <h3>Müteahhit havuzu boş</h3>
            <p>Teklif girebilmek için önce havuza yüklenici eklemen gerekiyor.</p>
            <Link href="/muteahhitler/yeni" className="btn pri">
              + Müteahhit ekle
            </Link>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <div className="crumb">
        <Link href={`/teklifler?bina=${bina.id}`}>← Teklifler</Link>
        <span>/</span>
        <span>Yeni teklif</span>
      </div>

      <div className="head">
        <div>
          <h1>Yeni teklif — {bina.ad}</h1>
          <div className="sub">
            {bina.agirlikKilit
              ? `Ağırlıklar ${bina.agirlikKilit} tarihinde kilitlendi — bu teklif kilitli puanlamayla değerlendirilecek.`
              : "Dikkat: bu binada kriter ağırlıkları henüz kilitlenmemiş. Teklifleri açmadan önce kilitle."}
          </div>
        </div>
      </div>

      <div className="panel">
        <div className="pbody">
          <EylemFormu eylem={teklifOlustur}>
            <input type="hidden" name="binaId" value={bina.id} />
            <TeklifAlanlari muteahhitler={muteahhitler} />
            <div className="form-alt">
              <Link href={`/teklifler?bina=${bina.id}`} className="btn">
                Vazgeç
              </Link>
              <Gonder etiket="Teklif ekle" />
            </div>
          </EylemFormu>
        </div>
      </div>
    </>
  );
}
