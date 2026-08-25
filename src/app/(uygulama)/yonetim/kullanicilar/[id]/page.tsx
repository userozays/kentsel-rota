import Link from "next/link";
import { notFound } from "next/navigation";
import { oturumGerekli } from "@/lib/auth";
import { db } from "@/lib/db";
import { ROL_AD } from "@/lib/roller";
import { binaErisimiKaydet, kullaniciGuncelle, sifreDegistir } from "@/actions/kullanici";
import { EylemFormu, Gonder } from "@/components/Form";
import { KullaniciAlanlari } from "@/components/KullaniciAlanlari";
import { tarihSaat } from "@/lib/bicim";

export const metadata = { title: "Kullanıcı düzenle — Kentsel Rota" };

export default async function KullaniciDuzenleSayfasi({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const ben = await oturumGerekli();

  const kullanici = await db.kullanici.findUnique({
    where: { id },
    include: { erisimler: { select: { binaId: true } } },
  });
  if (!kullanici) notFound();

  const binalar = await db.bina.findMany({
    orderBy: { ad: "asc" },
    select: { id: true, ad: true, ilce: true },
  });
  const atanmis = new Set(kullanici.erisimler.map((e) => e.binaId));
  const kendisi = kullanici.id === ben.id;

  return (
    <>
      <div className="crumb">
        <Link href="/yonetim/kullanicilar">← Kullanıcılar</Link>
        <span>/</span>
        <span>{kullanici.ad}</span>
      </div>

      <div className="head">
        <div>
          <h1>{kullanici.ad}</h1>
          <div className="sub mono" style={{ fontSize: 12.5 }}>
            {kullanici.eposta} · {ROL_AD[kullanici.rol] ?? kullanici.rol} · son giriş{" "}
            {tarihSaat(kullanici.sonGiris)}
          </div>
        </div>
      </div>

      {/* ---------- profil ---------- */}
      <div className="panel">
        <div className="phead">
          <span className="eyebrow">Hesap</span>
          <h2>Kullanıcı bilgileri</h2>
        </div>
        <div className="pbody">
          <EylemFormu eylem={kullaniciGuncelle}>
            <input type="hidden" name="id" value={kullanici.id} />
            <KullaniciAlanlari deger={kullanici} kendisi={kendisi} />
            <div className="form-alt">
              <Link href="/yonetim/kullanicilar" className="btn">
                Geri
              </Link>
              <Gonder />
            </div>
          </EylemFormu>
        </div>
      </div>

      {/* ---------- şifre ---------- */}
      <div className="panel">
        <div className="phead">
          <span className="eyebrow">Güvenlik</span>
          <h2>Şifre belirle</h2>
        </div>
        <div className="pbody">
          <EylemFormu eylem={sifreDegistir}>
            <input type="hidden" name="id" value={kullanici.id} />
            <div className="form-grid">
              <div className="field">
                <label htmlFor="sifre">Yeni şifre</label>
                <input
                  id="sifre"
                  name="sifre"
                  type="text"
                  minLength={10}
                  required
                  autoComplete="new-password"
                />
                <span className="hint">
                  En az 10 karakter. Kaydedilince bu kullanıcının açık oturumları kapanır.
                </span>
              </div>
            </div>
            <div className="form-alt">
              <Gonder etiket="Şifreyi değiştir" sinif="btn" />
            </div>
          </EylemFormu>
        </div>
      </div>

      {/* ---------- bina erişimi ---------- */}
      <div className="panel">
        <div className="phead">
          <span className="eyebrow">Yetki</span>
          <h2>Bina erişimi</h2>
        </div>
        <div className="pbody">
          {kullanici.rol !== "SAHA" ? (
            <div className="callout">
              <b>{ROL_AD[kullanici.rol] ?? kullanici.rol}</b> rolü zaten tüm binaları görür; bina
              bazlı atama yalnız <b>Saha Personeli</b> için geçerlidir. Erişimi daraltmak istiyorsan
              rolü Saha Personeli yap.
            </div>
          ) : binalar.length === 0 ? (
            <div style={{ color: "var(--muted)", fontSize: 13 }}>
              Sistemde henüz bina yok — önce bina ekle.
            </div>
          ) : (
            <EylemFormu eylem={binaErisimiKaydet}>
              <input type="hidden" name="kullaniciId" value={kullanici.id} />
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {binalar.map((b) => (
                  <label className="onay" key={b.id}>
                    <input
                      type="checkbox"
                      name="bina[]"
                      value={b.id}
                      defaultChecked={atanmis.has(b.id)}
                    />
                    {b.ad}
                    <span style={{ color: "var(--faint)", fontSize: 11.5 }}>{b.ilce}</span>
                  </label>
                ))}
              </div>
              <div className="form-alt">
                <Gonder etiket="Erişimi kaydet" sinif="btn" />
              </div>
            </EylemFormu>
          )}
        </div>
      </div>
    </>
  );
}
