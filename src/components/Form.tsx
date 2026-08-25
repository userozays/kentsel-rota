"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import type { EylemDurumu } from "@/lib/eylem";

export function Gonder({
  etiket = "Kaydet",
  bekleyen = "Kaydediliyor…",
  sinif = "btn pri",
}: {
  etiket?: string;
  bekleyen?: string;
  sinif?: string;
}) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className={sinif} disabled={pending}>
      {pending ? bekleyen : etiket}
    </button>
  );
}

/**
 * Sunucu eylemini saran form. Eylem (öncekiDurum, formData) => {hata?, basari?}
 * imzasına sahip olmalı; hata mesajı formun üstünde gösterilir.
 */
export function EylemFormu({
  eylem,
  children,
  className,
}: {
  eylem: (onceki: EylemDurumu, form: FormData) => Promise<EylemDurumu>;
  children: React.ReactNode;
  className?: string;
}) {
  const [durum, calistir] = useActionState<EylemDurumu, FormData>(eylem, {});
  return (
    <form action={calistir} className={className}>
      {durum.hata && (
        <div className="uyari" style={{ marginBottom: 14 }}>
          {durum.hata}
        </div>
      )}
      {durum.basari && (
        <div className="bilgi" style={{ marginBottom: 14 }}>
          {durum.basari}
        </div>
      )}
      {children}
    </form>
  );
}

/** Onay soran tekil düğme — silme gibi geri alınamaz işlemler için. */
export function OnayliDugme({
  eylem,
  soru,
  etiket,
  sinif = "btn sm ghost",
}: {
  eylem: () => Promise<void>;
  soru: string;
  etiket: string;
  sinif?: string;
}) {
  return (
    <form
      action={eylem}
      onSubmit={(e) => {
        if (!window.confirm(soru)) e.preventDefault();
      }}
      style={{ display: "inline" }}
    >
      <Gonder etiket={etiket} bekleyen="…" sinif={sinif} />
    </form>
  );
}

function IcDugme({
  etiket,
  sinif,
  baslik,
  basili,
  devreDisi,
}: {
  etiket: string;
  sinif: string;
  baslik?: string;
  basili?: boolean;
  devreDisi?: boolean;
}) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      className={sinif}
      title={baslik}
      aria-pressed={basili}
      disabled={devreDisi || pending}
    >
      {etiket}
    </button>
  );
}

/** Onaysız, tek düğmelik sunucu eylemi (aşama ilerletme, tavır değiştirme vb.) */
export function EylemDugmesi({
  eylem,
  etiket,
  sinif = "btn sm",
  baslik,
  basili,
  devreDisi,
}: {
  eylem: () => Promise<void>;
  etiket: string;
  sinif?: string;
  baslik?: string;
  basili?: boolean;
  devreDisi?: boolean;
}) {
  return (
    <form action={eylem} style={{ display: "inline" }}>
      <IcDugme etiket={etiket} sinif={sinif} baslik={baslik} basili={basili} devreDisi={devreDisi} />
    </form>
  );
}
