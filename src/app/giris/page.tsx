import type { Metadata } from "next";
import {
  IconBuildingCommunity,
  IconCalendarEvent,
  IconChartPie,
} from "@tabler/icons-react";
import { GirisFormu } from "./giris-formu";

export const metadata: Metadata = { title: "Giriş" };

/* Yan paneldeki maddeler: panelin ne işe yaradığını üç satırda anlatır.
   Giriş ekranı ekibe dışarıdan da gösterildiği için burada duruyor. */
const OZETLER = [
  {
    ikon: IconBuildingCommunity,
    baslik: "Bina dosyası",
    metin: "Ada/parsel bazlı dosya, 16 adımlık süreç akışı ve belge arşivi.",
  },
  {
    ikon: IconChartPie,
    baslik: "Malik onayı",
    metin: "Arsa payı bazlı çoğunluk hesabı, eşiğe kalan mesafe tek bakışta.",
  },
  {
    ikon: IconCalendarEvent,
    baslik: "İş takvimi",
    metin: "Randevular ve süreç hedef tarihleri; değişiklik açık ekranlara anında düşer.",
  },
];

export default async function GirisSayfasi({
  searchParams,
}: {
  searchParams: Promise<{ devam?: string; sebep?: string }>;
}) {
  const { devam, sebep } = await searchParams;

  return (
    <div className="krp-giris">
      {/* Marka paneli — mobilde gizli, lg üstünde solda durur */}
      <aside className="krp-giris-yan d-none d-lg-flex">
        <div className="krp-giris-yan-ic">
          <div className="krp-giris-marka">
            <span className="krp-giris-isaret" aria-hidden="true">
              KR
            </span>
            <span>
              <span className="krp-giris-marka-ad">Kentsel Rota</span>
              <span className="krp-giris-marka-alt">Süreç Paneli</span>
            </span>
          </div>

          <div>
            <h1 className="krp-giris-slogan">
              Kentsel dönüşüm dosyalarınız
              <br />
              tek bir yerde.
            </h1>
            <ul className="krp-giris-liste">
              {OZETLER.map((o) => {
                const Ikon = o.ikon;
                return (
                  <li key={o.baslik}>
                    <span className="krp-giris-liste-ikon" aria-hidden="true">
                      <Ikon size={17} stroke={1.6} />
                    </span>
                    <span>
                      <strong>{o.baslik}</strong>
                      <span className="krp-giris-liste-metin">{o.metin}</span>
                    </span>
                  </li>
                );
              })}
            </ul>
          </div>

          <p className="krp-giris-yan-alt">
            6306 sayılı Kanun kapsamında süreç takibi. Resmî işlemlerde ilgili idare ve tapu
            kayıtları esastır.
          </p>
        </div>
      </aside>

      {/* Form kolonu */}
      <main className="krp-giris-form">
        <div className="krp-giris-kutu">
          {/* Mobilde yan panel gizli olduğu için marka burada tekrar eder */}
          <div className="krp-giris-marka d-lg-none mb-4">
            <span className="krp-giris-isaret" aria-hidden="true">
              KR
            </span>
            <span>
              <span className="krp-giris-marka-ad">Kentsel Rota</span>
              <span className="krp-giris-marka-alt">Süreç Paneli</span>
            </span>
          </div>

          <div className="mb-4">
            <div className="page-pretitle">Panele erişim</div>
            <h2 className="krp-giris-baslik">Hesabınıza giriş yapın</h2>
          </div>

          {/* Oturum geçersiz kaldığı için çıkarıldıysa sebebini söyle */}
          {sebep === "oturum" && (
            <div className="alert alert-warning" role="status">
              Oturumunuz sona erdi ya da hesabınız artık geçerli değil. Tekrar giriş yapın.
            </div>
          )}

          <GirisFormu devam={devam ?? "/"} />

          <p className="krp-giris-alt-not">
            Hesabınız yok mu? Şirket yöneticinizle iletişime geçin.
          </p>
        </div>
      </main>
    </div>
  );
}
