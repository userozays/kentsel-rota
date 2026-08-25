"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { oturumGerekli } from "@/lib/oturum";
import { yazabilir } from "@/lib/sabitler";
import { bosaNull } from "@/lib/yardimcilar";
import { belgeSilDosya, belgeYaz } from "@/lib/belge";
import { canliYayinla } from "@/lib/canli";

export type BelgeDurumu = { hata?: string; basarili?: boolean };

function tazele(binaId?: string | null, malikId?: string | null, muteahhitId?: string | null) {
  if (binaId) revalidatePath(`/binalar/${binaId}`);
  if (malikId) revalidatePath(`/malikler/${malikId}`);
  if (muteahhitId) revalidatePath(`/muteahhitler/${muteahhitId}`);
  canliYayinla("belge");
}

export async function belgeYukle(_onceki: BelgeDurumu, form: FormData): Promise<BelgeDurumu> {
  const oturum = await oturumGerekli();
  if (!yazabilir(oturum.rol)) return { hata: "Belge yüklemek için yetkiniz yok." };

  const binaId = bosaNull(form.get("binaId"));
  const malikId = bosaNull(form.get("malikId"));
  const muteahhitId = bosaNull(form.get("muteahhitId"));

  if (!binaId && !malikId && !muteahhitId) {
    return { hata: "Belgenin bağlanacağı kayıt bulunamadı." };
  }

  const dosya = form.get("dosya");
  if (!(dosya instanceof File)) return { hata: "Dosya seçilmedi." };

  const sonuc = await belgeYaz(dosya);
  if (!sonuc.tamam) return { hata: sonuc.hata };

  await db.belge.create({
    data: {
      ad: bosaNull(form.get("ad")) ?? sonuc.dosyaAdi,
      dosyaAdi: sonuc.dosyaAdi,
      dosyaYolu: sonuc.dosyaYolu,
      mimeTur: sonuc.mimeTur,
      boyut: sonuc.boyut,
      kategori: String(form.get("kategori") ?? "DIGER"),
      binaId,
      malikId,
      muteahhitId,
      yukleyenId: oturum.id,
    },
  });

  if (binaId) {
    await db.aktivite.create({
      data: {
        tur: "SISTEM",
        baslik: `Belge yüklendi: ${sonuc.dosyaAdi}`,
        kullaniciId: oturum.id,
        binaId,
      },
    });
  }

  tazele(binaId, malikId, muteahhitId);
  return { basarili: true };
}

export async function belgeSil(form: FormData) {
  const oturum = await oturumGerekli();
  const id = String(form.get("id") ?? "");
  if (!id) return;

  const belge = await db.belge.findUnique({ where: { id } });
  if (!belge) return;

  // Yönetici her belgeyi, danışman yalnızca kendi yüklediğini silebilir
  const yetkili = oturum.rol === "ADMIN" || belge.yukleyenId === oturum.id;
  if (!yetkili) return;

  await db.belge.delete({ where: { id } });
  await belgeSilDosya(belge.dosyaYolu);

  tazele(belge.binaId, belge.malikId, belge.muteahhitId);
}
