"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { binaKaydet, type FormDurumu } from "./eylemler";
import { BINA_DURUMLARI, ONCELIKLER, RISK_DURUMLARI, SUREC_ADIMLARI } from "@/lib/sabitler";
import {
  Bolum,
  FormDugmeleri,
  FormGovdesi,
  FormHatasi,
  FormSarmalayici,
} from "@/components/form-kabugu";

type BinaVerisi = {
  id: string;
  baslik: string;
  il: string;
  ilce: string;
  mahalle: string;
  ada: string;
  parsel: string;
  adres: string | null;
  katSayisi: number | null;
  bagimsizBolumSayisi: number;
  yapimYili: number | null;
  arsaAlani: number | null;
  riskDurumu: string;
  asama: string;
  durum: string;
  oncelik: string;
  danismanId: string | null;
  muteahhitId: string | null;
  notlar: string | null;
};

export function BinaFormu({
  bina,
  danismanlar,
  muteahhitler,
  modalIcinde = false,
  onBasarili,
  onIptal,
}: {
  bina?: BinaVerisi;
  danismanlar: { id: string; ad: string }[];
  muteahhitler: { id: string; firmaAdi: string; durum: string }[];
  modalIcinde?: boolean;
  onBasarili?: (id: string) => void;
  onIptal?: () => void;
}) {
  const [durum, eylem, bekliyor] = useActionState<FormDurumu, FormData>(binaKaydet, {});
  const girilen = durum.degerler ?? {};
  const router = useRouter();

  useEffect(() => {
    if (!durum.basarili || !durum.kayitId) return;
    if (onBasarili) onBasarili(durum.kayitId);
    else router.push(`/binalar/${durum.kayitId}`);
  }, [durum, onBasarili, router]);

  return (
    <FormSarmalayici modalIcinde={modalIcinde}>
      <form action={eylem}>
        {bina && <input type="hidden" name="id" value={bina.id} />}

        <FormGovdesi modalIcinde={modalIcinde}>
          <FormHatasi hata={durum.hata} />

          <Bolum baslik="Konum ve tapu bilgileri">
            <div className="row g-3">
              <div className="col-md-4">
                <label className="form-label required" htmlFor="il">
                  İl
                </label>
                <input id="il" name="il" className="form-control" defaultValue={girilen.il ?? bina?.il ?? "İstanbul"} required />
              </div>
              <div className="col-md-4">
                <label className="form-label required" htmlFor="ilce">
                  İlçe
                </label>
                <input id="ilce" name="ilce" className="form-control" defaultValue={girilen.ilce ?? bina?.ilce ?? ""} required />
              </div>
              <div className="col-md-4">
                <label className="form-label required" htmlFor="mahalle">
                  Mahalle
                </label>
                <input id="mahalle" name="mahalle" className="form-control" defaultValue={girilen.mahalle ?? bina?.mahalle ?? ""} required />
              </div>

              <div className="col-6 col-md-3">
                <label className="form-label required" htmlFor="ada">
                  Ada
                </label>
                <input id="ada" name="ada" className="form-control" defaultValue={girilen.ada ?? bina?.ada ?? ""} required />
              </div>
              <div className="col-6 col-md-3">
                <label className="form-label required" htmlFor="parsel">
                  Parsel
                </label>
                <input id="parsel" name="parsel" className="form-control" defaultValue={girilen.parsel ?? bina?.parsel ?? ""} required />
              </div>
              <div className="col-md-6">
                <label className="form-label" htmlFor="baslik">
                  Dosya başlığı
                </label>
                <input
                  id="baslik"
                  name="baslik"
                  className="form-control"
                  placeholder="Boş bırakılırsa mahalle/ada/parselden üretilir"
                  defaultValue={girilen.baslik ?? bina?.baslik ?? ""}
                />
              </div>

              <div className="col-12">
                <label className="form-label" htmlFor="adres">
                  Açık adres
                </label>
                <input id="adres" name="adres" className="form-control" defaultValue={girilen.adres ?? bina?.adres ?? ""} />
              </div>
            </div>
          </Bolum>

          <Bolum baslik="Yapı bilgileri">
            <div className="row g-3">
              <div className="col-6 col-md-3">
                <label className="form-label" htmlFor="katSayisi">
                  Kat sayısı
                </label>
                <input id="katSayisi" name="katSayisi" type="number" min={0} className="form-control" defaultValue={girilen.katSayisi ?? bina?.katSayisi ?? ""} />
              </div>
              <div className="col-6 col-md-3">
                <label className="form-label" htmlFor="bagimsizBolumSayisi">
                  Bağımsız bölüm
                </label>
                <input
                  id="bagimsizBolumSayisi"
                  name="bagimsizBolumSayisi"
                  type="number"
                  min={0}
                  className="form-control"
                  defaultValue={girilen.bagimsizBolumSayisi ?? bina?.bagimsizBolumSayisi ?? ""}
                />
              </div>
              <div className="col-6 col-md-3">
                <label className="form-label" htmlFor="yapimYili">
                  Yapım yılı
                </label>
                <input id="yapimYili" name="yapimYili" type="number" min={1900} max={2100} className="form-control" defaultValue={girilen.yapimYili ?? bina?.yapimYili ?? ""} />
              </div>
              <div className="col-6 col-md-3">
                <label className="form-label" htmlFor="arsaAlani">
                  Arsa alanı (m²)
                </label>
                <input id="arsaAlani" name="arsaAlani" type="number" step="0.01" min={0} className="form-control" defaultValue={girilen.arsaAlani ?? bina?.arsaAlani ?? ""} />
              </div>

              <div className="col-12">
                <label className="form-label" htmlFor="notlar">
                  Notlar
                </label>
                <textarea id="notlar" name="notlar" rows={3} className="form-control" defaultValue={girilen.notlar ?? bina?.notlar ?? ""} />
              </div>
            </div>
          </Bolum>

          <Bolum
            baslik="Süreç durumu"
            aciklama="Aşama değiştirildiğinde binanın süreç adımları buna göre hizalanır."
          >
            <div className="row g-3">
              <div className="col-md-6">
                <label className="form-label" htmlFor="riskDurumu">
                  Riskli yapı durumu
                </label>
                <select id="riskDurumu" name="riskDurumu" className="form-select" defaultValue={girilen.riskDurumu ?? bina?.riskDurumu ?? "TESPIT_EDILMEDI"}>
                  {RISK_DURUMLARI.map((s) => (
                    <option key={s.deger} value={s.deger}>
                      {s.etiket}
                    </option>
                  ))}
                </select>
              </div>
              <div className="col-md-6">
                <label className="form-label" htmlFor="asama">
                  Mevcut aşama
                </label>
                <select id="asama" name="asama" className="form-select" defaultValue={girilen.asama ?? bina?.asama ?? "ILK_GORUSME"}>
                  {SUREC_ADIMLARI.map((s) => (
                    <option key={s.deger} value={s.deger}>
                      {s.etiket}
                    </option>
                  ))}
                </select>
              </div>
              <div className="col-md-6">
                <label className="form-label" htmlFor="durum">
                  Dosya durumu
                </label>
                <select id="durum" name="durum" className="form-select" defaultValue={girilen.durum ?? bina?.durum ?? "AKTIF"}>
                  {BINA_DURUMLARI.map((s) => (
                    <option key={s.deger} value={s.deger}>
                      {s.etiket}
                    </option>
                  ))}
                </select>
              </div>
              <div className="col-md-6">
                <label className="form-label" htmlFor="oncelik">
                  Öncelik
                </label>
                <select id="oncelik" name="oncelik" className="form-select" defaultValue={girilen.oncelik ?? bina?.oncelik ?? "NORMAL"}>
                  {ONCELIKLER.map((s) => (
                    <option key={s.deger} value={s.deger}>
                      {s.etiket}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </Bolum>

          <Bolum baslik="Sorumlular">
            <div className="row g-3">
              <div className="col-md-6">
                <label className="form-label" htmlFor="danismanId">
                  Danışman
                </label>
                <select id="danismanId" name="danismanId" className="form-select" defaultValue={girilen.danismanId ?? bina?.danismanId ?? ""}>
                  <option value="">Atanmadı</option>
                  {danismanlar.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.ad}
                    </option>
                  ))}
                </select>
              </div>
              <div className="col-md-6">
                <label className="form-label" htmlFor="muteahhitId">
                  Müteahhit
                </label>
                <select id="muteahhitId" name="muteahhitId" className="form-select" defaultValue={girilen.muteahhitId ?? bina?.muteahhitId ?? ""}>
                  <option value="">Seçilmedi</option>
                  {muteahhitler.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.firmaAdi}
                      {m.durum === "KARA_LISTE" ? " (kara liste)" : m.durum === "PASIF" ? " (pasif)" : ""}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </Bolum>
        </FormGovdesi>

        <FormDugmeleri
          modalIcinde={modalIcinde}
          bekliyor={bekliyor}
          kaydetMetni={bina ? "Değişiklikleri Kaydet" : "Dosyayı Oluştur"}
          iptalYolu={bina ? `/binalar/${bina.id}` : "/binalar"}
          onIptal={onIptal}
        />
      </form>
    </FormSarmalayici>
  );
}
