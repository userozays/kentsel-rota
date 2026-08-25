import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { oturumGerekli } from "@/lib/oturum";
import { ROL } from "@/lib/sabitler";
import { goreceli, sayi, tarih } from "@/lib/yardimcilar";
import { Avatar, BilgiSatiri, Rozet, SayfaBasligi } from "@/components/ortak";
import { ProfilBilgiFormu, SifreFormu } from "./profil-formlari";

export const metadata: Metadata = { title: "Profilim" };
export const dynamic = "force-dynamic";

export default async function ProfilSayfasi() {
  const oturum = await oturumGerekli();

  const kullanici = await db.kullanici.findUnique({
    where: { id: oturum.id },
    include: { _count: { select: { binalar: true, aktiviteler: true } } },
  });

  if (!kullanici) notFound();

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
