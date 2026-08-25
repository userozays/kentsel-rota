import { redirect } from "next/navigation";
import { oturumOku } from "@/lib/auth";
import { ayarlariOku } from "@/lib/ayarlar";
import { GirisFormu } from "@/components/GirisFormu";

export const metadata = { title: "Giriş — Kentsel Rota" };

export default async function GirisSayfasi() {
  if (await oturumOku()) redirect("/");
  const ayarlar = await ayarlariOku();

  return (
    <div className="giris-sayfa">
      <div className="giris-kart">
        <div className="marka">
          <span className="mark" aria-hidden="true">
            {ayarlar.sirketAd
              .trim()
              .split(/\s+/)
              .slice(0, 2)
              .map((k) => k[0] ?? "")
              .join("")
              .toLocaleUpperCase("tr-TR")}
          </span>
          <span className="ad">
            <b>{ayarlar.sirketAd}</b>
            <span>Proje Yönetim Sistemi</span>
          </span>
        </div>
        <GirisFormu />
        <p className="giris-not">
          Hesabın yoksa yöneticinden açmasını iste. Bu sistem kat maliklerine ait kişisel veri
          işler; giriş bilgilerini paylaşma.
        </p>
      </div>
    </div>
  );
}
