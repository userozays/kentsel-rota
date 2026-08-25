import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  IconAlertTriangle,
  IconCheck,
  IconCircleCheck,
  IconClock,
  IconEdit,
  IconMail,
  IconMapPin,
  IconPhone,
  IconProgress,
  IconX,
} from "@tabler/icons-react";
import { db } from "@/lib/db";
import { oturumGerekli } from "@/lib/oturum";
import {
  AKTIVITE_TURU,
  BINA_DURUMU,
  KULLANIM_TURU,
  MUTEAHHIT_DURUMU,
  ONCELIK,
  RISK_DURUMU,
  SUREC_ADIMI,
  asamaYuzdesi,
  yazabilir,
} from "@/lib/sabitler";
import { goreceli, onayOzeti, sayi, tarih, tarihSaat, yuzde } from "@/lib/yardimcilar";
import {
  Avatar,
  BilgiSatiri,
  BosDurum,
  OnayCubugu,
  Rozet,
  RozetDolu,
  SayfaBasligi,
  Uyari,
  YildizPuan,
} from "@/components/ortak";
import { binaSil } from "../eylemler";
import {
  AdimDegistirici,
  AktiviteFormu,
  HisseSilDugmesi,
  MalikEkleFormu,
  OnayDegistirici,
  SilDugmesi,
} from "./etkilesim";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const bina = await db.bina.findUnique({ where: { id }, select: { baslik: true } });
  return { title: bina?.baslik ?? "Bina" };
}

const ADIM_IKONLARI: Record<string, React.ReactNode> = {
  TAMAMLANDI: <IconCheck size={14} stroke={2.5} />,
  DEVAM: <IconProgress size={14} stroke={2} />,
  ATLANDI: <IconX size={14} stroke={2.5} />,
  BEKLIYOR: null,
};

