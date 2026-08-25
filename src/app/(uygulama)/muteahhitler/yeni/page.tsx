import Link from "next/link";
import { redirect } from "next/navigation";
import { oturumGerekli } from "@/lib/auth";
import { yetkiVar } from "@/lib/roller";
import { muteahhitOlustur } from "@/actions/muteahhit";
import { EylemFormu, Gonder } from "@/components/Form";
import { MuteahhitAlanlari } from "@/components/MuteahhitAlanlari";

export const metadata = { title: "Yeni müteahhit — Kentsel Rota" };

export default async function YeniMuteahhitSayfasi() {
  const kullanici = await oturumGerekli();
  if (!yetkiVar(kullanici.rol, "muteahhitYaz")) redirect("/muteahhitler");

  return (
    <>
      <div className="crumb">
        <Link href="/muteahhitler">← Müteahhitler</Link>
        <span>/</span>
        <span>Yeni</span>
      </div>

      <div className="head">
        <div>
          <h1>Yeni müteahhit</h1>
          <div className="sub">
            Dosyayı paylaşmadan önce NDA ve devre dışı bırakmama taahhüdünü işaretle — kutular
            boşken bu yüklenici ihale etiği kontrolünü düşürür.
          </div>
        </div>
      </div>

      <div className="panel">
        <div className="pbody">
          <EylemFormu eylem={muteahhitOlustur}>
            <MuteahhitAlanlari />
            <div className="form-alt">
              <Link href="/muteahhitler" className="btn">
                Vazgeç
              </Link>
              <Gonder etiket="Ekle" />
            </div>
          </EylemFormu>
        </div>
      </div>
    </>
  );
}
