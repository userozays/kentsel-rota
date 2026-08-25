"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/lib/db";
import { binaErisimiVar, oturumGerekli, yetkiGerekli } from "@/lib/auth";
import { ayristir, hataMetni, type EylemDurumu } from "@/lib/eylem";
import { RISKLI_KODLARI, VARSAYILAN_AGIRLIKLAR } from "@/lib/sabitler";
import { ayarlariOku } from "@/lib/ayarlar";

const sayiAlan = (varsayilan = 0) =>
  z.coerce.number().finite().nonnegative().catch(varsayilan);

const BinaSemasi = z.object({
  ad: z.string().trim().min(2, "Bina adı en az 2 karakter olmalı."),
  il: z.string().trim().default(""),
  ilce: z.string().trim().default(""),
  mahalle: z.string().trim().default(""),
  adres: z.string().trim().default(""),
  ada: z.string().trim().default(""),
  parsel: z.string().trim().default(""),
  arsaM2: sayiAlan(),
  emsal: sayiAlan(),
  taks: sayiAlan(),
  mevcutKat: z.coerce.number().int().min(0).max(200).catch(0),
  riskli: z.enum(RISKLI_KODLARI).catch("yok"),
  asamaKod: z.string().trim().min(1),
  payda: z.coerce.number().positive("Payda sıfırdan büyük olmalı."),
  notlar: z.string().trim().default(""),
});

export async function binaOlustur(_o: EylemDurumu, form: FormData): Promise<EylemDurumu> {
  try {
    await yetkiGerekli("binaYaz");
    const c = ayristir(BinaSemasi, form);
    if (!c.ok) return { hata: c.hata };

    const ayarlar = await ayarlariOku();
    const bina = await db.bina.create({
      data: {
        ...c.veri,
        agirliklar: JSON.stringify(ayarlar.varsayilanAgirliklar ?? VARSAYILAN_AGIRLIKLAR),
      },
    });
    revalidatePath("/");
    redirect(`/bina/${bina.id}`);
  } catch (e) {
    if (e && typeof e === "object" && "digest" in e) throw e; // redirect
    return { hata: hataMetni(e) };
  }
}

export async function binaGuncelle(_o: EylemDurumu, form: FormData): Promise<EylemDurumu> {
  try {
    const kullanici = await yetkiGerekli("binaYaz");
    const id = String(form.get("id") ?? "");
    if (!(await binaErisimiVar(kullanici, id))) return { hata: "Bu binaya erişimin yok." };

    const c = ayristir(BinaSemasi, form);
    if (!c.ok) return { hata: c.hata };

    await db.bina.update({ where: { id }, data: c.veri });
    revalidatePath("/");
    revalidatePath(`/bina/${id}`);
    redirect(`/bina/${id}`);
  } catch (e) {
    if (e && typeof e === "object" && "digest" in e) throw e;
    return { hata: hataMetni(e) };
  }
}

export async function asamaDegistir(binaId: string, asamaKod: string) {
  const kullanici = await yetkiGerekli("binaYaz");
  if (!(await binaErisimiVar(kullanici, binaId))) throw new Error("Bu binaya erişimin yok.");
  await db.bina.update({ where: { id: binaId }, data: { asamaKod } });
  revalidatePath("/");
  revalidatePath(`/bina/${binaId}`);
}

export async function binaSil(binaId: string) {
  await yetkiGerekli("binaYaz");
  await db.bina.delete({ where: { id: binaId } });
  revalidatePath("/");
  redirect("/");
}

/** Binanın kendi kriter ağırlıkları — kilitliyken değiştirilemez. */
export async function agirlikGuncelle(_o: EylemDurumu, form: FormData): Promise<EylemDurumu> {
  try {
    const kullanici = await yetkiGerekli("teklifYaz");
    const binaId = String(form.get("binaId") ?? "");
    if (!(await binaErisimiVar(kullanici, binaId))) return { hata: "Bu binaya erişimin yok." };

    const bina = await db.bina.findUnique({ where: { id: binaId } });
    if (!bina) return { hata: "Bina bulunamadı." };
    if (bina.agirlikKilit) {
      return { hata: "Ağırlıklar kilitli. Değiştirmek için önce kilidi açman gerekir." };
    }

    const yeni: Record<string, number> = {};
    for (const k of ["malikPayi", "kira", "nakdi", "sure", "teminat", "teknik"]) {
      const v = Number(form.get(k));
      yeni[k] = Number.isFinite(v) && v >= 0 ? Math.min(v, 100) : 0;
    }
    // Hepsi sıfırsa her teklif aynı puanı alır — puanlama anlamını yitirir.
    if (Object.values(yeni).every((v) => v === 0)) {
      return { hata: "En az bir kriterin ağırlığı sıfırdan büyük olmalı." };
    }
    await db.bina.update({ where: { id: binaId }, data: { agirliklar: JSON.stringify(yeni) } });
    revalidatePath("/teklifler");
    return { basari: "Ağırlıklar güncellendi." };
  } catch (e) {
    return { hata: hataMetni(e) };
  }
}

export async function agirlikKilitle(binaId: string) {
  await yetkiGerekli("teklifYaz");
  await db.bina.update({
    where: { id: binaId },
    data: { agirlikKilit: new Date().toISOString().slice(0, 10) },
  });
  revalidatePath("/teklifler");
}

export async function agirlikKilidiAc(binaId: string) {
  await yetkiGerekli("teklifYaz");
  await db.bina.update({ where: { id: binaId }, data: { agirlikKilit: "" } });
  revalidatePath("/teklifler");
}

/** Kullanıcının erişebildiği bir binayı döndürür, yoksa null. */
export async function binaGetir(id: string) {
  const kullanici = await oturumGerekli();
  if (!(await binaErisimiVar(kullanici, id))) return null;
  return db.bina.findUnique({
    where: { id },
    include: { malikler: { orderBy: { pay: "desc" } } },
  });
}
