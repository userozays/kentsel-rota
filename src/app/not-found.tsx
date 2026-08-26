import Link from "next/link";
import { IconArrowLeft, IconFileOff } from "@tabler/icons-react";

/**
 * Bulunamayan sayfa. Next'in varsayılanı İngilizce ve tasarım dışı kalıyor;
 * canlıya çıkmadan önce Türkçeleştirildi.
 */
export default function BulunamadiSayfasi() {
  return (
    <div className="krp-durum-sayfasi">
      <div className="krp-durum-kutu">
        <span className="krp-istatistik-ikon mx-auto mb-3" data-renk="primary">
          <IconFileOff size={18} stroke={1.6} />
        </span>
        <div className="page-pretitle">404</div>
        <h1 className="krp-durum-baslik">Sayfa bulunamadı</h1>
        <p className="text-secondary">
          Aradığınız kayıt silinmiş ya da adres yanlış olabilir. Bağlantıyı kontrol edin veya
          panele dönün.
        </p>
        <Link href="/" className="btn btn-primary">
          <IconArrowLeft size={16} stroke={1.6} className="me-1" />
          Panele dön
        </Link>
      </div>
    </div>
  );
}
