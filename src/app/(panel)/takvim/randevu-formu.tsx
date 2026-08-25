"use client";

import { useActionState, useEffect } from "react";
import { randevuKaydet, type FormDurumu } from "./eylemler";
import { RANDEVU_DURUMLARI, RANDEVU_TURLERI } from "@/lib/sabitler";
import { FormDugmeleri, FormGovdesi, FormHatasi, FormSarmalayici } from "@/components/form-kabugu";

export type RandevuVerisi = {
  id: string;
  baslik: string;
  aciklama: string | null;
  tur: string;
  durum: string;
  baslangicGirdi: string;
  bitisGirdi: string;
  tumGun: boolean;
  yer: string | null;
  katilimcilar: string | null;
  binaId: string | null;
  malikId: string | null;
  muteahhitId: string | null;
  sorumluId: string | null;
};

export function RandevuFormu({
  randevu,
  varsayilanBaslangic,
  binalar,
  muteahhitler,
  kullanicilar,
  modalIcinde = true,
  onBasarili,
  onIptal,
}: {
  randevu?: RandevuVerisi;
  varsayilanBaslangic?: string;
  binalar: { id: string; baslik: string }[];
  muteahhitler: { id: string; firmaAdi: string }[];
  kullanicilar: { id: string; ad: string }[];
  modalIcinde?: boolean;
  onBasarili?: (id: string) => void;
  onIptal?: () => void;
}) {
  const [durum, eylem, bekliyor] = useActionState<FormDurumu, FormData>(randevuKaydet, {});
  const girilen = durum.degerler ?? {};

  useEffect(() => {
    if (durum.basarili && durum.kayitId) onBasarili?.(durum.kayitId);
  }, [durum, onBasarili]);

  return (
    <FormSarmalayici modalIcinde={modalIcinde}>
      <form action={eylem}>
        {randevu && <input type="hidden" name="id" value={randevu.id} />}

        <FormGovdesi modalIcinde={modalIcinde}>
          <FormHatasi hata={durum.hata} />

          <div className="row g-3">
            <div className="col-12">
              <label className="form-label required" htmlFor="baslik">
                Başlık
              </label>
              <input
                id="baslik"
                name="baslik"
                className="form-control"
                placeholder="Malik toplantısı, noter randevusu…"
                defaultValue={girilen.baslik ?? randevu?.baslik ?? ""}
                required
                autoFocus
              />
            </div>

            <div className="col-md-6">
              <label className="form-label required" htmlFor="baslangic">
                Başlangıç
              </label>
              <input
                id="baslangic"
                name="baslangic"
                type="datetime-local"
                className="form-control"
                defaultValue={girilen.baslangic ?? randevu?.baslangicGirdi ?? varsayilanBaslangic ?? ""}
                required
              />
            </div>
            <div className="col-md-6">
              <label className="form-label" htmlFor="bitis">
                Bitiş
              </label>
              <input
                id="bitis"
                name="bitis"
                type="datetime-local"
                className="form-control"
                defaultValue={girilen.bitis ?? randevu?.bitisGirdi ?? ""}
              />
            </div>

            <div className="col-md-6">
              <label className="form-label" htmlFor="tur">
                Tür
              </label>
              <select id="tur" name="tur" className="form-select" defaultValue={girilen.tur ?? randevu?.tur ?? "TOPLANTI"}>
                {RANDEVU_TURLERI.map((t) => (
                  <option key={t.deger} value={t.deger}>
                    {t.etiket}
                  </option>
                ))}
              </select>
            </div>
            <div className="col-md-6">
              <label className="form-label" htmlFor="durum">
                Durum
              </label>
              <select id="durum" name="durum" className="form-select" defaultValue={girilen.durum ?? randevu?.durum ?? "PLANLANDI"}>
                {RANDEVU_DURUMLARI.map((d) => (
                  <option key={d.deger} value={d.deger}>
                    {d.etiket}
                  </option>
                ))}
              </select>
            </div>

            <div className="col-md-6">
              <label className="form-label" htmlFor="yer">
                Yer
              </label>
              <input id="yer" name="yer" className="form-control" defaultValue={girilen.yer ?? randevu?.yer ?? ""} />
            </div>
            <div className="col-md-6">
              <label className="form-label" htmlFor="sorumluId">
                Sorumlu
              </label>
              <select id="sorumluId" name="sorumluId" className="form-select" defaultValue={girilen.sorumluId ?? randevu?.sorumluId ?? ""}>
                <option value="">Atanmadı</option>
                {kullanicilar.map((k) => (
                  <option key={k.id} value={k.id}>
                    {k.ad}
                  </option>
                ))}
              </select>
            </div>

            <div className="col-md-6">
              <label className="form-label" htmlFor="binaId">
                İlgili bina
              </label>
              <select id="binaId" name="binaId" className="form-select" defaultValue={girilen.binaId ?? randevu?.binaId ?? ""}>
                <option value="">Yok</option>
                {binalar.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.baslik}
                  </option>
                ))}
              </select>
            </div>
            <div className="col-md-6">
              <label className="form-label" htmlFor="muteahhitId">
                İlgili müteahhit
              </label>
              <select id="muteahhitId" name="muteahhitId" className="form-select" defaultValue={girilen.muteahhitId ?? randevu?.muteahhitId ?? ""}>
                <option value="">Yok</option>
                {muteahhitler.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.firmaAdi}
                  </option>
                ))}
              </select>
            </div>

            <div className="col-12">
              <label className="form-label" htmlFor="katilimcilar">
                Katılımcılar
              </label>
              <input
                id="katilimcilar"
                name="katilimcilar"
                className="form-control"
                placeholder="İsimleri virgülle ayırın"
                defaultValue={girilen.katilimcilar ?? randevu?.katilimcilar ?? ""}
              />
            </div>

            <div className="col-12">
              <label className="form-label" htmlFor="aciklama">
                Açıklama
              </label>
              <textarea
                id="aciklama"
                name="aciklama"
                rows={3}
                className="form-control"
                defaultValue={girilen.aciklama ?? randevu?.aciklama ?? ""}
              />
            </div>

            <div className="col-12">
              <label className="form-check">
                <input
                  className="form-check-input"
                  type="checkbox"
                  name="tumGun"
                  defaultChecked={randevu?.tumGun ?? false}
                />
                <span className="form-check-label">Tüm gün süren bir iş</span>
              </label>
            </div>
          </div>
        </FormGovdesi>

        <FormDugmeleri
          modalIcinde={modalIcinde}
          bekliyor={bekliyor}
          kaydetMetni={randevu ? "Kaydet" : "Takvime Ekle"}
          iptalYolu="/takvim"
          onIptal={onIptal}
        />
      </form>
    </FormSarmalayici>
  );
}
