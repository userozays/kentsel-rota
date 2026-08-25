import type { z } from "zod";

/** Tüm form eylemlerinin ortak dönüş tipi. */
export type EylemDurumu = { hata?: string; basari?: string };

/** FormData'yı zod şemasıyla doğrular; hata varsa ilk mesajı döndürür. */
export function ayristir<T extends z.ZodTypeAny>(
  sema: T,
  form: FormData,
): { ok: true; veri: z.infer<T> } | { ok: false; hata: string } {
  const ham: Record<string, unknown> = {};
  for (const [k, v] of form.entries()) {
    if (k.endsWith("[]")) {
      const ad = k.slice(0, -2);
      (ham[ad] ??= [] as unknown[]);
      (ham[ad] as unknown[]).push(v);
    } else if (k in ham) {
      const mevcut = ham[k];
      ham[k] = Array.isArray(mevcut) ? [...(mevcut as unknown[]), v] : [mevcut, v];
    } else {
      ham[k] = v;
    }
  }
  const sonuc = sema.safeParse(ham);
  if (!sonuc.success) {
    const ilk = sonuc.error.issues[0];
    const alan = ilk?.path?.join(".") ?? "";
    return { ok: false, hata: alan ? `${alan}: ${ilk.message}` : (ilk?.message ?? "Geçersiz veri.") };
  }
  return { ok: true, veri: sonuc.data };
}

/** Onay kutusu: işaretliyse "on" gelir, değilse hiç gelmez. */
export function kutu(form: FormData, ad: string): boolean {
  const v = form.get(ad);
  return v === "on" || v === "true" || v === "1";
}

/** Hata mesajını kullanıcıya gösterilebilir metne çevirir. */
export function hataMetni(e: unknown): string {
  if (e instanceof Error) return e.message;
  return "Beklenmeyen bir hata oldu.";
}
