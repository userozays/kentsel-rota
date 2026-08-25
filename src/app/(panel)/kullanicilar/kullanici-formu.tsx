"use client";

import Link from "next/link";
import { useActionState } from "react";
import { IconAlertTriangle, IconDeviceFloppy } from "@tabler/icons-react";
import { kullaniciKaydet, kullaniciDurumDegistir, kullaniciSil, type FormDurumu } from "./eylemler";
import { ROLLER } from "@/lib/sabitler";
import { SilOnayi } from "@/components/modal";

type KullaniciVerisi = {
  id: string;
  ad: string;
  email: string;
  rol: string;
  telefon: string | null;
  aktif: boolean;
};

export function KullaniciFormu({ kullanici }: { kullanici?: KullaniciVerisi }) {
  const [durum, eylem, bekliyor] = useActionState<FormDurumu, FormData>(kullaniciKaydet, {});
  const girilen = durum.degerler ?? {};

  return (
    <form action={eylem}>
      {kullanici && <input type="hidden" name="id" value={kullanici.id} />}

      {durum.hata && (
        <div className="alert alert-danger d-flex align-items-center gap-2" role="alert">
          <IconAlertTriangle size={20} stroke={1.5} />
          <div>{durum.hata}</div>
        </div>
      )}

      <div className="card">
        <div className="card-body">
          <div className="row g-3">
            <div className="col-md-6">
              <label className="form-label required" htmlFor="ad">
                Ad Soyad
              </label>
              <input id="ad" name="ad" className="form-control" defaultValue={girilen.ad ?? kullanici?.ad ?? ""} required autoFocus />
            </div>
            <div className="col-md-6">
              <label className="form-label required" htmlFor="email">
                E-posta
              </label>
              <input id="email" name="email" type="email" className="form-control" defaultValue={girilen.email ?? kullanici?.email ?? ""} required />
            </div>

            <div className="col-md-6">
              <label className="form-label" htmlFor="telefon">
                Telefon
              </label>
              <input id="telefon" name="telefon" className="form-control" defaultValue={girilen.telefon ?? kullanici?.telefon ?? ""} />
            </div>
            <div className="col-md-6">
              <label className="form-label" htmlFor="rol">
                Rol
              </label>
              <select id="rol" name="rol" className="form-select" defaultValue={girilen.rol ?? kullanici?.rol ?? "DANISMAN"}>
                {ROLLER.map((r) => (
                  <option key={r.deger} value={r.deger}>
                    {r.etiket} — {r.aciklama}
                  </option>
                ))}
              </select>
            </div>

            <div className="col-md-6">
              <label className={`form-label${kullanici ? "" : " required"}`} htmlFor="sifre">
                {kullanici ? "Yeni şifre" : "Şifre"}
              </label>
              <input
                id="sifre"
                name="sifre"
                type="password"
                className="form-control"
                autoComplete="new-password"
                minLength={8}
                required={!kullanici}
                placeholder={kullanici ? "Değiştirmek istemiyorsanız boş bırakın" : "En az 8 karakter"}
              />
            </div>

            <div className="col-md-6 d-flex align-items-end">
              <label className="form-check form-switch mb-2">
                <input className="form-check-input" type="checkbox" name="aktif" defaultChecked={kullanici?.aktif ?? true} />
                <span className="form-check-label">Hesap aktif</span>
              </label>
            </div>
          </div>
        </div>

        <div className="card-footer">
          <div className="btn-list justify-content-end">
            <Link href="/kullanicilar" className="btn">
              Vazgeç
            </Link>
            <button type="submit" className="btn btn-primary" disabled={bekliyor}>
              <IconDeviceFloppy size={18} stroke={1.5} className="me-1" />
              {bekliyor ? "Kaydediliyor…" : kullanici ? "Kaydet" : "Kullanıcı Oluştur"}
            </button>
          </div>
        </div>
      </div>
    </form>
  );
}

export function KullaniciSilDugmesi({ id, ad }: { id: string; ad: string }) {
  return (
    <SilOnayi
      eylem={kullaniciSil}
      alanlar={{ id }}
      baslik="Kullanıcıyı sil"
      mesaj={
        <>
          <strong>{ad}</strong> hesabı kalıcı olarak silinecek.
          <div className="text-secondary small mt-2">
            Bu kişinin girdiği görüşme ve not kayıtları da silinir. Kayıtları korumak isterseniz silmek
            yerine hesabı pasife almayı tercih edin.
          </div>
        </>
      }
      tetikleyici="Kullanıcıyı Sil"
    />
  );
}

export function DurumDugmesi({ id, aktif, kendisi }: { id: string; aktif: boolean; kendisi: boolean }) {
  if (kendisi) {
    return <span className="text-secondary small">Kendi hesabınız</span>;
  }
  return (
    <form action={kullaniciDurumDegistir}>
      <input type="hidden" name="id" value={id} />
      <button type="submit" className={`btn btn-sm ${aktif ? "btn-ghost-danger" : "btn-ghost-success"}`}>
        {aktif ? "Pasife al" : "Aktifleştir"}
      </button>
    </form>
  );
}
