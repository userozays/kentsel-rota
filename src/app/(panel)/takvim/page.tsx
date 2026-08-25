import type { Metadata } from "next";
import Link from "next/link";
import {
  IconCalendarPlus,
  IconChevronLeft,
  IconChevronRight,
  IconClock,
  IconFlag,
  IconMapPin,
} from "@tabler/icons-react";
import { db } from "@/lib/db";
import { oturumGerekli } from "@/lib/oturum";
import {
  RANDEVU_DURUMU,
  RANDEVU_TURU,
  SUREC_ADIMI,
  TAKVIM_GORUNUMLERI,
  etiketBul,
  yazabilir,
} from "@/lib/sabitler";
import {
  GUN_ADLARI,
  GUN_KISA,
  ayIzgarasi,
  ayniGunMu,
  baslikMetni,
  bugunMu,
  gorunumAraligi,
  haftaIzgarasi,
  haftaninGunu,
  kaydir,
  saatMetni,
  tarihAnahtari,
  tarihSaatAnahtari,
} from "@/lib/takvim";
import { sayi } from "@/lib/yardimcilar";
import { anahtardanTarih } from "@/lib/takvim";
import { BosDurum, SayfaBasligi } from "@/components/ortak";
import { CanliTazele } from "@/components/canli-tazele";
import { RandevuModali } from "./randevu-modali";
import type { RandevuVerisi } from "./randevu-formu";

export const metadata: Metadata = { title: "Canlı İş Takvimi" };
export const dynamic = "force-dynamic";

/** Ay hücresinde gösterilecek en fazla olay; kalanı "+N" olarak özetlenir */
const HUCRE_LIMITI = 3;

type Olay = {
  anahtar: string;
  kaynak: "randevu" | "surec";
  baslik: string;
  tarih: Date;
  renk: string;
  saatli: boolean;
  altBilgi?: string;
  yol?: string;
  duzenleId?: string;
  durum?: string;
};

