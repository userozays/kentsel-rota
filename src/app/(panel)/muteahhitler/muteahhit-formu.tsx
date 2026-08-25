"use client";

import Link from "next/link";
import { useActionState } from "react";
import { IconAlertTriangle, IconDeviceFloppy } from "@tabler/icons-react";
import { muteahhitKaydet, type FormDurumu } from "./eylemler";
import { MUTEAHHIT_DURUMLARI } from "@/lib/sabitler";

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

export function MuteahhitFormu({ muteahhit }: { muteahhit?: MuteahhitVerisi }) {
  const [durum, eylem, bekliyor] = useActionState<FormDurumu, FormData>(muteahhitKaydet, {});
  const girilen = durum.degerler ?? {};

  return (
    <form action={eylem}>
      {muteahhit && <input type="hidden" name="id" value={muteahhit.id} />}

      {durum.hata && (
        <div className="alert alert-danger d-flex align-items-center gap-2" role="alert">
          <IconAlertTriangle size={20} stroke={1.5} />
          <div>{durum.hata}</div>
        </div>
      )}

      <div className="row row-cards">
        <div className="col-lg-8">
          <div className="card mb-3">
            <div className="card-header">
              <h3 className="card-title">Firma bilgileri</h3>
            </div>
            <div className="card-body">
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

                <div className="col-12">
                  <label className="form-label" htmlFor="notlar">
                    Notlar / değerlendirme
                  </label>
                  <textarea
                    id="notlar"
                    name="notlar"
                    rows={5}
                    className="form-control"
                    placeholder="Referans projeler, teslim performansı, malik geri bildirimleri…"
                    defaultValue={girilen.notlar ?? muteahhit?.notlar ?? ""}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="col-lg-4">
          <div className="card mb-3">
            <div className="card-header">
              <h3 className="card-title">Referans ve değerlendirme</h3>
            </div>
            <div className="card-body">
              <div className="mb-3">
                <label className="form-label" htmlFor="tamamlananProje">
                  Tamamlanan proje sayısı
                </label>
                <input id="tamamlananProje" name="tamamlananProje" type="number" min={0} className="form-control" defaultValue={girilen.tamamlananProje ?? muteahhit?.tamamlananProje ?? 0} />
              </div>
              <div className="mb-3">
                <label className="form-label" htmlFor="devamEdenProje">
                  Devam eden proje sayısı
                </label>
                <input id="devamEdenProje" name="devamEdenProje" type="number" min={0} className="form-control" defaultValue={girilen.devamEdenProje ?? muteahhit?.devamEdenProje ?? 0} />
              </div>
              <div className="mb-3">
                <label className="form-label" htmlFor="toplamDaire">
                  Teslim edilen toplam daire
                </label>
                <input id="toplamDaire" name="toplamDaire" type="number" min={0} className="form-control" defaultValue={girilen.toplamDaire ?? muteahhit?.toplamDaire ?? 0} />
              </div>
              <div className="mb-3">
                <label className="form-label" htmlFor="puan">
                  Değerlendirme puanı
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
              <div className="mb-0">
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
            </div>
          </div>

          <div className="card">
            <div className="card-body">
              <div className="btn-list">
                <button type="submit" className="btn btn-primary w-100" disabled={bekliyor}>
                  <IconDeviceFloppy size={18} stroke={1.5} className="me-1" />
                  {bekliyor ? "Kaydediliyor…" : muteahhit ? "Kaydet" : "Firmayı Ekle"}
                </button>
                <Link href={muteahhit ? `/muteahhitler/${muteahhit.id}` : "/muteahhitler"} className="btn w-100">
                  Vazgeç
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </form>
  );
}
