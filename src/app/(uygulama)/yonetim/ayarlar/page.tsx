import { ayarlariOku, asamalariOku, engelleriOku } from "@/lib/ayarlar";
import { db } from "@/lib/db";
import { KRITERLER } from "@/lib/sabitler";
import {
  asamaKaydet,
  engelEkle,
  engelKaydet,
  genelAyarlariKaydet,
  varsayilanAgirlikKaydet,
} from "@/actions/ayar";
import { EylemFormu, Gonder } from "@/components/Form";

export const metadata = { title: "Sistem ayarları — Kentsel Rota" };

export default async function AyarlarSayfasi() {
  const [ayarlar, asamalar, engeller, binaSayisi] = await Promise.all([
    ayarlariOku(),
    asamalariOku(),
    engelleriOku(),
    db.bina.count(),
  ]);

  const toplamAgirlik = KRITERLER.reduce((a, k) => a + ayarlar.varsayilanAgirliklar[k.kod], 0);

  return (
    <>
      <div className="head">
        <div>
          <h1>Sistem ayarları</h1>
          <div className="sub">
            Buradaki değerler tüm kullanıcıları etkiler. Çoğunluk eşiği ve sözlükler, mevzuat
            değiştiğinde koda dokunmadan güncellenebilsin diye ayrı tutuldu.
          </div>
        </div>
      </div>

      {/* ---------- genel ---------- */}
      <div className="panel">
        <div className="phead">
          <span className="eyebrow">Genel</span>
          <h2>Şirket ve süreç</h2>
        </div>
        <div className="pbody">
          <EylemFormu eylem={genelAyarlariKaydet}>
            <div className="form-grid">
              <div className="field">
                <label htmlFor="sirketAd">Şirket adı</label>
                <input id="sirketAd" name="sirketAd" defaultValue={ayarlar.sirketAd} required />
                <span className="hint">Sol menüde ve giriş ekranında görünür.</span>
              </div>
              <div className="field">
                <label htmlFor="sirketUnvan">Tam ünvan</label>
                <input
                  id="sirketUnvan"
                  name="sirketUnvan"
                  defaultValue={ayarlar.sirketUnvan}
                  placeholder="ör. ... Gayrimenkul Danışmanlık A.Ş."
                />
              </div>

              <div className="field">
                <label htmlFor="esikYuzde">Çoğunluk eşiği (%)</label>
                <input
                  id="esikYuzde"
                  name="esikYuzde"
                  type="number"
                  min="1"
                  max="99"
                  step="1"
                  defaultValue={ayarlar.esikYuzde}
                  required
                />
                <span className="hint">
                  6306 s. Kanun&apos;da salt çoğunluk: 50. Değiştirirsen {binaSayisi} binanın
                  tamamında oranlar yeniden yorumlanır.
                </span>
              </div>

              <div className="field">
                <label htmlFor="temasUyariGun">Temas uyarısı (gün)</label>
                <input
                  id="temasUyariGun"
                  name="temasUyariGun"
                  type="number"
                  min="1"
                  max="365"
                  defaultValue={ayarlar.temasUyariGun}
                />
                <span className="hint">
                  Bu süreden uzun süredir temas edilmemiş malikler için eşik.
                </span>
              </div>

              <div className="field full">
                <label htmlFor="ucretFormulu">Danışmanlık bedeli açıklaması</label>
                <textarea
                  id="ucretFormulu"
                  name="ucretFormulu"
                  defaultValue={ayarlar.ucretFormulu}
                />
                <span className="hint">
                  Teklif karşılaştırma sayfasının altında görünür — şartnamede ilan ettiğin metnin
                  aynısı olmalı.
                </span>
              </div>

              <div className="field full">
                <label htmlFor="kvkkNot">KVKK notu</label>
                <textarea id="kvkkNot" name="kvkkNot" defaultValue={ayarlar.kvkkNot} />
              </div>
            </div>
            <div className="form-alt">
              <Gonder />
            </div>
          </EylemFormu>
        </div>
      </div>

      {/* ---------- varsayılan ağırlıklar ---------- */}
      <div className="panel">
        <div className="phead">
          <span className="eyebrow">İhale</span>
          <h2>Varsayılan kriter ağırlıkları</h2>
          <div className="acts">
            <span
              className="pill neutral mono"
              style={{ color: toplamAgirlik === 100 ? "var(--ok)" : "var(--warn)" }}
            >
              Toplam {toplamAgirlik}
            </span>
          </div>
        </div>
        <div className="pbody">
          <EylemFormu eylem={varsayilanAgirlikKaydet}>
            {KRITERLER.map((k) => (
              <div className="wrow" key={k.kod}>
                <label htmlFor={`v-${k.kod}`}>
                  {k.ad}{" "}
                  <span style={{ color: "var(--faint)", fontSize: 11.5 }}>
                    {k.yuksekIyi ? "↑ yüksek iyi" : "↓ düşük iyi"}
                  </span>
                </label>
                <input
                  id={`v-${k.kod}`}
                  name={k.kod}
                  type="number"
                  min="0"
                  max="100"
                  step="5"
                  defaultValue={ayarlar.varsayilanAgirliklar[k.kod]}
                />
              </div>
            ))}
            <div className="hint" style={{ marginTop: 10 }}>
              Yalnız <b>yeni</b> binalara uygulanır. Mevcut binaların ağırlıkları teklif
              sayfasından, kilit açıkken değiştirilir.
            </div>
            <div className="form-alt">
              <Gonder etiket="Varsayılanları kaydet" sinif="btn" />
            </div>
          </EylemFormu>
        </div>
      </div>

      {/* ---------- aşamalar ---------- */}
      <div className="panel">
        <div className="phead">
          <span className="eyebrow">Sözlük</span>
          <h2>Süreç aşamaları</h2>
        </div>
        <div className="pbody">
          <EylemFormu eylem={asamaKaydet}>
            <div className="tw">
              <table>
                <thead>
                  <tr>
                    <th className="num">Sıra</th>
                    <th>Aşama adı</th>
                    <th>Kullanımda</th>
                    <th>Boşken sütun göster</th>
                    <th className="num">Bina</th>
                  </tr>
                </thead>
                <tbody>
                  {asamalar.map((a) => (
                    <tr key={a.kod}>
                      <td className="num" style={{ width: 80 }}>
                        <input
                          name={`sira_${a.kod}`}
                          type="number"
                          defaultValue={a.sira}
                          style={{ width: 62, textAlign: "right" }}
                        />
                      </td>
                      <td>
                        <input name={`ad_${a.kod}`} defaultValue={a.ad} required />
                        <div className="mono" style={{ fontSize: 11, color: "var(--faint)" }}>
                          {a.kod}
                        </div>
                      </td>
                      <td>
                        <label className="onay">
                          <input type="checkbox" name={`aktif_${a.kod}`} defaultChecked={a.aktif} />
                          Etkin
                        </label>
                      </td>
                      <td>
                        <label className="onay">
                          <input
                            type="checkbox"
                            name={`goster_${a.kod}`}
                            defaultChecked={a.hepGoster}
                          />
                          Göster
                        </label>
                      </td>
                      <td className="num">
                        <AsamaBinaSayisi kod={a.kod} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="hint" style={{ marginTop: 10 }}>
              Aşama kodları değiştirilemez — mevcut binalar bu kodlara bağlı. Bir aşamayı
              pasife alırsan o aşamadaki binalar panoda görünmez olur.
            </div>
            <div className="form-alt">
              <Gonder etiket="Aşamaları kaydet" sinif="btn" />
            </div>
          </EylemFormu>
        </div>
      </div>

      {/* ---------- hukuki engeller ---------- */}
      <div className="panel">
        <div className="phead">
          <span className="eyebrow">Sözlük</span>
          <h2>Hukuki engel türleri</h2>
        </div>
        <div className="pbody">
          <EylemFormu eylem={engelKaydet}>
            <div className="tw">
              <table>
                <thead>
                  <tr>
                    <th className="num">Sıra</th>
                    <th>Tür adı</th>
                    <th>Kullanımda</th>
                  </tr>
                </thead>
                <tbody>
                  {engeller.map((e) => (
                    <tr key={e.kod}>
                      <td className="num" style={{ width: 80 }}>
                        <input
                          name={`sira_${e.kod}`}
                          type="number"
                          defaultValue={e.sira}
                          style={{ width: 62, textAlign: "right" }}
                        />
                      </td>
                      <td>
                        <input name={`ad_${e.kod}`} defaultValue={e.ad} required />
                        <div className="mono" style={{ fontSize: 11, color: "var(--faint)" }}>
                          {e.kod}
                        </div>
                      </td>
                      <td>
                        <label className="onay">
                          <input type="checkbox" name={`aktif_${e.kod}`} defaultChecked={e.aktif} />
                          Etkin
                        </label>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="form-alt">
              <Gonder etiket="Türleri kaydet" sinif="btn" />
            </div>
          </EylemFormu>

          <div className="ayirici" />

          <EylemFormu eylem={engelEkle}>
            <div className="form-grid" style={{ gridTemplateColumns: "1fr auto", alignItems: "end" }}>
              <div className="field">
                <label htmlFor="ad">Yeni engel türü</label>
                <input id="ad" name="ad" placeholder="ör. Kamulaştırma şerhi" />
              </div>
              <Gonder etiket="Ekle" sinif="btn" />
            </div>
          </EylemFormu>
        </div>
      </div>
    </>
  );
}

async function AsamaBinaSayisi({ kod }: { kod: string }) {
  const sayi = await db.bina.count({ where: { asamaKod: kod } });
  return <span style={{ color: sayi ? "inherit" : "var(--faint)" }}>{sayi}</span>;
}
