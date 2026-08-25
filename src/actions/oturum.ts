"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/lib/db";
import { oturumAc, oturumKapat, sifreDogrula } from "@/lib/auth";

export type GirisDurumu = { hata?: string };

const GirisSemasi = z.object({
  eposta: z.string().trim().toLowerCase().email("Geçerli bir e-posta gir."),
  sifre: z.string().min(1, "Şifre boş olamaz."),
});

/**
 * Kaba kuvvet denemelerine karşı basit, süreç içi sayaç.
 * Tek sunucu için yeterli; çok örnekli kuruluma geçilirse Redis'e taşınmalı.
 */
const denemeler = new Map<string, { sayi: number; ilk: number }>();
const PENCERE_MS = 10 * 60 * 1000;
const SINIR = 8;

function denemeArtir(anahtar: string) {
  const simdi = Date.now();
  const k = denemeler.get(anahtar);
  if (!k || simdi - k.ilk > PENCERE_MS) {
    denemeler.set(anahtar, { sayi: 1, ilk: simdi });
    return 1;
  }
  k.sayi += 1;
  return k.sayi;
}

export async function girisYap(_onceki: GirisDurumu, form: FormData): Promise<GirisDurumu> {
  const ayrist = GirisSemasi.safeParse({
    eposta: form.get("eposta"),
    sifre: form.get("sifre"),
  });
  if (!ayrist.success) {
    return { hata: ayrist.error.issues[0]?.message ?? "Bilgileri kontrol et." };
  }
  const { eposta, sifre } = ayrist.data;

  const sayac = denemeArtir(eposta);
  if (sayac > SINIR) {
    return { hata: "Çok fazla hatalı deneme. 10 dakika sonra tekrar dene." };
  }

  const kullanici = await db.kullanici.findUnique({ where: { eposta } });

  // Kullanıcı yoksa da doğrulama maliyetini öde — hesabın var olup olmadığı
  // yanıt süresinden anlaşılmasın.
  const gecerli = kullanici
    ? await sifreDogrula(sifre, kullanici.sifreHash)
    : await sifreDogrula(sifre, "scrypt$00$00");

  if (!kullanici || !gecerli) {
    return { hata: "E-posta veya şifre hatalı." };
  }
  if (!kullanici.aktif) {
    return { hata: "Bu hesap devre dışı. Yöneticinle görüş." };
  }

  denemeler.delete(eposta);
  await db.kullanici.update({
    where: { id: kullanici.id },
    data: { sonGiris: new Date() },
  });
  await oturumAc(kullanici.id);
  redirect("/");
}

export async function cikisYap() {
  await oturumKapat();
  redirect("/giris");
}
