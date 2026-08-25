"use server";

import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { oturumBaslat } from "@/lib/oturum";
import { formDegerleri } from "@/lib/yardimcilar";

export type GirisDurumu = { hata?: string; degerler?: Record<string, string> };

export async function girisYap(_onceki: GirisDurumu, form: FormData): Promise<GirisDurumu> {
  const email = String(form.get("email") ?? "").trim().toLowerCase();
  const sifre = String(form.get("sifre") ?? "");
  const devam = String(form.get("devam") ?? "") || "/";

  if (!email || !sifre) {
    return { hata: "E-posta ve şifre alanlarını doldurun.", degerler: formDegerleri(form) };
  }

  const kullanici = await db.kullanici.findUnique({ where: { email } });

  // Kullanıcı yoksa da aynı süre harcansın diye sahte bir karşılaştırma yapılır
  const dogru = kullanici
    ? bcrypt.compareSync(sifre, kullanici.sifreHash)
    : bcrypt.compareSync(sifre, "$2a$10$invalidinvalidinvalidinvalidinvalidinvalidinvalidinva");

  if (!kullanici || !dogru) {
    return { hata: "E-posta veya şifre hatalı.", degerler: formDegerleri(form) };
  }

  if (!kullanici.aktif) {
    return { hata: "Hesabınız pasif durumda. Yöneticinize başvurun.", degerler: formDegerleri(form) };
  }

  await db.kullanici.update({
    where: { id: kullanici.id },
    data: { sonGiris: new Date() },
  });

  await oturumBaslat({
    id: kullanici.id,
    ad: kullanici.ad,
    email: kullanici.email,
    rol: kullanici.rol,
  });

  redirect(devam.startsWith("/") ? devam : "/");
}
