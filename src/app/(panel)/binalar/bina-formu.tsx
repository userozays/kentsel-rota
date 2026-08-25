"use client";

import Link from "next/link";
import { useActionState } from "react";
import { IconAlertTriangle, IconDeviceFloppy } from "@tabler/icons-react";
import { binaKaydet, type FormDurumu } from "./eylemler";
import { BINA_DURUMLARI, ONCELIKLER, RISK_DURUMLARI, SUREC_ADIMLARI } from "@/lib/sabitler";

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
}: {
  bina?: BinaVerisi;
  danismanlar: { id: string; ad: string }[];
  muteahhitler: { id: string; firmaAdi: string; durum: string }[];
}) {
  const [durum, eylem, bekliyor] = useActionState<FormDurumu, FormData>(binaKaydet, {});
  const girilen = durum.degerler ?? {};

  return (
    <form action={eylem}>
      {bina && <input type="hidden" name="id" value={bina.id} />}

      {durum.hata && (
        <div className="alert alert-danger d-flex align-items-center gap-2" role="alert">
          <IconAlertTriangle size={20} stroke={1.5} />
          <div>{durum.hata}</div>
        </div>
      )}

      <div className="row row-cards">
        {/* ------------------------------------------------------ Konum bilgisi */}
        <div className="col-lg-8">
          <div className="card mb-3">
            <div className="card-header">
              <h3 className="card-title">Konum ve tapu bilgileri</h3>
            </div>
            <div className="card-body">
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

                <div className="col-md-3">
                  <label className="form-label required" htmlFor="ada">
                    Ada
                  </label>
                  <input id="ada" name="ada" className="form-control" defaultValue={girilen.ada ?? bina?.ada ?? ""} required />
                </div>
                <div className="col-md-3">
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
            </div>
          </div>

          {/* ------------------------------------------------------- Yapı bilgisi */}
          <div className="card mb-3">
            <div className="card-header">
              <h3 className="card-title">Yapı bilgileri</h3>
            </div>
            <div className="card-body">
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
                  <textarea id="notlar" name="notlar" rows={4} className="form-control" defaultValue={girilen.notlar ?? bina?.notlar ?? ""} />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ------------------------------------------------------- Süreç bilgisi */}
        <div className="col-lg-4">
          <div className="card mb-3">
            <div className="card-header">
              <h3 className="card-title">Süreç durumu</h3>
            </div>
            <div className="card-body">
              <div className="mb-3">
                <label className="form-label" htmlFor="riskDurumu">
                  Riskli yapı durumu
                </label>
                <select id="riskDurumu" name="riskDurumu" className="form-select" defaultValue={girilen.riskDurumu ?? bina?.riskDurumu ?? "TESPIT_EDILMEDI"}>
                  {RISK_DURUMLARI.map((d) => (
                    <option key={d.deger} value={d.deger}>
                      {d.etiket}
                    </option>
                  ))}
                </select>
              </div>

              <div className="mb-3">
                <label className="form-label" htmlFor="asama">
                  Mevcut aşama
                </label>
                <select id="asama" name="asama" className="form-select" defaultValue={girilen.asama ?? bina?.asama ?? "ILK_GORUSME"}>
                  {SUREC_ADIMLARI.map((d) => (
                    <option key={d.deger} value={d.deger}>
                      {d.etiket}
                    </option>
                  ))}
                </select>
                <small className="form-hint">Değiştirildiğinde süreç adımları buna göre hizalanır.</small>
              </div>

              <div className="mb-3">
                <label className="form-label" htmlFor="durum">
                  Dosya durumu
                </label>
                <select id="durum" name="durum" className="form-select" defaultValue={girilen.durum ?? bina?.durum ?? "AKTIF"}>
                  {BINA_DURUMLARI.map((d) => (
                    <option key={d.deger} value={d.deger}>
                      {d.etiket}
                    </option>
                  ))}
                </select>
              </div>

              <div className="mb-0">
                <label className="form-label" htmlFor="oncelik">
                  Öncelik
                </label>
                <select id="oncelik" name="oncelik" className="form-select" defaultValue={girilen.oncelik ?? bina?.oncelik ?? "NORMAL"}>
                  {ONCELIKLER.map((d) => (
                    <option key={d.deger} value={d.deger}>
                      {d.etiket}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="card mb-3">
            <div className="card-header">
              <h3 className="card-title">Sorumlular</h3>
            </div>
            <div className="card-body">
              <div className="mb-3">
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

              <div className="mb-0">
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
          </div>

          <div className="card">
            <div className="card-body">
              <div className="btn-list">
                <button type="submit" className="btn btn-primary w-100" disabled={bekliyor}>
                  <IconDeviceFloppy size={18} stroke={1.5} className="me-1" />
                  {bekliyor ? "Kaydediliyor…" : bina ? "Değişiklikleri Kaydet" : "Dosyayı Oluştur"}
                </button>
                <Link href={bina ? `/binalar/${bina.id}` : "/binalar"} className="btn w-100">
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
