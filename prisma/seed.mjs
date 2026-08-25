/**
 * Kurulum betiği.
 *   node prisma/seed.mjs            → sözlük + ayar + ilk yönetici
 *   node prisma/seed.mjs --yedek x  → JSON yedeğini içe aktar
 *
 * Yeniden çalıştırılabilir: mevcut kayıtların üzerine yazmaz.
 */
import { PrismaClient } from "@prisma/client";
import { randomBytes, scrypt as _scrypt } from "node:crypto";
import { promisify } from "node:util";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const scrypt = promisify(_scrypt);
const db = new PrismaClient();

const argv = process.argv.slice(2);
const yedekYolu = argv.includes("--yedek") ? argv[argv.indexOf("--yedek") + 1] : null;

async function hashle(sifre) {
  const tuz = randomBytes(16).toString("hex");
  const t = await scrypt(sifre.normalize("NFKC"), tuz, 64);
  return `scrypt$${tuz}$${t.toString("hex")}`;
}

const ASAMALAR = [
  ["tespit", "Tespit & Ön Fizibilite", true],
  ["gorusme", "Malik Görüşmeleri", true],
  ["yetki", "Münhasır Yetki", true],
  ["sartname", "Şartname & Avam Proje", true],
  ["ihale", "İhale / Teklif", true],
  ["sozlesme", "Sözleşme & Teminat", true],
  ["insaat", "İnşaat", false],
  ["iskan", "İskan", false],
  ["kayip", "Beklemede / Kayıp", false],
];

const ENGELLER = [
  ["ipotek", "İpotek"],
  ["haciz", "Haciz"],
  ["intikal", "İntikal eksik"],
  ["vesayet", "Vesayet / kayyum"],
  ["serh", "Şerh"],
  ["paydas", "Hisseli / paydaş"],
  ["yurtdisi", "Yurtdışında"],
];

const AYARLAR = {
  sirketAd: "Kentsel Rota",
  sirketUnvan: "",
  ucretFormulu:
    "Danışmanlık bedeli kazanan yükleniciden alınır; tutar ihale şartnamesinde ilan edilir, tüm teklif verenler için aynıdır ve kazananla pazarlık edilmez.",
  esikYuzde: "50",
  varsayilanAgirliklar: JSON.stringify({
    malikPayi: 35, kira: 10, nakdi: 10, sure: 15, teminat: 15, teknik: 15,
  }),
  temasUyariGun: "30",
  kvkkNot:
    "Bu sistemde malik ad-soyad, telefon ve tapu bilgisi işlenir. Aydınlatma metni münhasır yetki sözleşmesinin ekidir. TC kimlik numarası ve tapu görüntüsü toplanmaz.",
};

