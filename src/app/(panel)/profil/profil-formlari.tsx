"use client";

import { useActionState, useEffect, useRef } from "react";
import { IconDeviceFloppy, IconKey } from "@tabler/icons-react";
import { profilGuncelle, sifreDegistir, type FormDurumu } from "../kullanicilar/eylemler";

function Bildirim({ durum }: { durum: FormDurumu }) {
  if (durum.hata) return <div className="alert alert-danger">{durum.hata}</div>;
  if (durum.basarili) return <div className="alert alert-success">{durum.basarili}</div>;
  return null;
}

export function ProfilBilgiFormu({ ad, telefon }: { ad: string; telefon: string | null }) {
  const [durum, eylem, bekliyor] = useActionState<FormDurumu, FormData>(profilGuncelle, {});

  return (
    <form action={eylem} className="card">
      <div className="card-header">
        <h3 className="card-title">Profil bilgilerim</h3>
      </div>
      <div className="card-body">
        <Bildirim durum={durum} />
        <div className="mb-3">
          <label className="form-label required" htmlFor="ad">
            Ad Soyad
          </label>
          <input id="ad" name="ad" className="form-control" defaultValue={ad} required />
        </div>
        <div className="mb-0">
          <label className="form-label" htmlFor="telefon">
            Telefon
          </label>
          <input id="telefon" name="telefon" className="form-control" defaultValue={telefon ?? ""} />
        </div>
      </div>
      <div className="card-footer">
        <button type="submit" className="btn btn-primary" disabled={bekliyor}>
          <IconDeviceFloppy size={18} stroke={1.5} className="me-1" />
          {bekliyor ? "Kaydediliyor…" : "Kaydet"}
        </button>
      </div>
    </form>
  );
}

export function SifreFormu() {
  const [durum, eylem, bekliyor] = useActionState<FormDurumu, FormData>(sifreDegistir, {});
  const form = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (durum.basarili) form.current?.reset();
  }, [durum]);

  return (
    <form action={eylem} ref={form} className="card">
      <div className="card-header">
        <h3 className="card-title">Şifre değiştir</h3>
      </div>
      <div className="card-body">
        <Bildirim durum={durum} />
        <div className="mb-3">
          <label className="form-label required" htmlFor="mevcutSifre">
            Mevcut şifre
          </label>
          <input
            id="mevcutSifre"
            name="mevcutSifre"
            type="password"
            className="form-control"
            autoComplete="current-password"
            required
          />
        </div>
        <div className="mb-3">
          <label className="form-label required" htmlFor="yeniSifre">
            Yeni şifre
          </label>
          <input
            id="yeniSifre"
            name="yeniSifre"
            type="password"
            className="form-control"
            autoComplete="new-password"
            minLength={8}
            required
          />
          <small className="form-hint">En az 8 karakter.</small>
        </div>
        <div className="mb-0">
          <label className="form-label required" htmlFor="yeniSifreTekrar">
            Yeni şifre (tekrar)
          </label>
          <input
            id="yeniSifreTekrar"
            name="yeniSifreTekrar"
            type="password"
            className="form-control"
            autoComplete="new-password"
            minLength={8}
            required
          />
        </div>
      </div>
      <div className="card-footer">
        <button type="submit" className="btn btn-primary" disabled={bekliyor}>
          <IconKey size={18} stroke={1.5} className="me-1" />
          {bekliyor ? "Değiştiriliyor…" : "Şifreyi Değiştir"}
        </button>
      </div>
    </form>
  );
}
