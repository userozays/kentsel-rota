import Link from "next/link";

export default function Bulunamadi() {
  return (
    <div className="panel" style={{ marginTop: 40 }}>
      <div className="empty">
        <h3>Kayıt bulunamadı</h3>
        <p>
          Aradığın kayıt silinmiş olabilir — ya da erişim yetkin yok. Saha personeli yalnız
          kendisine atanan binaları görebilir.
        </p>
        <Link href="/" className="btn pri">
          Panele dön
        </Link>
      </div>
    </div>
  );
}
