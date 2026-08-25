"use client";

import { UrlModal, useModalKapat } from "@/components/modal";
import { BinaFormu } from "./bina-formu";

type BinaVerisi = Parameters<typeof BinaFormu>[0]["bina"];

export function BinaModali({
  bina,
  danismanlar,
  muteahhitler,
}: {
  bina?: BinaVerisi;
  danismanlar: { id: string; ad: string }[];
  muteahhitler: { id: string; firmaAdi: string; durum: string }[];
}) {
  const kapat = useModalKapat();

  return (
    <UrlModal
      baslik={bina ? "Bina dosyasını düzenle" : "Yeni bina dosyası"}
      aciklama={bina ? bina.baslik : "Ada ve parsel bilgisiyle yeni bir takip dosyası açın."}
      boyut="xl"
      kendiGovdesi
    >
      <BinaFormu
        bina={bina}
        danismanlar={danismanlar}
        muteahhitler={muteahhitler}
        modalIcinde
        onIptal={() => kapat()}
        onBasarili={() => kapat(true)}
      />
    </UrlModal>
  );
}
