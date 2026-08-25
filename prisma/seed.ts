import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { SUREC_SIRASI } from "../src/lib/sabitler";

const db = new PrismaClient();

/* Tekrarlanabilir sonuc icin basit sozde-rastgele uretici */
let tohum = 20260825;
const rnd = () => {
  tohum = (tohum * 1664525 + 1013904223) % 4294967296;
  return tohum / 4294967296;
};
const sec = <T,>(liste: T[]): T => liste[Math.floor(rnd() * liste.length)];
const araliktaSayi = (min: number, max: number) => Math.floor(rnd() * (max - min + 1)) + min;
const gunOnce = (g: number) => new Date(Date.now() - g * 86400000);

const ADLAR = [
  "Ahmet", "Mehmet", "Mustafa", "Ayşe", "Fatma", "Emine", "Hüseyin", "Ali", "Hatice", "İbrahim",
  "Zeynep", "Elif", "Murat", "Osman", "Hasan", "Yusuf", "Merve", "Selin", "Kadir", "Cemal",
  "Şerife", "Necla", "Kemal", "Songül", "Barış", "Deniz", "Gülcan", "Recep", "Nurten", "Levent",
];
const SOYADLAR = [
  "Yılmaz", "Kaya", "Demir", "Çelik", "Şahin", "Yıldız", "Yıldırım", "Öztürk", "Aydın", "Özdemir",
  "Arslan", "Doğan", "Kılıç", "Aslan", "Çetin", "Kara", "Koç", "Kurt", "Özkan", "Şimşek",
  "Polat", "Korkmaz", "Erdoğan", "Güneş", "Aksoy", "Bulut", "Tekin", "Turan", "Avcı", "Bozkurt",
];

const SEMTLER: { ilce: string; mahalleler: string[] }[] = [
  { ilce: "Bahçelievler", mahalleler: ["Şirinevler", "Yenibosna", "Soğanlı", "Kocasinan"] },
  { ilce: "Bağcılar", mahalleler: ["Güneşli", "Kirazlı", "Mahmutbey", "Yenimahalle"] },
  { ilce: "Küçükçekmece", mahalleler: ["Sefaköy", "Halkalı", "Cennet", "Atakent"] },
  { ilce: "Zeytinburnu", mahalleler: ["Merkezefendi", "Telsiz", "Sümer", "Beştelsiz"] },
  { ilce: "Esenler", mahalleler: ["Menderes", "Fevzi Çakmak", "Turgut Reis"] },
  { ilce: "Avcılar", mahalleler: ["Merkez", "Ambarlı", "Denizköşkler"] },
  { ilce: "Maltepe", mahalleler: ["Gülsuyu", "Başıbüyük", "Cevizli"] },
  { ilce: "Kartal", mahalleler: ["Yakacık", "Soğanlık", "Esentepe"] },
];

const CADDELER = ["Atatürk", "Cumhuriyet", "Barış", "Menekşe", "Gül", "Fatih", "İnönü", "Zafer"];

const MUTEAHHITLER = [
  { firmaAdi: "Öz Ufuk İnşaat A.Ş.", yetkiliKisi: "Ufuk Demirci", puan: 5, bolge: "Bahçelievler, Bağcılar, Küçükçekmece", tam: 24, dev: 3, daire: 1180, durum: "AKTIF", not: null as string | null },
  { firmaAdi: "Kılıçlar Yapı ve Taahhüt Ltd. Şti.", yetkiliKisi: "Serkan Kılıç", puan: 4, bolge: "Zeytinburnu, Esenler", tam: 11, dev: 2, daire: 460, durum: "AKTIF", not: null },
  { firmaAdi: "Marmara Kent İnşaat", yetkiliKisi: "Elif Yalçın", puan: 4, bolge: "Maltepe, Kartal, Pendik", tam: 17, dev: 4, daire: 890, durum: "AKTIF", not: null },
  { firmaAdi: "Deniz Grup Gayrimenkul", yetkiliKisi: "Tolga Deniz", puan: 3, bolge: "Avcılar, Küçükçekmece", tam: 8, dev: 1, daire: 310, durum: "AKTIF", not: null },
  { firmaAdi: "Anadolu Yaşam Konutları", yetkiliKisi: "Hakan Erbil", puan: 5, bolge: "Kartal, Maltepe, Ataşehir", tam: 31, dev: 5, daire: 1640, durum: "AKTIF", not: null },
  { firmaAdi: "Beyaz İnşaat Taahhüt", yetkiliKisi: "Nurcan Beyaz", puan: 3, bolge: "Bağcılar, Esenler", tam: 6, dev: 1, daire: 220, durum: "PASIF", not: "Bölgemizde şu an aktif projesi yok, iletişimde kalınıyor." },
  { firmaAdi: "Sancak Yapı Sanayi", yetkiliKisi: "Kerem Sancak", puan: 4, bolge: "Bahçelievler, Zeytinburnu", tam: 14, dev: 2, daire: 705, durum: "AKTIF", not: null },
  { firmaAdi: "Temel Kent Dönüşüm", yetkiliKisi: "Ramazan Temel", puan: 1, bolge: "Esenler", tam: 3, dev: 0, daire: 90, durum: "KARA_LISTE", not: "Önceki projede teslim gecikmesi ve malik şikayetleri nedeniyle çalışılmıyor." },
];

