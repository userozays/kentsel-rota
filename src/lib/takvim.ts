/** Takvim ızgarası ve Türkçe tarih yardımcıları. Hafta pazartesi başlar. */

export const AY_ADLARI = [
  "Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran",
  "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık",
];

export const GUN_ADLARI = ["Pazartesi", "Salı", "Çarşamba", "Perşembe", "Cuma", "Cumartesi", "Pazar"];
export const GUN_KISA = ["Pzt", "Sal", "Çar", "Per", "Cum", "Cmt", "Paz"];

/** Pazartesi = 0, Pazar = 6 */
export function haftaninGunu(t: Date): number {
  return (t.getDay() + 6) % 7;
}

export function gunBasi(t: Date): Date {
  const d = new Date(t);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function gunSonu(t: Date): Date {
  const d = new Date(t);
  d.setHours(23, 59, 59, 999);
  return d;
}

export function gunEkle(t: Date, gun: number): Date {
  const d = new Date(t);
  d.setDate(d.getDate() + gun);
  return d;
}

export function ayEkle(t: Date, ay: number): Date {
  const d = new Date(t);
  d.setDate(1);
  d.setMonth(d.getMonth() + ay);
  return d;
}

export function haftaBasi(t: Date): Date {
  return gunBasi(gunEkle(t, -haftaninGunu(t)));
}

export function ayniGunMu(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
  );
}

export function bugunMu(t: Date): boolean {
  return ayniGunMu(t, new Date());
}

/** YYYY-MM-DD (yerel saat) — input[type=date] ve URL parametreleri için */
export function tarihAnahtari(t: Date): string {
  const ay = String(t.getMonth() + 1).padStart(2, "0");
  const gun = String(t.getDate()).padStart(2, "0");
  return `${t.getFullYear()}-${ay}-${gun}`;
}

/** YYYY-MM-DDTHH:mm — input[type=datetime-local] için */
export function tarihSaatAnahtari(t: Date): string {
  const saat = String(t.getHours()).padStart(2, "0");
  const dakika = String(t.getMinutes()).padStart(2, "0");
  return `${tarihAnahtari(t)}T${saat}:${dakika}`;
}

export function anahtardanTarih(anahtar?: string | null): Date {
  if (anahtar && /^\d{4}-\d{2}-\d{2}$/.test(anahtar)) {
    const [y, a, g] = anahtar.split("-").map(Number);
    const d = new Date(y, a - 1, g);
    if (!Number.isNaN(d.getTime())) return d;
  }
  return gunBasi(new Date());
}

export function saatMetni(t: Date): string {
  return `${String(t.getHours()).padStart(2, "0")}:${String(t.getMinutes()).padStart(2, "0")}`;
}

/** Ay görünümü için 6x7 = 42 günlük ızgara (önceki/sonraki ayın taşan günleriyle) */
export function ayIzgarasi(referans: Date): Date[] {
  const ilk = new Date(referans.getFullYear(), referans.getMonth(), 1);
  const baslangic = haftaBasi(ilk);
  return Array.from({ length: 42 }, (_, i) => gunEkle(baslangic, i));
}

export function haftaIzgarasi(referans: Date): Date[] {
  const baslangic = haftaBasi(referans);
  return Array.from({ length: 7 }, (_, i) => gunEkle(baslangic, i));
}

/** Görünüme göre sorgulanacak tarih aralığı */
export function gorunumAraligi(gorunum: string, referans: Date): { baslangic: Date; bitis: Date } {
  if (gorunum === "gun") {
    return { baslangic: gunBasi(referans), bitis: gunSonu(referans) };
  }
  if (gorunum === "hafta") {
    const g = haftaIzgarasi(referans);
    return { baslangic: gunBasi(g[0]), bitis: gunSonu(g[6]) };
  }
  const g = ayIzgarasi(referans);
  return { baslangic: gunBasi(g[0]), bitis: gunSonu(g[41]) };
}

export function baslikMetni(gorunum: string, referans: Date): string {
  if (gorunum === "gun") {
    return `${referans.getDate()} ${AY_ADLARI[referans.getMonth()]} ${referans.getFullYear()}, ${GUN_ADLARI[haftaninGunu(referans)]}`;
  }
  if (gorunum === "hafta") {
    const g = haftaIzgarasi(referans);
    const a = g[0];
    const b = g[6];
    if (a.getMonth() === b.getMonth()) {
      return `${a.getDate()}–${b.getDate()} ${AY_ADLARI[a.getMonth()]} ${a.getFullYear()}`;
    }
    return `${a.getDate()} ${AY_ADLARI[a.getMonth()]} – ${b.getDate()} ${AY_ADLARI[b.getMonth()]} ${b.getFullYear()}`;
  }
  return `${AY_ADLARI[referans.getMonth()]} ${referans.getFullYear()}`;
}

/** Görünüme göre önceki/sonraki tarihe kayar */
export function kaydir(gorunum: string, referans: Date, yon: number): Date {
  if (gorunum === "gun") return gunEkle(referans, yon);
  if (gorunum === "hafta") return gunEkle(referans, yon * 7);
  return ayEkle(referans, yon);
}
