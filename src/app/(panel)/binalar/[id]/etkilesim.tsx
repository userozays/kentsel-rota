"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { IconCheck, IconPlus, IconTrash, IconX } from "@tabler/icons-react";
import { SilOnayi } from "@/components/modal";
import {
  ADIM_DURUMLARI,
  KULLANIM_TURLERI,
  MALIK_TIPLERI,
  ONAY_DURUMLARI,
  AKTIVITE_TURLERI,
} from "@/lib/sabitler";
import {
  aktiviteEkle,
  hisseOnayGuncelle,
  hisseSil,
  malikEkle,
  surecAdimiGuncelle,
  type FormDurumu,
} from "../eylemler";

/* ------------------------------------------------- Malik onay durumu seçici */

export function OnayDegistirici({
  hisseId,
  deger,
  duzenlenebilir,
}: {
  hisseId: string;
  deger: string;
  duzenlenebilir: boolean;
}) {
  const renk = ONAY_DURUMLARI.find((o) => o.deger === deger)?.renk ?? "secondary";

  if (!duzenlenebilir) {
    return <span className={`badge bg-${renk}-lt`}>{ONAY_DURUMLARI.find((o) => o.deger === deger)?.etiket}</span>;
  }

  return (
    <form action={hisseOnayGuncelle}>
      <input type="hidden" name="hisseId" value={hisseId} />
      <select
        name="onayDurumu"
        className={`form-select form-select-sm border-${renk}`}
        defaultValue={deger}
        onChange={(e) => e.currentTarget.form?.requestSubmit()}
        style={{ minWidth: "8.5rem" }}
        aria-label="Onay durumu"
      >
        {ONAY_DURUMLARI.map((o) => (
          <option key={o.deger} value={o.deger}>
            {o.etiket}
          </option>
        ))}
      </select>
    </form>
  );
}

/* ---------------------------------------------------------- Hisse sil düğmesi */

export function HisseSilDugmesi({ hisseId, malikAdi }: { hisseId: string; malikAdi: string }) {
  return (
    <SilOnayi
      eylem={hisseSil}
      alanlar={{ hisseId }}
      baslik="Maliki binadan çıkar"
      mesaj={
        <>
          <strong>{malikAdi}</strong> bu binadan çıkarılacak.
          <div className="text-secondary small mt-2">
            Malik kaydının kendisi silinmez; yalnızca bu bina ile bağlantısı ve bağımsız bölüm bilgisi kaldırılır.
            Binanın onay oranı yeniden hesaplanır.
          </div>
        </>
      }
      onayMetni="Çıkar"
      tetikleyici={<IconTrash size={16} stroke={1.5} />}
      tetikleyiciSinif="btn btn-ghost-danger btn-icon btn-sm"
      tetikleyiciBaslik="Binadan çıkar"
    />
  );
}

/* ---------------------------------------------------- Süreç adımı durum seçici */

export function AdimDegistirici({
  adimId,
  deger,
  duzenlenebilir,
}: {
  adimId: string;
  deger: string;
  duzenlenebilir: boolean;
}) {
  const secenek = ADIM_DURUMLARI.find((d) => d.deger === deger);

  if (!duzenlenebilir) {
    return <span className={`badge bg-${secenek?.renk ?? "secondary"}-lt`}>{secenek?.etiket}</span>;
  }

  return (
    <form action={surecAdimiGuncelle}>
      <input type="hidden" name="adimId" value={adimId} />
      <select
        name="durum"
        className="form-select form-select-sm"
        defaultValue={deger}
        onChange={(e) => e.currentTarget.form?.requestSubmit()}
        style={{ minWidth: "9rem" }}
        aria-label="Adım durumu"
      >
        {ADIM_DURUMLARI.map((d) => (
          <option key={d.deger} value={d.deger}>
            {d.etiket}
          </option>
        ))}
      </select>
    </form>
  );
}

/* ------------------------------------------------------------ Aktivite formu */

