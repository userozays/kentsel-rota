import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  IconAlertTriangle,
  IconClock,
  IconEdit,
  IconExternalLink,
  IconMail,
  IconMapPin,
  IconPhone,
  IconTrash,
} from "@tabler/icons-react";
import { db } from "@/lib/db";
import { oturumGerekli } from "@/lib/oturum";
import { AKTIVITE_TURU, BINA_DURUMU, MUTEAHHIT_DURUMU, SUREC_ADIMI, yazabilir } from "@/lib/sabitler";
import { goreceli, onayOzeti, sayi, tarih, tarihSaat, yuzde } from "@/lib/yardimcilar";
import {
  Avatar,
  BilgiSatiri,
  BosDurum,
  Rozet,
  SayfaBasligi,
  Uyari,
  YildizPuan,
} from "@/components/ortak";
import { AktiviteFormu } from "../../binalar/[id]/etkilesim";
import { SilOnayi } from "@/components/modal";
import { BelgelerKarti } from "@/components/belgeler-karti";
import { belgeleriGetir } from "@/lib/belge-listesi";
import { MuteahhitModali } from "../muteahhit-modali";
import { muteahhitSil } from "../eylemler";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const m = await db.muteahhit.findUnique({ where: { id }, select: { firmaAdi: true } });
  return { title: m?.firmaAdi ?? "Müteahhit" };
}

