"use client";

import { IconArrowLeft } from "@tabler/icons-react";
import { UrlModal, useModalKapat } from "@/components/modal";
import { useProfileDon } from "@/components/profil-modali";
import { BinaFormu } from "./bina-formu";

type BinaVerisi = Parameters<typeof BinaFormu>[0]["bina"];

export function BinaModali({
  bina,
  danismanlar,
  muteahhitler,
  /** Profil modalından gelindiyse o profilin kimliği; alt düğme "Geri" olur. */
  geriProfilId,
}: {
  bina?: BinaVerisi;
  danismanlar: { id: string; ad: string }[];
  muteahhitler: { id: string; firmaAdi: string; durum: string }[];
  geriProfilId?: string;
}) {
  const kapat = useModalKapat();
  const profileDon = useProfileDon(geriProfilId);

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
        onIptal={() => (geriProfilId ? profileDon() : kapat())}
        onBasarili={() => (geriProfilId ? profileDon(true) : kapat(true))}
        iptalMetni={geriProfilId ? "Geri" : undefined}
        iptalIkonu={geriProfilId ? <IconArrowLeft size={16} stroke={1.6} className="me-1" /> : undefined}
      />
    </UrlModal>
  );
}
