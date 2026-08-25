import Link from "next/link";
import { oturumGerekli } from "@/lib/auth";
import { ayarlariOku, asamalariOku } from "@/lib/ayarlar";
import { yetkiVar } from "@/lib/roller";
import { binalariGetir, type BinaOzetli } from "@/lib/veri";
import { PayScridi, Okuma, Efsane } from "@/components/PayScridi";
import { RISKLI_AD, dayanakVar } from "@/lib/sabitler";
import { tl, yuzde } from "@/lib/bicim";

export const metadata = { title: "Panel — Kentsel Rota" };

/** Bina adından iki harflik kısaltma — liste satırlarındaki küçük etikette kullanılır. */
function kisalt(ad: string) {
  const p = ad.split(/[^\p{L}\p{N}]+/u).filter(Boolean);
  const h = p.length > 1 ? (p[0][0] ?? "") + (p[1][0] ?? "") : (p[0] ?? ad).slice(0, 2);
  return h.toLocaleUpperCase("tr-TR");
}

function Kart({ b, esikYuzde }: { b: BinaOzetli; esikYuzde: number }) {
  const o = b.ozet;
  const eksikGiris = o.payda > o.girilen + 0.001;

  return (
    <Link href={`/bina/${b.id}`} className="card" style={{ textDecoration: "none", color: "inherit" }}>
      <div className="top">
        <h3>{b.ad}</h3>
        <span className="loc">
          {b.ada || "—"}/{b.parsel || "—"}
        </span>
      </div>
      <div className="meta">
        <span>
          {b.ilce}
          {b.mahalle ? ` · ${b.mahalle}` : ""}
        </span>
        <span>
          <b>{tl(b.arsaM2)}</b> m²
        </span>
        <span>
          E: <b>{tl(b.emsal)}</b>
        </span>
      </div>
      <PayScridi malikler={b.malikler} ozet={o} esikYuzde={esikYuzde} />
      <Okuma ozet={o} />
      <div className="meta">
        <span className={`pill ${dayanakVar(b.riskli) ? "acc" : "neutral"}`}>
          {RISKLI_AD[b.riskli] ?? "—"}
        </span>
        {o.engelliSayisi > 0 && <span className="pill warnflag">{o.engelliSayisi} hukuki engel</span>}
        {eksikGiris && <span className="pill warnflag">Pay toplamı eksik</span>}
        {b._count.teklifler > 0 && <span className="pill neutral">{b._count.teklifler} teklif</span>}
      </div>
    </Link>
  );
}

/**
 * Grafik ekseninde aşama adı iki satıra sığmalı — bağlaçlar atılır, uzun kelimeler
 * kısaltılır. Tam ad her zaman sütunun title'ında durur.
 */
function kisaEtiket(ad: string) {
  const kelimeler = ad.split(/\s+/).filter((k) => /\p{L}/u.test(k));
  const secilen: string[] = [];
  let uzunluk = 0;
  for (const k of kelimeler) {
    const t = k.length > 8 ? k.slice(0, 7) + "…" : k;
    if (secilen.length && uzunluk + t.length > 16) return secilen.join(" ") + "…";
    secilen.push(t);
    uzunluk += t.length;
  }
  return secilen.join(" ") || ad;
}