export default async function BinaDetaySayfasi({ params }: { params: Promise<{ id: string }> }) {
  const oturum = await oturumGerekli();
  const { id } = await params;

  const bina = await db.bina.findUnique({
    where: { id },
    include: {
      danisman: { select: { id: true, ad: true, email: true } },
      muteahhit: true,
      hisseler: {
        include: { malik: true },
        orderBy: [{ bagimsizBolumNo: "asc" }],
      },
      surecAdimlari: {
        orderBy: { sira: "asc" },
        include: { sorumlu: { select: { ad: true } } },
      },
      aktiviteler: {
        orderBy: { tarih: "desc" },
        take: 25,
        include: { kullanici: { select: { ad: true } } },
      },
    },
  });

  if (!bina) notFound();

  const duzenlenebilir = yazabilir(oturum.rol);
  const ozet = onayOzeti(bina.hisseler);
  const ilerleme = asamaYuzdesi(bina.asama);

  const kayitliMalikler = await db.malik.findMany({
    where: { hisseler: { none: { binaId: bina.id } } },
    select: { id: true, adSoyad: true, telefon: true },
    orderBy: { adSoyad: "asc" },
    take: 500,
  });

  return (
    <>
      <SayfaBasligi
        ustBaslik={`${bina.kod} · ${bina.ilce} / ${bina.il}`}
        baslik={bina.baslik}
        aciklama={
          <div className="d-flex flex-wrap gap-2 align-items-center">
            <Rozet harita={RISK_DURUMU} deger={bina.riskDurumu} />
            <Rozet harita={BINA_DURUMU} deger={bina.durum} />
            <Rozet harita={SUREC_ADIMI} deger={bina.asama} />
            {bina.oncelik === "YUKSEK" && <RozetDolu harita={ONCELIK} deger={bina.oncelik} />}
          </div>
        }
        aksiyonlar={
          duzenlenebilir ? (
            <>
              <Link href={`/binalar/${bina.id}/duzenle`} className="btn btn-primary">
                <IconEdit size={18} stroke={1.5} className="me-1" />
                Düzenle
              </Link>
              {oturum.rol === "ADMIN" && (
                <SilDugmesi
                  eylem={binaSil}
                  id={bina.id}
                  metin="Sil"
                  onay={`"${bina.baslik}" dosyası ve bağlı tüm hisse/süreç/aktivite kayıtları silinecek. Emin misiniz?`}
                />
              )}
            </>
          ) : null
        }
      />

      <div className="page-body">
        <div className="container-xl">
          {ozet.bolumSayisi === 0 && (
            <Uyari tur="warning" baslik="Bu binada kayıtlı malik yok">
              Onay oranı hesaplanabilmesi için bağımsız bölüm ve malik kayıtlarını ekleyin.
            </Uyari>
          )}

          <div className="row row-cards">
            {/* ================================================== Sol kolon */}
            <div className="col-lg-8">
              {/* --------------------------------------------- Onay durumu */}
              <div className="card mb-3">
                <div className="card-header">
                  <h3 className="card-title">Malik onay durumu</h3>
                  <div className="card-actions">
                    {ozet.cogunlukSaglandi ? (
                      <span className="badge bg-green text-white">
                        <IconCircleCheck size={14} stroke={2} className="me-1" />
                        Çoğunluk sağlandı
                      </span>
                    ) : (
                      <span className="badge bg-yellow-lt">
                        Eşiğe {yuzde(Math.max(0, ozet.esik - ozet.olumluOran))} kaldı
                      </span>
                    )}
                  </div>
                </div>
                <div className="card-body">
                  <OnayCubugu ozet={ozet} etiketGoster={false} />

                  <div className="row text-center mt-4 g-2">
                    <div className="col">
                      <div className="h2 m-0 text-green">{yuzde(ozet.olumluOran)}</div>
                      <div className="text-secondary small">Olumlu · {sayi(ozet.olumluAdet)} bölüm</div>
                    </div>
                    <div className="col">
                      <div className="h2 m-0 text-red">{yuzde(ozet.olumsuzOran)}</div>
                      <div className="text-secondary small">Olumsuz · {sayi(ozet.olumsuzAdet)} bölüm</div>
                    </div>
                    <div className="col">
                      <div className="h2 m-0 text-secondary">{sayi(ozet.bekleyenAdet)}</div>
                      <div className="text-secondary small">Karar bekleyen</div>
                    </div>
                    <div className="col">
                      <div className="h2 m-0 text-yellow">{sayi(ozet.ulasilamayanAdet)}</div>
                      <div className="text-secondary small">Ulaşılamayan</div>
                    </div>
                  </div>

                  <div className="text-secondary small mt-3">
                    Çoğunluk hesabı arsa payı üzerinden yapılır. Uygulanan eşik: <strong>%{ozet.esik}</strong>
                    {" · "}
                    Toplam kayıtlı pay: <strong>{yuzde(ozet.toplamPay)}</strong>
                    {Math.abs(ozet.toplamPay - 100) > 1 && (
                      <span className="text-yellow"> (paylar toplamı %100 değil, kontrol edin)</span>
                    )}
                  </div>
                </div>
              </div>

              {/* --------------------------------------------- Malik listesi */}
              <div className="card mb-3">
                <div className="card-header">
                  <h3 className="card-title">
                    Malikler ve bağımsız bölümler
                    <span className="badge bg-secondary-lt ms-2">{sayi(bina.hisseler.length)}</span>
                  </h3>
                  {duzenlenebilir && (
                    <div className="card-actions">
                      <MalikEkleFormu binaId={bina.id} mevcutMalikler={kayitliMalikler} />
                    </div>
                  )}
                </div>

                {bina.hisseler.length === 0 ? (
                  <div className="card-body">
                    <BosDurum baslik="Kayıtlı malik yok" aciklama="Yukarıdaki düğmeyle malik ekleyebilirsiniz." />
                  </div>
                ) : (
                  <div className="table-responsive">
                    <table className="table table-vcenter card-table">
                      <thead>
                        <tr>
                          <th style={{ width: "5rem" }}>B.B. No</th>
                          <th>Malik</th>
                          <th>İletişim</th>
                          <th>Kullanım</th>
                          <th>Arsa payı</th>
                          <th>Onay</th>
                          {duzenlenebilir && <th style={{ width: "3rem" }} />}
                        </tr>
                      </thead>
                      <tbody>
                        {bina.hisseler.map((h) => (
                          <tr key={h.id}>
                            <td className="text-secondary">{h.bagimsizBolumNo ?? "—"}</td>
                            <td>
                              <div className="d-flex align-items-center gap-2">
                                <Avatar ad={h.malik.adSoyad} boyut="sm" anahtar={h.malik.id} />
                                <div>
                                  <Link href={`/malikler/${h.malik.id}`} className="text-reset d-block">
                                    {h.malik.adSoyad}
                                  </Link>
                                  {h.notlar && <div className="text-secondary small">{h.notlar}</div>}
                                </div>
                              </div>
                            </td>
                            <td className="text-secondary small">
                              {h.malik.telefon && (
                                <div className="d-flex align-items-center gap-1">
                                  <IconPhone size={14} stroke={1.5} />
                                  <a href={`tel:${h.malik.telefon.replace(/\s/g, "")}`} className="text-reset">
                                    {h.malik.telefon}
                                  </a>
                                </div>
                              )}
                              {h.malik.email && (
                                <div className="d-flex align-items-center gap-1">
                                  <IconMail size={14} stroke={1.5} />
                                  <a href={`mailto:${h.malik.email}`} className="text-reset text-truncate">
                                    {h.malik.email}
                                  </a>
                                </div>
                              )}
                              {!h.malik.telefon && !h.malik.email && "—"}
                            </td>
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
                              <OnayDegistirici hisseId={h.id} deger={h.onayDurumu} duzenlenebilir={duzenlenebilir} />
                              {h.onayTarihi && <div className="text-secondary small mt-1">{tarih(h.onayTarihi)}</div>}
                            </td>
                            {duzenlenebilir && (
                              <td>
                                <HisseSilDugmesi hisseId={h.id} malikAdi={h.malik.adSoyad} />
                              </td>
                            )}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* ------------------------------------------------ Süreç akışı */}
              <div className="card">
                <div className="card-header">
                  <h3 className="card-title">Süreç adımları</h3>
                  <div className="card-actions text-secondary small">%{ilerleme} tamamlandı</div>
                </div>
                <div className="card-body">
                  <div className="progress progress-sm mb-4">
                    <div className="progress-bar bg-primary" style={{ width: `${ilerleme}%` }} />
                  </div>

                  <ul className="surec-liste">
                    {bina.surecAdimlari.map((a) => {
                      const tanim = SUREC_ADIMI[a.adim];
                      const tamam = a.durum === "TAMAMLANDI";
                      const devam = a.durum === "DEVAM";
                      return (
                        <li key={a.id} className="surec-adim">
                          <span
                            className={`surec-nokta ${tamam ? "bg-green text-white border-green" : devam ? "bg-blue text-white border-blue" : a.durum === "ATLANDI" ? "bg-yellow text-white border-yellow" : ""}`}
                          >
                            {ADIM_IKONLARI[a.durum]}
                          </span>
                          <div className="row align-items-center g-2">
                            <div className="col">
                              <div className={tamam || devam ? "fw-medium" : "text-secondary"}>
                                {tanim?.etiket ?? a.adim}
                              </div>
                              <div className="text-secondary small">
                                {tamam && a.tamamlanmaTarihi && `Tamamlandı: ${tarih(a.tamamlanmaTarihi)}`}
                                {devam && (
                                  <>
                                    {a.baslangicTarihi && `Başladı: ${tarih(a.baslangicTarihi)}`}
                                    {a.hedefTarih && ` · Hedef: ${tarih(a.hedefTarih)}`}
                                  </>
                                )}
                                {a.durum === "BEKLIYOR" && (tanim?.aciklama ?? "Bekliyor")}
                                {a.sorumlu && ` · ${a.sorumlu.ad}`}
                              </div>
                            </div>
                            <div className="col-auto">
                              <AdimDegistirici adimId={a.id} deger={a.durum} duzenlenebilir={duzenlenebilir} />
                            </div>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              </div>
            </div>

            {/* ================================================== Sağ kolon */}
            <div className="col-lg-4">
              <div className="card mb-3">
                <div className="card-header">
                  <h3 className="card-title">Bina bilgileri</h3>
                </div>
                <div className="card-body">
                  <BilgiSatiri etiket="Dosya kodu">{bina.kod}</BilgiSatiri>
                  <BilgiSatiri etiket="Ada / Parsel">
                    {bina.ada} / {bina.parsel}
                  </BilgiSatiri>
                  <BilgiSatiri etiket="Mahalle">{bina.mahalle}</BilgiSatiri>
                  <BilgiSatiri etiket="Kat sayısı">{bina.katSayisi ? sayi(bina.katSayisi) : "—"}</BilgiSatiri>
                  <BilgiSatiri etiket="Bağımsız bölüm">{sayi(bina.bagimsizBolumSayisi)}</BilgiSatiri>
                  <BilgiSatiri etiket="Yapım yılı">
                    {bina.yapimYili ? `${bina.yapimYili} (${new Date().getFullYear() - bina.yapimYili} yaşında)` : "—"}
                  </BilgiSatiri>
                  <BilgiSatiri etiket="Arsa alanı">{bina.arsaAlani ? `${sayi(bina.arsaAlani)} m²` : "—"}</BilgiSatiri>
                  <BilgiSatiri etiket="Danışman">{bina.danisman?.ad ?? "Atanmadı"}</BilgiSatiri>
                  <BilgiSatiri etiket="Oluşturma">{tarih(bina.olusturmaTarihi)}</BilgiSatiri>

                  {bina.adres && (
                    <div className="mt-3 pt-3 border-top">
                      <div className="d-flex gap-2 text-secondary">
                        <IconMapPin size={18} stroke={1.5} className="flex-shrink-0 mt-1" />
                        <div>{bina.adres}</div>
                      </div>
                    </div>
                  )}

                  {bina.notlar && (
                    <div className="mt-3 pt-3 border-top">
                      <div className="text-secondary small mb-1">Notlar</div>
                      <div style={{ whiteSpace: "pre-wrap" }}>{bina.notlar}</div>
                    </div>
                  )}
                </div>
              </div>

              {/* ---------------------------------------------- Müteahhit */}
              <div className="card mb-3">
                <div className="card-header">
                  <h3 className="card-title">Müteahhit</h3>
                </div>
                <div className="card-body">
                  {bina.muteahhit ? (
                    <>
                      <div className="d-flex align-items-center gap-2 mb-3">
                        <Avatar ad={bina.muteahhit.firmaAdi} anahtar={bina.muteahhit.kod} />
                        <div className="flex-fill">
                          <Link href={`/muteahhitler/${bina.muteahhit.id}`} className="text-reset d-block fw-medium">
                            {bina.muteahhit.firmaAdi}
                          </Link>
                          <div className="text-secondary small">{bina.muteahhit.yetkiliKisi ?? bina.muteahhit.kod}</div>
                        </div>
                      </div>
                      <div className="mb-2">
                        <YildizPuan puan={bina.muteahhit.puan} />
                        <span className="ms-2">
                          <Rozet harita={MUTEAHHIT_DURUMU} deger={bina.muteahhit.durum} />
                        </span>
                      </div>
                      {bina.muteahhit.durum === "KARA_LISTE" && (
                        <div className="alert alert-danger d-flex gap-2 py-2 mt-2 mb-0">
                          <IconAlertTriangle size={18} stroke={1.5} className="flex-shrink-0" />
                          <div className="small">Bu firma kara listede. Dosyaya atanmış olması gözden geçirilmeli.</div>
                        </div>
                      )}
                      <BilgiSatiri etiket="Telefon">{bina.muteahhit.telefon ?? "—"}</BilgiSatiri>
                      <BilgiSatiri etiket="Tamamlanan">{sayi(bina.muteahhit.tamamlananProje)} proje</BilgiSatiri>
                    </>
                  ) : (
                    <BosDurum
                      baslik="Müteahhit seçilmedi"
                      aciklama="Dosyayı düzenleyerek portföyünüzden bir firma atayabilirsiniz."
                      aksiyon={
                        duzenlenebilir ? (
                          <Link href={`/binalar/${bina.id}/duzenle`} className="btn btn-sm btn-primary">
                            Müteahhit ata
                          </Link>
                        ) : null
                      }
                    />
                  )}
                </div>
              </div>

              {/* ---------------------------------------------- Aktiviteler */}
              <div className="card">
                <div className="card-header">
                  <h3 className="card-title">Görüşme ve notlar</h3>
                </div>
                <div className="card-body">
                  {duzenlenebilir && <AktiviteFormu binaId={bina.id} />}

                  {bina.aktiviteler.length === 0 ? (
                    <BosDurum baslik="Henüz kayıt yok" />
                  ) : (
                    <div className="divide-y">
                      {bina.aktiviteler.map((a) => (
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
