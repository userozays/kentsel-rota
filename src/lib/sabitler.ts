// Kentsel donusum surecine ait sabit tanimlar ve etiketler.
// SQLite enum desteklemedigi icin tum durum alanlari String tutulur,
// gecerli degerler burada tanimlanir.

export type Secenek = {
  deger: string;
  etiket: string;
  renk: string; // Tabler renk adi: primary, success, warning, danger, info, secondary...
  aciklama?: string;
};

const haritaYap = (liste: Secenek[]) =>
  Object.fromEntries(liste.map((s) => [s.deger, s])) as Record<string, Secenek>;

/* ---------------------------------------------------------------- Roller */

export const ROLLER: Secenek[] = [
  { deger: "ADMIN", etiket: "Yönetici", renk: "red", aciklama: "Tüm yetkiler, kullanıcı yönetimi" },
  { deger: "DANISMAN", etiket: "Danışman", renk: "blue", aciklama: "Kayıt ekleme ve düzenleme" },
  { deger: "IZLEYICI", etiket: "İzleyici", renk: "secondary", aciklama: "Sadece görüntüleme" },
];
export const ROL = haritaYap(ROLLER);

export const yazabilir = (rol?: string | null) => rol === "ADMIN" || rol === "DANISMAN";
export const yoneticidir = (rol?: string | null) => rol === "ADMIN";

/* ------------------------------------------------- Bina - risk durumlari */

export const RISK_DURUMLARI: Secenek[] = [
  { deger: "TESPIT_EDILMEDI", etiket: "Tespit Yapılmadı", renk: "secondary" },
  { deger: "BASVURU_YAPILDI", etiket: "Başvuru Yapıldı", renk: "azure" },
  { deger: "ITIRAZ_SURECINDE", etiket: "İtiraz Sürecinde", renk: "orange" },
  { deger: "RISKLI", etiket: "Riskli Yapı", renk: "red" },
  { deger: "RISKSIZ", etiket: "Riskli Değil", renk: "green" },
];
export const RISK_DURUMU = haritaYap(RISK_DURUMLARI);

/* ------------------------------------------------------ Bina - is durumu */

export const BINA_DURUMLARI: Secenek[] = [
  { deger: "AKTIF", etiket: "Aktif", renk: "blue" },
  { deger: "BEKLEMEDE", etiket: "Beklemede", renk: "yellow" },
  { deger: "TAMAMLANDI", etiket: "Tamamlandı", renk: "green" },
  { deger: "IPTAL", etiket: "İptal", renk: "secondary" },
];
export const BINA_DURUMU = haritaYap(BINA_DURUMLARI);

export const ONCELIKLER: Secenek[] = [
  { deger: "DUSUK", etiket: "Düşük", renk: "secondary" },
  { deger: "NORMAL", etiket: "Normal", renk: "blue" },
  { deger: "YUKSEK", etiket: "Yüksek", renk: "red" },
];
export const ONCELIK = haritaYap(ONCELIKLER);

/* --------------------------------------------------------- Surec adimlari */
// 6306 sayili Kanun kapsamindaki tipik kentsel donusum akisi.
// Sirayi/adimlari kendi is akisiniza gore buradan degistirebilirsiniz.

