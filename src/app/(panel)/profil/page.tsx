import type { Metadata } from "next";
import { IconLogout, IconUserExclamation } from "@tabler/icons-react";
import { db } from "@/lib/db";
import { oturumGerekli } from "@/lib/oturum";
import { ROL } from "@/lib/sabitler";
import { goreceli, sayi, tarih } from "@/lib/yardimcilar";
import { Avatar, BilgiSatiri, Rozet, SayfaBasligi } from "@/components/ortak";
import { ProfilBilgiFormu, SifreFormu } from "./profil-formlari";

export const metadata: Metadata = { title: "Profilim" };
export const dynamic = "force-dynamic";

/* Oturum çerezi geçerli ama arkasındaki kullanıcı kaydı yok ya da pasif.
   Tipik sebep: veritabanı yeniden tohumlandı (`npm run kurulum`) ve eski
   çerezdeki kimlik artık hiçbir satıra karşılık gelmiyor.

   Burada `notFound()` çağırmak yanıltıcıydı: kullanıcı "Profilim"e tıklayıp
   "404 — This page could not be found" görüyordu, oysa sayfa duruyor, sorun
   oturumda. Çerezi sayfa render'ı içinde silemiyoruz (Next 15'te cookies()
   yazma yalnızca server action / route handler içinde çalışır), bu yüzden
   durumu anlatıp çıkış düğmesini veriyoruz. */
function OturumGecersiz({ pasif }: { pasif: boolean }) {
  return (
    <>
      <SayfaBasligi ustBaslik="Hesap" baslik="Profilim" />
      <div className="page-body">
        <div className="container-fluid">
          <div className="row justify-content-center">
            <div className="col-md-7 col-lg-5">
              <div className="card">
                <div className="card-body text-center py-4">
                  <span className="krp-istatistik-ikon mx-auto mb-3" data-renk="yellow">
                    <IconUserExclamation size={18} stroke={1.6} />
                  </span>
                  <h3 className="mb-2">Oturumunuz artık geçerli değil</h3>
                  <p className="text-secondary mb-4">
                    {pasif
                      ? "Hesabınız pasif duruma alınmış. Erişim için yöneticinize başvurun."
                      : "Hesabınız bulunamadı. Oturum açtıktan sonra veritabanı yenilenmiş olabilir."}{" "}
                    Çıkış yapıp tekrar giriş yapmanız gerekiyor.
                  </p>
                  <form action="/api/cikis" method="post">
                    <button type="submit" className="btn btn-primary">
                      <IconLogout size={16} stroke={1.6} className="me-1" />
                      Çıkış yap ve tekrar giriş yap
                    </button>
                  </form>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default async function ProfilSayfasi() {
  const oturum = await oturumGerekli();

  const kullanici = await db.kullanici.findUnique({
    where: { id: oturum.id },
    include: { _count: { select: { binalar: true, aktiviteler: true } } },
  });

  if (!kullanici) return <OturumGecersiz pasif={false} />;
  if (!kullanici.aktif) return <OturumGecersiz pasif />;

  return (
    <>
      <SayfaBasligi ustBaslik="Hesap" baslik="Profilim" />

      <div className="page-body">
        <div className="container-fluid">
          <div className="row row-cards">
            <div className="col-lg-4">
              <div className="card">
                <div className="card-body text-center">
                  <Avatar ad={kullanici.ad} anahtar={kullanici.email} boyut="xl" />
                  <h3 className="mt-3 mb-1">{kullanici.ad}</h3>
                  <div className="text-secondary mb-3">{kullanici.email}</div>
                  <Rozet harita={ROL} deger={kullanici.rol} />

                  <div className="mt-4 text-start">
                    <BilgiSatiri etiket="Telefon">{kullanici.telefon ?? "—"}</BilgiSatiri>
                    <BilgiSatiri etiket="Sorumlu dosya">{sayi(kullanici._count.binalar)}</BilgiSatiri>
                    <BilgiSatiri etiket="Kayıt girişi">{sayi(kullanici._count.aktiviteler)}</BilgiSatiri>
                    <BilgiSatiri etiket="Hesap açılışı">{tarih(kullanici.olusturmaTarihi)}</BilgiSatiri>
                    <BilgiSatiri etiket="Son giriş">
                      {kullanici.sonGiris ? goreceli(kullanici.sonGiris) : "—"}
                    </BilgiSatiri>
                  </div>
                </div>
              </div>
            </div>

            <div className="col-lg-8">
              <div className="mb-3">
                <ProfilBilgiFormu ad={kullanici.ad} telefon={kullanici.telefon} />
              </div>
              <SifreFormu />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
