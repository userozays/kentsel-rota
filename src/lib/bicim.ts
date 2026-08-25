/** Sayı ve tarih biçimleme — sunucu ve istemcide aynı sonucu vermesi için sabit yerel. */

export function sayi(v: unknown): number {
  if (typeof v === "number") return Number.isFinite(v) ? v : 0;
  const x = parseFloat(String(v ?? "").replace(/\s/g, "").replace(",", "."));
  return Number.isFinite(x) ? x : 0;
}

const TR = "tr-TR";

export function tl(v: unknown): string {
  return sayi(v).toLocaleString(TR, { maximumFractionDigits: 2 });
}

export function para(v: unknown): string {
  return sayi(v).toLocaleString(TR, { maximumFractionDigits: 0 });
}

export function yuzde(v: unknown, basamak = 1): string {
  return sayi(v).toLocaleString(TR, {
    minimumFractionDigits: basamak,
    maximumFractionDigits: basamak,
  });
}

export function tarih(d: Date | string | null | undefined): string {
  if (!d) return "—";
  const x = typeof d === "string" ? new Date(d) : d;
  if (Number.isNaN(x.getTime())) return "—";
  return x.toLocaleDateString(TR, { day: "2-digit", month: "2-digit", year: "numeric" });
}

export function tarihSaat(d: Date | string | null | undefined): string {
  if (!d) return "—";
  const x = typeof d === "string" ? new Date(d) : d;
  if (Number.isNaN(x.getTime())) return "—";
  return (
    x.toLocaleDateString(TR, { day: "2-digit", month: "2-digit", year: "numeric" }) +
    " " +
    x.toLocaleTimeString(TR, { hour: "2-digit", minute: "2-digit" })
  );
}

export function bugun(): string {
  return new Date().toISOString().slice(0, 10);
}
