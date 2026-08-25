"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/lib/db";
import { binaErisimiVar, yetkiGerekli } from "@/lib/auth";
import { ayristir, hataMetni, type EylemDurumu } from "@/lib/eylem";
import { DURUM_KODLARI } from "@/lib/sabitler";
import { bugun } from "@/lib/bicim";

const MalikSemasi = z.object({
  ad: z.string().trim().min(2, "Malik adı en az 2 karakter olmalı."),
  bb: z.string().trim().default(""),
  kat: z.string().trim().default(""),
  pay: z.coerce.number().min(0, "Arsa payı negatif olamaz."),
  durum: z.enum(DURUM_KODLARI).catch("ulasilamadi"),
  tel: z.string().trim().max(30).default(""),
  not: z.string().trim().default(""),
  kiraci: z.union([z.literal("on"), z.undefined()]).transform((v) => v === "on"),
  engel: z
    .union([z.string(), z.array(z.string())])
    .optional()
    .transform((v) => (v === undefined ? [] : Array.isArray(v) ? v : [v])),
});

/**
 * Malik kaydına yazma kontrolü.
 * "malikYaz" tavır/not güncellemeye yeter (saha personeli). Kayıt silmek ve toplu
 * bölüm açmak yapısal işlemlerdir; onlar için "binaYaz" aranır — saha personeli
 * yanlışlıkla veya kasten malik kaydı silememeli.
 */
async function binaKontrol(binaId: string, yetki: "malikYaz" | "binaYaz" = "malikYaz") {
  const kullanici = await yetkiGerekli(yetki);
  if (!(await binaErisimiVar(kullanici, binaId))) throw new Error("Bu binaya erişimin yok.");
  return kullanici;
}

export async function malikOlustur(_o: EylemDurumu, form: FormData): Promise<EylemDurumu> {
  try {
    const binaId = String(form.get("binaId") ?? "");
    await binaKontrol(binaId);
    const c = ayristir(MalikSemasi, form);
    if (!c.ok) return { hata: c.hata };

    const { engel, ...geri } = c.veri;
    await db.malik.create({
      data: { ...geri, binaId, engel: JSON.stringify(engel), sonTemas: bugun() },
    });
    revalidatePath(`/bina/${binaId}`);
    revalidatePath("/");
    redirect(`/bina/${binaId}`);
  } catch (e) {
    if (e && typeof e === "object" && "digest" in e) throw e;
    return { hata: hataMetni(e) };
  }
}

export async function malikGuncelle(_o: EylemDurumu, form: FormData): Promise<EylemDurumu> {
  try {
    const binaId = String(form.get("binaId") ?? "");
    const id = String(form.get("id") ?? "");
    await binaKontrol(binaId);
    const c = ayristir(MalikSemasi, form);
    if (!c.ok) return { hata: c.hata };

    const mevcut = await db.malik.findUnique({ where: { id } });
    if (!mevcut || mevcut.binaId !== binaId) return { hata: "Malik kaydı bulunamadı." };

    const { engel, ...geri } = c.veri;
    await db.malik.update({
      data: {
        ...geri,
        engel: JSON.stringify(engel),
        // Tavır değiştiyse son temas tarihini güncelle
        sonTemas: mevcut.durum !== geri.durum ? bugun() : mevcut.sonTemas,
      },
      where: { id },
    });
    revalidatePath(`/bina/${binaId}`);
    revalidatePath("/");
    redirect(`/bina/${binaId}`);
  } catch (e) {
    if (e && typeof e === "object" && "digest" in e) throw e;
    return { hata: hataMetni(e) };
  }
}

/** Tablodaki tavır düğmeleri — tek tıkla durum değiştirme. */
export async function durumDegistir(malikId: string, durum: string) {
  const malik = await db.malik.findUnique({ where: { id: malikId } });
  if (!malik) throw new Error("Malik bulunamadı.");
  await binaKontrol(malik.binaId);
  if (!DURUM_KODLARI.includes(durum)) throw new Error("Geçersiz tavır.");

  await db.malik.update({
    where: { id: malikId },
    data: { durum, sonTemas: bugun() },
  });
  revalidatePath(`/bina/${malik.binaId}`);
  revalidatePath("/");
}

export async function malikSil(malikId: string) {
  const malik = await db.malik.findUnique({ where: { id: malikId } });
  if (!malik) return;
  await binaKontrol(malik.binaId, "binaYaz");
  await db.malik.delete({ where: { id: malikId } });
  revalidatePath(`/bina/${malik.binaId}`);
  revalidatePath("/");
}

/** Bağımsız bölümleri tek seferde açar; paydayı eşit bölebilir. */
export async function topluDaire(_o: EylemDurumu, form: FormData): Promise<EylemDurumu> {
  try {
    const binaId = String(form.get("binaId") ?? "");
    await binaKontrol(binaId, "binaYaz");

    const adet = Math.max(1, Math.min(300, Number(form.get("adet")) || 0));
    const esitBol = form.get("esit") === "on";
    const bina = await db.bina.findUnique({
      where: { id: binaId },
      include: { _count: { select: { malikler: true } } },
    });
    if (!bina) return { hata: "Bina bulunamadı." };

    const baslangic = bina._count.malikler;
    const pay = esitBol ? Math.round((bina.payda / adet) * 100) / 100 : 0;

    await db.malik.createMany({
      data: Array.from({ length: adet }, (_, i) => ({
        binaId,
        ad: `D.${baslangic + i + 1} maliki`,
        bb: String(baslangic + i + 1),
        pay,
        durum: "ulasilamadi",
        engel: "[]",
      })),
    });
    revalidatePath(`/bina/${binaId}`);
    revalidatePath("/");
    return { basari: `${adet} bağımsız bölüm oluşturuldu.` };
  } catch (e) {
    return { hata: hataMetni(e) };
  }
}
