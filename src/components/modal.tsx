"use client";

/**
 * Tabler görünümlü modal katmanı.
 *
 * Bootstrap JS kullanılmıyor; kabuk olarak native <dialog> elementi tercih edildi.
 * Böylece odak hapsi, ESC ile kapanma, arka plan (::backdrop) ve üst katman
 * yönetimi tarayıcıdan hazır gelir. Tabler'ın .modal-dialog / .modal-content
 * sınıfları dialog'un içine yerleştirilir; aradaki farkı globals.css kapatır.
 */

import { useCallback, useEffect, useId, useRef, useState, type ReactNode } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { IconAlertTriangle } from "@tabler/icons-react";

export type ModalBoyutu = "sm" | "orta" | "lg" | "xl";

const BOYUT_SINIFI: Record<ModalBoyutu, string> = {
  sm: "modal-sm",
  orta: "",
  lg: "modal-lg",
  xl: "modal-xl",
};

export function Modal({
  acik,
  kapat,
  baslik,
  aciklama,
  boyut = "orta",
  kaydirilabilir = true,
  altBilgi,
  kendiGovdesi = false,
  children,
}: {
  acik: boolean;
  kapat: () => void;
  baslik: ReactNode;
  aciklama?: ReactNode;
  boyut?: ModalBoyutu;
  kaydirilabilir?: boolean;
  altBilgi?: ReactNode;
  /** true ise .modal-body / .modal-footer sarmalayıcılarını içerik kendisi verir (form gönderimi için gerekir) */
  kendiGovdesi?: boolean;
  children: ReactNode;
}) {
  const kutu = useRef<HTMLDialogElement>(null);
  const basligiId = useId();

  /* Açık/kapalı durumunu native dialog API'sine bağla */
  useEffect(() => {
    const d = kutu.current;
    if (!d) return;
    if (acik && !d.open) d.showModal();
    else if (!acik && d.open) d.close();
  }, [acik]);

  /* ESC (cancel olayı) ve arka plana tıklama ile kapatma */
  useEffect(() => {
    const d = kutu.current;
    if (!d) return;

    const iptal = (e: Event) => {
      e.preventDefault(); // tarayıcının kendi kapatmasını engelle, durumu biz yönetelim
      kapat();
    };
    const tiklama = (e: MouseEvent) => {
      // .modal-dialog pointer-events:none olduğu için boşluğa tıklanınca hedef dialog'un kendisi olur
      if (e.target === d) kapat();
    };

    d.addEventListener("cancel", iptal);
    d.addEventListener("click", tiklama);
    return () => {
      d.removeEventListener("cancel", iptal);
      d.removeEventListener("click", tiklama);
    };
  }, [kapat]);

  /* Modal açıkken arka plan kaymasın */
  useEffect(() => {
    if (!acik) return;
    const oncekiTasma = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = oncekiTasma;
    };
  }, [acik]);

  return (
    // "modal" sınıfı Tabler'ın --tblr-modal-* değişkenlerini kapsama sokar;
    // getirdiği display:none kuralı globals.css'te geçersiz kılınır.
    <dialog ref={kutu} className="modal krp-modal" aria-labelledby={basligiId}>
      <div
        className={[
          "modal-dialog",
          "modal-dialog-centered",
          BOYUT_SINIFI[boyut],
          kaydirilabilir ? "modal-dialog-scrollable" : "",
          "modal-fullscreen-sm-down",
        ]
          .filter(Boolean)
          .join(" ")}
      >
        <div className="modal-content">
          <div className="modal-header">
            <div>
              <h5 className="modal-title" id={basligiId}>
                {baslik}
              </h5>
              {aciklama && <div className="text-secondary small mt-1">{aciklama}</div>}
            </div>
            <button type="button" className="btn-close" onClick={kapat} aria-label="Kapat" />
          </div>

          {kendiGovdesi ? (
            children
          ) : (
            <>
              <div className="modal-body">{children}</div>
              {altBilgi && <div className="modal-footer">{altBilgi}</div>}
            </>
          )}
        </div>
      </div>
    </dialog>
  );
}

