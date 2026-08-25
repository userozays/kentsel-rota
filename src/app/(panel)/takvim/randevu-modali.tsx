"use client";

import { UrlModal, useModalKapat } from "@/components/modal";
import { RandevuFormu, type RandevuVerisi } from "./randevu-formu";

export function RandevuModali({
  randevu,
  varsayilanBaslangic,
  binalar,
  muteahhitler,
  kullanicilar,
}: {
  randevu?: RandevuVerisi;
  varsayilanBaslangic?: string;
  binalar: { id: string; baslik: string }[];
  muteahhitler: { id: string; firmaAdi: string }[];
  kullanicilar: { id: string; ad: string }[];
}) {
  const kapat = useModalKapat();

  return (
    <UrlModal
      baslik={randevu ? "İş kaydını düzenle" : "Takvime yeni iş ekle"}
      aciklama={randevu ? randevu.baslik : "Toplantı, randevu veya saha işi planlayın."}
      boyut="lg"
      kendiGovdesi
    >
      <RandevuFormu
        randevu={randevu}
        varsayilanBaslangic={varsayilanBaslangic}
        binalar={binalar}
        muteahhitler={muteahhitler}
        kullanicilar={kullanicilar}
        onIptal={() => kapat()}
        onBasarili={() => kapat(true)}
      />
    </UrlModal>
  );
}
