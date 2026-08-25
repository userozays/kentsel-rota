import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { oturumGerekli } from "@/lib/oturum";
import { yazabilir } from "@/lib/sabitler";
import { SayfaBasligi } from "@/components/ortak";
import { MalikFormu } from "../malik-formu";

export const metadata: Metadata = { title: "Yeni Malik" };
export const dynamic = "force-dynamic";

export default async function YeniMalikSayfasi() {
  const oturum = await oturumGerekli();
  if (!yazabilir(oturum.rol)) redirect("/malikler");

  return (
    <>
      <SayfaBasligi ustBaslik="Malikler" baslik="Yeni Malik" />
      <div className="page-body">
        <div className="container-xl">
          <div className="row justify-content-center">
            <div className="col-lg-9">
              <MalikFormu />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
