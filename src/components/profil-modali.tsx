"use client";

/**
 * Kayıt profillerini modal olarak gösteren ortak kabuk.
 *
 * Listede bir satıra/karta tıklanınca adrese `?profil=<id>` düşer ve sunucu bu
 * modalı render eder — diğer modallarla aynı yaklaşım: durum adres çubuğunda
 * tutulur, geri tuşu kapatır, bağlantı paylaşılabilir, ekrandaki filtreler
 * korunur.
 *
 * İçerik olarak detay sayfasının gövdesi (`*Govdesi` sunucu bileşenleri)
 * `children` ile geçilir; böylece sayfa ve modal aynı kaynaktan beslenir,
 * biri güncellenip diğeri unutulmaz.
 *
 * "Düzenle" adrese `duzenle` parametresini ekler ama `profil` yerinde kalır;
 * düzenleme modalı bunu görüp alt köşesine "Vazgeç" yerine "Geri" koyar.
 */

import { useCallback } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { IconPencil } from "@tabler/icons-react";
import type { ReactNode } from "react";
import { UrlModal } from "./modal";

export function ProfilModali({
  kayitId,
  baslik,
  aciklama,
  duzenlenebilir,
  children,
}: {
  kayitId: string;
  baslik: ReactNode;
  aciklama?: ReactNode;
  duzenlenebilir: boolean;
  children: ReactNode;
}) {
  const router = useRouter();
  const yol = usePathname();
  const parametreler = useSearchParams();

  const duzenlemeyeGec = useCallback(() => {
    const p = new URLSearchParams(parametreler.toString());
    p.set("profil", kayitId);
    p.set("duzenle", kayitId);
    router.replace(`${yol}?${p.toString()}`, { scroll: false });
  }, [router, yol, parametreler, kayitId]);

  return (
    <UrlModal baslik={baslik} aciklama={aciklama} boyut="genis">
      {children}

      {duzenlenebilir && (
        <div className="d-flex flex-wrap gap-2 mt-4 pt-3 border-top">
          <button type="button" className="btn btn-primary" onClick={duzenlemeyeGec}>
            <IconPencil size={16} stroke={1.6} className="me-1" />
            Düzenle
          </button>
        </div>
      )}
    </UrlModal>
  );
}

/**
 * Düzenleme modallarının alt köşesindeki "Geri" davranışı.
 * `profil` adreste duruyorsa düzenlemeden profile dönülür; durmuyorsa modal
 * tamamen kapanır.
 */
export function useProfileDon(geriProfilId?: string) {
  const router = useRouter();
  const yol = usePathname();
  const parametreler = useSearchParams();

  return useCallback(
    (tazele = false) => {
      const p = new URLSearchParams(parametreler.toString());
      p.delete("duzenle");
      p.delete("yeni");
      if (geriProfilId) p.set("profil", geriProfilId);
      const q = p.toString();
      router.replace(q ? `${yol}?${q}` : yol, { scroll: false });
      if (tazele) router.refresh();
    },
    [router, yol, parametreler, geriProfilId],
  );
}
