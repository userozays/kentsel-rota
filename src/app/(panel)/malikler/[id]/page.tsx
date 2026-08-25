import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { IconClock, IconEdit, IconMail, IconMapPin, IconPhone, IconTrash } from "@tabler/icons-react";
import { db } from "@/lib/db";
import { oturumGerekli } from "@/lib/oturum";
import {
  AKTIVITE_TURU,
  KULLANIM_TURU,
  MALIK_TIPI,
  ONAY_DURUMU,
  SUREC_ADIMI,
  yazabilir,
} from "@/lib/sabitler";
import { goreceli, sayi, tarih, tarihSaat, yuzde } from "@/lib/yardimcilar";
import {
  Avatar,
  BilgiSatiri,
  BosDurum,
  Rozet,
  SayfaBasligi,
} from "@/components/ortak";
import { AktiviteFormu } from "../../binalar/[id]/etkilesim";
import { SilOnayi } from "@/components/modal";
import { BelgelerKarti } from "@/components/belgeler-karti";
import { belgeleriGetir } from "@/lib/belge-listesi";
import { MalikModali } from "../malik-modali";
import { malikSil } from "../eylemler";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const malik = await db.malik.findUnique({ where: { id }, select: { adSoyad: true } });
  return { title: malik?.adSoyad ?? "Malik" };
}