export function AktiviteFormu({
  binaId,
  malikId,
  muteahhitId,
}: {
  binaId?: string;
  malikId?: string;
  muteahhitId?: string;
}) {
  const [durum, eylem, bekliyor] = useActionState<FormDurumu, FormData>(aktiviteEkle, {});
  const girilen = durum.degerler ?? {};
  const form = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (durum.basarili) form.current?.reset();
  }, [durum]);

  return (
    <form action={eylem} ref={form} className="mb-3">
      {binaId && <input type="hidden" name="binaId" value={binaId} />}
      {malikId && <input type="hidden" name="malikId" value={malikId} />}
      {muteahhitId && <input type="hidden" name="muteahhitId" value={muteahhitId} />}

      {durum.hata && <div className="alert alert-danger">{durum.hata}</div>}

      <div className="mb-2">
        <input name="baslik" className="form-control" placeholder="Not veya görüşme başlığı" required defaultValue={girilen.baslik ?? ""} />
      </div>
      <div className="mb-2">
        <textarea name="icerik" className="form-control" rows={2} placeholder="Ayrıntı (isteğe bağlı)" />
      </div>
      <div className="row g-2">
        <div className="col">
          <select name="tur" className="form-select" defaultValue="GORUSME" aria-label="Kayıt türü">
            {AKTIVITE_TURLERI.filter((t) => t.deger !== "SISTEM").map((t) => (
              <option key={t.deger} value={t.deger}>
                {t.etiket}
              </option>
            ))}
          </select>
        </div>
        <div className="col-auto">
          <button type="submit" className="btn btn-primary" disabled={bekliyor}>
            {bekliyor ? "Ekleniyor…" : "Ekle"}
          </button>
        </div>
      </div>
    </form>
  );
}

/* --------------------------------------------------------- Binaya malik ekle */

