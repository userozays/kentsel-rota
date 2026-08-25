import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { oturumGerekli } from "@/lib/auth";
import { yetkiVar } from "@/lib/roller";
import { asamalariOku } from "@/lib/ayarlar";
import { binaGetir, binaGuncelle, binaSil } from "@/actions/bina";
import { EylemFormu, Gonder, OnayliDugme } from "@/components/Form";
import { BinaAlanlari } from "@/components/BinaAlanlari";

export const metadata = { title: "Bina bilgileri — Kentsel Rota" };

export default async function BinaDuzenleSayfasi({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const kullanici = await oturumGerekli();
  if (!yetkiVar(kullanici.rol, "binaYaz")) redirect(`/bina/${id}`);

  const bina = await binaGetir(id);
  if (!bina) notFound();
  const asamalar = await asamalariOku();

  async function sil() {
    "use server";
    await binaSil(id);
  }

  return (
    <>
      <div className="crumb">
        <Link href="/">← Panel</Link>
        <span>/</span>
        <Link href={`/bina/${bina.id}`}>{bina.ad}</Link>
        <span>/</span>
        <span>Bina bilgileri</span>
      </div>

      <div className="head">
        <div>
          <h1>Bina bilgileri</h1>
          <div className="sub">
            Paydayı değiştirirsen çoğunluk oranları yeniden hesaplanır — malik payları aynı kalsa
            bile oran değişir.
          </div>
        </div>
      </div>

      <div className="panel">
        <div className="pbody">
          <EylemFormu eylem={binaGuncelle}>
            <input type="hidden" name="id" value={bina.id} />
            <BinaAlanlari deger={bina} asamalar={asamalar.filter((a) => a.aktif)} />
            <div className="form-alt">
              <Link href={`/bina/${bina.id}`} className="btn">
                Vazgeç
              </Link>
              <Gonder />
            </div>
          </EylemFormu>
        </div>
      </div>

      <div className="panel">
        <div className="phead">
          <h2>Binayı sil</h2>
        </div>
        <div
          className="pbody"
          style={{ display: "flex", gap: 14, alignItems: "center", flexWrap: "wrap" }}
        >
          <span style={{ color: "var(--muted)", fontSize: 13, flex: 1, minWidth: 240 }}>
            {bina.malikler.length} malik kaydı ve binaya bağlı bütün teklifler birlikte silinir. Bu
            işlem geri alınamaz.
          </span>
          <OnayliDugme
            eylem={sil}
            soru={`${bina.ad} ve tüm malik/teklif kayıtları silinsin mi? Bu işlem geri alınamaz.`}
            etiket="Binayı sil"
            sinif="btn danger"
          />
        </div>
      </div>
    </>
  );
}
