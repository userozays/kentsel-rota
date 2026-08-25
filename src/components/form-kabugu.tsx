"use client";

/** Formların hem tam sayfada hem modal içinde aynı kodla çalışmasını sağlayan sarmalayıcılar. */

import Link from "next/link";
import type { ReactNode } from "react";
import { IconAlertTriangle, IconDeviceFloppy } from "@tabler/icons-react";

/** Başlıklı alan grubu — kart yerine geçer, modal içinde iç içe kart görünümü oluşmaz. */
export function Bolum({
  baslik,
  aciklama,
  children,
}: {
  baslik: string;
  aciklama?: string;
  children: ReactNode;
}) {
  return (
    <section className="mb-4">
      <h4 className="mb-1">{baslik}</h4>
      {aciklama && <div className="text-secondary small mb-3">{aciklama}</div>}
      <div className={aciklama ? "" : "mt-3"}>{children}</div>
      <hr className="mt-4 mb-0" />
    </section>
  );
}

export function FormHatasi({ hata }: { hata?: string }) {
  if (!hata) return null;
  return (
    <div className="alert alert-danger d-flex align-items-center gap-2" role="alert">
      <IconAlertTriangle size={20} stroke={1.5} className="flex-shrink-0" />
      <div>{hata}</div>
    </div>
  );
}

/**
 * Form gövdesi ve alt düğme çubuğu. modalIcinde=true olduğunda Tabler'ın
 * .modal-body / .modal-footer sınıflarını, aksi halde .card-body / .card-footer
 * sınıflarını kullanır.
 */
export function FormGovdesi({
  modalIcinde,
  children,
}: {
  modalIcinde: boolean;
  children: ReactNode;
}) {
  return <div className={modalIcinde ? "modal-body" : "card-body"}>{children}</div>;
}

export function FormDugmeleri({
  modalIcinde,
  bekliyor,
  kaydetMetni,
  iptalYolu,
  onIptal,
}: {
  modalIcinde: boolean;
  bekliyor: boolean;
  kaydetMetni: string;
  iptalYolu: string;
  onIptal?: () => void;
}) {
  return (
    <div className={modalIcinde ? "modal-footer" : "card-footer"}>
      <div className="btn-list justify-content-end w-100">
        {onIptal ? (
          <button type="button" className="btn" onClick={onIptal} disabled={bekliyor}>
            Vazgeç
          </button>
        ) : (
          <Link href={iptalYolu} className="btn">
            Vazgeç
          </Link>
        )}
        <button type="submit" className="btn btn-primary" disabled={bekliyor}>
          <IconDeviceFloppy size={18} stroke={1.5} className="me-1" />
          {bekliyor ? "Kaydediliyor…" : kaydetMetni}
        </button>
      </div>
    </div>
  );
}

/** Sayfada gösterilirken formu karta sarar; modal içinde olduğu gibi bırakır. */
export function FormSarmalayici({
  modalIcinde,
  children,
}: {
  modalIcinde: boolean;
  children: ReactNode;
}) {
  return modalIcinde ? <>{children}</> : <div className="card">{children}</div>;
}