/* ------------------------------------------------------------ URL'e bağlı modal */

/**
 * Modalı kapatırken adresten ?yeni / ?duzenle parametrelerini temizler, diğer filtreleri korur.
 *
 * tazele=true verildiğinde ayrıca router.refresh() çağrılır. Kayıt sonrasında bu gerekli:
 * sunucu eylemi revalidatePath ile önbelleği düşürse de, istemci taraf route önbelleği
 * eski RSC yükünü sunabildiği için liste güncellenmemiş görünüyordu.
 */
export function useModalKapat() {
  const router = useRouter();
  const yol = usePathname();
  const parametreler = useSearchParams();

  return useCallback(
    (tazele = false) => {
      const p = new URLSearchParams(parametreler.toString());
      p.delete("yeni");
      p.delete("duzenle");
      const q = p.toString();
      // replace: kapatınca geri tuşu modalı yeniden açmasın; doğrudan linkle gelinse bile uygulamada kalınır
      router.replace(q ? `${yol}?${q}` : yol, { scroll: false });
      if (tazele) router.refresh();
    },
    [router, yol, parametreler],
  );
}

/**
 * Sunucu tarafında `?yeni` veya `?duzenle` parametresi görüldüğünde render edilir.
 * Açık/kapalı durumu adres çubuğundan gelir, bileşenin kendi durumu yoktur.
 */
export function UrlModal({
  baslik,
  aciklama,
  boyut,
  kendiGovdesi,
  children,
}: {
  baslik: ReactNode;
  aciklama?: ReactNode;
  boyut?: ModalBoyutu;
  kendiGovdesi?: boolean;
  children: ReactNode;
}) {
  const kapat = useModalKapat();
  return (
    <Modal
      acik
      // ok fonksiyonu: onClick'ten gelen olay nesnesi tazele parametresine düşmesin
      kapat={() => kapat()}
      baslik={baslik}
      aciklama={aciklama}
      boyut={boyut}
      kendiGovdesi={kendiGovdesi}
    >
      {children}
    </Modal>
  );
}

/* --------------------------------------------------------------- Onay penceresi */

/**
 * Tarayıcının confirm() kutusu yerine kullanılan onay modalı.
 * Onaylanınca verilen sunucu eylemini gizli alanlarla birlikte gönderir.
 */
export function SilOnayi({
  eylem,
  alanlar,
  baslik,
  mesaj,
  onayMetni = "Sil",
  tetikleyici,
  tetikleyiciSinif = "btn btn-ghost-danger",
  tetikleyiciBaslik,
  tehlikeli = true,
}: {
  eylem: (form: FormData) => Promise<void>;
  alanlar: Record<string, string>;
  baslik: string;
  mesaj: ReactNode;
  onayMetni?: string;
  tetikleyici: ReactNode;
  tetikleyiciSinif?: string;
  tetikleyiciBaslik?: string;
  tehlikeli?: boolean;
}) {
  const [acik, setAcik] = useState(false);

  return (
    <>
      <button
        type="button"
        className={tetikleyiciSinif}
        onClick={() => setAcik(true)}
        title={tetikleyiciBaslik}
      >
        {tetikleyici}
      </button>

      <Modal
        acik={acik}
        kapat={() => setAcik(false)}
        baslik={baslik}
        boyut="sm"
        kaydirilabilir={false}
        altBilgi={
          <>
            <button type="button" className="btn" onClick={() => setAcik(false)}>
              Vazgeç
            </button>
            <form action={eylem}>
              {Object.entries(alanlar).map(([ad, deger]) => (
                <input key={ad} type="hidden" name={ad} value={deger} />
              ))}
              <button type="submit" className={`btn ${tehlikeli ? "btn-danger" : "btn-primary"}`}>
                {onayMetni}
              </button>
            </form>
          </>
        }
      >
        <div className="d-flex gap-3">
          {tehlikeli && (
            <span className="avatar bg-red-lt flex-shrink-0">
              <IconAlertTriangle size={22} stroke={1.5} />
            </span>
          )}
          <div>{mesaj}</div>
        </div>
      </Modal>
    </>
  );
}
