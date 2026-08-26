"use client";

import { useCallback } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { IconArrowLeft } from "@tabler/icons-react";
import { UrlModal, useModalKapat } from "@/components/modal";
import { MuteahhitFormu } from "./muteahhit-formu";

type MuteahhitVerisi = Parameters<typeof MuteahhitFormu>[0]["muteahhit"];

export function MuteahhitModali({
  muteahhit,
  /** Profil modalından gelindiyse o profilin kimliği; alt düğme "Geri" olur. */
  geriProfilId,
}: {
  muteahhit?: MuteahhitVerisi;
  geriProfilId?: string;
}) {
  const kapat = useModalKapat();
  const router = useRouter();
  const yol = usePathname();
  const parametreler = useSearchParams();

  /* Düzenlemeden profil modalına dön: adresten yalnızca `duzenle` düşer,
     `profil` ve ekrandaki filtreler yerinde kalır. */
  const profileDon = useCallback(
    (tazele = false) => {
      const p = new URLSearchParams(parametreler.toString());
      p.delete("duzenle");
      p.delete("yeni");
      if (geriProfilId) p.set("profil", geriProfilId);
      router.replace(`${yol}?${p.toString()}`, { scroll: false });
      if (tazele) router.refresh();
    },
    [router, yol, parametreler, geriProfilId],
  );

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
        // Geri: profil modalına döner. Kaydettikten sonra da profile dönülür ki
        // değişiklik hemen görünsün.
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
