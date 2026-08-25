"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { oturumGerekli } from "@/lib/oturum";
import { yazabilir } from "@/lib/sabitler";
import { bosaNull, formDegerleri } from "@/lib/yardimcilar";

export type FormDurumu = { hata?: string; basarili?: boolean; kayitId?: string; degerler?: Record<string, string> };

export async function malikKaydet(_onceki: FormDurumu, form: FormData): Promise<FormDurumu> {
  const oturum = await oturumGerekli();
  if (!yazabilir(oturum.rol)) return { hata: "Bu işlem için yetkiniz yok.", degerler: formDegerleri(form) };

  const adSoyad = bosaNull(form.get("adSoyad"));
  if (!adSoyad) return { hata: "Ad Soyad / Ünvan alanı zorunludur.", degerler: formDegerleri(form) };

  const id = bosaNull(form.get("id"));
  const veri = {
    adSoyad,
    tip: String(form.get("tip") ?? "GERCEK"),
    tcKimlik: bosaNull(form.get("tcKimlik")),
    telefon: bosaNull(form.get("telefon")),
    telefon2: bosaNull(form.get("telefon2")),
    email: bosaNull(form.get("email")),
    adres: bosaNull(form.get("adres")),
    notlar: bosaNull(form.get("notlar")),
  };

  const malik = id
    ? await db.malik.update({ where: { id }, data: veri })
    : await db.malik.create({ data: veri });

  revalidatePath("/malikler");
  revalidatePath(`/malikler/${malik.id}`);
  revalidatePath("/binalar");
  return { basarili: true, kayitId: malik.id };
}

export async function malikSil(form: FormData) {
  const oturum = await oturumGerekli();
  if (oturum.rol !== "ADMIN") return;
  const id = String(form.get("id") ?? "");
  if (!id) return;
  await db.malik.delete({ where: { id } });
  revalidatePath("/malikler");
  redirect("/malikler");
}
