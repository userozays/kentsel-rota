import Link from "next/link";
import { notFound } from "next/navigation";
import { oturumGerekli } from "@/lib/auth";
import { yetkiVar } from "@/lib/roller";
import { ayarlariOku, asamalariOku, engelleriOku } from "@/lib/ayarlar";
import { binaGetir, asamaDegistir } from "@/actions/bina";
import { durumDegistir, malikSil, topluDaire } from "@/actions/malik";
import { ozetle } from "@/lib/hesap";
import { DURUMLAR, DURUM_AD, DURUM_KISA, RISKLI_AD, dayanakVar, engelOku } from "@/lib/sabitler";
import { tl, yuzde } from "@/lib/bicim";
import { PayScridi, Okuma } from "@/components/PayScridi";
import { Hedef } from "@/components/Hedef";
import { EylemDugmesi, EylemFormu, Gonder, OnayliDugme } from "@/components/Form";

export default async function BinaSayfasi({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const kullanici = await oturumGerekli();
  const bina = await binaGetir(id);
  if (!bina) notFound();

  const ayarlar = await ayarlariOku();
  const [asamalar, engelTurleri] = await Promise.all([asamalariOku(), engelleriOku()]);
  const ozet = ozetle({ payda: bina.payda, malikler: bina.malikler }, ayarlar.esikYuzde);

  const engelAd = Object.fromEntries(engelTurleri.map((e) => [e.kod, e.ad]));
  const binaYaz = yetkiVar(kullanici.rol, "binaYaz");
  const malikYaz = yetkiVar(kullanici.rol, "malikYaz");
  const asamaAd = asamalar.find((a) => a.kod === bina.asamaKod)?.ad ?? "—";
  const payTutmuyor = Math.abs(ozet.payda - ozet.girilen) > 0.001;

  return (
    <>
      <div className="crumb">
        <Link href="/">← Panel</Link>
        <span>/</span>
        <span>{bina.ad}</span>
      </div>

      <div className="head">
        <div>
          <h1>{bina.ad}</h1>
          <div className="sub mono" style={{ fontSize: 12.5 }}>
            {bina.il} / {bina.ilce}
            {bina.mahalle ? ` / ${bina.mahalle}` : ""} · Ada {bina.ada || "—"} Parsel{" "}
            {bina.parsel || "—"}
            {bina.adres ? ` · ${bina.adres}` : ""}
          </div>
        </div>
        <div className="acts">
          {binaYaz && (
            <Link href={`/bina/${bina.id}/duzenle`} className="btn">
              Bina bilgileri
            </Link>
          )}
          <a href={`/bina/${bina.id}/csv`} className="btn">
            CSV indir
          </a>
          {malikYaz && (
            <Link href={`/bina/${bina.id}/malik/yeni`} className="btn pri">
              + Malik
            </Link>
          )}
        </div>
      </div>

      {!dayanakVar(bina.riskli) && (
        <div className="callout warn" style={{ marginBottom: 16 }}>
          <b>Riskli yapı dayanağı yok — statü: {RISKLI_AD[bina.riskli] ?? "—"}.</b> Riskli yapı
          raporu onaylanmadan %{ayarlar.esikYuzde}+1 mimarisinin hukuki dayanağı olmaz; bu binada
          yıkım kararı Kat Mülkiyeti Kanunu'na tabidir.
        </div>
      )}

      {/* ---------- çoğunluk ---------- */}
      <div className="panel">
        <div className="phead">
          <span className="eyebrow">Pay Şeridi</span>
          <h2>Çoğunluk durumu</h2>
          <div className="acts">
            <span className="pill neutral">Aşama: {asamaAd}</span>
          </div>
        </div>
        <div className="pbody">
          <PayScridi
            malikler={bina.malikler}
            ozet={ozet}
            boy="lg"
            esikYuzde={ayarlar.esikYuzde}
          />
          <div style={{ margin: "14px 0 16px" }}>
            <Okuma ozet={ozet} />
          </div>

          <div className="grid3" style={{ marginBottom: 16 }}>
            <div className="stat">
              <span className="k">Olumlu</span>
              <span className="v" style={{ color: "var(--ok)" }}>
                {tl(ozet.olumlu)}
              </span>
              <span className="n">
                {ozet.kisiOlumlu} kişi · %{yuzde(ozet.payda ? (ozet.olumlu / ozet.payda) * 100 : 0)}
              </span>
            </div>
            <div className="stat">
              <span className="k">Kararsız</span>
              <span className="v" style={{ color: "var(--warn)" }}>
                {tl(ozet.kararsiz)}
              </span>
              <span className="n">
                {bina.malikler.filter((m) => m.durum === "kararsiz").length} kişi
              </span>
            </div>
            <div className="stat">
              <span className="k">Ulaşılamadı</span>
              <span className="v" style={{ color: "var(--idle)" }}>
                {tl(ozet.ulasilamadi)}
              </span>
              <span className="n">
                {bina.malikler.filter((m) => m.durum === "ulasilamadi").length} kişi
              </span>
            </div>
            <div className="stat">
              <span className="k">Olumsuz</span>
              <span className="v" style={{ color: "var(--bad)" }}>
                {tl(ozet.olumsuz)}
              </span>
              <span className="n">
                {bina.malikler.filter((m) => m.durum === "olumsuz").length} kişi
              </span>
            </div>
          </div>

          {payTutmuyor && (
            <div className="callout warn" style={{ marginBottom: 14 }}>
              <b>Pay toplamı tutmuyor.</b> Girilen paylar {tl(ozet.girilen)}, binanın paydası{" "}
              {tl(ozet.payda)}. Çoğunluk hesabı paydaya göre yapılıyor — aradaki fark girilmemiş
              malik olarak sayılıyor.
            </div>
          )}

          <Hedef ozet={ozet} />
        </div>
      </div>

      {/* ---------- aşama ---------- */}
      {binaYaz && (
        <div className="panel">
          <div className="phead">
            <span className="eyebrow">Süreç</span>
            <h2>Aşama</h2>
          </div>
          <div className="pbody" style={{ display: "flex", gap: 7, flexWrap: "wrap" }}>
            {asamalar
              .filter((a) => a.aktif)
              .map((a) => (
                <EylemDugmesi
                  key={a.kod}
                  eylem={asamaDegistir.bind(null, bina.id, a.kod)}
                  etiket={a.ad}
                  sinif={a.kod === bina.asamaKod ? "btn sm pri" : "btn sm"}
                  basili={a.kod === bina.asamaKod}
                />
              ))}
          </div>
        </div>
      )}

      {/* ---------- malikler ---------- */}
      <div className="panel">
        <div className="phead">
          <span className="eyebrow">{bina.malikler.length} kayıt</span>
          <h2>Kat malikleri</h2>
        </div>
        <div className="pbody flush">
          <div className="tw">
            <table>
              <thead>
                <tr>
                  <th className="num">BB</th>
                  <th>Malik</th>
                  <th className="num">Arsa payı</th>
                  <th>Tavır</th>
                  <th>Hukuki engel</th>
                  <th>Not</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {bina.malikler.length === 0 ? (
                  <tr>
                    <td colSpan={7}>
                      <div className="empty">
                        <h3>Henüz malik girilmemiş</h3>
                        <p>
                          Bağımsız bölümleri tek tek ekleyebilir veya aşağıdaki toplu oluşturma ile
                          hepsini bir seferde açabilirsin.
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  bina.malikler.map((m) => {
                    const engeller = engelOku(m.engel);
                    return (
                      <tr key={m.id}>
                        <td className="num">{m.bb || "—"}</td>
                        <td>
                          <div style={{ fontWeight: 500 }}>{m.ad}</div>
                          <div style={{ fontSize: 11.5, color: "var(--faint)" }}>
                            {m.kat ? `Kat ${m.kat}` : ""}
                            {m.kiraci ? " · kiracılı" : ""}
                            {m.tel ? ` · ${m.tel}` : ""}
                          </div>
                        </td>
                        <td className="num">
                          {tl(m.pay)}
                          <div style={{ fontSize: 11, color: "var(--faint)" }}>
                            %{yuzde(ozet.payda ? (m.pay / ozet.payda) * 100 : 0)}
                          </div>
                        </td>
                        <td>
                          <div className="segctl">
                            {DURUMLAR.map((d) => (
                              <EylemDugmesi
                                key={d.kod}
                                eylem={durumDegistir.bind(null, m.id, d.kod)}
                                etiket={DURUM_KISA[d.kod] ?? d.ad}
                                baslik={d.ad}
                                sinif={d.kod}
                                basili={m.durum === d.kod}
                                devreDisi={!malikYaz}
                              />
                            ))}
                          </div>
                        </td>
                        <td>
                          {engeller.length ? (
                            engeller.map((e) => (
                              <span className="pill warnflag" key={e}>
                                {engelAd[e] ?? e}
                              </span>
                            ))
                          ) : (
                            <span style={{ color: "var(--faint)" }}>—</span>
                          )}
                        </td>
                        <td style={{ maxWidth: 220, fontSize: 12.5, color: "var(--muted)" }}>
                          {m.not || "—"}
                        </td>
                        <td>
                          {malikYaz && (
                            <div className="rowact">
                              <Link
                                href={`/bina/${bina.id}/malik/${m.id}`}
                                className="btn sm ghost"
                              >
                                Düzenle
                              </Link>
                              {/* Kayıt silme yapısal bir işlem — saha personeline kapalı */}
                              {binaYaz && (
                                <OnayliDugme
                                  eylem={malikSil.bind(null, m.id)}
                                  soru={`${m.ad} kaydı silinsin mi?`}
                                  etiket="×"
                                />
                              )}
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* ---------- toplu daire ---------- */}
      {binaYaz && (
        <div className="panel">
          <div className="phead">
            <span className="eyebrow">Hızlı giriş</span>
            <h2>Toplu bağımsız bölüm oluştur</h2>
          </div>
          <div className="pbody">
            <EylemFormu eylem={topluDaire}>
              <input type="hidden" name="binaId" value={bina.id} />
              <div
                className="form-grid"
                style={{ gridTemplateColumns: "160px 1fr auto", alignItems: "end" }}
              >
                <div className="field">
                  <label htmlFor="adet">Bölüm sayısı</label>
                  <input id="adet" name="adet" type="number" min="1" max="300" defaultValue={12} />
                </div>
                <label className="onay">
                  <input type="checkbox" name="esit" defaultChecked />
                  Paydayı ({tl(bina.payda)}) eşit böl — sonra tek tek düzeltebilirsin
                </label>
                <Gonder etiket="Oluştur" bekleyen="Oluşturuluyor…" sinif="btn" />
              </div>
            </EylemFormu>
          </div>
        </div>
      )}

      {bina.notlar && (
        <div className="panel">
          <div className="phead">
            <h2>Bina notları</h2>
          </div>
          <div className="pbody" style={{ color: "var(--muted)", whiteSpace: "pre-wrap" }}>
            {bina.notlar}
          </div>
        </div>
      )}
    </>
  );
}
