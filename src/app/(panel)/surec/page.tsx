import type { Metadata } from "next";
import Link from "next/link";
import { IconLayoutColumns, IconTable } from "@tabler/icons-react";
import { db } from "@/lib/db";
import { oturumGerekli } from "@/lib/oturum";
import {
  ADIM_DURUMU,
  BINA_DURUMLARI,
  RISK_DURUMU,
  SUREC_ADIMLARI,
} from "@/lib/sabitler";
import { onayOzeti, sayi, tarih, yuzde } from "@/lib/yardimcilar";
import { BosDurum, Rozet, SayfaBasligi } from "@/components/ortak";

export const metadata: Metadata = { title: "Süreç Takibi" };
export const dynamic = "force-dynamic";

export default async function SurecSayfasi({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  await oturumGerekli();
  const p = await searchParams;
  const gorunum = p.gorunum === "tablo" ? "tablo" : "pano";
  const durumFiltresi = p.durum ?? "AKTIF";

  const binalar = await db.bina.findMany({
    where: durumFiltresi === "TUMU" ? {} : { durum: durumFiltresi },
    include: {
      hisseler: { select: { hisseOrani: true, onayDurumu: true } },
      danisman: { select: { ad: true } },
      muteahhit: { select: { firmaAdi: true } },
      surecAdimlari: { orderBy: { sira: "asc" } },
    },
    orderBy: { guncellemeTarihi: "desc" },
  });

  const sutunlar = SUREC_ADIMLARI.map((adim) => ({
    adim,
    binalar: binalar.filter((b) => b.asama === adim.deger),
  }));

  const baglanti = (yeni: Record<string, string>) => {
    const q = new URLSearchParams({ gorunum, durum: durumFiltresi, ...yeni });
    return `/surec?${q.toString()}`;
  };

  return (
    <>
      <SayfaBasligi
        ustBaslik="Operasyon"
        baslik="Süreç Takibi"
        aciklama={`${sayi(binalar.length)} dosya · 6306 sayılı Kanun süreç akışı`}
        aksiyonlar={
          <>
            <div className="btn-group">
              <Link href={baglanti({ gorunum: "pano" })} className={`btn${gorunum === "pano" ? " active" : ""}`}>
                <IconLayoutColumns size={18} stroke={1.5} className="me-1" />
                Pano
              </Link>
              <Link href={baglanti({ gorunum: "tablo" })} className={`btn${gorunum === "tablo" ? " active" : ""}`}>
                <IconTable size={18} stroke={1.5} className="me-1" />
                Tablo
              </Link>
            </div>
            <form method="get" className="d-inline-flex gap-2">
              <input type="hidden" name="gorunum" value={gorunum} />
              <select
                name="durum"
                className="form-select"
                defaultValue={durumFiltresi}
                aria-label="Dosya durumu"
                style={{ minWidth: "10rem" }}
              >
                <option value="AKTIF">Aktif dosyalar</option>
                <option value="BEKLEMEDE">Beklemede</option>
                <option value="TAMAMLANDI">Tamamlanan</option>
                <option value="TUMU">Tümü</option>
              </select>
              <button type="submit" className="btn">
                Uygula
              </button>
            </form>
          </>
        }
      />

      <div className="page-body">
        <div className={gorunum === "pano" ? "container-fluid" : "container-xl"}>
          {binalar.length === 0 ? (
            <div className="card">
              <div className="card-body">
                <BosDurum
                  baslik="Bu filtreye uyan dosya yok"
                  aksiyon={
                    <Link href="/surec" className="btn btn-primary">
                      Aktif dosyaları göster
                    </Link>
                  }
                />
              </div>
            </div>
          ) : gorunum === "pano" ? (
            /* --------------------------------------------------------- Pano */
            <div className="overflow-x-auto pb-3">
              <div className="d-flex gap-3" style={{ minWidth: "max-content" }}>
                {sutunlar.map(({ adim, binalar: sutunBinalari }) => (
                  <div key={adim.deger} style={{ width: "18rem", flexShrink: 0 }}>
                    <div className="card h-100">
                      <div className={`card-status-top bg-${adim.renk}`} />
                      <div className="card-header py-2">
                        <div className="flex-fill">
                          <div className="fw-medium small">{adim.etiket}</div>
                          <div className="text-secondary" style={{ fontSize: "0.75rem" }}>
                            {sayi(sutunBinalari.length)} dosya
                          </div>
                        </div>
                      </div>
                      <div className="card-body p-2 d-flex flex-column gap-2">
                        {sutunBinalari.length === 0 ? (
                          <div className="text-secondary small text-center py-3">—</div>
                        ) : (
                          sutunBinalari.map((b) => {
                            const ozet = onayOzeti(b.hisseler);
                            return (
                              <Link
                                key={b.id}
                                href={`/binalar/${b.id}`}
                                className="card card-sm text-reset text-decoration-none"
                              >
                                <div className="card-body p-2">
                                  <div className="fw-medium small text-truncate">{b.baslik}</div>
                                  <div className="text-secondary mb-2" style={{ fontSize: "0.75rem" }}>
                                    {b.kod} · {b.ilce}
                                  </div>

                                  <div className="progress progress-xs mb-1">
                                    <div
                                      className={`progress-bar bg-${ozet.cogunlukSaglandi ? "green" : "yellow"}`}
                                      style={{ width: `${Math.min(100, ozet.olumluOran)}%` }}
                                    />
                                  </div>
                                  <div className="d-flex justify-content-between text-secondary" style={{ fontSize: "0.7rem" }}>
                                    <span>Onay {yuzde(ozet.olumluOran, 0)}</span>
                                    <span>{sayi(ozet.bolumSayisi)} bölüm</span>
                                  </div>

                                  <div className="mt-2 d-flex flex-wrap gap-1">
                                    <Rozet harita={RISK_DURUMU} deger={b.riskDurumu} />
                                    {b.oncelik === "YUKSEK" && <span className="badge bg-red-lt">Yüksek</span>}
                                  </div>

                                  {b.danisman && (
                                    <div className="text-secondary mt-2" style={{ fontSize: "0.7rem" }}>
                                      {b.danisman.ad}
                                    </div>
                                  )}
                                </div>
                              </Link>
                            );
                          })
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            /* -------------------------------------------------------- Tablo */
            <div className="card">
              <div className="table-responsive">
                <table className="table table-vcenter card-table table-hover">
                  <thead>
                    <tr>
                      <th style={{ minWidth: "14rem" }}>Bina</th>
                      {SUREC_ADIMLARI.map((a) => (
                        <th key={a.deger} className="text-center" style={{ writingMode: "vertical-rl", height: "9rem" }}>
                          <span style={{ transform: "rotate(180deg)", display: "inline-block", fontWeight: 500 }}>
                            {a.etiket}
                          </span>
                        </th>
                      ))}
                      <th>Güncelleme</th>
                    </tr>
                  </thead>
                  <tbody>
                    {binalar.map((b) => (
                      <tr key={b.id}>
                        <td>
                          <Link href={`/binalar/${b.id}`} className="text-reset d-block fw-medium">
                            {b.baslik}
                          </Link>
                          <div className="text-secondary small">
                            {b.kod} · {b.ilce}
                          </div>
                        </td>
                        {SUREC_ADIMLARI.map((a) => {
                          const adim = b.surecAdimlari.find((s) => s.adim === a.deger);
                          const durum = adim?.durum ?? "BEKLIYOR";
                          const renk = ADIM_DURUMU[durum]?.renk ?? "secondary";
                          return (
                            <td key={a.deger} className="text-center" title={`${a.etiket}: ${ADIM_DURUMU[durum]?.etiket}`}>
                              <span
                                className={`d-inline-block rounded-circle bg-${durum === "BEKLIYOR" ? "secondary-lt" : renk}`}
                                style={{ width: "0.85rem", height: "0.85rem" }}
                              />
                            </td>
                          );
                        })}
                        <td className="text-secondary small">{tarih(b.guncellemeTarihi)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="card-footer d-flex flex-wrap gap-3 align-items-center">
                <span className="text-secondary small">Gösterge:</span>
                {Object.values(ADIM_DURUMU).map((d) => (
                  <span key={d.deger} className="d-inline-flex align-items-center gap-1 small text-secondary">
                    <span
                      className={`d-inline-block rounded-circle bg-${d.deger === "BEKLIYOR" ? "secondary-lt" : d.renk}`}
                      style={{ width: "0.75rem", height: "0.75rem" }}
                    />
                    {d.etiket}
                  </span>
                ))}
                <span className="text-secondary small ms-auto">
                  Durum filtresi: {BINA_DURUMLARI.find((d) => d.deger === durumFiltresi)?.etiket ?? "Tümü"}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
