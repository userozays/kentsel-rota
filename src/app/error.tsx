"use client";

import { useEffect } from "react";
import Link from "next/link";
import { IconAlertTriangle, IconRefresh } from "@tabler/icons-react";

/**
 * Beklenmeyen hata ekranı.
 *
 * Hata mesajının kendisi kullanıcıya gösterilmiyor: yığın izi ve veritabanı
 * hataları iç bilgi sızdırır. Sunucu günlüğüne düşüyor, ekranda yalnızca
 * `digest` var — destek istendiğinde günlükteki kayıtla eşleştirmeye yarar.
 */
export default function HataSayfasi({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Panelde beklenmeyen hata:", error);
  }, [error]);

  return (
    <div className="krp-durum-sayfasi">
      <div className="krp-durum-kutu">
        <span className="krp-istatistik-ikon mx-auto mb-3" data-renk="red">
          <IconAlertTriangle size={18} stroke={1.6} />
        </span>
        <h1 className="krp-durum-baslik">Bir şeyler ters gitti</h1>
        <p className="text-secondary">
          İşlem tamamlanamadı. Tekrar denemek sorunu çözmezse yöneticinize başvurun.
        </p>
        <div className="btn-list justify-content-center">
          <button type="button" className="btn btn-primary" onClick={reset}>
            <IconRefresh size={16} stroke={1.6} className="me-1" />
            Tekrar dene
          </button>
          <Link href="/" className="btn">
            Panele dön
          </Link>
        </div>
        {error.digest && (
          <div className="text-secondary small mt-4">
            Hata kodu: <span className="krp-mono">{error.digest}</span>
          </div>
        )}
      </div>
    </div>
  );
}
