"use client";

import { useActionState, useEffect, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { muteahhitKaydet, type FormDurumu } from "./eylemler";
import { MUTEAHHIT_DURUMLARI } from "@/lib/sabitler";
import {
  Bolum,
  FormDugmeleri,
  FormGovdesi,
  FormHatasi,
  FormSarmalayici,
} from "@/components/form-kabugu";

type MuteahhitVerisi = {
  id: string;
  firmaAdi: string;
  yetkiliKisi: string | null;
  telefon: string | null;
  email: string | null;
  vergiDairesi: string | null;
  vergiNo: string | null;
  adres: string | null;
  websitesi: string | null;
  calismaBolgeleri: string | null;
  tamamlananProje: number;
  devamEdenProje: number;
  toplamDaire: number;
  puan: number;
  durum: string;
  notlar: string | null;
};

export function MuteahhitFormu({
  muteahhit,
  modalIcinde = false,
  onBasarili,
  onIptal,
  iptalMetni,
  iptalIkonu,
}: {
  muteahhit?: MuteahhitVerisi;
  modalIcinde?: boolean;
  onBasarili?: (id: string) => void;
  onIptal?: () => void;
  iptalMetni?: string;
  iptalIkonu?: ReactNode;
}) {
  const [durum, eylem, bekliyor] = useActionState<FormDurumu, FormData>(muteahhitKaydet, {});
  const girilen = durum.degerler ?? {};
  const router = useRouter();

  useEffect(() => {
    if (!durum.basarili || !durum.kayitId) return;
    if (onBasarili) onBasarili(durum.kayitId);
    else router.push(`/muteahhitler/${durum.kayitId}`);
  }, [durum, onBasarili, router]);

  return (
    <FormSarmalayici modalIcinde={modalIcinde}>
      <form action={eylem}>
        {muteahhit && <input type="hidden" name="id" value={muteahhit.id} />}

        <FormGovdesi modalIcinde={modalIcinde}>
          <FormHatasi hata={durum.hata} />

          <Bolum baslik="Firma bilgileri">
            <div className="row g-3">
              <div className="col-md-7">
                <label className="form-label required" htmlFor="firmaAdi">
                  Firma adı
                </label>
                <input id="firmaAdi" name="firmaAdi" className="form-control" defaultValue={girilen.firmaAdi ?? muteahhit?.firmaAdi ?? ""} required autoFocus />
              </div>
              <div className="col-md-5">
                <label className="form-label" htmlFor="yetkiliKisi">
                  Yetkili kişi
                </label>
                <input id="yetkiliKisi" name="yetkiliKisi" className="form-control" defaultValue={girilen.yetkiliKisi ?? muteahhit?.yetkiliKisi ?? ""} />
              </div>

              <div className="col-md-4">
                <label className="form-label" htmlFor="telefon">
                  Telefon
                </label>
                <input id="telefon" name="telefon" className="form-control" defaultValue={girilen.telefon ?? muteahhit?.telefon ?? ""} />
              </div>
              <div className="col-md-4">
                <label className="form-label" htmlFor="email">
                  E-posta
                </label>
                <input id="email" name="email" type="email" className="form-control" defaultValue={girilen.email ?? muteahhit?.email ?? ""} />
              </div>
              <div className="col-md-4">
                <label className="form-label" htmlFor="websitesi">
                  Web sitesi
                </label>
                <input id="websitesi" name="websitesi" type="url" className="form-control" placeholder="https://" defaultValue={girilen.websitesi ?? muteahhit?.websitesi ?? ""} />
              </div>

              <div className="col-md-4">
                <label className="form-label" htmlFor="vergiDairesi">
                  Vergi dairesi
                </label>
                <input id="vergiDairesi" name="vergiDairesi" className="form-control" defaultValue={girilen.vergiDairesi ?? muteahhit?.vergiDairesi ?? ""} />
              </div>
              <div className="col-md-4">
                <label className="form-label" htmlFor="vergiNo">
                  Vergi no
                </label>
                <input id="vergiNo" name="vergiNo" className="form-control" defaultValue={girilen.vergiNo ?? muteahhit?.vergiNo ?? ""} />
              </div>
              <div className="col-md-4">
                <label className="form-label" htmlFor="adres">
                  Adres
                </label>
                <input id="adres" name="adres" className="form-control" defaultValue={girilen.adres ?? muteahhit?.adres ?? ""} />
              </div>

              <div className="col-12">
                <label className="form-label" htmlFor="calismaBolgeleri">
                  Çalışma bölgeleri
                </label>
                <input
                  id="calismaBolgeleri"
                  name="calismaBolgeleri"
                  className="form-control"
                  placeholder="Bahçelievler, Bağcılar, Küçükçekmece"
                  defaultValue={girilen.calismaBolgeleri ?? muteahhit?.calismaBolgeleri ?? ""}
                />
                <small className="form-hint">İlçeleri virgülle ayırarak yazın.</small>
              </div>
            </div>
          </Bolum>

          <Bolum baslik="Referans ve değerlendirme">
            <div className="row g-3">
              <div className="col-6 col-md-3">
                <label className="form-label" htmlFor="tamamlananProje">
                  Tamamlanan proje
                </label>
                <input id="tamamlananProje" name="tamamlananProje" type="number" min={0} className="form-control" defaultValue={girilen.tamamlananProje ?? muteahhit?.tamamlananProje ?? 0} />
              </div>
              <div className="col-6 col-md-3">
                <label className="form-label" htmlFor="devamEdenProje">
                  Devam eden proje
                </label>
                <input id="devamEdenProje" name="devamEdenProje" type="number" min={0} className="form-control" defaultValue={girilen.devamEdenProje ?? muteahhit?.devamEdenProje ?? 0} />
              </div>
              <div className="col-6 col-md-3">
                <label className="form-label" htmlFor="toplamDaire">
                  Teslim edilen daire
                </label>
                <input id="toplamDaire" name="toplamDaire" type="number" min={0} className="form-control" defaultValue={girilen.toplamDaire ?? muteahhit?.toplamDaire ?? 0} />
              </div>
              <div className="col-6 col-md-3">
                <label className="form-label" htmlFor="puan">
                  Değerlendirme
                </label>
                <select id="puan" name="puan" className="form-select" defaultValue={girilen.puan ?? String(muteahhit?.puan ?? 0)}>
                  <option value="0">Puanlanmadı</option>
                  {[1, 2, 3, 4, 5].map((n) => (
                    <option key={n} value={n}>
                      {"★".repeat(n)} ({n}/5)
                    </option>
                  ))}
                </select>
              </div>

              <div className="col-md-4">
                <label className="form-label" htmlFor="durum">
                  Çalışma durumu
                </label>
                <select id="durum" name="durum" className="form-select" defaultValue={girilen.durum ?? muteahhit?.durum ?? "AKTIF"}>
                  {MUTEAHHIT_DURUMLARI.map((d) => (
                    <option key={d.deger} value={d.deger}>
                      {d.etiket}
                    </option>
                  ))}
                </select>
              </div>

              <div className="col-12">
                <label className="form-label" htmlFor="notlar">
                  Notlar / değerlendirme
                </label>
                <textarea
                  id="notlar"
                  name="notlar"
                  rows={4}
                  className="form-control"
                  placeholder="Referans projeler, teslim performansı, malik geri bildirimleri…"
                  defaultValue={girilen.notlar ?? muteahhit?.notlar ?? ""}
                />
              </div>
            </div>
          </Bolum>
        </FormGovdesi>

        <FormDugmeleri
          modalIcinde={modalIcinde}
          bekliyor={bekliyor}
          kaydetMetni={muteahhit ? "Kaydet" : "Firmayı Ekle"}
          iptalYolu={muteahhit ? `/muteahhitler/${muteahhit.id}` : "/muteahhitler"}
          onIptal={onIptal}
          iptalMetni={iptalMetni}
          iptalIkonu={iptalIkonu}
        />
      </form>
    </FormSarmalayici>
  );
}
