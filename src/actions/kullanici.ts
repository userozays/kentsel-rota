"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/lib/db";
import { oturumGerekli, sifreHashle, yetkiGerekli } from "@/lib/auth";
import { ayristir, hataMetni, type EylemDurumu } from "@/lib/eylem";
import { ROL_KODLARI } from "@/lib/roller";

const SIFRE_ENAZ = 10;

const KullaniciSemasi = z.object({
  ad: z.string().trim().min(2, "Ad soyad en az 2 karakter olmalı."),
  eposta: z.string().trim().toLowerCase().email("Geçerli bir e-posta gir."),
  rol: z.enum(ROL_KODLARI),
  telefon: z.string().trim().max(30).default(""),
  not: z.string().trim().default(""),
  aktif: z.union([z.literal("on"), z.undefined()]).transform((v) => v === "on"),
});

const SifreSemasi = z
  .string()
  .min(SIFRE_ENAZ, `Şifre en az ${SIFRE_ENAZ} karakter olmalı.`)
  .max(200);

/** Sistemde en az bir etkin ADMIN kalmasını garanti eder. */
async function sonAdminKontrol(hedefId: string, yeniRol?: string, yeniAktif?: boolean) {
  const hedef = await db.kullanici.findUnique({ where: { id: hedefId } });
  if (!hedef || hedef.rol !== "ADMIN" || !hedef.aktif) return;

  const halaAdmin = (yeniRol ?? hedef.rol) === "ADMIN" && (yeniAktif ?? hedef.aktif);
  if (halaAdmin) return;

  const etkinAdmin = await db.kullanici.count({ where: { rol: "ADMIN", aktif: true } });
  if (etkinAdmin <= 1) {
    throw new Error(
      "Sistemdeki tek etkin yönetici bu hesap. Önce başka bir kullanıcıyı yönetici yap.",
    );
  }
}

export async function kullaniciOlustur(_o: EylemDurumu, form: FormData): Promise<EylemDurumu> {
  try {
    await yetkiGerekli("yonetim");
    const c = ayristir(KullaniciSemasi, form);
    if (!c.ok) return { hata: c.hata };

    const sifre = SifreSemasi.safeParse(String(form.get("sifre") ?? ""));
    if (!sifre.success) return { hata: sifre.error.issues[0].message };

    const mevcut = await db.kullanici.findUnique({ where: { eposta: c.veri.eposta } });
    if (mevcut) return { hata: "Bu e-posta zaten kayıtlı." };

    await db.kullanici.create({
      data: { ...c.veri, sifreHash: await sifreHashle(sifre.data) },
    });
    revalidatePath("/yonetim/kullanicilar");
    redirect("/yonetim/kullanicilar");
  } catch (e) {
    if (e && typeof e === "object" && "digest" in e) throw e;
    return { hata: hataMetni(e) };
  }
}

export async function kullaniciGuncelle(_o: EylemDurumu, form: FormData): Promise<EylemDurumu> {
  try {
    const yonetici = await yetkiGerekli("yonetim");
    const id = String(form.get("id") ?? "");
    const c = ayristir(KullaniciSemasi, form);
    if (!c.ok) return { hata: c.hata };

    // Kendini kilitleme koruması
    if (id === yonetici.id && (c.veri.rol !== "ADMIN" || !c.veri.aktif)) {
      return {
        hata: "Kendi yönetici yetkini kaldıramaz veya hesabını kapatamazsın. Bunu başka bir yönetici yapmalı.",
      };
    }
    await sonAdminKontrol(id, c.veri.rol, c.veri.aktif);

    const epostaSahibi = await db.kullanici.findUnique({ where: { eposta: c.veri.eposta } });
    if (epostaSahibi && epostaSahibi.id !== id) return { hata: "Bu e-posta başka bir hesapta kayıtlı." };

    await db.kullanici.update({ where: { id }, data: c.veri });

    // Hesap kapatıldıysa açık oturumları da düşür
    if (!c.veri.aktif) await db.oturum.deleteMany({ where: { kullaniciId: id } });

    revalidatePath("/yonetim/kullanicilar");
    return { basari: "Kullanıcı güncellendi." };
  } catch (e) {
    return { hata: hataMetni(e) };
  }
}

