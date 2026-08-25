import type { Metadata } from "next";
import Link from "next/link";
import { IconEdit, IconPlus } from "@tabler/icons-react";
import { db } from "@/lib/db";
import { yoneticiGerekli } from "@/lib/oturum";
import { ROL } from "@/lib/sabitler";
import { goreceli, sayi, tarih } from "@/lib/yardimcilar";
import { Avatar, Rozet, SayfaBasligi, Uyari } from "@/components/ortak";
import { DurumDugmesi } from "./kullanici-formu";

export const metadata: Metadata = { title: "Kullanıcılar" };
export const dynamic = "force-dynamic";

export default async function KullanicilarSayfasi() {
  const oturum = await yoneticiGerekli();

  const kullanicilar = await db.kullanici.findMany({
    orderBy: [{ aktif: "desc" }, { ad: "asc" }],
    include: { _count: { select: { binalar: true, aktiviteler: true } } },
  });

  return (
    <>
      <SayfaBasligi
        ustBaslik="Yönetim"
        baslik="Kullanıcılar"
        aciklama={`${sayi(kullanicilar.filter((k) => k.aktif).length)} aktif / ${sayi(kullanicilar.length)} toplam hesap`}
        aksiyonlar={
          <Link href="/kullanicilar/yeni" className="btn btn-primary">
            <IconPlus size={18} stroke={1.5} className="me-1" />
            Yeni Kullanıcı
          </Link>
        }
      />

      <div className="page-body">
        <div className="container-xl">
          <Uyari tur="info" baslik="Roller ne yapabilir?">
            <ul className="mb-0 ps-3">
              <li>
                <strong>Yönetici:</strong> her şeyi yapabilir; kullanıcı ekler, kayıt siler.
              </li>
              <li>
                <strong>Danışman:</strong> bina, malik, müteahhit kaydı ekler ve düzenler; silemez.
              </li>
              <li>
                <strong>İzleyici:</strong> sadece görüntüler, hiçbir değişiklik yapamaz.
              </li>
            </ul>
          </Uyari>

          <div className="card">
            <div className="table-responsive">
              <table className="table table-vcenter card-table">
                <thead>
                  <tr>
                    <th>Kullanıcı</th>
                    <th>Rol</th>
                    <th>İletişim</th>
                    <th>Yükü</th>
                    <th>Son giriş</th>
                    <th>Durum</th>
                    <th style={{ width: "1%" }} />
                  </tr>
                </thead>
                <tbody>
                  {kullanicilar.map((k) => (
                    <tr key={k.id} className={k.aktif ? "" : "opacity-75"}>
                      <td>
                        <div className="d-flex align-items-center gap-2">
                          <Avatar ad={k.ad} anahtar={k.email} boyut="sm" />
                          <div>
                            <div className="fw-medium">
                              {k.ad}
                              {k.id === oturum.id && <span className="badge bg-blue-lt ms-2">Siz</span>}
                            </div>
                            <div className="text-secondary small">{k.email}</div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <Rozet harita={ROL} deger={k.rol} />
                      </td>
                      <td className="text-secondary">{k.telefon ?? "—"}</td>
                      <td className="text-secondary small">
                        <div>{sayi(k._count.binalar)} dosya</div>
                        <div>{sayi(k._count.aktiviteler)} kayıt</div>
                      </td>
                      <td className="text-secondary small">
                        {k.sonGiris ? (
                          <>
                            <div>{tarih(k.sonGiris)}</div>
                            <div>{goreceli(k.sonGiris)}</div>
                          </>
                        ) : (
                          "Hiç giriş yapmadı"
                        )}
                      </td>
                      <td>
                        {k.aktif ? (
                          <span className="badge bg-green-lt">Aktif</span>
                        ) : (
                          <span className="badge bg-secondary-lt">Pasif</span>
                        )}
                      </td>
                      <td>
                        <div className="btn-list flex-nowrap align-items-center">
                          <DurumDugmesi id={k.id} aktif={k.aktif} kendisi={k.id === oturum.id} />
                          <Link href={`/kullanicilar/${k.id}`} className="btn btn-sm btn-icon" title="Düzenle">
                            <IconEdit size={16} stroke={1.5} />
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
