import type { Metadata } from "next";
import Link from "next/link";
import {
  IconDownload,
  IconExternalLink,
  IconFilter,
  IconMail,
  IconPhone,
  IconPlus,
  IconSearch,
} from "@tabler/icons-react";
import type { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { oturumGerekli } from "@/lib/oturum";
import { MUTEAHHIT_DURUMLARI, MUTEAHHIT_DURUMU, yazabilir } from "@/lib/sabitler";
import { sayi } from "@/lib/yardimcilar";
import { aramaKelimeleri } from "@/lib/arama";
import { belgeleriGetir } from "@/lib/belge-listesi";
import { Avatar, BosDurum, IstatistikKart, Rozet, SayfaBasligi, YildizPuan } from "@/components/ortak";
import { MuteahhitModali } from "./muteahhit-modali";
import { MuteahhitGovdesi } from "./muteahhit-govdesi";
import { muteahhitDetayiGetir } from "./muteahhit-verisi";
import { ProfilModali } from "@/components/profil-modali";

export const metadata: Metadata = { title: "Müteahhitler" };
export const dynamic = "force-dynamic";

export default async function MuteahhitlerSayfasi({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const oturum = await oturumGerekli();
  const p = await searchParams;

  const kosullar: Prisma.MuteahhitWhereInput[] = [];
  for (const kelime of aramaKelimeleri(p.q)) {
    kosullar.push({ aramaMetni: { contains: kelime } });
  }
  if (p.durum) kosullar.push({ durum: p.durum });
  if (p.puan) kosullar.push({ puan: { gte: Number(p.puan) } });

  const where: Prisma.MuteahhitWhereInput = kosullar.length ? { AND: kosullar } : {};

  const [muteahhitler, tumu] = await Promise.all([
    db.muteahhit.findMany({
      where,
      include: { _count: { select: { binalar: true } } },
      orderBy: [{ durum: "asc" }, { puan: "desc" }, { firmaAdi: "asc" }],
    }),
    db.muteahhit.findMany({ select: { durum: true, tamamlananProje: true, toplamDaire: true } }),
  ]);

  const filtreVar = Boolean(p.q || p.durum || p.puan);
  const duzenlenebilir = yazabilir(oturum.rol);

  /* Modal önceliği: `duzenle` varsa düzenleme modalı açılır. `profil` de
     adreste duruyorsa düzenleme modalındaki "Geri" oraya döner. */
  const modalAcik = duzenlenebilir && (p.yeni === "1" || Boolean(p.duzenle));
  const duzenlenecek =
    modalAcik && p.duzenle ? await db.muteahhit.findUnique({ where: { id: p.duzenle } }) : null;

  /* Karta tıklanınca açılan profil modalı: detay sayfasının gövdesinin
     aynısını gösterir. İzleyici rolü de görebilir. */
  const profil = p.profil && !modalAcik ? await muteahhitDetayiGetir(p.profil) : null;
  const profilBelgeleri = profil ? await belgeleriGetir({ muteahhitId: profil.id }, oturum) : [];

  /** Ekrandaki filtreleri koruyarak CSV bağlantısı üretir */
  const disaAktarYolu = () => {
    const q = new URLSearchParams();
    for (const [ad, deger] of Object.entries(p)) {
      if (deger && !["yeni", "duzenle", "profil", "sayfa"].includes(ad)) q.set(ad, deger);
    }
    const s = q.toString();
    return s ? "/muteahhitler/disa-aktar?" + s : "/muteahhitler/disa-aktar";
  };

  const modalYolu = (ek: Record<string, string>) => {
    const q = new URLSearchParams();
    for (const [ad, deger] of Object.entries(p)) {
      if (deger && ad !== "yeni" && ad !== "duzenle" && ad !== "profil") q.set(ad, deger);
    }
    for (const [ad, deger] of Object.entries(ek)) q.set(ad, deger);
    return `/muteahhitler?${q.toString()}`;
  };

  return (
    <>
      <SayfaBasligi
        ustBaslik="Portföy"
        baslik="Müteahhitler"
        aciklama={`${sayi(muteahhitler.length)} firma listeleniyor`}
        aksiyonlar={
          duzenlenebilir ? (
            <>
              <Link href={modalYolu({ yeni: "1" })} scroll={false} className="btn btn-primary">
                <IconPlus size={18} stroke={1.5} className="me-1" />
                Yeni Müteahhit
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
        <MuteahhitModali
          muteahhit={duzenlenecek ?? undefined}
          geriProfilId={p.profil && p.duzenle === p.profil ? p.profil : undefined}
        />
      )}
      {profil && (
        <ProfilModali
          kayitId={profil.id}
          baslik={profil.firmaAdi}
          aciklama={
            <span className="d-inline-flex flex-wrap align-items-center gap-2">
              <span>{profil.kod}</span>
              {profil.yetkiliKisi && <span>· {profil.yetkiliKisi}</span>}
              <YildizPuan puan={profil.puan} />
              <Rozet harita={MUTEAHHIT_DURUMU} deger={profil.durum} />
            </span>
          }
          duzenlenebilir={duzenlenebilir}
        >
          <MuteahhitGovdesi
            muteahhit={profil}
            belgeler={profilBelgeleri}
            duzenlenebilir={duzenlenebilir}
          />
        </ProfilModali>
      )}

      <div className="page-body">
        <div className="container-fluid">
          <div className="row row-deck row-cards mb-3">
            <div className="col-sm-6 col-lg-3">
              <IstatistikKart baslik="Toplam firma" deger={sayi(tumu.length)} renk="primary" />
            </div>
            <div className="col-sm-6 col-lg-3">
              <IstatistikKart
                baslik="Aktif çalışılan"
                deger={sayi(tumu.filter((m) => m.durum === "AKTIF").length)}
                renk="green"
              />
            </div>
            <div className="col-sm-6 col-lg-3">
              <IstatistikKart
                baslik="Kara listede"
                deger={sayi(tumu.filter((m) => m.durum === "KARA_LISTE").length)}
                renk="red"
              />
            </div>
            <div className="col-sm-6 col-lg-3">
              <IstatistikKart
                baslik="Portföy referansı"
                deger={sayi(tumu.reduce((t, m) => t + m.toplamDaire, 0))}
                altBilgi="toplam teslim edilen daire"
                renk="azure"
              />
            </div>
          </div>

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
                      placeholder="Firma, yetkili, bölge, telefon…"
                      defaultValue={p.q ?? ""}
                    />
                  </div>
                </div>
                <div className="col-6 col-md-3">
                  <label className="form-label" htmlFor="durum">
                    Durum
                  </label>
                  <select id="durum" name="durum" className="form-select" defaultValue={p.durum ?? ""}>
                    <option value="">Tümü</option>
                    {MUTEAHHIT_DURUMLARI.map((d) => (
                      <option key={d.deger} value={d.deger}>
                        {d.etiket}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="col-6 col-md-3">
                  <label className="form-label" htmlFor="puan">
                    En az puan
                  </label>
                  <select id="puan" name="puan" className="form-select" defaultValue={p.puan ?? ""}>
                    <option value="">Farketmez</option>
                    {[5, 4, 3, 2, 1].map((n) => (
                      <option key={n} value={n}>
                        {n} yıldız ve üzeri
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
                      <Link href="/muteahhitler" className="btn">
                        Temizle
                      </Link>
                    )}
                  </div>
                </div>
              </form>
            </div>
          </div>

          {muteahhitler.length === 0 ? (
            <div className="card">
              <div className="card-body">
                <BosDurum
                  baslik={filtreVar ? "Filtreye uyan firma bulunamadı" : "Henüz müteahhit kaydı yok"}
                  aksiyon={
                    filtreVar ? (
                      <Link href="/muteahhitler" className="btn btn-primary">
                        Filtreyi temizle
                      </Link>
                    ) : duzenlenebilir ? (
                      <Link href={modalYolu({ yeni: "1" })} scroll={false} className="btn btn-primary">
                        Yeni Müteahhit
                      </Link>
                    ) : null
                  }
                />
              </div>
            </div>
          ) : (
            <div className="row row-cards">
              {muteahhitler.map((m) => (
                <div key={m.id} className="col-md-6 col-xl-4">
                  <div className={`card h-100 krp-kart-tiklanir${m.durum === "KARA_LISTE" ? " border-red" : ""}`}>
                    <div className="card-body d-flex flex-column position-relative">
                      <div className="d-flex align-items-start gap-2 mb-3">
                        <Avatar ad={m.firmaAdi} anahtar={m.kod} />
                        <div className="flex-fill min-w-0">
                          {/* stretched-link: kartın herhangi bir yerine tıklamak
                              profili açar. Alttaki eylem düğmeleri .krp-kart-eylem
                              ile bu katmanın üstünde kalır. */}
                          <Link
                            href={modalYolu({ profil: m.id })}
                            scroll={false}
                            className="text-reset d-block fw-medium text-truncate stretched-link"
                          >
                            {m.firmaAdi}
                          </Link>
                          <div className="text-secondary small">
                            {m.kod}
                            {m.yetkiliKisi ? ` · ${m.yetkiliKisi}` : ""}
                          </div>
                        </div>
                        <div className="flex-shrink-0">
                          <Rozet harita={MUTEAHHIT_DURUMU} deger={m.durum} />
                        </div>
                      </div>

                      <div className="mb-3">
                        <YildizPuan puan={m.puan} />
                      </div>

                      <div className="row text-center mb-3 g-2">
                        <div className="col">
                          <div className="h3 m-0">{sayi(m.tamamlananProje)}</div>
                          <div className="text-secondary small">Tamamlanan</div>
                        </div>
                        <div className="col">
                          <div className="h3 m-0">{sayi(m.devamEdenProje)}</div>
                          <div className="text-secondary small">Devam eden</div>
                        </div>
                        <div className="col">
                          <div className="h3 m-0">{sayi(m._count.binalar)}</div>
                          <div className="text-secondary small">Bizim dosya</div>
                        </div>
                      </div>

                      {m.calismaBolgeleri && (
                        <div className="text-secondary small mb-3">
                          <span className="d-block text-uppercase" style={{ fontSize: "0.7rem", letterSpacing: "0.04em" }}>
                            Çalışma bölgeleri
                          </span>
                          {m.calismaBolgeleri}
                        </div>
                      )}

                      <div className="mt-auto d-flex flex-wrap gap-2 krp-kart-eylem">
                        {m.telefon && (
                          <a href={`tel:${m.telefon.replace(/\s/g, "")}`} className="btn btn-sm">
                            <IconPhone size={15} stroke={1.5} className="me-1" />
                            Ara
                          </a>
                        )}
                        {m.email && (
                          <a href={`mailto:${m.email}`} className="btn btn-sm">
                            <IconMail size={15} stroke={1.5} className="me-1" />
                            E-posta
                          </a>
                        )}
                        {m.websitesi && (
                          <a href={m.websitesi} target="_blank" rel="noreferrer noopener" className="btn btn-sm">
                            <IconExternalLink size={15} stroke={1.5} className="me-1" />
                            Site
                          </a>
                        )}
                        {/* Düzenle burada değil: kart profili açıyor, düzenleme
                            profil modalının içinden yapılıyor. */}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