export async function sifreDegistir(_o: EylemDurumu, form: FormData): Promise<EylemDurumu> {
  try {
    await yetkiGerekli("yonetim");
    const id = String(form.get("id") ?? "");
    const sifre = SifreSemasi.safeParse(String(form.get("sifre") ?? ""));
    if (!sifre.success) return { hata: sifre.error.issues[0].message };

    await db.kullanici.update({
      where: { id },
      data: { sifreHash: await sifreHashle(sifre.data) },
    });
    // Şifre değişince eski oturumlar geçersiz olmalı
    await db.oturum.deleteMany({ where: { kullaniciId: id } });

    revalidatePath("/yonetim/kullanicilar");
    return { basari: "Şifre değiştirildi. Kullanıcının açık oturumları kapatıldı." };
  } catch (e) {
    return { hata: hataMetni(e) };
  }
}

/** Kullanıcının kendi şifresini değiştirmesi — mevcut şifreyi doğrular. */
export async function kendiSifremiDegistir(
  _o: EylemDurumu,
  form: FormData,
): Promise<EylemDurumu> {
  try {
    const kullanici = await oturumGerekli();
    const eski = String(form.get("eski") ?? "");
    const yeni = SifreSemasi.safeParse(String(form.get("yeni") ?? ""));
    if (!yeni.success) return { hata: yeni.error.issues[0].message };

    const kayit = await db.kullanici.findUnique({ where: { id: kullanici.id } });
    if (!kayit) return { hata: "Hesap bulunamadı." };

    const { sifreDogrula } = await import("@/lib/auth");
    if (!(await sifreDogrula(eski, kayit.sifreHash))) {
      return { hata: "Mevcut şifre hatalı." };
    }

    await db.kullanici.update({
      where: { id: kullanici.id },
      data: { sifreHash: await sifreHashle(yeni.data) },
    });
    return { basari: "Şifren değiştirildi." };
  } catch (e) {
    return { hata: hataMetni(e) };
  }
}

export async function kullaniciSil(id: string) {
  const yonetici = await yetkiGerekli("yonetim");
  if (id === yonetici.id) throw new Error("Kendi hesabını silemezsin.");
  await sonAdminKontrol(id, undefined, false);
  await db.kullanici.delete({ where: { id } });
  revalidatePath("/yonetim/kullanicilar");
}

/** SAHA rolündeki kullanıcının erişebileceği binaları belirler. */
export async function binaErisimiKaydet(_o: EylemDurumu, form: FormData): Promise<EylemDurumu> {
  try {
    await yetkiGerekli("yonetim");
    const kullaniciId = String(form.get("kullaniciId") ?? "");
    const secili = form.getAll("bina[]").map(String);

    const kullanici = await db.kullanici.findUnique({ where: { id: kullaniciId } });
    if (!kullanici) return { hata: "Kullanıcı bulunamadı." };

    await db.$transaction([
      db.binaErisim.deleteMany({ where: { kullaniciId } }),
      db.binaErisim.createMany({
        data: secili.map((binaId) => ({ kullaniciId, binaId })),
      }),
    ]);

    revalidatePath("/yonetim/kullanicilar");
    return { basari: `${secili.length} binaya erişim verildi.` };
  } catch (e) {
    return { hata: hataMetni(e) };
  }
}

/** Bir kullanıcının tüm açık oturumlarını kapatır. */
export async function oturumlariKapat(id: string) {
  await yetkiGerekli("yonetim");
  await db.oturum.deleteMany({ where: { kullaniciId: id } });
  revalidatePath("/yonetim/kullanicilar");
}