export default async function MuteahhitDetaySayfasi({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const p = await searchParams;
  const oturum = await oturumGerekli();
  const { id } = await params;

  const muteahhit = await db.muteahhit.findUnique({
    where: { id },
    include: {
      binalar: {
        include: { hisseler: { select: { hisseOrani: true, onayDurumu: true } } },
        orderBy: { guncellemeTarihi: "desc" },
      },
      aktiviteler: {
        orderBy: { tarih: "desc" },
        take: 25,
        include: { kullanici: { select: { ad: true } } },
      },
    },
  });

  if (!muteahhit) notFound();

  const duzenlenebilir = yazabilir(oturum.rol);
  const belgeler = await belgeleriGetir({ muteahhitId: muteahhit.id }, oturum);
  const bolgeler = (muteahhit.calismaBolgeleri ?? "")
    .split(",")
    .map((b) => b.trim())
    .filter(Boolean);

  return (
    <>
      <SayfaBasligi
        ustBaslik={`Müteahhit · ${muteahhit.kod}`}
        baslik={muteahhit.firmaAdi}
        aciklama={
          <div className="d-flex flex-wrap gap-2 align-items-center">
            <YildizPuan puan={muteahhit.puan} />
            <Rozet harita={MUTEAHHIT_DURUMU} deger={muteahhit.durum} />
            {muteahhit.yetkiliKisi && <span className="text-secondary">Yetkili: {muteahhit.yetkiliKisi}</span>}
          </div>
        }
        aksiyonlar={
          duzenlenebilir ? (
            <>
              <Link href={`/muteahhitler/${muteahhit.id}?duzenle=${muteahhit.id}`} scroll={false} className="btn btn-primary">
                <IconEdit size={18} stroke={1.5} className="me-1" />
                Düzenle
              </Link>
              {oturum.rol === "ADMIN" && (
                <SilOnayi
                  eylem={muteahhitSil}
                  alanlar={{ id: muteahhit.id }}
                  baslik="Müteahhit kaydını sil"
                  mesaj={
                    <>
                      <strong>{muteahhit.firmaAdi}</strong> kaydı silinecek. Bu firmaya atanmış{" "}
                      {sayi(muteahhit.binalar.length)} bina dosyasındaki müteahhit ataması kaldırılır,
                      dosyalar silinmez.
                      <div className="text-secondary small mt-2">Bu işlem geri alınamaz.</div>
                    </>
                  }
                  tetikleyici={
                    <>
                      <IconTrash size={18} stroke={1.5} className="me-1" />
                      Sil
                    </>
                  }
                />
              )}
            </>
          ) : null
        }
      />

      {duzenlenebilir && p.duzenle === muteahhit.id && <MuteahhitModali muteahhit={muteahhit} />}

      <div className="page-body">
        <div className="container-fluid">
          {muteahhit.durum === "KARA_LISTE" && (
            <Uyari tur="danger" baslik="Bu firma kara listede">
              {muteahhit.notlar ?? "Firma ile çalışılmaması yönünde karar alınmış."}
            </Uyari>
          )}

          <div className="row row-cards">
            <div className="col-lg-4">
              <div className="card mb-3">
                <div className="card-body text-center">
                  <Avatar ad={muteahhit.firmaAdi} anahtar={muteahhit.kod} boyut="xl" />
                  <h3 className="mt-3 mb-1">{muteahhit.firmaAdi}</h3>
                  <div className="text-secondary mb-3">{muteahhit.yetkiliKisi ?? muteahhit.kod}</div>

                  <div className="btn-list justify-content-center">
                    {muteahhit.telefon && (
                      <a href={`tel:${muteahhit.telefon.replace(/\s/g, "")}`} className="btn btn-sm">
                        <IconPhone size={16} stroke={1.5} className="me-1" />
                        Ara
                      </a>
                    )}
                    {muteahhit.email && (
                      <a href={`mailto:${muteahhit.email}`} className="btn btn-sm">
                        <IconMail size={16} stroke={1.5} className="me-1" />
                        E-posta
                      </a>
                    )}
                    {muteahhit.websitesi && (
                      <a href={muteahhit.websitesi} target="_blank" rel="noreferrer noopener" className="btn btn-sm">
                        <IconExternalLink size={16} stroke={1.5} className="me-1" />
                        Site
                      </a>
                    )}
                  </div>
                </div>
              </div>

              <div className="card mb-3">
                <div className="card-header">
                  <h3 className="card-title">Referans bilgileri</h3>
                </div>
                <div className="card-body">
                  <div className="row text-center mb-3 g-2">
                    <div className="col">
                      <div className="h2 m-0">{sayi(muteahhit.tamamlananProje)}</div>
                      <div className="text-secondary small">Tamamlanan</div>
                    </div>
                    <div className="col">
                      <div className="h2 m-0">{sayi(muteahhit.devamEdenProje)}</div>
                      <div className="text-secondary small">Devam eden</div>
                    </div>
                    <div className="col">
                      <div className="h2 m-0">{sayi(muteahhit.toplamDaire)}</div>
                      <div className="text-secondary small">Teslim daire</div>
                    </div>
                  </div>

                  <BilgiSatiri etiket="Kod">{muteahhit.kod}</BilgiSatiri>
                  <BilgiSatiri etiket="Telefon">{muteahhit.telefon ?? "—"}</BilgiSatiri>
                  <BilgiSatiri etiket="E-posta">{muteahhit.email ?? "—"}</BilgiSatiri>
                  <BilgiSatiri etiket="Vergi dairesi">{muteahhit.vergiDairesi ?? "—"}</BilgiSatiri>
                  <BilgiSatiri etiket="Vergi no">{muteahhit.vergiNo ?? "—"}</BilgiSatiri>
                  <BilgiSatiri etiket="Kayıt tarihi">{tarih(muteahhit.olusturmaTarihi)}</BilgiSatiri>

                  {bolgeler.length > 0 && (
                    <div className="mt-3 pt-3 border-top">
                      <div className="text-secondary small mb-2">Çalışma bölgeleri</div>
                      <div className="d-flex flex-wrap gap-1">
                        {bolgeler.map((b) => (
                          <span key={b} className="badge bg-blue-lt">
                            {b}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {muteahhit.adres && (
                    <div className="mt-3 pt-3 border-top d-flex gap-2 text-secondary">
                      <IconMapPin size={18} stroke={1.5} className="flex-shrink-0 mt-1" />
                      <div>{muteahhit.adres}</div>
                    </div>
                  )}

                  {muteahhit.notlar && muteahhit.durum !== "KARA_LISTE" && (
                    <div className="mt-3 pt-3 border-top">
                      <div className="text-secondary small mb-1">Notlar</div>
                      <div style={{ whiteSpace: "pre-wrap" }}>{muteahhit.notlar}</div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="col-lg-8">
              <div className="card mb-3">
                <div className="card-header">
                  <h3 className="card-title">
                    Atandığı dosyalarımız
                    <span className="badge bg-secondary-lt ms-2">{sayi(muteahhit.binalar.length)}</span>
                  </h3>
                </div>
                {muteahhit.binalar.length === 0 ? (
                  <div className="card-body">
                    <BosDurum
                      baslik="Bu firmaya atanmış dosya yok"
                      aciklama="Bina detay sayfasından müteahhit ataması yapabilirsiniz."
                    />
                  </div>
                ) : (
                  <div className="table-responsive">
                    <table className="table table-vcenter card-table">
                      <thead>
                        <tr>
                          <th>Bina</th>
                          <th>İlçe</th>
                          <th>Aşama</th>
                          <th>Onay oranı</th>
                          <th>Durum</th>
                        </tr>
                      </thead>
                      <tbody>
                        {muteahhit.binalar.map((b) => {
                          const ozet = onayOzeti(b.hisseler);
                          return (
                            <tr key={b.id}>
                              <td>
                                <Link href={`/binalar/${b.id}`} className="text-reset d-block fw-medium">
                                  {b.baslik}
                                </Link>
                                <div className="text-secondary small">{b.kod}</div>
                              </td>
                              <td className="text-secondary">{b.ilce}</td>
                              <td>
                                <Rozet harita={SUREC_ADIMI} deger={b.asama} />
                              </td>
                              <td>
                                <span className={ozet.cogunlukSaglandi ? "text-green fw-medium" : ""}>
                                  {yuzde(ozet.olumluOran, 0)}
                                </span>
                              </td>
                              <td>
                                <Rozet harita={BINA_DURUMU} deger={b.durum} />
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              <div className="mb-3">
                <BelgelerKarti belgeler={belgeler} muteahhitId={muteahhit.id} duzenlenebilir={duzenlenebilir} />
              </div>

              <div className="card">
                <div className="card-header">
                  <h3 className="card-title">Görüşme geçmişi</h3>
                </div>
                <div className="card-body">
                  {duzenlenebilir && <AktiviteFormu muteahhitId={muteahhit.id} />}

                  {muteahhit.aktiviteler.length === 0 ? (
                    <BosDurum baslik="Henüz görüşme kaydı yok" />
                  ) : (
                    <div className="divide-y">
                      {muteahhit.aktiviteler.map((a) => (
                        <div key={a.id} className="py-2">
                          <div className="d-flex align-items-baseline justify-content-between gap-2">
                            <div className="fw-medium">{a.baslik}</div>
                            <Rozet harita={AKTIVITE_TURU} deger={a.tur} />
                          </div>
                          {a.icerik && <div className="text-secondary small mt-1">{a.icerik}</div>}
                          <div className="text-secondary small mt-1 d-flex align-items-center gap-1">
                            <IconClock size={13} stroke={1.5} />
                            {tarihSaat(a.tarih)} · {a.kullanici.ad} · {goreceli(a.tarih)}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
