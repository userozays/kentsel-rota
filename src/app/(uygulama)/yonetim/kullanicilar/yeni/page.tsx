import Link from "next/link";
import { kullaniciOlustur } from "@/actions/kullanici";
import { EylemFormu, Gonder } from "@/components/Form";
import { KullaniciAlanlari } from "@/components/KullaniciAlanlari";

export const metadata = { title: "Yeni kullanıcı — Kentsel Rota" };

export default function YeniKullaniciSayfasi() {
  return (
    <>
      <div className="crumb">
        <Link href="/yonetim/kullanicilar">← Kullanıcılar</Link>
        <span>/</span>
        <span>Yeni</span>
      </div>

      <div className="head">
        <div>
          <h1>Yeni kullanıcı</h1>
          <div className="sub">
            Başlangıç şifresini burada belirle ve kullanıcıya güvenli bir kanaldan ilet.
            Kullanıcı ilk girişinden sonra kendi şifresini değiştirebilir.
          </div>
        </div>
      </div>

      <div className="panel">
        <div className="pbody">
          <EylemFormu eylem={kullaniciOlustur}>
            <KullaniciAlanlari />
            <div className="ayirici" />
            <div className="form-grid">
              <div className="field">
                <label htmlFor="sifre">Başlangıç şifresi</label>
                <input
                  id="sifre"
                  name="sifre"
                  type="text"
                  minLength={10}
                  required
                  autoComplete="new-password"
                />
                <span className="hint">
                  En az 10 karakter. Açık yazılır ki kopyalayıp iletebilesin.
                </span>
              </div>
            </div>
            <div className="form-alt">
              <Link href="/yonetim/kullanicilar" className="btn">
                Vazgeç
              </Link>
              <Gonder etiket="Kullanıcı oluştur" />
            </div>
          </EylemFormu>
        </div>
      </div>
    </>
  );
}
