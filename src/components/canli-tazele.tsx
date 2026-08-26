"use client";

/**
 * Sunucudaki değişiklikleri dinleyip açık sayfayı tazeler.
 *
 * /api/canli uçtan SSE ile bağlanır. Bağlantı koparsa artan gecikmeyle yeniden
 * dener; sekme arka plandayken tazeleme ertelenir, sekmeye dönüldüğünde uygulanır.
 */

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { IconAntennaBars5, IconAntennaBarsOff } from "@tabler/icons-react";

export function CanliTazele({ gostergeGoster = true }: { gostergeGoster?: boolean }) {
  const router = useRouter();
  const [bagli, setBagli] = useState(false);
  const bekleyen = useRef(false);

  useEffect(() => {
    let kaynak: EventSource | null = null;
    let yenidenDene: ReturnType<typeof setTimeout> | null = null;
    let deneme = 0;
    let kapandi = false;
    let koptu = false; // en az bir kez bağlantı düştü mü

    const tazele = () => {
      if (document.hidden) {
        bekleyen.current = true; // sekme arka planda; öne gelince uygulanır
        return;
      }
      router.refresh();
    };

    const baglan = () => {
      if (kapandi) return;
      kaynak = new EventSource("/api/canli");

      kaynak.onopen = () => {
        deneme = 0;
        setBagli(true);
        /* Kopan bağlantı sırasında yayınlanan olaylar bir daha gelmiyor:
           sunucu geçmişi tutmuyor, SSE yeniden bağlanınca sıfırdan dinliyor.
           Eskiden burada yalnızca gösterge yeşile dönüyordu; ekranda bayat
           veri kalıyor, üstelik "Canlı" yazdığı için kullanıcı güncel
           sandığı bir ekrana bakıyordu. Yeniden bağlanışta bir kez tazeleyip
           kaçırılanı kapatıyoruz. */
        if (koptu) {
          koptu = false;
          tazele();
        }
      };
      kaynak.addEventListener("degisiklik", tazele);
      kaynak.onerror = () => {
        setBagli(false);
        koptu = true; // yeniden bağlanınca tazelenmesi gerektiğini işaretle
        kaynak?.close();
        if (kapandi) return;
        deneme = Math.min(deneme + 1, 6);
        yenidenDene = setTimeout(baglan, Math.min(1000 * 2 ** deneme, 30000));
      };
    };

    const gorunurluk = () => {
      if (!document.hidden && bekleyen.current) {
        bekleyen.current = false;
        router.refresh();
      }
    };

    document.addEventListener("visibilitychange", gorunurluk);
    baglan();

    return () => {
      kapandi = true;
      document.removeEventListener("visibilitychange", gorunurluk);
      if (yenidenDene) clearTimeout(yenidenDene);
      kaynak?.close();
    };
  }, [router]);

  if (!gostergeGoster) return null;

  return (
    <span
      className={`d-inline-flex align-items-center gap-1 small ${bagli ? "text-green" : "text-secondary"}`}
      title={bagli ? "Canlı bağlantı açık — değişiklikler anında yansır" : "Bağlantı kurulamadı, yeniden deneniyor"}
    >
      {bagli ? <IconAntennaBars5 size={16} stroke={1.5} /> : <IconAntennaBarsOff size={16} stroke={1.5} />}
      {bagli ? "Canlı" : "Bağlanıyor…"}
    </span>
  );
}
