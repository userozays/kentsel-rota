import { oturumGerekli } from "@/lib/auth";
import { db } from "@/lib/db";
import { ROLLER, ROL_AD, YETKI_ADI, yetkiListesi } from "@/lib/roller";
import { kendiSifremiDegistir } from "@/actions/kullanici";
import { EylemFormu, Gonder } from "@/components/Form";
import { tarihSaat } from "@/lib/bicim";

export const metadata = { title: "Hesabım — Kentsel Rota" };

export default async function HesapSayfasi() {
  const ben = await oturumGerekli();
  const kayit = await db.kullanici.findUnique({
    where: { id: ben.id },
    include: { _count: { select: { erisimler: true, oturumlar: true } } },
  });
  if (!kayit) return null;

  const rolTanim = ROLLER.find((r) => r.kod === kayit.rol);

  return (
    <>
      <div className="head">
        <div>
          <h1>Hesabım</h1>
          <div className="sub mono" style={{ fontSize: 12.5 }}>
            {kayit.eposta} · {ROL_AD[kayit.rol] ?? kayit.rol} · son giriş{" "}
            {tarihSaat(kayit.sonGiris)}
          </div>
        </div>
      </div>

      <div className="panel">
        <div className="phead">
          <span className="eyebrow">Yetki</span>
          <h2>Rolün ne yapmana izin veriyor</h2>
        </div>
        <div className="pbody" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div style={{ color: "var(--muted)", fontSize: 13 }}>{rolTanim?.aciklama}</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
            {yetkiListesi(kayit.rol).map((y) => (
              <span className="pill acc" key={y}>
                {YETKI_ADI[y]}
              </span>
            ))}
          </div>
          {kayit.rol === "SAHA" && (
            <div className="callout">
              Sana <b>{kayit._count.erisimler} bina</b> atanmış. Yeni bir binaya erişmen
              gerekiyorsa yöneticinden atama iste.
            </div>
          )}
        </div>
      </div>

      <div className="panel">
        <div className="phead">
          <span className="eyebrow">Güvenlik</span>
          <h2>Şifre değiştir</h2>
        </div>
        <div className="pbody">
          <EylemFormu eylem={kendiSifremiDegistir}>
            <div className="form-grid">
              <div className="field">
                <label htmlFor="eski">Mevcut şifren</label>
                <input
                  id="eski"
                  name="eski"
                  type="password"
                  required
                  autoComplete="current-password"
                />
              </div>
              <div className="field">
                <label htmlFor="yeni">Yeni şifre</label>
                <input
                  id="yeni"
                  name="yeni"
                  type="password"
                  minLength={10}
                  required
                  autoComplete="new-password"
                />
                <span className="hint">En az 10 karakter.</span>
              </div>
            </div>
            <div className="form-alt">
              <Gonder etiket="Şifreyi değiştir" sinif="btn" />
            </div>
          </EylemFormu>
        </div>
      </div>

      <div className="foot">
        Bu hesapta şu an <b>{kayit._count.oturumlar}</b> açık oturum var. Ortak bir bilgisayarda
        çalıştıysan çıkış yapmayı unutma; şifreni değiştirmek diğer oturumları düşürmez, bunun için
        yöneticinden &quot;oturumları kapat&quot; işlemini isteyebilirsin.
      </div>
    </>
  );
}
