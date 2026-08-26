import type { Metadata } from "next";
import Link from "next/link";
import { IconDownload,
  IconEdit, IconFilter, IconPlus, IconSearch } from "@tabler/icons-react";
import type { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { oturumGerekli } from "@/lib/oturum";
import {
  BINA_DURUMLARI,
  BINA_DURUMU,
  ONCELIK,
  RISK_DURUMLARI,
  RISK_DURUMU,
  SUREC_ADIMI,
  SUREC_ADIMLARI,
  asamaYuzdesi,
  yazabilir,
} from "@/lib/sabitler";
import { onayOzeti, sayi, tarih, yuzde } from "@/lib/yardimcilar";
import { aramaKelimeleri } from "@/lib/arama";
import { BosDurum, Rozet, SayfaBasligi } from "@/components/ortak";
import { Sayfalama } from "@/components/sayfalama";
import { BinaModali } from "./bina-modali";
import { BinaGovdesi } from "./bina-govdesi";
import { binaDetayiGetir, binayaEklenebilirMalikler } from "./bina-verisi";
import { ProfilModali } from "@/components/profil-modali";
import { TiklanirSatir } from "@/components/tiklanir-satir";
import { belgeleriGetir } from "@/lib/belge-listesi";

export const metadata: Metadata = { title: "Binalar" };
export const dynamic = "force-dynamic";

const SAYFA_ADEDI = 25;

export default async function BinalarSayfasi({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const oturum = await oturumGerekli();
  const p = await searchParams;
  const sayfa = Math.max(1, Number(p.sayfa) || 1);

  const kosullar: Prisma.BinaWhereInput[] = [];
  // Aksan ve büyük/küçük harften bağımsız arama: her kelime ayrı koşul olur
  for (const kelime of aramaKelimeleri(p.q)) {
    kosullar.push({ aramaMetni: { contains: kelime } });
  }
  if (p.durum) kosullar.push({ durum: p.durum });
  if (p.risk) kosullar.push({ riskDurumu: p.risk });
  if (p.asama) kosullar.push({ asama: p.asama });
  if (p.ilce) kosullar.push({ ilce: p.ilce });
  if (p.danisman) kosullar.push({ danismanId: p.danisman });

  const where: Prisma.BinaWhereInput = kosullar.length ? { AND: kosullar } : {};

  const [toplam, binalar, ilceler, danismanlar] = await Promise.all([
    db.bina.count({ where }),
    db.bina.findMany({
      where,
      include: {
        hisseler: { select: { hisseOrani: true, onayDurumu: true } },
        muteahhit: { select: { id: true, firmaAdi: true } },
        danisman: { select: { id: true, ad: true } },
      },
      orderBy: { guncellemeTarihi: "desc" },
      skip: (sayfa - 1) * SAYFA_ADEDI,
      take: SAYFA_ADEDI,
    }),
    db.bina.findMany({ distinct: ["ilce"], select: { ilce: true }, orderBy: { ilce: "asc" } }),
    db.kullanici.findMany({ where: { aktif: true }, select: { id: true, ad: true }, orderBy: { ad: "asc" } }),
  ]);

  const filtreVar = Boolean(p.q || p.durum || p.risk || p.asama || p.ilce || p.danisman);
  const duzenlenebilir = yazabilir(oturum.rol);

  /* --- Modal: adres çubuğundaki ?yeni / ?duzenle parametrelerine göre açılır --- */
  const modalAcik = duzenlenebilir && (p.yeni === "1" || Boolean(p.duzenle));
  const [duzenlenecek, formDanismanlari, formMuteahhitleri] = modalAcik
    ? await Promise.all([
        p.duzenle ? db.bina.findUnique({ where: { id: p.duzenle } }) : Promise.resolve(null),
        db.kullanici.findMany({
          where: { aktif: true, rol: { in: ["ADMIN", "DANISMAN"] } },
          select: { id: true, ad: true },
          orderBy: { ad: "asc" },
        }),
        db.muteahhit.findMany({
          select: { id: true, firmaAdi: true, durum: true },
          orderBy: [{ durum: "asc" }, { firmaAdi: "asc" }],
        }),
      ])
    : [null, [], []];

  /* Satıra tıklanınca açılan profil modalı: detay sayfasının gövdesinin
     aynısını gösterir. `duzenle` varken açılmaz — o zaman düzenleme modalı
     önceliklidir ve alt köşesindeki "Geri" buraya döner. */
  const profil = p.profil && !modalAcik ? await binaDetayiGetir(p.profil) : null;
  const [profilBelgeleri, profilMalikleri] = profil
    ? await Promise.all([
        belgeleriGetir({ binaId: profil.id }, oturum),
        binayaEklenebilirMalikler(profil.id),
      ])
    : [[], []];

  /** Aktif filtreleri koruyarak modal bağlantısı üretir */
  /** Ekrandaki filtreleri koruyarak CSV bağlantısı üretir */
  const disaAktarYolu = () => {
    const q = new URLSearchParams();
    for (const [ad, deger] of Object.entries(p)) {
      if (deger && !["yeni", "duzenle", "profil", "sayfa"].includes(ad)) q.set(ad, deger);
    }
    const s = q.toString();
    return s ? "/binalar/disa-aktar?" + s : "/binalar/disa-aktar";
  };

  const modalYolu = (ek: Record<string, string>) => {
    const q = new URLSearchParams();
    for (const [ad, deger] of Object.entries(p)) {
      if (deger && ad !== "yeni" && ad !== "duzenle" && ad !== "profil") q.set(ad, deger);
    }
    for (const [ad, deger] of Object.entries(ek)) q.set(ad, deger);
    return `/binalar?${q.toString()}`;
  };

  return (
    <>
      <SayfaBasligi
        ustBaslik="Portföy"
        baslik="Binalar"
        aciklama={`${sayi(toplam)} dosya listeleniyor`}
        aksiyonlar={
          duzenlenebilir ? (
            <>
              <Link href={modalYolu({ yeni: "1" })} scroll={false} className="btn btn-primary">
                <IconPlus size={18} stroke={1.5} className="me-1" />
                Yeni Bina Dosyası
              </Link>
              <a href={disaAktarYolu()} className="btn">
                <IconDownload size={18} stroke={1.5} className="me-1" />
                Dışa Aktar
              </a>
            </>
          ) : null
        }
      />

      {modalAcik && (
        <BinaModali
          bina={duzenlenecek ?? undefined}
          danismanlar={formDanismanlari}
          muteahhitler={formMuteahhitleri}
          geriProfilId={p.profil && p.duzenle === p.profil ? p.profil : undefined}
        />
      )}
      {profil && (
        <ProfilModali
          kayitId={profil.id}
          baslik={profil.baslik}
          aciklama={
            <span className="d-inline-flex flex-wrap align-items-center gap-2">
              <span>
                {profil.kod} · {profil.ilce} / {profil.il}
              </span>
              <Rozet harita={RISK_DURUMU} deger={profil.riskDurumu} />
              <Rozet harita={BINA_DURUMU} deger={profil.durum} />
              <Rozet harita={SUREC_ADIMI} deger={profil.asama} />
            </span>
          }
          duzenlenebilir={duzenlenebilir}
        >
          <BinaGovdesi
            bina={profil}
            belgeler={profilBelgeleri}
            kayitliMalikler={profilMalikleri}
            duzenlenebilir={duzenlenebilir}
          />
        </ProfilModali>
      )}

      <div className="page-body">
        <div className="container-fluid">
          {/* --------------------------------------------------------- Filtreler */}
          <div className="card mb-3">
            <div className="card-body">
              <form method="get" className="row g-2 align-items-end">
                <div className="col-12 col-md">
                  <label className="form-label" htmlFor="q">
                    Ara
                  </label>
                  <div className="input-icon">
                    <span className="input-icon-addon">
                      <IconSearch size={18} stroke={1.5} />
                    </span>
                    <input
                      id="q"
                      type="search"
                      name="q"
                      className="form-control"
                      placeholder="Bina, kod, mahalle, ada/parsel…"
                      defaultValue={p.q ?? ""}
                    />
                  </div>
                </div>

                <div className="col-6 col-md-2">
                  <label className="form-label" htmlFor="durum">
                    Durum
                  </label>
                  <select id="durum" name="durum" className="form-select" defaultValue={p.durum ?? ""}>
                    <option value="">Tümü</option>
                    {BINA_DURUMLARI.map((d) => (
                      <option key={d.deger} value={d.deger}>
                        {d.etiket}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="col-6 col-md-2">
                  <label className="form-label" htmlFor="risk">
                    Risk
                  </label>
                  <select id="risk" name="risk" className="form-select" defaultValue={p.risk ?? ""}>
                    <option value="">Tümü</option>
                    {RISK_DURUMLARI.map((d) => (
                      <option key={d.deger} value={d.deger}>
                        {d.etiket}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="col-6 col-md-2">
                  <label className="form-label" htmlFor="asama">
                    Aşama
                  </label>
                  <select id="asama" name="asama" className="form-select" defaultValue={p.asama ?? ""}>
                    <option value="">Tümü</option>
                    {SUREC_ADIMLARI.map((d) => (
                      <option key={d.deger} value={d.deger}>
                        {d.etiket}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="col-6 col-md-2">
                  <label className="form-label" htmlFor="ilce">
                    İlçe
                  </label>
                  <select id="ilce" name="ilce" className="form-select" defaultValue={p.ilce ?? ""}>
                    <option value="">Tümü</option>
                    {ilceler.map((i) => (
                      <option key={i.ilce} value={i.ilce}>
                        {i.ilce}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="col-6 col-md-2">
                  <label className="form-label" htmlFor="danisman">
                    Danışman
                  </label>
                  <select id="danisman" name="danisman" className="form-select" defaultValue={p.danisman ?? ""}>
                    <option value="">Tümü</option>
                    {danismanlar.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.ad}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="col-12 col-md-auto">
                  <div className="btn-list">
                    <button type="submit" className="btn btn-primary">
                      <IconFilter size={18} stroke={1.5} className="me-1" />
                      Filtrele
                    </button>
                    {filtreVar && (
                      <Link href="/binalar" className="btn">
                        Temizle
                      </Link>
                    )}
                  </div>
                </div>
              </form>
            </div>
          </div>

          {/* ------------------------------------------------------------ Liste */}
          <div className="card">
            {binalar.length === 0 ? (
              <div className="card-body">
                <BosDurum
                  baslik={filtreVar ? "Filtreye uyan dosya bulunamadı" : "Henüz bina dosyası yok"}
                  aciklama={
                    filtreVar
                      ? "Farklı bir arama veya filtre deneyin."
                      : "İlk bina dosyanızı ekleyerek takibe başlayın."
                  }
                  aksiyon={
                    filtreVar ? (
                      <Link href="/binalar" className="btn btn-primary">
                        Filtreyi temizle
                      </Link>
                    ) : duzenlenebilir ? (
                      <Link href={modalYolu({ yeni: "1" })} scroll={false} className="btn btn-primary">
                        Yeni Bina Dosyası
                      </Link>
                    ) : null
                  }
                />
              </div>
            ) : (
              <>
                <div className="table-responsive">
                  <table className="table table-vcenter card-table table-hover">
                    <thead>
                      <tr>
                        <th>Bina</th>
                        <th>Konum</th>
                        <th>Risk</th>
                        <th>Aşama</th>
                        <th style={{ width: "12%" }}>İlerleme</th>
                        <th>Onay oranı</th>
                        <th>Müteahhit</th>
                        <th>Danışman</th>
                        <th>Durum</th>
                      </tr>
                    </thead>
                    <tbody>
                      {binalar.map((b) => {
                        const ozet = onayOzeti(b.hisseler);
                        const ilerleme = asamaYuzdesi(b.asama);
                        return (
                          <TiklanirSatir key={b.id} yol={modalYolu({ profil: b.id })}>
                            <td>
                              {/* Satırın tamamı tıklanabilir; bu bağlantı
                                  klavyeyle erişim için duruyor. */}
                              <Link
                                href={modalYolu({ profil: b.id })}
                                scroll={false}
                                className="text-reset d-block fw-medium"
                              >
                                {b.baslik}
                              </Link>
                              <div className="text-secondary small">
                                {b.kod}
                                {b.oncelik === "YUKSEK" && (
                                  <span className="badge bg-red-lt ms-2">{ONCELIK.YUKSEK.etiket} öncelik</span>
                                )}
                              </div>
                            </td>
                            <td className="text-secondary">
                              <div>{b.ilce}</div>
                              <div className="small">{b.mahalle}</div>
                            </td>
                            <td>
                              <Rozet harita={RISK_DURUMU} deger={b.riskDurumu} />
                            </td>
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
                              <span className={ozet.cogunlukSaglandi ? "text-green fw-medium" : ""}>
                                {yuzde(ozet.olumluOran, 0)}
                              </span>
                              <div className="text-secondary small">
                                {sayi(ozet.olumluAdet)}/{sayi(ozet.bolumSayisi)} bölüm
                              </div>
                            </td>
                            <td className="text-secondary">
                              {b.muteahhit ? (
                                <Link href={`/muteahhitler/${b.muteahhit.id}`} className="text-reset">
                                  {b.muteahhit.firmaAdi}
                                </Link>
                              ) : (
                                "—"
                              )}
                            </td>
                            <td className="text-secondary">{b.danisman?.ad ?? "—"}</td>
                            <td>
                              <Rozet harita={BINA_DURUMU} deger={b.durum} />
                              <div className="text-secondary small mt-1">{tarih(b.guncellemeTarihi)}</div>
                            </td>
                          </TiklanirSatir>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                <Sayfalama
                  toplam={toplam}
                  sayfa={sayfa}
                  adet={SAYFA_ADEDI}
                  temelYol="/binalar"
                  parametreler={{
                    q: p.q,
                    durum: p.durum,
                    risk: p.risk,
                    asama: p.asama,
                    ilce: p.ilce,
                    danisman: p.danisman,
                  }}
                />
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
