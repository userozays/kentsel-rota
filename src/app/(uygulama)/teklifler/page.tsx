import Link from "next/link";
import { redirect } from "next/navigation";
import { oturumGerekli } from "@/lib/auth";
import { yetkiVar } from "@/lib/roller";
import { ayarlariOku } from "@/lib/ayarlar";
import { binalariGetir } from "@/lib/veri";
import { db } from "@/lib/db";
import { puanla, kriterDegeri } from "@/lib/hesap";
import { KRITERLER, agirlikOku } from "@/lib/sabitler";
import { tl, para } from "@/lib/bicim";
import { agirlikGuncelle, agirlikKilitle, agirlikKilidiAc } from "@/actions/bina";
import { teklifSil } from "@/actions/teklif";
import { EylemDugmesi, EylemFormu, Gonder, OnayliDugme } from "@/components/Form";
import { BinaSecici } from "@/components/BinaSecici";

export const metadata = { title: "Teklifler — Kentsel Rota" };

function Kontrol({ tamam, metin }: { tamam: boolean; metin: string }) {
  return (
    <div style={{ display: "flex", gap: 9, alignItems: "flex-start" }}>
      <span
        style={{
          flex: "none",
          width: 17,
          height: 17,
          borderRadius: 4,
          display: "grid",
          placeItems: "center",
          fontSize: 11,
          fontWeight: 700,
          background: tamam ? "var(--ok-soft)" : "var(--surface-3)",
          color: tamam ? "var(--ok)" : "var(--faint)",
        }}
      >
        {tamam ? "✓" : "—"}
      </span>
      <span style={{ color: tamam ? "var(--text)" : "var(--muted)" }}>{metin}</span>
    </div>
  );
}

