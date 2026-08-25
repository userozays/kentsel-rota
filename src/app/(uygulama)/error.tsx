"use client";

import Link from "next/link";

/**
 * Sunucu eylemlerinden gelen hatalar (yetki reddi, erişim yok, iş kuralı ihlali)
 * burada yakalanır. Next üretimde hata mesajını gizler; bu yüzden genel bir
 * açıklama gösterip kullanıcıyı geri döndürüyoruz.
 */
export default function Hata({ error, reset }: { error: Error; reset: () => void }) {
  const yetkiHatasi = /yetkin yok|erişimin yok/i.test(error.message);

  return (
    <div className="panel" style={{ marginTop: 40 }}>
      <div className="empty">
        <h3>{yetkiHatasi ? "Bu işlem için yetkin yok" : "İşlem tamamlanamadı"}</h3>
        <p>
          {yetkiHatasi
            ? "Rolün bu değişikliği yapmaya izin vermiyor. Gerekliyse yöneticinden yetki iste."
            : "Beklenmeyen bir hata oldu. Tekrar denemek işe yaramazsa sayfayı yenile."}
        </p>
        <div style={{ display: "flex", gap: 9, justifyContent: "center", flexWrap: "wrap" }}>
          <button type="button" className="btn" onClick={reset}>
            Tekrar dene
          </button>
          <Link href="/" className="btn pri">
            Panele dön
          </Link>
        </div>
      </div>
    </div>
  );
}
