import type { Metadata } from "next";
import Link from "next/link";
import { IconFilter, IconSearch } from "@tabler/icons-react";
import type { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { oturumGerekli } from "@/lib/oturum";
import { AKTIVITE_TURLERI, AKTIVITE_TURU } from "@/lib/sabitler";
import { goreceli, sayi, tarihSaat } from "@/lib/yardimcilar";
import { Avatar, BosDurum, Rozet, SayfaBasligi } from "@/components/ortak";
import { Sayfalama } from "@/components/sayfalama";

export const metadata: Metadata = { title: "Aktiviteler" };
export const dynamic = "force-dynamic";

const SAYFA_ADEDI = 40;

export default async function AktivitelerSayfasi({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  await oturumGerekli();
  const p = await searchParams;
  const sayfa = Math.max(1, Number(p.sayfa) || 1);

  const kosullar: Prisma.AktiviteWhereInput[] = [];
  if (p.q) kosullar.push({ OR: [{ baslik: { contains: p.q } }, { icerik: { contains: p.q } }] });
  if (p.tur) kosullar.push({ tur: p.tur });
  if (p.kullanici) kosullar.push({ kullaniciId: p.kullanici });

  const where: Prisma.AktiviteWhereInput = kosullar.length ? { AND: kosullar } : {};

  const [toplam, aktiviteler, kullanicilar] = await Promise.all([
    db.aktivite.count({ where }),
    db.aktivite.findMany({
      where,
      include: {
        kullanici: { select: { id: true, ad: true } },
        bina: { select: { id: true, baslik: true } },
        malik: { select: { id: true, adSoyad: true } },
        muteahhit: { select: { id: true, firmaAdi: true } },
      },
      orderBy: { tarih: "desc" },
      skip: (sayfa - 1) * SAYFA_ADEDI,
      take: SAYFA_ADEDI,
    }),
    db.kullanici.findMany({ select: { id: true, ad: true }, orderBy: { ad: "asc" } }),
  ]);

  const filtreVar = Boolean(p.q || p.tur || p.kullanici);

  return (
    <>
      <SayfaBasligi ustBaslik="Operasyon" baslik="Aktiviteler" aciklama={`${sayi(toplam)} kayıt`} />

      <div className="page-body">
        <div className="container-xl">
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
                    <input id="q" type="search" name="q" className="form-control" placeholder="Başlık veya içerik…" defaultValue={p.q ?? ""} />
                  </div>
                </div>
                <div className="col-6 col-md-3">
                  <label className="form-label" htmlFor="tur">
                    Tür
                  </label>
                  <select id="tur" name="tur" className="form-select" defaultValue={p.tur ?? ""}>
                    <option value="">Tümü</option>
                    {AKTIVITE_TURLERI.map((t) => (
                      <option key={t.deger} value={t.deger}>
                        {t.etiket}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="col-6 col-md-3">
                  <label className="form-label" htmlFor="kullanici">
                    Kullanıcı
                  </label>
                  <select id="kullanici" name="kullanici" className="form-select" defaultValue={p.kullanici ?? ""}>
                    <option value="">Tümü</option>
                    {kullanicilar.map((k) => (
                      <option key={k.id} value={k.id}>
                        {k.ad}
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
                      <Link href="/aktiviteler" className="btn">
                        Temizle
                      </Link>
                    )}
                  </div>
                </div>
              </form>
            </div>
          </div>

          <div className="card">
            {aktiviteler.length === 0 ? (
              <div className="card-body">
                <BosDurum baslik={filtreVar ? "Filtreye uyan kayıt yok" : "Henüz aktivite yok"} />
              </div>
            ) : (
              <>
                <div className="card-body">
                  <div className="divide-y">
                    {aktiviteler.map((a) => (
                      <div key={a.id} className="py-3">
                        <div className="row g-3 align-items-start">
                          <div className="col-auto">
                            <Avatar ad={a.kullanici.ad} boyut="sm" />
                          </div>
                          <div className="col">
                            <div className="fw-medium">{a.baslik}</div>
                            {a.icerik && <div className="text-secondary small mt-1">{a.icerik}</div>}
                            <div className="text-secondary small mt-1 d-flex flex-wrap gap-2">
                              <span>{a.kullanici.ad}</span>
                              <span>·</span>
                              <span>{tarihSaat(a.tarih)}</span>
                              <span>·</span>
                              <span>{goreceli(a.tarih)}</span>
                              {a.bina && (
                                <>
                                  <span>·</span>
                                  <Link href={`/binalar/${a.bina.id}`} className="text-reset">
                                    {a.bina.baslik}
                                  </Link>
                                </>
                              )}
                              {a.malik && (
                                <>
                                  <span>·</span>
                                  <Link href={`/malikler/${a.malik.id}`} className="text-reset">
                                    {a.malik.adSoyad}
                                  </Link>
                                </>
                              )}
                              {a.muteahhit && (
                                <>
                                  <span>·</span>
                                  <Link href={`/muteahhitler/${a.muteahhit.id}`} className="text-reset">
                                    {a.muteahhit.firmaAdi}
                                  </Link>
                                </>
                              )}
                            </div>
                          </div>
                          <div className="col-auto">
                            <Rozet harita={AKTIVITE_TURU} deger={a.tur} />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <Sayfalama
                  toplam={toplam}
                  sayfa={sayfa}
                  adet={SAYFA_ADEDI}
                  temelYol="/aktiviteler"
                  parametreler={{ q: p.q, tur: p.tur, kullanici: p.kullanici }}
                />
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
