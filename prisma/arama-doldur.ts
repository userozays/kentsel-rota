/**
 * Tüm kayıtların normalize edilmiş arama sütunlarını yeniden hesaplar.
 * Arama mantığı değişirse veya toplu veri içe aktarıldıysa çalıştırın:
 *
 *   npm run db:arama
 */

import { PrismaClient } from "@prisma/client";
import { binaAramaMetni, malikAramaMetni, muteahhitAramaMetni } from "../src/lib/arama";

const db = new PrismaClient();

async function main() {
  const binalar = await db.bina.findMany();
  for (const b of binalar) {
    await db.bina.update({ where: { id: b.id }, data: { aramaMetni: binaAramaMetni(b) } });
  }
  console.log(binalar.length + " bina guncellendi");

  const malikler = await db.malik.findMany();
  for (const m of malikler) {
    await db.malik.update({ where: { id: m.id }, data: { aramaMetni: malikAramaMetni(m) } });
  }
  console.log(malikler.length + " malik guncellendi");

  const muteahhitler = await db.muteahhit.findMany();
  for (const m of muteahhitler) {
    await db.muteahhit.update({ where: { id: m.id }, data: { aramaMetni: muteahhitAramaMetni(m) } });
  }
  console.log(muteahhitler.length + " muteahhit guncellendi");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
