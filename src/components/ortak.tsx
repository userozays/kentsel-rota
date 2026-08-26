import Link from "next/link";
import type { ReactNode } from "react";
import { etiketBul, type Secenek } from "@/lib/sabitler";
import { basHarfler, avatarRengi, sayi, yuzde, type OnayOzeti } from "@/lib/yardimcilar";

/* --------------------------------------------------------------- Rozetler */

export function Rozet({
  harita,
  deger,
  nokta = false,
}: {
  harita: Record<string, Secenek>;
  deger?: string | null;
  nokta?: boolean;
}) {
  const s = etiketBul(harita, deger);
  if (nokta) {
    return (
      <span className="badge badge-outline text-secondary">
        <span className={`badge bg-${s.renk} me-2`} style={{ width: 6, height: 6, padding: 0 }} />
        {s.etiket}
      </span>
    );
  }
  return <span className={`badge bg-${s.renk}-lt`}>{s.etiket}</span>;
}

export function RozetDolu({ harita, deger }: { harita: Record<string, Secenek>; deger?: string | null }) {
  const s = etiketBul(harita, deger);
  return <span className={`badge bg-${s.renk} text-white`}>{s.etiket}</span>;
}

/* ---------------------------------------------------------------- Avatarlar */

export function Avatar({
  ad,
  boyut = "",
  anahtar,
}: {
  ad?: string | null;
  boyut?: "sm" | "md" | "lg" | "xl" | "";
  anahtar?: string;
}) {
  const renk = avatarRengi(anahtar ?? ad ?? "?");
  const sinif = boyut ? `avatar avatar-${boyut}` : "avatar";
  return <span className={`${sinif} bg-${renk}-lt`}>{basHarfler(ad)}</span>;
}

/* ------------------------------------------------------------ Sayfa başlığı */

export function SayfaBasligi({
  ustBaslik,
  baslik,
  aciklama,
  aksiyonlar,
}: {
  ustBaslik?: string;
  baslik: string;
  aciklama?: ReactNode;
  aksiyonlar?: ReactNode;
}) {
  return (
    <div className="page-header d-print-none">
      <div className="container-fluid">
        <div className="row g-3 align-items-center">
          <div className="col">
            {ustBaslik && <div className="page-pretitle">{ustBaslik}</div>}
            <h2 className="page-title">{baslik}</h2>
            {aciklama && <div className="text-secondary mt-2">{aciklama}</div>}
          </div>
          {aksiyonlar && (
            <div className="col-auto ms-auto d-print-none">
              <div className="btn-list">{aksiyonlar}</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------- Boş durumlar */

export function BosDurum({
  baslik,
  aciklama,
  aksiyon,
}: {
  baslik: string;
  aciklama?: string;
  aksiyon?: ReactNode;
}) {
  return (
    <div className="empty">
      <p className="empty-title">{baslik}</p>
      {aciklama && <p className="empty-subtitle text-secondary">{aciklama}</p>}
      {aksiyon && <div className="empty-action">{aksiyon}</div>}
    </div>
  );
}

/* ------------------------------------------------------------ İstatistik kartı

   Yerleşim: üstte etiket + tonlu ikon, ortada büyük sayı, altta alt bilgi.
   Renk yalnızca ikonda ve bir tonda görünür; büyük sayı her zaman mürekkep
   renginde kalır ki dört kart yan yana dizildiğinde biri diğerini bastırmasın. */

export function IstatistikKart({
  baslik,
  deger,
  altBilgi,
  renk = "primary",
  ikon,
  href,
}: {
  baslik: string;
  deger: ReactNode;
  altBilgi?: ReactNode;
  renk?: string;
  ikon?: ReactNode;
  href?: string;
}) {
  const govde = (
    <div className="krp-istatistik">
      <div className="krp-istatistik-ust">
        <span className="krp-istatistik-etiket">{baslik}</span>
        {ikon && (
          <span className="krp-istatistik-ikon" data-renk={renk} aria-hidden="true">
            {ikon}
          </span>
        )}
      </div>
      <div className="krp-istatistik-deger">{deger}</div>
      {/* Alt bilgi boş da olsa satır çizilir; aynı sıradaki kartların
          büyük sayıları hizada kalsın. */}
      <div className="krp-istatistik-alt">{altBilgi}</div>
    </div>
  );

  return href ? (
    <Link href={href} className="krp-istatistik-baglanti">
      {govde}
    </Link>
  ) : (
    govde
  );
}

/* ------------------------------------------------------------- Onay çubuğu

   Arsa payı bazlı onay dağılımı. Kehribar kesikli çizgi çoğunluk eşiğini
   gösterir — panelin tek "sıcak" renkli işareti bilinçli olarak burada. */

export function OnayCubugu({ ozet, etiketGoster = true }: { ozet: OnayOzeti; etiketGoster?: boolean }) {
  const g = (n: number) => `${Math.max(0, Math.min(100, n))}%`;
  const bekleyenOran = 100 - ozet.olumluOran - ozet.olumsuzOran;
  return (
    <div>
      <div className="position-relative">
        <div className="onay-cubugu">
          <span className="bg-green" style={{ width: g(ozet.olumluOran) }} title={`Olumlu ${yuzde(ozet.olumluOran)}`} />
          <span className="bg-red" style={{ width: g(ozet.olumsuzOran) }} title={`Olumsuz ${yuzde(ozet.olumsuzOran)}`} />
          <span className="bg-secondary-lt" style={{ width: g(bekleyenOran) }} title="Bekleyen" />
        </div>
        <div className="esik-isareti" style={{ left: g(ozet.esik) }} title={`Çoğunluk eşiği %${ozet.esik}`} />
      </div>
      {etiketGoster && (
        <div className="d-flex justify-content-between align-items-baseline mt-2" style={{ fontSize: "0.75rem" }}>
          <span className={ozet.cogunlukSaglandi ? "text-green fw-bold" : "text-secondary"}>
            Olumlu {yuzde(ozet.olumluOran)}
            {ozet.cogunlukSaglandi ? " · çoğunluk sağlandı" : ` · eşik %${ozet.esik}`}
          </span>
          <span className="text-secondary krp-sayi">
            {sayi(ozet.olumluAdet)}/{sayi(ozet.bolumSayisi)} bağımsız bölüm
          </span>
        </div>
      )}
    </div>
  );
}

/* --------------------------------------------------------------- Yıldız puan */

export function YildizPuan({ puan }: { puan: number }) {
  return (
    <span className="krp-yildiz text-yellow" title={`${puan}/5`}>
      {"★".repeat(Math.max(0, Math.min(5, puan)))}
      <span className="text-secondary opacity-50">{"★".repeat(Math.max(0, 5 - puan))}</span>
    </span>
  );
}

/* ------------------------------------------------------------ Bilgi satırı */

export function BilgiSatiri({ etiket, children }: { etiket: string; children: ReactNode }) {
  return (
    <div className="row mb-2">
      <div className="col-5 col-sm-4 text-secondary">{etiket}</div>
      <div className="col-7 col-sm-8">{children ?? "—"}</div>
    </div>
  );
}

/* ------------------------------------------------------------------ Uyarılar */

export function Uyari({ tur = "info", baslik, children }: { tur?: string; baslik?: string; children: ReactNode }) {
  return (
    <div className={`alert alert-${tur}`} role="alert">
      {baslik && <h4 className="alert-title">{baslik}</h4>}
      <div className="text-secondary">{children}</div>
    </div>
  );
}