export default async function MalikDetaySayfasi({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const oturum = await oturumGerekli();
  const { id } = await params;
  const p = await searchParams;

  const malik = await db.malik.findUnique({
    where: { id },
    include: {
      hisseler: {
        include: {
          bina: {
            select: { id: true, kod: true, baslik: true, ilce: true, mahalle: true, asama: true, durum: true },
          },
        },
      },
      aktiviteler: {
        orderBy: { tarih: "desc" },
        take: 25,
        include: { kullanici: { select: { ad: true } } },
      },
    },
  });

  if (!malik) notFound();

  const duzenlenebilir = yazabilir(oturum.rol);
  const belgeler = await belgeleriGetir({ malikId: malik.id }, oturum);
  const toplamPay = malik.hisseler.reduce((t, h) => t + h.hisseOrani, 0);

  return (
    <>
      <SayfaBasligi
        ustBaslik="Malik"
        baslik={malik.adSoyad}
        aciklama={
          <div className="d-flex flex-wrap gap-2 align-items-center">
            <Rozet harita={MALIK_TIPI} deger={malik.tip} />
            <span className="text-secondary">
              {sayi(malik.hisseler.length)} bağımsız bölüm · {sayi(new Set(malik.hisseler.map((h) => h.bina.id)).size)} bina
            </span>
          </div>
        }
        aksiyonlar={
          duzenlenebilir ? (
            <>
              <Link href={`/malikler/${malik.id}?duzenle=${malik.id}`} scroll={false} className="btn btn-primary">
                <IconEdit size={18} stroke={1.5} className="me-1" />
                Düzenle
              </Link>
              {oturum.rol === "ADMIN" && (
                <SilOnayi
                  eylem={malikSil}
                  alanlar={{ id: malik.id }}
                  baslik="Malik kaydını sil"
                  mesaj={
                    <>
                      <strong>{malik.adSoyad}</strong> kaydı ve bu kişinin {sayi(malik.hisseler.length)} bina
                      bağlantısı kalıcı olarak silinecek.
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

      {duzenlenebilir && p.duzenle === malik.id && <MalikModali malik={malik} />}

      <div className="page-body">
        <div className="container-fluid">
          <div className="row row-cards">
            <div className="col-lg-4">
              <div className="card mb-3">
                <div className="card-body text-center">
                  <Avatar ad={malik.adSoyad} anahtar={malik.id} boyut="xl" />
                  <h3 className="mt-3 mb-1">{malik.adSoyad}</h3>
                  <div className="text-secondary mb-3">
                    <Rozet harita={MALIK_TIPI} deger={malik.tip} />
                  </div>

                  <div className="btn-list justify-content-center">
                    {malik.telefon && (
                      <a href={`tel:${malik.telefon.replace(/\s/g, "")}`} className="btn btn-sm">
                        <IconPhone size={16} stroke={1.5} className="me-1" />
                        Ara
                      </a>
                    )}
                    {malik.email && (
                      <a href={`mailto:${malik.email}`} className="btn btn-sm">
                        <IconMail size={16} stroke={1.5} className="me-1" />
                        E-posta
                      </a>
                    )}
                  </div>
                </div>
              </div>

              <div className="card mb-3">
                <div className="card-header">
                  <h3 className="card-title">İletişim bilgileri</h3>
                </div>
                <div className="card-body">
                  <BilgiSatiri etiket="T.C. / Vergi No">{malik.tcKimlik ?? "—"}</BilgiSatiri>
                  <BilgiSatiri etiket="Telefon">{malik.telefon ?? "—"}</BilgiSatiri>
                  <BilgiSatiri etiket="İkinci telefon">{malik.telefon2 ?? "—"}</BilgiSatiri>
                  <BilgiSatiri etiket="E-posta">{malik.email ?? "—"}</BilgiSatiri>
                  <BilgiSatiri etiket="Toplam arsa payı">{yuzde(toplamPay, 2)}</BilgiSatiri>
                  <BilgiSatiri etiket="Kayıt tarihi">{tarih(malik.olusturmaTarihi)}</BilgiSatiri>

                  {malik.adres && (
                    <div className="mt-3 pt-3 border-top d-flex gap-2 text-secondary">
                      <IconMapPin size={18} stroke={1.5} className="flex-shrink-0 mt-1" />
                      <div>{malik.adres}</div>
                    </div>
                  )}

                  {malik.notlar && (
                    <div className="mt-3 pt-3 border-top">
                      <div className="text-secondary small mb-1">Notlar</div>
                      <div style={{ whiteSpace: "pre-wrap" }}>{malik.notlar}</div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="col-lg-8">
              <div className="card mb-3">
                <div className="card-header">
                  <h3 className="card-title">Sahip olduğu bağımsız bölümler</h3>
                </div>
                {malik.hisseler.length === 0 ? (
                  <div className="card-body">
                    <BosDurum
                      baslik="Bina bağlantısı yok"
                      aciklama="Bu malik henüz bir bina dosyasına eklenmemiş. Bina detay sayfasından ekleyebilirsiniz."
                    />
                  </div>
                ) : (
                  <div className="table-responsive">
                    <table className="table table-vcenter card-table">
                      <thead>
                        <tr>
                          <th>Bina</th>
                          <th>B.B. No</th>
                          <th>Kullanım</th>
                          <th>Arsa payı</th>
                          <th>Aşama</th>
                          <th>Onay</th>
                        </tr>
                      </thead>
                      <tbody>
                        {malik.hisseler.map((h) => (
                          <tr key={h.id}>
                            <td>
                              <Link href={`/binalar/${h.bina.id}`} className="text-reset d-block fw-medium">
                                {h.bina.baslik}
                              </Link>
                              <div className="text-secondary small">
                                {h.bina.kod} · {h.bina.ilce}
                              </div>
                            </td>
                            <td className="text-secondary">{h.bagimsizBolumNo ?? "—"}</td>
                            <td>
                              <Rozet harita={KULLANIM_TURU} deger={h.kullanimTuru} />
                            </td>
                            <td>
                              <div>{yuzde(h.hisseOrani, 2)}</div>
                              {h.arsaPayiPay && h.arsaPayiPayda && (
                                <div className="text-secondary small">
                                  {sayi(h.arsaPayiPay)}/{sayi(h.arsaPayiPayda)}
                                </div>
                              )}
                            </td>
                            <td>
                              <Rozet harita={SUREC_ADIMI} deger={h.bina.asama} />
                            </td>
                            <td>
                              <Rozet harita={ONAY_DURUMU} deger={h.onayDurumu} />
                              {h.onayTarihi && <div className="text-secondary small mt-1">{tarih(h.onayTarihi)}</div>}
                              {h.notlar && <div className="text-secondary small mt-1">{h.notlar}</div>}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
              <div className="mb-3">
                <BelgelerKarti belgeler={belgeler} malikId={malik.id} duzenlenebilir={duzenlenebilir} />
              </div>


              <div className="card">
                <div className="card-header">
                  <h3 className="card-title">Görüşme geçmişi</h3>
                </div>
                <div className="card-body">
                  {duzenlenebilir && <AktiviteFormu malikId={malik.id} />}

                  {malik.aktiviteler.length === 0 ? (
                    <BosDurum baslik="Henüz görüşme kaydı yok" />
                  ) : (
                    <div className="divide-y">
                      {malik.aktiviteler.map((a) => (
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
