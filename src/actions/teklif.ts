"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/lib/db";
import { binaErisimiVar, yetkiGerekli } from "@/lib/auth";
import { ayristir, hataMetni, type EylemDurumu } from "@/lib/eylem";

const sayi = () => z.coerce.number().finite().nonnegative().catch(0);

const TeklifSemasi = z.object({
  muteahhitId: z.string().trim().min(1, "Yüklenici seç."),
  malikPayi: z.coerce.number().min(0).max(100, "Malik payı 0–100 arasında olmalı."),
  kiraAy: sayi(),
  kiraTutar: sayi(),
  nakdi: sayi(),
  sureAy: sayi(),
  teminat: sayi(),
  teknik: z.coerce.number().min(0).max(100).catch(70),
  tarih: z.string().trim().default(""),
  not: z.string().trim().default(""),
});

async function binaKontrol(binaId: string) {
  const kullanici = await yetkiGerekli("teklifYaz");
  if (!(await binaErisimiVar(kullanici, binaId))) throw new Error("Bu binaya erişimin yok.");
}

export async function teklifOlustur(_o: EylemDurumu, form: FormData): Promise<EylemDurumu> {
  try {
    const binaId = String(form.get("binaId") ?? "");
    await binaKontrol(binaId);
    const c = ayristir(TeklifSemasi, form);
    if (!c.ok) return { hata: c.hata };

    const muteahhit = await db.muteahhit.findUnique({ where: { id: c.veri.muteahhitId } });
    if (!muteahhit) return { hata: "Yüklenici bulunamadı." };
    if (muteahhit.durum === "kara") {
      return { hata: "Kara listedeki yükleniciden teklif kaydedilemez." };
    }

    await db.teklif.create({ data: { ...c.veri, binaId } });
    revalidatePath("/teklifler");
    revalidatePath("/");
    redirect(`/teklifler?bina=${binaId}`);
  } catch (e) {
    if (e && typeof e === "object" && "digest" in e) throw e;
    return { hata: hataMetni(e) };
  }
}

export async function teklifGuncelle(_o: EylemDurumu, form: FormData): Promise<EylemDurumu> {
  try {
    const binaId = String(form.get("binaId") ?? "");
    const id = String(form.get("id") ?? "");
    await binaKontrol(binaId);
    const c = ayristir(TeklifSemasi, form);
    if (!c.ok) return { hata: c.hata };

    const mevcut = await db.teklif.findUnique({ where: { id } });
    if (!mevcut || mevcut.binaId !== binaId) return { hata: "Teklif bulunamadı." };

    await db.teklif.update({ where: { id }, data: c.veri });
    revalidatePath("/teklifler");
    redirect(`/teklifler?bina=${binaId}`);
  } catch (e) {
    if (e && typeof e === "object" && "digest" in e) throw e;
    return { hata: hataMetni(e) };
  }
}

export async function teklifSil(id: string) {
  const teklif = await db.teklif.findUnique({ where: { id } });
  if (!teklif) return;
  await binaKontrol(teklif.binaId);
  await db.teklif.delete({ where: { id } });
  revalidatePath("/teklifler");
  revalidatePath("/");
}
