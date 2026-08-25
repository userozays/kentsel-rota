"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/lib/db";
import { yetkiGerekli } from "@/lib/auth";
import { ayristir, hataMetni, type EylemDurumu } from "@/lib/eylem";
import { YMBN_GRUPLARI } from "@/lib/sabitler";

const MuteahhitSemasi = z.object({
  unvan: z.string().trim().min(2, "Ünvan en az 2 karakter olmalı."),
  yetkili: z.string().trim().default(""),
  tel: z.string().trim().max(30).default(""),
  eposta: z.union([z.string().trim().email(), z.literal("")]).catch(""),
  vergiNo: z.string().trim().max(20).default(""),
  ymbn: z.enum(YMBN_GRUPLARI).catch("B"),
  referans: z.string().trim().default(""),
  durum: z.enum(["aktif", "degerlendirmede", "kara"]).catch("degerlendirmede"),
  ndaTarih: z.string().trim().default(""),
  not: z.string().trim().default(""),
  nda: z.union([z.literal("on"), z.undefined()]).transform((v) => v === "on"),
  taahhut: z.union([z.literal("on"), z.undefined()]).transform((v) => v === "on"),
});

export async function muteahhitOlustur(_o: EylemDurumu, form: FormData): Promise<EylemDurumu> {
  try {
    await yetkiGerekli("muteahhitYaz");
    const c = ayristir(MuteahhitSemasi, form);
    if (!c.ok) return { hata: c.hata };
    await db.muteahhit.create({ data: c.veri });
    revalidatePath("/muteahhitler");
    redirect("/muteahhitler");
  } catch (e) {
    if (e && typeof e === "object" && "digest" in e) throw e;
    return { hata: hataMetni(e) };
  }
}

export async function muteahhitGuncelle(_o: EylemDurumu, form: FormData): Promise<EylemDurumu> {
  try {
    await yetkiGerekli("muteahhitYaz");
    const id = String(form.get("id") ?? "");
    const c = ayristir(MuteahhitSemasi, form);
    if (!c.ok) return { hata: c.hata };
    await db.muteahhit.update({ where: { id }, data: c.veri });
    revalidatePath("/muteahhitler");
    revalidatePath("/teklifler");
    redirect("/muteahhitler");
  } catch (e) {
    if (e && typeof e === "object" && "digest" in e) throw e;
    return { hata: hataMetni(e) };
  }
}

export async function muteahhitSil(id: string) {
  await yetkiGerekli("muteahhitYaz");
  const teklifSayisi = await db.teklif.count({ where: { muteahhitId: id } });
  if (teklifSayisi > 0) {
    throw new Error(
      `Bu yüklenicinin ${teklifSayisi} teklifi var. Kayıt silinemez — önce tekliflerini sil veya yükleniciyi kara listeye al.`,
    );
  }
  await db.muteahhit.delete({ where: { id } });
  revalidatePath("/muteahhitler");
}