export default async function TekliflerSayfasi({
  searchParams,
}: {
  searchParams: Promise<{ bina?: string }>;
}) {
  const kullanici = await oturumGerekli();
  if (!yetkiVar(kullanici.rol, "teklifOku")) redirect("/");

  const ayarlar = await ayarlariOku();
  const binalar = await binalariGetir(kullanici, ayarlar.esikYuzde);

  if (binalar.length === 0) {
    return (
      <>
        <div className="head">
          <div>
            <h1>Teklif Karşılaştırma</h1>
          </div>
        </div>
        <div className="panel">
          <div className="empty">
            <h3>Bina yok</h3>
            <p>
              Önce panele bina ekle, sonra o binaya gelen teklifleri buraya girip ağırlıklı
              matrisle karşılaştır.
            </p>
          </div>
        </div>
      </>
    );
  }

  const { bina: istenenBina } = await searchParams;
  const bina = binalar.find((b) => b.id === istenenBina) ?? binalar[0];

  const [teklifler, muteahhitler] = await Promise.all([
    db.teklif.findMany({ where: { binaId: bina.id }, include: { muteahhit: true } }),
    db.muteahhit.findMany({ orderBy: { unvan: "asc" } }),
  ]);

  const agirliklar = agirlikOku(bina.agirliklar, ayarlar.varsayilanAgirliklar);
  const toplamAgirlik = KRITERLER.reduce((a, k) => a + agirliklar[k.kod], 0);
  const sirali = puanla(teklifler, agirliklar);
  const teklifHarita = new Map(teklifler.map((t) => [t.id, t]));
  const yazabilir = yetkiVar(kullanici.rol, "teklifYaz");

  const hepsindeNda = teklifler.length > 0 && teklifler.every((t) => t.muteahhit.nda);
  const hepsindeTaahhut = teklifler.length > 0 && teklifler.every((t) => t.muteahhit.taahhut);

  return (
    <>
      <div className="head">
        <div>
          <h1>Teklif Karşılaştırma</h1>
          <div className="sub">
            Ağırlıklar <b>teklifler açılmadan önce</b> belirlenip kilitlenmeli. Kilitli ağırlık,
            maliklere &quot;puanlama sonradan eğilmedi&quot; diyebilmenin tek yolu.
          </div>
        </div>
        <div className="acts">
          <BinaSecici
            binalar={binalar.map((b) => ({ id: b.id, ad: b.ad }))}
            secili={bina.id}
          />
          {yazabilir && (
            <Link href={`/teklifler/yeni?bina=${bina.id}`} className="btn pri">
              + Teklif ekle
            </Link>
          )}
        </div>
      </div>

      <div className="grid2" style={{ alignItems: "start", gap: 16 }}>
        {/* ---------- ağırlıklar ---------- */}
        <div className="panel">
          <div className="phead">
            <span className="eyebrow">Değerlendirme</span>
            <h2>Kriter ağırlıkları</h2>
            <div className="acts">
              {bina.agirlikKilit ? (
                <>
                  <span className="pill acc">🔒 {bina.agirlikKilit}</span>
                  {yazabilir && (
                    <OnayliDugme
                      eylem={agirlikKilidiAc.bind(null, bina.id)}
                      soru="Ağırlık kilidini açmak, puanlamanın teklifler görüldükten sonra değiştirilebildiği anlamına gelir. Devam edilsin mi?"
                      etiket="Kilidi aç"
                    />
                  )}
                </>
              ) : (
                yazabilir && (
                  <EylemDugmesi
                    eylem={agirlikKilitle.bind(null, bina.id)}
                    etiket="Kilitle"
                    sinif="btn sm"
                  />
                )
              )}
            </div>
          </div>
          <div className="pbody">
            <EylemFormu eylem={agirlikGuncelle}>
              <input type="hidden" name="binaId" value={bina.id} />
              {KRITERLER.map((k) => (
                <div className="wrow" key={k.kod}>
                  <label htmlFor={`w-${k.kod}`}>
                    {k.ad}{" "}
                    <span style={{ color: "var(--faint)", fontSize: 11.5 }}>
                      {k.yuksekIyi ? "↑ yüksek iyi" : "↓ düşük iyi"}
                    </span>
                  </label>
                  <input
                    id={`w-${k.kod}`}
                    name={k.kod}
                    type="number"
                    min="0"
                    max="100"
                    step="5"
                    defaultValue={agirliklar[k.kod]}
                    disabled={!!bina.agirlikKilit || !yazabilir}
                  />
                </div>
              ))}
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  paddingTop: 9,
                  marginTop: 6,
                  borderTop: "1px solid var(--border)",
                  fontSize: 12.5,
                  color: "var(--muted)",
                }}
              >
                <span>Toplam</span>
                <span
                  className="mono"
                  style={{
                    fontWeight: 600,
                    color: toplamAgirlik === 100 ? "var(--ok)" : "var(--warn)",
                  }}
                >
                  {toplamAgirlik}
                </span>
              </div>
              {toplamAgirlik !== 100 && (
                <div className="hint" style={{ color: "var(--warn)", marginTop: 6 }}>
                  Toplam 100 değil — puanlar yine de orantılı hesaplanır.
                </div>
              )}
              {!bina.agirlikKilit && yazabilir && (
                <div style={{ marginTop: 12 }}>
                  <Gonder etiket="Ağırlıkları kaydet" sinif="btn" />
                </div>
              )}
            </EylemFormu>
          </div>
        </div>

        {/* ---------- ihale etiği ---------- */}
        <div className="panel">
          <div className="phead">
            <span className="eyebrow">Kontrol</span>
            <h2>İhale etiği</h2>
          </div>
          <div
            className="pbody"
            style={{ display: "flex", flexDirection: "column", gap: 9, fontSize: 13 }}
          >
            <Kontrol
              tamam={teklifler.length >= 3}
              metin={`En az 3 geçerli teklif (${teklifler.length})`}
            />
            <Kontrol tamam={!!bina.agirlikKilit} metin="Ağırlıklar teklifler öncesi kilitlendi" />
            <Kontrol tamam={hepsindeNda} metin="Tüm teklif verenlerde NDA var" />
            <Kontrol
              tamam={hepsindeTaahhut}
              metin="Tüm teklif verenlerde devre dışı bırakmama taahhüdü var"
            />
            <Kontrol tamam={bina.ozet.gecti} metin="Arsa payı çoğunluğu sağlandı" />
            <div className="ayirici" />
            <div style={{ fontSize: 12, color: "var(--muted)", lineHeight: 1.55 }}>
              <b>Puanlama göreli:</b> her kriter, o anki teklif kümesinin en iyi ve en kötüsüne
              göre 0–100 arasına yerleştirilir. Teklif eklenip çıkarıldığında diğerlerinin puanı da
              değişir. Şartnamede bunu yazılı olarak belirt.
            </div>
          </div>
        </div>
      </div>

      {/* ---------- matris ---------- */}
      <div className="panel" style={{ marginTop: 16 }}>
        <div className="phead">
          <span className="eyebrow">{teklifler.length} teklif</span>
          <h2>Karşılaştırma matrisi — {bina.ad}</h2>
        </div>
        <div className="pbody flush">
          <div className="tw">
            <table>
              <thead>
                <tr>
                  <th className="num">#</th>
                  <th>Yüklenici</th>
                  <th className="num">Malik payı</th>
                  <th className="num">Kira yardımı</th>
                  <th className="num">Nakdi</th>
                  <th className="num">Süre</th>
                  <th className="num">Teminat</th>
                  <th className="num">Teknik</th>
                  <th className="num">Puan</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {sirali.length === 0 ? (
                  <tr>
                    <td colSpan={10}>
                      <div className="empty">
                        <h3>Teklif yok</h3>
                        <p>
                          Kapalı zarfları açtıktan sonra her teklifi buraya gir; matris ağırlıklara
                          göre otomatik sıralanır.
                        </p>
                        {yazabilir && (
                          <Link href={`/teklifler/yeni?bina=${bina.id}`} className="btn pri">
                            + Teklif ekle
                          </Link>
                        )}
                      </div>
                    </td>
                  </tr>
                ) : (
                  sirali.map((satir, i) => {
                    const t = teklifHarita.get(satir.teklif.id)!;
                    return (
                      <tr key={t.id}>
                        <td
                          className="num"
                          style={{ fontWeight: 600, color: i === 0 ? "var(--ok)" : "inherit" }}
                        >
                          {i + 1}
                        </td>
                        <td>
                          <div style={{ fontWeight: 500 }}>{t.muteahhit.unvan}</div>
                          <div style={{ fontSize: 11.5, color: "var(--faint)" }}>
                            Grup {t.muteahhit.ymbn}
                            {t.tarih ? ` · ${t.tarih}` : ""}
                            {!t.muteahhit.taahhut && (
                              <span style={{ color: "var(--warn)" }}> · taahhüt yok</span>
                            )}
                            {!t.muteahhit.nda && (
                              <span style={{ color: "var(--warn)" }}> · NDA yok</span>
                            )}
                          </div>
                        </td>
                        <td className="num" style={{ fontWeight: 600 }}>
                          %{tl(t.malikPayi)}
                        </td>
                        <td className="num">
                          {para(kriterDegeri(t, "kira"))}
                          <div style={{ fontSize: 11, color: "var(--faint)" }}>
                            {tl(t.kiraAy)} ay × {para(t.kiraTutar)}
                          </div>
                        </td>
                        <td className="num">{para(t.nakdi)}</td>
                        <td className="num">{tl(t.sureAy)} ay</td>
                        <td className="num">{para(t.teminat)}</td>
                        <td className="num">{tl(t.teknik)}</td>
                        <td className="num">
                          <span
                            className="mono"
                            style={{
                              fontSize: 15,
                              fontWeight: 600,
                              color: i === 0 ? "var(--ok)" : "inherit",
                            }}
                          >
                            {satir.puan.toFixed(1)}
                          </span>
                        </td>
                        <td>
                          {yazabilir && (
                            <div className="rowact">
                              <Link href={`/teklifler/${t.id}`} className="btn sm ghost">
                                Düzenle
                              </Link>
                              <OnayliDugme
                                eylem={teklifSil.bind(null, t.id)}
                                soru={`${t.muteahhit.unvan} teklifi silinsin mi?`}
                                etiket="×"
                              />
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

      {muteahhitler.length === 0 && (
        <div className="callout warn" style={{ marginTop: 16 }}>
          Müteahhit havuzu boş — teklif girebilmek için önce{" "}
          <Link href="/muteahhitler/yeni">yüklenici ekle</Link>.
        </div>
      )}

      <div className="foot">{ayarlar.ucretFormulu}</div>
    </>
  );
}
