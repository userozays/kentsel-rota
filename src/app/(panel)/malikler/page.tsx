import type { Metadata } from "next";
import Link from "next/link";
import { IconDownload,
  IconEdit, IconFilter, IconMail, IconPhone, IconPlus, IconSearch } from "@tabler/icons-react";
import type { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { oturumGerekli } from "@/lib/oturum";
import { MALIK_TIPI, MALIK_TIPLERI, ONAY_DURUMLARI, ONAY_DURUMU, yazabilir } from "@/lib/sabitler";
import { sayi } from "@/lib/yardimcilar";
import { aramaKelimeleri } from "@/lib/arama";
import { Avatar, BosDurum, Rozet, SayfaBasligi } from "@/components/ortak";
import { Sayfalama } from "@/components/sayfalama";
import { MalikModali } from "./malik-modali";

export const metadata: Metadata = { title: "Malikler" };
export const dynamic = "force-dynamic";

const SAYFA_ADEDI = 30;

export default async function MaliklerSayfasi({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const oturum = await oturumGerekli();
  const p = await searchParams;
  const sayfa = Math.max(1, Number(p.sayfa) || 1);

  const kosullar: Prisma.MalikWhereInput[] = [];
  for (const kelime of aramaKelimeleri(p.q)) {
    kosullar.push({ aramaMetni: { contains: kelime } });
  }
  if (p.tip) kosullar.push({ tip: p.tip });
  if (p.onay) kosullar.push({ hisseler: { some: { onayDurumu: p.onay } } });
  if (p.bina) kosullar.push({ hisseler: { some: { binaId: p.bina } } });

  const where: Prisma.MalikWhereInput = kosullar.length ? { AND: kosullar } : {};

  const [toplam, malikler, binalar] = await Promise.all([
    db.malik.count({ where }),
    db.malik.findMany({
      where,
      include: {
        hisseler: {
          include: { bina: { select: { id: true, baslik: true, ilce: true } } },
        },
      },
      orderBy: { adSoyad: "asc" },
      skip: (sayfa - 1) * SAYFA_ADEDI,
      take: SAYFA_ADEDI,
    }),
    db.bina.findMany({ select: { id: true, baslik: true }, orderBy: { baslik: "asc" } }),
  ]);

  const filtreVar = Boolean(p.q || p.tip || p.onay || p.bina);
  const duzenlenebilir = yazabilir(oturum.rol);

  const modalAcik = duzenlenebilir && (p.yeni === "1" || Boolean(p.duzenle));
  const duzenlenecek = modalAcik && p.duzenle ? await db.malik.findUnique({ where: { id: p.duzenle } }) : null;

  /** Ekrandaki filtreleri koruyarak CSV bağlantısı üretir */
  const disaAktarYolu = () => {
    const q = new URLSearchParams();
    for (const [ad, deger] of Object.entries(p)) {
      if (deger && !["yeni", "duzenle", "sayfa"].includes(ad)) q.set(ad, deger);
    }
    const s = q.toString();
    return s ? "/malikler/disa-aktar?" + s : "/malikler/disa-aktar";
  };

  const modalYolu = (ek: Record<string, string>) => {
    const q = new URLSearchParams();
    for (const [ad, deger] of Object.entries(p)) {
      if (deger && ad !== "yeni" && ad !== "duzenle") q.set(ad, deger);
    }
    for (const [ad, deger] of Object.entries(ek)) q.set(ad, deger);
    return `/malikler?${q.toString()}`;
  };

  return (
    <>
      <SayfaBasligi
        ustBaslik="Portföy"
        baslik="Malikler"
        aciklama={`${sayi(toplam)} kişi listeleniyor`}
        aksiyonlar={
          duzenlenebilir ? (
            <>
            <a href={disaAktarYolu()} className="btn">
              <IconDownload size={18} stroke={1.5} className="me-1" />
              Dışa Aktar
            </a>
            <Link href={modalYolu({ yeni: "1" })} scroll={false} className="btn btn-primary">
              <IconPlus size={18} stroke={1.5} className="me-1" />
              Yeni Malik
            </Link>
            </>
          ) : null
        }
      />

      {modalAcik && <MalikModali malik={duzenlenecek ?? undefined} />}

      <div className="page-body">
        <div className="container-fluid">
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
                      placeholder="Ad soyad, T.C., telefon, e-posta…"
                      defaultValue={p.q ?? ""}
                    />
                  </div>
                </div>

                <div className="col-6 col-md-2">
                  <label className="form-label" htmlFor="tip">
                    Kişi tipi
                  </label>
                  <select id="tip" name="tip" className="form-select" defaultValue={p.tip ?? ""}>
                    <option value="">Tümü</option>
                    {MALIK_TIPLERI.map((t) => (
                      <option key={t.deger} value={t.deger}>
                        {t.etiket}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="col-6 col-md-2">
                  <label className="form-label" htmlFor="onay">
                    Onay durumu
                  </label>
                  <select id="onay" name="onay" className="form-select" defaultValue={p.onay ?? ""}>
                    <option value="">Tümü</option>
                    {ONAY_DURUMLARI.map((o) => (
                      <option key={o.deger} value={o.deger}>
                        {o.etiket}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="col-12 col-md-3">
                  <label className="form-label" htmlFor="bina">
                    Bina
                  </label>
                  <select id="bina" name="bina" className="form-select" defaultValue={p.bina ?? ""}>
                    <option value="">Tümü</option>
                    {binalar.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.baslik}
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
                      <Link href="/malikler" className="btn">
                        Temizle
                      </Link>
                    )}
                  </div>
                </div>
              </form>
            </div>
          </div>

          <div className="card">
            {malikler.length === 0 ? (
              <div className="card-body">
                <BosDurum
                  baslik={filtreVar ? "Filtreye uyan malik bulunamadı" : "Henüz malik kaydı yok"}
                  aksiyon={
                    filtreVar ? (
                      <Link href="/malikler" className="btn btn-primary">
                        Filtreyi temizle
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
                        <th>Malik</th>
                        <th>İletişim</th>
                        <th>Bina / bağımsız bölüm</th>
                        <th>Onay durumu</th>
                        {duzenlenebilir && <th style={{ width: "1%" }} />}
                      </tr>
                    </thead>
                    <tbody>
                      {malikler.map((m) => (
                        <tr key={m.id}>
                          <td>
                            <div className="d-flex align-items-center gap-2">
                              <Avatar ad={m.adSoyad} anahtar={m.id} boyut="sm" />
                              <div>
                                <Link href={`/malikler/${m.id}`} className="text-reset d-block fw-medium">
                                  {m.adSoyad}
                                </Link>
                                <div className="text-secondary small">
                                  <Rozet harita={MALIK_TIPI} deger={m.tip} />
                                  {m.tcKimlik && <span className="ms-2">{m.tcKimlik}</span>}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="text-secondary small">
                            {m.telefon && (
                              <div className="d-flex align-items-center gap-1">
                                <IconPhone size={14} stroke={1.5} />
                                <a href={`tel:${m.telefon.replace(/\s/g, "")}`} className="text-reset">
                                  {m.telefon}
                                </a>
                              </div>
                            )}
                            {m.email && (
                              <div className="d-flex align-items-center gap-1">
                                <IconMail size={14} stroke={1.5} />
                                <a href={`mailto:${m.email}`} className="text-reset">
                                  {m.email}
                                </a>
                              </div>
                            )}
                            {!m.telefon && !m.email && "—"}
                          </td>
                          <td>
                            {m.hisseler.length === 0 ? (
                              <span className="text-secondary">Bina bağlantısı yok</span>
                            ) : (
                              m.hisseler.slice(0, 3).map((h) => (
                                <div key={h.id} className="small">
                                  <Link href={`/binalar/${h.bina.id}`} className="text-reset">
                                    {h.bina.baslik}
                                  </Link>
                                  {h.bagimsizBolumNo && (
                                    <span className="text-secondary"> · B.B. {h.bagimsizBolumNo}</span>
                                  )}
                                </div>
                              ))
                            )}
                            {m.hisseler.length > 3 && (
                              <div className="text-secondary small">+{m.hisseler.length - 3} bölüm daha</div>
                            )}
                          </td>
                          <td>
                            <div className="d-flex flex-wrap gap-1">
                              {[...new Set(m.hisseler.map((h) => h.onayDurumu))].map((d) => (
                                <Rozet key={d} harita={ONAY_DURUMU} deger={d} />
                              ))}
                              {m.hisseler.length === 0 && <span className="text-secondary">—</span>}
                            </div>
                          </td>
                          {duzenlenebilir && (
                            <td>
                              <Link
                                href={modalYolu({ duzenle: m.id })}
                                scroll={false}
                                className="btn btn-sm btn-icon"
                                title="Düzenle"
                                aria-label={`${m.adSoyad} kaydını düzenle`}
                              >
                                <IconEdit size={16} stroke={1.5} />
                              </Link>
                            </td>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <Sayfalama
                  toplam={toplam}
                  sayfa={sayfa}
                  adet={SAYFA_ADEDI}
                  temelYol="/malikler"
                  parametreler={{ q: p.q, tip: p.tip, onay: p.onay, bina: p.bina }}
                />
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
