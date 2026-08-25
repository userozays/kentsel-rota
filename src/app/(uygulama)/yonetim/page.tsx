import Link from "next/link";
import { oturumGerekli } from "@/lib/auth";
import { ayarlariOku, asamalariOku } from "@/lib/ayarlar";
import { binalariGetir } from "@/lib/veri";
import { db } from "@/lib/db";
import { emsalAlani } from "@/lib/hesap";
import { dayanakVar } from "@/lib/sabitler";
import { tl, yuzde, tarihSaat } from "@/lib/bicim";
import { PayScridi } from "@/components/PayScridi";

export const metadata = { title: "Portföy raporu — Kentsel Rota" };

export default async function PortfoySayfasi() {
  const kullanici = await oturumGerekli();
  const ayarlar = await ayarlariOku();

  const [binalar, asamalar, muteahhitler, kullanicilar, sonGirisler] = await Promise.all([
    binalariGetir(kullanici, ayarlar.esikYuzde),
    asamalariOku(),
    db.muteahhit.findMany(),
    db.kullanici.count({ where: { aktif: true } }),
    db.kullanici.findMany({
      where: { aktif: true, sonGiris: { not: null } },
      orderBy: { sonGiris: "desc" },
      take: 5,
      select: { ad: true, rol: true, sonGiris: true },
    }),
  ]);

  /* ---------- toplamlar ---------- */
  const toplamBB = binalar.reduce((a, b) => a + b.malikler.length, 0);
  const toplamArsa = binalar.reduce((a, b) => a + b.arsaM2, 0);
  const toplamEmsal = binalar.reduce((a, b) => a + emsalAlani(b.arsaM2, b.emsal), 0);
  const cogunlukVar = binalar.filter((b) => b.ozet.gecti);

  /* ---------- portföy geneli tavır dağılımı (arsa payı ağırlıklı) ---------- */
  const payToplam = binalar.reduce(
    (a, b) => {
      const o = b.ozet;
      a.olumlu += o.payda ? o.olumlu / o.payda : 0;
      a.kararsiz += o.payda ? o.kararsiz / o.payda : 0;
      a.ulasilamadi += o.payda ? o.ulasilamadi / o.payda : 0;
      a.olumsuz += o.payda ? o.olumsuz / o.payda : 0;
      return a;
    },
    { olumlu: 0, kararsiz: 0, ulasilamadi: 0, olumsuz: 0 },
  );
  const binaSayisi = binalar.length || 1;
  const ortalamaOlumlu = (payToplam.olumlu / binaSayisi) * 100;

  /* ---------- risk listeleri ---------- */
  // Kararsız + ulaşılamayanların TAMAMI olumluya dönse bile eşiği geçemeyen binalar
  const matematikselTikali = binalar.filter((b) => !b.ozet.gecti && !b.ozet.hedefYeter);
  const dayanaksiz = binalar.filter((b) => !dayanakVar(b.riskli));
  const payEksik = binalar.filter((b) => Math.abs(b.ozet.payda - b.ozet.girilen) > 0.001);
  const taahhutsuz = muteahhitler.filter((c) => !c.taahhut && c.durum !== "kara");

  /* ---------- huni ---------- */
  const huni = asamalar
    .filter((a) => a.aktif)
    .map((a) => ({ ad: a.ad, sayi: binalar.filter((b) => b.asamaKod === a.kod).length }));
  const huniEnBuyuk = Math.max(1, ...huni.map((h) => h.sayi));

  /* ---------- ilerleme sıralaması ---------- */
  const ilerleme = binalar.slice().sort((a, b) => b.ozet.oran - a.ozet.oran);

  return (
    <>
      <div className="head">
        <div>
          <h1>Portföy raporu</h1>
          <div className="sub">
            Tüm binaların birleşik görünümü. Sayılar bu ekranda <b>arsa payı</b> üzerinden
            hesaplanır; kişi sayısı ikincil göstergedir.
          </div>
        </div>
      </div>

      {/* ---------- üst göstergeler ---------- */}
      <div className="grid3" style={{ marginBottom: 18 }}>
        <div className="stat">
          <span className="k">Portföy</span>
          <span className="v">{binalar.length}</span>
          <span className="n">bina · {toplamBB} bağımsız bölüm</span>
        </div>
        <div className="stat">
          <span className="k">Çoğunluk sağlanan</span>
          <span className="v" style={{ color: "var(--ok)" }}>
            {cogunlukVar.length}
          </span>
          <span className="n">
            %{yuzde(binalar.length ? (cogunlukVar.length / binalar.length) * 100 : 0)} · eşik %
            {ayarlar.esikYuzde}
          </span>
        </div>
        <div className="stat">
          <span className="k">Ortalama olumlu pay</span>
          <span className="v">%{yuzde(ortalamaOlumlu)}</span>
          <span className="n">bina başına arsa payı ortalaması</span>
        </div>
        <div className="stat">
          <span className="k">Toplam emsal alanı</span>
          <span className="v">{tl(Math.round(toplamEmsal))}</span>
          <span className="n">m² · {tl(Math.round(toplamArsa))} m² arsa</span>
        </div>
        <div className="stat">
          <span className="k">Müteahhit havuzu</span>
          <span className="v">{muteahhitler.length}</span>
          <span className="n">{muteahhitler.filter((c) => c.taahhut).length} taahhütlü</span>
        </div>
        <div className="stat">
          <span className="k">Etkin kullanıcı</span>
          <span className="v">{kullanicilar}</span>
          <span className="n">sisteme erişimi olan kişi</span>
        </div>
      </div>

      {/* ---------- müdahale gereken ---------- */}
      {(matematikselTikali.length > 0 ||
        dayanaksiz.length > 0 ||
        payEksik.length > 0 ||
        taahhutsuz.length > 0) && (
        <div className="panel">
          <div className="phead">
            <span className="eyebrow">Öncelik</span>
            <h2>Müdahale gereken başlıklar</h2>
          </div>
          <div className="pbody" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {matematikselTikali.length > 0 && (
              <div className="callout bad">
                <b>{matematikselTikali.length} binada eşik matematiksel olarak kapalı.</b> Kararsız
                ve ulaşılamayan maliklerin tamamı olumluya dönse bile çoğunluk sağlanmıyor —
                olumsuz görüş bildirenlerden pay kazanılması şart:{" "}
                {matematikselTikali.map((b, i) => (
                  <span key={b.id}>
                    {i > 0 && ", "}
                    <Link href={`/bina/${b.id}`}>{b.ad}</Link> (
                    {tl(b.ozet.olumsuzdanGerekli)} pay)
                  </span>
                ))}
              </div>
            )}
            {dayanaksiz.length > 0 && (
              <div className="callout warn">
                <b>{dayanaksiz.length} binada riskli yapı raporu onaylanmamış.</b> Bu binalarda
                çoğunluk mimarisinin hukuki dayanağı yok:{" "}
                {dayanaksiz.map((b, i) => (
                  <span key={b.id}>
                    {i > 0 && ", "}
                    <Link href={`/bina/${b.id}`}>{b.ad}</Link>
                  </span>
                ))}
              </div>
            )}
            {payEksik.length > 0 && (
              <div className="callout warn">
                <b>{payEksik.length} binada pay toplamı paydayla örtüşmüyor.</b> Girilmemiş pay,
                çoğunluk oranını olduğundan düşük gösterir:{" "}
                {payEksik.map((b, i) => (
                  <span key={b.id}>
                    {i > 0 && ", "}
                    <Link href={`/bina/${b.id}`}>{b.ad}</Link> (
                    {tl(b.ozet.payda - b.ozet.girilen)} pay)
                  </span>
                ))}
              </div>
            )}
            {taahhutsuz.length > 0 && (
              <div className="callout warn">
                <b>{taahhutsuz.length} yüklenicide devre dışı bırakmama taahhüdü yok.</b>{" "}
                <Link href="/muteahhitler">Havuzu aç</Link> ve tam dosya paylaşmadan önce imzalat.
              </div>
            )}
          </div>
        </div>
      )}

      {/* ---------- huni + tavır ---------- */}
      <div className="grid2" style={{ alignItems: "start", gap: 16 }}>
        <div className="panel">
          <div className="phead">
            <span className="eyebrow">Süreç</span>
            <h2>Aşama hunisi</h2>
          </div>
          <div className="pbody">
            {binalar.length === 0 ? (
              <div style={{ color: "var(--muted)", fontSize: 13 }}>Henüz bina yok.</div>
            ) : (
              <div className="huni">
                {huni.map((h) => (
                  <div className="huni-satir" key={h.ad}>
                    <span className="ad">{h.ad}</span>
                    <span className="huni-cubuk">
                      <i style={{ width: `${(h.sayi / huniEnBuyuk) * 100}%` }} />
                    </span>
                    <span className="sy">{h.sayi}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="panel">
          <div className="phead">
            <span className="eyebrow">Saha</span>
            <h2>Son giriş yapanlar</h2>
          </div>
          <div className="pbody flush">
            <div className="tw">
              <table>
                <thead>
                  <tr>
                    <th>Kullanıcı</th>
                    <th>Rol</th>
                    <th>Son giriş</th>
                  </tr>
                </thead>
                <tbody>
                  {sonGirisler.length === 0 ? (
                    <tr>
                      <td colSpan={3} style={{ color: "var(--muted)" }}>
                        Henüz giriş kaydı yok.
                      </td>
                    </tr>
                  ) : (
                    sonGirisler.map((k) => (
                      <tr key={k.ad + String(k.sonGiris)}>
                        <td style={{ fontWeight: 500 }}>{k.ad}</td>
                        <td>
                          <span className={`rozet ${k.rol}`}>{k.rol}</span>
                        </td>
                        <td style={{ color: "var(--muted)" }}>{tarihSaat(k.sonGiris)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            <div
              style={{
                padding: "11px 16px",
                borderTop: "1px solid var(--border)",
                fontSize: 11.5,
                color: "var(--faint)",
              }}
            >
              Ayrıntılı işlem geçmişi (kim neyi ne zaman değiştirdi) henüz tutulmuyor — bkz.
              README, sonraki adımlar.
            </div>
          </div>
        </div>
      </div>

      {/* ---------- bina bazında ilerleme ---------- */}
      <div className="panel" style={{ marginTop: 16 }}>
        <div className="phead">
          <span className="eyebrow">Çoğunluk</span>
          <h2>Bina bazında ilerleme</h2>
        </div>
        <div className="pbody flush">
          <div className="tw">
            <table>
              <thead>
                <tr>
                  <th>Bina</th>
                  <th style={{ minWidth: 220 }}>Pay dağılımı</th>
                  <th className="num">Olumlu pay</th>
                  <th className="num">Oran</th>
                  <th>Durum</th>
                  <th>Aşama</th>
                </tr>
              </thead>
              <tbody>
                {ilerleme.length === 0 ? (
                  <tr>
                    <td colSpan={6}>
                      <div className="empty">
                        <h3>Portföy boş</h3>
                        <p>Bina eklendikçe bu rapor dolar.</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  ilerleme.map((b) => (
                    <tr key={b.id}>
                      <td>
                        <Link
                          href={`/bina/${b.id}`}
                          style={{ fontWeight: 500, textDecoration: "none", color: "inherit" }}
                        >
                          {b.ad}
                        </Link>
                        <div style={{ fontSize: 11.5, color: "var(--faint)" }}>
                          {b.ilce} · {b.malikler.length} BB
                        </div>
                      </td>
                      <td style={{ minWidth: 220 }}>
                        <PayScridi
                          malikler={b.malikler}
                          ozet={b.ozet}
                          boy="sm"
                          esikYuzde={ayarlar.esikYuzde}
                        />
                      </td>
                      <td className="num">
                        {tl(b.ozet.olumlu)}
                        <div style={{ fontSize: 11, color: "var(--faint)" }}>
                          / {tl(b.ozet.payda)}
                        </div>
                      </td>
                      <td className="num" style={{ fontWeight: 600 }}>
                        %{yuzde(b.ozet.oran)}
                      </td>
                      <td>
                        <span className={`verdict ${b.ozet.gecti ? "pass" : "fail"}`}>
                          {b.ozet.gecti
                            ? "✓ Çoğunluk"
                            : b.ozet.hedefYeter
                              ? `${b.ozet.hedef.length} malik kaldı`
                              : "Eşik kapalı"}
                        </span>
                      </td>
                      <td style={{ fontSize: 12.5, color: "var(--muted)" }}>
                        {asamalar.find((a) => a.kod === b.asamaKod)?.ad ?? "—"}
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