export default async function TakvimSayfasi({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const oturum = await oturumGerekli();
  const p = await searchParams;

  const gorunum = (["ay", "hafta", "gun"] as const).includes(p.gorunum as never)
    ? (p.gorunum as "ay" | "hafta" | "gun")
    : "ay";
  const referans = anahtardanTarih(p.tarih);
  const { baslangic, bitis } = gorunumAraligi(gorunum, referans);
  const duzenlenebilir = yazabilir(oturum.rol);

  const [randevular, surecAdimlari] = await Promise.all([
    db.randevu.findMany({
      where: { baslangic: { gte: baslangic, lte: bitis } },
      include: {
        bina: { select: { id: true, baslik: true } },
        muteahhit: { select: { id: true, firmaAdi: true } },
        sorumlu: { select: { ad: true } },
      },
      orderBy: { baslangic: "asc" },
    }),
    db.surecAdimi.findMany({
      where: { hedefTarih: { gte: baslangic, lte: bitis }, durum: { in: ["DEVAM", "BEKLIYOR"] } },
      include: { bina: { select: { id: true, baslik: true, ilce: true } } },
      orderBy: { hedefTarih: "asc" },
    }),
  ]);

  const olaylar: Olay[] = [
    ...randevular.map((r) => ({
      anahtar: "r" + r.id,
      kaynak: "randevu" as const,
      baslik: r.baslik,
      tarih: r.baslangic,
      renk: r.durum === "IPTAL" ? "secondary" : etiketBul(RANDEVU_TURU, r.tur).renk,
      saatli: !r.tumGun,
      altBilgi: [r.yer, r.bina?.baslik, r.muteahhit?.firmaAdi, r.sorumlu?.ad].filter(Boolean).join(" · "),
      yol: r.bina ? `/binalar/${r.bina.id}` : undefined,
      duzenleId: r.id,
      durum: r.durum,
    })),
    ...surecAdimlari.map((a) => ({
      anahtar: "s" + a.id,
      kaynak: "surec" as const,
      baslik: etiketBul(SUREC_ADIMI, a.adim).etiket,
      tarih: a.hedefTarih!,
      renk: "yellow",
      saatli: false,
      altBilgi: `${a.bina.baslik} · ${a.bina.ilce}`,
      yol: `/binalar/${a.bina.id}`,
    })),
  ].sort((a, b) => a.tarih.getTime() - b.tarih.getTime());

  const gunOlaylari = (g: Date) => olaylar.filter((o) => ayniGunMu(o.tarih, g));

  /* ------------------------------------------------------------- Bağlantılar */
  const yol = (ek: Record<string, string>) => {
    const q = new URLSearchParams({ gorunum, tarih: tarihAnahtari(referans) });
    for (const [a, d] of Object.entries(ek)) {
      if (d) q.set(a, d);
      else q.delete(a);
    }
    return `/takvim?${q.toString()}`;
  };
  const kaydirYolu = (yon: number) =>
    `/takvim?gorunum=${gorunum}&tarih=${tarihAnahtari(kaydir(gorunum, referans, yon))}`;

  /* ------------------------------------------------------------------ Modal */
  const modalAcik = duzenlenebilir && (p.yeni === "1" || Boolean(p.duzenle));
  const [duzenlenecekKayit, formBinalari, formMuteahhitleri, formKullanicilari] = modalAcik
    ? await Promise.all([
        p.duzenle ? db.randevu.findUnique({ where: { id: p.duzenle } }) : Promise.resolve(null),
        db.bina.findMany({ select: { id: true, baslik: true }, orderBy: { baslik: "asc" } }),
        db.muteahhit.findMany({ select: { id: true, firmaAdi: true }, orderBy: { firmaAdi: "asc" } }),
        db.kullanici.findMany({
          where: { aktif: true, rol: { in: ["ADMIN", "DANISMAN"] } },
          select: { id: true, ad: true },
          orderBy: { ad: "asc" },
        }),
      ])
    : [null, [], [], []];

  const duzenlenecek: RandevuVerisi | undefined = duzenlenecekKayit
    ? {
        id: duzenlenecekKayit.id,
        baslik: duzenlenecekKayit.baslik,
        aciklama: duzenlenecekKayit.aciklama,
        tur: duzenlenecekKayit.tur,
        durum: duzenlenecekKayit.durum,
        baslangicGirdi: tarihSaatAnahtari(duzenlenecekKayit.baslangic),
        bitisGirdi: duzenlenecekKayit.bitis ? tarihSaatAnahtari(duzenlenecekKayit.bitis) : "",
        tumGun: duzenlenecekKayit.tumGun,
        yer: duzenlenecekKayit.yer,
        katilimcilar: duzenlenecekKayit.katilimcilar,
        binaId: duzenlenecekKayit.binaId,
        malikId: duzenlenecekKayit.malikId,
        muteahhitId: duzenlenecekKayit.muteahhitId,
        sorumluId: duzenlenecekKayit.sorumluId,
      }
    : undefined;

  const varsayilanBaslangic = (() => {
    const t = new Date(referans);
    t.setHours(10, 0, 0, 0);
    return tarihSaatAnahtari(t);
  })();

  /* --------------------------------------------------------------- Görünümler */

  const OlayRozeti = ({ o, kompakt = false }: { o: Olay; kompakt?: boolean }) => {
    const icerik = (
      <>
        <span className={`krp-olay-nokta bg-${o.renk}`} />
        {o.saatli && <span className="krp-olay-saat">{saatMetni(o.tarih)}</span>}
        <span className="text-truncate">{o.baslik}</span>
      </>
    );
    const sinif = `krp-olay${o.durum === "IPTAL" ? " krp-olay-iptal" : ""}${kompakt ? " krp-olay-kompakt" : ""}`;
    const hedef = o.kaynak === "randevu" && duzenlenebilir ? yol({ duzenle: o.duzenleId! }) : o.yol;
    return hedef ? (
      <Link href={hedef} scroll={false} className={sinif} title={`${o.baslik}${o.altBilgi ? " — " + o.altBilgi : ""}`}>
        {icerik}
      </Link>
    ) : (
      <span className={sinif}>{icerik}</span>
    );
  };

  return (
    <>
      <SayfaBasligi
        ustBaslik="Operasyon"
        baslik="Canlı İş Takvimi"
        aciklama={
          <div className="d-flex flex-wrap align-items-center gap-3">
            <span>{sayi(olaylar.length)} kayıt görüntüleniyor</span>
            <CanliTazele />
          </div>
        }
        aksiyonlar={
          <>
            <div className="btn-group">
              <Link href={kaydirYolu(-1)} className="btn btn-icon" aria-label="Önceki">
                <IconChevronLeft size={18} stroke={1.5} />
              </Link>
              <Link href={`/takvim?gorunum=${gorunum}&tarih=${tarihAnahtari(new Date())}`} className="btn">
                Bugün
              </Link>
              <Link href={kaydirYolu(1)} className="btn btn-icon" aria-label="Sonraki">
                <IconChevronRight size={18} stroke={1.5} />
              </Link>
            </div>

            <div className="btn-group">
              {TAKVIM_GORUNUMLERI.map((g) => (
                <Link
                  key={g.deger}
                  href={`/takvim?gorunum=${g.deger}&tarih=${tarihAnahtari(referans)}`}
                  className={`btn${gorunum === g.deger ? " active" : ""}`}
                >
                  {g.etiket}
                </Link>
              ))}
            </div>

            {duzenlenebilir && (
              <Link href={yol({ yeni: "1" })} scroll={false} className="btn btn-primary">
                <IconCalendarPlus size={18} stroke={1.5} className="me-1" />
                Yeni İş
              </Link>
            )}
          </>
        }
      />

      {modalAcik && (
        <RandevuModali
          randevu={duzenlenecek}
          varsayilanBaslangic={varsayilanBaslangic}
          binalar={formBinalari}
          muteahhitler={formMuteahhitleri}
          kullanicilar={formKullanicilari}
        />
      )}

      <div className="page-body">
        <div className="container-fluid">
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">{baslikMetni(gorunum, referans)}</h3>
              <div className="card-actions text-secondary small d-flex flex-wrap gap-3">
                <span className="d-inline-flex align-items-center gap-1">
                  <span className="krp-olay-nokta bg-purple" /> Randevu / toplantı
                </span>
                <span className="d-inline-flex align-items-center gap-1">
                  <span className="krp-olay-nokta bg-yellow" /> Süreç hedef tarihi
                </span>
              </div>
            </div>

            {/* ------------------------------------------------------- AY */}
            {gorunum === "ay" && (
              <div className="table-responsive">
                <table className="table table-bordered krp-takvim mb-0">
                  <thead>
                    <tr>
                      {GUN_KISA.map((g) => (
                        <th key={g} className="text-center text-secondary">
                          {g}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {[0, 1, 2, 3, 4, 5].map((hafta) => (
                      <tr key={hafta}>
                        {ayIzgarasi(referans)
                          .slice(hafta * 7, hafta * 7 + 7)
                          .map((g) => {
                            const bugun = bugunMu(g);
                            const buAy = g.getMonth() === referans.getMonth();
                            const liste = gunOlaylari(g);
                            return (
                              <td key={g.toISOString()} className={`krp-gun${buAy ? "" : " krp-gun-solgun"}`}>
                                <div className="d-flex align-items-center justify-content-between mb-1">
                                  <span className={bugun ? "krp-bugun" : "text-secondary small"}>{g.getDate()}</span>
                                  {duzenlenebilir && (
                                    <Link
                                      href={`/takvim?gorunum=ay&tarih=${tarihAnahtari(g)}&yeni=1`}
                                      scroll={false}
                                      className="krp-gun-ekle"
                                      aria-label={`${tarihAnahtari(g)} için iş ekle`}
                                      title="Bu güne iş ekle"
                                    >
                                      +
                                    </Link>
                                  )}
                                </div>
                                {liste.slice(0, HUCRE_LIMITI).map((o) => (
                                  <OlayRozeti key={o.anahtar} o={o} kompakt />
                                ))}
                                {liste.length > HUCRE_LIMITI && (
                                  <Link
                                    href={`/takvim?gorunum=gun&tarih=${tarihAnahtari(g)}`}
                                    className="d-block text-secondary small mt-1"
                                  >
                                    +{liste.length - HUCRE_LIMITI} tane daha
                                  </Link>
                                )}
                              </td>
                            );
                          })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* ---------------------------------------------------- HAFTA */}
            {gorunum === "hafta" && (
              <div className="table-responsive">
                <div className="d-flex" style={{ minWidth: "56rem" }}>
                  {haftaIzgarasi(referans).map((g) => {
                    const liste = gunOlaylari(g);
                    return (
                      <div key={g.toISOString()} className="krp-hafta-sutun">
                        <div className={`krp-hafta-baslik${bugunMu(g) ? " krp-hafta-bugun" : ""}`}>
                          <div className="small text-secondary">{GUN_KISA[haftaninGunu(g)]}</div>
                          <div className="fw-medium">{g.getDate()}</div>
                        </div>
                        <div className="p-2 d-flex flex-column gap-1">
                          {liste.length === 0 ? (
                            <span className="text-secondary small text-center py-2">—</span>
                          ) : (
                            liste.map((o) => <OlayRozeti key={o.anahtar} o={o} />)
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ------------------------------------------------------ GÜN */}
            {gorunum === "gun" && (
              <div className="card-body">
                {olaylar.length === 0 ? (
                  <BosDurum
                    baslik="Bu gün için kayıt yok"
                    aciklama={`${GUN_ADLARI[haftaninGunu(referans)]} günü planlanmış bir iş bulunmuyor.`}
                    aksiyon={
                      duzenlenebilir ? (
                        <Link href={yol({ yeni: "1" })} scroll={false} className="btn btn-primary">
                          Bu güne iş ekle
                        </Link>
                      ) : null
                    }
                  />
                ) : (
                  <div className="divide-y">
                    {olaylar.map((o) => (
                      <div key={o.anahtar} className="py-3">
                        <div className="row g-3 align-items-start">
                          <div className="col-auto text-center" style={{ minWidth: "4rem" }}>
                            {o.saatli ? (
                              <div className="fw-medium">{saatMetni(o.tarih)}</div>
                            ) : (
                              <span className="badge bg-secondary-lt">Tüm gün</span>
                            )}
                          </div>
                          <div className="col-auto">
                            <span className={`krp-olay-nokta bg-${o.renk}`} style={{ marginTop: "0.4rem" }} />
                          </div>
                          <div className="col">
                            <div className={`fw-medium${o.durum === "IPTAL" ? " text-decoration-line-through text-secondary" : ""}`}>
                              {o.baslik}
                            </div>
                            {o.altBilgi && (
                              <div className="text-secondary small mt-1 d-flex flex-wrap align-items-center gap-2">
                                {o.kaynak === "surec" ? (
                                  <IconFlag size={14} stroke={1.5} />
                                ) : (
                                  <IconMapPin size={14} stroke={1.5} />
                                )}
                                {o.altBilgi}
                              </div>
                            )}
                          </div>
                          <div className="col-auto text-end">
                            {o.kaynak === "randevu" ? (
                              <>
                                <span className={`badge bg-${etiketBul(RANDEVU_DURUMU, o.durum).renk}-lt`}>
                                  {etiketBul(RANDEVU_DURUMU, o.durum).etiket}
                                </span>
                                {duzenlenebilir && (
                                  <div className="mt-2">
                                    <Link href={yol({ duzenle: o.duzenleId! })} scroll={false} className="btn btn-sm">
                                      Düzenle
                                    </Link>
                                  </div>
                                )}
                              </>
                            ) : (
                              <span className="badge bg-yellow-lt">
                                <IconClock size={13} stroke={1.5} className="me-1" />
                                Süreç hedefi
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
