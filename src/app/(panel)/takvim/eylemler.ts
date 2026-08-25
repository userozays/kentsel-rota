"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { oturumGerekli } from "@/lib/oturum";
import { yazabilir } from "@/lib/sabitler";
import { bosaNull, formDegerleri, tariheCevir } from "@/lib/yardimcilar";
import { canliYayinla } from "@/lib/canli";

export type FormDurumu = {
  hata?: string;
  basarili?: boolean;
  kayitId?: string;
  degerler?: Record<string, string>;
};

function tazele(binaId?: string | null) {
  revalidatePath("/takvim");
  revalidatePath("/");
  if (binaId) revalidatePath(`/binalar/${binaId}`);
  canliYayinla("randevu");
}

export async function randevuKaydet(_onceki: FormDurumu, form: FormData): Promise<FormDurumu> {
  const oturum = await oturumGerekli();
  if (!yazabilir(oturum.rol)) {
    return { hata: "Bu işlem için yetkiniz yok.", degerler: formDegerleri(form) };
  }

  const baslik = bosaNull(form.get("baslik"));
  const baslangic = tariheCevir(form.get("baslangic"));

  if (!baslik) return { hata: "Başlık alanı zorunludur.", degerler: formDegerleri(form) };
  if (!baslangic) return { hata: "Geçerli bir tarih ve saat girin.", degerler: formDegerleri(form) };

  const bitis = tariheCevir(form.get("bitis"));
  if (bitis && bitis < baslangic) {
    return { hata: "Bitiş zamanı başlangıçtan önce olamaz.", degerler: formDegerleri(form) };
  }

  const veri = {
    baslik,
    aciklama: bosaNull(form.get("aciklama")),
    tur: String(form.get("tur") ?? "TOPLANTI"),
    durum: String(form.get("durum") ?? "PLANLANDI"),
    baslangic,
    bitis,
    tumGun: form.get("tumGun") === "on",
    yer: bosaNull(form.get("yer")),
    katilimcilar: bosaNull(form.get("katilimcilar")),
    binaId: bosaNull(form.get("binaId")),
    malikId: bosaNull(form.get("malikId")),
    muteahhitId: bosaNull(form.get("muteahhitId")),
    sorumluId: bosaNull(form.get("sorumluId")),
  };

  const id = bosaNull(form.get("id"));
  const kayit = id
    ? await db.randevu.update({ where: { id }, data: veri })
    : await db.randevu.create({ data: { ...veri, olusturanId: oturum.id } });

  tazele(kayit.binaId);
  return { basarili: true, kayitId: kayit.id };
}

export async function randevuSil(form: FormData) {
  const oturum = await oturumGerekli();
  if (!yazabilir(oturum.rol)) return;
  const id = String(form.get("id") ?? "");
  if (!id) return;
  const kayit = await db.randevu.delete({ where: { id } });
  tazele(kayit.binaId);
}

export async function randevuDurumGuncelle(form: FormData) {
  const oturum = await oturumGerekli();
  if (!yazabilir(oturum.rol)) return;
  const id = String(form.get("id") ?? "");
  const durum = String(form.get("durum") ?? "");
  if (!id || !durum) return;
  const kayit = await db.randevu.update({ where: { id }, data: { durum } });
  tazele(kayit.binaId);
}
