"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { oturumAl, oturumBaslat, yoneticiGerekli, oturumGerekli } from "@/lib/oturum";
import { bosaNull, formDegerleri } from "@/lib/yardimcilar";

export type FormDurumu = { hata?: string; basarili?: string; degerler?: Record<string, string> };

const EN_AZ_SIFRE = 8;

export async function kullaniciKaydet(_onceki: FormDurumu, form: FormData): Promise<FormDurumu> {
  const oturum = await oturumAl();
  if (!oturum || oturum.rol !== "ADMIN") return { hata: "Bu işlem için yönetici yetkisi gerekir.", degerler: formDegerleri(form) };

  const id = bosaNull(form.get("id"));
  const ad = bosaNull(form.get("ad"));
  const email = bosaNull(form.get("email"))?.toLowerCase();
  const sifre = String(form.get("sifre") ?? "");
  const rol = String(form.get("rol") ?? "DANISMAN");

  if (!ad || !email) return { hata: "Ad ve e-posta alanları zorunludur.", degerler: formDegerleri(form) };
  if (!id && sifre.length < EN_AZ_SIFRE) {
    return { hata: `Yeni kullanıcı için en az ${EN_AZ_SIFRE} karakterlik bir şifre girin.`, degerler: formDegerleri(form) };
  }
  if (sifre && sifre.length < EN_AZ_SIFRE) {
    return { hata: `Şifre en az ${EN_AZ_SIFRE} karakter olmalıdır.`, degerler: formDegerleri(form) };
  }

  const cakisan = await db.kullanici.findUnique({ where: { email } });
  if (cakisan && cakisan.id !== id) {
    return { hata: "Bu e-posta adresi başka bir kullanıcıya ait.", degerler: formDegerleri(form) };
  }

  // Son yöneticinin yetkisi düşürülmesin
  if (id && rol !== "ADMIN") {
    const mevcut = await db.kullanici.findUnique({ where: { id }, select: { rol: true } });
    if (mevcut?.rol === "ADMIN") {
      const adminSayisi = await db.kullanici.count({ where: { rol: "ADMIN", aktif: true } });
      if (adminSayisi <= 1) return { hata: "Sistemde en az bir yönetici kalmalı.", degerler: formDegerleri(form) };
    }
  }

  const veri = {
    ad,
    email,
    rol,
    telefon: bosaNull(form.get("telefon")),
    aktif: form.get("aktif") === "on",
    ...(sifre ? { sifreHash: bcrypt.hashSync(sifre, 10) } : {}),
  };

  if (id) {
    await db.kullanici.update({ where: { id }, data: veri });
  } else {
    await db.kullanici.create({ data: { ...veri, sifreHash: bcrypt.hashSync(sifre, 10) } });
  }

  revalidatePath("/kullanicilar");
  redirect("/kullanicilar");
}

export async function kullaniciDurumDegistir(form: FormData) {
  const oturum = await yoneticiGerekli();
  const id = String(form.get("id") ?? "");
  if (!id || id === oturum.id) return;

  const kullanici = await db.kullanici.findUnique({ where: { id } });
  if (!kullanici) return;

  if (kullanici.aktif && kullanici.rol === "ADMIN") {
    const adminSayisi = await db.kullanici.count({ where: { rol: "ADMIN", aktif: true } });
    if (adminSayisi <= 1) return;
  }

  await db.kullanici.update({ where: { id }, data: { aktif: !kullanici.aktif } });
  revalidatePath("/kullanicilar");
}

export async function kullaniciSil(form: FormData) {
  const oturum = await yoneticiGerekli();
  const id = String(form.get("id") ?? "");
  if (!id || id === oturum.id) return;

  const kullanici = await db.kullanici.findUnique({ where: { id }, select: { rol: true } });
  if (kullanici?.rol === "ADMIN") {
    const adminSayisi = await db.kullanici.count({ where: { rol: "ADMIN" } });
    if (adminSayisi <= 1) return;
  }

  await db.kullanici.delete({ where: { id } });
  revalidatePath("/kullanicilar");
  redirect("/kullanicilar");
}

/* ------------------------------------------------------------------- Profil */

export async function profilGuncelle(_onceki: FormDurumu, form: FormData): Promise<FormDurumu> {
  const oturum = await oturumGerekli();

  const ad = bosaNull(form.get("ad"));
  if (!ad) return { hata: "Ad alanı zorunludur.", degerler: formDegerleri(form) };

  const guncel = await db.kullanici.update({
    where: { id: oturum.id },
    data: { ad, telefon: bosaNull(form.get("telefon")) },
  });

  await oturumBaslat({ id: guncel.id, ad: guncel.ad, email: guncel.email, rol: guncel.rol });

  revalidatePath("/profil");
  revalidatePath("/", "layout");
  return { basarili: "Profil bilgileriniz güncellendi." };
}

export async function sifreDegistir(_onceki: FormDurumu, form: FormData): Promise<FormDurumu> {
  const oturum = await oturumGerekli();

  const mevcut = String(form.get("mevcutSifre") ?? "");
  const yeni = String(form.get("yeniSifre") ?? "");
  const tekrar = String(form.get("yeniSifreTekrar") ?? "");

  if (yeni.length < EN_AZ_SIFRE) return { hata: `Yeni şifre en az ${EN_AZ_SIFRE} karakter olmalıdır.`, degerler: formDegerleri(form) };
  if (yeni !== tekrar) return { hata: "Yeni şifre tekrarı eşleşmiyor.", degerler: formDegerleri(form) };

  const kullanici = await db.kullanici.findUnique({ where: { id: oturum.id } });
  if (!kullanici || !bcrypt.compareSync(mevcut, kullanici.sifreHash)) {
    return { hata: "Mevcut şifreniz hatalı.", degerler: formDegerleri(form) };
  }

  await db.kullanici.update({
    where: { id: oturum.id },
    data: { sifreHash: bcrypt.hashSync(yeni, 10) },
  });

  return { basarili: "Şifreniz değiştirildi." };
}
