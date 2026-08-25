import "server-only";

import { randomUUID } from "node:crypto";
import { mkdir, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import {
  EN_BUYUK_BOYUT,
  IZINLI_TURLER,
  IZINLI_UZANTILAR,
  dosyaAdiTemizle,
  uzantiAl,
} from "./belge-ortak";

/**
 * Belge deposunun dosya sistemi tarafı.
 *
 * Dosyalar public/ altında DEĞİL, proje kökündeki veri/belgeler klasöründe
 * tutulur. public/ altındaki her şey Next tarafından oturum kontrolü olmadan
 * servis edilir; tapu ve kimlik belgeleri için bu kabul edilemez. İndirme
 * yalnızca /api/belge/[id] üzerinden, oturum doğrulandıktan sonra yapılır.
 */

export const DEPO_KOKU = path.join(process.cwd(), "veri", "belgeler");

export type YuklemeSonucu =
  | { tamam: true; dosyaAdi: string; dosyaYolu: string; mimeTur: string; boyut: number }
  | { tamam: false; hata: string };

export async function belgeYaz(dosya: File): Promise<YuklemeSonucu> {
  if (!dosya || dosya.size === 0) return { tamam: false, hata: "Dosya seçilmedi." };

  if (dosya.size > EN_BUYUK_BOYUT) {
    return {
      tamam: false,
      hata: `Dosya çok büyük. En fazla ${EN_BUYUK_BOYUT / 1024 / 1024} MB yükleyebilirsiniz.`,
    };
  }

  const gorunenAd = dosyaAdiTemizle(dosya.name);
  const uzanti = uzantiAl(gorunenAd);

  if (!uzanti || !IZINLI_UZANTILAR.includes(uzanti)) {
    return {
      tamam: false,
      hata: `Bu dosya türü kabul edilmiyor. İzin verilenler: ${IZINLI_UZANTILAR.join(", ")}`,
    };
  }

  const simdi = new Date();
  const altKlasor = `${simdi.getFullYear()}/${String(simdi.getMonth() + 1).padStart(2, "0")}`;
  const klasor = path.join(DEPO_KOKU, altKlasor);
  await mkdir(klasor, { recursive: true });

  // Diskteki ad tahmin edilemez olsun; kullanıcının verdiği ad yalnızca görüntülemede kullanılır
  const diskAdi = `${randomUUID()}.${uzanti}`;
  await writeFile(path.join(klasor, diskAdi), Buffer.from(await dosya.arrayBuffer()));

  return {
    tamam: true,
    dosyaAdi: gorunenAd,
    // Veritabanında göreli yol tutulur; depo kökü değişirse taşınabilir kalır
    dosyaYolu: `${altKlasor}/${diskAdi}`,
    mimeTur: dosya.type || IZINLI_TURLER[uzanti],
    boyut: dosya.size,
  };
}

/** Göreli yolu depo kökü içinde çözer; dışarı çıkma denemelerini reddeder. */
export function tamYolCoz(dosyaYolu: string): string | null {
  const cozulen = path.resolve(DEPO_KOKU, dosyaYolu);
  const kok = path.resolve(DEPO_KOKU);
  if (cozulen !== kok && !cozulen.startsWith(kok + path.sep)) return null;
  return cozulen;
}

export async function belgeSilDosya(dosyaYolu: string): Promise<void> {
  const tam = tamYolCoz(dosyaYolu);
  if (!tam) return;
  try {
    await unlink(tam);
  } catch {
    /* dosya zaten yoksa veritabanı kaydının silinmesine devam edilir */
  }
}
