"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { yetkiGerekli } from "@/lib/auth";
import { ayarYaz } from "@/lib/ayarlar";
import { ayristir, hataMetni, type EylemDurumu } from "@/lib/eylem";
import { KRITERLER } from "@/lib/sabitler";

const GenelSemasi = z.object({
  sirketAd: z.string().trim().min(1, "Şirket adı boş olamaz.").max(60),
  sirketUnvan: z.string().trim().max(200).default(""),
  ucretFormulu: z.string().trim().max(1000).default(""),
  kvkkNot: z.string().trim().max(1000).default(""),
  esikYuzde: z.coerce
    .number()
    .min(1, "Eşik 1–99 arasında olmalı.")
    .max(99, "Eşik 1–99 arasında olmalı."),
  temasUyariGun: z.coerce.number().int().min(1).max(365).catch(30),
});

export async function genelAyarlariKaydet(_o: EylemDurumu, form: FormData): Promise<EylemDurumu> {
  try {
    await yetkiGerekli("yonetim");
    const c = ayristir(GenelSemasi, form);
    if (!c.ok) return { hata: c.hata };

    for (const [anahtar, deger] of Object.entries(c.veri)) {
      await ayarYaz(anahtar, String(deger));
    }
    revalidatePath("/", "layout");
    return { basari: "Ayarlar kaydedildi." };
  } catch (e) {
    return { hata: hataMetni(e) };
  }
}

export async function varsayilanAgirlikKaydet(
  _o: EylemDurumu,
  form: FormData,
): Promise<EylemDurumu> {
  try {
    await yetkiGerekli("yonetim");
    const yeni: Record<string, number> = {};
    for (const k of KRITERLER) {
      const v = Number(form.get(k.kod));
      yeni[k.kod] = Number.isFinite(v) && v >= 0 ? Math.min(v, 100) : 0;
    }
    // Hepsi sıfırsa puanlama anlamsız hale gelir — en az bir kriterin ağırlığı olmalı.
    if (Object.values(yeni).every((v) => v === 0)) {
      return { hata: "En az bir kriterin ağırlığı sıfırdan büyük olmalı." };
    }
    await ayarYaz("varsayilanAgirliklar", JSON.stringify(yeni));
    revalidatePath("/yonetim/ayarlar");
    return {
      basari:
        "Varsayılan ağırlıklar kaydedildi. Bundan sonra eklenen binalar bu ağırlıklarla açılır; mevcut binalar etkilenmez.",
    };
  } catch (e) {
    return { hata: hataMetni(e) };
  }
}

/* ---------- sözlükler ---------- */

export async function asamaKaydet(_o: EylemDurumu, form: FormData): Promise<EylemDurumu> {
  try {
    await yetkiGerekli("yonetim");
    const asamalar = await db.asama.findMany();

    for (const a of asamalar) {
      const ad = String(form.get(`ad_${a.kod}`) ?? "").trim();
      if (!ad) return { hata: `"${a.ad}" için ad boş olamaz.` };
      await db.asama.update({
        where: { kod: a.kod },
        data: {
          ad,
          sira: Number(form.get(`sira_${a.kod}`)) || 0,
          aktif: form.get(`aktif_${a.kod}`) === "on",
          hepGoster: form.get(`goster_${a.kod}`) === "on",
        },
      });
    }

    // Pasife alınan bir aşamada bina kaldıysa uyar
    const pasifKodlar = asamalar
      .filter((a) => form.get(`aktif_${a.kod}`) !== "on")
      .map((a) => a.kod);
    const oksuz = pasifKodlar.length
      ? await db.bina.count({ where: { asamaKod: { in: pasifKodlar } } })
      : 0;

    revalidatePath("/", "layout");
    return {
      basari: oksuz
        ? `Aşamalar kaydedildi. Dikkat: pasife aldığın aşamalarda ${oksuz} bina duruyor; panoda görünmezler.`
        : "Aşamalar kaydedildi.",
    };
  } catch (e) {
    return { hata: hataMetni(e) };
  }
}

export async function engelKaydet(_o: EylemDurumu, form: FormData): Promise<EylemDurumu> {
  try {
    await yetkiGerekli("yonetim");
    const turler = await db.engelTuru.findMany();
    for (const t of turler) {
      const ad = String(form.get(`ad_${t.kod}`) ?? "").trim();
      if (!ad) return { hata: `"${t.ad}" için ad boş olamaz.` };
      await db.engelTuru.update({
        where: { kod: t.kod },
        data: {
          ad,
          sira: Number(form.get(`sira_${t.kod}`)) || 0,
          aktif: form.get(`aktif_${t.kod}`) === "on",
        },
      });
    }
    revalidatePath("/", "layout");
    return { basari: "Hukuki engel türleri kaydedildi." };
  } catch (e) {
    return { hata: hataMetni(e) };
  }
}

export async function engelEkle(_o: EylemDurumu, form: FormData): Promise<EylemDurumu> {
  try {
    await yetkiGerekli("yonetim");
    const ad = String(form.get("ad") ?? "").trim();
    if (ad.length < 2) return { hata: "Engel adı en az 2 karakter olmalı." };

    const kod = ad
      .toLocaleLowerCase("tr-TR")
      .replace(/ı/g, "i").replace(/ğ/g, "g").replace(/ü/g, "u")
      .replace(/ş/g, "s").replace(/ö/g, "o").replace(/ç/g, "c")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 30);
    if (!kod) return { hata: "Bu addan geçerli bir kod üretilemedi." };

    const mevcut = await db.engelTuru.findUnique({ where: { kod } });
    if (mevcut) return { hata: "Bu ada çok benzeyen bir tür zaten var." };

    const enBuyuk = await db.engelTuru.aggregate({ _max: { sira: true } });
    await db.engelTuru.create({ data: { kod, ad, sira: (enBuyuk._max.sira ?? 0) + 1 } });

    revalidatePath("/yonetim/ayarlar");
    return { basari: `"${ad}" eklendi.` };
  } catch (e) {
    return { hata: hataMetni(e) };
  }
}