/** Kapsül sütun grafik — aşamalara dağılmış bina sayısı. */
function Grafik({ veri }: { veri: { ad: string; n: number }[] }) {
  const enCok = Math.max(1, ...veri.map((v) => v.n));
  const tavan = Math.max(2, Math.ceil(enCok / 2) * 2);
  const cizgiler = [tavan, tavan / 2, 0];

  return (
    <div className="grafik">
      <div className="eksen">
        {cizgiler.map((c, i) => (
          <span key={i}>{c}</span>
        ))}
      </div>
      <div className="sutunlar">
        {veri.map((v) => (
          <div className="sutun" key={v.ad}>
            <div className="iz" title={`${v.ad}: ${v.n} bina`}>
              <div className="dolgu" style={{ height: `${(v.n / tavan) * 100}%` }} />
            </div>
            <span className="etiket" title={v.ad}>
              {kisaEtiket(v.ad)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

/** Oran satırı — bina adı + degrade dolgulu çubuk + yüzde okuması. */
function OranSatir({ b, tur }: { b: BinaOzetli; tur: "iyi" | "kotu" }) {
  return (
    <Link href={`/bina/${b.id}`} className="oransatir">
      <span className="tn">{kisalt(b.ad)}</span>
      <span className="gv">
        <b>{b.ad}</b>
        <span className={`cubuk ${tur}`}>
          <i style={{ width: `${Math.max(2, Math.min(100, b.ozet.oran))}%` }} />
        </span>
      </span>
      <span className="sag">
        <b>%{yuzde(b.ozet.oran, 0)}</b> arsa payı
      </span>
    </Link>
  );
}

export default async function PanelSayfasi() {
  const kullanici = await oturumGerekli();
  const ayarlar = await ayarlariOku();
  const [binalar, asamalar] = await Promise.all([
    binalariGetir(kullanici, ayarlar.esikYuzde),
    asamalariOku(),
  ]);

  const yazabilir = yetkiVar(kullanici.rol, "binaYaz");
  const toplamBB = binalar.reduce((a, b) => a + b.malikler.length, 0);
  const gecen = binalar.filter((b) => b.ozet.gecti).length;
  const engelli = binalar.reduce((a, b) => a + b.ozet.engelliSayisi, 0);
  const dayanaksiz = binalar.filter((b) => !dayanakVar(b.riskli)).length;

  const sutunlar = asamalar
    .filter((a) => a.aktif)
    .map((a) => ({ asama: a, binalar: binalar.filter((b) => b.asamaKod === a.kod) }))
    .filter((s) => s.binalar.length > 0 || s.asama.hepGoster);

  const aktifAsamalar = asamalar.filter((a) => a.aktif);
  const dagilim = aktifAsamalar.map((a) => ({
    ad: a.ad,
    n: binalar.filter((b) => b.asamaKod === a.kod).length,
  }));

  const oranaGore = binalar.slice().sort((a, b) => b.ozet.oran - a.ozet.oran);
  /** Portföy küçükken iki listeye bölmek anlamsız — hepsi tek listede gösterilir. */
  const bolunmus = binalar.length >= 6;
  const enYuksek = bolunmus ? oranaGore.slice(0, 4) : oranaGore.slice(0, 8);
  const enGeride = bolunmus ? oranaGore.slice(-4).reverse() : [];

  /** Eşiği geçmemiş, hukuki engeli ya da eksik verisi olan binalar — önce en riskli. */
  const dikkat = binalar
    .map((b) => {
      const notlar: string[] = [];
      if (b.ozet.engelliSayisi > 0) notlar.push(`${b.ozet.engelliSayisi} hukuki engel`);
      if (b.ozet.payda > b.ozet.girilen + 0.001) notlar.push("pay toplamı eksik");
      if (!dayanakVar(b.riskli)) notlar.push("riskli yapı dayanağı yok");
      if (!b.ozet.gecti && !b.ozet.hedefYeter) notlar.push("mevcut adaylarla eşik geçilmiyor");
      return { b, notlar };
    })
    .filter((d) => d.notlar.length > 0)
    .sort((x, y) => y.notlar.length - x.notlar.length || x.b.ozet.oran - y.b.ozet.oran)
    .slice(0, 5);

  return (
    <>
      <div className="head">
        <div>
          <h1>Proje Panosu</h1>
          <div className="sub">
            Her bina bir kart. Şerit, bağımsız bölümlerin <b>arsa payı</b> ağırlığını gösterir —
            kesikli çizgi %{ayarlar.esikYuzde} eşiği. Karar bu çizgiye göre verilir, kişi sayısına
            göre değil.
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

      <div className="filtreler">
        <div className="filtre">
          <span className="k">Çoğunluk eşiği:</span>
          <span className="v">%{ayarlar.esikYuzde}</span>
          <span className="ux">arsa payı</span>
        </div>
        <div className="filtre">
          <span className="k">Portföy:</span>
          <span className="v">{binalar.length} bina</span>
          <span className="ux">{toplamBB} bağımsız bölüm</span>
        </div>
        <div className="filtre">
          <span className="k">Aşama:</span>
          <span className="v">{aktifAsamalar.length} aktif</span>
          <span className="ux">{sutunlar.length} sütun</span>
        </div>
      </div>

      <div className="ikili">
        <div className="grid3">
          <div className="stat">
            <span className="k">Takipteki bina</span>
            <span className="v">
              {binalar.length}
              {toplamBB > 0 && <em> / {toplamBB} BB</em>}
            </span>
            {binalar.length >= 5 ? (
              <div className="kivilcim" aria-hidden="true">
                {oranaGore.slice(0, 14).map((b) => (
                  <i
                    key={b.id}
                    className={b.ozet.gecti ? "on" : undefined}
                    style={{ height: `${Math.max(12, Math.min(100, b.ozet.oran))}%` }}
                  />
                ))}
              </div>
            ) : (
              <span className="n">tapudaki toplam bağımsız bölüm</span>
            )}
          </div>
          <div className="stat">
            <span className="k">Çoğunluk sağlanan</span>
            <span className="v">
              {gecen}
              <em> / {binalar.length}</em>
            </span>
            <span className="n">arsa payı &gt; %{ayarlar.esikYuzde}</span>
          </div>
          <div className="stat">
            <span className="k">Hukuki engelli malik</span>
            <span className="v">{engelli}</span>
            <span className="n" style={engelli ? { color: "var(--warn)" } : undefined}>
              ipotek · intikal · vesayet
            </span>
          </div>
          <div className="stat">
            <span className="k">Riskli yapı dayanağı yok</span>
            <span className="v">{dayanaksiz}</span>
            <span className="n" style={dayanaksiz ? { color: "var(--warn)" } : undefined}>
              bina · rapor onaylanmamış
            </span>
          </div>
        </div>

        <div className="panel">
          <div className="phead">
            <h2>Aşama dağılımı</h2>
            <div className="acts">
              <span className="eyebrow">bina sayısı</span>
            </div>
          </div>
          <div className="pbody">
            {dagilim.length ? (
              <Grafik veri={dagilim} />
            ) : (
              <div className="empty">
                <p>Tanımlı aktif aşama yok.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {binalar.length > 0 && (
        <div className={bolunmus ? "ikili" : undefined} style={bolunmus ? undefined : { marginBottom: 14 }}>
          <div className="panel">
            <div className="phead">
              <h2>{bolunmus ? "Çoğunluğa en yakın binalar" : "Çoğunluk durumu"}</h2>
              <div className="acts">
                <span className="eyebrow">olumlu arsa payı</span>
              </div>
            </div>
            <div className="pbody">
              <div className="oranliste">
                {enYuksek.map((b) => (
                  <OranSatir key={b.id} b={b} tur={b.ozet.gecti ? "iyi" : "kotu"} />
                ))}
              </div>
            </div>
          </div>

          {bolunmus && (
            <div className="panel">
              <div className="phead">
                <h2>En geride kalan binalar</h2>
                <div className="acts">
                  <span className="eyebrow">olumlu arsa payı</span>
                </div>
              </div>
              <div className="pbody">
                <div className="oranliste">
                  {enGeride.map((b) => (
                    <OranSatir key={b.id} b={b} tur="kotu" />
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {dikkat.length > 0 && (
        <div className="panel" style={{ marginBottom: 14 }}>
          <div className="phead">
            <h2>Dikkat gerektirenler</h2>
            <div className="acts">
              <span className="eyebrow">{dikkat.length} bina</span>
            </div>
          </div>
          <div className="pbody">
            <div className="lider">
              {dikkat.map((d, i) => (
                <Link key={d.b.id} href={`/bina/${d.b.id}`} className="lidersatir">
                  <span className="kim">
                    <b>{d.b.ad}</b>
                    <span>{d.notlar.join(" · ")}</span>
                  </span>
                  <span className="sira">{i + 1}</span>
                  <span className={`tri ${d.b.ozet.gecti ? "up" : "down"}`} aria-hidden="true">
                    {d.b.ozet.gecti ? "▲" : "▼"}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}

      {binalar.length === 0 ? (
        <div className="panel">
          <div className="empty">
            <h3>Henüz bina yok</h3>
            <p>
              {yazabilir
                ? "İlk binayı ekleyerek başla: ada/parsel, arsa alanı, emsal ve tapudaki toplam arsa payı (payda)."
                : "Sana atanmış bina bulunmuyor. Yöneticinden erişim iste."}
            </p>
            {yazabilir && (
              <Link href="/bina/yeni" className="btn pri">
                + Bina ekle
              </Link>
            )}
          </div>
        </div>
      ) : (
        <>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 16,
              flexWrap: "wrap",
              margin: "22px 0 12px",
            }}
          >
            <h2 style={{ fontSize: 14, fontWeight: 700 }}>Aşamalara göre binalar</h2>
            <Efsane />
          </div>
          <div className="board">
            {sutunlar.map(({ asama, binalar: bs }) => (
              <div className="col" key={asama.kod}>
                <div className="colhead">
                  <span>{asama.ad}</span>
                  <span className="n">{bs.length}</span>
                  <span className="bar" />
                </div>
                <div className="stack">
                  {bs.length ? (
                    bs.map((b) => <Kart key={b.id} b={b} esikYuzde={ayarlar.esikYuzde} />)
                  ) : (
                    <div
                      className="card"
                      style={{
                        cursor: "default",
                        borderStyle: "dashed",
                        borderColor: "var(--border-strong)",
                        boxShadow: "none",
                        color: "var(--faint)",
                        fontSize: 12,
                        alignItems: "center",
                        justifyContent: "center",
                        minHeight: 70,
                      }}
                    >
                      Bu aşamada bina yok
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      <div className="foot">
        Çoğunluk hesabı <b>arsa payı</b> üzerinden yapılır (6306 s. Kanun, salt çoğunluk). Bu sistem
        bir takip aracıdır; hukuki dayanak için güncel mevzuatı ve tapu kayıtlarını esas al.
      </div>
    </>
  );
}
