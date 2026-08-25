import Link from "next/link";
import {
  IconAlertTriangle,
  IconBuildingCommunity,
  IconCircleCheck,
  IconUsers,
} from "@tabler/icons-react";
import { db } from "@/lib/db";
import { oturumGerekli } from "@/lib/oturum";
import {
  AKTIVITE_TURU,
  BINA_DURUMU,
  MUTEAHHIT_DURUMU,
  SUREC_ADIMI,
  SUREC_ADIMLARI,
  asamaYuzdesi,
} from "@/lib/sabitler";
import { goreceli, onayOzeti, sayi, yuzde } from "@/lib/yardimcilar";
import {
  Avatar,
  BosDurum,
  IstatistikKart,
  OnayCubugu,
  Rozet,
  SayfaBasligi,
  YildizPuan,
} from "@/components/ortak";

export const dynamic = "force-dynamic";

export default async function PanelAnasayfa() {
  const oturum = await oturumGerekli();

  const [binalar, aktiviteler, muteahhitler, malikSayisi] = await Promise.all([
    db.bina.findMany({
      include: {
        hisseler: { select: { hisseOrani: true, onayDurumu: true } },
        muteahhit: { select: { id: true, firmaAdi: true } },
        danisman: { select: { ad: true } },
      },
      orderBy: { guncellemeTarihi: "desc" },
    }),
    db.aktivite.findMany({
      take: 8,
      orderBy: { tarih: "desc" },
      include: {
        kullanici: { select: { ad: true } },
        bina: { select: { id: true, kod: true, baslik: true } },
        muteahhit: { select: { id: true, firmaAdi: true } },
        malik: { select: { id: true, adSoyad: true } },
      },
    }),
    db.muteahhit.findMany({
      orderBy: [{ durum: "asc" }, { tamamlananProje: "desc" }],
      take: 5,
      include: { _count: { select: { binalar: true } } },
    }),
    db.malik.count(),
  ]);

  const aktifBinalar = binalar.filter((b) => b.durum === "AKTIF");
  const riskliBinalar = binalar.filter((b) => b.riskDurumu === "RISKLI");

  const ozetler = binalar.map((b) => ({ bina: b, ozet: onayOzeti(b.hisseler) }));
  const cogunlukSaglanan = ozetler.filter((o) => o.ozet.cogunlukSaglandi && o.bina.durum !== "IPTAL");

  // Çoğunluğa en yakın ama henüz eşiği geçmemiş dosyalar
  const esigeYakin = ozetler
    .filter((o) => !o.ozet.cogunlukSaglandi && o.bina.durum === "AKTIF")
    .sort((a, b) => b.ozet.olumluOran - a.ozet.olumluOran)
    .slice(0, 5);

  // Aşama dağılımı
  const asamaDagilimi = SUREC_ADIMLARI.map((a) => ({
    adim: a,
    adet: aktifBinalar.filter((b) => b.asama === a.deger).length,
  })).filter((x) => x.adet > 0);
  const enBuyukAdet = Math.max(1, ...asamaDagilimi.map((a) => a.adet));

  const ulasilamayanToplam = ozetler.reduce((t, o) => t + o.ozet.ulasilamayanAdet, 0);

  const ilkAd = oturum.ad.split(" ")[0];

  return (
    <>
      <SayfaBasligi
        ustBaslik="Genel Bakış"
        baslik={`Merhaba ${ilkAd}`}
        aciklama={`${sayi(aktifBinalar.length)} aktif dosya takip ediliyor.`}
        aksiyonlar={
          <>
            <Link href="/binalar?yeni=1" className="btn btn-primary">
              Yeni Bina Dosyası
            </Link>
            <Link href="/takvim" className="btn">
              İş Takvimi
            </Link>
          </>
        }
      />

      <div className="page-body">
        <div className="container-xl">
          {/* ------------------------------------------------- Özet kartları */}
          <div className="row row-deck row-cards mb-3">
            <div className="col-sm-6 col-lg-3">
              <IstatistikKart
                baslik="Aktif bina dosyası"
                deger={sayi(aktifBinalar.length)}
                altBilgi={`Toplam ${sayi(binalar.length)} dosya`}
                renk="primary"
                ikon={<IconBuildingCommunity size={24} stroke={1.5} />}
                href="/binalar?durum=AKTIF"
              />
            </div>
            <div className="col-sm-6 col-lg-3">
              <IstatistikKart
                baslik="Riskli yapı tescilli"
                deger={sayi(riskliBinalar.length)}
                altBilgi={`${sayi(binalar.filter((b) => b.riskDurumu === "BASVURU_YAPILDI").length)} dosya tespit aşamasında`}
                renk="red"
                ikon={<IconAlertTriangle size={24} stroke={1.5} />}
                href="/binalar?risk=RISKLI"
              />
            </div>
            <div className="col-sm-6 col-lg-3">
              <IstatistikKart
                baslik="Çoğunluğu sağlanan"
                deger={sayi(cogunlukSaglanan.length)}
                altBilgi={`Arsa payı eşiği %${ozetler[0]?.ozet.esik ?? 50}`}
                renk="green"
                ikon={<IconCircleCheck size={24} stroke={1.5} />}
              />
            </div>
            <div className="col-sm-6 col-lg-3">
              <IstatistikKart
                baslik="Kayıtlı malik"
                deger={sayi(malikSayisi)}
                altBilgi={ulasilamayanToplam > 0 ? `${sayi(ulasilamayanToplam)} malike ulaşılamadı` : "Tümüne ulaşıldı"}
                renk="azure"
                ikon={<IconUsers size={24} stroke={1.5} />}
                href="/malikler"
              />
            </div>
          </div>

          <div className="row row-cards">
            {/* --------------------------------------- Çoğunluğa yakın dosyalar */}
            <div className="col-lg-7">
              <div className="card mb-3">
                <div className="card-header">
                  <h3 className="card-title">Çoğunluğa en yakın dosyalar</h3>
                  <div className="card-actions">
                    <Link href="/binalar" className="btn btn-sm">
                      Tümü
                    </Link>
                  </div>
                </div>
                <div className="card-body">
                  {esigeYakin.length === 0 ? (
                    <BosDurum
                      baslik="Eşiğin altında aktif dosya yok"
                      aciklama="Takip edilen tüm aktif dosyalarda çoğunluk sağlanmış görünüyor."
                    />
                  ) : (
                    <div className="d-flex flex-column gap-3">
                      {esigeYakin.map(({ bina, ozet }) => (
                        <div key={bina.id}>
                          <div className="d-flex align-items-baseline justify-content-between mb-1">
                            <Link href={`/binalar/${bina.id}`} className="text-reset fw-medium text-truncate">
                              {bina.baslik}
                            </Link>
                            <span className="text-secondary small ms-2 flex-shrink-0">
                              {bina.ilce} · {sayi(ozet.bolumSayisi)} bölüm
                            </span>
                          </div>
                          <OnayCubugu ozet={ozet} />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* --------------------------------------------- Aşama dağılımı */}
              <div className="card">
                <div className="card-header">
                  <h3 className="card-title">Aktif dosyaların aşama dağılımı</h3>
                </div>
                <div className="card-body">
                  {asamaDagilimi.length === 0 ? (
                    <BosDurum baslik="Aktif dosya bulunmuyor" />
                  ) : (
                    <div className="d-flex flex-column gap-2">
                      {asamaDagilimi.map(({ adim, adet }) => (
                        <div key={adim.deger} className="row align-items-center g-2">
                          <div className="col-5 col-md-4 text-truncate small">{adim.etiket}</div>
                          <div className="col">
                            <div className="progress progress-sm">
                              <div
                                className={`progress-bar bg-${adim.renk}`}
                                style={{ width: `${(adet / enBuyukAdet) * 100}%` }}
                                role="progressbar"
                                aria-valuenow={adet}
                                aria-valuemin={0}
                                aria-valuemax={enBuyukAdet}
                              />
                            </div>
                          </div>
                          <div className="col-auto text-secondary small" style={{ minWidth: "2.5rem" }}>
                            {sayi(adet)}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* --------------------------------------------------- Sağ kolon */}
            <div className="col-lg-5">
              <div className="card mb-3">
                <div className="card-header">
                  <h3 className="card-title">Müteahhit portföyü</h3>
                  <div className="card-actions">
                    <Link href="/muteahhitler" className="btn btn-sm">
                      Tümü
                    </Link>
                  </div>
                </div>
                <div className="list-group list-group-flush">
                  {muteahhitler.map((m) => (
                    <Link key={m.id} href={`/muteahhitler/${m.id}`} className="list-group-item list-group-item-action">
                      <div className="row align-items-center g-2">
                        <div className="col-auto">
                          <Avatar ad={m.firmaAdi} anahtar={m.kod} boyut="sm" />
                        </div>
                        <div className="col text-truncate">
                          <div className="text-reset d-block text-truncate">{m.firmaAdi}</div>
                          <div className="text-secondary text-truncate small">
                            {sayi(m.tamamlananProje)} tamamlanan · {sayi(m._count.binalar)} dosyamızda
                          </div>
                        </div>
                        <div className="col-auto text-end">
                          <YildizPuan puan={m.puan} />
                          <div className="mt-1">
                            <Rozet harita={MUTEAHHIT_DURUMU} deger={m.durum} />
                          </div>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>

              <div className="card">
                <div className="card-header">
                  <h3 className="card-title">Son hareketler</h3>
                  <div className="card-actions">
                    <Link href="/aktiviteler" className="btn btn-sm">
                      Tümü
                    </Link>
                  </div>
                </div>
                <div className="card-body">
                  {aktiviteler.length === 0 ? (
                    <BosDurum baslik="Henüz hareket kaydı yok" />
                  ) : (
                    <div className="divide-y">
                      {aktiviteler.map((a) => (
                        <div key={a.id} className="py-2">
                          <div className="row align-items-start g-2">
                            <div className="col-auto">
                              <Avatar ad={a.kullanici.ad} boyut="sm" />
                            </div>
                            <div className="col text-truncate">
                              <div className="text-truncate">{a.baslik}</div>
                              <div className="text-secondary small text-truncate">
                                {a.bina && (
                                  <Link href={`/binalar/${a.bina.id}`} className="text-reset">
                                    {a.bina.baslik}
                                  </Link>
                                )}
                                {a.muteahhit && (
                                  <Link href={`/muteahhitler/${a.muteahhit.id}`} className="text-reset">
                                    {a.muteahhit.firmaAdi}
                                  </Link>
                                )}
                                {!a.bina && !a.muteahhit && a.kullanici.ad}
                              </div>
                            </div>
                            <div className="col-auto text-end">
                              <Rozet harita={AKTIVITE_TURU} deger={a.tur} />
                              <div className="text-secondary small mt-1">{goreceli(a.tarih)}</div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* ----------------------------------------------- Son güncellenenler */}
          <div className="card mt-3">
            <div className="card-header">
              <h3 className="card-title">Son güncellenen dosyalar</h3>
            </div>
            <div className="table-responsive">
              <table className="table table-vcenter card-table">
                <thead>
                  <tr>
                    <th>Bina</th>
                    <th>İlçe</th>
                    <th>Aşama</th>
                    <th style={{ width: "16%" }}>İlerleme</th>
                    <th>Onay</th>
                    <th>Danışman</th>
                    <th>Durum</th>
                  </tr>
                </thead>
                <tbody>
                  {binalar.slice(0, 8).map((b) => {
                    const ozet = onayOzeti(b.hisseler);
                    const ilerleme = asamaYuzdesi(b.asama);
                    return (
                      <tr key={b.id}>
                        <td>
                          <Link href={`/binalar/${b.id}`} className="text-reset d-block text-truncate" style={{ maxWidth: 260 }}>
                            {b.baslik}
                          </Link>
                          <div className="text-secondary small">{b.kod}</div>
                        </td>
                        <td className="text-secondary">{b.ilce}</td>
                        <td>
                          <Rozet harita={SUREC_ADIMI} deger={b.asama} />
                        </td>
                        <td>
                          <div className="d-flex align-items-center">
                            <span className="me-2 text-secondary small">%{ilerleme}</span>
                            <div className="progress progress-xs flex-fill">
                              <div className="progress-bar bg-primary" style={{ width: `${ilerleme}%` }} />
                            </div>
                          </div>
                        </td>
                        <td>
                          <span className={ozet.cogunlukSaglandi ? "text-green fw-medium" : "text-secondary"}>
                            {yuzde(ozet.olumluOran, 0)}
                          </span>
                        </td>
                        <td className="text-secondary">{b.danisman?.ad ?? "—"}</td>
                        <td>
                          <Rozet harita={BINA_DURUMU} deger={b.durum} />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
