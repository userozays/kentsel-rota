import Link from "next/link";
import { redirect } from "next/navigation";
import { oturumGerekli } from "@/lib/auth";
import { yetkiVar } from "@/lib/roller";
import { ayarlariOku } from "@/lib/ayarlar";
import { binalariGetir } from "@/lib/veri";
import { emsalAlani } from "@/lib/hesap";
import { RISKLI_AD, dayanakVar } from "@/lib/sabitler";
import { tl } from "@/lib/bicim";

export const metadata = { title: "Fizibilite — Kentsel Rota" };

export default async function FizibiliteSayfasi() {
  const kullanici = await oturumGerekli();
  if (!yetkiVar(kullanici.rol, "tumBinalar")) redirect("/");

  const ayarlar = await ayarlariOku();
  const binalar = await binalariGetir(kullanici, ayarlar.esikYuzde);
  const yazabilir = yetkiVar(kullanici.rol, "binaYaz");

  const toplamArsa = binalar.reduce((a, b) => a + b.arsaM2, 0);
  const toplamEmsal = binalar.reduce((a, b) => a + emsalAlani(b.arsaM2, b.emsal), 0);
  const dayanaksiz = binalar.filter((b) => !dayanakVar(b.riskli));

  return (
    <>
      <div className="head">
        <div>
          <h1>Fizibilite</h1>
          <div className="sub">
            İmar verisi ve riskli yapı statüsü. <b>Riskli yapı statüsü olmayan binada</b> yıkım
            kararı Kat Mülkiyeti Kanunu&apos;na tabidir ve pratikte oybirliği gerekir — %
            {ayarlar.esikYuzde}+1 mimarisi ancak riskli yapı raporu onaylandıktan sonra dayanak
            bulur.
          </div>
        </div>
        {yazabilir && (
          <div className="acts">
            <Link href="/bina/yeni" className="btn pri">
              + Bina ekle
            </Link>
          </div>
        )}
      </div>

      <div className="grid3" style={{ marginBottom: 18 }}>
        <div className="stat">
          <span className="k">Toplam arsa</span>
          <span className="v">{tl(Math.round(toplamArsa))}</span>
          <span className="n">m²</span>
        </div>
        <div className="stat">
          <span className="k">Toplam emsal alanı</span>
          <span className="v">{tl(Math.round(toplamEmsal))}</span>
          <span className="n">m² · arsa × emsal</span>
        </div>
        <div className="stat">
          <span className="k">Riskli yapı dayanağı yok</span>
          <span className="v" style={{ color: dayanaksiz.length ? "var(--warn)" : "inherit" }}>
            {dayanaksiz.length}
          </span>
          <span className="n">bina · rapor onaylanmamış</span>
        </div>
      </div>

      {dayanaksiz.length > 0 && (
        <div className="callout warn" style={{ marginBottom: 16 }}>
          <b>{dayanaksiz.length} binada riskli yapı raporu onaylanmamış.</b> Karot ve riskli yapı
          tespitini malik görüşmelerinden önce başlat — sonra başlatılırsa çoğunluk mimarisi boşta
          kalır.
        </div>
      )}

      <div className="panel">
        <div className="pbody flush">
          <div className="tw">
            <table>
              <thead>
                <tr>
                  <th>Bina</th>
                  <th className="num">Arsa m²</th>
                  <th className="num">Emsal</th>
                  <th className="num">TAKS</th>
                  <th className="num">Emsal alanı m²</th>
                  <th className="num">Mevcut kat</th>
                  <th>Riskli yapı</th>
                  <th className="num">BB</th>
                  <th className="num">Engel</th>
                  <th className="num">Çoğunluk</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {binalar.length === 0 ? (
                  <tr>
                    <td colSpan={11}>
                      <div className="empty">
                        <h3>Bina yok</h3>
                        <p>Panele bina ekledikçe fizibilite verisi burada toplanır.</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  binalar.map((b) => (
                    <tr key={b.id}>
                      <td>
                        <Link
                          href={`/bina/${b.id}`}
                          style={{ fontWeight: 500, textDecoration: "none", color: "inherit" }}
                        >
                          {b.ad}
                        </Link>
                        <div className="mono" style={{ fontSize: 11.5, color: "var(--faint)" }}>
                          {b.ada || "—"}/{b.parsel || "—"} · {b.ilce}
                        </div>
                      </td>
                      <td className="num">{tl(b.arsaM2)}</td>
                      <td className="num">{tl(b.emsal)}</td>
                      <td className="num">{tl(b.taks)}</td>
                      <td className="num">
                        <b>{tl(Math.round(emsalAlani(b.arsaM2, b.emsal)))}</b>
                      </td>
                      <td className="num">{b.mevcutKat || "—"}</td>
                      <td>
                        <span
                          className={`pill ${
                            b.riskli === "kesinlesti"
                              ? "acc"
                              : b.riskli === "yok"
                                ? "neutral"
                                : "warnflag"
                          }`}
                        >
                          {RISKLI_AD[b.riskli] ?? "—"}
                        </span>
                      </td>
                      <td className="num">{b.malikler.length}</td>
                      <td className="num">
                        {b.ozet.engelliSayisi ? (
                          <span style={{ color: "var(--warn)", fontWeight: 600 }}>
                            {b.ozet.engelliSayisi}
                          </span>
                        ) : (
                          "0"
                        )}
                      </td>
                      <td className="num">
                        <span className={`verdict ${b.ozet.gecti ? "pass" : "fail"}`}>
                          {b.ozet.gecti ? "✓" : `-${tl(b.ozet.eksikPay)}`}
                        </span>
                      </td>
                      <td>
                        {yazabilir && (
                          <div className="rowact">
                            <Link href={`/bina/${b.id}/duzenle`} className="btn sm ghost">
                              Düzenle
                            </Link>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  );
}