const AKTIVITE_BASLIKLARI = [
  "Malik bilgilendirme görüşmesi yapıldı",
  "Müteahhit ile ön görüşme",
  "Riskli yapı raporu maliklere iletildi",
  "Tapu müdürlüğü ile yazışma",
  "Kira yardımı başvuru evrakları toplandı",
  "Toplantı tutanağı imzalandı",
  "Belediye imar durumu sorgulandı",
];

const AKTIVITE_ICERIKLERI: (string | null)[] = [
  "Görüşmede süreç adımları ve takvim paylaşıldı.",
  "Talep edilen ek belgeler için süre verildi.",
  "Maliklerin metrekare beklentisi not alındı.",
  null,
];

const OLUMSUZ_NOTLARI = [
  "Metrekare artışı talep ediyor.",
  "Kira yardımı şartlarını yetersiz buluyor.",
  "Müteahhit seçimine itiraz ediyor.",
];

async function main() {
  console.log("Mevcut kayitlar temizleniyor...");
  await db.aktivite.deleteMany();
  await db.belge.deleteMany();
  await db.surecAdimi.deleteMany();
  await db.hisse.deleteMany();
  await db.bina.deleteMany();
  await db.malik.deleteMany();
  await db.muteahhit.deleteMany();
  await db.kullanici.deleteMany();

  /* ------------------------------------------------------------ Kullanicilar */
  const sifre = bcrypt.hashSync("Deneme1234", 10);
  const kullaniciTanimlari = [
    { ad: "Kerem Demir", email: "admin@kentselrota.test", rol: "ADMIN", telefon: "0532 000 00 01" },
    { ad: "Selin Aydın", email: "selin@kentselrota.test", rol: "DANISMAN", telefon: "0532 000 00 02" },
    { ad: "Barış Korkmaz", email: "baris@kentselrota.test", rol: "DANISMAN", telefon: "0532 000 00 03" },
    { ad: "Merve Tekin", email: "merve@kentselrota.test", rol: "DANISMAN", telefon: "0532 000 00 04" },
    { ad: "Cemal Bulut", email: "cemal@kentselrota.test", rol: "IZLEYICI", telefon: "0532 000 00 05" },
  ];

  const kullanicilar = [];
  for (const k of kullaniciTanimlari) {
    kullanicilar.push(
      await db.kullanici.create({
        data: { ...k, sifreHash: sifre, sonGiris: gunOnce(araliktaSayi(0, 6)) },
      }),
    );
  }
  const danismanlar = kullanicilar.filter((k) => k.rol !== "IZLEYICI");
  console.log(kullanicilar.length + " kullanici olusturuldu");

  /* ------------------------------------------------------------ Muteahhitler */
  const muteahhitler = [];
  for (const [i, m] of MUTEAHHITLER.entries()) {
    const slug = m.firmaAdi.toLowerCase().replace(/[^a-z]/g, "").slice(0, 12);
    muteahhitler.push(
      await db.muteahhit.create({
        data: {
          kod: "MTH-" + String(i + 1).padStart(3, "0"),
          firmaAdi: m.firmaAdi,
          yetkiliKisi: m.yetkiliKisi,
          telefon: `0212 ${araliktaSayi(200, 899)} ${araliktaSayi(10, 99)} ${araliktaSayi(10, 99)}`,
          email: "info@" + slug + ".com.tr",
          vergiDairesi: sec(["Bakırköy", "Merter", "Kadıköy", "Şişli", "Zeytinburnu"]),
          vergiNo: String(araliktaSayi(1000000000, 9999999999)),
          adres: sec(SEMTLER).ilce + " / İstanbul",
          websitesi: "https://www." + slug + ".com.tr",
          calismaBolgeleri: m.bolge,
          tamamlananProje: m.tam,
          devamEdenProje: m.dev,
          toplamDaire: m.daire,
          puan: m.puan,
          durum: m.durum,
          notlar: m.not,
        },
      }),
    );
  }
  console.log(muteahhitler.length + " muteahhit olusturuldu");
  const aktifMuteahhitler = muteahhitler.filter((m) => m.durum === "AKTIF");

  /* ------------------------------------------------------------------ Binalar */
  const binaTanimlari = [
    { asama: "ISKAN", risk: "RISKLI", durum: "TAMAMLANDI", muteahhit: true },
    { asama: "INSAAT", risk: "RISKLI", durum: "AKTIF", muteahhit: true },
    { asama: "YAPI_RUHSATI", risk: "RISKLI", durum: "AKTIF", muteahhit: true },
    { asama: "YIKIM", risk: "RISKLI", durum: "AKTIF", muteahhit: true },
    { asama: "TAHLIYE", risk: "RISKLI", durum: "AKTIF", muteahhit: true },
    { asama: "SOZLESME", risk: "RISKLI", durum: "AKTIF", muteahhit: true },
    { asama: "MUTEAHHIT_SECIMI", risk: "RISKLI", durum: "AKTIF", muteahhit: false },
    { asama: "COGUNLUK_KARARI", risk: "RISKLI", durum: "AKTIF", muteahhit: false },
    { asama: "MALIK_TOPLANTISI", risk: "RISKLI", durum: "AKTIF", muteahhit: false },
    { asama: "ITIRAZ_SURESI", risk: "ITIRAZ_SURECINDE", durum: "BEKLEMEDE", muteahhit: false },
    { asama: "TAPU_SERH", risk: "RISKLI", durum: "AKTIF", muteahhit: false },
    { asama: "TESCIL_ONAY", risk: "RISKLI", durum: "AKTIF", muteahhit: false },
    { asama: "RISKLI_YAPI_RAPORU", risk: "BASVURU_YAPILDI", durum: "AKTIF", muteahhit: false },
    { asama: "RISKLI_YAPI_BASVURU", risk: "BASVURU_YAPILDI", durum: "AKTIF", muteahhit: false },
    { asama: "ILK_GORUSME", risk: "TESPIT_EDILMEDI", durum: "AKTIF", muteahhit: false },
    { asama: "ILK_GORUSME", risk: "TESPIT_EDILMEDI", durum: "AKTIF", muteahhit: false },
    { asama: "RISKLI_YAPI_RAPORU", risk: "RISKSIZ", durum: "IPTAL", muteahhit: false },
    { asama: "MALIK_TOPLANTISI", risk: "RISKLI", durum: "BEKLEMEDE", muteahhit: false },
  ];

  let malikSayaci = 0;

  for (const [i, t] of binaTanimlari.entries()) {
    const semt = sec(SEMTLER);
    const mahalle = sec(semt.mahalleler);
    const ada = String(araliktaSayi(100, 3200));
    const parsel = String(araliktaSayi(1, 90));
    const bolumSayisi = araliktaSayi(6, 24);
    const yas = araliktaSayi(28, 55);

    const bina = await db.bina.create({
      data: {
        kod: "BNA-" + String(i + 1).padStart(4, "0"),
        baslik: `${mahalle} ${ada} Ada ${parsel} Parsel`,
        il: "İstanbul",
        ilce: semt.ilce,
        mahalle,
        ada,
        parsel,
        adres: `${mahalle} Mah. ${sec(CADDELER)} Cad. No:${araliktaSayi(1, 140)}, ${semt.ilce}/İstanbul`,
        katSayisi: araliktaSayi(3, 8),
        bagimsizBolumSayisi: bolumSayisi,
        yapimYili: new Date().getFullYear() - yas,
        arsaAlani: araliktaSayi(280, 1400),
        riskDurumu: t.risk,
        asama: t.asama,
        durum: t.durum,
        oncelik: sec(["NORMAL", "NORMAL", "YUKSEK", "DUSUK"]),
        danismanId: sec(danismanlar).id,
        muteahhitId: t.muteahhit ? sec(aktifMuteahhitler).id : null,
        notlar:
          t.durum === "IPTAL"
            ? "Yapılan tespitte bina riskli çıkmadı, dosya kapatıldı."
            : t.asama === "ILK_GORUSME"
              ? "Malikler bilgilendirme toplantısı için tarih bekleniyor."
              : null,
        olusturmaTarihi: gunOnce(araliktaSayi(30, 500)),
      },
    });

    /* Malikler ve hisseler */
    const paylar: number[] = [];
    for (let b = 0; b < bolumSayisi; b++) paylar.push(araliktaSayi(60, 160));
    const payToplami = paylar.reduce((a, b) => a + b, 0);

    // Ilerlemis binalarda onay orani yuksek, baslangictakilerde dusuk olsun
    const ilerleme = SUREC_SIRASI.indexOf(t.asama);
    const olumluIhtimal = t.durum === "IPTAL" ? 0.1 : Math.min(0.95, 0.25 + ilerleme * 0.06);

    for (let b = 0; b < bolumSayisi; b++) {
      malikSayaci++;
      const malik = await db.malik.create({
        data: {
          adSoyad: `${sec(ADLAR)} ${sec(SOYADLAR)}`,
          tip: rnd() < 0.08 ? "TUZEL" : "GERCEK",
          tcKimlik: String(araliktaSayi(10000000000, 79999999999)),
          telefon: `05${araliktaSayi(30, 59)} ${araliktaSayi(100, 999)} ${araliktaSayi(10, 99)} ${araliktaSayi(10, 99)}`,
          email: rnd() < 0.45 ? "malik" + malikSayaci + "@ornek.com" : null,
          adres: rnd() < 0.5 ? sec(SEMTLER).ilce + "/İstanbul" : null,
          olusturmaTarihi: bina.olusturmaTarihi,
        },
      });

      const r = rnd();
      const onayDurumu =
        r < olumluIhtimal
          ? "OLUMLU"
          : r < olumluIhtimal + 0.12
            ? "OLUMSUZ"
            : r < olumluIhtimal + 0.22
              ? "ULASILAMADI"
              : "BEKLIYOR";

      await db.hisse.create({
        data: {
          binaId: bina.id,
          malikId: malik.id,
          bagimsizBolumNo: String(b + 1),
          kullanimTuru: b === 0 && rnd() < 0.35 ? "ISYERI" : "MESKEN",
          arsaPayiPay: paylar[b],
          arsaPayiPayda: payToplami,
          hisseOrani: Number(((paylar[b] / payToplami) * 100).toFixed(3)),
          onayDurumu,
          onayTarihi:
            onayDurumu === "OLUMLU" || onayDurumu === "OLUMSUZ" ? gunOnce(araliktaSayi(5, 200)) : null,
          notlar: onayDurumu === "OLUMSUZ" ? sec(OLUMSUZ_NOTLARI) : null,
        },
      });
    }

    /* Surec adimlari */
    for (const [sira, adim] of SUREC_SIRASI.entries()) {
      const durum = sira < ilerleme ? "TAMAMLANDI" : sira === ilerleme ? "DEVAM" : "BEKLIYOR";
      await db.surecAdimi.create({
        data: {
          binaId: bina.id,
          adim,
          sira,
          durum,
          baslangicTarihi:
            durum === "BEKLIYOR" ? null : gunOnce(araliktaSayi(10, 400) + (ilerleme - sira) * 12),
          tamamlanmaTarihi:
            durum === "TAMAMLANDI" ? gunOnce(araliktaSayi(5, 380) + (ilerleme - sira) * 10) : null,
          hedefTarih: durum === "DEVAM" ? new Date(Date.now() + araliktaSayi(5, 60) * 86400000) : null,
          sorumluId: durum === "BEKLIYOR" ? null : bina.danismanId,
        },
      });
    }

    /* Aktiviteler */
    const aktiviteSayisi = araliktaSayi(2, 5);
    for (let a = 0; a < aktiviteSayisi; a++) {
      await db.aktivite.create({
        data: {
          tur: sec(["GORUSME", "TELEFON", "TOPLANTI", "NOT", "EPOSTA"]),
          baslik: sec(AKTIVITE_BASLIKLARI),
          icerik: sec(AKTIVITE_ICERIKLERI),
          tarih: gunOnce(araliktaSayi(1, 180)),
          kullaniciId: bina.danismanId!,
          binaId: bina.id,
        },
      });
    }
  }

  console.log(binaTanimlari.length + " bina, " + malikSayaci + " malik olusturuldu");

  /* Muteahhit aktiviteleri */
  for (const m of aktifMuteahhitler) {
    await db.aktivite.create({
      data: {
        tur: "TOPLANTI",
        baslik: m.firmaAdi + " ile portföy görüşmesi",
        icerik: "Firma referans projeleri ve mevcut kapasitesi değerlendirildi.",
        tarih: gunOnce(araliktaSayi(3, 120)),
        kullaniciId: sec(danismanlar).id,
        muteahhitId: m.id,
      },
    });
  }

  console.log("");
  console.log("Tamamlandi. Giris bilgileri:");
  console.log("  E-posta : admin@kentselrota.test");
  console.log("  Sifre   : Deneme1234");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
