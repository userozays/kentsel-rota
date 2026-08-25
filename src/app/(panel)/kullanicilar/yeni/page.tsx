import type { Metadata } from "next";
import { yoneticiGerekli } from "@/lib/oturum";
import { SayfaBasligi } from "@/components/ortak";
import { KullaniciFormu } from "../kullanici-formu";

export const metadata: Metadata = { title: "Yeni Kullanici" };
export const dynamic = "force-dynamic";

export default async function YeniKullaniciSayfasi() {
  await yoneticiGerekli();
  return (
    <>
      <SayfaBasligi ustBaslik="Yonetim" baslik="Yeni Kullanici" />
      <div className="page-body">
        <div className="container-fluid">
          <div className="row justify-content-center">
            <div className="col-lg-9">
              <KullaniciFormu />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
