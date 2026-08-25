"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { oturumGerekli } from "@/lib/oturum";
import { yazabilir } from "@/lib/sabitler";
import { bosaNull, sayiyaCevir, formDegerleri } from "@/lib/yardimcilar";

export type FormDurumu = { hata?: string; basarili?: boolean; degerler?: Record<string, string> };

async function sonrakiKod() {
  const son = await db.muteahhit.findFirst({ orderBy: { kod: "desc" }, select: { kod: true } });
  const numara = son ? Number(son.kod.replace(/\D/g, "")) + 1 : 1;
  return "MTH-" + String(numara).padStart(3, "0");
}

export async function muteahhitKaydet(_onceki: FormDurumu, form: FormData): Promise<FormDurumu> {
  const oturum = await oturumGerekli();
  if (!yazabilir(oturum.rol)) return { hata: "Bu işlem için yetkiniz yok.", degerler: formDegerleri(form) };

  const firmaAdi = bosaNull(form.get("firmaAdi"));
  if (!firmaAdi) return { hata: "Firma adı zorunludur.", degerler: formDegerleri(form) };

  const id = bosaNull(form.get("id"));
  const veri = {
    firmaAdi,
    yetkiliKisi: bosaNull(form.get("yetkiliKisi")),
    telefon: bosaNull(form.get("telefon")),
    email: bosaNull(form.get("email")),
    vergiDairesi: bosaNull(form.get("vergiDairesi")),
    vergiNo: bosaNull(form.get("vergiNo")),
    adres: bosaNull(form.get("adres")),
    websitesi: bosaNull(form.get("websitesi")),
    calismaBolgeleri: bosaNull(form.get("calismaBolgeleri")),
    tamamlananProje: sayiyaCevir(form.get("tamamlananProje")) ?? 0,
    devamEdenProje: sayiyaCevir(form.get("devamEdenProje")) ?? 0,
    toplamDaire: sayiyaCevir(form.get("toplamDaire")) ?? 0,
    puan: Math.max(0, Math.min(5, sayiyaCevir(form.get("puan")) ?? 0)),
    durum: String(form.get("durum") ?? "AKTIF"),
    notlar: bosaNull(form.get("notlar")),
  };

  const kayit = id
    ? await db.muteahhit.update({ where: { id }, data: veri })
    : await db.muteahhit.create({ data: { ...veri, kod: await sonrakiKod() } });

  revalidatePath("/muteahhitler");
  revalidatePath(`/muteahhitler/${kayit.id}`);
  redirect(`/muteahhitler/${kayit.id}`);
}

export async function muteahhitSil(form: FormData) {
  const oturum = await oturumGerekli();
  if (oturum.rol !== "ADMIN") return;
  const id = String(form.get("id") ?? "");
  if (!id) return;
  await db.muteahhit.delete({ where: { id } });
  revalidatePath("/muteahhitler");
  revalidatePath("/binalar");
  redirect("/muteahhitler");
}
