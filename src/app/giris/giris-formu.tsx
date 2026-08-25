"use client";

import { useActionState, useState } from "react";
import { IconAlertTriangle, IconEye, IconEyeOff } from "@tabler/icons-react";
import { girisYap, type GirisDurumu } from "./eylemler";

export function GirisFormu({ devam }: { devam: string }) {
  const [durum, eylem, bekliyor] = useActionState<GirisDurumu, FormData>(girisYap, {});
  const girilen = durum.degerler ?? {};
  const [gorunur, setGorunur] = useState(false);

  return (
    <form action={eylem} autoComplete="on" noValidate>
      <input type="hidden" name="devam" value={devam} />

      {durum.hata && (
        <div className="alert alert-danger d-flex align-items-center gap-2" role="alert">
          <IconAlertTriangle size={20} stroke={1.5} />
          <div>{durum.hata}</div>
        </div>
      )}

      <div className="mb-3">
        <label className="form-label" htmlFor="email">
          E-posta adresi
        </label>
        <input
          id="email"
          name="email"
          type="email"
          className="form-control"
          placeholder="ad.soyad@sirketiniz.com"
          autoComplete="username"
          required
          autoFocus defaultValue={girilen.email ?? ""} />
      </div>

      <div className="mb-2">
        <label className="form-label" htmlFor="sifre">
          Şifre
        </label>
        <div className="input-group input-group-flat">
          <input
            id="sifre"
            name="sifre"
            type={gorunur ? "text" : "password"}
            className="form-control"
            placeholder="••••••••"
            autoComplete="current-password"
            required
          />
          <span className="input-group-text">
            <button
              type="button"
              className="link-secondary border-0 bg-transparent p-0 d-flex"
              onClick={() => setGorunur((g) => !g)}
              title={gorunur ? "Şifreyi gizle" : "Şifreyi göster"}
              aria-label={gorunur ? "Şifreyi gizle" : "Şifreyi göster"}
            >
              {gorunur ? <IconEyeOff size={18} stroke={1.5} /> : <IconEye size={18} stroke={1.5} />}
            </button>
          </span>
        </div>
      </div>

      <div className="form-footer">
        <button type="submit" className="btn btn-primary w-100" disabled={bekliyor}>
          {bekliyor ? (
            <>
              <span className="spinner-border spinner-border-sm me-2" role="status" />
              Giriş yapılıyor…
            </>
          ) : (
            "Giriş Yap"
          )}
        </button>
      </div>
    </form>
  );
}