export function MalikEkleFormu({
  binaId,
  mevcutMalikler,
}: {
  binaId: string;
  mevcutMalikler: { id: string; adSoyad: string; telefon: string | null }[];
}) {
  const [acik, setAcik] = useState(false);
  const [yeniKisi, setYeniKisi] = useState(true);
  const [durum, eylem, bekliyor] = useActionState<FormDurumu, FormData>(malikEkle, {});
  const girilen = durum.degerler ?? {};
  const form = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (durum.basarili) {
      form.current?.reset();
      setAcik(false);
    }
  }, [durum]);

  if (!acik) {
    return (
      <button type="button" className="btn btn-sm" onClick={() => setAcik(true)}>
        <IconPlus size={16} stroke={1.5} className="me-1" />
        Malik Ekle
      </button>
    );
  }

  return (
    <div className="card card-body bg-surface-secondary mt-3">
      <div className="d-flex align-items-center justify-content-between mb-3">
        <h4 className="m-0">Binaya malik ekle</h4>
        <button type="button" className="btn btn-ghost-secondary btn-icon btn-sm" onClick={() => setAcik(false)} aria-label="Kapat">
          <IconX size={16} stroke={1.5} />
        </button>
      </div>

      <form action={eylem} ref={form}>
        <input type="hidden" name="binaId" value={binaId} />

        {durum.hata && <div className="alert alert-danger">{durum.hata}</div>}

        <div className="btn-group w-100 mb-3" role="group">
          <input
            type="radio"
            className="btn-check"
            name="kaynak"
            id="kaynak-yeni"
            checked={yeniKisi}
            onChange={() => setYeniKisi(true)}
          />
          <label className="btn" htmlFor="kaynak-yeni">
            Yeni malik
          </label>
          <input
            type="radio"
            className="btn-check"
            name="kaynak"
            id="kaynak-mevcut"
            checked={!yeniKisi}
            onChange={() => setYeniKisi(false)}
          />
          <label className="btn" htmlFor="kaynak-mevcut">
            Kayıtlı malikten seç
          </label>
        </div>

        {yeniKisi ? (
          <div className="row g-2 mb-3">
            <div className="col-md-6">
              <label className="form-label required">Ad Soyad / Ünvan</label>
              <input name="adSoyad" className="form-control" required={yeniKisi} defaultValue={girilen.adSoyad ?? ""} />
            </div>
            <div className="col-md-6">
              <label className="form-label">Kişi tipi</label>
              <select name="tip" className="form-select" defaultValue="GERCEK">
                {MALIK_TIPLERI.map((t) => (
                  <option key={t.deger} value={t.deger}>
                    {t.etiket}
                  </option>
                ))}
              </select>
            </div>
            <div className="col-md-4">
              <label className="form-label">T.C. / Vergi No</label>
              <input name="tcKimlik" className="form-control" defaultValue={girilen.tcKimlik ?? ""} />
            </div>
            <div className="col-md-4">
              <label className="form-label">Telefon</label>
              <input name="telefon" className="form-control" placeholder="05xx xxx xx xx" defaultValue={girilen.telefon ?? ""} />
            </div>
            <div className="col-md-4">
              <label className="form-label">E-posta</label>
              <input name="email" type="email" className="form-control" defaultValue={girilen.email ?? ""} />
            </div>
          </div>
        ) : (
          <div className="mb-3">
            <label className="form-label required">Kayıtlı malik</label>
            <select name="mevcutMalikId" className="form-select" required={!yeniKisi} defaultValue="">
              <option value="" disabled>
                Seçiniz…
              </option>
              {mevcutMalikler.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.adSoyad}
                  {m.telefon ? ` · ${m.telefon}` : ""}
                </option>
              ))}
            </select>
          </div>
        )}

        <hr className="my-3" />

        <div className="row g-2 mb-3">
          <div className="col-6 col-md-2">
            <label className="form-label">B. Bölüm No</label>
            <input name="bagimsizBolumNo" className="form-control" defaultValue={girilen.bagimsizBolumNo ?? ""} />
          </div>
          <div className="col-6 col-md-3">
            <label className="form-label">Kullanım</label>
            <select name="kullanimTuru" className="form-select" defaultValue="MESKEN">
              {KULLANIM_TURLERI.map((k) => (
                <option key={k.deger} value={k.deger}>
                  {k.etiket}
                </option>
              ))}
            </select>
          </div>
          <div className="col-4 col-md-2">
            <label className="form-label">Arsa payı</label>
            <input name="arsaPayiPay" type="number" min={0} className="form-control" placeholder="Pay" defaultValue={girilen.arsaPayiPay ?? ""} />
          </div>
          <div className="col-4 col-md-2">
            <label className="form-label">Payda</label>
            <input name="arsaPayiPayda" type="number" min={1} className="form-control" placeholder="Payda" defaultValue={girilen.arsaPayiPayda ?? ""} />
          </div>
          <div className="col-4 col-md-3">
            <label className="form-label">Oran (%)</label>
            <input name="hisseOrani" type="number" step="0.001" min={0} max={100} className="form-control" placeholder="Otomatik" defaultValue={girilen.hisseOrani ?? ""} />
          </div>
        </div>

        <div className="row g-2 mb-3">
          <div className="col-md-4">
            <label className="form-label">Onay durumu</label>
            <select name="onayDurumu" className="form-select" defaultValue="BEKLIYOR">
              {ONAY_DURUMLARI.map((o) => (
                <option key={o.deger} value={o.deger}>
                  {o.etiket}
                </option>
              ))}
            </select>
          </div>
          <div className="col-md-8">
            <label className="form-label">Not</label>
            <input name="hisseNotu" className="form-control" defaultValue={girilen.hisseNotu ?? ""} />
          </div>
        </div>

        <div className="btn-list justify-content-end">
          <button type="button" className="btn" onClick={() => setAcik(false)}>
            Vazgeç
          </button>
          <button type="submit" className="btn btn-primary" disabled={bekliyor}>
            <IconCheck size={18} stroke={1.5} className="me-1" />
            {bekliyor ? "Ekleniyor…" : "Ekle"}
          </button>
        </div>
      </form>
    </div>
  );
}
