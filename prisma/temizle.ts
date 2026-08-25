/**
 * Demo verisini tamamen siler ve sadece bir yönetici hesabı bırakır.
 * Canlıya geçmeden önce bir kez çalıştırın:
 *
 *   npm run db:temizle
 *
 * Ortam değişkenleriyle yönetici bilgilerini verebilirsiniz:
 *   ADMIN_AD, ADMIN_EMAIL, ADMIN_SIFRE
 */

import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import readline from "node:readline/promises";

const db = new PrismaClient();

async function main() {
  const ad = process.env.ADMIN_AD ?? "Özay Hilmi";
  const email = (process.env.ADMIN_EMAIL ?? "ozay.hilmi@hedefltd.com").toLowerCase();
  const sifre = process.env.ADMIN_SIFRE;

  if (!sifre || sifre.length < 8) {
    console.error("ADMIN_SIFRE ortam degiskenini en az 8 karakter olarak verin.");
    console.error('Ornek:  ADMIN_SIFRE="CokGizliSifre1" npm run db:temizle');
    process.exit(1);
  }

  const sayim = {
    bina: await db.bina.count(),
    malik: await db.malik.count(),
    muteahhit: await db.muteahhit.count(),
    kullanici: await db.kullanici.count(),
  };

  console.log("Silinecek kayitlar:");
  console.log(`  ${sayim.bina} bina, ${sayim.malik} malik, ${sayim.muteahhit} muteahhit, ${sayim.kullanici} kullanici`);

  if (process.env.ONAYLA !== "evet") {
    const soru = readline.createInterface({ input: process.stdin, output: process.stdout });
    const cevap = await soru.question('Tum veriler silinecek. Devam etmek icin "SIL" yazin: ');
    soru.close();
    if (cevap.trim() !== "SIL") {
      console.log("Iptal edildi, hicbir sey silinmedi.");
      process.exit(0);
    }
  }

  await db.aktivite.deleteMany();
  await db.belge.deleteMany();
  await db.surecAdimi.deleteMany();
  await db.hisse.deleteMany();
  await db.bina.deleteMany();
  await db.malik.deleteMany();
  await db.muteahhit.deleteMany();
  await db.kullanici.deleteMany();

  await db.kullanici.create({
    data: { ad, email, rol: "ADMIN", sifreHash: bcrypt.hashSync(sifre, 10), aktif: true },
  });

  console.log("\nVeritabani temizlendi.");
  console.log(`Yonetici hesabi: ${email}`);
  console.log("Diger ekip uyelerini panel icindeki Kullanicilar sayfasindan ekleyebilirsiniz.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
