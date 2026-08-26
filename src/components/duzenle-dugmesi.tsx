"use client";

/**
 * Kaydın düzenleme modalını açan düğme.
 *
 * Aynı düğme iki ayrı bağlamda çalışmak zorunda: detay sayfasında
 * (`/binalar/<id>`) ve listedeki profil modalının içinde (`/binalar?profil=<id>`).
 * Hedef adresi mevcut adresten türetiyor — `duzenle` parametresini ekler,
 * varsa `profil` parametresine dokunmaz. Böylece profil modalından açıldığında
 * düzenleme formunun alt köşesindeki "Geri" profile dönebilir; detay
 * sayfasında ise yalnızca düzenleme modalı açılır.
 */

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { IconEdit } from "@tabler/icons-react";

export function DuzenleDugmesi({
  kayitId,
  etiket = "Düzenle",
  sinif = "btn btn-sm",
  baslik,
}: {
  kayitId: string;
  etiket?: string;
  sinif?: string;
  baslik?: string;
}) {
  const router = useRouter();
  const yol = usePathname();
  const parametreler = useSearchParams();

  const gec = () => {
    const p = new URLSearchParams(parametreler.toString());
    p.set("duzenle", kayitId);
    router.replace(`${yol}?${p.toString()}`, { scroll: false });
  };

  return (
    <button type="button" className={sinif} onClick={gec} title={baslik}>
      <IconEdit size={15} stroke={1.6} className="me-1" />
      {etiket}
    </button>
  );
}
