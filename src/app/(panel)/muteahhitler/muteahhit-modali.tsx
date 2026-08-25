"use client";

import { UrlModal, useModalKapat } from "@/components/modal";
import { MuteahhitFormu } from "./muteahhit-formu";

type MuteahhitVerisi = Parameters<typeof MuteahhitFormu>[0]["muteahhit"];

export function MuteahhitModali({ muteahhit }: { muteahhit?: MuteahhitVerisi }) {
  const kapat = useModalKapat();

  return (
    <UrlModal
      baslik={muteahhit ? "Müteahhit kaydını düzenle" : "Yeni müteahhit"}
      aciklama={muteahhit ? muteahhit.firmaAdi : "Portföyünüze yeni bir firma ekleyin."}
      boyut="xl"
      kendiGovdesi
    >
      <MuteahhitFormu
        muteahhit={muteahhit}
        modalIcinde
        onIptal={() => kapat()}
        onBasarili={() => kapat(true)}
      />
    </UrlModal>
  );
}
