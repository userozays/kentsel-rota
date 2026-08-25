import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { yoneticiGerekli } from "@/lib/oturum";
import { SayfaBasligi } from "@/components/ortak";
import { KullaniciFormu, KullaniciSilDugmesi } from "../kullanici-formu";

export const metadata: Metadata = { title: "Kullanici Duzenle" };
export const dynamic = "force-dynamic";

export default async function KullaniciDuzenleSayfasi({ params }: { params: Promise<{ id: string }> }) {
  const oturum = await yoneticiGerekli();
  const { id } = await params;

  const kullanici = await db.kullanici.findUnique({ where: { id } });
  if (!kullanici) notFound();

  return (
    <>
      <SayfaBasligi
        ustBaslik="Yonetim"
        baslik={kullanici.ad}
        aksiyonlar={
          kullanici.id === oturum.id ? null : (
            <KullaniciSilDugmesi id={kullanici.id} ad={kullanici.ad} />
          )
        }
      />
      <div className="page-body">
        <div className="container-xl">
          <div className="row justify-content-center">
            <div className="col-lg-9">
              <KullaniciFormu kullanici={kullanici} />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
