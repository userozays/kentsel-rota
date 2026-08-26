"use client";

import { IconArrowLeft } from "@tabler/icons-react";
import { UrlModal, useModalKapat } from "@/components/modal";
import { useProfileDon } from "@/components/profil-modali";
import { MalikFormu } from "./malik-formu";

type MalikVerisi = Parameters<typeof MalikFormu>[0]["malik"];

export function MalikModali({
  malik,
  /** Profil modalından gelindiyse o profilin kimliği; alt düğme "Geri" olur. */
  geriProfilId,
}: {
  malik?: MalikVerisi;
  geriProfilId?: string;
}) {
  const kapat = useModalKapat();
  const profileDon = useProfileDon(geriProfilId);

  return (
    <UrlModal
      baslik={malik ? "Malik kaydını düzenle" : "Yeni malik"}
      aciklama={malik ? malik.adSoyad : "Kişi veya tüzel kişi kaydı oluşturun."}
      boyut="lg"
      kendiGovdesi
    >
      <MalikFormu
        malik={malik}
        modalIcinde
        onIptal={() => (geriProfilId ? profileDon() : kapat())}
        onBasarili={() => (geriProfilId ? profileDon(true) : kapat(true))}
        iptalMetni={geriProfilId ? "Geri" : undefined}
        iptalIkonu={
          geriProfilId ? <IconArrowLeft size={16} stroke={1.6} className="me-1" /> : undefined
        }
      />
    </UrlModal>
  );
}
