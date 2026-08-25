import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { oturumGerekli } from "@/lib/oturum";
import { yazabilir } from "@/lib/sabitler";
import { SayfaBasligi } from "@/components/ortak";
import { MuteahhitFormu } from "../muteahhit-formu";

export const metadata: Metadata = { title: "Yeni Muteahhit" };
export const dynamic = "force-dynamic";

export default async function YeniMuteahhitSayfasi() {
  const oturum = await oturumGerekli();
  if (!yazabilir(oturum.rol)) redirect("/muteahhitler");

  return (
    <>
      <SayfaBasligi ustBaslik="Muteahhitler" baslik="Yeni Muteahhit" />
      <div className="page-body">
        <div className="container-fluid">
          <MuteahhitFormu />
        </div>
      </div>
    </>
  );
}