export const SUREC_ADIMLARI: Secenek[] = [
  { deger: "ILK_GORUSME", etiket: "İlk Görüşme & Bilgilendirme", renk: "secondary", aciklama: "Maliklerle tanışma, süreç anlatımı" },
  { deger: "RISKLI_YAPI_BASVURU", etiket: "Riskli Yapı Tespit Başvurusu", renk: "azure", aciklama: "Lisanslı kuruluşa başvuru" },
  { deger: "RISKLI_YAPI_RAPORU", etiket: "Riskli Yapı Raporu", renk: "azure", aciklama: "Teknik rapor hazırlandı" },
  { deger: "TESCIL_ONAY", etiket: "Tescil / İdare Onayı", renk: "indigo", aciklama: "Belediye veya Bakanlık onayı" },
  { deger: "TAPU_SERH", etiket: "Tapuya Şerh İşlendi", renk: "indigo" },
  { deger: "ITIRAZ_SURESI", etiket: "İtiraz Süresi Tamamlandı", renk: "orange" },
  { deger: "MALIK_TOPLANTISI", etiket: "Malikler Toplantısı", renk: "purple" },
  { deger: "COGUNLUK_KARARI", etiket: "Çoğunluk Kararı Alındı", renk: "purple" },
  { deger: "MUTEAHHIT_SECIMI", etiket: "Müteahhit Seçimi", renk: "pink" },
  { deger: "SOZLESME", etiket: "Sözleşme İmzalandı", renk: "pink" },
  { deger: "TAHLIYE", etiket: "Tahliye Tamamlandı", renk: "yellow" },
  { deger: "YIKIM_RUHSATI", etiket: "Yıkım Ruhsatı", renk: "orange" },
  { deger: "YIKIM", etiket: "Yıkım Tamamlandı", renk: "orange" },
  { deger: "YAPI_RUHSATI", etiket: "Yapı Ruhsatı", renk: "teal" },
  { deger: "INSAAT", etiket: "İnşaat Süreci", renk: "cyan" },
  { deger: "ISKAN", etiket: "İskan (Yapı Kullanma İzni)", renk: "green" },
];
export const SUREC_ADIMI = haritaYap(SUREC_ADIMLARI);
export const SUREC_SIRASI = SUREC_ADIMLARI.map((a) => a.deger);

export const asamaSirasi = (adim: string) => {
  const i = SUREC_SIRASI.indexOf(adim);
  return i === -1 ? 0 : i;
};

/** Binanin genel ilerleme yuzdesi (0-100) */
export const asamaYuzdesi = (adim: string) =>
  Math.round(((asamaSirasi(adim) + 1) / SUREC_SIRASI.length) * 100);

export const ADIM_DURUMLARI: Secenek[] = [
  { deger: "BEKLIYOR", etiket: "Bekliyor", renk: "secondary" },
  { deger: "DEVAM", etiket: "Devam Ediyor", renk: "blue" },
  { deger: "TAMAMLANDI", etiket: "Tamamlandı", renk: "green" },
  { deger: "ATLANDI", etiket: "Atlandı", renk: "yellow" },
];
export const ADIM_DURUMU = haritaYap(ADIM_DURUMLARI);

/* ------------------------------------------------- Malik / hisse durumlari */

export const ONAY_DURUMLARI: Secenek[] = [
  { deger: "BEKLIYOR", etiket: "Bekliyor", renk: "secondary" },
  { deger: "OLUMLU", etiket: "Olumlu", renk: "green" },
  { deger: "OLUMSUZ", etiket: "Olumsuz", renk: "red" },
  { deger: "ULASILAMADI", etiket: "Ulaşılamadı", renk: "yellow" },
];
export const ONAY_DURUMU = haritaYap(ONAY_DURUMLARI);

export const MALIK_TIPLERI: Secenek[] = [
  { deger: "GERCEK", etiket: "Gerçek Kişi", renk: "blue" },
  { deger: "TUZEL", etiket: "Tüzel Kişi", renk: "purple" },
];
export const MALIK_TIPI = haritaYap(MALIK_TIPLERI);

export const KULLANIM_TURLERI: Secenek[] = [
  { deger: "MESKEN", etiket: "Mesken", renk: "blue" },
  { deger: "ISYERI", etiket: "İşyeri", renk: "orange" },
  { deger: "DEPO", etiket: "Depo / Eklenti", renk: "secondary" },
  { deger: "DIGER", etiket: "Diğer", renk: "secondary" },
];
export const KULLANIM_TURU = haritaYap(KULLANIM_TURLERI);

/**
 * Kentsel donusum karari icin gereken arsa payi esigi (yuzde).
 * 6306 sayili Kanun'da 2023 degisikligi sonrasi salt cogunluk (yaridan fazla) aranir.
 * Kendi uygulamaniza gore bu degeri degistirebilirsiniz (orn. 66.67).
 */
