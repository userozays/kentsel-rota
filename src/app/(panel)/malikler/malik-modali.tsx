"use client";

import { UrlModal, useModalKapat } from "@/components/modal";
import { MalikFormu } from "./malik-formu";

type MalikVerisi = Parameters<typeof MalikFormu>[0]["malik"];

export function MalikModali({ malik }: { malik?: MalikVerisi }) {
  const kapat = useModalKapat();

  return (
    <UrlModal
      baslik={malik ? "Malik kaydını düzenle" : "Yeni malik"}
      aciklama={malik ? malik.adSoyad : "Kişi veya tüzel kişi kaydı oluşturun."}
      boyut="lg"
      kendiGovdesi
    >
      <MalikFormu malik={malik} modalIcinde onIptal={() => kapat()} onBasarili={() => kapat(true)} />
    </UrlModal>
  );
}
