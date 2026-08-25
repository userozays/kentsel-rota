import Link from "next/link";
import { oturumGerekli } from "@/lib/auth";
import { db } from "@/lib/db";
import { ROLLER, ROL_AD, YETKI_ADI, yetkiListesi } from "@/lib/roller";
import { kullaniciSil, oturumlariKapat } from "@/actions/kullanici";
import { tarihSaat } from "@/lib/bicim";
import { EylemDugmesi, OnayliDugme } from "@/components/Form";

export const metadata = { title: "Kullanıcılar — Kentsel Rota" };

export default async function KullanicilarSayfasi() {
  const ben = await oturumGerekli();

  const kullanicilar = await db.kullanici.findMany({
    orderBy: [{ aktif: "desc" }, { ad: "asc" }],
    include: {
      _count: { select: { erisimler: true, oturumlar: true } },
    },
  });

  return (
    <>
      <div className="head">
        <div>
          <h1>Kullanıcılar ve roller</h1>
          <div className="sub">
            Rol, kullanıcının neyi görüp değiştirebileceğini belirler. <b>Saha personeli</b>{" "}
            yalnız kendisine atanan binaları görür ve teklif rakamlarına erişemez — kapalı zarf
            gizliliği bu ayrımla korunur.
          </div>
        </div>
        <div className="acts">
          <Link href="/yonetim/kullanicilar/yeni" className="btn pri">
            + Kullanıcı ekle
          </Link>
        </div>
      </div>

      <div className="panel">
        <div className="pbody flush">
          <div className="tw">
            <table>
              <thead>
                <tr>
                  <th>Kullanıcı</th>
                  <th>Rol</th>
                  <th>Erişim</th>
                  <th className="num">Açık oturum</th>
                  <th>Son giriş</th>
                  <th>Durum</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {kullanicilar.map((k) => {
                  const acikOturum = k._count.oturumlar;
                  return (
                    <tr key={k.id} style={k.aktif ? undefined : { opacity: 0.6 }}>
                      <td>
                        <div style={{ fontWeight: 500 }}>
                          {k.ad}
                          {k.id === ben.id && (
                            <span className="pill neutral" style={{ marginLeft: 7 }}>
                              sen
                            </span>
                          )}
                        </div>
                        <div className="mono" style={{ fontSize: 11.5, color: "var(--faint)" }}>
                          {k.eposta}
                        </div>
                      </td>
                      <td>
                        <span className={`rozet ${k.rol}`}>{ROL_AD[k.rol] ?? k.rol}</span>
                      </td>
                      <td style={{ fontSize: 12.5, color: "var(--muted)" }}>
                        {k.rol === "SAHA"
                          ? k._count.erisimler > 0
                            ? `${k._count.erisimler} bina atanmış`
                            : "Hiç bina atanmamış"
                          : "Tüm binalar"}
                      </td>
                      <td className="num">{acikOturum}</td>
                      <td style={{ color: "var(--muted)", fontSize: 12.5 }}>
                        {tarihSaat(k.sonGiris)}
                      </td>
                      <td>
                        {k.aktif ? (
                          <span className="pill olumlu">Etkin</span>
                        ) : (
                          <span className="pill olumsuz">Kapalı</span>
                        )}
                      </td>
                      <td>
                        <div className="rowact">
                          <Link href={`/yonetim/kullanicilar/${k.id}`} className="btn sm ghost">
                            Düzenle
                          </Link>
                          {acikOturum > 0 && (
                            <EylemDugmesi
                              eylem={oturumlariKapat.bind(null, k.id)}
                              etiket="Oturumları kapat"
                              sinif="btn sm ghost"
                              baslik="Bu kullanıcının açık oturumlarını sonlandır"
                            />
                          )}
                          {k.id !== ben.id && (
                            <OnayliDugme
                              eylem={kullaniciSil.bind(null, k.id)}
                              soru={`${k.ad} hesabı tamamen silinsin mi? Bina erişimleri ve oturumları da silinir.`}
                              etiket="×"
                            />
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* ---------- rol tanımları ---------- */}
      <div className="panel">
        <div className="phead">
          <span className="eyebrow">Referans</span>
          <h2>Roller ne yapabilir</h2>
        </div>
        <div className="pbody flush">
          <div className="tw">
            <table>
              <thead>
                <tr>
                  <th>Rol</th>
                  <th>Açıklama</th>
                  <th>Yetkiler</th>
                </tr>
              </thead>
              <tbody>
                {ROLLER.map((r) => (
                  <tr key={r.kod}>
                    <td>
                      <span className={`rozet ${r.kod}`}>{r.ad}</span>
                    </td>
                    <td style={{ fontSize: 12.5, color: "var(--muted)", maxWidth: 340 }}>
                      {r.aciklama}
                    </td>
                    <td>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
                        {yetkiListesi(r.kod).map((y) => (
                          <span className="pill neutral" key={y}>
                            {YETKI_ADI[y]}
                          </span>
                        ))}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="foot">
        Oturumlar 14 gün geçerlidir; şifre değiştirildiğinde veya hesap kapatıldığında
        kullanıcının tüm açık oturumları anında düşer. İşten ayrılan kişi için hesabı kapatmak
        yeterlidir — silmek, bina atamalarını da kaldırır.
      </div>
    </>
  );
}
