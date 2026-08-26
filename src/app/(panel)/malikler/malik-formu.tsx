"use client";

import type { ReactNode } from "react";
import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { malikKaydet, type FormDurumu } from "./eylemler";
import { MALIK_TIPLERI } from "@/lib/sabitler";
import { FormDugmeleri, FormGovdesi, FormHatasi, FormSarmalayici } from "@/components/form-kabugu";

type MalikVerisi = {
  id: string;
  adSoyad: string;
  tip: string;
  tcKimlik: string | null;
  telefon: string | null;
  telefon2: string | null;
  email: string | null;
  adres: string | null;
  notlar: string | null;
};

export function MalikFormu({
  malik,
  modalIcinde = false,
  onBasarili,
  onIptal,
  iptalMetni,
  iptalIkonu,
}: {
  malik?: MalikVerisi;
  modalIcinde?: boolean;
  onBasarili?: (id: string) => void;
  onIptal?: () => void;
  iptalMetni?: string;
  iptalIkonu?: ReactNode;
}) {
  const [durum, eylem, bekliyor] = useActionState<FormDurumu, FormData>(malikKaydet, {});
  const girilen = durum.degerler ?? {};
  const router = useRouter();

  useEffect(() => {
    if (!durum.basarili || !durum.kayitId) return;
    if (onBasarili) onBasarili(durum.kayitId);
    else router.push(`/malikler/${durum.kayitId}`);
  }, [durum, onBasarili, router]);

  return (
    <FormSarmalayici modalIcinde={modalIcinde}>
      <form action={eylem}>
        {malik && <input type="hidden" name="id" value={malik.id} />}

        <FormGovdesi modalIcinde={modalIcinde}>
          <FormHatasi hata={durum.hata} />

          <div className="row g-3">
            <div className="col-md-8">
              <label className="form-label required" htmlFor="adSoyad">
                Ad Soyad / Ünvan
              </label>
              <input id="adSoyad" name="adSoyad" className="form-control" defaultValue={girilen.adSoyad ?? malik?.adSoyad ?? ""} required autoFocus />
            </div>
            <div className="col-md-4">
              <label className="form-label" htmlFor="tip">
                Kişi tipi
              </label>
              <select id="tip" name="tip" className="form-select" defaultValue={girilen.tip ?? malik?.tip ?? "GERCEK"}>
                {MALIK_TIPLERI.map((t) => (
                  <option key={t.deger} value={t.deger}>
                    {t.etiket}
                  </option>
                ))}
              </select>
            </div>

            <div className="col-md-4">
              <label className="form-label" htmlFor="tcKimlik">
                T.C. Kimlik / Vergi No
              </label>
              <input id="tcKimlik" name="tcKimlik" className="form-control" defaultValue={girilen.tcKimlik ?? malik?.tcKimlik ?? ""} />
            </div>
            <div className="col-md-4">
              <label className="form-label" htmlFor="telefon">
                Telefon
              </label>
              <input id="telefon" name="telefon" className="form-control" placeholder="05xx xxx xx xx" defaultValue={girilen.telefon ?? malik?.telefon ?? ""} />
            </div>
            <div className="col-md-4">
              <label className="form-label" htmlFor="telefon2">
                İkinci telefon
              </label>
              <input id="telefon2" name="telefon2" className="form-control" defaultValue={girilen.telefon2 ?? malik?.telefon2 ?? ""} />
            </div>

            <div className="col-md-6">
              <label className="form-label" htmlFor="email">
                E-posta
              </label>
              <input id="email" name="email" type="email" className="form-control" defaultValue={girilen.email ?? malik?.email ?? ""} />
            </div>
            <div className="col-md-6">
              <label className="form-label" htmlFor="adres">
                Adres
              </label>
              <input id="adres" name="adres" className="form-control" defaultValue={girilen.adres ?? malik?.adres ?? ""} />
            </div>

            <div className="col-12">
              <label className="form-label" htmlFor="notlar">
                Notlar
              </label>
              <textarea id="notlar" name="notlar" rows={4} className="form-control" defaultValue={girilen.notlar ?? malik?.notlar ?? ""} />
            </div>
          </div>
        </FormGovdesi>

        <FormDugmeleri
          modalIcinde={modalIcinde}
          bekliyor={bekliyor}
          kaydetMetni={malik ? "Kaydet" : "Malik Oluştur"}
          iptalYolu={malik ? `/malikler/${malik.id}` : "/malikler"}
          onIptal={onIptal}
          iptalMetni={iptalMetni}
          iptalIkonu={iptalIkonu}
        />
      </form>
    </FormSarmalayici>
  );
}
