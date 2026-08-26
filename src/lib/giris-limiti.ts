import "server-only";

/**
 * Giriş denemesi sınırlama (kaba kuvvet koruması).
 *
 * Panel internete açık bir adreste duracağı için şifre denemesi sınırsız
 * olmamalı: `Deneme1234` gibi bir şifre saniyeler içinde bulunur. Sayaç
 * hem e-posta hem IP için tutuluyor — yalnızca e-posta olsa saldırgan
 * hesaplar arasında dolaşarak sınırı aşabilir, yalnızca IP olsa ortak
 * çıkışlı bir ofis tek kişinin hatası yüzünden kilitlenir.
 *
 * ÖNEMLİ: Sayaçlar süreç belleğinde. Uygulama tek Node sürecinde çalışmak
 * zorunda (README'deki tek instance kuralı canlı güncelleme için de geçerli).
 * Süreç yeniden başlarsa sayaçlar sıfırlanır — kabul edilebilir, çünkü
 * yeniden başlatma saldırganın elinde değil.
 */

const ESIK = 5; // kaçıncı başarısız denemeden sonra kilit
const PENCERE_MS = 15 * 60 * 1000; // bu süre boyunca hata görülmezse sayaç sıfırlanır

/** Üst üste kilitlerde süre artar; son değer tekrar eder. */
const KILIT_SURELERI_MS = [
  1 * 60 * 1000,
  5 * 60 * 1000,
  15 * 60 * 1000,
  60 * 60 * 1000,
];

type Kayit = {
  hata: number;
  sonHareket: number;
  kilitBitis: number;
  kilitSayisi: number;
};

const kure = globalThis as unknown as { krpGirisLimiti?: Map<string, Kayit> };
const kayitlar = (kure.krpGirisLimiti ??= new Map<string, Kayit>());

/** Bellekte sonsuza kadar büyümesin: her yazımda eskimiş kayıtları at. */
function budama(simdi: number) {
  if (kayitlar.size < 500) return;
  for (const [anahtar, k] of kayitlar) {
    if (k.kilitBitis < simdi && simdi - k.sonHareket > PENCERE_MS) kayitlar.delete(anahtar);
  }
}

/** Kilit varsa kalan süreyi saniye olarak döner, yoksa 0. */
export function kalanKilitSaniye(anahtarlar: string[]): number {
  const simdi = Date.now();
  let enUzun = 0;
  for (const a of anahtarlar) {
    const k = kayitlar.get(a);
    if (k && k.kilitBitis > simdi) {
      enUzun = Math.max(enUzun, Math.ceil((k.kilitBitis - simdi) / 1000));
    }
  }
  return enUzun;
}

export function basarisizDeneme(anahtarlar: string[]) {
  const simdi = Date.now();
  budama(simdi);

  for (const a of anahtarlar) {
    const k = kayitlar.get(a) ?? { hata: 0, sonHareket: simdi, kilitBitis: 0, kilitSayisi: 0 };

    // Pencere boyunca hata görülmediyse sayaç baştan başlar
    if (simdi - k.sonHareket > PENCERE_MS) k.hata = 0;

    k.hata += 1;
    k.sonHareket = simdi;

    if (k.hata >= ESIK) {
      const sure = KILIT_SURELERI_MS[Math.min(k.kilitSayisi, KILIT_SURELERI_MS.length - 1)];
      k.kilitBitis = simdi + sure;
      k.kilitSayisi += 1;
      k.hata = 0; // kilit açıldıktan sonra yeniden ESIK deneme hakkı
    }

    kayitlar.set(a, k);
  }
}

export function basariliDeneme(anahtarlar: string[]) {
  for (const a of anahtarlar) kayitlar.delete(a);
}
