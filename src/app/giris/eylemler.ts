"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { oturumBaslat } from "@/lib/oturum";
import { formDegerleri } from "@/lib/yardimcilar";
import { basariliDeneme, basarisizDeneme, kalanKilitSaniye } from "@/lib/giris-limiti";

export type GirisDurumu = { hata?: string; degerler?: Record<string, string> };

export async function girisYap(_onceki: GirisDurumu, form: FormData): Promise<GirisDurumu> {
  const email = String(form.get("email") ?? "").trim().toLowerCase();
  const sifre = String(form.get("sifre") ?? "");
  const devam = String(form.get("devam") ?? "") || "/";

  if (!email || !sifre) {
    return { hata: "E-posta ve şifre alanlarını doldurun.", degerler: formDegerleri(form) };
  }

  /* Kaba kuvvet koruması. Nginx arkasında gerçek IP x-forwarded-for'da;
     ilk değer istemcinin adresi. Başlık yoksa yalnızca e-posta sayacı işler. */
  const basliklar = await headers();
  const ip = (basliklar.get("x-forwarded-for") ?? "").split(",")[0].trim();
  const anahtarlar = [`e:${email}`, ...(ip ? [`i:${ip}`] : [])];

  const kalan = kalanKilitSaniye(anahtarlar);
  if (kalan > 0) {
    const dakika = Math.ceil(kalan / 60);
    return {
      hata: `Çok fazla başarısız deneme. ${dakika} dakika sonra tekrar deneyin.`,
      degerler: formDegerleri(form),
    };
  }

  const kullanici = await db.kullanici.findUnique({ where: { email } });

  // Kullanıcı yoksa da aynı süre harcansın diye sahte bir karşılaştırma yapılır
  const dogru = kullanici
    ? bcrypt.compareSync(sifre, kullanici.sifreHash)
    : bcrypt.compareSync(sifre, "$2a$10$invalidinvalidinvalidinvalidinvalidinvalidinvalidinva");

  if (!kullanici || !dogru) {
    basarisizDeneme(anahtarlar);
    return { hata: "E-posta veya şifre hatalı.", degerler: formDegerleri(form) };
  }

  if (!kullanici.aktif) {
    // Bu da sayılır: şifre doğru bilinmiş, yalnızca hesap kapalı
    basarisizDeneme(anahtarlar);
    return { hata: "Hesabınız pasif durumda. Yöneticinize başvurun.", degerler: formDegerleri(form) };
  }

  basariliDeneme(anahtarlar);

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
