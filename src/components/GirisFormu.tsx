"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { girisYap, type GirisDurumu } from "@/actions/oturum";

function Gonder() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="btn pri" disabled={pending}>
      {pending ? "Kontrol ediliyor…" : "Giriş yap"}
    </button>
  );
}

export function GirisFormu() {
  const [durum, eylem] = useActionState<GirisDurumu, FormData>(girisYap, {});

  return (
    <form action={eylem}>
      {durum.hata && <div className="uyari">{durum.hata}</div>}
      <div className="field">
        <label htmlFor="eposta">E-posta</label>
        <input
          id="eposta"
          name="eposta"
          type="email"
          autoComplete="username"
          required
          autoFocus
          placeholder="ad.soyad@sirket.com"
        />
      </div>
      <div className="field">
        <label htmlFor="sifre">Şifre</label>
        <input id="sifre" name="sifre" type="password" autoComplete="current-password" required />
      </div>
      <Gonder />
    </form>
  );
}