export const COGUNLUK_ESIGI = 50;

/* ----------------------------------------------------------- Muteahhitler */

export const MUTEAHHIT_DURUMLARI: Secenek[] = [
  { deger: "AKTIF", etiket: "Aktif", renk: "green" },
  { deger: "PASIF", etiket: "Pasif", renk: "secondary" },
  { deger: "KARA_LISTE", etiket: "Kara Liste", renk: "red" },
];
export const MUTEAHHIT_DURUMU = haritaYap(MUTEAHHIT_DURUMLARI);

/* ------------------------------------------------------------- Aktiviteler */

export const AKTIVITE_TURLERI: Secenek[] = [
  { deger: "NOT", etiket: "Not", renk: "secondary" },
  { deger: "GORUSME", etiket: "Görüşme", renk: "blue" },
  { deger: "TELEFON", etiket: "Telefon", renk: "azure" },
  { deger: "TOPLANTI", etiket: "Toplantı", renk: "purple" },
  { deger: "EPOSTA", etiket: "E-posta", renk: "teal" },
  { deger: "SISTEM", etiket: "Sistem", renk: "secondary" },
];
export const AKTIVITE_TURU = haritaYap(AKTIVITE_TURLERI);

/* ------------------------------------------------------------- Yardimcilar */

export const etiketBul = (harita: Record<string, Secenek>, deger?: string | null): Secenek =>
  (deger && harita[deger]) || { deger: deger ?? "", etiket: deger ?? "-", renk: "secondary" };

/* ------------------------------------------------------- Randevular / takvim */

export const RANDEVU_TURLERI: Secenek[] = [
  { deger: "TOPLANTI", etiket: "Malik Toplantısı", renk: "purple" },
  { deger: "GORUSME", etiket: "Görüşme", renk: "blue" },
  { deger: "NOTER", etiket: "Noter / İmza", renk: "indigo" },
  { deger: "TAHLIYE", etiket: "Tahliye", renk: "orange" },
  { deger: "SAHA", etiket: "Saha Ziyareti", renk: "teal" },
  { deger: "RESMI", etiket: "Resmî Kurum", renk: "cyan" },
  { deger: "DIGER", etiket: "Diğer", renk: "secondary" },
];
export const RANDEVU_TURU = haritaYap(RANDEVU_TURLERI);

export const RANDEVU_DURUMLARI: Secenek[] = [
  { deger: "PLANLANDI", etiket: "Planlandı", renk: "blue" },
  { deger: "TAMAMLANDI", etiket: "Tamamlandı", renk: "green" },
  { deger: "IPTAL", etiket: "İptal", renk: "secondary" },
];
export const RANDEVU_DURUMU = haritaYap(RANDEVU_DURUMLARI);

export const TAKVIM_GORUNUMLERI = [
  { deger: "ay", etiket: "Ay" },
  { deger: "hafta", etiket: "Hafta" },
  { deger: "gun", etiket: "Gün" },
] as const;

export type TakvimGorunumu = (typeof TAKVIM_GORUNUMLERI)[number]["deger"];

/* ---------------------------------------------------------------- Belgeler */

export const BELGE_KATEGORILERI: Secenek[] = [
  { deger: "TAPU", etiket: "Tapu / Takyidat", renk: "blue" },
  { deger: "RISKLI_RAPOR", etiket: "Riskli Yapı Raporu", renk: "red" },
  { deger: "SOZLESME", etiket: "Sözleşme", renk: "purple" },
  { deger: "KIMLIK", etiket: "Kimlik / Vekaletname", renk: "azure" },
  { deger: "TUTANAK", etiket: "Toplantı Tutanağı", renk: "teal" },
  { deger: "RUHSAT", etiket: "Ruhsat / İzin", renk: "green" },
  { deger: "PROJE", etiket: "Proje / Çizim", renk: "indigo" },
  { deger: "DIGER", etiket: "Diğer", renk: "secondary" },
];
export const BELGE_KATEGORISI = haritaYap(BELGE_KATEGORILERI);
