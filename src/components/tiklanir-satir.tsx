"use client";

/**
 * Tablo satırının herhangi bir yerine tıklayınca verilen yola gider.
 *
 * Kartlarda `.stretched-link` kullanılıyor ama `<tr>` üzerinde mutlak
 * konumlanan bir kaplama güvenilir değil; satırda tıklama olayı dinleniyor.
 * Satırın içindeki bağlantı, düğme ve form öğelerine yapılan tıklamalar
 * dışarıda bırakılır — telefon/e-posta bağlantıları ve satır içi düzenleme
 * düğmeleri çalışmaya devam etsin.
 *
 * Klavye erişimi satırdan değil, hücredeki gerçek bağlantıdan sağlanıyor:
 * satır yalnızca fare kolaylığı. Bu yüzden burada role/tabIndex verilmiyor,
 * ekran okuyucuya çift gezinme hedefi çıkmıyor.
 */

import type { ReactNode } from "react";
import { useRouter } from "next/navigation";

const ETKILESIMLI = "a, button, input, select, textarea, label, dialog, [role='button']";

export function TiklanirSatir({
  yol,
  children,
  className = "",
}: {
  yol: string;
  children: ReactNode;
  className?: string;
}) {
  const router = useRouter();

  return (
    <tr
      className={`tablo-satir-link ${className}`.trim()}
      onClick={(e) => {
        // Metin seçiliyorsa tıklama sayılmaz
        if (window.getSelection()?.toString()) return;
        if ((e.target as HTMLElement).closest(ETKILESIMLI)) return;
        router.replace(yol, { scroll: false });
      }}
    >
      {children}
    </tr>
  );
}
