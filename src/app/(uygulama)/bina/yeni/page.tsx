import Link from "next/link";
import { redirect } from "next/navigation";
import { oturumGerekli } from "@/lib/auth";
import { yetkiVar } from "@/lib/roller";
import { asamalariOku } from "@/lib/ayarlar";
import { binaOlustur } from "@/actions/bina";
import { EylemFormu, Gonder } from "@/components/Form";
import { BinaAlanlari } from "@/components/BinaAlanlari";

export const metadata = { title: "Yeni bina — Kentsel Rota" };

export default async function YeniBinaSayfasi() {
  const kullanici = await oturumGerekli();
  if (!yetkiVar(kullanici.rol, "binaYaz")) redirect("/");
  const asamalar = await asamalariOku();

  return (
    <>
      <div className="crumb">
        <Link href="/">← Panel</Link>
        <span>/</span>
        <span>Yeni bina</span>
      </div>

      <div className="head">
        <div>
          <h1>Yeni bina</h1>
          <div className="sub">
            Payda alanı zorunlu: çoğunluk hesabı buna göre yapılır. Tapudaki ortak paydayı gir,
            malik paylarını sonra tek tek veya toplu olarak ekle.
          </div>
        </div>
      </div>

      <div className="panel">
        <div className="pbody">
          <EylemFormu eylem={binaOlustur}>
            <BinaAlanlari asamalar={asamalar.filter((a) => a.aktif)} />
            <div className="form-alt">
              <Link href="/" className="btn">
                Vazgeç
              </Link>
              <Gonder etiket="Bina ekle" />
            </div>
          </EylemFormu>
        </div>
      </div>
    </>
  );
}