async function veriAktar(veri, kaynak) {
  const binaSay = await db.bina.count();
  if (binaSay > 0) {
    console.log(`  · veritabanında zaten ${binaSay} bina var — aktarım atlandı`);
    return;
  }
  if (!veri || !Array.isArray(veri.binalar)) {
    console.log("  · aktarılacak veri bulunamadı");
    return;
  }

  for (const c of veri.muteahhitler ?? []) {
    await db.muteahhit.create({
      data: {
        id: c.id,
        unvan: c.unvan ?? "—",
        yetkili: c.yetkili ?? "",
        tel: c.tel ?? "",
        eposta: c.email ?? c.eposta ?? "",
        vergiNo: c.vergiNo ?? "",
        ymbn: c.ymbn ?? "B",
        referans: c.referans ?? "",
        durum: c.durum ?? "degerlendirmede",
        nda: !!c.nda,
        ndaTarih: c.ndaTarih ?? "",
        taahhut: !!c.taahhut,
        not: c.not ?? "",
      },
    });
  }

  for (const b of veri.binalar) {
    await db.bina.create({
      data: {
        id: b.id,
        ad: b.ad ?? "—",
        il: b.il ?? "İstanbul",
        ilce: b.ilce ?? "",
        mahalle: b.mahalle ?? "",
        adres: b.adres ?? "",
        ada: String(b.ada ?? ""),
        parsel: String(b.parsel ?? ""),
        arsaM2: Number(b.arsaM2) || 0,
        emsal: Number(b.emsal) || 0,
        taks: Number(b.taks) || 0,
        mevcutKat: Number(b.mevcutKat) || 0,
        riskli: b.riskli ?? "yok",
        asamaKod: b.asama ?? b.asamaKod ?? "tespit",
        payda: Number(b.payda) || 1000,
        notlar: b.notlar ?? "",
        agirliklar: JSON.stringify(b.agirliklar ?? {}),
        agirlikKilit: b.agirlikKilit ?? "",
        malikler: {
          create: (b.malikler ?? []).map((m) => ({
            id: m.id,
            ad: m.ad ?? "—",
            bb: String(m.bb ?? ""),
            kat: String(m.kat ?? ""),
            pay: Number(m.pay) || 0,
            durum: m.durum ?? "ulasilamadi",
            engel: JSON.stringify(m.engel ?? []),
            kiraci: !!m.kiraci,
            tel: m.tel ?? "",
            not: m.not ?? "",
            sonTemas: m.son ?? m.sonTemas ?? "",
          })),
        },
      },
    });

    for (const t of b.teklifler ?? []) {
      const mid = t.mid ?? t.muteahhitId;
      if (!mid || !(await db.muteahhit.findUnique({ where: { id: mid } }))) continue;
      await db.teklif.create({
        data: {
          id: t.id,
          binaId: b.id,
          muteahhitId: mid,
          malikPayi: Number(t.malikPayi) || 0,
          kiraAy: Number(t.kiraAy) || 0,
          kiraTutar: Number(t.kiraTutar) || 0,
          nakdi: Number(t.nakdi) || 0,
          sureAy: Number(t.sureAy) || 0,
          teminat: Number(t.teminat) || 0,
          teknik: Number(t.teknik) || 70,
          tarih: t.tarih ?? "",
          not: t.not ?? "",
        },
      });
    }
  }

  const [nb, nm, nt] = await Promise.all([
    db.bina.count(), db.malik.count(), db.teklif.count(),
  ]);
  console.log(`  · ${kaynak}: ${nb} bina, ${nm} malik, ${nt} teklif aktarıldı`);
}

async function main() {
  console.log("Kentsel Rota — kurulum\n");

  console.log("• Sözlükler");
  for (let i = 0; i < ASAMALAR.length; i++) {
    const [kod, ad, hepGoster] = ASAMALAR[i];
    await db.asama.upsert({
      where: { kod },
      create: { kod, ad, sira: i, hepGoster },
      update: {},
    });
  }
  for (let i = 0; i < ENGELLER.length; i++) {
    const [kod, ad] = ENGELLER[i];
    await db.engelTuru.upsert({ where: { kod }, create: { kod, ad, sira: i }, update: {} });
  }
  console.log(`  · ${ASAMALAR.length} aşama, ${ENGELLER.length} hukuki engel türü`);

  console.log("• Ayarlar");
  for (const [anahtar, deger] of Object.entries(AYARLAR)) {
    await db.ayar.upsert({ where: { anahtar }, create: { anahtar, deger }, update: {} });
  }

  console.log("• İlk yönetici");
  const eposta = (process.env.ILK_ADMIN_EPOSTA ?? "admin@kentselrota.local").toLowerCase().trim();
  const varOlan = await db.kullanici.findUnique({ where: { eposta } });
  if (varOlan) {
    console.log(`  · ${eposta} zaten var — dokunulmadı`);
  } else {
    const sifre = process.env.ILK_ADMIN_SIFRE || "degistir-beni";
    await db.kullanici.create({
      data: {
        eposta,
        ad: process.env.ILK_ADMIN_AD || "Yönetici",
        sifreHash: await hashle(sifre),
        rol: "ADMIN",
        aktif: true,
      },
    });
    console.log(`  · ${eposta} oluşturuldu — şifre: ${sifre}`);
    console.log("    ⚠ İlk girişten sonra Yönetim → Kullanıcılar'dan şifreyi değiştir.");
  }

  if (yedekYolu) {
    console.log("• Yedek dosyasından aktarım");
    await veriAktar(JSON.parse(readFileSync(resolve(yedekYolu), "utf8")), yedekYolu);
  }

  console.log("\nHazır. `npm run dev` ile başlat → http://localhost:3000");
}

main()
  .catch((e) => {
    console.error("\nKurulum hatası:", e);
    process.exitCode = 1;
  })
  .finally(() => db.$disconnect());
