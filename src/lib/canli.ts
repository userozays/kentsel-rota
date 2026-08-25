import "server-only";

/**
 * Canlı güncelleme yayını (SSE için bellek içi pub/sub).
 *
 * ÖNEMLİ: Dinleyiciler süreç belleğinde tutulduğu için uygulama TEK Node
 * sürecinde çalışmalıdır. PM2 cluster modu (-i max) kullanılırsa bir süreçteki
 * değişiklik diğerine ulaşmaz. README'deki tek instance kurulumu bu yüzdendir.
 */

type Dinleyici = (olayTuru: string) => void;

const kure = globalThis as unknown as { krpDinleyiciler?: Set<Dinleyici> };
const dinleyiciler = (kure.krpDinleyiciler ??= new Set<Dinleyici>());

export function canliDinle(dinleyici: Dinleyici): () => void {
  dinleyiciler.add(dinleyici);
  return () => {
    dinleyiciler.delete(dinleyici);
  };
}

/** Bir kayıt değiştiğinde açık takvimlerin tazelenmesi için haber verir. */
export function canliYayinla(olayTuru: string) {
  for (const d of dinleyiciler) {
    try {
      d(olayTuru);
    } catch {
      /* kopmuş bağlantı; temizliği route handler yapar */
    }
  }
}

export function dinleyiciSayisi() {
  return dinleyiciler.size;
}
